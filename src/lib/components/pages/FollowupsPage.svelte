<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchFollowups, type Followup } from '$lib/firebase/followup.db';

  let { onOpenModal, onAction, refreshFollowups = 0 } = $props<{
    onOpenModal: (modalId: string) => void;
    onAction: (actionName: string, data?: any) => void;
    refreshFollowups?: number;
  }>();

  let followups = $state<Followup[]>([]);
  let loading = $state(true);

  async function loadFollowups() {
    loading = true;
    try {
      followups = await fetchFollowups();
    } catch (error) {
      console.error("Error fetching followups:", error);
      onAction('toast', { msg: 'Failed to load follow-ups', type: 'error' });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadFollowups();
  });

  let prevRefresh = $state(refreshFollowups);
  $effect(() => {
    if (refreshFollowups !== undefined && refreshFollowups !== prevRefresh) {
      prevRefresh = refreshFollowups;
      loadFollowups();
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalThisMonth = $derived(followups.filter(f => {
    const d = new Date(f.date + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length);

  let pendingToday = $derived(followups.filter(f => {
    const d = new Date(f.date + 'T00:00:00');
    return f.status !== 'Completed' && d.getTime() === today.getTime();
  }).length);

  let completedToday = $derived(followups.filter(f => {
    const d = new Date(f.date + 'T00:00:00');
    return f.status === 'Completed' && d.getTime() === today.getTime();
  }).length);

  let overdue = $derived(followups.filter(f => {
    const d = new Date(f.date + 'T00:00:00');
    return f.status !== 'Completed' && d.getTime() < today.getTime();
  }).length);

  let overdueAndToday = $derived(followups.filter(f => {
    const time = f.timestamp || new Date(f.date + 'T00:00:00').getTime();
    return f.status !== 'Completed' && time <= today.getTime();
  }).sort((a, b) => (a.timestamp || new Date(a.date + 'T00:00:00').getTime()) - (b.timestamp || new Date(b.date + 'T00:00:00').getTime())));

  let upcoming = $derived(followups.filter(f => {
    const time = f.timestamp || new Date(f.date + 'T00:00:00').getTime();
    return f.status !== 'Completed' && time > today.getTime();
  }).sort((a, b) => (a.timestamp || new Date(a.date + 'T00:00:00').getTime()) - (b.timestamp || new Date(b.date + 'T00:00:00').getTime())));

  function getMonthShort(dateStr: string) {
    return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
  }

  function getDay(dateStr: string) {
    return new Date(dateStr).getDate();
  }

  function getTypeIcon(type: string) {
    if (type.toLowerCase().includes('call')) return 'ti-phone';
    if (type.toLowerCase().includes('whatsapp')) return 'ti-brand-whatsapp';
    if (type.toLowerCase().includes('meeting')) return 'ti-users';
    if (type.toLowerCase().includes('email')) return 'ti-mail';
    return 'ti-message';
  }
</script>

<div class="page active" id="page-followups">
  <div class="ph">
    <h2>Follow-Up Management</h2>
    <button class="btn btn-primary btn-sm" onclick={() => onOpenModal('addFUModal')} type="button">
      <i class="ti ti-plus"></i>Schedule Follow-Up
    </button>
  </div>
  
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="kpi k-blue"><div class="kpi-label">Total This Month</div><div class="kpi-value">{totalThisMonth}</div></div>
    <div class="kpi k-orange"><div class="kpi-label">Pending Today</div><div class="kpi-value" style="color:var(--warning)">{pendingToday}</div></div>
    <div class="kpi k-green"><div class="kpi-label">Completed Today</div><div class="kpi-value" style="color:var(--success)">{completedToday}</div></div>
    <div class="kpi k-teal"><div class="kpi-label">Overdue</div><div class="kpi-value" style="color:var(--danger)">{overdue}</div></div>
  </div>

  {#if loading}
    <div style="padding: 20px; text-align: center; color: var(--text3);">Loading follow-ups...</div>
  {:else}
    <div class="g2">
      <div class="card">
        <div class="card-title"><i class="ti ti-alert-circle" style="color:var(--danger)"></i>Overdue & Today</div>
        {#if overdueAndToday.length === 0}
          <div style="padding: 10px 0; color: var(--text3); font-size: 13px;">No overdue or pending follow-ups today.</div>
        {/if}
        {#each overdueAndToday as fu}
          {@const isOverdue = new Date(fu.date).getTime() < today.getTime()}
          <div class="fc">
            <div class="fc-date" style={isOverdue ? "background:var(--danger-light)" : ""}>
              <div class="fc-day" style={isOverdue ? "color:var(--danger)" : ""}>{getDay(fu.date)}</div>
              <div class="fc-mon" style={isOverdue ? "color:var(--danger-text)" : ""}>{getMonthShort(fu.date)}</div>
            </div>
            <div class="fc-info">
              <div class="fc-name">{fu.leadId}</div>
              <div class="fc-desc"><i class="ti {getTypeIcon(fu.type)}" style="font-size:11px"></i> {fu.type} — {fu.notes}</div>
              <div style="font-size:11px;color:var(--text3)">{fu.exec} · {fu.time}</div>
            </div>
            <div style="display:flex;gap:4px;margin-left:auto;margin-right:10px">
              <button class="icon-btn" title="Complete" onclick={() => onAction('complete-followup', fu.id)} type="button">
                <i class="ti ti-check" style="color:var(--success)"></i>
              </button>
              <button class="icon-btn" title="Remove" onclick={() => onAction('delete-followup', fu.id)} type="button">
                <i class="ti ti-trash" style="color:var(--danger)"></i>
              </button>
            </div>
            {#if isOverdue}
              <span class="badge b-red">Overdue</span>
            {:else}
              <span class="badge b-amber">Pending</span>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="card">
        <div class="card-title"><i class="ti ti-calendar"></i>Upcoming Follow-ups</div>
        {#if upcoming.length === 0}
          <div style="padding: 10px 0; color: var(--text3); font-size: 13px;">No upcoming follow-ups scheduled.</div>
        {/if}
        {#each upcoming as fu}
          <div class="fc">
            <div class="fc-date">
              <div class="fc-day">{getDay(fu.date)}</div>
              <div class="fc-mon">{getMonthShort(fu.date)}</div>
            </div>
            <div class="fc-info">
              <div class="fc-name">{fu.leadId}</div>
              <div class="fc-desc"><i class="ti {getTypeIcon(fu.type)}" style="font-size:11px"></i> {fu.type} — {fu.notes}</div>
              <div style="font-size:11px;color:var(--text3)">{fu.exec} · {fu.time}</div>
            </div>
            <div style="display:flex;gap:4px;margin-left:auto;margin-right:10px">
              <button class="icon-btn" title="Complete" onclick={() => onAction('complete-followup', fu.id)} type="button">
                <i class="ti ti-check" style="color:var(--success)"></i>
              </button>
              <button class="icon-btn" title="Remove" onclick={() => onAction('delete-followup', fu.id)} type="button">
                <i class="ti ti-trash" style="color:var(--danger)"></i>
              </button>
            </div>
            <span class="badge b-blue">Scheduled</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
