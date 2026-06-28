<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchMasters, saveMaster, deleteMaster, type MasterRecord } from '$lib/firebase/master.db';

  let { agencyId } = $props<{
    agencyId: string;
  }>();

  let destinations = $state<MasterRecord[]>([]);
  let isLoading = $state(true);
  let showForm = $state(false);
  
  let currentDest = $state<Partial<MasterRecord>>({
    status: 'active',
    customData: {
      icon: '🏝',
      region: ''
    }
  });

  const loadDestinations = async () => {
    isLoading = true;
    try {
      destinations = await fetchMasters(agencyId, 'destination');
    } catch (e) {
      console.error("Error loading destinations:", e);
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    loadDestinations();
  });

  const handleEdit = (dest: MasterRecord) => {
    currentDest = { ...dest, customData: { ...dest.customData } };
    showForm = true;
  };

  const handleAdd = () => {
    currentDest = {
      status: 'active',
      customData: {
        icon: '🌍',
        region: ''
      }
    };
    showForm = true;
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    try {
      const dataToSave: MasterRecord = {
        ...(currentDest as MasterRecord),
        agencyId,
        type: 'destination',
        name: currentDest.name || '',
        status: currentDest.status || 'active',
        customData: currentDest.customData || {}
      };
      
      await saveMaster(dataToSave);
      await loadDestinations();
      showForm = false;
    } catch (error) {
      console.error("Error saving destination:", error);
      alert("Failed to save data.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    try {
      await deleteMaster(id);
      await loadDestinations();
    } catch (error) {
      console.error("Error deleting destination:", error);
    }
  };
</script>

<div class="master-container">
  {#if showForm}
    <div class="card form-card" style="margin-top: 14px;">
      <div class="card-title">
        {currentDest.id ? 'Edit' : 'Add'} Destination
      </div>
      <form onsubmit={handleSave}>
        <div class="g21">
          <div class="fg">
            <label for="destName">Destination Name *</label>
            <input id="destName" type="text" bind:value={currentDest.name} required placeholder="e.g. Maldives" />
          </div>
          <div class="fg">
            <label for="destRegion">Region</label>
            <input id="destRegion" type="text" bind:value={currentDest.customData!.region} placeholder="e.g. Indian Ocean" />
          </div>
        </div>

        <div class="g21" style="margin-top: 12px;">
          <div class="fg">
            <label for="destIcon">Emoji Icon</label>
            <input id="destIcon" type="text" bind:value={currentDest.customData!.icon} placeholder="e.g. 🏝" style="font-size: 20px; width: 80px;" />
          </div>
          <div class="fg">
            <label for="destStatus">Status</label>
            <select id="destStatus" bind:value={currentDest.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px;">
          <button type="submit" class="btn btn-primary btn-sm"><i class="ti ti-device-floppy"></i> Save</button>
          <button type="button" class="btn btn-sm" onclick={() => showForm = false}>Cancel</button>
        </div>
      </form>
    </div>
  {:else}
    <div class="ph" style="padding-bottom: 12px; border-bottom: 1px solid var(--border);">
      <h3>Destination Management</h3>
      <button class="btn btn-primary btn-sm" onclick={handleAdd}><i class="ti ti-plus"></i> Add New</button>
    </div>

    {#if isLoading}
      <div style="padding: 40px; text-align: center; color: var(--text2);">Loading data...</div>
    {:else if destinations.length === 0}
      <div class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text2); background: var(--bg2); border: 1px dashed var(--border); border-radius: var(--radius-lg); margin-top: 14px;">
        <i class="ti ti-map-pin" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px; display: block;"></i>
        <h4 style="margin-bottom: 4px; color: var(--text);">No Destinations Found</h4>
        <p style="font-size: 13px; margin-bottom: 16px;">Click the button above to add your first destination.</p>
      </div>
    {:else}
      <div class="g3" style="margin-top: 14px;">
        {#each destinations as dest}
          <div class="card card-sm dest-card" style="display:flex; justify-content: space-between; align-items: center; gap: 12px; position: relative;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size:28px">{dest.customData?.icon || '📍'}</div>
              <div>
                <div style="font-weight:700">{dest.name}</div>
                <div style="font-size:12px;color:var(--text2)">
                  {dest.customData?.region || 'No region'}
                  {#if dest.status === 'inactive'}<span style="color: var(--orange);"> · Inactive</span>{/if}
                </div>
              </div>
            </div>
            
            <div class="dest-actions">
              <button class="icon-btn" onclick={() => handleEdit(dest)} title="Edit"><i class="ti ti-pencil"></i></button>
              <button class="icon-btn" style="color: var(--danger)" onclick={() => handleDelete(dest.id!)} title="Delete"><i class="ti ti-trash"></i></button>
            </div>
          </div>
        {/each}
      </div>
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
  .dest-card {
    transition: all 0.2s;
  }
  .dest-card:hover {
    border-color: var(--teal);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .dest-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .dest-card:hover .dest-actions {
    opacity: 1;
  }
</style>
