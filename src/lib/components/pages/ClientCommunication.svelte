<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAgencySettings, saveAgencySettings, type AgencySettings } from '$lib/firebase/settings.db';
  import { fetchItineraries, type Itinerary } from '$lib/firebase/itinerary.db';
  import RichTextEditor from '../ui/RichTextEditor.svelte';
  import { render } from 'svelte-email';
  import DefaultEmailTemplate from '../emails/DefaultEmailTemplate.svelte';
  import ItineraryEmailTemplate from '../emails/ItineraryEmailTemplate.svelte';
  import type { ItineraryDay } from '../emails/ItineraryEmailTemplate.svelte';
  import { getFunctions, httpsCallable } from 'firebase/functions';

  let { user, onAction } = $props<{
    user: any;
    onAction: (actionName: string, data?: any) => void;
  }>();

  let activeCommTab = $state('email');
  let settings = $state<AgencySettings | null>(null);

  // Email state
  let emailTo = $state('');
  let emailSubj = $state('');
  let emailTplType = $state<'default' | 'itinerary'>('default');
  let emailMessage = $state('');
  let itineraryDays = $state<ItineraryDay[]>([]);
  let itineraries = $state<Itinerary[]>([]);
  let selectedItineraryId = $state<string>('');
  
  let includeHeader = $state(true);
  let includeFooter = $state(true);
  let customHeader = $state('');
  let customFooter = $state('');
  let isSending = $state(false);
  let isSavingTemplates = $state(false);

  // WhatsApp state
  let waTpl = $state('q');
  let waMsg = $state('');

  onMount(async () => {
    try {
      settings = await fetchAgencySettings(user?.tenantId);
      
      const defaultHeader = `
<div style="text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px;">
  <h2 style="color: #0ea5e9; margin: 0; font-size: 24px; font-weight: bold;">Travel CRM</h2>
  <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Your Gateway to the World</p>
</div>`;

      const defaultFooter = `
<div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #64748b; line-height: 1.6;">
  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">Travel CRM</p>
  <p style="margin: 4px 0;">123 Adventure Lane, Wanderlust City</p>
  <p style="margin: 4px 0;">+1 (555) 123-4567 &nbsp;|&nbsp; support@travelcrm.example.com</p>
  <p style="margin: 4px 0;"><a href="#" style="color: #0ea5e9; text-decoration: none;">www.travelcrm.example.com</a></p>
</div>`;

      customHeader = settings?.emailHeader || defaultHeader;
      customFooter = settings?.emailFooter || defaultFooter;
      itineraries = await fetchItineraries();
    } catch (e) {
      console.error(e);
    }
  });


    async function handleSendEmail() {
    if (!emailTo || !emailSubj) {
      onAction('toast', { msg: 'Please provide To and Subject.', type: 'error' });
      return;
    }

    isSending = true;
    try {
      if (emailTplType === 'itinerary' && selectedItineraryId) {
        const selected = itineraries.find(i => i.id === selectedItineraryId);
        if (selected) {
          itineraryDays = selected.days.map((d, i) => ({
            dayNumber: i + 1,
            title: d.title || `Day ${i + 1}`,
            description: d.activities?.join('\n') || ''
          }));
        }
      }

      // We don't save settings on send anymore. Templates are saved in the templates tab.

      let htmlOutput = '';
      if (emailTplType === 'default') {
        htmlOutput = render({
          template: DefaultEmailTemplate,
          props: {
            companyName: settings?.agencyName || 'TravelCRM',
            logoUrl: settings?.logoUrl || '',
            address: settings?.address || '',
            website: settings?.website || '',
            message: emailMessage,
            customHeader,
            customFooter,
            includeHeader,
            includeFooter
          }
        });
      } else {
        htmlOutput = render({
          template: ItineraryEmailTemplate,
          props: {
            companyName: settings?.agencyName || 'TravelCRM',
            logoUrl: settings?.logoUrl || '',
            address: settings?.address || '',
            website: settings?.website || '',
            greeting: emailMessage || 'Here is your upcoming itinerary!',
            days: itineraryDays,
            customHeader,
            customFooter,
            includeHeader,
            includeFooter
          }
        });
      }

      // 2. Call Cloud Function
      const functions = getFunctions();
      const sendEmailFn = httpsCallable(functions, 'sendEmail');
      
      await sendEmailFn({
        to: emailTo,
        subject: emailSubj,
        html: htmlOutput,
        tenantId: user?.tenantId || 'default_tenant'
      });

      onAction('toast', { msg: 'Email sent successfully!', type: 'success' });
      // Reset form
      emailTo = '';
      emailSubj = '';
      emailMessage = '';
      itineraryDays = [];
    } catch (e: any) {
      console.error(e);
      onAction('toast', { msg: e.message || 'Failed to send email.', type: 'error' });
    } finally {
      isSending = false;
    }
  }  async function handleSaveTemplates() {
    isSavingTemplates = true;
    try {
      if (!settings) {
        settings = await fetchAgencySettings(user?.tenantId) || {} as AgencySettings;
      }
      settings.emailHeader = customHeader;
      settings.emailFooter = customFooter;
      await saveAgencySettings(settings, user?.tenantId);
      onAction('toast', { msg: 'Templates saved successfully!', type: 'success' });
    } catch (e: any) {
      console.error(e);
      onAction('toast', { msg: 'Failed to save templates.', type: 'error' });
    } finally {
      isSavingTemplates = false;
    }
  }

