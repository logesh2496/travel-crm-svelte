<script lang="ts">
  import { onMount } from 'svelte';
  import { getClients, addClient, updateClient, deleteClient, type BizClient } from '$lib/firebase/b2b.db';

  let { onAction = () => {} }: { onAction?: (action: string, data?: any) => void } = $props();

  let activeBizTab: 'b2b' | 'b2c' = $state('b2b');
  let clients: BizClient[] = $state([]);
  let loading = $state(true);

  // Modal State
  let showModal = $state(false);
  let isEditing = $state(false);
  let currentId: string | null = $state(null);
  
  // Form Data
  let formData = $state({
    type: 'b2b' as 'b2b' | 'b2c',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    country: '',
    status: 'active' as 'active' | 'inactive',
    gstNumber: '',
    taxId: '',
    commissionRate: 0,
    creditLimit: 0,
    notes: ''
  });

  const loadClients = async () => {
    loading = true;
    try {
      clients = await getClients();
    } catch (e) {
      console.error(e);
      onAction('toast', { msg: 'Error loading clients', type: 'error' });
    }
    loading = false;
  };

  onMount(() => {
    loadClients();
  });

  let filteredClients = $derived(clients.filter(c => c.type === activeBizTab));

  const resetForm = () => {
    formData = {
      type: activeBizTab,
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsapp: '',
      city: '',
      country: '',
      status: 'active',
      gstNumber: '',
      taxId: '',
      commissionRate: 0,
      creditLimit: 0,
      notes: ''
    };
    isEditing = false;
    currentId = null;
  };

  const openModal = (client?: BizClient) => {
    if (client) {
      isEditing = true;
      currentId = client.id!;
      formData = { ...client } as any;
    } else {
      resetForm();
      formData.type = activeBizTab; // default to current tab
    }
    showModal = true;
  };

  const closeModal = () => {
    showModal = false;
    resetForm();
  };

  const saveClient = async () => {
    try {
      if (isEditing && currentId) {
        await updateClient(currentId, formData);
        onAction('toast', { msg: 'Client updated successfully', type: 'success' });
      } else {
        await addClient(formData);
        onAction('toast', { msg: 'Client added successfully', type: 'success' });
      }
      closeModal();
      loadClients();
    } catch (e) {
      console.error(e);
      onAction('toast', { msg: 'Error saving client', type: 'error' });
    }
  };

  const confirmDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
        onAction('toast', { msg: 'Client deleted', type: 'info' });
        loadClients();
      } catch (e) {
        console.error(e);
        onAction('toast', { msg: 'Error deleting client', type: 'error' });
      }
    }
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };
</script>

