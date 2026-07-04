<script lang="ts">
  import { onMount } from "svelte";
  import { getUsers, addUser, updateUser, deleteUser, type AppUser } from "../../firebase/user.db";

  let users = $state<AppUser[]>([]);
  let isLoading = $state(true);

  // Modal State
  let isAddUserModalOpen = $state(false);
  let uName = $state('');
  let uEmail = $state('');
  let uPhone = $state('');
  let uPass = $state('');
  // roles will be a multiple select or checkboxes.
  let selectedRoles = $state<string[]>(['Sales']);

  const availableRoles = ['Admin', 'Sales', 'Operations', 'Accounts'];

  onMount(async () => {
    await fetchUsers();
  });

  async function fetchUsers() {
    isLoading = true;
    users = await getUsers();
    isLoading = false;
  }

  function toggleRole(role: string) {
    if (selectedRoles.includes(role)) {
      selectedRoles = selectedRoles.filter(r => r !== role);
    } else {
      selectedRoles = [...selectedRoles, role];
    }
  }

  async function handleSaveUser() {
    if (!uName || !uEmail || !uPass || selectedRoles.length === 0) {
      alert("Name, Email, Password, and at least one Role are required.");
      return;
    }
    
    if (users.length >= 5 && !users.find(u => u.email === uEmail)) {
      alert("Maximum limit of 5 users reached.");
      return;
    }

    try {
      await addUser({
        name: uName,
        email: uEmail,
        roles: selectedRoles,
        status: 'Active'
      }, uPass);
      
      alert(`User created! They can log in with password: ${uPass}`);
      
      closeModal();
      await fetchUsers();
    } catch (e) {
      alert("Error saving user.");
    }
  }

  function closeModal() {
    isAddUserModalOpen = false;
    uName = '';
    uEmail = '';
    uPhone = '';
    uPass = '';
    selectedRoles = ['Sales'];
  }
</script>

<div class="page active" id="page-users">
  <div class="ph">
    <h2>User & Role Management</h2>
    <button class="btn btn-primary btn-sm" onclick={() => isAddUserModalOpen = true} type="button">
      <i class="ti ti-plus"></i>Add User
    </button>
  </div>
  <div class="g2" style="margin-top: 14px;">
    <div class="card">
      <div class="card-title"><i class="ti ti-users"></i>All Users ({users.length}/5)</div>
      <div class="table-wrap" style="border:none">
        {#if isLoading}
          <div style="padding: 20px; text-align: center;">Loading users...</div>
        {:else}
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roles</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr>
                  <td><div class="td-strong">{user.name}</div></td>
                  <td>
                    {#each user.roles as role}
                      <span class="badge {role === 'Admin' ? 'b-gold' : role === 'Sales' ? 'b-blue' : 'b-purple'} " style="margin-right: 4px;">{role}</span>
                    {/each}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span class="badge {user.status === 'Active' ? 'b-green' : 'b-red'}">{user.status}</span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="4" style="text-align: center;">No users found. Please add an Admin.</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if isAddUserModalOpen}
  <div class="modal-overlay open" onclick={(e) => e.target === e.currentTarget && closeModal()} role="dialog">
    <div class="modal">
      <div class="modal-title"><i class="ti ti-user-plus"></i>Add New User</div>
      <div class="fgrid">
        <div class="fg"><label for="uName">Full Name *</label><input id="uName" bind:value={uName} placeholder="Employee name"></div>
        <div class="fg"><label for="uEmail">Email *</label><input type="email" id="uEmail" bind:value={uEmail} placeholder="email@travelcrm.com"></div>
        <div class="fg"><label for="uPhone">Phone</label><input id="uPhone" bind:value={uPhone} placeholder="+91 98765 43210"></div>
        <div class="fg"><label for="uPass">Password *</label><input type="password" id="uPass" bind:value={uPass} placeholder="••••••••"></div>
        <div class="fg full">
          <label>Assign Roles *</label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 5px;">
            {#each availableRoles as r}
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: normal;">
                <input type="checkbox" checked={selectedRoles.includes(r)} onchange={() => toggleRole(r)}>
                {r}
              </label>
            {/each}
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick={handleSaveUser} type="button"><i class="ti ti-user-check"></i>Create User</button>
        <button class="btn" onclick={closeModal} type="button">Cancel</button>
      </div>
    </div>
  </div>
{/if}
