<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchMasters, saveMaster, deleteMaster, type MasterRecord } from '$lib/firebase/master.db';

  let { agencyId, type, typeName } = $props<{
    agencyId: string;
    type: string;
    typeName: string;
  }>();

  let masters = $state<MasterRecord[]>([]);
  let isLoading = $state(true);
  let showForm = $state(false);
  
  let currentMaster = $state<Partial<MasterRecord>>({
    status: 'active',
    serviceType: ''
  });

  const loadMasters = async () => {
    isLoading = true;
    try {
      masters = await fetchMasters(agencyId, type);
    } catch (e) {
      console.error("Error loading masters:", e);
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    loadMasters();
  });

  // Re-fetch when type changes
  $effect(() => {
    if (type) {
      loadMasters();
      showForm = false;
    }
  });

  const handleEdit = (master: MasterRecord) => {
    currentMaster = { ...master };
    showForm = true;
  };

  const handleAdd = () => {
    currentMaster = {
      status: 'active',
      serviceType: ''
    };
    showForm = true;
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    try {
      const dataToSave: MasterRecord = {
        ...(currentMaster as MasterRecord),
        agencyId,
        type,
        name: currentMaster.name || '',
        status: currentMaster.status || 'active'
      };
      
      await saveMaster(dataToSave);
      await loadMasters();
      showForm = false;
    } catch (error) {
      console.error("Error saving master:", error);
      alert("Failed to save data. See console for details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteMaster(id);
      await loadMasters();
    } catch (error) {
      console.error("Error deleting master:", error);
    }
  };
</script>

<div class="master-container" style="margin-top: 14px;">
  {#if showForm}
    <div class="card form-card">
      <div class="card-title">
        {currentMaster.id ? 'Edit' : 'Add'} {typeName}
      </div>
      <form onsubmit={handleSave}>
        <div class="g21">
          <div class="fg">
            <label for="name">Name *</label>
            <input id="name" type="text" bind:value={currentMaster.name} required placeholder="Enter {typeName} name" />
          </div>
          <div class="fg">
            <label for="code">Code</label>
            <input id="code" type="text" bind:value={currentMaster.code} placeholder="Short code (optional)" />
          </div>
        </div>

        <div class="g21" style="margin-top: 12px;">
          <div class="fg">
            <label for="serviceType">Service Type</label>
            <select id="serviceType" bind:value={currentMaster.serviceType}>
              <option value="">Select Service (Optional)</option>
              <option value="Flight">Flight</option>
              <option value="Hotel">Hotel</option>
              <option value="Transfer">Transfer</option>
              <option value="Sightseeing">Sightseeing</option>
              <option value="Visa">Visa</option>
              <option value="Insurance">Insurance</option>
              <option value="General">General / All</option>
            </select>
          </div>
          <div class="fg">
            <label for="status">Status</label>
            <select id="status" bind:value={currentMaster.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="fg" style="margin-top: 12px;">
          <label for="desc">Description</label>
          <textarea id="desc" rows="3" bind:value={currentMaster.description} placeholder="Optional description or notes"></textarea>
        </div>

        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px;">
          <button type="submit" class="btn btn-primary btn-sm"><i class="ti ti-device-floppy"></i> Save</button>
          <button type="button" class="btn btn-sm" onclick={() => showForm = false}>Cancel</button>
        </div>
      </form>
    </div>
  {:else}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
      <h3 style="margin: 0; font-size: 16px;">{typeName} List</h3>
      <button class="btn btn-primary btn-sm" onclick={handleAdd}><i class="ti ti-plus"></i> Add New</button>
    </div>

    {#if isLoading}
      <div style="padding: 40px; text-align: center; color: var(--text2);">Loading data...</div>
    {:else if masters.length === 0}
      <div class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text2); background: var(--bg2); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
        <i class="ti ti-database" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px; display: block;"></i>
        <h4 style="margin-bottom: 4px; color: var(--text);">No Records Found</h4>
        <p style="font-size: 13px; margin-bottom: 16px;">Click the button above to add your first {typeName}.</p>
      </div>
    {:else}
      <table class="cost-table" style="width: 100%;">
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Service Type</th>
            <th>Status</th>
            <th style="width: 100px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each masters as master}
            <tr>
              <td class="td-strong">{master.name}</td>
              <td>{master.code || '-'}</td>
              <td>
                {#if master.serviceType}
                  <span class="badge b-blue">{master.serviceType}</span>
                {:else}
                  -
                {/if}
              </td>
              <td>
                {#if master.status === 'active'}
                  <span class="badge b-green">Active</span>
                {:else}
                  <span class="badge b-orange">Inactive</span>
                {/if}
              </td>
              <td>
                <div style="display: flex; gap: 4px;">
                  <button class="icon-btn" onclick={() => handleEdit(master)} title="Edit"><i class="ti ti-pencil"></i></button>
                  <button class="icon-btn" style="color: var(--danger)" onclick={() => handleDelete(master.id!)} title="Delete"><i class="ti ti-trash"></i></button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>

<style>
  .form-card {
    border: 1px solid var(--border);
    background: var(--bg2);
    max-width: 600px;
    margin-bottom: 20px;
  }
</style>
