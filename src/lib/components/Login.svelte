<script lang="ts">
  import { getUsers } from '$lib/firebase/user.db';

  let { onLogin } = $props<{ onLogin: (user: any) => void }>();

  let email = $state('admin@travelcrm.com');
  let password = $state('password');
  let selectedRole = $state('Admin');
  let isLoading = $state(false);

  const roles = [
    { name: 'Admin', email: 'admin@travelcrm.com' },
    { name: 'Sales', email: 'sales@travelcrm.com' },
    { name: 'Operations', email: 'ops@travelcrm.com' },
    { name: 'Accounts', email: 'accounts@travelcrm.com' }
  ];

  function quickLogin(roleName: string, roleEmail: string) {
    email = roleEmail;
    selectedRole = roleName;
  }

  async function handleLogin() {
    isLoading = true;
    try {
      const users = await getUsers();
      const dbUser = users.find(u => u.email === email);

      let displayName = dbUser?.name || 'Amit Kumar';
      let roles = dbUser?.roles || [selectedRole];
      let roleLbl = roles.join(', ');
      let avatar = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      onLogin({
        email,
        name: displayName,
        roles: roles, // this provides the roles array to App/Sidebar
        roleLbl,
        avatar
      });
    } catch (e) {
      console.error(e);
      alert('Login failed');
    }
    isLoading = false;
  }
</script>

<div id="loginPage" style="display: flex;">
  <div class="login-card">
    <div class="login-logo">
      <div class="licon"><i class="ti ti-plane-tilt"></i></div>
      <h1>TravelCRM Pro</h1>
      <p>Complete Travel Agency Management System v2.0</p>
    </div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:10px;font-weight:600">Quick Login as:</p>
    <div class="login-roles">
      {#each roles as r}
        <button 
          class="role-pill" 
          class:active={selectedRole === r.name}
          onclick={() => quickLogin(r.name, r.email)}
          type="button"
          style="text-align: left; background: none; border: none; font: inherit; cursor: pointer; width: 100%;"
        >
          <div class="rn">{r.name}</div>
          <div class="re">{r.email}</div>
        </button>
      {/each}
    </div>
    <form class="lform" onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <div>
        <label for="lEmail">Email</label>
        <input type="email" id="lEmail" bind:value={email}>
      </div>
      <div>
        <label for="lPass">Password</label>
        <input type="password" id="lPass" bind:value={password}>
      </div>
      <button class="btn-login" type="submit" disabled={isLoading}>
        {#if isLoading}
          Logging in...
        {:else}
          <i class="ti ti-login"></i> Sign In
        {/if}
      </button>
    </form>
    <div class="login-hint">Demo password: <strong>password</strong> for all roles</div>
  </div>
</div>