</script>

<div class="page active" id="page-communication">
  <div class="ph"><h2>Client Communication</h2></div>
  <div class="tabs">
    <button class="tab" class:active={activeCommTab === 'email'} onclick={() => activeCommTab = 'email'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Email</button>
    <button class="tab" class:active={activeCommTab === 'whatsapp'} onclick={() => activeCommTab = 'whatsapp'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">WhatsApp</button>
    <button class="tab" class:active={activeCommTab === 'templates'} onclick={() => activeCommTab = 'templates'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Templates</button>
  </div>
  
  {#if activeCommTab === 'email'}
    <div id="comm-email" style="margin-top: 14px;">
      <div class="g21">
        <div class="card" style="grid-column: span 1;">
          <div class="card-title"><i class="ti ti-mail"></i>Compose Email</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="fg"><label for="eto">To</label><input id="eto" bind:value={emailTo} placeholder="client@email.com"></div>
            <div style="display:flex; align-items:center; justify-content: space-between; margin-bottom: 16px;">
              
              <div style="display:flex; align-items:center; gap: 12px;">
                <span style="font-weight: 500;">Mode:</span>
                
                <!-- Custom Segmented Control for Mode -->
                <div class="segmented-control">
                  <div class="segmented-control-bg" 
                       style={emailTplType === 'default' ? 'transform: translateX(0);' : 'transform: translateX(100%);'}></div>
                  
                  <button type="button" class="segmented-control-btn {emailTplType === 'default' ? 'active' : ''}"
                          onclick={() => { emailTplType = 'default'; emailSubj = ''; }}>
                    Default
                  </button>
                  <button type="button" class="segmented-control-btn {emailTplType === 'itinerary' ? 'active' : ''}"
                          onclick={() => { emailTplType = 'itinerary'; emailSubj = `Your Itinerary from ${settings?.agencyName || 'TravelCRM'}`; }}>
                    Itinerary
                  </button>
                </div>
              </div>

              <!-- Rightmost Include Header / Footer toggles -->
              <div style="display: flex; gap: 20px;">
                <label style="font-weight:500; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                  <button type="button" class="custom-switch {includeHeader ? 'on' : 'off'}"
                          role="switch" aria-checked={includeHeader} onclick={() => includeHeader = !includeHeader}>
                    <span aria-hidden="true" class="custom-switch-thumb {includeHeader ? 'on' : 'off'}"></span>
                  </button>
                  Include Header
                </label>
                <label style="font-weight:500; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                  <button type="button" class="custom-switch {includeFooter ? 'on' : 'off'}"
                          role="switch" aria-checked={includeFooter} onclick={() => includeFooter = !includeFooter}>
                    <span aria-hidden="true" class="custom-switch-thumb {includeFooter ? 'on' : 'off'}"></span>
                  </button>
                  Include Footer
                </label>
              </div>

            </div>
            
            <div class="fg"><label for="emailSubj">Subject</label><input id="emailSubj" bind:value={emailSubj}></div>
            
            <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: #fff; margin-bottom: 12px;">
              <div style="padding: 12px; border-bottom: 1px solid var(--border); background: #f8fafc;">
                <label style="font-weight:600; font-size: 14px;">Email Content</label>
              </div>
              <div style="padding: 12px;">
                 {#if emailTplType === 'itinerary'}
                   <div class="fg" style="margin-bottom: 12px;">
                     <label>Select Saved Itinerary</label>
                     <select bind:value={selectedItineraryId}>
                       <option value="">-- Choose Itinerary --</option>
                       {#each itineraries as itin}
                         <option value={itin.id}>{itin.title} ({itin.destination})</option>
                       {/each}
                     </select>
                   </div>
                 {/if}
                 <div class="fg">
                   <label>{emailTplType === 'itinerary' ? 'Greeting / Intro Text' : 'Message'}</label>
                   <RichTextEditor bind:html={emailMessage} />
                 </div>
              </div>

            </div>

            <div style="margin-top: 12px;">
              <button class="btn btn-primary btn-sm" onclick={handleSendEmail} type="button" disabled={isSending}>
                {#if isSending}
                  <i class="ti ti-loader"></i>Sending...
                {:else}
                  <i class="ti ti-send"></i>Send Email
                {/if}
              </button>
            </div>
          </div>
        </div>

        <div class="card" style="grid-column: span 1;">
           <div class="card-title"><i class="ti ti-eye"></i>Preview</div>
           <p style="font-size: 0.8rem; color: var(--text2); margin-bottom: 10px;">The email header and footer are automatically attached based on your Settings.</p>
           <div style="border: 1px solid var(--border); border-radius: var(--radius-md); background: #f6f9fc; padding: 16px; min-height: 400px; font-family: sans-serif;">
             <!-- Simplified Preview based on Template -->
             <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                {#if includeHeader}
                  {#if customHeader}
                    <div style="padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #eee;">
                      {@html customHeader}
                    </div>
                  {:else}
                    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 16px;">
                      {#if settings?.logoUrl}
                        <img src={settings.logoUrl} alt="Logo" style="max-height: 40px;">
                      {:else}
                        <h3 style="margin:0;">{settings?.agencyName || 'TravelCRM'}</h3>
                      {/if}
                    </div>
                  {/if}
                {/if}
                
                {#if emailTplType === 'default'}
                  <div style="white-space: pre-wrap; color: #525f7f;">{@html emailMessage || 'Start typing a message...'}</div>
                {:else}
                  <div style="white-space: pre-wrap; color: #333; text-align: center; margin-bottom: 20px;">{@html emailMessage || 'Here is your upcoming itinerary!'}</div>
                  {#each itineraryDays as day}
                    <div style="border: 1px solid #eee; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                      {#if day.imageUrl}
                        <img src={day.imageUrl} alt="Day img" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                      {/if}
                      <h4 style="margin: 0 0 8px 0;">Day {day.dayNumber}: {day.title || 'Untitled'}</h4>
                      {#if day.flight}
                        <div style="font-size: 13px; color: #555;">✈️ {day.flight}</div>
                      {/if}
                      {#if day.hotel}
                        <div style="font-size: 13px; color: #555;">🏨 {day.hotel}</div>
                      {/if}
                      <p style="font-size: 14px; color: #525f7f; margin: 8px 0 0 0; white-space: pre-wrap;">{day.description}</p>
                    </div>
                  {/each}
                {/if}

                {#if includeFooter}
                  {#if customFooter}
                    <div style="padding-top: 16px; margin-top: 16px; border-top: 1px solid #eee;">
                      {@html customFooter}
                    </div>
                  {:else}
                    <div style="text-align: center; border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px; font-size: 12px; color: #888;">
                      &copy; {new Date().getFullYear()} {settings?.agencyName || 'TravelCRM'}
                      {#if settings?.address}<br>{settings.address}{/if}
                      {#if settings?.website}<br>{settings.website}{/if}
                    </div>
                  {/if}
                {/if}
             </div>
           </div>
        </div>

      </div>
    </div>
  {:else if activeCommTab === 'templates'}
    <div id="comm-templates" style="margin-top: 14px;">
      <div class="g21">
        <div class="card" style="grid-column: span 1;">
          <div class="card-title"><i class="ti ti-template"></i>Email Templates</div>
          <p style="font-size: 0.85rem; color: var(--text2); margin-bottom: 16px;">Customize the default header and footer used in your client emails.</p>
          <div style="display:flex;flex-direction:column;gap:20px">
            <div class="fg">
              <label style="font-weight: 600; margin-bottom: 8px; display: block;">Header Template</label>
              <RichTextEditor bind:html={customHeader} />
              <p style="font-size: 0.8rem; color: var(--text2); margin-top: 4px;">Leave blank to use default settings header.</p>
            </div>
            <div class="fg">
              <label style="font-weight: 600; margin-bottom: 8px; display: block;">Footer Template</label>
              <RichTextEditor bind:html={customFooter} />
              <p style="font-size: 0.8rem; color: var(--text2); margin-top: 4px;">Leave blank to use default settings footer.</p>
            </div>
            <div style="margin-top: 8px;">
              <button class="btn btn-primary btn-sm" onclick={handleSaveTemplates} type="button" disabled={isSavingTemplates}>
                {#if isSavingTemplates}
                  <i class="ti ti-loader"></i>Saving...
                {:else}
                  <i class="ti ti-device-floppy"></i>Save Templates
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div id="comm-whatsapp" style="margin-top: 14px;">
      <div class="g21">
        <div class="card">
          <div class="card-title"><i class="ti ti-brand-whatsapp" style="color:#25D366"></i>WhatsApp Web Integrated</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="fg">
              <label for="waTpl">Template</label>
              <select id="waTpl" bind:value={waTpl}>
                <option value="q">Send Quotation</option>
                <option value="f">Follow-Up</option>
                <option value="p">Payment Reminder</option>
                <option value="c">Booking Confirmation</option>
                <option value="t">Travel Reminder</option>
              </select>
            </div>
            <div class="fg"><label for="waMsg">Message</label><textarea id="waMsg" rows="7" bind:value={waMsg}></textarea></div>
            <div><button class="btn btn-wa btn-sm" onclick={() => onAction('toast', { msg: 'Message sent via WhatsApp!', type: 'success' })} type="button"><i class="ti ti-send"></i>Send Now</button></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><i class="ti ti-device-mobile"></i>Preview</div>
          <div style="background:#e5ddd5;border-radius:var(--radius-lg);padding:16px">
            <div style="background:#fff;border-radius:12px 12px 12px 0;padding:12px;font-size:13px;line-height:1.6;box-shadow:0 1px 2px rgba(0,0,0,.1)">
              {@html waMsg.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom Segmented Control */
  .segmented-control {
    position: relative;
    display: flex;
    align-items: center;
    padding: 4px;
    background-color: #f1f5f9; /* slate-100 */
    border-radius: 8px;
  }
  .segmented-control-bg {
    position: absolute;
    left: 4px;
    top: 4px;
    bottom: 4px;
    width: calc(50% - 4px);
    border-radius: 6px;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0,0,0,0.05);
    transition: transform 300ms ease-in-out;
  }
  .segmented-control-btn {
    position: relative;
    z-index: 10;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 200ms;
    color: #64748b; /* slate-500 */
  }
  .segmented-control-btn:hover {
    color: #334155; /* slate-700 */
  }
  .segmented-control-btn.active {
    color: #0f172a; /* slate-900 */
  }

  /* Custom Toggle Switch */
  .custom-switch {
    position: relative;
    display: inline-flex;
    height: 20px;
    width: 36px;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 9999px;
    border: 2px solid transparent;
    transition: background-color 200ms ease-in-out;
  }
  .custom-switch:focus {
    outline: none;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #0ea5e9;
  }
  .custom-switch.on {
    background-color: #0ea5e9; /* sky-500 */
  }
  .custom-switch.off {
    background-color: #cbd5e1; /* slate-300 */
  }
  
  .custom-switch-thumb {
    pointer-events: none;
    display: inline-block;
    height: 16px;
    width: 16px;
    border-radius: 9999px;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: transform 200ms ease-in-out;
  }
  .custom-switch-thumb.on {
    transform: translateX(16px);
  }
  .custom-switch-thumb.off {
    transform: translateX(0);
  }
</style>
