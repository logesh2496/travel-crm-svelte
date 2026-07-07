<script lang="ts">
  import type { Lead } from '$lib/firebase/lead.db';

  let { leads = [], teamUsers = [], onNavigate, onOpenModal, onAction } = $props<{
    leads: Lead[];
    teamUsers?: any[];
    onNavigate: (page: string, data?: any) => void;
    onOpenModal: (modalId: string) => void;
    onAction: (actionName: string, data?: any) => void;
  }>();

  let viewMode = $state<'table' | 'kanban'>('table');
  let queryTabFilter = $state<string>('all');
  
  // Actions state
  let viewLead = $state<Lead | null>(null);

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'New' },
    { label: 'Quote Sent', value: 'Quote Sent' },
    { label: 'Follow-Up', value: 'Follow-Up' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Lost', value: 'Lost' }
  ];

  const PBADGE: Record<string, string> = {
    Normal: 'b-gray',
    High: 'b-amber',
    Urgent: 'b-red',
    Low: 'b-blue'
  };

  const SBADGE: Record<string, string> = {
    New: 'b-blue',
    Contacted: 'b-gray',
    'Quote Sent': 'b-amber',
    'Follow-Up': 'b-purple',
    Negotiation: 'b-amber',
    Confirmed: 'b-green',
    Lost: 'b-red'
  };

  // Reactively filter leads based on current selected tab
  let filteredLeads = $derived(
    queryTabFilter === 'all' 
      ? leads 
      : leads.filter((q: Lead) => q.status === queryTabFilter)
  );

  // Kanban Columns
  const kanbanCols = ['New', 'Contacted', 'Quote Sent', 'Follow-Up', 'Negotiation', 'Confirmed', 'Lost'];

  function countLeadsByStatus(status: string) {
    return leads.filter((q: Lead) => q.status === status).length;
  }
</script>

