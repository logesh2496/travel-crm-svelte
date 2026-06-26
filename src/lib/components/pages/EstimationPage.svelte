<script lang="ts">
  import type { Lead } from '$lib/firebase/lead.db';

  let { leads = [], onAction } = $props<{
    leads: Lead[];
    onAction: (actionName: string, data?: any) => void;
  }>();

  let selectedLeadIndex = $state<string>('');
  let currentStep = $state<'setup' | 'loading' | 'results'>('setup');
  
  // Selection States
  let estFrom = $state('Chennai');
  let estTo = $state('');
  let estDate = $state('');
  let estPax = $state(2);
  let estNights = $state(5);

  // AI Loader States
  let currentThinkingStep = $state(0);
  let progressPct = $state(0);

  const thinkingSteps = [
    'Fetching live flight fares…',
    'Checking ground transport options…',
    'Comparing hotel rates & availability…',
    'Calculating sightseeing & activities…',
    'Pricing travel insurance…',
    'Applying GST & markup rules…',
    'Generating 3 pricing strategies…'
  ];

  const thinkingIcons = [
    'ti-plane',
    'ti-bus',
    'ti-building',
    'ti-camera',
    'ti-shield-check',
    'ti-receipt-tax',
    'ti-chart-arrows-vertical'
  ];

  const EST_DATA: Record<string, any> = {
    Maldives:   {flight:18000,hotel_n:12000,transport:4000,sight:6000,insurance:3500,tax:0.05},
    Dubai:      {flight:14000,hotel_n:8500, transport:5000,sight:8000,insurance:3000,tax:0.05},
    Europe:     {flight:55000,hotel_n:9000, transport:8000,sight:12000,insurance:6000,tax:0.05},
    Singapore:  {flight:12000,hotel_n:7000, transport:3500,sight:6000,insurance:2500,tax:0.05},
    Bali:       {flight:11000,hotel_n:5500, transport:3000,sight:5000,insurance:2500,tax:0.05},
    Thailand:   {flight:8500, hotel_n:4000, transport:2500,sight:4000,insurance:2000,tax:0.05},
    Mauritius:  {flight:22000,hotel_n:13000,transport:4500,sight:7000,insurance:4000,tax:0.05},
    Kashmir:    {flight:7000, hotel_n:4500, transport:3500,sight:3000,insurance:1800,tax:0.05},
    Andaman:    {flight:6000, hotel_n:4000, transport:3000,sight:3500,insurance:1800,tax:0.05},
    Switzerland:{flight:65000,hotel_n:11000,transport:9000,sight:14000,insurance:7000,tax:0.05},
    Australia:  {flight:55000,hotel_n:9500, transport:7000,sight:11000,insurance:6500,tax:0.05}
  };

  const PBADGE: Record<string, string> = {
    Normal: 'b-gray',
    High: 'b-amber',
    Urgent: 'b-red',
    Low: 'b-blue'
  };

  // Selected Lead Derived state
  let currentLead = $derived(
    selectedLeadIndex !== '' ? leads[+selectedLeadIndex] : null
  );

  function handleLeadChange() {
    if (!currentLead) {
      estTo = '';
      estDate = '';
      return;
    }
    estTo = currentLead.dest;
    estDate = currentLead.date;
    const bNum = parseInt(currentLead.budget.replace(/[^0-9]/g, '')) || 0;
    estPax = bNum > 300000 ? 4 : bNum > 150000 ? 3 : 2;
  }

  function startEstimation() {
    if (selectedLeadIndex === '') {
      onAction('toast', { msg: 'Please select a lead first', type: 'error' });
      return;
    }
    currentStep = 'loading';
    currentThinkingStep = 0;
    progressPct = 0;
    runEstThinking(0);
  }

  function runEstThinking(stepNum: number) {
    const total = thinkingSteps.length;
    if (stepNum < total) {
      currentThinkingStep = stepNum;
      progressPct = Math.round(((stepNum + 1) / total) * 90);
      const delays = [900, 700, 1100, 800, 600, 700, 900];
      setTimeout(() => runEstThinking(stepNum + 1), delays[stepNum] || 800);
    } else {
      currentThinkingStep = total;
      progressPct = 100;
      setTimeout(() => {
        currentStep = 'results';
      }, 500);
    }
  }

  // Estimation calculation helper
  function calcEst(base: any, pax: number, nights: number, markup: number, hotelFactor: number, flightFactor: number, sightFactor: number) {
    const f = (base.flight * flightFactor) * pax;
    const h = (base.hotel_n * hotelFactor) * nights * pax;
    const tr = base.transport * pax;
    const s = (base.sight * sightFactor) * pax;
    const ins = base.insurance * pax;
    const raw = f + h + tr + s + ins;
    const mkAmt = raw * markup;
    const subtotal = raw + mkAmt;
    const gst = subtotal * base.tax;
    return {
      flight: Math.round(f),
      hotel: Math.round(h),
      transport: Math.round(tr),
      sightseeing: Math.round(s),
      insurance: Math.round(ins),
      markup: Math.round(mkAmt),
      gst: Math.round(gst),
      total: Math.round(subtotal + gst),
      margin: Math.round(markup * 100)
    };
  }

  // Calculations states
  let profitable = $derived.by(() => {
    if (!currentLead) return null;
    const base = EST_DATA[estTo] || {flight:15000,hotel_n:8000,transport:4000,sight:6000,insurance:3000,tax:0.05};
    return calcEst(base, estPax, estNights, 0.28, 1.3, 1.1, 1.2);
  });

  let competitive = $derived.by(() => {
    if (!currentLead) return null;
    const base = EST_DATA[estTo] || {flight:15000,hotel_n:8000,transport:4000,sight:6000,insurance:3000,tax:0.05};
    return calcEst(base, estPax, estNights, 0.15, 0.9, 0.95, 0.9);
  });

  let budgetEst = $derived.by(() => {
    if (!currentLead) return null;
    const base = EST_DATA[estTo] || {flight:15000,hotel_n:8000,transport:4000,sight:6000,insurance:3000,tax:0.05};
    return calcEst(base, estPax, estNights, 0.18, 1.0, 1.0, 1.0);
  });

  let recommendedType = $derived.by(() => {
    if (!currentLead || !profitable || !competitive || !budgetEst) return 'budget';
    const budgetNum = parseInt(currentLead.budget.replace(/[^0-9]/g, '')) || 0;
    
    let type = 'budget';
    if (Math.abs(competitive.total - budgetNum) < Math.abs(budgetEst.total - budgetNum)) {
      type = 'competitive';
    }
    if (Math.abs(profitable.total - budgetNum) < Math.abs(budgetEst.total - budgetNum) && profitable.margin >= 25) {
      type = 'profitable';
    }
    return type;
  });

  let recoName = $derived(
    recommendedType === 'profitable' ? 'Most Profitable' : recommendedType === 'competitive' ? 'Most Competitive' : 'Close to Budget'
  );

  let budgetDiffInfo = $derived.by(() => {
    if (!currentLead || !budgetEst) return null;
    const budgetNum = parseInt(currentLead.budget.replace(/[^0-9]/g, '')) || 0;
    const diff = Math.abs(budgetEst.total - budgetNum);
    const pctDiff = Math.round((diff / budgetNum) * 100);
    return { diff, pctDiff };
  });

  function resetEstimation() {
    currentStep = 'setup';
    selectedLeadIndex = '';
    estTo = '';
    estDate = '';
  }
