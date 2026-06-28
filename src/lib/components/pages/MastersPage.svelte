<script lang="ts">
  import MasterForm from './MasterForm.svelte';
  import DestinationMaster from './DestinationMaster.svelte';

  // Dummy agency ID for now to support multi-tenancy as requested
  const agencyId = 'AGENCY_001';

  let activeMasterTab = $state('destination');

  const masterCategories = [
    { id: 'destination', name: 'Destination', icon: 'ti ti-map-pin' },
    { id: 'meal_plan', name: 'Meal Plan', icon: 'ti ti-meat' },
    { id: 'room_type', name: 'Room Type', icon: 'ti ti-bed' },
    { id: 'amenities', name: 'Amenities', icon: 'ti ti-wifi' },
    { id: 'hotel', name: 'Hotel', icon: 'ti ti-building-skyscraper' },
    { id: 'guide', name: 'Guide', icon: 'ti ti-user-scan' },
    { id: 'driver', name: 'Driver', icon: 'ti ti-steering-wheel' },
    { id: 'vehicle', name: 'Vehicle', icon: 'ti ti-car' },
    { id: 'ferry_class', name: 'Ferry Class', icon: 'ti ti-ship' },
    { id: 'transfer', name: 'Transfer', icon: 'ti ti-bus' },
    { id: 'sightseeing', name: 'Sightseeing', icon: 'ti ti-camera' },
    { id: 'visa', name: 'Visa', icon: 'ti ti-id' },
    { id: 'location', name: 'Location', icon: 'ti ti-map-2' },
    { id: 'restaurants_type', name: 'Restaurants Type', icon: 'ti ti-tools-kitchen-2' },
    { id: 'restaurants', name: 'Restaurants', icon: 'ti ti-tools-kitchen-2' },
    { id: 'travel_insurance', name: 'Travel Insurance', icon: 'ti ti-shield-check' },
    { id: 'itinerary', name: 'Itinerary', icon: 'ti ti-calendar-event' },
    { id: 'arrival_departure', name: 'Arrival Departure', icon: 'ti ti-plane-arrival' },
    { id: 'lead_source', name: 'Lead Source', icon: 'ti ti-user-plus' },
    { id: 'expense_type', name: 'Expense Type', icon: 'ti ti-receipt' },
    { id: 'banks', name: 'Banks', icon: 'ti ti-building-bank' },
    { id: 'my_documents', name: 'My Documents', icon: 'ti ti-file' },
    { id: 'fixed_departure', name: 'Fixed Departure', icon: 'ti ti-calendar-time' },
    { id: 'market', name: 'Market', icon: 'ti ti-shopping-cart' },
    { id: 'guest_document_list', name: 'Guest Document List', icon: 'ti ti-files' },
    { id: 'feedback_type', name: 'Feedback Type', icon: 'ti ti-message-report' },
    { id: 'query_type', name: 'Query Type', icon: 'ti ti-help' }
  ];

  let selectedCategoryName = $derived(masterCategories.find(c => c.id === activeMasterTab)?.name || '');
</script>

<div class="page active" id="page-masters">
  <div class="ph"><h2>Master Management</h2></div>
  
  <div class="masters-grid">
    {#each masterCategories as cat}
      <button class="master-card" class:active={activeMasterTab === cat.id} onclick={() => activeMasterTab = cat.id}>
        <i class={cat.icon}></i>
        <span>{cat.name}</span>
      </button>
    {/each}
  </div>

  <div class="master-content">
    {#if activeMasterTab === 'destination'}
      <DestinationMaster {agencyId} />
    {:else if activeMasterTab === 'hotel'}
      <div class="ph" style="padding-bottom: 12px; border-bottom: 1px solid var(--border);">
        <h3>{selectedCategoryName} Management</h3>
        <button class="btn btn-primary btn-sm"><i class="ti ti-plus"></i> Add New</button>
      </div>
      <div id="master-hotel" style="margin-top: 14px;">
        <table class="cost-table" style="width: 100%;">
          <thead>
            <tr><th>Hotel Name</th><th>Destination</th><th>Category</th><th>Base Tariff</th></tr>
          </thead>
          <tbody>
            <tr><td class="td-strong">Anantara Kihavah</td><td>Maldives</td><td><span class="badge b-gold">5-Star Luxury</span></td><td>₹38,000/night</td></tr>
          </tbody>
        </table>
      </div>
    {:else if activeMasterTab === 'currency'}
      <div id="master-currency" style="margin-top: 14px;">
        <div class="g3">
          <div class="card card-sm"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:700">USD → INR</div><div style="font-size:11px;color:var(--text2)">US Dollar</div></div><div style="font-size:22px;font-weight:700;color:var(--teal)">83.42</div></div></div>
          <div class="card card-sm"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:700">AED → INR</div><div style="font-size:11px;color:var(--text2)">UAE Dirham</div></div><div style="font-size:22px;font-weight:700;color:var(--teal)">22.71</div></div></div>
        </div>
      </div>
    {:else}
      <MasterForm {agencyId} type={activeMasterTab} typeName={selectedCategoryName} />
    {/if}
  </div>
</div>

<style>
  .masters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .master-card {
    background: var(--bg);
    border: none;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--text);
    text-align: left;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
  }
  .master-card:hover {
    background: var(--bg2);
  }
  .master-card.active {
    background: var(--teal);
    color: white;
  }
  .master-card i {
    font-size: 18px;
    color: var(--text2);
    width: 20px;
    text-align: center;
  }
  .master-card:hover i {
    color: var(--teal);
  }
  .master-card.active i {
    color: white;
  }
  .master-content {
    background: var(--bg);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    padding: 20px;
    margin-top: 24px;
    border: 1px solid var(--border);
  }
  .master-content .ph {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .master-content .ph h3 {
    margin: 0;
    font-size: 16px;
  }
</style>
