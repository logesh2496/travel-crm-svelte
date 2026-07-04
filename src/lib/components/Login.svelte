<script lang="ts">
  import { getUser, updateUser } from '$lib/firebase/user.db';
  import { auth } from '$lib/firebase/services';
  import { signInWithEmailAndPassword } from 'firebase/auth';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);

  async function handleLogin() {
    isLoading = true;
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      
      const dbUser = await getUser(uid);
      
      if (!dbUser) {
        alert("User record not found in system");
        auth.signOut();
        isLoading = false;
        return;
      }

      // Generate session ID for single active session
      const sessionId = crypto.randomUUID();
      sessionStorage.setItem('activeSessionId', sessionId);
      await updateUser(uid, { activeSessionId: sessionId });

      // Note: We don't call onLogin here anymore, as we will rely on onAuthStateChanged in the layout
      
    } catch (e: any) {
      console.error(e);
      alert('Login failed: ' + e.message);
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
    <form class="lform" onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <div>
        <label for="lEmail">Email</label>
        <input type="email" id="lEmail" bind:value={email} placeholder="Enter your email" required>
      </div>
      <div>
        <label for="lPass">Password</label>
        <input type="password" id="lPass" bind:value={password} placeholder="••••••••" required>
      </div>
      <button class="btn-login" type="submit" disabled={isLoading}>
        {#if isLoading}
          Logging in...
        {:else}
          <i class="ti ti-login"></i> Sign In
        {/if}
      </button>
    </form>
    <div class="login-hint" style="margin-top: 20px;">Secure Access Only</div>
  </div>
</div>