<div class="page active" id="page-b2b">
  <div class="ph" style="display:flex; justify-content:space-between; align-items:center;">
    <h2>B2B / B2C Management</h2>
    <button class="btn btn-primary" onclick={() => openModal()}><i class="ti ti-plus"></i> New {activeBizTab === 'b2b' ? 'Agent' : 'Client'}</button>
  </div>
  
  <div class="tabs">
    <button class="tab" class:active={activeBizTab === 'b2b'} onclick={() => activeBizTab = 'b2b'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">
      B2B Agents ({clients.filter(c => c.type === 'b2b').length})
    </button>
    <button class="tab" class:active={activeBizTab === 'b2c'} onclick={() => activeBizTab = 'b2c'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">
      B2C Clients ({clients.filter(c => c.type === 'b2c').length})
    </button>
  </div>
  
  {#if loading}
    <div style="padding: 20px; text-align: center; color: var(--text2);">Loading...</div>
  {:else if filteredClients.length === 0}
    <div style="padding: 40px; text-align: center; background: var(--bg); border-radius: var(--radius); border: 1px dashed var(--border);">
      <div style="font-size: 32px; color: var(--text2); margin-bottom: 10px;"><i class="ti ti-users"></i></div>
      <div style="font-weight: 500; margin-bottom: 5px;">No {activeBizTab === 'b2b' ? 'Agents' : 'Clients'} Found</div>
      <div style="color: var(--text2); font-size: 14px; margin-bottom: 15px;">You haven't added any {activeBizTab === 'b2b' ? 'B2B agents' : 'B2C clients'} yet.</div>
      <button class="btn btn-primary btn-sm" onclick={() => openModal()}>Add {activeBizTab === 'b2b' ? 'Agent' : 'Client'}</button>
    </div>
  {:else}
    <div class="g3" id="agentCards">
      {#each filteredClients as client (client.id)}
        <div class="agent-card">
          <div class="agent-top">
            <div class="agent-avatar">{getInitials(client.companyName || client.contactPerson)}</div>
            <div>
              <div style="font-size:14px;font-weight:700">{client.type === 'b2b' && client.companyName ? client.companyName : client.contactPerson}</div>
              <div style="font-size:12px;color:var(--text2)">{client.city}{client.city && client.country ? ', ' : ''}{client.country} &middot; {client.type === 'b2b' ? 'B2B Agent' : 'B2C Client'}</div>
            </div>
            <span class="badge {client.status === 'active' ? 'b-green' : 'b-red'}" style="margin-left:auto; text-transform: capitalize;">{client.status}</span>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:10px">
            <div style="background:var(--bg2);padding:8px;border-radius:var(--radius)">
              <div style="color:var(--text2)">Total Business</div>
              <div style="font-weight:700;color:var(--teal)">{formatCurrency(client.totalBusiness || 0)}</div>
            </div>
            {#if client.type === 'b2b'}
              <div style="background:var(--bg2);padding:8px;border-radius:var(--radius)">
                <div style="color:var(--text2)">Commission</div>
                <div style="font-weight:700;color:var(--blue)">{client.commissionRate || 0}%</div>
              </div>
            {/if}
          </div>
          
          <div style="font-size:12px; color:var(--text2); margin-bottom:12px; display: flex; flex-direction: column; gap: 4px;">
            <div><i class="ti ti-user" style="margin-right:4px;"></i> {client.contactPerson}</div>
            <div><i class="ti ti-mail" style="margin-right:4px;"></i> {client.email}</div>
            <div><i class="ti ti-phone" style="margin-right:4px;"></i> {client.phone}</div>
          </div>
          
          <div style="display:flex;gap:6px; margin-top: auto; border-top: 1px solid var(--border); padding-top: 12px;">
            <button class="btn btn-xs btn-outline" onclick={() => openModal(client)} type="button"><i class="ti ti-edit"></i> Edit</button>
            <button class="btn btn-xs btn-outline" style="color: var(--red); border-color: var(--red);" onclick={() => confirmDelete(client.id!)} type="button"><i class="ti ti-trash"></i></button>
            <button class="btn btn-xs btn-teal" style="margin-left: auto;" onclick={() => onAction('toast', { msg: `Emailed ${client.contactPerson}!`, type: 'success' })} type="button"><i class="ti ti-mail"></i> Email</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay open" onclick={(e) => e.target === e.currentTarget && closeModal()} role="dialog">
    <div class="modal" style="width: 600px; max-width: 95%;">
      <div class="modal-title">
        <i class="ti ti-{isEditing ? 'edit' : 'plus'}"></i>{isEditing ? 'Edit' : 'New'} {formData.type === 'b2b' ? 'B2B Agent' : 'B2C Client'}
      </div>
      
      <div class="fgrid" style="padding: 20px;">
        <div style="grid-column: 1 / -1; display: flex; gap: 15px; margin-bottom: 10px;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="radio" name="clientType" value="b2b" bind:group={formData.type}> B2B Agent
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="radio" name="clientType" value="b2c" bind:group={formData.type}> B2C Client
          </label>
        </div>

        {#if formData.type === 'b2b'}
          <div class="fg full">
            <label for="companyName">Company Name *</label>
            <input type="text" id="companyName" bind:value={formData.companyName} placeholder="E.g. Sunrise Travels">
          </div>
        {/if}

        <div class="fg">
          <label for="contactPerson">Contact Person *</label>
          <input type="text" id="contactPerson" bind:value={formData.contactPerson} placeholder="Full Name">
        </div>
        
        <div class="fg">
          <label for="email">Email Address *</label>
          <input type="email" id="email" bind:value={formData.email} placeholder="email@example.com">
        </div>

        <div class="fg">
          <label for="phone">Phone Number *</label>
          <input type="text" id="phone" bind:value={formData.phone} placeholder="+91 9876543210">
        </div>
        
        <div class="fg">
          <label for="whatsapp">WhatsApp Number</label>
          <input type="text" id="whatsapp" bind:value={formData.whatsapp} placeholder="+91 9876543210">
        </div>
        
        <div class="fg">
          <label for="city">City</label>
          <input type="text" id="city" bind:value={formData.city} placeholder="E.g. Mumbai">
        </div>
        
        <div class="fg">
          <label for="country">Country</label>
          <input type="text" id="country" bind:value={formData.country} placeholder="E.g. India">
        </div>
        
        <div class="fg">
          <label for="status">Status</label>
          <select id="status" bind:value={formData.status}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {#if formData.type === 'b2b'}
          <div class="fg">
            <label for="gstNumber">GST Number</label>
            <input type="text" id="gstNumber" bind:value={formData.gstNumber} placeholder="GSTIN...">
          </div>
          <div class="fg">
            <label for="commissionRate">Commission Rate (%)</label>
            <input type="number" id="commissionRate" bind:value={formData.commissionRate} placeholder="E.g. 10" min="0" max="100">
          </div>
          <div class="fg">
            <label for="creditLimit">Credit Limit (₹)</label>
            <input type="number" id="creditLimit" bind:value={formData.creditLimit} placeholder="E.g. 50000">
          </div>
        {/if}
        
        <div class="fg full">
          <label for="notes">Notes</label>
          <textarea id="notes" bind:value={formData.notes} placeholder="Any additional details..." rows="3"></textarea>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-outline" onclick={closeModal}>Cancel</button>
        <button class="btn btn-primary" onclick={saveClient} disabled={!formData.contactPerson || !formData.email || !formData.phone || (formData.type === 'b2b' && !formData.companyName)}>
          {isEditing ? 'Update' : 'Save'} {formData.type === 'b2b' ? 'Agent' : 'Client'}
        </button>
      </div>
    </div>
  </div>
{/if}
