<script lang="ts">
  import { updateBooking, type Booking } from '$lib/firebase/booking.db';

  let { booking, onClose, onAction } = $props<{
    booking: Booking;
    onClose: () => void;
    onAction: (actionName: string, data?: any) => void;
  }>();

  let activeTab = $state('overview');
  let isSaving = $state(false);

  // Keep a local reactive copy to edit
  let currentBooking = $state<Booking>(JSON.parse(JSON.stringify(booking)));

  // Ensure arrays exist
  if (!currentBooking.flights) currentBooking.flights = [];
  if (!currentBooking.hotels) currentBooking.hotels = [];
  if (!currentBooking.busesTrains) currentBooking.busesTrains = [];
  if (!currentBooking.sightseeing) currentBooking.sightseeing = [];
  if (!currentBooking.visas) currentBooking.visas = [];
  if (!currentBooking.insurance) currentBooking.insurance = [];
  if (!currentBooking.documents) currentBooking.documents = [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary & Services' },
    { id: 'operations', label: 'Operations' },
    { id: 'documents', label: 'Documents' },
  ];

  async function saveChanges() {
    isSaving = true;
    try {
      if (currentBooking.id) {
        // Recalculate balance
        currentBooking.balanceAmount = (currentBooking.totalAmount || 0) - (currentBooking.paidAmount || 0);

        await updateBooking(currentBooking.id, currentBooking);
        onAction('toast', { msg: 'Booking updated successfully', type: 'success' });
        // We do not close automatically, user can keep editing
      }
    } catch (err) {
      console.error(err);
      onAction('toast', { msg: 'Failed to update booking', type: 'error' });
    } finally {
      isSaving = false;
    }
  }

  // Helpers to add array items
  function addFlight() {
    currentBooking.flights!.push({ id: crypto.randomUUID(), airline: '', flightNumber: '', departure: '', arrival: '', date: '', pnr: '', status: 'Pending' });
  }
  function addHotel() {
    currentBooking.hotels!.push({ id: crypto.randomUUID(), hotelName: '', city: '', checkIn: '', checkOut: '', roomType: '', status: 'Pending' });
  }
  function addTransport() {
    currentBooking.busesTrains!.push({ id: crypto.randomUUID(), type: 'Bus', provider: '', details: '', date: '', status: 'Pending' });
  }
  function addSightseeing() {
    currentBooking.sightseeing!.push({ id: crypto.randomUUID(), name: '', date: '', vendor: '', status: 'Pending' });
  }
  function addVisa() {
    currentBooking.visas!.push({ id: crypto.randomUUID(), country: '', type: 'Tourist', status: 'Applied' });
  }
  function addInsurance() {
    currentBooking.insurance!.push({ id: crypto.randomUUID(), provider: '', policyNumber: '', status: 'Active' });
  }
  function addDocument() {
    currentBooking.documents!.push({ id: crypto.randomUUID(), type: 'Voucher', name: '', referenceUrl: '' });
  }

  function removeFlight(index: number) { currentBooking.flights!.splice(index, 1); }
  function removeHotel(index: number) { currentBooking.hotels!.splice(index, 1); }
  function removeTransport(index: number) { currentBooking.busesTrains!.splice(index, 1); }
  function removeSightseeing(index: number) { currentBooking.sightseeing!.splice(index, 1); }
  function removeVisa(index: number) { currentBooking.visas!.splice(index, 1); }
  function removeInsurance(index: number) { currentBooking.insurance!.splice(index, 1); }
  function removeDocument(index: number) { currentBooking.documents!.splice(index, 1); }
</script>

