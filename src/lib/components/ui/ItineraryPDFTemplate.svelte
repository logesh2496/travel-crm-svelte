<script lang="ts">
  let { 
    itinTitle,
    itheme,
    itinDest,
    istart,
    nights,
    itinDays,
    pax,
    finalCost
  } = $props<{
    itinTitle: string;
    itheme: string;
    itinDest: string;
    istart: string;
    nights: number;
    itinDays: any[];
    pax: number;
    finalCost: number;
  }>();
</script>

<div id="pdf-export-content">
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