<div class="page active" id="page-queries">
  <div class="ph">
    <h2>Lead Management</h2>
    <div class="ph-actions">
      <button class="btn btn-sm" class:btn-primary={viewMode === 'table'} onclick={() => viewMode = 'table'} type="button">
        <i class="ti ti-table"></i>Table
      </button>
      <button class="btn btn-sm" class:btn-primary={viewMode === 'kanban'} onclick={() => viewMode = 'kanban'} type="button">
        <i class="ti ti-layout-kanban"></i>Kanban
      </button>
      <button class="btn btn-primary btn-sm" onclick={() => onOpenModal('addQueryModal')} type="button">
        <i class="ti ti-plus"></i>New Lead
      </button>
    </div>
  </div>

  <div class="tabs">
    {#each tabs as t}
      <button 
        class="tab" 
        class:active={queryTabFilter === t.value} 
        onclick={() => queryTabFilter = t.value}
        type="button"
        style="background: none; border: none; font: inherit; cursor: pointer;"
      >
        {t.label} ({t.value === 'all' ? leads.length : countLeadsByStatus(t.value)})
      </button>
    {/each}
  </div>

  <div class="sbar">
    <input placeholder="Search by name, phone, destination, lead ID…" style="flex: 1; min-width: 200px; max-width: 300px;">
    <select>
      <option>All Sources</option><option>Website</option><option>WhatsApp</option>
      <option>Facebook</option><option>Instagram</option><option>Referral</option>
      <option>B2B Agent</option><option>Walk-in</option>
    </select>
    <select>
      <option>All Executives</option>
      {#each teamUsers as user}
        <option value={user.name}>{user.name}</option>
      {/each}
    </select>
    <select>
      <option>All Priority</option><option>Urgent</option><option>High</option>
      <option>Normal</option><option>Low</option>
    </select>
    <input type="date" style="padding:9px 12px;border:1.5px solid var(--border2);border-radius:var(--radius);font-size:13px">
    <button class="btn btn-sm btn-teal" type="button"><i class="ti ti-filter"></i>Filter</button>
  </div>

  {#if viewMode === 'table'}
    <!-- TABLE VIEW -->
    <div id="queryTableView" class="table-wrap" style="width: 100%; overflow-x: auto;">
      <table style="min-width: 1200px;">
        <thead>
          <tr>
            <th>Lead ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Destination</th>
            <th>Travel Date</th>
            <th>Budget</th>
            <th>Source</th>
            <th>Executive</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredLeads as q}

            <tr>
              <td style="font-family:monospace;font-size:12px;color:var(--text2)">{q.leadId || 'TEMP'}</td>
              <td>
                <div class="td-strong">{q.name}</div>
              </td>
              <td style="font-size:12px">{q.email || '-'}</td>
              <td style="font-size:12px">{q.phone}</td>
              <td>{q.dest}</td>
              <td style="font-size:12px">{q.date}</td>
              <td class="td-strong">{q.budget}</td>
              <td><span class="badge b-gray" style="font-size:10px">{q.src}</span></td>
              <td style="font-size:12px">{q.exec || '-'}</td>
              <td>
                <select class="badge {PBADGE[q.pri] || 'b-gray'}" style="font-size:10px; border:none; outline:none; cursor:pointer;" 
                  value={q.pri} 
                  onchange={(e) => onAction('update-lead', { leadId: q.leadId, pri: e.target.value })}>
                  <option value="Urgent" style="background:#fff;color:#000">Urgent</option>
                  <option value="High" style="background:#fff;color:#000">High</option>
                  <option value="Normal" style="background:#fff;color:#000">Normal</option>
                  <option value="Low" style="background:#fff;color:#000">Low</option>
                </select>
              </td>
              <td>
                <select class="badge {SBADGE[q.status] || 'b-gray'}" style="border:none; outline:none; cursor:pointer; appearance:auto; -webkit-appearance:auto; padding-right:1rem;" 
                  value={q.status} 
                  onchange={(e) => onAction('update-lead', { leadId: q.leadId, status: e.target.value })}>
                  <option value="New" style="background:#fff;color:#000">New</option>
                  <option value="Contacted" style="background:#fff;color:#000">Contacted</option>
                  <option value="Quote Sent" style="background:#fff;color:#000">Quote Sent</option>
                  <option value="Follow-Up" style="background:#fff;color:#000">Follow-Up</option>
                  <option value="Negotiation" style="background:#fff;color:#000">Negotiation</option>
                  <option value="Confirmed" style="background:#fff;color:#000">Confirmed</option>
                  <option value="Lost" style="background:#fff;color:#000">Lost</option>
                </select>
              </td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="icon-btn" data-tooltip="Edit" onclick={() => viewLead = { ...q }} type="button">
                    <i class="ti ti-edit"></i>
                  </button>
                  <button class="icon-btn" data-tooltip="Quote" onclick={() => onNavigate('itineraries', { leadId: q.leadId })} type="button">
                    <i class="ti ti-file-text"></i>
                  </button>
                  <button class="icon-btn" data-tooltip="Follow-up" onclick={() => onNavigate('followups', { action: 'new', leadId: q.leadId, leadName: q.name })} type="button">
                    <i class="ti ti-calendar-plus"></i>
                  </button>
                  <!-- <button class="icon-btn" title="WA" 
                    onclick={() => {
                      const waUrl = 'https://wa.me/' + q.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hello ' + q.name + ', here is your quotation details...');
                      window.open(waUrl, '_blank');
                    }} 
                    disabled={q.status !== 'Quote Sent'}
                    style={q.status !== 'Quote Sent' ? 'opacity:0.4;cursor:not-allowed;' : ''}
                    type="button">
                    <i class="ti ti-brand-whatsapp"></i>
                  </button>
                  {#if q.status !== 'Confirmed'}
                  <button class="icon-btn" title="Confirm" onclick={() => onAction('update-lead', { leadId: q.leadId, status: 'Confirmed' })} type="button">
                    <i class="ti ti-circle-check" style="color:var(--success)"></i>
                  </button>
                  {/if} -->
                </div>
              </td>
            </tr>

          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <!-- KANBAN VIEW -->
    <div id="queryKanbanView">
      <div class="kanban" id="queryKanban">
        {#each kanbanCols as col}
          <div class="kanban-col">
            <div class="kk-title">
              <span>{col}</span>
              <span class="kk-count">{leads.filter((q: Lead) => q.status === col).length}</span>
            </div>
            {#each leads.filter((q: Lead) => q.status === col) as q}
              <div class="kk-card">
                <div class="kk-name">{q.name}</div>
                <div class="kk-dest">{q.dest}</div>
                <div class="kk-meta">
                  <span>{q.budget}</span>
                  <span style="font-size:10px">{q.src}</span>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

{#if viewLead}
<div class="modal-overlay open" onclick={(e) => e.target === e.currentTarget && (viewLead = null)} role="dialog">
  <div class="modal modal-lg">
    <div class="modal-title"><i class="ti ti-eye"></i>View/Edit Lead</div>
    <div class="fgrid">
      <div class="fg"><label>Customer Name</label><input class="input" bind:value={viewLead.name} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg"><label>Mobile Number</label><input class="input" bind:value={viewLead.phone} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg"><label>Email</label><input class="input" bind:value={viewLead.email} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg"><label>Destination</label><input class="input" bind:value={viewLead.dest} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg">
        <label>Lead Source</label>
        <select class="input" bind:value={viewLead.src} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;">
          <option>Website</option><option>WhatsApp</option><option>Facebook</option>
          <option>Instagram</option><option>Referral</option><option>B2B Agent</option><option>Walk-in</option>
        </select>
      </div>
      <div class="fg">
        <label>Assigned Executive</label>
        <select class="input" bind:value={viewLead.exec} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;">
          {#each teamUsers as user}
            <option value={user.name}>{user.name}</option>
          {/each}
        </select>
      </div>
      <div class="fg"><label>Departure Date</label><input type="date" class="input" bind:value={viewLead.date} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg"><label>Budget (₹)</label><input class="input" bind:value={viewLead.budget} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;" /></div>
      <div class="fg">
        <label>Priority</label>
        <select class="input" bind:value={viewLead.pri} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;">
          <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
        </select>
      </div>
      <div class="fg full">
        <label>Status</label>
        <select class="input" bind:value={viewLead.status} style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px;">
          <option>New</option><option>Contacted</option><option>Quote Sent</option>
          <option>Follow-Up</option><option>Negotiation</option><option>Confirmed</option><option>Lost</option>
        </select>
      </div>
      <div class="fg full"><label>Notes</label><textarea class="input" bind:value={viewLead.notes} placeholder="No special requirements noted." style="width: 100%; border: 1px solid var(--border2); border-radius: 4px; padding: 8px; font-size: 13px; min-height: 80px;"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick={() => {
        onAction('update-lead', viewLead);
        viewLead = null;
      }} type="button"><i class="ti ti-device-floppy"></i>Save Changes</button>
      <button class="btn" onclick={() => viewLead = null} type="button">Cancel</button>
    </div>
  </div>
</div>
{/if}
