<script lang="ts">
  import { Chart, registerables } from 'chart.js';
  import { onMount } from 'svelte';
  import { fetchDashboardStats, fetchRecentActivities, fetchTopExecutives, type DashboardStats, type Activity, type SalesExec } from '$lib/firebase/dashboard.db';

  Chart.register(...registerables);

  let dashCanvas = $state<HTMLCanvasElement>();
  let srcCanvas = $state<HTMLCanvasElement>();
  let dashChart: Chart | undefined;
  let srcChart: Chart | undefined;

  let stats = $state<DashboardStats | null>(null);
  let activities = $state<Activity[]>([]);
  let executives = $state<SalesExec[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const [fetchedStats, fetchedActivities, fetchedExecutives] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivities(),
        fetchTopExecutives()
      ]);
      stats = fetchedStats;
      activities = fetchedActivities;
      executives = fetchedExecutives;
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    if (stats && !loading) {
      if (dashCanvas) {
        if (dashChart) dashChart.destroy();
        dashChart = new Chart(dashCanvas, {
          type: 'bar',
          data: {
            labels: stats.monthlyTrends.map(t => t.month),
            datasets: [
              {
                label: 'Queries',
                data: stats.monthlyTrends.map(t => t.queries),
                backgroundColor: 'rgba(37,99,235,.2)',
                borderColor: '#2563eb',
                borderWidth: 2,
                borderRadius: 4
              },
              {
                label: 'Revenue (₹L)',
                data: stats.monthlyTrends.map(t => t.revenue),
                backgroundColor: 'rgba(13,124,110,.8)',
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 10 } }
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
              }
            }
          }
        });
      }

      if (srcCanvas) {
        if (srcChart) srcChart.destroy();
        const sources = stats.leadSources;
        srcChart = new Chart(srcCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Website', 'WhatsApp', 'Facebook', 'Referral', 'B2B Agents'],
            datasets: [{
              data: [sources.Website || 0, sources.WhatsApp || 0, sources.Facebook || 0, sources.Referral || 0, sources.B2B_Agents || 0],
              backgroundColor: ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#ea580c'],
              borderWidth: 3,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '62%'
          }
        });
      }
    }

    return () => {
      dashChart?.destroy();
      srcChart?.destroy();
    };
  });

  const getSourcePercentage = (val: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  const getActIcon = (type: string) => {
    switch (type) {
      case 'query': return 'ai-blue ti-user-plus';
      case 'quote': return 'ai-teal ti-file-text';
      case 'booking': return 'ai-green ti-check';
      case 'payment': return 'ai-purple ti-credit-card';
      case 'voucher': return 'ai-amber ti-building-store';
      default: return 'ai-blue ti-activity';
    }
  };

  const timeAgo = (isoString: string) => {
    const d = new Date(isoString);
    const diff = Math.floor((new Date().getTime() - d.getTime()) / 60000); // mins
    if (diff < 60) return `${diff} mins ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs} hrs ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };
</script>

<div class="page active" id="page-dashboard">
  <div class="ph"><h2>Dashboard</h2></div>
  {#if loading}
    <div style="padding: 24px; text-align: center; color: var(--gray-500);">
      Loading dashboard...
    </div>
  {:else if stats}
    {@const totalSources = Object.values(stats.leadSources).reduce((a, b) => a + b, 0)}
    <div class="kpi-grid">
      <div class="kpi k-blue">
        <div class="kpi-label"><i class="ti ti-users"></i>Total Queries</div>
        <div class="kpi-value">{stats.kpis.totalQueries}</div>
      </div>
      <div class="kpi k-teal">
        <div class="kpi-label"><i class="ti ti-user-plus"></i>New Queries</div>
        <div class="kpi-value">{stats.kpis.newQueries}</div>
      </div>
      <div class="kpi k-gold">
        <div class="kpi-label"><i class="ti ti-file-text"></i>Quotes Sent</div>
        <div class="kpi-value">{stats.kpis.quotesSent}</div>
      </div>
      <div class="kpi k-green">
        <div class="kpi-label"><i class="ti ti-check-circle"></i>Confirmed</div>
        <div class="kpi-value">{stats.kpis.confirmed}</div>
      </div>
      <div class="kpi k-purple">
        <div class="kpi-label"><i class="ti ti-currency-rupee"></i>Revenue (Month)</div>
        <div class="kpi-value">₹{stats.kpis.revenueMonth}L</div>
      </div>
      <div class="kpi k-orange">
        <div class="kpi-label"><i class="ti ti-clock"></i>Pending Follow-Ups</div>
        <div class="kpi-value">{stats.kpis.pendingFollowUps}</div>
      </div>
    </div>

    <div class="g21">
      <div class="card">
        <div class="card-title"><i class="ti ti-chart-bar"></i>Monthly Query Trend & Revenue</div>
        <div style="position:relative;height:210px"><canvas bind:this={dashCanvas}></canvas></div>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-chart-donut"></i>Lead Sources</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <span style="font-size:10px;display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;background:#2563eb;border-radius:2px;display:inline-block"></span>
            Website {getSourcePercentage(stats.leadSources.Website, totalSources)}%
          </span>
          <span style="font-size:10px;display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;background:#16a34a;border-radius:2px;display:inline-block"></span>
            WhatsApp {getSourcePercentage(stats.leadSources.WhatsApp, totalSources)}%
          </span>
          <span style="font-size:10px;display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;background:#d97706;border-radius:2px;display:inline-block"></span>
            Facebook {getSourcePercentage(stats.leadSources.Facebook, totalSources)}%
          </span>
          <span style="font-size:10px;display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;background:#7c3aed;border-radius:2px;display:inline-block"></span>
            Referral {getSourcePercentage(stats.leadSources.Referral, totalSources)}%
          </span>
          <span style="font-size:10px;display:flex;align-items:center;gap:4px">
            <span style="width:8px;height:8px;background:#ea580c;border-radius:2px;display:inline-block"></span>
            B2B Agents {getSourcePercentage(stats.leadSources.B2B_Agents, totalSources)}%
          </span>
        </div>
        <div style="position:relative;height:160px"><canvas bind:this={srcCanvas}></canvas></div>
      </div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-title"><i class="ti ti-activity"></i>Recent Activities</div>
        <div class="act-list">
          {#if activities.length === 0}
            <div style="padding: 12px; font-size: 13px; color: var(--gray-500);">No recent activities.</div>
          {:else}
            {#each activities as act}
              <div class="act-item">
                <div class="act-icon {getActIcon(act.type).split(' ')[0]}">
                  <i class="ti {getActIcon(act.type).split(' ')[1]}"></i>
                </div>
                <div>
                  <div class="act-text">{act.text}</div>
                  <div class="act-time">{timeAgo(act.timestamp)} · {act.source} · {act.user}</div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="card">
        <div class="card-title"><i class="ti ti-trophy"></i>Top 5 Sales Executives</div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px">
          {#if executives.length === 0}
            <div style="padding: 12px; font-size: 13px; color: var(--gray-500);">No executive data yet.</div>
          {:else}
            {@const maxRevenue = Math.max(...executives.map(e => e.revenue), 1)}
            {#each executives as exec}
              <div>
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
                  <span><strong>{exec.name}</strong></span>
                  <span style="font-weight:700;color:var(--teal)">₹{exec.revenue}L · {exec.bookings} bookings</span>
                </div>
                <div class="prog">
                  <div class="prog-fill" style="width:{(exec.revenue / maxRevenue) * 100}%"></div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
