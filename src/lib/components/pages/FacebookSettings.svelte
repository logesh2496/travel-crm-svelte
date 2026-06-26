<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchFacebookIntegrations, saveFacebookIntegration, deleteFacebookIntegration, type FacebookIntegration } from '$lib/firebase/facebook.db';
	import { PUBLIC_FACEBOOK_APP_ID } from '$env/static/public';

  let { user, onAction } = $props<{
    user: any;
    onAction: (action: string, data?: any) => void;
  }>();

  let integrations = $state<FacebookIntegration[]>([]);
  let isLoading = $state(true);

  // We assume the user's agency/company ID is their role or something similar for this demo.
  // In a real multi-tenant app, this would be user.tenantId or user.companyId.
  const tenantId = user?.tenantId || 'default_tenant';

  onMount(async () => {
    await loadIntegrations();

    // @ts-ignore
    window.fbAsyncInit = function() {
      // @ts-ignore
      FB.init({
        appId      : PUBLIC_FACEBOOK_APP_ID,
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0'
      });
      // @ts-ignore
      FB.AppEvents.logPageView();   
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.head.appendChild(js);
    }
  });

  async function loadIntegrations() {
    isLoading = true;
    try {
      integrations = await fetchFacebookIntegrations(tenantId);
    } catch (err) {
      console.error("Failed to fetch integrations", err);
      onAction('toast', { msg: 'Failed to load Facebook settings', type: 'error' });
    } finally {
      isLoading = false;
    }
  }

  async function linkWithFacebook() {
    // @ts-ignore
    if (typeof FB === 'undefined') {
      onAction('toast', { msg: 'Facebook SDK not loaded yet', type: 'error' });
      return;
    }

    // @ts-ignore
    FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        
        fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`)
          .then(res => res.json())
          .then(async (data) => {
            if (data.data && data.data.length > 0) {
              for (const page of data.data) {
                const integration: FacebookIntegration = {
                  pageId: page.id,
                  pageName: page.name,
                  tenantId: tenantId,
                  accessToken: page.access_token || accessToken,
                  linkedBy: user.name,
                  linkedAt: new Date().toISOString(),
                  status: 'active'
                };
                await saveFacebookIntegration(integration);
              }
              onAction('toast', { msg: 'Successfully linked Facebook pages', type: 'success' });
              await loadIntegrations();
            } else {
              onAction('toast', { msg: 'No Facebook pages found in this account', type: 'info' });
            }
          })
          .catch(error => {
            console.error("Facebook API error:", error);
            onAction('toast', { msg: 'Failed to fetch Facebook pages', type: 'error' });
          });
      } else {
        console.error("User cancelled login or did not fully authorize.");
        onAction('toast', { msg: 'Facebook login cancelled', type: 'error' });
      }
    }, {scope: 'pages_show_list,pages_read_engagement,leads_retrieval'});
  }

  async function unlinkPage(pageId: string) {
    if (confirm("Are you sure you want to unlink this page? Leads will no longer be imported.")) {
      try {
        await deleteFacebookIntegration(pageId);
        integrations = integrations.filter(i => i.pageId !== pageId);
        onAction('toast', { msg: 'Page unlinked successfully', type: 'success' });
      } catch (err) {
        console.error("Failed to unlink", err);
        onAction('toast', { msg: 'Failed to unlink page', type: 'error' });
      }
    }
  }
</script>



<div id="page-facebook" style="margin-top: 2rem;">
  <div class="ph">
    <h2>Connect Your Facebook Page</h2>
  </div>

  <div class="card p-lg mb-lg">
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px;">
      <div>
        <h3 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="ti ti-brand-facebook" style="color: #1877F2; font-size: 1.5rem;"></i>
          Link your Facebook Page for Auto Leads
        </h3>
        <p class="text-secondary" style="line-height: 1.6; margin: 0;">
          Easily connect your Facebook or Instagram Page to our CRM system. Start receiving leads generated through Instant Form Ads directly into your dashboard. This eliminates manual work and ensures you never miss a lead.
        </p>
      </div>
      
      <div>
        <button class="btn btn-primary" onclick={linkWithFacebook} style="padding: 0.5rem 1.25rem; font-weight: 500;">
          <i class="ti ti-plug"></i> Connect Meta Account
        </button>
      </div>

      <div class="text-sm text-secondary" style="background: var(--bg-alt); padding: 1.25rem; border-radius: 8px; border-left: 4px solid var(--primary); display: flex; gap: 0.75rem; align-items: flex-start;">
        <i class="ti ti-info-circle text-primary" style="font-size: 1.25rem; flex-shrink: 0; margin-top: 2px;"></i>
        <div style="line-height: 1.5;">
          After logging into Facebook, your page name will appear below. Once linked, any new leads from your connected pages will automatically flow into the CRM.
        </div>
      </div>
    </div>
  </div>

  <div class="card p-0">
    {#if isLoading}
      <div class="p-lg text-center text-secondary">Loading integrations...</div>
    {:else if integrations.length === 0}
      <div class="p-lg text-center text-secondary">
        <p>No Facebook pages linked yet.</p>
      </div>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Page ID</th>
              <th>Page Name</th>
              <th>Status</th>
              <th>Last Updated By</th>
              <th>Linked At</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each integrations as int}
              <tr>
                <td>{int.pageId}</td>
                <td class="fw-500">{int.pageName}</td>
                <td>
                  <span class="badge" style="background: {int.status === 'active' ? '#e6f4ea; color: #1e8e3e' : '#fce8e6; color: #d93025'}">
                    {int.status.toUpperCase()}
                  </span>
                </td>
                <td>{int.linkedBy}</td>
                <td class="text-secondary">{new Date(int.linkedAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-icon" title="Unlink Page" style="color: var(--danger);" onclick={() => unlinkPage(int.pageId)}>
                    <i class="ti ti-unlink"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
