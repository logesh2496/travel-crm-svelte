<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchSupplierPayments, createSupplierPayment, updateSupplierPayment, type SupplierPayment } from '$lib/firebase/supplierPayment.db';

  let payments: SupplierPayment[] = $state([]);
  let loading = $state(true);
  
  // KPI state
  let totalPayable = $state(0); // Base mock
  let paid = $state(0);
  let pending = $state(0);

  // Modals state
  let showRecordModal = $state(false);
  let showScheduleModal = $state(false);
  let showPaidModal = $state(false);
  
  let currentPayment: SupplierPayment | null = $state(null);
  
  // Forms state
  let formSupplier = $state('');
  let formType = $state('Hotel');
  let formDesc = $state('');
  let formAmount = $state('');
  let formDate = $state('');
  let overrideAmount = $state('');

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      payments = await fetchSupplierPayments();
      // recalculate KPIs based on payments
      paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      pending = payments.filter(p => p.status === 'scheduled' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
      
      // Dynamic total
      totalPayable = paid + pending;
    } catch (e) {
      console.error(e);
    }
    loading = false;
  }

  // formats
  function formatMoney(amt: number) {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    return `₹${amt.toLocaleString()}`;
  }

  function getDaysOverdue(dueDateStr: string | undefined): number {
    if (!dueDateStr) return 0;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Modals operations
  function openRecord() {
    formSupplier = ''; formType = 'Hotel'; formDesc = ''; formAmount = ''; formDate = new Date().toISOString().split('T')[0];
    showRecordModal = true;
  }
  function openSchedule() {
    formSupplier = ''; formType = 'Hotel'; formDesc = ''; formAmount = ''; formDate = new Date().toISOString().split('T')[0];
    showScheduleModal = true;
  }
  function openPaid(payment: SupplierPayment) {
    currentPayment = payment;
    overrideAmount = '';
    showPaidModal = true;
  }
  
  async function handleRecord() {
    if (!formSupplier || !formAmount) return;
    await createSupplierPayment({
      supplierName: formSupplier,
      supplierType: formType,
      description: formDesc,
      amount: Number(formAmount),
      status: 'paid',
      paidDate: formDate
    });
    showRecordModal = false;
    await loadData();
  }

  async function handleSchedule() {
    if (!formSupplier || !formAmount) return;
    await createSupplierPayment({
      supplierName: formSupplier,
      supplierType: formType,
      description: formDesc,
      amount: Number(formAmount),
      status: 'scheduled',
      dueDate: formDate
    });
    showScheduleModal = false;
    await loadData();
  }

  async function handlePaid() {
    if (!currentPayment || !currentPayment.id) return;
    let amt = Number(overrideAmount);
    if (!amt || amt <= 0) amt = currentPayment.amount; // use original amount if no override
    
    await updateSupplierPayment(currentPayment.id, {
      status: 'paid',
      amount: amt,
      supplierName: currentPayment.supplierName,
      paidDate: new Date().toISOString().split('T')[0]
    });
    showPaidModal = false;
    currentPayment = null;
    await loadData();
  }
</script>

<div class="page active" id="page-supplier-payments">
  <div class="ph">
    <h2>Supplier Payment Management</h2>
    <div class="ph-actions" style="display:flex;gap:10px;">
      <button class="btn btn-secondary btn-sm" onclick={openSchedule} type="button"><i class="ti ti-calendar-plus"></i>Schedule Payment</button>
      <button class="btn btn-primary btn-sm" onclick={openRecord} type="button"><i class="ti ti-plus"></i>Record Payment</button>
    </div>
  </div>
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="kpi k-orange"><div class="kpi-label">Total Supplier Payable</div><div class="kpi-value" style="color:var(--warning)">{formatMoney(totalPayable)}</div></div>
    <div class="kpi k-green"><div class="kpi-label">Paid to Suppliers</div><div class="kpi-value" style="color:var(--success)">{formatMoney(paid)}</div></div>
    <div class="kpi k-teal"><div class="kpi-label">Pending Payments</div><div class="kpi-value" style="color:var(--danger)">{formatMoney(pending)}</div></div>
  </div>
  
  <div class="g2">
    <div class="card">
      <div class="card-title"><i class="ti ti-alert-triangle" style="color:var(--danger)"></i>Pending Supplier Payments</div>
      
      {#if loading}
        <div style="padding: 20px;">Loading...</div>
      {:else}
        <div style="display:flex;flex-direction:column;gap:12px;">
          {#each payments.filter(p => p.status === 'scheduled' || p.status === 'overdue') as supPay}
            {@const daysOverdue = getDaysOverdue(supPay.dueDate)}
            <div class="sup-card" style="display:flex;align-items:center;gap:15px;padding:15px;border:1px solid var(--border);border-radius:var(--radius);background:#fff">
              <div class="sup-icon" style="width:40px;height:40px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;color:var(--text2)"><i class="ti ti-building"></i></div>
              <div style="flex:1">
                <div class="sup-name" style="font-weight:600;font-size:15px">{supPay.supplierName}</div>
                <div class="sup-type" style="font-size:12px;color:var(--text2)">{supPay.supplierType} · {supPay.description}</div>
              </div>
              <div class="sup-balance" style="text-align:right; margin-right: 10px;">
                <div class="sup-amt" style="font-weight:700;font-size:15px" class:overdue-color={daysOverdue > 0}>₹{supPay.amount.toLocaleString()}</div>
                <div class="sup-status" style="font-size:12px;color:var(--text2)" class:overdue-color={daysOverdue > 0}>
                  {#if daysOverdue > 0}
                    Overdue {daysOverdue} days
                  {:else if supPay.dueDate}
                    Due {new Date(supPay.dueDate).toLocaleDateString()}
                  {:else}
                    Scheduled
                  {/if}
                </div>
              </div>
              <button class="btn btn-sm" style="background:var(--success);color:#fff;border:none;" onclick={() => openPaid(supPay)} type="button">Mark Paid</button>
            </div>
          {:else}
            <div style="padding: 20px; color: var(--text2)">No pending supplier payments.</div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modals -->
{#if showRecordModal}
<div class="modal-overlay open" role="dialog" tabindex="-1">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-cash"></i>Record Supplier Payment</div>
    <div class="fgrid">
      <div class="fg"><label for="rpSupplier">Supplier Name *</label><input id="rpSupplier" bind:value={formSupplier} placeholder="e.g. Anantara Hotels"></div>
      <div class="fg">
        <label for="rpType">Supplier Type</label>
        <select id="rpType" bind:value={formType}>
          <option>Hotel</option><option>Flight</option><option>Transport</option><option>Activity</option><option>Other</option>
        </select>
      </div>
      <div class="fg"><label for="rpDesc">Description</label><input id="rpDesc" bind:value={formDesc} placeholder="e.g. Booking BK-100"></div>
      <div class="fg"><label for="rpAmt">Amount (₹) *</label><input type="number" id="rpAmt" bind:value={formAmount} placeholder="10000"></div>
      <div class="fg"><label for="rpDate">Payment Date</label><input type="date" id="rpDate" bind:value={formDate}></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={handleRecord} type="button">Save Payment</button>
      <button class="btn" onclick={() => showRecordModal = false} type="button">Cancel</button>
    </div>
  </div>
</div>
{/if}

{#if showScheduleModal}
<div class="modal-overlay open" role="dialog" tabindex="-1">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-calendar-plus"></i>Schedule Supplier Payment</div>
    <div class="fgrid">
      <div class="fg"><label for="spSupplier">Supplier Name *</label><input id="spSupplier" bind:value={formSupplier} placeholder="e.g. Anantara Hotels"></div>
      <div class="fg">
        <label for="spType">Supplier Type</label>
        <select id="spType" bind:value={formType}>
          <option>Hotel</option><option>Flight</option><option>Transport</option><option>Activity</option><option>Other</option>
        </select>
      </div>
      <div class="fg"><label for="spDesc">Description</label><input id="spDesc" bind:value={formDesc} placeholder="e.g. Balance Payment"></div>
      <div class="fg"><label for="spAmt">Amount (₹) *</label><input type="number" id="spAmt" bind:value={formAmount} placeholder="10000"></div>
      <div class="fg"><label for="spDate">Due Date</label><input type="date" id="spDate" bind:value={formDate}></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={handleSchedule} type="button">Schedule</button>
      <button class="btn" onclick={() => showScheduleModal = false} type="button">Cancel</button>
    </div>
  </div>
</div>
{/if}

{#if showPaidModal}
<div class="modal-overlay open" role="dialog" tabindex="-1">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-check"></i>Mark Supplier Payment as Paid</div>
    <p style="margin-top: 0; margin-bottom: 15px; font-size: 14px; color: var(--text2);">
      Confirm payment for <strong>{currentPayment?.supplierName}</strong>.<br/>
      Scheduled amount: <strong>₹{currentPayment?.amount.toLocaleString()}</strong>
    </p>
    <div class="fgrid">
      <div class="fg full">
        <label for="mpAmt">Amount Paid (Optional)</label>
        <input type="number" id="mpAmt" bind:value={overrideAmount} placeholder="Leave blank to pay full scheduled amount">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick={handlePaid} type="button" style="background:var(--success);color:#fff;border:none;">Confirm Paid</button>
      <button class="btn" onclick={() => showPaidModal = false} type="button">Cancel</button>
    </div>
  </div>
</div>
{/if}

<style>
  .overdue-color {
    color: var(--danger) !important;
  }
</style>