<div class="booking-details">
  <div class="bd-header">
    <div class="bd-title">
      <h2>Booking #{currentBooking.id}</h2>
      <div class="bd-subtitle">{currentBooking.customerName} - {currentBooking.packageName}</div>
    </div>
    <div class="bd-actions">
      <button class="btn btn-sm" onclick={onClose}>Close</button>
      <button class="btn btn-primary btn-sm" onclick={saveChanges} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>

  <div class="bd-tabs">
    {#each tabs as tab}
      <button class="bd-tab" class:active={activeTab === tab.id} onclick={() => activeTab = tab.id}>
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="bd-content">
    {#if activeTab === 'overview'}
      <div class="g2">
        <div class="card p20">
          <h3>Basic Info</h3>
          <div class="g2" style="margin-top: 15px;">
            <div class="fg"><label>Customer Name</label><input type="text" bind:value={currentBooking.customerName} /></div>
            <div class="fg"><label>Customer Phone</label><input type="text" bind:value={currentBooking.customerPhone} /></div>
            <div class="fg"><label>Package Name</label><input type="text" bind:value={currentBooking.packageName} /></div>
            <div class="fg"><label>Travel Dates</label><input type="text" bind:value={currentBooking.travelDates} /></div>
            <div class="fg"><label>Pax</label><input type="text" bind:value={currentBooking.pax} /></div>
            <div class="fg"><label>Tour Coordinator</label><input type="text" bind:value={currentBooking.tourCoordinator} placeholder="e.g. John Doe" /></div>
            <div class="fg">
              <label>Status</label>
              <select bind:value={currentBooking.status}>
                <option value="Confirmed">Confirmed</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ticket Issued">Ticket Issued</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div class="fg">
              <label>Trip Progress (%)</label>
              <input type="number" min="0" max="100" bind:value={currentBooking.progress} />
            </div>
          </div>
        </div>
        <div class="card p20">
          <h3>Payments Summary</h3>
          <div class="g2" style="margin-top: 15px;">
            <div class="fg"><label>Total Amount</label><input type="number" bind:value={currentBooking.totalAmount} /></div>
            <div class="fg"><label>Paid Amount</label><input type="number" bind:value={currentBooking.paidAmount} /></div>
            <div class="fg"><label>Balance Amount</label><input type="number" value={(currentBooking.totalAmount || 0) - (currentBooking.paidAmount || 0)} disabled /></div>
          </div>
        </div>
      </div>

    {:else if activeTab === 'itinerary'}
      <!-- Flights -->
      <div class="card p20 mb-4">
        <div class="flex-between">
          <h3>Flights</h3>
          <button class="btn btn-sm btn-outline" onclick={addFlight}>+ Add Flight</button>
        </div>
        <div class="list-container">
          {#each currentBooking.flights! as flight, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg"><label>Airline</label><input type="text" bind:value={flight.airline} /></div>
                <div class="fg"><label>Flight #</label><input type="text" bind:value={flight.flightNumber} /></div>
                <div class="fg"><label>Date</label><input type="text" bind:value={flight.date} /></div>
                <div class="fg"><label>Departure</label><input type="text" bind:value={flight.departure} /></div>
                <div class="fg"><label>Arrival</label><input type="text" bind:value={flight.arrival} /></div>
                <div class="fg"><label>PNR</label><input type="text" bind:value={flight.pnr} /></div>
                <div class="fg"><label>Status</label><input type="text" bind:value={flight.status} /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeFlight(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.flights!.length === 0}
            <div class="empty-state">No flights added.</div>
          {/if}
        </div>
      </div>

      <!-- Hotels -->
      <div class="card p20 mb-4">
        <div class="flex-between">
          <h3>Hotels</h3>
          <button class="btn btn-sm btn-outline" onclick={addHotel}>+ Add Hotel</button>
        </div>
        <div class="list-container">
          {#each currentBooking.hotels! as hotel, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg"><label>Hotel Name</label><input type="text" bind:value={hotel.hotelName} /></div>
                <div class="fg"><label>City</label><input type="text" bind:value={hotel.city} /></div>
                <div class="fg"><label>Check-in</label><input type="date" bind:value={hotel.checkIn} /></div>
                <div class="fg"><label>Check-out</label><input type="date" bind:value={hotel.checkOut} /></div>
                <div class="fg"><label>Room Type</label><input type="text" bind:value={hotel.roomType} /></div>
                <div class="fg"><label>Status</label><input type="text" bind:value={hotel.status} /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeHotel(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.hotels!.length === 0}
            <div class="empty-state">No hotels added.</div>
          {/if}
        </div>
      </div>

      <!-- Buses/Trains -->
      <div class="card p20 mb-4">
        <div class="flex-between">
          <h3>Buses & Trains</h3>
          <button class="btn btn-sm btn-outline" onclick={addTransport}>+ Add Transport</button>
        </div>
        <div class="list-container">
          {#each currentBooking.busesTrains! as transport, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg">
                  <label>Type</label>
                  <select bind:value={transport.type}>
                    <option value="Bus">Bus</option>
                    <option value="Train">Train</option>
                    <option value="Cab">Cab</option>
                  </select>
                </div>
                <div class="fg"><label>Provider</label><input type="text" bind:value={transport.provider} /></div>
                <div class="fg"><label>Date</label><input type="text" bind:value={transport.date} /></div>
                <div class="fg"><label>Details</label><input type="text" bind:value={transport.details} /></div>
                <div class="fg"><label>Status</label><input type="text" bind:value={transport.status} /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeTransport(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.busesTrains!.length === 0}
            <div class="empty-state">No transport added.</div>
          {/if}
        </div>
      </div>

      <!-- Sightseeing -->
      <div class="card p20">
        <div class="flex-between">
          <h3>Sightseeing & Activities</h3>
          <button class="btn btn-sm btn-outline" onclick={addSightseeing}>+ Add Activity</button>
        </div>
        <div class="list-container">
          {#each currentBooking.sightseeing! as activity, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg"><label>Name</label><input type="text" bind:value={activity.name} /></div>
                <div class="fg"><label>Date</label><input type="text" bind:value={activity.date} /></div>
                <div class="fg"><label>Vendor</label><input type="text" bind:value={activity.vendor} /></div>
                <div class="fg"><label>Status</label><input type="text" bind:value={activity.status} /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeSightseeing(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.sightseeing!.length === 0}
            <div class="empty-state">No activities added.</div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'operations'}
      <!-- Visas -->
      <div class="card p20 mb-4">
        <div class="flex-between">
          <h3>Visas</h3>
          <button class="btn btn-sm btn-outline" onclick={addVisa}>+ Add Visa</button>
        </div>
        <div class="list-container">
          {#each currentBooking.visas! as visa, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg"><label>Country</label><input type="text" bind:value={visa.country} /></div>
                <div class="fg"><label>Type</label><input type="text" bind:value={visa.type} /></div>
                <div class="fg">
                  <label>Status</label>
                  <select bind:value={visa.status}>
                    <option value="Applied">Applied</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeVisa(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.visas!.length === 0}
            <div class="empty-state">No visas added.</div>
          {/if}
        </div>
      </div>

      <!-- Insurance -->
      <div class="card p20">
        <div class="flex-between">
          <h3>Insurance</h3>
          <button class="btn btn-sm btn-outline" onclick={addInsurance}>+ Add Insurance</button>
        </div>
        <div class="list-container">
          {#each currentBooking.insurance! as insurance, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg"><label>Provider</label><input type="text" bind:value={insurance.provider} /></div>
                <div class="fg"><label>Policy Number</label><input type="text" bind:value={insurance.policyNumber} /></div>
                <div class="fg"><label>Status</label><input type="text" bind:value={insurance.status} /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeInsurance(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.insurance!.length === 0}
            <div class="empty-state">No insurance added.</div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'documents'}
      <div class="card p20">
        <div class="flex-between">
          <h3>Documents & References</h3>
          <button class="btn btn-sm btn-outline" onclick={addDocument}>+ Add Document</button>
        </div>
        <p style="color:var(--text2);font-size:13px;margin: 5px 0 15px;">Store links or references to Booking Vouchers, Supplier Invoices, and Travel Documents.</p>
        <div class="list-container">
          {#each currentBooking.documents! as doc, i}
            <div class="item-row">
              <div class="g4">
                <div class="fg">
                  <label>Type</label>
                  <select bind:value={doc.type}>
                    <option value="Voucher">Booking Voucher</option>
                    <option value="Invoice">Supplier Invoice</option>
                    <option value="Ticket">Ticket</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="fg"><label>Name</label><input type="text" bind:value={doc.name} placeholder="e.g. Hotel Voucher" /></div>
                <div class="fg" style="grid-column: span 2;"><label>Reference / URL</label><input type="text" bind:value={doc.referenceUrl} placeholder="https://... or File ID" /></div>
              </div>
              <button class="icon-btn btn-danger" onclick={() => removeDocument(i)}><i class="ti ti-trash"></i></button>
            </div>
          {/each}
          {#if currentBooking.documents!.length === 0}
            <div class="empty-state">No documents added.</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .booking-details {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .bd-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-wrap: wrap;
    gap: 15px;
  }
  .bd-title h2 {
    margin: 0;
    font-size: 20px;
  }
  .bd-subtitle {
    color: var(--text2);
    font-size: 14px;
    margin-top: 4px;
  }
  .bd-actions {
    display: flex;
    gap: 12px;
  }
  .bd-tabs {
    display: flex;
    padding: 0 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .bd-tabs::-webkit-scrollbar {
    display: none;
  }
  .bd-tab {
    padding: 15px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text2);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .bd-tab:hover {
    color: var(--text);
  }
  .bd-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
  .bd-content {
    padding: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    background: var(--bg);
  }
  .mb-4 {
    margin-bottom: 20px;
  }
  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .list-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .item-row {
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: flex-start;
    justify-content: space-between;
  }
  .item-row .g4 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 15px;
    flex: 1;
    min-width: 250px;
  }
  .empty-state {
    padding: 20px;
    text-align: center;
    color: var(--text2);
    background: var(--surface-hover);
    border-radius: var(--radius);
    font-size: 14px;
  }
  .btn-danger {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.1);
  }
  .btn-danger:hover {
    background: var(--danger);
    color: white;
  }
</style>
