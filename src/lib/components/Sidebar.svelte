<script lang="ts">
  let { activePage, onNavigate, user, onLogout } = $props<{
    activePage: string;
    onNavigate: (page: string) => void;
    user: any;
    onLogout: () => void;
  }>();

  const navItems = [
    { label: 'Main', type: 'label', section: 'Main' },
    { label: 'Dashboard', id: 'dashboard', icon: 'ti-layout-dashboard', section: 'Main' },
    { label: 'Lead Management', id: 'leads', icon: 'ti-search', badge: 12, section: 'Main' },
    { label: 'Itinerary Builder', id: 'itineraries', icon: 'ti-map-route', section: 'Main' },
    { label: 'Booking Management', id: 'bookings', icon: 'ti-briefcase', section: 'Main' },
    { label: 'Follow-Ups', id: 'followups', icon: 'ti-calendar-event', badge: 5, section: 'Main' },
    
    { label: 'Finance', type: 'label', section: 'Finance' },
    { label: 'Invoice Management', id: 'invoices', icon: 'ti-file-invoice', section: 'Finance' },
    { label: 'Payment Management', id: 'payments', icon: 'ti-credit-card', section: 'Finance' },
    { label: 'Supplier Payments', id: 'supplier-payments', icon: 'ti-building-store', section: 'Finance' },
    
    { label: 'Relationships', type: 'label', section: 'Relationships' },
    { label: 'B2B / B2C Management', id: 'b2b', icon: 'ti-users-group', section: 'Relationships' },
    { label: 'Supplier Management', id: 'suppliers', icon: 'ti-truck', section: 'Relationships' },
    { label: 'Master Management', id: 'masters', icon: 'ti-database', section: 'Relationships' },
    
    { label: 'Communication', type: 'label', section: 'Communication' },
    { label: 'Client Communication', id: 'communication', icon: 'ti-message-circle', section: 'Communication' },
    
    { label: 'Reports', type: 'label', section: 'Reports' },
    { label: 'Reports & Analytics', id: 'reports', icon: 'ti-chart-bar', section: 'Reports' },
    { label: 'Daily Duty Sheet', id: 'duty-sheet', icon: 'ti-clipboard-list', section: 'Reports' },
    
    { label: 'Admin', type: 'label', section: 'Admin' },
    { label: 'User & Role Management', id: 'users', icon: 'ti-user-cog', section: 'Admin' },
    { label: 'Settings', id: 'settings', icon: 'ti-settings', section: 'Admin' }
  ];

  let visibleNavItems = $derived.by(() => {
    const roles = user?.roles || (user?.role ? [user.role] : []);
    const isAdmin = roles.includes('Admin');
    const isSales = roles.includes('Sales');
    const isOps = roles.includes('Operations');
    const isAccounts = roles.includes('Accounts');

    if (isAdmin) return navItems;

    let filtered = navItems.filter(item => {
      if (item.type === 'label') return true; // Keep labels for now, will filter out empty ones later
      
      let visible = false;
      if (isSales && item.section === 'Main' && item.id !== 'bookings') visible = true;
      if (isOps && (item.id === 'bookings' || item.section === 'Relationships')) visible = true;
      if (isAccounts && item.section === 'Finance') visible = true;
      
      return visible;
    });

    // Remove empty labels
    filtered = filtered.filter((item, index) => {
      if (item.type !== 'label') return true;
      // It's a label. Is there any non-label item after it before the next label?
      for (let i = index + 1; i < filtered.length; i++) {
        if (filtered[i].type === 'label') return false; // Found another label before any item
        if (filtered[i].type !== 'label') return true; // Found an item
      }
      return false; // Reached end without finding an item
    });

    return filtered;
  });
</script>

<div class="sidebar" id="sidebar">
  <div class="sb-brand">
    <div class="bi"><i class="ti ti-plane-tilt"></i></div>
    <div>
      <div class="bn">TravelCRM Pro</div>
      <div class="bv">v2.0 · <span id="sbRole">{user.role}</span></div>
    </div>
  </div>
  <div class="sb-nav">
    {#each visibleNavItems as item}
      {#if item.type === 'label'}
        <div class="sb-label">{item.label}</div>
      {:else}
        <button 
          class="nav-item" 
          class:active={activePage === item.id} 
          onclick={() => onNavigate(item.id!)}
          type="button"
          style="text-align: left; background: none; border: none; font: inherit; cursor: pointer; width: 100%; display: flex; align-items: center;"
        >
          <i class="ti {item.icon}"></i>
          <span style="flex-grow: 1;">{item.label}</span>
          <!-- {#if item.badge}
            <span class="nav-badge" id={item.id === 'leads' ? 'nb-queries' : ''}>{item.badge}</span>
          {/if} -->
        </button>
      {/if}
    {/each}
  </div>
  <div class="sb-user">
    <div class="sb-avatar" id="sbAv">{user.avatar}</div>
    <div>
      <div class="sb-uname" id="sbName">{user.name}</div>
      <div class="sb-urole" id="sbRoleLbl">{user.roleLbl}</div>
    </div>
    <button class="sb-logout" onclick={onLogout} type="button"><i class="ti ti-logout"></i></button>
  </div>
</div>
