<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAgencySettings, saveAgencySettings, type AgencySettings } from '$lib/firebase/settings.db';
  import FacebookSettings from './FacebookSettings.svelte';

  let { user, onAction } = $props<{
    user: any;
    onAction: (actionName: string, data?: any) => void;
  }>();

  let settings = $state<AgencySettings>({
    agencyName: '',
    gstNumber: ''
  });
  let isLoading = $state(true);
  
  const tenantId = user?.tenantId || 'default_tenant';

  onMount(async () => {
    try {
      settings = await fetchAgencySettings(tenantId);
    } catch (error) {
      console.error('Failed to load settings:', error);
      onAction('toast', { msg: 'Failed to load settings', type: 'error' });
    } finally {
      isLoading = false;
    }
  });

  async function handleSaveSettings() {
    try {
      await saveAgencySettings(settings, tenantId);
      onAction('toast', { msg: 'Settings saved!', type: 'success' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      onAction('toast', { msg: 'Failed to save settings', type: 'error' });
    }
  }
</script>

<div class="page active" id="page-settings">
  <div class="ph">
    <h2>Settings</h2>
    <button class="btn btn-primary btn-sm" onclick={handleSaveSettings} type="button" disabled={isLoading}>
      <i class="ti ti-device-floppy"></i>Save Configuration
    </button>
  </div>
  
  <div class="g2" style="margin-top: 14px; margin-bottom: 24px;">
    <div class="card">
      <div class="card-title"><i class="ti ti-building"></i>Agency Configuration</div>
      {#if isLoading}
        <div style="padding: 1rem; color: var(--text2);">Loading settings...</div>
      {:else}
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="fg">
            <label for="aname">Agency Name</label>
            <input id="aname" bind:value={settings.agencyName}>
          </div>
          <div class="fg">
            <label for="agst">GST / Tax Number</label>
            <input id="agst" bind:value={settings.gstNumber}>
          </div>
          <div class="fg">
            <label for="alogo">Logo URL</label>
            <input id="alogo" bind:value={settings.logoUrl} placeholder="https://example.com/logo.png">
          </div>
          <div class="fg">
            <label for="aaddr">Company Address</label>
            <textarea id="aaddr" rows="2" bind:value={settings.address} placeholder="123 Travel Street..."></textarea>
          </div>
          <div class="fg">
            <label for="aweb">Website</label>
            <input id="aweb" bind:value={settings.website} placeholder="https://www.travelcrm.com">
          </div>
        </div>
      {/if}
    </div>

    <!-- SMTP Settings, only visible for admin -->
    {#if user?.role === 'Admin'}
    <div class="card">
      <div class="card-title"><i class="ti ti-mail"></i>SMTP Email Settings</div>
      <p style="font-size: 0.85rem; color: var(--text2); margin-bottom: 12px;">Configure the email server to send emails to clients.</p>
      {#if isLoading}
        <div style="padding: 1rem; color: var(--text2);">Loading settings...</div>
      {:else}
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="fg">
            <label for="smtp-host">SMTP Host</label>
            <input id="smtp-host" bind:value={settings.smtpSettings!.host} placeholder="smtp.gmail.com">
          </div>
          <div class="fg">
            <label for="smtp-port">SMTP Port</label>
            <input id="smtp-port" bind:value={settings.smtpSettings!.port} placeholder="465">
          </div>
          <div class="fg">
            <label for="smtp-user">Email Username</label>
            <input id="smtp-user" bind:value={settings.smtpSettings!.user} placeholder="your-email@gmail.com">
          </div>
          <div class="fg">
            <label for="smtp-pass">Email Password (App Password)</label>
            <input id="smtp-pass" type="password" bind:value={settings.smtpSettings!.pass} placeholder="Enter password or app password">
          </div>
        </div>
      {/if}
    </div>
    {/if}
  </div>

  <!-- Embed Facebook Settings here so they belong to the Settings page -->
  <FacebookSettings {user} {onAction} />
</div>
