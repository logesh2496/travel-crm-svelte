<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchBookings, createBooking, type Booking } from '$lib/firebase/booking.db';
  import type { Lead } from '$lib/firebase/lead.db';
  import BookingDetails from './BookingDetails.svelte';

  let { leads = [], onAction } = $props<{
    leads: Lead[];
    onAction: (actionName: string, data?: any) => void;
  }>();

  let bookings = $state<Booking[]>([]);
  let isLoading = $state(true);

  let newBookingDialog = $state<HTMLDialogElement>();

  let selectedBooking = $state<Booking | null>(null);
  let statusFilter = $state<string>('Confirmed');

  let newBookingForm = $state<Partial<Booking>>({
    customerName: '',
    customerPhone: '',
    packageName: '',
    hotelName: '',
    travelDates: '',
    pax: '',
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    status: 'Confirmed'
  });

  let selectedLeadId = $state<string>('');

  async function loadBookings() {
    isLoading = true;
    try {
      bookings = await fetchBookings();
    } catch (err) {
      console.error('Failed to load bookings:', err);
      onAction('toast', { msg: 'Failed to load bookings', type: 'error' });
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadBookings();
  });

  function openNewBooking() {
    selectedLeadId = '';
    newBookingForm = {
      customerName: '',
      customerPhone: '',
      packageName: '',
      hotelName: '',
      travelDates: '',
      pax: '',
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      status: 'Confirmed'
    };
    newBookingDialog?.showModal();
  }

  function handleLeadSelect() {
    const lead = leads.find(l => l.leadId === selectedLeadId);
    if (lead) {
      newBookingForm.customerName = lead.name;
      newBookingForm.customerPhone = lead.phone;
      newBookingForm.packageName = lead.dest; // Default to dest
      newBookingForm.leadId = lead.leadId;
    }
  }

  async function saveNewBooking() {
    try {
      onAction('toast', { msg: 'Saving booking...', type: 'info' });
      // Calculate balance
      newBookingForm.balanceAmount = (newBookingForm.totalAmount || 0) - (newBookingForm.paidAmount || 0);

      const bookingToSave = newBookingForm as Booking;
      const id = await createBooking(bookingToSave);
      
      bookingToSave.id = id;
      bookings = [bookingToSave, ...bookings];
      
      newBookingDialog?.close();
      onAction('toast', { msg: 'Booking created successfully!', type: 'success' });
    } catch (err) {
      console.error('Failed to save booking:', err);
      onAction('toast', { msg: 'Failed to create booking', type: 'error' });
    }
  }

  function viewBooking(booking: Booking) {
    selectedBooking = booking;
  }
  
  function closeBookingDetails() {
    selectedBooking = null;
    loadBookings(); // Refresh when closed
  }

  let confirmedCount = $derived(bookings.filter(b => b.status === 'Confirmed').length);
  let upcomingCount = $derived(bookings.filter(b => b.status === 'Upcoming').length);
  let completedCount = $derived(bookings.filter(b => b.status === 'Completed').length);
  let cancelledCount = $derived(bookings.filter(b => b.status === 'Cancelled').length);

  let filteredBookings = $derived(statusFilter === 'All' ? bookings : bookings.filter(b => b.status === statusFilter));

</script>

