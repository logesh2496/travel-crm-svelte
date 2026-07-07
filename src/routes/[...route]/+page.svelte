<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLeads, createLead, updateLead, type Lead } from '$lib/firebase/lead.db';
  import { createFollowup } from '$lib/firebase/followup.db';
  import Login from '$lib/components/Login.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import Modals from '$lib/components/Modals.svelte';
  import Dashboard from '$lib/components/pages/Dashboard.svelte';
  import LeadsPage from '$lib/components/pages/LeadsPage.svelte';
  import ItineraryBuilder from '$lib/components/pages/ItineraryBuilder.svelte';
  import OtherPages from '$lib/components/pages/OtherPages.svelte';
  import Settings from '$lib/components/pages/Settings.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/firebase/services';
  import { onAuthStateChanged, signOut } from 'firebase/auth';
  import { doc, onSnapshot } from 'firebase/firestore';
  import db from '$lib/firebase/db';
  import { getUser, getUsers, type AppUser } from '$lib/firebase/user.db';
  // App state
  let isLoggedIn = $state(false);
  let activePage = $derived($page.url.pathname === '/' ? 'dashboard' : $page.url.pathname.slice(1).split('/')[0]);
  let currentUser = $state<any>(null);
  let leads = $state<Lead[]>([]);
  let teamUsers = $state<AppUser[]>([]);

  // Modal control
  let openModalId = $state<string | null>(null);
  let pageData = $state<any>(null);

  // Toast notifications
  let showToast = $state(false);
  let toastMsg = $state('');
  let toastType = $state('success');
  let toastTimer: any;

  function triggerToast(msg: string, type = 'success') {
    clearTimeout(toastTimer);
    toastMsg = msg;
    toastType = type;
    showToast = true;
    toastTimer = setTimeout(() => {
      showToast = false;
    }, 3200);
  }

  // Load data from Firebase Firestore
  async function loadData() {
    try {
      const [fetchedLeads, fetchedUsers] = await Promise.all([
        fetchLeads(),
        getUsers()
      ]);
      leads = fetchedLeads;
      teamUsers = fetchedUsers;
    } catch (error) {
      console.error('Failed to load data from Firebase:', error);
      triggerToast('Connection to the server failed.', 'error');
    }
  }

  let unsubscribeSession: any = null;

  onMount(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User signed in
        const dbUser = await getUser(user.uid);
        if (dbUser) {
          let displayName = dbUser.name || 'User';
          let roles = dbUser.roles || [];
          let roleLbl = roles.join(', ');
          let avatar = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          currentUser = {
            uid: user.uid,
            name: displayName,
            role: roles[0] || 'User',
            roleLbl,
            email: dbUser.email,
            avatar,
            tenantId: dbUser.tenantId || 'default_tenant'
          };
          
          isLoggedIn = true;

          // Load data after successful login
          loadData();

          // Single Active Session Listener
          if (unsubscribeSession) unsubscribeSession();
          
          let isInitialSnapshot = true;
          unsubscribeSession = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const currentLocalSessionId = sessionStorage.getItem('activeSessionId');
              
              if (isInitialSnapshot) {
                isInitialSnapshot = false;
                return;
              }

              if (data.activeSessionId && currentLocalSessionId && data.activeSessionId !== currentLocalSessionId) {
                // Another device logged in
                triggerToast('Session active on another device. Logging out...', 'error');
                handleLogout();
              }
            }
          });
        }
      } else {
        // User signed out
        isLoggedIn = false;
        currentUser = null;
        if (unsubscribeSession) {
          unsubscribeSession();
          unsubscribeSession = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSession) unsubscribeSession();
    };
  });

  $effect(() => {
    if (activePage === 'leads' && $page.url.searchParams.get('action') === 'new') {
      openModalId = 'addQueryModal';
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl);
    }

    if (activePage === 'followups' && pageData?.action === 'new') {
      openModalId = 'addFUModal';
      const newData = { ...pageData };
      delete newData.action;
      pageData = newData;
    }
  });

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    isLoggedIn = false;
    currentUser = null;
    activePage = 'dashboard';
    pageData = null;
    sessionStorage.removeItem('activeSessionId');
    triggerToast('Logged out successfully', 'success');
  }

  function handleNavigate(pageId: string, data?: any) {
    let url = pageId === 'dashboard' ? '/' : `/${pageId}`;
    if (pageId === 'itineraries' && data?.leadId) {
      url += `?lead=${data.leadId}`;
    }
    goto(url, { keepFocus: true });
    pageData = data;
  }

  function handleAction(actionName: string, data?: any) {
    if (actionName === 'toast') {
      triggerToast(data.msg, data.type);
    } else if (actionName === 'new-query') {
      goto('/leads?action=new');
    } else if (actionName === 'notify') {
      triggerToast('No new notifications', 'info');
    } else if (actionName === 'update-lead') {
      const { leadId, ...updates } = data;
      try {
        updateLead(leadId, updates); // non-blocking update
        leads = leads.map(l => l.leadId === leadId ? { ...l, ...updates } : l);
        triggerToast('Lead updated successfully', 'success');
        
        if (updates.status === 'Confirmed') {
          const lead = leads.find(l => l.leadId === leadId);
          if (lead) {
            import('$lib/firebase/booking.db').then(({ createBooking }) => {
              createBooking({
                leadId: lead.leadId,
                customerName: lead.name || '',
                customerPhone: lead.phone || '',
                packageName: lead.dest || '',
                hotelName: '',
                travelDates: lead.date || '',
                pax: (lead as any).pax || '',
                totalAmount: parseInt(lead.budget?.replace(/[^0-9]/g, '') || '0'),
                paidAmount: 0,
                balanceAmount: parseInt(lead.budget?.replace(/[^0-9]/g, '') || '0'),
                status: 'Confirmed'
              }).then(() => {
                triggerToast('Booking auto-created', 'success');
              }).catch(err => {
                console.error('Failed to auto-create booking:', err);
              });
            });
          }
        }
      } catch (err) {
        console.error('Failed to update lead:', err);
        leads = leads.map(l => l.leadId === leadId ? { ...l, ...updates } : l);
        triggerToast('Lead updated locally', 'info');
      }
    }
  }

  async function handleModalSave(type: string, data: any) {
    openModalId = null;
    if (type === 'query') {
      const { leadData, action } = data;
      try {
        triggerToast('Saving lead to Firebase...', 'info');
        const newId = await createLead(leadData);
        leadData.leadId = newId;
        leads = [leadData, ...leads];
        
        if (action === 'save-quote') {
          triggerToast('Lead saved! Starting itinerary builder...', 'success');
          goto(`/itineraries?lead=${newId}`);
        } else {
          triggerToast('Query saved successfully!', 'success');
        }
      } catch (err) {
        console.error('Failed to create lead in Firestore:', err);
        triggerToast('Saved locally (Firestore error)', 'error');
        leadData.leadId = 'LD-24-' + (100 + leads.length);
        leads = [leadData, ...leads];
        
        if (action === 'save-quote') {
          goto(`/itineraries?lead=${leadData.leadId}`);
        }
      }
    } else if (type === 'followup') {
      try {
        await createFollowup({
          leadId: data.fuLead,
          date: data.fuDate,
          time: data.fuTime,
          type: data.fuType,
          exec: data.fuExec,
          notes: data.fuNotes,
          status: 'Pending'
        });
        triggerToast('Follow-up scheduled successfully!', 'success');
      } catch (err) {
        console.error('Failed to create followup:', err);
        triggerToast('Failed to schedule follow-up', 'error');
      }
    } else if (type === 'payment') {
      triggerToast('Payment recorded successfully!', 'success');
    } else if (type === 'user') {
      triggerToast('User employee added successfully!', 'success');
    }
  }
