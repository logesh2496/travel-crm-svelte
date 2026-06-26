<script lang="ts">
  let { title, user, onAction } = $props<{
    title: string;
    user: any;
    onAction: (action: string) => void;
  }>();

  const TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    queries: 'Query / Lead Management',
    quotations: 'Quotation Management',
    quotepreview: 'Quotation Preview',
    itineraries: 'Itinerary Builder',
    estimation: 'Estimation Builder',
    bookings: 'Booking Management',
    followups: 'Follow-Up Management',
    invoices: 'Invoice Management',
    payments: 'Payment Management',
    'supplier-payments': 'Supplier Payment Management',
    b2b: 'B2B / B2C Management',
    suppliers: 'Supplier Management',
    masters: 'Master Management',
    communication: 'Client Communication',
    reports: 'Reports & Analytics',
    'duty-sheet': 'Daily Duty Sheet',
    users: 'User & Role Management',
    settings: 'Settings'
  };
</script>

<div class="topbar">
  <span class="tb-title" id="tbTitle">{TITLES[title] || title}</span>
  <div class="tb-actions">
    <button class="btn btn-gold btn-sm" onclick={() => onAction('new-query')} type="button">
      <i class="ti ti-plus"></i>New Query
    </button>
    <button class="icon-btn" id="notifBtn" onclick={() => onAction('notify')} type="button">
      <i class="ti ti-bell"></i>
    </button>
    <div class="sb-avatar" id="tbAv" style="width:32px;height:32px;font-size:11px">{user.avatar}</div>
  </div>
</div>
