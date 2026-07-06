<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Lead } from '$lib/firebase/lead.db';
  import { createItinerary, fetchItineraryByLeadId } from '$lib/firebase/itinerary.db';
  import { createPackage, fetchPackages, type PackageTemplate } from '$lib/firebase/package.db';
  import { fetchAgencySettings } from '$lib/firebase/settings.db';
  import { page } from '$app/stores';

  let { leads = [], onNavigate, onAction } = $props<{
    leads: Lead[];
    onNavigate: (page: string, data?: any) => void;
    onAction: (actionName: string, data?: any) => void;
  }>();

  // --- Lead & Trip State ---
  let selectedLeadId = $state('');
  let currentItineraryId = $state<string | undefined>(undefined);
  let itinTitle = $state('');
  let itinDest = $state('');
  let istart = $state('');
  let iend = $state('');
  let iadults = $state(1);
  let ichildren = $state(0);
  let itheme = $state('');

  let currentLead = $derived(leads.find((l: Lead) => l.leadId === selectedLeadId));

  $effect(() => {
    const leadParam = $page.url.searchParams.get('lead');
    if (leadParam && selectedLeadId === '') {
      selectedLeadId = leadParam;
      
      // Remove URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('lead');
      window.history.replaceState({}, '', newUrl);
    }
  });

  $effect(() => {
    if (currentLead) {
      loadItineraryForLead(currentLead.leadId);
    }
  });

  async function loadItineraryForLead(leadId: string) {
    try {
      const existingItin = await fetchItineraryByLeadId(leadId);
      if (existingItin) {
        untrack(() => {
          currentItineraryId = existingItin.id;
          itinTitle = existingItin.title || '';
          itinDest = existingItin.destination || '';
          istart = existingItin.startDate || '';
          iend = existingItin.endDate || '';
          iadults = existingItin.adults || 1;
          ichildren = existingItin.children || 0;
          itheme = existingItin.theme || defaultTheme;
          itinDays = existingItin.days ? existingItin.days.map(d => ({title: d.title, activities: d.activities.map((a: any) => typeof a === 'string' ? { text: a, time: '' } : { ...a })})) : [];
          customChipInputs = itinDays.map(() => '');
          if (existingItin.costing) {
            profitMarginPct = existingItin.costing.profitMarginPct ?? 15;
            gstPct = existingItin.costing.gstPct ?? 5;
            discount = existingItin.costing.discount ?? 0;
            manualOverride = existingItin.costing.manualOverride ?? false;
            if (manualOverride) {
              qF = existingItin.costing.qF ?? 0;
              qH = existingItin.costing.qH ?? 0;
              qT = existingItin.costing.qT ?? 0;
              qS = existingItin.costing.qS ?? 0;
              qI = existingItin.costing.qI ?? 0;
            }
          } else {
            manualOverride = false;
          }
        });
      } else {
        untrack(() => {
          currentItineraryId = undefined;
          itinTitle = currentLead?.dest ? `${currentLead.dest} Trip` : '';
          itinDest = currentLead?.dest || '';
          istart = currentLead?.date || '';
          
          if (currentLead?.date) {
            const d = new Date(currentLead.date);
            if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + 5);
              iend = d.toISOString().split('T')[0];
            }
          }
          iadults = 2;
          ichildren = 0;
          itheme = defaultTheme;
          manualOverride = false;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --- Itinerary State ---
  let itinDays = $state<{ title: string; activities: any[] }[]>([]);

  let customChipInputs = $state<string[]>([]);
  let activeDropdownIndex = $state<number | null>(null);
  let suggestions = $state<any[]>([]);
  let suggestionLoading = $state(false);
  let autocompleteTimeout: ReturnType<typeof setTimeout> | null = null;

  async function fetchSuggestions(query: string) {
    if (!query || query.length < 2) {
      suggestions = [];
      return;
    }
    suggestionLoading = true;
    try {
      const res = await fetch(`https://suggest.latlng.work/autosuggest?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Api-Key': 'latlng_suu95lb4ezyw9mdqctsr5idgvc9bmpr0'
        }
      });
      const data = await res.json();
      suggestions = data.suggestions || [];
    } catch (e) {
      console.error(e);
      suggestions = [];
    } finally {
      suggestionLoading = false;
    }
  }

  function handleInput(e: Event, dayIndex: number) {
    const target = e.target as HTMLInputElement;
    const val = target.value;
    customChipInputs[dayIndex] = val;
    activeDropdownIndex = dayIndex;
    
    if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
    autocompleteTimeout = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  }

  function addSuggestion(dayIndex: number, suggestion: any) {
    const locationParts = [suggestion.city, suggestion.region, suggestion.country].filter(Boolean);
    itinDays[dayIndex].activities.push({
      text: suggestion.name,
      location: locationParts.join(', '),
      category: suggestion.category,
      type: suggestion.type,
      time: ''
    });
    itinDays = [...itinDays];
    customChipInputs[dayIndex] = '';
    suggestions = [];
    activeDropdownIndex = null;
  }

  $effect(() => {
    if (istart && iend) {
      const start = new Date(istart);
      const end = new Date(iend);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
        const targetDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
        
        untrack(() => {
          if (targetDays > itinDays.length) {
            const daysToAdd = targetDays - itinDays.length;
            for (let i = 0; i < daysToAdd; i++) {
              itinDays.push({
                title: `Day ${itinDays.length + 1} — Title`,
                activities: []
              });
              customChipInputs.push('');
            }
          } else if (targetDays < itinDays.length && targetDays > 0) {
            itinDays = itinDays.slice(0, targetDays);
            customChipInputs = customChipInputs.slice(0, targetDays);
          }
        });
      }
    }
  });

  let packages = $state<PackageTemplate[]>([]);
  let itinTemplate = $state('');
  let defaultTheme = $state('');

  onMount(async () => {
    try {
      packages = await fetchPackages();
      const settings = await fetchAgencySettings();
      if (settings?.agencyName) {
        defaultTheme = `Travel planned by ${settings.agencyName}`;
        if (!itheme) itheme = defaultTheme;
      }
    } catch (err) {
      console.error(err);
    }
  });

  function loadItinTemplate(val: string) {
    if (!val) return;
    const pkg = packages.find(p => p.id === val);
    if (pkg) {
      itinDays = pkg.days.map(d => ({ title: d.title, activities: d.activities.map((a: any) => typeof a === 'string' ? { text: a, time: '' } : { ...a }) }));
      customChipInputs = itinDays.map(() => '');
      itinTitle = pkg.title;
      itinDest = pkg.destination;
      itheme = pkg.theme;
    }
  }

  function addItinDay() {
    itinDays.push({
      title: `Day ${itinDays.length + 1} — Title`,
      activities: []
    });
    customChipInputs.push('');
  }

  function removeItinDay(index: number) {
    itinDays = itinDays.filter((_, idx) => idx !== index);
    customChipInputs = customChipInputs.filter((_, idx) => idx !== index);
  }

  async function saveItinerary() {
    try {
      const data = {
        id: currentItineraryId,
        leadId: selectedLeadId,
        title: itinTitle,
        destination: itinDest,
        startDate: istart,
        endDate: iend,
        adults: iadults,
        children: ichildren,
        theme: itheme,
        days: $state.snapshot(itinDays),
        costing: { baseCost, profitMarginPct, profitMarginAmt, gstPct, gstAmt, discount, finalCost, qF, qH, qT, qS, qI, manualOverride }
      };
      const savedId = await createItinerary(data);
      currentItineraryId = savedId;
      onAction('toast', { msg: 'Itinerary saved!', type: 'success' });
    } catch (err) {
      console.error(err);
      onAction('toast', { msg: 'Failed to save itinerary', type: 'error' });
    }
  }



  // --- Costing Engine ---
  // We use the days to determine nights.
  let nights = $derived(Math.max(itinDays.length - 1, 1));
  let pax = $derived(iadults + ichildren);

  const EST_DATA: Record<string, any> = {
    Maldives:   {flight:18000,hotel_n:12000,transport:4000,sight:6000,insurance:3500},
    Dubai:      {flight:14000,hotel_n:8500, transport:5000,sight:8000,insurance:3000},
    Europe:     {flight:55000,hotel_n:9000, transport:8000,sight:12000,insurance:6000},
    Singapore:  {flight:12000,hotel_n:7000, transport:3500,sight:6000,insurance:2500},
    Bali:       {flight:11000,hotel_n:5500, transport:3000,sight:5000,insurance:2500},
    Thailand:   {flight:8500, hotel_n:4000, transport:2500,sight:4000,insurance:2000},
    Mauritius:  {flight:22000,hotel_n:13000,transport:4500,sight:7000,insurance:4000},
    Kashmir:    {flight:7000, hotel_n:4500, transport:3500,sight:3000,insurance:1800},
    Andaman:    {flight:6000, hotel_n:4000, transport:3000,sight:3500,insurance:1800},
    Switzerland:{flight:65000,hotel_n:11000,transport:9000,sight:14000,insurance:7000},
    Australia:  {flight:55000,hotel_n:9500, transport:7000,sight:11000,insurance:6500}
  };

  let qF = $state(0);
  let qH = $state(0);
  let qT = $state(0);
  let qS = $state(0);
  let qI = $state(0);
  let manualOverride = $state(false);

  $effect(() => {
    if (!manualOverride) {
      const base = EST_DATA[itinDest] || {flight:15000,hotel_n:8000,transport:4000,sight:6000,insurance:3000};
      qF = base.flight * pax;
      qH = base.hotel_n * nights * pax;
      qT = base.transport * pax;
      qS = base.sight * pax;
      qI = base.insurance * pax;
    }
  });

  let baseCost = $derived(qF + qH + qT + qS + qI);
  let profitMarginPct = $state(15);
  let gstPct = $state(5);
  let discount = $state(0);

  // Actual Cost + Profit Margin = Selling Price
  let profitMarginAmt = $derived(baseCost * (profitMarginPct / 100));
  let subtotal = $derived(baseCost + profitMarginAmt);
  let gstAmt = $derived(subtotal * (gstPct / 100));
  let finalCost = $derived(subtotal + gstAmt - discount);

  // --- UI Tabs ---
  let activeTab = $state('builder'); // builder, costing, pdf

  function handleManualChange() {
    manualOverride = true;
  }
</script>

<div class="page active" id="page-itineraries">
  <div class="ph">
    <h2>Itinerary Builder</h2>
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
      <div><i class="ti ti-info-circle"></i>Trip Details</div>
      <div style="display: flex; gap: 8px;">
        <button class="btn {activeTab === 'builder' ? 'btn-primary' : 'btn-sm'}" onclick={() => activeTab = 'builder'} type="button"><i class="ti ti-map-2"></i>Build Itinerary</button>
        <button class="btn {activeTab === 'costing' ? 'btn-primary' : 'btn-sm'}" onclick={() => activeTab = 'costing'} type="button"><i class="ti ti-calculator"></i>Costing Engine</button>
        <button class="btn {activeTab === 'pdf' ? 'btn-teal' : 'btn-sm'}" onclick={() => activeTab = 'pdf'} type="button"><i class="ti ti-file-text"></i>PDF Preview</button>
      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 14px;">
      <div class="fg" style="flex: 1 1 200px;">
        <label for="ilead">Select Lead</label>
        <select id="ilead" bind:value={selectedLeadId}>
          <option value="">-- Manual Entry --</option>
          {#each leads as lead}
            <option value={lead.leadId}>{lead.name} ({lead.dest})</option>
          {/each}
        </select>
      </div>
      <div class="fg" style="flex: 1 1 180px;"><label for="ititle">Trip Title</label><input id="ititle" bind:value={itinTitle}></div>
      <div class="fg" style="flex: 1 1 150px;"><label for="idest">Destination</label><input id="idest" bind:value={itinDest}></div>
      <div class="fg" style="flex: 0 1 130px;"><label for="istart">Start Date</label><input type="date" id="istart" bind:value={istart}></div>
      <div class="fg" style="flex: 0 1 130px;"><label for="iend">End Date</label><input type="date" id="iend" bind:value={iend}></div>
      <div class="fg" style="flex: 0 1 80px;"><label for="iadults">Adults</label><input type="number" id="iadults" bind:value={iadults} min="1"></div>
      <div class="fg" style="flex: 0 1 80px;"><label for="ichildren">Children</label><input type="number" id="ichildren" bind:value={ichildren} min="0"></div>
      <div class="fg" style="flex: 1 1 100%;"><label for="itheme">Theme / Tag Line</label><input id="itheme" bind:value={itheme}></div>
    </div>
  </div>

  {#if activeTab === 'builder'}
    <div class="g21">
      <div>

        <div id="itinDays">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
            <h3 style="margin:0; font-size: 15px; font-weight: 600;">Day-by-Day Plan</h3>
            <button class="btn btn-primary btn-xs" onclick={addItinDay} type="button"><i class="ti ti-plus"></i>Add Day</button>
          </div>
          {#each itinDays as day, i}
            <div class="itin-day" id="iday-{i+1}" style="margin-bottom:8px; position:relative; z-index:{activeDropdownIndex === i ? 50 : 1}; overflow:visible;">
              <div class="itin-day-header" style="display:flex; align-items:center; background:var(--navy); padding:8px 12px; border-radius:var(--radius) var(--radius) 0 0;">
                <span style="background:var(--gold);color:var(--navy);border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">D{i+1}</span>
                <input bind:value={day.title} style="background:none;border:none;color:#fff;font-size:13px;font-weight:600;flex:1;outline:none;margin-left:8px">
                <button onclick={() => removeItinDay(i)} style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px" type="button">✕</button>
              </div>
              <div class="itin-day-body" style="background:var(--bg2); padding:12px; border-radius:0 0 var(--radius) var(--radius); border: 1px solid var(--border); border-top: none;">
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 12px;">
                  {#each day.activities as act, aIndex}
                    <div style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:var(--radius); display:flex; align-items:center; gap:12px;">
                      <input type="time" bind:value={act.time} style="background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:6px 10px; font-size:13px; color:var(--text); width: 110px; outline:none;">
                      
                      <div style="flex:1;">
                        <div style="font-weight: 600; font-size: 14px; color:var(--text);">{typeof act === 'string' ? act : act.text}</div>
                        {#if typeof act === 'object' && (act.location || act.category)}
                          <div style="font-size: 11px; color: var(--text2); margin-top:2px;">
                            {act.type === 'place' ? '📍' : '🏢'} <span style="text-transform: capitalize;">{act.category}</span> • {act.location}
                          </div>
                        {/if}
                      </div>

                      <button type="button" style="background:none; border:none; color:var(--text3); cursor:pointer; padding:4px; font-size:16px; border-radius:var(--radius);" onclick={() => { day.activities.splice(aIndex, 1); itinDays = [...itinDays]; }}>
                        <i class="ti ti-trash"></i>
                      </button>
                    </div>

                    {#if aIndex < day.activities.length - 1}
                      <div style="display:flex; justify-content:center; margin:-6px 0; position:relative; z-index:2;">
                        <div style="background:var(--card); border:1px solid var(--border); border-radius:16px; padding:2px 8px; font-size:14px; display:flex; gap:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                          {#each [{val: 'walk', icon: 'walk'}, {val: 'cab', icon: 'car'}, {val: 'train', icon: 'train'}, {val: 'flight', icon: 'plane'}] as t}
                            <button 
                              type="button" 
                              style="background:none; border:none; cursor:pointer; padding:2px; color:{act.transitToNext === t.val ? 'var(--teal)' : 'var(--text3)'}; transform: {act.transitToNext === t.val ? 'scale(1.1)' : 'scale(1)'}; transition: all 0.2s;"
                              onclick={() => { act.transitToNext = act.transitToNext === t.val ? null : t.val; itinDays = [...itinDays]; }}
                              title={t.val}
                            >
                              <i class="ti ti-{t.icon}"></i>
                            </button>
                          {/each}
                        </div>
                      </div>
                    {/if}

                  {/each}
                </div>
                
                <div style="position: relative;">
                  <div style="display:flex; gap:8px;">
                    <input type="text" placeholder="Search for places, hotels, sightseeing by real names..." style="flex:1; border:none; border-bottom:1px solid var(--border); background:none; font-size:13px; color:var(--text); outline:none; padding:4px 0;" bind:value={customChipInputs[i]} oninput={(e) => handleInput(e, i)} onblur={() => setTimeout(() => activeDropdownIndex = null, 200)} onkeydown={(e) => { if (e.key === 'Enter' && customChipInputs[i].trim()) { day.activities.push({ text: customChipInputs[i].trim(), time: '' }); customChipInputs[i] = ''; itinDays = [...itinDays]; e.preventDefault(); activeDropdownIndex = null; } }}>
                    <button type="button" class="btn btn-xs" onclick={() => { if (customChipInputs[i]?.trim()) { day.activities.push({ text: customChipInputs[i].trim(), time: '' }); customChipInputs[i] = ''; itinDays = [...itinDays]; activeDropdownIndex = null; } }}>Add</button>
                  </div>
                  {#if activeDropdownIndex === i && suggestions.length > 0}
                    <div style="position: absolute; top: 100%; left: 0; right: 0; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; max-height: 200px; overflow-y: auto; margin-top: 4px;">
                      {#each suggestions as sug}
                        <button type="button" style="display:block; width:100%; text-align:left; padding: 8px 12px; background:none; border:none; border-bottom: 1px solid var(--border2); cursor: pointer; font-size: 13px; color: var(--text);" onmousedown={() => addSuggestion(i, sug)}>
                          <div style="font-weight: 600;">{sug.name}</div>
                          <div style="font-size: 11px; color: var(--text2);">{sug.type === 'place' ? '📍' : '🏢'} {sug.category} • {[sug.city, sug.region, sug.country].filter(Boolean).join(', ')}</div>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div>
        <div class="card card-sm" style="margin-bottom:14px">
          <div class="card-title"><i class="ti ti-template"></i>Templates</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <select style="padding:8px 12px;border:1.5px solid var(--border2);border-radius:var(--radius);font-size:13px" bind:value={itinTemplate} onchange={() => loadItinTemplate(itinTemplate)}>
              <option value="">Select Package</option>
              {#each packages as pkg}
                <option value={pkg.id}>{pkg.title}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="card" style="margin-bottom:14px; position:sticky; top: 10px;">
          <div class="card-title"><i class="ti ti-eye"></i>Live Summary</div>
          <div style="background:linear-gradient(135deg,var(--navy),var(--teal));color:#fff;border-radius:var(--radius-lg);padding:16px;margin-bottom:12px">
            <div style="font-size:16px;font-weight:700">{itinTitle}</div>
            <div style="font-size:12px;opacity:.7;margin-top:4px">{istart} – {iend} · {itinDest}</div>
            <div style="font-size:12px;opacity:.7;margin-top:4px">{nights} Nights / {itinDays.length} Days · {iadults} Adults, {ichildren} Children</div>
          </div>
          <div style="font-size:13px;color:var(--text2)">
            {#if itinDays.length === 0}
              <span style="color:var(--text3)">Add days to see preview…</span>
            {:else}
              {#each itinDays as day, i}
                <div style="border-left:3px solid var(--teal);padding:6px 12px;margin-bottom:8px">
                  <div style="font-weight:600;font-size:12px;color:var(--teal)">Day {i+1}</div>
                  <div style="font-weight:600;font-size:13px; color:var(--text)">{day.title}</div>
                  <div style="font-size:12px;color:var(--text2); display:flex; flex-wrap:wrap; align-items:center; gap:4px;">
                    {#each day.activities as act, aIndex}
                      <span>{typeof act === 'string' ? act : (act.time ? `${act.time} - ${act.text}` : act.text)}</span>
                      {#if aIndex < day.activities.length - 1}
                        <span style="color:var(--text3); font-size: 14px; margin: 0 2px;">
                          {#if act.transitToNext === 'walk'}<i class="ti ti-walk"></i>
                          {:else if act.transitToNext === 'cab'}<i class="ti ti-car"></i>
                          {:else if act.transitToNext === 'train'}<i class="ti ti-train"></i>
                          {:else if act.transitToNext === 'flight'}<i class="ti ti-plane"></i>
                          {:else}·{/if}
                        </span>
                      {/if}
                    {/each}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-teal btn-sm" style="flex: 1;" onclick={saveItinerary} type="button"><i class="ti ti-device-floppy"></i>Save Itinerary</button>
            <button class="btn btn-primary" style="flex: 1;" onclick={() => activeTab = 'costing'} type="button">Next: Costing Engine <i class="ti ti-arrow-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'costing'}
    <div class="g2">
      <div class="card">
        <div class="card-title"><i class="ti ti-calculator"></i>Cost Calculation</div>
        <div style="margin-bottom: 16px; font-size: 13px; color: var(--text2);">
          Costs are auto-calculated based on <strong>{itinDest}</strong> for <strong>{nights} nights</strong> and <strong>{pax} Pax</strong>. Edit below to override.
        </div>
        <div class="fgrid">
          <div class="fg"><label for="qf">Flight Cost</label><input type="number" id="qf" bind:value={qF} oninput={handleManualChange}></div>
          <div class="fg"><label for="qh">Hotel Cost</label><input type="number" id="qh" bind:value={qH} oninput={handleManualChange}></div>
          <div class="fg"><label for="qt">Transfers</label><input type="number" id="qt" bind:value={qT} oninput={handleManualChange}></div>
          <div class="fg"><label for="qs">Sightseeing</label><input type="number" id="qs" bind:value={qS} oninput={handleManualChange}></div>
          <div class="fg"><label for="qi">Insurance & Visa</label><input type="number" id="qi" bind:value={qI} oninput={handleManualChange}></div>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
          <div class="fgrid">
            <div class="fg"><label for="qmk">Profit Margin (%)</label><input type="number" id="qmk" bind:value={profitMarginPct}></div>
            <div class="fg"><label for="qgst">GST (%)</label><input type="number" id="qgst" bind:value={gstPct}></div>
            <div class="fg"><label for="qd">Special Discount (₹)</label><input type="number" id="qd" bind:value={discount}></div>
          </div>
        </div>
      </div>

      <div class="card" style="display:flex; flex-direction:column; justify-content:center;">
        <div style="background:var(--bg2); border-radius:var(--radius-lg); padding:24px; text-align:center; border: 1px solid var(--border);">
          <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">Actual Base Cost</div>
          <div style="font-size:24px; font-weight:700; color:var(--text); margin-bottom:24px">₹{Math.round(baseCost).toLocaleString('en-IN')}</div>

          <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;">
            <span>Profit Margin ({profitMarginPct}%)</span>
            <span style="color:var(--text); font-weight:600">+ ₹{Math.round(profitMarginAmt).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;">
            <span>Subtotal</span>
            <span style="color:var(--text); font-weight:600">₹{Math.round(subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;">
            <span>GST ({gstPct}%)</span>
            <span style="color:var(--text); font-weight:600">+ ₹{Math.round(gstAmt).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:16px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
            <span>Discount</span>
            <span style="color:var(--red); font-weight:600">- ₹{discount.toLocaleString('en-IN')}</span>
          </div>

          <div style="font-size:12px; color:var(--teal); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; font-weight:700">Final Selling Price</div>
          <div style="font-size:36px; font-weight:800; color:var(--navy); margin-bottom:8px">₹{Math.round(finalCost).toLocaleString('en-IN')}</div>
          <div style="font-size:12px; color:var(--text2);">Total for {pax} Pax</div>
          
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button class="btn btn-teal btn-sm" style="flex: 1;" onclick={saveItinerary} type="button"><i class="ti ti-device-floppy"></i>Save Itinerary</button>
            <button class="btn btn-primary" style="flex: 1;" onclick={() => activeTab = 'pdf'} type="button">Generate Customer PDF <i class="ti ti-file-text"></i></button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'pdf'}
    <div style="display:flex; justify-content:center;">
      <div style="width: 100%; max-width: 800px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <div>
            <div style="font-weight: 600; font-size: 14px;">PDF Actions</div>
            <div style="font-size: 12px; color: var(--text2);">The customer will not see your itemized base costs or profit margin.</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary btn-sm" onclick={saveItinerary} type="button"><i class="ti ti-device-floppy"></i>Save Itinerary</button>
            <button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'PDF Downloaded!', type: 'success' })} type="button"><i class="ti ti-download"></i>Download PDF</button>
            <button class="btn btn-wa btn-sm" onclick={() => onAction('toast', { msg: 'Opening WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp"></i>Send via WhatsApp</button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Emailed successfully!', type: 'success' })} type="button"><i class="ti ti-mail"></i>Email PDF</button>
          </div>
        </div>

        <!-- PDF Page 1: Overview -->
        <div style="background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow:hidden; margin-bottom: 24px;">
          <!-- Header -->
          <div style="background: var(--navy); color: #fff; padding: 40px; text-align:center;">
            <i class="ti ti-plane-tilt" style="font-size:48px; color:var(--gold); margin-bottom: 16px; display:inline-block;"></i>
            <div style="font-size:28px; font-weight:800; margin-bottom:8px; letter-spacing: -0.5px;">{itinTitle}</div>
            <div style="font-size:16px; color: var(--gold); font-weight: 500;">{itheme}</div>
          </div>
          
          <div style="padding: 40px;">
            <!-- Key Details -->
            <div style="display:flex; justify-content:space-between; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 2px dashed var(--border);">
              <div>
                <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Destination</div>
                <div style="font-size:18px; font-weight:700; color:var(--text)">{itinDest}</div>
              </div>
              <div>
                <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Start Date</div>
                <div style="font-size:18px; font-weight:700; color:var(--text)">{istart}</div>
              </div>
              <div>
                <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Duration</div>
                <div style="font-size:18px; font-weight:700; color:var(--text)">{nights} Nights / {itinDays.length} Days</div>
              </div>
              <div>
                <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Travellers</div>
                <div style="font-size:18px; font-weight:700; color:var(--text)">{pax} Pax</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Trip ID</div>
                <div style="font-size:18px; font-weight:700; color:var(--text)">TB-24-{Math.floor(Math.random() * 900) + 100}</div>
              </div>
            </div>

            <!-- Cost Summary -->
            <div style="background: var(--bg2); border-radius: var(--radius-lg); padding: 32px; text-align:center;">
              <div style="font-size:14px; color:var(--text2); text-transform:uppercase; letter-spacing:2px; margin-bottom:8px">Total Package Cost</div>
              <div style="font-size:48px; font-weight:800; color:var(--teal); margin-bottom:8px">₹{Math.round(finalCost).toLocaleString('en-IN')}</div>
              <div style="font-size:14px; color:var(--text2);">Inclusive of all taxes and fees for {pax} Travellers</div>
            </div>

            <!-- T&C -->
            <div style="margin-top: 40px; font-size:12px; color:var(--text2); line-height:1.6;">
              <strong style="color:var(--text); font-size:13px; display:block; margin-bottom:8px;">Terms & Conditions</strong>
              Prices are subject to availability at the time of booking. 50% advance required to confirm the package. Balance payment must be completed 30 days prior to departure. Standard cancellation policies apply. This quotation is valid for 7 days from the date of issue.
            </div>
          </div>
        </div>

        <!-- PDF Page 2: Itinerary -->
        <div style="background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow:hidden; padding: 40px;">
          <div style="font-size:24px; font-weight:800; margin-bottom: 32px; color:var(--navy); border-bottom: 2px solid var(--border); padding-bottom: 16px;">Day-by-Day Itinerary</div>
          
          <div class="timeline" style="margin-left: 10px;">
            {#each itinDays as day, i}
              <div class="tl-item" style="padding-bottom: 32px; position:relative;">
                <div class="tl-dot" style="background:var(--teal); border: 4px solid #fff; width: 16px; height: 16px; left: -8px;"></div>
                {#if i !== itinDays.length - 1}
                  <div class="tl-line" style="background:var(--border2); left: -1px; top: 16px;"></div>
                {/if}
                <div style="margin-left: 24px;">
                  <div style="font-size:13px; font-weight:700; color:var(--teal); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Day {i+1}</div>
                  <div style="font-size:18px; font-weight:700; color:var(--text); margin-bottom:8px">{day.title}</div>
                  <div style="font-size:14px; color:var(--text2); line-height: 1.6;">
                    <ul style="margin:0; padding-left:20px; list-style-type: none;">
                      {#each day.activities as act, aIndex}
                        <li style="margin-bottom: 8px; position: relative;">
                          <div style="position: absolute; left: -20px; color: var(--teal); top: 2px;">•</div>
                          {#if typeof act === 'object' && act.time}
                            <strong style="color:var(--navy);">{act.time}</strong> - 
                          {/if}
                          {typeof act === 'string' ? act : act.text}
                          {#if typeof act === 'object' && act.location}
                            <span style="font-size:12px; color:var(--text3); margin-left: 4px;">({act.location})</span>
                          {/if}
                          
                          {#if aIndex < day.activities.length - 1 && typeof act === 'object' && act.transitToNext}
                            <div style="font-size:12px; color:var(--teal); margin-top:4px; display:flex; align-items:center; gap:4px;">
                              <i class="ti ti-arrow-down"></i> Travel by <span style="text-transform: capitalize; font-weight: 600;">{act.transitToNext}</span>
                            </div>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>
    </div>
  {/if}
</div>

<style>
  .timeline {
    position: relative;
    padding-left: 20px;
  }
  .tl-item {
    position: relative;
  }
  .tl-dot {
    position: absolute;
    border-radius: 50%;
  }
  .tl-line {
    position: absolute;
    width: 2px;
    height: 100%;
  }
</style>
