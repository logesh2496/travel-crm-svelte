<script lang="ts">
  import type { Lead as LeadType } from '$lib/firebase/lead.db';

  let { openModalId, onClose, onSave, leads = [], teamUsers = [], currentUser = null, pageData = null } = $props<{
    openModalId: string | null;
    onClose: () => void;
    onSave: (type: string, data: any) => void;
    leads?: LeadType[];
    teamUsers?: any[];
    currentUser?: any;
    pageData?: any;
  }>();

  // New Query Form States
  let qName = $state('');
  let qPhone = $state('');
  let qEmail = $state('');
  let qDest = $state('');
  let qSrc = $state('Website');
  let qExec = $state('');
  let qDepDate = $state('');
  let qRetDate = $state('');
  let qAdults = $state(2);
  let qChildren = $state(0);
  let qBudget = $state('');
  let qPri = $state('Normal');
  let qNotes = $state('');

  function resetQueryForm() {
    qName = '';
    qPhone = '';
    qEmail = '';
    qDest = '';
    qSrc = 'Website';
    qExec = currentUser?.name || (teamUsers.length > 0 ? teamUsers[0].name : '');
    qDepDate = '';
    qRetDate = '';
    qAdults = 2;
    qChildren = 0;
    qBudget = '';
    qPri = 'Normal';
    qNotes = '';
  }

  function handleSaveQuery(action: 'save' | 'save-quote') {
    if (!qName || !qPhone || !qDest) {
      alert('Please fill out all required fields');
      return;
    }
    const leadData: LeadType = {
      name: qName,
      phone: qPhone,
      email: qEmail,
      dest: qDest,
      date: qDepDate || new Date().toISOString().split('T')[0],
      budget: qBudget ? '₹' + parseInt(qBudget).toLocaleString('en-IN') : '₹1,50,000',
      src: qSrc,
      exec: qExec,
      pri: qPri,
      status: 'New',
      notes: qNotes
    };
    onSave('query', { leadData, action });
    resetQueryForm();
  }

  // Follow-Up Form States
  let fuLead = $state('');
  let fuDate = $state('');
  const todayDate = new Date().toISOString().split('T')[0];
  let fuTime = $state('');
  let fuType = $state('Call');
  let fuExec = $state('');
  let fuNotes = $state('');

  function handleSaveFollowUp() {
    onSave('followup', { fuLead, fuDate, fuTime, fuType, fuExec, fuNotes });
    fuNotes = '';
  }

  $effect(() => {
    if (openModalId === 'addFUModal' && pageData?.leadId && pageData?.leadName) {
      fuLead = `${pageData.leadId} — ${pageData.leadName}`;
    }
  });

  // Record Payment Form States
  let payBooking = $state('BK-24-041 — Mehta Family');
  let payAmt = $state('');
  let payType = $state('Advance');
  let payMethod = $state('Bank Transfer');
  let payDate = $state('');
  let payRef = $state('');
  let payNotes = $state('');

  function handleSavePayment() {
    onSave('payment', { payBooking, payAmt, payType, payMethod, payDate, payRef, payNotes });
    payAmt = '';
    payRef = '';
    payNotes = '';
  }

  // Add User Form States
  let uName = $state('');
  let uEmail = $state('');
  let uPhone = $state('');
  let uPass = $state('');
  let uRole = $state('Sales Executive — Queries, Quotes, Follow-ups');

  function handleSaveUser() {
    onSave('user', { uName, uEmail, uPhone, uPass, uRole });
    uName = '';
    uEmail = '';
    uPhone = '';
    uPass = '';
  }
</script>

