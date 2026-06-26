<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLeads, createLead, updateLead, type Lead } from '$lib/firebase/lead.db';
  import { createFollowup } from '$lib/firebase/followup.db';
  import Login from '$lib/components/Login.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import Modals from '$lib/components/Modals.svelte';
  import Dashboard from '$lib/components/pages/Dashboard.svelte';
  import QueriesPage from '$lib/components/pages/QueriesPage.svelte';
  import ItineraryBuilder from '$lib/components/pages/ItineraryBuilder.svelte';
  import OtherPages from '$lib/components/pages/OtherPages.svelte';

  // App state
  let isLoggedIn = $state(false);
  let activePage = $state('dashboard');
  let currentUser = $state({ name: 'Amit Kumar', role: 'Admin', roleLbl: 'Administrator', email: 'admin@travelcrm.com', avatar: 'AK' });
  let leads = $state<Lead[]>([]);

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

  // Load leads from Firebase Firestore
  async function loadLeads() {
    try {
      leads = await fetchLeads();
      triggerToast('Connected to Firebase successfully', 'success');
    } catch (error) {
      console.error('Failed to load leads from Firebase:', error);
      triggerToast('Firebase connection failed, loading mock data', 'error');
      // Mock data fallback if database fails
      leads = [
        { id: 'LD-24-100', name: 'Priya Sharma', phone: '+91 98765 43210', dest: 'Maldives', date: '2026-07-15', budget: '₹1,72,000', src: 'Website', exec: 'Ravi Kumar', pri: 'Urgent', status: 'New' },
        { id: 'LD-24-099', name: 'Gupta Family', phone: '+91 98765 43211', dest: 'Dubai', date: '2026-06-28', budget: '₹2,10,000', src: 'WhatsApp', exec: 'Sneha Patel', pri: 'High', status: 'New' },
        { id: 'LD-24-098', name: 'Vikram Singh', phone: '+91 98765 43212', dest: 'Europe', date: '2026-08-01', budget: '₹5,40,000', src: 'Website', exec: 'Ravi Kumar', pri: 'Normal', status: 'Quote Sent' },
        { id: 'LD-24-097', name: 'Meena Agarwal', phone: '+91 98765 43213', dest: 'Singapore', date: '2026-07-20', budget: '₹1,42,000', src: 'Facebook', exec: 'Amit Joshi', pri: 'Normal', status: 'Follow-Up' },
        { id: 'LD-24-096', name: 'Arjun Patel', phone: '+91 98765 43214', dest: 'Bali', date: '2026-07-10', budget: '₹2,35,000', src: 'Instagram', exec: 'Divya Nair', pri: 'Normal', status: 'Negotiation' },
        { id: 'LD-24-095', name: 'Sunita Rao', phone: '+91 98765 43215', dest: 'Thailand', date: '2026-08-05', budget: '₹98,000', src: 'Referral', exec: 'Karan Mehta', pri: 'Low', status: 'Confirmed' },
        { id: 'LD-24-094', name: 'Deepak Nair', phone: '+91 98765 43216', dest: 'Maldives', date: '2026-07-15', budget: '₹1,80,000', src: 'Website', exec: 'Ravi Kumar', pri: 'High', status: 'Confirmed' },
        { id: 'LD-24-093', name: 'Kapoor Family', phone: '+91 98765 43217', dest: 'Kashmir', date: '2026-06-30', budget: '₹82,000', src: 'Walk-in', exec: 'Karan Mehta', pri: 'Normal', status: 'Follow-Up' },
        { id: 'LD-24-092', name: 'Sanjay Mehta', phone: '+91 98765 43218', dest: 'Mauritius', date: '2026-07-25', budget: '₹2,80,000', src: 'B2B Agent', exec: 'Sneha Patel', pri: 'High', status: 'Confirmed' },
        { id: 'LD-24-091', name: 'Anitha Kumar', phone: '+91 98765 43219', dest: 'Andaman', date: '2026-07-02', budget: '₹72,000', src: 'Phone Call', exec: 'Ravi Kumar', pri: 'Normal', status: 'New' },
        { id: 'LD-24-090', name: 'Rajan Pillai', phone: '+91 98765 43220', dest: 'Switzerland', date: '2026-07-12', budget: '₹5,40,000', src: 'Website', exec: 'Amit Joshi', pri: 'Urgent', status: 'New' },
        { id: 'LD-24-089', name: 'Geeta Sharma', phone: '+91 98765 43221', dest: 'Australia', date: '2026-08-10', budget: '₹3,80,000', src: 'Referral', exec: 'Sneha Patel', pri: 'Normal', status: 'New' }
      ];
    }
  }

  onMount(() => {
    loadLeads();
  });

  function handleLogin(user: any) {
    currentUser = user;
    isLoggedIn = true;
    triggerToast('Logged in successfully', 'success');
  }

  function handleLogout() {
    isLoggedIn = false;
    activePage = 'dashboard';
    pageData = null;
    triggerToast('Logged out successfully', 'success');
  }

  function handleNavigate(page: string, data?: any) {
    activePage = page;
    pageData = data;
  }

  function handleAction(actionName: string, data?: any) {
    if (actionName === 'toast') {
      triggerToast(data.msg, data.type);
    } else if (actionName === 'new-query') {
      activePage = 'queries';
      setTimeout(() => {
        openModalId = 'addQueryModal';
      }, 50);
    } else if (actionName === 'notify') {
      triggerToast('No new notifications', 'info');
    } else if (actionName === 'update-lead') {
      const { id, ...updates } = data;
      try {
        updateLead(id, updates); // non-blocking update
        leads = leads.map(l => l.id === id ? { ...l, ...updates } : l);
        triggerToast('Lead updated successfully', 'success');
      } catch (err) {
        console.error('Failed to update lead:', err);
        leads = leads.map(l => l.id === id ? { ...l, ...updates } : l);
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
        leadData.id = newId;
        leads = [leadData, ...leads];
        
        if (action === 'save-quote') {
          triggerToast('Lead saved! Starting quote builder...', 'success');
          activePage = 'quotations';
        } else {
          triggerToast('Query saved successfully!', 'success');
        }
      } catch (err) {
        console.error('Failed to create lead in Firestore:', err);
        triggerToast('Saved locally (Firestore error)', 'error');
        leadData.id = 'LD-24-' + (100 + leads.length);
        leads = [leadData, ...leads];
        
        if (action === 'save-quote') {
          activePage = 'quotations';
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
  <Login onLogin={handleLogin} />
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
        {:else if activePage === 'queries'}
          <QueriesPage 
            leads={leads} 
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
        {:else}
          <OtherPages 
            activePage={activePage} 
            pageData={pageData}
            leads={leads}
            onNavigate={handleNavigate} 
            onOpenModal={(id) => openModalId = id} 
            onAction={handleAction} 
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
  />
{/if}

<!-- Toast Alerts -->
<div id="toast" class={showToast ? 't-' + toastType + ' show' : 't-' + toastType}>
  <i class={showToast ? (toastType === 'success' ? 'ti ti-circle-check' : toastType === 'error' ? 'ti ti-circle-x' : 'ti ti-info-circle') : ''} id="toastIcon"></i>
  <span id="toastMsg">{toastMsg}</span>
</div>