</script>

{#if !isLoggedIn}
  <Login />
{:else}
  <div id="crmApp" style="display: block;">
    <div class="shell">
      <Sidebar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        user={currentUser} 
        onLogout={handleLogout} 
      />
      <div class="main">
        
        {#if activePage === 'dashboard'}
          <Dashboard />
        {:else if activePage === 'queries' || activePage === 'leads'}
          <LeadsPage 
            leads={leads} 
            teamUsers={teamUsers}
            onNavigate={handleNavigate} 
            onOpenModal={(id) => openModalId = id} 
            onAction={handleAction} 
          />
        {:else if activePage === 'itineraries'}
          <ItineraryBuilder 
            leads={leads} 
            onNavigate={handleNavigate}
            onAction={handleAction} 
          />
        {:else if activePage === 'settings'}
          <Settings 
            user={currentUser}
            onAction={handleAction}
          />
        {:else}
          <OtherPages 
            activePage={activePage} 
            pageData={pageData}
            leads={leads}
            onNavigate={handleNavigate} 
            onOpenModal={(id) => openModalId = id} 
            onAction={handleAction} 
            user={currentUser}
          />
        {/if}
      </div>
    </div>
  </div>

  <Chat user={currentUser} />

  <Modals 
    openModalId={openModalId} 
    onClose={() => openModalId = null} 
    onSave={handleModalSave} 
    leads={leads}
    teamUsers={teamUsers}
    currentUser={currentUser}
    pageData={pageData}
  />
{/if}

<!-- Toast Alerts -->
<div id="toast" class={showToast ? 't-' + toastType + ' show' : 't-' + toastType}>
  <i class={showToast ? (toastType === 'success' ? 'ti ti-circle-check' : toastType === 'error' ? 'ti ti-circle-x' : 'ti ti-info-circle') : ''} id="toastIcon"></i>
  <span id="toastMsg">{toastMsg}</span>
</div>