</script>

<div class="page active" id="page-estimation">
  <div class="ph">
    <div>
      <h2><i class="ti ti-calculator" style="color:var(--teal)"></i> Estimation Builder</h2>
      <div style="font-size:12px;color:var(--text2);margin-top:3px">AI-powered pricing — select a lead and generate smart estimates instantly</div>
    </div>
  </div>

  {#if currentStep === 'setup'}
    <!-- STEP 1: LEAD + ROUTE SELECTION -->
    <div class="card" id="estSetupCard">
      <div class="card-title"><i class="ti ti-user-search"></i>Step 1 — Select Lead & Route</div>
      <div class="fgrid3" style="align-items:end;gap:16px">
        <div class="fg">
          <label for="estLead">Select Lead</label>
          <select id="estLead" bind:value={selectedLeadIndex} onchange={handleLeadChange}>
            <option value="">— Choose a Lead —</option>
            {#each leads as q, idx}
              <option value={idx.toString()}>{q.id || 'LD'} · {q.name} · {q.dest} · {q.budget}</option>
            {/each}
          </select>
        </div>
        <div class="fg">
          <label for="estFrom">Departure City (From)</label>
          <select id="estFrom" bind:value={estFrom}>
            <option>Chennai</option><option>Mumbai</option><option>Delhi</option>
            <option>Bengaluru</option><option>Hyderabad</option><option>Kolkata</option>
            <option>Ahmedabad</option><option>Kochi</option><option>Pune</option>
          </select>
        </div>
        <div class="fg">
          <label for="estTo">Destination (To)</label>
          <input type="text" id="estTo" bind:value={estTo} placeholder="e.g. Maldives, Dubai, Bali…" readonly style="background:var(--bg2)">
        </div>
        <div class="fg">
          <label for="estDate">Travel Date</label>
          <input type="date" id="estDate" bind:value={estDate}>
        </div>
        <div class="fg">
          <label for="estPax">No. of Pax</label>
          <input type="number" id="estPax" bind:value={estPax} min="1" max="20">
        </div>
        <div class="fg">
          <label for="estNights">No. of Nights</label>
          <input type="number" id="estNights" bind:value={estNights} min="1" max="30">
        </div>
      </div>
      
      {#if currentLead}
        <!-- Lead Info Strip -->
        <div id="estLeadInfo" style="margin-top:14px;padding:12px 16px;background:var(--teal-light);border-radius:var(--radius);border:1px solid #b2e0da">
          <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">LEAD</span><div style="font-size:13px;font-weight:700" id="estLeadName">{currentLead.name}</div></div>
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">PHONE</span><div style="font-size:13px" id="estLeadPhone">{currentLead.phone}</div></div>
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">DESTINATION</span><div style="font-size:13px;font-weight:600" id="estLeadDest">{currentLead.dest}</div></div>
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">BUDGET</span><div style="font-size:13px;font-weight:700;color:var(--teal-text)" id="estLeadBudget">{currentLead.budget}</div></div>
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">TRAVEL DATE</span><div style="font-size:13px" id="estLeadDate">{currentLead.date}</div></div>
            <div><span style="font-size:11px;color:var(--teal-text);font-weight:700">PRIORITY</span><div id="estLeadPri"><span class="badge {PBADGE[currentLead.pri] || 'b-gray'}">{currentLead.pri}</span></div></div>
            <div style="margin-left:auto">
              <button class="btn btn-gold" onclick={startEstimation} id="estGenerateBtn" type="button"><i class="ti ti-sparkles"></i> Generate AI Estimates</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else if currentStep === 'loading'}
    <!-- AI THINKING LOADER -->
    <div id="estLoader">
      <div class="card" style="padding:32px 24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,var(--navy),var(--teal));border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;animation:estPulse 1.5s infinite">
            <i class="ti ti-brain" style="font-size:26px;color:#fff"></i>
          </div>
          <div style="font-size:16px;font-weight:700;color:var(--text)" id="estLoaderTitle">AI is building your estimates…</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px" id="estLoaderSub">Analysing market rates and supplier data</div>
        </div>
        
        <!-- Thinking Steps -->
        <div style="max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:10px" id="estThinkSteps">
          {#each thinkingSteps as tText, i}
            <div class="est-think-step" class:active={currentThinkingStep === i} class:done={currentThinkingStep > i}>
              <i class="ti {thinkingIcons[i]}"></i> {tText}
            </div>
          {/each}
        </div>
        
        <!-- Progress Bar -->
        <div style="max-width:560px;margin:20px auto 0;background:var(--bg2);border-radius:20px;height:6px;overflow:hidden">
          <div id="estProgressBar" style="height:100%;background:linear-gradient(90deg,var(--teal),var(--gold));border-radius:20px;width:{progressPct}%;transition:width .4s ease"></div>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--text3)" id="estProgressPct">{progressPct}%</div>
      </div>
    </div>
  {:else if currentStep === 'results' && currentLead && profitable && competitive && budgetEst}
    <!-- RESULTS: 3 ESTIMATION CARDS -->
    <div id="estResults">
      <!-- Summary Strip -->
      <div class="card card-sm" style="background:var(--navy);color:#fff;border-color:var(--navy)">
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
          <div><div style="font-size:10px;opacity:.5;font-weight:700;text-transform:uppercase">Lead</div><div style="font-weight:700" id="estSumLead">{currentLead.name} ({currentLead.id || 'TEMP'})</div></div>
          <div><div style="font-size:10px;opacity:.5;font-weight:700;text-transform:uppercase">Route</div><div id="estSumRoute">{estFrom} → {estTo}</div></div>
          <div><div style="font-size:10px;opacity:.5;font-weight:700;text-transform:uppercase">Pax</div><div id="estSumPax">{estPax} pax</div></div>
          <div><div style="font-size:10px;opacity:.5;font-weight:700;text-transform:uppercase">Nights</div><div id="estSumNights">{estNights} nights</div></div>
          <div><div style="font-size:10px;opacity:.5;font-weight:700;text-transform:uppercase">Client Budget</div><div style="color:var(--gold);font-weight:700" id="estSumBudget">{currentLead.budget}</div></div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="btn btn-sm" style="color:#fff;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.08)" onclick={resetEstimation} type="button">
              <i class="ti ti-refresh"></i> New Estimate
            </button>
            <button class="btn btn-gold btn-sm" onclick={() => onAction('toast', { msg: 'Estimates saved as draft quotation!', type: 'success' })} type="button">
              <i class="ti ti-file-plus"></i> Save as Quote
            </button>
          </div>
        </div>
      </div>

      <!-- 3 Cards Grid -->
      <div class="g3" id="estCardsGrid" style="align-items:start">
        <!-- Card 1: Profitable -->
        <div class="est-card profitable" class:recommended={recommendedType === 'profitable'}>
          <div class="est-card-header">
            <div class="est-card-badge"><i class="ti ti-coin"></i>💰 Most Profitable</div>
            <div class="est-card-price">₹{profitable.total.toLocaleString('en-IN')}</div>
            <div class="est-card-ppax">₹{Math.round(profitable.total/estPax).toLocaleString('en-IN')} per person</div>
            <div class="est-card-tagline">Premium experience · maximum margin · luxury positioning</div>
          </div>
          <div class="est-card-body">
            <div class="est-line"><span class="est-line-label"><i class="ti ti-plane"></i>Flights</span><span class="est-line-val">₹{profitable.flight.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-building"></i>Hotel ({estNights}N)</span><span class="est-line-val">₹{profitable.hotel.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-bus"></i>Transfers</span><span class="est-line-val">₹{profitable.transport.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-camera"></i>Sightseeing</span><span class="est-line-val">₹{profitable.sightseeing.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-shield-check"></i>Insurance</span><span class="est-line-val">₹{profitable.insurance.toLocaleString('en-IN')}</span></div>
            <div class="est-line" style="border-top:1.5px dashed var(--border2);margin-top:4px;padding-top:10px">
              <span class="est-line-label" style="font-weight:700;color:var(--text)"><i class="ti ti-percentage"></i>Markup ({profitable.margin}%)</span>
              <span class="est-line-val" style="color:var(--success-text)">₹{profitable.markup.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line">
              <span class="est-line-label"><i class="ti ti-receipt-tax"></i>GST (5%)</span>
              <span class="est-line-val" style="color:var(--warning-text)">₹{profitable.gst.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line" style="background:var(--bg);margin:4px -4px;padding:8px 4px;border-radius:var(--radius)">
              <span style="font-size:13px;font-weight:700;color:var(--text)">TOTAL</span>
              <span style="font-size:15px;font-weight:800;color:var(--text)">₹{profitable.total.toLocaleString('en-IN')}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
              <span class="est-margin-pill" style="background:var(--success-light);color:var(--success-text)">
                <i class="ti ti-trending-up"></i>Margin: {profitable.margin}%
              </span>
              <span style="font-size:10px;color:var(--text3)">🔥 High Profit</span>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text2);padding:8px;background:var(--bg);border-radius:var(--radius)">Best for high-intent leads with flexible budget</div>
          </div>
          <div class="est-card-footer">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick={() => onAction('toast', { msg: 'Most Profitable quote created!', type: 'success' })} type="button">
              <i class="ti ti-file-plus"></i> Create Quote
            </button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Copied to clipboard!', type: 'success' })} title="Share" type="button"><i class="ti ti-share"></i></button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Sending on WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp" style="color:#16a34a"></i></button>
          </div>
        </div>

        <!-- Card 2: Competitive -->
        <div class="est-card competitive" class:recommended={recommendedType === 'competitive'}>
          <div class="est-card-header">
            <div class="est-card-badge"><i class="ti ti-bolt"></i>⚡ Most Competitive</div>
            <div class="est-card-price">₹{competitive.total.toLocaleString('en-IN')}</div>
            <div class="est-card-ppax">₹{Math.round(competitive.total/estPax).toLocaleString('en-IN')} per person</div>
            <div class="est-card-tagline">Market-leading price · edge over competition · volume play</div>
          </div>
          <div class="est-card-body">
            <div class="est-line"><span class="est-line-label"><i class="ti ti-plane"></i>Flights</span><span class="est-line-val">₹{competitive.flight.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-building"></i>Hotel ({estNights}N)</span><span class="est-line-val">₹{competitive.hotel.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-bus"></i>Transfers</span><span class="est-line-val">₹{competitive.transport.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-camera"></i>Sightseeing</span><span class="est-line-val">₹{competitive.sightseeing.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-shield-check"></i>Insurance</span><span class="est-line-val">₹{competitive.insurance.toLocaleString('en-IN')}</span></div>
            <div class="est-line" style="border-top:1.5px dashed var(--border2);margin-top:4px;padding-top:10px">
              <span class="est-line-label" style="font-weight:700;color:var(--text)"><i class="ti ti-percentage"></i>Markup ({competitive.margin}%)</span>
              <span class="est-line-val" style="color:var(--success-text)">₹{competitive.markup.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line">
              <span class="est-line-label"><i class="ti ti-receipt-tax"></i>GST (5%)</span>
              <span class="est-line-val" style="color:var(--warning-text)">₹{competitive.gst.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line" style="background:var(--bg);margin:4px -4px;padding:8px 4px;border-radius:var(--radius)">
              <span style="font-size:13px;font-weight:700;color:var(--text)">TOTAL</span>
              <span style="font-size:15px;font-weight:800;color:var(--text)">₹{competitive.total.toLocaleString('en-IN')}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
              <span class="est-margin-pill" style="background:var(--blue-light);color:var(--blue-text)">
                <i class="ti ti-trending-up"></i>Margin: {competitive.margin}%
              </span>
              <span style="font-size:10px;color:var(--text3)">💡 Optimal Profit</span>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text2);padding:8px;background:var(--bg);border-radius:var(--radius)">Ideal for price-sensitive or comparison-shopping clients</div>
          </div>
          <div class="est-card-footer">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick={() => onAction('toast', { msg: 'Most Competitive quote created!', type: 'success' })} type="button">
              <i class="ti ti-file-plus"></i> Create Quote
            </button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Copied to clipboard!', type: 'success' })} title="Share" type="button"><i class="ti ti-share"></i></button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Sending on WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp" style="color:#16a34a"></i></button>
          </div>
        </div>

        <!-- Card 3: Budget Close -->
        <div class="est-card budget" class:recommended={recommendedType === 'budget'}>
          <div class="est-card-header">
            <div class="est-card-badge"><i class="ti ti-target"></i>🎯 Close to Budget</div>
            <div class="est-card-price">₹{budgetEst.total.toLocaleString('en-IN')}</div>
            <div class="est-card-ppax">₹{Math.round(budgetEst.total/estPax).toLocaleString('en-IN')} per person</div>
            <div class="est-card-tagline">Aligned with client budget · balanced margin · easy close</div>
          </div>
          <div class="est-card-body">
            <div class="est-line"><span class="est-line-label"><i class="ti ti-plane"></i>Flights</span><span class="est-line-val">₹{budgetEst.flight.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-building"></i>Hotel ({estNights}N)</span><span class="est-line-val">₹{budgetEst.hotel.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-bus"></i>Transfers</span><span class="est-line-val">₹{budgetEst.transport.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-camera"></i>Sightseeing</span><span class="est-line-val">₹{budgetEst.sightseeing.toLocaleString('en-IN')}</span></div>
            <div class="est-line"><span class="est-line-label"><i class="ti ti-shield-check"></i>Insurance</span><span class="est-line-val">₹{budgetEst.insurance.toLocaleString('en-IN')}</span></div>
            <div class="est-line" style="border-top:1.5px dashed var(--border2);margin-top:4px;padding-top:10px">
              <span class="est-line-label" style="font-weight:700;color:var(--text)"><i class="ti ti-percentage"></i>Markup ({budgetEst.margin}%)</span>
              <span class="est-line-val" style="color:var(--success-text)">₹{budgetEst.markup.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line">
              <span class="est-line-label"><i class="ti ti-receipt-tax"></i>GST (5%)</span>
              <span class="est-line-val" style="color:var(--warning-text)">₹{budgetEst.gst.toLocaleString('en-IN')}</span>
            </div>
            <div class="est-line" style="background:var(--bg);margin:4px -4px;padding:8px 4px;border-radius:var(--radius)">
              <span style="font-size:13px;font-weight:700;color:var(--text)">TOTAL</span>
              <span style="font-size:15px;font-weight:800;color:var(--text)">₹{budgetEst.total.toLocaleString('en-IN')}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
              <span class="est-margin-pill" style="background:var(--warning-light);color:var(--warning-text)">
                <i class="ti ti-trending-up"></i>Margin: {budgetEst.margin}%
              </span>
              <span style="font-size:10px;color:var(--text3)">💡 Optimal Profit</span>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text2);padding:8px;background:var(--bg);border-radius:var(--radius)">Recommended for quick conversion & strong trust-building</div>
          </div>
          <div class="est-card-footer">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick={() => onAction('toast', { msg: 'Close to Budget quote created!', type: 'success' })} type="button">
              <i class="ti ti-file-plus"></i> Create Quote
            </button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Copied to clipboard!', type: 'success' })} title="Share" type="button"><i class="ti ti-share"></i></button>
            <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Sending on WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp" style="color:#16a34a"></i></button>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="card">
        <div class="card-title"><i class="ti ti-table"></i>Side-by-Side Comparison</div>
        <div class="table-wrap">
          <table id="estCompareTable">
            <thead>
              <tr>
                <th>Component</th>
                <th style="color:var(--gold)">💰 Most Profitable</th>
                <th style="color:var(--blue-text)">⚡ Most Competitive</th>
                <th style="color:var(--success-text)">🎯 Close to Budget</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">✈️ Flights</td>
                <td style="color:var(--warning-text)">₹{profitable.flight.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.flight.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.flight.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">🏨 Hotel</td>
                <td style="color:var(--warning-text)">₹{profitable.hotel.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.hotel.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.hotel.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">🚌 Transfers</td>
                <td style="color:var(--warning-text)">₹{profitable.transport.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.transport.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.transport.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">🎒 Sightseeing</td>
                <td style="color:var(--warning-text)">₹{profitable.sightseeing.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.sightseeing.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.sightseeing.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">🛡️ Insurance</td>
                <td style="color:var(--warning-text)">₹{profitable.insurance.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.insurance.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.insurance.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">📈 Markup</td>
                <td style="color:var(--warning-text)">₹{profitable.markup.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.markup.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.markup.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">🏛️ GST</td>
                <td style="color:var(--warning-text)">₹{profitable.gst.toLocaleString('en-IN')}</td>
                <td style="color:var(--blue-text)">₹{competitive.gst.toLocaleString('en-IN')}</td>
                <td style="color:var(--success-text)">₹{budgetEst.gst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">💳 TOTAL</td>
                <td style="font-weight:800;font-size:14px;color:var(--warning-text)">₹{profitable.total.toLocaleString('en-IN')}</td>
                <td style="font-weight:800;font-size:14px;color:var(--blue-text)">₹{competitive.total.toLocaleString('en-IN')}</td>
                <td style="font-weight:800;font-size:14px;color:var(--success-text)">₹{budgetEst.total.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td class="td-strong">📊 Margin %</td>
                <td>{profitable.margin}%</td>
                <td>{competitive.margin}%</td>
                <td>{budgetEst.margin}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- AI Recommendation -->
      <div class="card" id="estAiReco" style="background:linear-gradient(135deg,var(--purple-light),var(--blue-light));border-color:#c4b5fd">
        <div class="card-title" style="color:var(--purple-text)"><i class="ti ti-sparkles"></i>AI Recommendation</div>
        <div id="estRecoText" style="font-size:13px;color:var(--text);line-height:1.7">
          <p>Based on <strong>{currentLead.name}</strong>'s budget of <strong>{currentLead.budget}</strong> and the <strong>{estTo}</strong> route from <strong>{estFrom}</strong>,
          the AI recommends the <strong style="color:var(--purple-text)">{recoName}</strong> estimate as the best strategy.</p>
          {#if budgetDiffInfo}
            <p style="margin-top:8px">The Close to Budget option lands within <strong>{budgetDiffInfo.pctDiff}%</strong> of the client's stated budget, maximising conversion probability.
            The Most Profitable option yields a <strong>{profitable.margin}% margin</strong> and is ideal if the client shows premium intent.
            The Most Competitive option undercuts market rates by approximately <strong>10–12%</strong>, suited for clients actively comparing agencies.</p>
          {/if}
          <p style="margin-top:8px;color:var(--text2);font-size:12px">💡 Tip: Lead priority is <strong>{currentLead.pri}</strong> — {currentLead.pri==='Urgent'||currentLead.pri==='High'?'move fast with the Close to Budget option to secure the booking quickly.':'nurture with the Close to Budget or Most Profitable pitch and allow the client time to decide.'}</p>
        </div>
      </div>
    </div>
  {/if}
</div>