<!-- Add Query Modal -->
<div class="modal-overlay" class:open={openModalId === 'addQueryModal'} onclick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
  <div class="modal modal-lg">
    <div class="modal-title"><i class="ti ti-user-plus"></i>New Lead</div>
    <div class="fgrid">
      <div class="fg"><label for="qName">Customer Name *</label><input id="qName" bind:value={qName} placeholder="Full name"></div>
      <div class="fg"><label for="qPhone">Mobile Number *</label><input id="qPhone" bind:value={qPhone} placeholder="+91 9876543210"></div>
      <div class="fg"><label for="qEmail">Email</label><input type="email" id="qEmail" bind:value={qEmail} placeholder="email@example.com"></div>
      <div class="fg"><label for="qDest">Destination *</label><input id="qDest" bind:value={qDest} placeholder="e.g. Maldives, Dubai, Bali"></div>
      <div class="fg">
        <label for="qSrc">Lead Source</label>
        <select id="qSrc" bind:value={qSrc}>
          <option>Website</option><option>WhatsApp</option><option>Facebook</option>
          <option>Instagram</option><option>Referral</option><option>B2B Agent</option>
          <option>Walk-in</option><option>Phone Call</option>
        </select>
      </div>
      <div class="fg">
        <label for="qExec">Assigned Executive</label>
        <select id="qExec" bind:value={qExec}>
          {#if teamUsers.length === 0}
            {#if currentUser}
              <option value={currentUser.name}>{currentUser.name}</option>
            {:else}
              <option value="" disabled>Loading users...</option>
            {/if}
          {:else}
            {#each teamUsers as user}
              <option value={user.name}>{user.name}</option>
            {/each}
          {/if}
        </select>
      </div>
      <div class="fg"><label for="qDepDate">Departure Date</label><input type="date" id="qDepDate" bind:value={qDepDate}></div>
      <div class="fg"><label for="qRetDate">Return Date</label><input type="date" id="qRetDate" bind:value={qRetDate}></div>
      <div class="fg"><label for="qAdults">Adults</label><input type="number" id="qAdults" bind:value={qAdults}></div>
      <div class="fg"><label for="qChildren">Children</label><input type="number" id="qChildren" bind:value={qChildren}></div>
      <div class="fg"><label for="qBudget">Budget (₹)</label><input id="qBudget" bind:value={qBudget} placeholder="150000"></div>
      <div class="fg">
        <label for="qPri">Priority</label>
        <select id="qPri" bind:value={qPri}>
          <option>Normal</option><option>High</option><option>Urgent</option><option>Low</option>
        </select>
      </div>
      <div class="fg full"><label for="qNotes">Special Requirements / Notes</label><textarea id="qNotes" bind:value={qNotes} placeholder="Any special needs, preferences…"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={() => handleSaveQuery('save')} type="button"><i class="ti ti-device-floppy"></i>Save Lead</button>
      <button class="btn btn-teal" onclick={() => handleSaveQuery('save-quote')} type="button"><i class="ti ti-file-text"></i>Save & Create Quote</button>
      <button class="btn" onclick={onClose} type="button">Cancel</button>
    </div>
  </div>
</div>

<!-- Add Follow-Up Modal -->
<div class="modal-overlay" class:open={openModalId === 'addFUModal'} onclick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-calendar-event"></i>Schedule Follow-Up</div>
    <div class="fgrid">
      <div class="fg full">
        <label for="fuLead">Lead / Customer</label>
        <select id="fuLead" bind:value={fuLead}>
          <option value="" disabled selected>Select a lead</option>
          {#each leads as lead}
            <option value="{lead.leadId} — {lead.name}">{lead.leadId} — {lead.name}</option>
          {/each}
        </select>
      </div>
      <div class="fg"><label for="fuDate">Follow-Up Date</label><input type="date" id="fuDate" bind:value={fuDate} min={todayDate}></div>
      <div class="fg"><label for="fuTime">Follow-Up Time</label><input type="time" id="fuTime" bind:value={fuTime}></div>
      <div class="fg">
        <label for="fuType">Type</label>
        <select id="fuType" bind:value={fuType}>
          <option>Call</option><option>WhatsApp</option><option>Email</option><option>Meeting</option>
        </select>
      </div>
      <div class="fg">
        <label for="fuExec">Assigned To</label>
        <select id="fuExec" bind:value={fuExec}>
          {#if teamUsers.length === 0}
            {#if currentUser}
              <option value={currentUser.name}>{currentUser.name}</option>
            {:else}
              <option value="" disabled>Loading users...</option>
            {/if}
          {:else}
            {#each teamUsers as user}
              <option value={user.name}>{user.name}</option>
            {/each}
          {/if}
        </select>
      </div>
      <div class="fg full"><label for="fuNotes">Notes</label><textarea id="fuNotes" bind:value={fuNotes} placeholder="Purpose and notes for this follow-up…"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={handleSaveFollowUp} type="button"><i class="ti ti-calendar-plus"></i>Schedule</button>
      <button class="btn" onclick={onClose} type="button">Cancel</button>
    </div>
  </div>
</div>

<!-- Add Payment Modal -->
<div class="modal-overlay" class:open={openModalId === 'addPayModal'} onclick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-credit-card"></i>Record Payment</div>
    <div class="fgrid">
      <div class="fg full">
        <label for="payBooking">Booking</label>
        <select id="payBooking" bind:value={payBooking}>
          <option>BK-24-041 — Mehta Family</option><option>BK-24-040 — Priya Sharma</option>
        </select>
      </div>
      <div class="fg"><label for="payAmt">Amount (₹)</label><input type="number" id="payAmt" bind:value={payAmt} placeholder="100000"></div>
      <div class="fg">
        <label for="payType">Payment Type</label>
        <select id="payType" bind:value={payType}>
          <option>Advance</option><option>Partial</option><option>Full</option><option>Refund</option>
        </select>
      </div>
      <div class="fg">
        <label for="payMethod">Payment Method</label>
        <select id="payMethod" bind:value={payMethod}>
          <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Credit Card</option>
        </select>
      </div>
      <div class="fg"><label for="payDate">Payment Date</label><input type="date" id="payDate" bind:value={payDate}></div>
      <div class="fg"><label for="payRef">Transaction ID / Ref</label><input id="payRef" bind:value={payRef} placeholder="UTR / Cheque No."></div>
      <div class="fg full"><label for="payNotes">Notes</label><textarea id="payNotes" bind:value={payNotes} placeholder="Any notes about this payment…" style="min-height:60px"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={handleSavePayment} type="button"><i class="ti ti-device-floppy"></i>Save Payment</button>
      <button class="btn" onclick={onClose} type="button">Cancel</button>
    </div>
  </div>
</div>

<!-- Add User Modal -->
<div class="modal-overlay" class:open={openModalId === 'addUserModal'} onclick={(e) => e.target === e.currentTarget && onClose()} role="dialog">
  <div class="modal">
    <div class="modal-title"><i class="ti ti-user-plus"></i>Add New User</div>
    <div class="fgrid">
      <div class="fg"><label for="uName">Full Name *</label><input id="uName" bind:value={uName} placeholder="Employee name"></div>
      <div class="fg"><label for="uEmail">Email *</label><input type="email" id="uEmail" bind:value={uEmail} placeholder="email@travelcrm.com"></div>
      <div class="fg"><label for="uPhone">Phone</label><input id="uPhone" bind:value={uPhone} placeholder="+91 98765 43210"></div>
      <div class="fg"><label for="uPass">Password *</label><input type="password" id="uPass" bind:value={uPass} placeholder="••••••••"></div>
      <div class="fg full">
        <label for="uRole">Assign Role *</label>
        <select id="uRole" bind:value={uRole}>
          <option>Admin — Full access</option>
          <option>Sales Executive — Queries, Quotes, Follow-ups</option>
          <option>Operations — Bookings, Supplier, Duty Sheet</option>
          <option>Accountant — Payments, Invoices, Reports</option>
        </select>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={handleSaveUser} type="button"><i class="ti ti-user-check"></i>Create User</button>
      <button class="btn" onclick={onClose} type="button">Cancel</button>
    </div>
  </div>
</div>
