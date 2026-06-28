<script lang="ts">
  import { onMount } from "svelte";
  import { getSuppliers, addSupplier, type Supplier } from "../../firebase/supplier.db";

  let suppliers = $state<Supplier[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    await fetchSuppliers();
  });

  async function fetchSuppliers() {
    isLoading = true;
    suppliers = await getSuppliers();
    isLoading = false;
  }

  let isAddSupplierModalOpen = $state(false);

  // Form fields
  let sName = $state('');
  let sServiceType = $state('Hotel');
  let sContactPerson = $state('');
  let sEmail = $state('');
  let sMobile = $state('');
  let sLandline = $state('');
  let sStatus = $state('Active');
  let sBankDetails = $state('');

  function openModal() {
    isAddSupplierModalOpen = true;
  }

  function closeModal() {
    isAddSupplierModalOpen = false;
    // reset form
    sName = '';
    sServiceType = 'Hotel';
    sContactPerson = '';
    sEmail = '';
    sMobile = '';
    sLandline = '';
    sStatus = 'Active';
    sBankDetails = '';
  }

  async function handleSaveSupplier() {
    if (!sName || !sServiceType) {
      alert("Supplier Name and Service Type are required.");
      return;
    }

    try {
      await addSupplier({
        name: sName,
        serviceType: sServiceType,
        contactPerson: sContactPerson,
        email: sEmail,
        mobile: sMobile,
        landline: sLandline,
        status: sStatus,
        bankDetails: sBankDetails
      });

      closeModal();
      await fetchSuppliers();
    } catch (e) {
      alert("Error saving supplier.");
    }
  }

  function onAction(action: string, data: any) {
    if (action === 'toast') {
      alert(data.msg); // basic fallback, in real app would use a toast system
    }
  }
</script>

<div class="page active" id="page-suppliers">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <div class="ph" style="margin-bottom: 0;"><h2>Supplier Management</h2></div>
    <button class="btn btn-primary" onclick={openModal} type="button">
      <i class="ti ti-plus"></i> Add New Supplier
    </button>
  </div>
  
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Type</th>
          <th>Contact Person</th>
          <th>Contact Info</th>
          <th>Bank Details</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each suppliers as s}
          <tr>
            <td><div class="td-strong">{s.name}</div></td>
            <td>
              <span class="badge {s.serviceType === 'Hotel' ? 'b-teal' : s.serviceType === 'Flight' ? 'b-blue' : 'b-gray'}">
                {s.serviceType}
              </span>
            </td>
            <td>{s.contactPerson || '-'}</td>
            <td>
              <div style="font-size: 13px;">
                {#if s.email}<div>{s.email}</div>{/if}
                {#if s.mobile}<div>{s.mobile}</div>{/if}
                {#if s.landline}<div>{s.landline}</div>{/if}
              </div>
            </td>
            <td>
              <div style="font-size: 13px; max-width: 200px; white-space: normal;">
                {s.bankDetails || '-'}
              </div>
            </td>
            <td>
              <span class="badge {s.status === 'Active' ? 'b-green' : 'b-red'}">
                {s.status}
              </span>
            </td>
            <td>
              <button class="icon-btn" onclick={() => onAction('toast', { msg: `Emailed ${s.name}!`, type: 'success' })} type="button" title="Email Supplier">
                <i class="ti ti-mail"></i>
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" style="text-align: center; padding: 20px;">No suppliers found. Add one to get started.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if isAddSupplierModalOpen}
  <div class="modal-overlay open" onclick={(e) => e.target === e.currentTarget && closeModal()} role="dialog">
    <div class="modal" style="width: 600px; max-width: 95%;">
      <div class="modal-title"><i class="ti ti-building"></i>Add New Supplier</div>
      <div class="fgrid">
        <div class="fg"><label for="sName">Supplier Name *</label><input id="sName" bind:value={sName} placeholder="E.g. Anantara Hotels"></div>
        <div class="fg">
          <label for="sServiceType">Service Type *</label>
          <select id="sServiceType" bind:value={sServiceType}>
            <option value="Hotel">Hotel</option>
            <option value="Flight">Flight</option>
            <option value="Transport">Transport</option>
            <option value="Visa Service">Visa Service</option>
            <option value="Activity">Activity / Tour</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div class="fg"><label for="sContactPerson">Contact Person</label><input id="sContactPerson" bind:value={sContactPerson} placeholder="Name of contact person"></div>
        <div class="fg"><label for="sEmail">Email</label><input type="email" id="sEmail" bind:value={sEmail} placeholder="email@supplier.com"></div>
        
        <div class="fg"><label for="sMobile">Mobile</label><input id="sMobile" bind:value={sMobile} placeholder="+91 98765 43210"></div>
        <div class="fg"><label for="sLandline">Landline</label><input id="sLandline" bind:value={sLandline} placeholder="022-12345678"></div>
        
        <div class="fg">
          <label for="sStatus">Status</label>
          <select id="sStatus" bind:value={sStatus}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        
        <div class="fg full">
          <label for="sBankDetails">Bank Details</label>
          <textarea id="sBankDetails" bind:value={sBankDetails} placeholder="Bank Name, Account Number, IFSC, etc." rows="3"></textarea>
        </div>
      </div>
      
      <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button class="btn btn-outline" onclick={closeModal} type="button">Cancel</button>
        <button class="btn btn-primary" onclick={handleSaveSupplier} type="button">Save Supplier</button>
      </div>
    </div>
  </div>
{/if}
