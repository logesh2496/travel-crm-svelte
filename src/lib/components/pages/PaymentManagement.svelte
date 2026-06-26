<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchPayments, createPayment, updatePayment, type Payment } from '$lib/firebase/payment.db';
  import type { Lead } from '$lib/firebase/lead.db';

  let { leads = [] } = $props<{ leads?: Lead[] }>();

  let payments: Payment[] = $state([]);
  let loading = $state(true);
  
  // KPI state
  let totalRevenue = $state(4860000); // Base mock, will add dynamic collected + pending
  let collected = $state(0);
  let pending = $state(0);

  // Modals state
  let showRecordModal = $state(false);
  let showScheduleModal = $state(false);
  let showPaidModal = $state(false);
  
  let currentPayment: Payment | null = $state(null);
  
  // Forms state
  let formTitle = $state('');
  let formDesc = $state('');
  let formAmount = $state('');
  let formMethod = $state('Bank Transfer');
  let formDate = $state('');
  let overrideAmount = $state('');

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      payments = await fetchPayments();
      // recalculate KPIs based on payments
      collected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      pending = payments.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0);
      
      // Let's use a base revenue of 48.6L for demo, plus any actuals, or just collected + pending if we want it fully dynamic.
      // For now we'll just sum them so it reflects reality. If we want it to look like the mock:
      // totalRevenue = 4860000 + collected + pending;
      // We will just do dynamic:
      totalRevenue = collected + pending || 4860000;
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

  // Modals operations
  function openRecord() {
    formTitle = ''; formDesc = ''; formAmount = ''; formMethod = 'Bank Transfer'; formDate = new Date().toISOString().split('T')[0];
    showRecordModal = true;
  }
  function openSchedule() {
    formTitle = ''; formDesc = ''; formAmount = ''; formMethod = 'Bank Transfer'; formDate = new Date().toISOString().split('T')[0];
    showScheduleModal = true;
  }
  function openPaid(payment: Payment) {
    currentPayment = payment;
    overrideAmount = '';
    showPaidModal = true;
  }
  
  async function handleRecord() {
    if (!formTitle || !formAmount) return;
    await createPayment({
      title: formTitle,
      description: formDesc,
      amount: Number(formAmount),
      paymentMethod: formMethod,
      status: 'paid',
      paidDate: formDate
    });
    showRecordModal = false;
    await loadData();
  }

  async function handleSchedule() {
    if (!formTitle || !formAmount) return;
    await createPayment({
      title: formTitle,
      description: formDesc,
      amount: Number(formAmount),
      paymentMethod: formMethod,
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
    
    await updatePayment(currentPayment.id, {
      status: 'paid',
      amount: amt,
      title: currentPayment.title,
      paidDate: new Date().toISOString().split('T')[0]
    });
    showPaidModal = false;
    currentPayment = null;
    await loadData();
  }
</script>

<div class="page active" id="page-payments">
  <div class="ph">
    <h2>Payment Management</h2>
    <div class="ph-actions" style="display:flex;gap:10px;">
      <button class="btn btn-secondary btn-sm" onclick={openSchedule} type="button"><i class="ti ti-calendar-plus"></i>Schedule Payment</button>
      <button class="btn btn-primary btn-sm" onclick={openRecord} type="button"><i class="ti ti-plus"></i>Record Payment</button>
    </div>
  </div>
  
  <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="kpi k-teal">
      <div class="kpi-label">Total Revenue</div>
      <div class="kpi-value" style="color:var(--teal)">{formatMoney(totalRevenue)}</div>
    </div>
    <div class="kpi k-green">
      <div class="kpi-label">Collected</div>
      <div class="kpi-value" style="color:var(--success)">{formatMoney(collected)}</div>
    </div>
    <div class="kpi k-orange">
      <div class="kpi-label">Pending</div>
      <div class="kpi-value" style="color:var(--warning)">{formatMoney(pending)}</div>
    </div>
  </div>
  
  <div class="card">
    <div class="card-title"><i class="ti ti-calendar-time"></i>Scheduled Payments</div>
    {#if loading}
      <div style="padding: 20px;">Loading...</div>
    {:else}
      <div class="g2">
        <div style="display:flex;flex-direction:column;gap:12px;">
          {#each payments.filter(p => p.status === 'scheduled') as sched}
            <div class="sched-item">
              <div class="sched-date">
                {#if sched.dueDate}
                  <div class="sched-day">{new Date(sched.dueDate).getDate()}</div>
                  <div class="sched-mon">{new Date(sched.dueDate).toLocaleString('default', { month: 'short' })}</div>
                {:else}
                  <div class="sched-day">-</div>
                  <div class="sched-mon">-</div>
                {/if}
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600">{sched.title}</div>
                <div style="font-size:12px;color:var(--text2)">{sched.description} · ₹{sched.amount.toLocaleString()} · {sched.paymentMethod}</div>
              </div>
              <button class="btn btn-sm" style="background:var(--success);color:#fff;border:none;" onclick={() => openPaid(sched)} type="button">Mark Paid</button>
            </div>
          {:else}
            <div style="padding: 20px; color: var(--text2)">No scheduled payments.</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modals -->
{#if showRecordModal}
<div class="modal-overlay open" role="dialog" tabindex="-1">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-cash"></i>Record Payment</div>
    <div class="fgrid">
      <div class="fg">
        <label for="rpTitle">Lead / Name *</label>
        <select id="rpTitle" bind:value={formTitle}>
          <option value="">Select a Lead...</option>
          {#each leads as lead}
            <option value={lead.name}>{lead.name}</option>
          {/each}
        </select>
      </div>
      <div class="fg"><label for="rpDesc">Description</label><input id="rpDesc" bind:value={formDesc} placeholder="e.g. Booking BK-100"></div>
      <div class="fg"><label for="rpAmt">Amount (₹) *</label><input type="number" id="rpAmt" bind:value={formAmount} placeholder="10000"></div>
      <div class="fg">
        <label for="rpMethod">Payment Method</label>
        <select id="rpMethod" bind:value={formMethod}>
          <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Credit Card</option>
        </select>
      </div>
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
    <div class="modal-title"><i class="ti ti-calendar-plus"></i>Schedule Payment</div>
    <div class="fgrid">
      <div class="fg">
        <label for="spTitle">Lead / Name *</label>
        <select id="spTitle" bind:value={formTitle}>
          <option value="">Select a Lead...</option>
          {#each leads as lead}
            <option value={lead.name}>{lead.name}</option>
          {/each}
        </select>
      </div>
      <div class="fg"><label for="spDesc">Description</label><input id="spDesc" bind:value={formDesc} placeholder="e.g. Final Installment"></div>
      <div class="fg"><label for="spAmt">Amount (₹) *</label><input type="number" id="spAmt" bind:value={formAmount} placeholder="10000"></div>
      <div class="fg">
        <label for="spMethod">Expected Method</label>
        <select id="spMethod" bind:value={formMethod}>
          <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Credit Card</option>
        </select>
      </div>
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
    <div class="modal-title"><i class="ti ti-check"></i>Mark Payment as Paid</div>
    <p style="margin-top: 0; margin-bottom: 15px; font-size: 14px; color: var(--text2);">
      Confirm payment for <strong>{currentPayment?.title}</strong>.<br/>
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