<div class="page active" id="page-bookings" style="position: relative;">
  <div class="ph">
    <h2>Booking Management</h2>
    <button class="btn btn-primary btn-sm" onclick={openNewBooking} type="button">
      <i class="ti ti-plus"></i>New Booking
    </button>
  </div>
  <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="kpi k-blue"><div class="kpi-label">Total Bookings</div><div class="kpi-value">{bookings.length}</div></div>
    <div class="kpi k-green"><div class="kpi-label">Confirmed</div><div class="kpi-value" style="color:var(--success)">{confirmedCount}</div></div>
    <div class="kpi k-teal"><div class="kpi-label">Upcoming</div><div class="kpi-value" style="color:var(--teal)">{upcomingCount}</div></div>
    <div class="kpi k-gold"><div class="kpi-label">Completed</div><div class="kpi-value" style="color:var(--gold)">{completedCount}</div></div>
    <div class="kpi k-orange"><div class="kpi-label">Cancelled</div><div class="kpi-value" style="color:var(--danger)">{cancelledCount}</div></div>
  </div>
  {#if selectedBooking}
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; background: var(--bg);">
      <BookingDetails booking={selectedBooking} onClose={closeBookingDetails} {onAction} />
    </div>
  {/if}
  <div class="table-wrap">
    <div style="padding: 15px; border-bottom: 1px solid var(--border); display: flex; justify-content: flex-end; align-items: center;">
      <div class="sbar" style="margin-bottom: 0;">
        <label for="statusFilter" style="font-weight: 500;">Filter by Status:</label>
        <select id="statusFilter" bind:value={statusFilter} style="width: auto; cursor: pointer;">
          <option value="All">All Bookings</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Customer</th>
          <th>Package</th>
          <th>Travel Dates</th>
          <th>Pax</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Balance</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if isLoading}
          <tr><td colspan="10" style="text-align: center; padding: 20px;">Loading bookings...</td></tr>
        {:else if filteredBookings.length === 0}
          <tr><td colspan="10" style="text-align: center; padding: 20px;">No bookings found.</td></tr>
        {:else}
          {#each filteredBookings as booking}
            <tr>
              <td class="td-strong">{booking.id}</td>
              <td>{booking.customerName}<div class="td-sub">{booking.customerPhone}</div></td>
              <td>{booking.packageName}<div class="td-sub">{booking.hotelName}</div></td>
              <td>{booking.travelDates}</td>
              <td>{booking.pax}</td>
              <td class="td-strong">₹{booking.totalAmount?.toLocaleString()}</td>
              <td style="color:var(--success);font-weight:600">₹{booking.paidAmount?.toLocaleString()}</td>
              <td style="color:var(--warning);font-weight:600">₹{booking.balanceAmount?.toLocaleString()}</td>
              <td>
                <span class="badge" class:b-green={booking.status === 'Confirmed' || booking.status === 'Completed' || booking.status === 'Closed'} class:b-blue={booking.status === 'Upcoming'} class:b-orange={booking.status === 'Cancelled'}>{booking.status}</span>
              </td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="icon-btn" onclick={() => viewBooking(booking)} type="button"><i class="ti ti-eye"></i></button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- New Booking Dialog -->
<dialog bind:this={newBookingDialog} class="modal-dialog">
  <div class="modal-content" style="max-width: 600px; width: 100%;">
    <div class="modal-header">
      <div class="modal-title">New Booking</div>
      <button class="modal-close" onclick={() => newBookingDialog?.close()}>✕</button>
    </div>
    <div class="modal-body">
      <div class="g21">
        <div class="fg">
          <label for="leadSelect">Select Lead (Query)</label>
          <select id="leadSelect" bind:value={selectedLeadId} onchange={handleLeadSelect}>
            <option value="">-- Select Lead --</option>
            {#each leads.filter(l => l.status === 'Confirmed') as lead}
              <option value={lead.leadId}>{lead.name} ({lead.leadId}) - {lead.dest}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="g2" style="margin-top: 10px;">
        <div class="fg"><label>Customer Name</label><input type="text" bind:value={newBookingForm.customerName} /></div>
        <div class="fg"><label>Customer Phone</label><input type="text" bind:value={newBookingForm.customerPhone} /></div>
        <div class="fg"><label>Package Name</label><input type="text" bind:value={newBookingForm.packageName} /></div>
        <div class="fg"><label>Hotel Name</label><input type="text" bind:value={newBookingForm.hotelName} /></div>
        <div class="fg"><label>Travel Dates</label><input type="text" bind:value={newBookingForm.travelDates} placeholder="e.g. 15-21 Jul" /></div>
        <div class="fg"><label>Pax</label><input type="text" bind:value={newBookingForm.pax} placeholder="e.g. 2A·1C" /></div>
        <div class="fg"><label>Total Amount</label><input type="number" bind:value={newBookingForm.totalAmount} /></div>
        <div class="fg"><label>Paid Amount</label><input type="number" bind:value={newBookingForm.paidAmount} /></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-sm" onclick={() => newBookingDialog?.close()}>Cancel</button>
      <button class="btn btn-primary btn-sm" onclick={saveNewBooking}>Save Booking</button>
    </div>
  </div>
</dialog>


<style>
  .modal-dialog {
    border: none;
    background: transparent;
    padding: 0;
    margin: auto;
  }
  .modal-dialog::backdrop {
    background: rgba(0,0,0,0.5);
  }
  .modal-content {
    background: var(--bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .modal-title {
    font-size: 16px;
    font-weight: 700;
  }
  .modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text2);
  }
  .modal-body {
    padding: 20px;
  }
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
