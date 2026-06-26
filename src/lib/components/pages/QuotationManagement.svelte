<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchQuotations, type Quotation } from '../../firebase/quotation.db';
  import { fetchLeads, type Lead } from '../../firebase/lead.db';

  let { onNavigate, onAction, pageData } = $props<{
    onNavigate: (page: string, data?: any) => void;
    onAction: (actionName: string, data?: any) => void;
    pageData?: any;
  }>();

  // state variables for Quotation Page
  let quoteCurrency = $state('INR ₹');
  let qPkg = $state('');
  let qHotel = $state('');
  let qH = $state(0);
  let qF = $state(0);
  let qS = $state(0);
  let qV = $state(0);
  let qT = $state(0);
  let qM = $state(0);
  let qI = $state(0);
  let qMk = $state(0);
  let qGst = $state(0);
  let qD = $state(0);

  let quoteBase = $derived(qH + qF + qS + qV + qT + qM + qI);
  let quoteMarkup = $derived(quoteBase * (qMk / 100));
  let quoteTaxable = $derived(quoteBase + quoteMarkup);
  let quoteGstAmt = $derived(quoteTaxable * (qGst / 100));
  let quoteTotal = $derived(quoteTaxable + quoteGstAmt - qD);

  let quotations = $state<Quotation[]>([]);
  let leads = $state<Lead[]>([]);
  let loading = $state(true);

  let selectedLeadId = $state(pageData?.leadId || '');
  $effect(() => {
    if (pageData?.leadId) {
      selectedLeadId = pageData.leadId;
    }
  });

  onMount(async () => {
    try {
      const [qRes, lRes] = await Promise.all([
        fetchQuotations(),
        fetchLeads()
      ]);
      quotations = qRes;
      leads = lRes;
    } catch (error) {
      console.error('Error fetching data:', error);
      onAction('toast', { msg: 'Failed to load data', type: 'error' });
    } finally {
      loading = false;
    }
  });

  function getBadgeClass(status: string) {
    switch (status.toLowerCase()) {
      case 'sent': return 'b-amber';
      case 'accepted': return 'b-green';
      case 'draft': return 'b-blue';
      case 'rejected': return 'b-red';
      default: return 'b-blue';
    }
  }
</script>

<div class="page active" id="page-quotations">
  <div class="ph">
    <h2>Quotation Management</h2>
    <div class="ph-actions">
      <div class="curr-badge">
        <i class="ti ti-currency"></i>Currency: 
        <select style="background:none;border:none;font-weight:700;color:#6b4a00;font-size:12px;outline:none" bind:value={quoteCurrency}>
          <option>INR ₹</option><option>USD $</option><option>AED د.إ</option><option>EUR €</option><option>GBP £</option><option>SGD S$</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'Quote form opened', type: 'info' })} type="button">
        <i class="ti ti-plus"></i>New Quotation
      </button>
    </div>
  </div>
  <div class="g21">
    <div class="card">
      <div class="card-title"><i class="ti ti-calculator"></i>Dynamic Quote Builder</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="fgrid">
          <div class="fg">
            <label for="qquery">Customer / Query</label>
            <select id="qquery" bind:value={selectedLeadId}>
              <option value="">Select a Customer</option>
              {#each leads as lead}
                <option value={lead.id}>{lead.name} — {lead.dest}</option>
              {/each}
            </select>
          </div>
          <div class="fg"><label for="qpkg">Package Name</label><input bind:value={qPkg} id="qpkg"></div>
          <div class="fg"><label for="qhotel">Hotel Name</label><input bind:value={qHotel} id="qhotel"></div>
          <div class="fg"><label for="qh">Hotel Cost</label><input type="number" id="qh" bind:value={qH}></div>
          <div class="fg"><label for="qf">Flight Cost</label><input type="number" id="qf" bind:value={qF}></div>
          <div class="fg"><label for="qs">Sightseeing</label><input type="number" id="qs" bind:value={qS}></div>
          <div class="fg"><label for="qv">Visa Charges</label><input type="number" id="qv" bind:value={qV}></div>
          <div class="fg"><label for="qt">Transfers</label><input type="number" id="qt" bind:value={qT}></div>
          <div class="fg"><label for="qm">Meals</label><input type="number" id="qm" bind:value={qM}></div>
          <div class="fg"><label for="qi">Insurance</label><input type="number" id="qi" bind:value={qI}></div>
          <div class="fg"><label for="qmk">Markup %</label><input type="number" id="qmk" bind:value={qMk}></div>
          <div class="fg"><label for="qgst">GST %</label><input type="number" id="qgst" bind:value={qGst}></div>
          <div class="fg"><label for="qd">Discount</label><input type="number" id="qd" bind:value={qD}></div>
        </div>
        <div style="background:linear-gradient(135deg,var(--navy),var(--teal));border-radius:var(--radius-lg);padding:16px;color:#fff;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;opacity:.7">TOTAL PACKAGE COST</div>
            <div style="font-size:28px;font-weight:700">₹{Math.round(quoteTotal).toLocaleString('en-IN')}</div>
          </div>
          <div style="text-align:right;font-size:12px;opacity:.8">
            <div>Markup: <span>₹{Math.round(quoteMarkup).toLocaleString('en-IN')}</span></div>
            <div>GST: <span>₹{Math.round(quoteGstAmt).toLocaleString('en-IN')}</span></div>
            <div>Discount: <span>₹{qD.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick={() => onNavigate('quotepreview')} type="button"><i class="ti ti-eye"></i>Preview</button>
          <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'PDF downloaded!', type: 'success' })} type="button"><i class="ti ti-download"></i>PDF</button>
          <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Quote URL copied!', type: 'info' })} type="button"><i class="ti ti-link"></i>Share URL</button>
          <button class="btn btn-wa btn-sm" onclick={() => onAction('toast', { msg: 'Opening WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp"></i>WhatsApp</button>
          <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Quote emailed!', type: 'success' })} type="button"><i class="ti ti-mail"></i>Email</button>
          <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Saved as draft', type: 'info' })} type="button"><i class="ti ti-device-floppy"></i>Draft</button>
        </div>
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:700">Quotation History</div>
      {#if loading}
        <div style="padding: 20px; text-align: center; color: var(--text3);">Loading quotations...</div>
      {:else if quotations.length === 0}
        <div style="padding: 20px; text-align: center; color: var(--text3);">No quotations found.</div>
      {:else}
        <table>
          <thead>
            <tr><th>Quote #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {#each quotations as quote}
              <tr>
                <td class="td-strong">{quote.quoteId}</td>
                <td>{quote.customer}<div class="td-sub">{quote.destination}</div></td>
                <td class="td-strong">₹{quote.amount.toLocaleString('en-IN')}</td>
                <td><span class="badge {getBadgeClass(quote.status)}">{quote.status}</span></td>
                <td>
                  <button class="icon-btn" onclick={() => onNavigate('quotepreview')} type="button">
                    <i class="ti ti-eye"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
