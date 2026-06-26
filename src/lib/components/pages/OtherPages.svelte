<script lang="ts">
  import { Chart } from 'chart.js';
  import BookingsPage from './BookingsPage.svelte';
  import FollowupsPage from './FollowupsPage.svelte';
  import PaymentManagement from './PaymentManagement.svelte';
  import SupplierPayments from './SupplierPayments.svelte';
  import UsersManagement from './UsersManagement.svelte';
  import type { Lead } from '$lib/firebase/lead.db';

  let { activePage, pageData, leads = [], onNavigate, onOpenModal, onAction } = $props<{
    activePage: string;
    pageData?: any;
    leads?: Lead[];
    onNavigate: (page: string, data?: any) => void;
    onOpenModal: (modalId: string) => void;
    onAction: (actionName: string, data?: any) => void;
  }>();

  // Communication Page States
  let activeCommTab = $state('email');
  let emailTpl = $state('quote');
  let emailSubj = $state('Your Maldives Quotation — QT-24-115 | TravelCRM Pro');
  let emailBody = $state('');

  const emailTemplatesMap: Record<string, { subj: string; body: string }> = {
    quote: {
      subj: 'Your Maldives Quotation — QT-24-115 | TravelCRM Pro',
      body: `Dear Priya,\n\nThank you for your enquiry about our Maldives package!\n\nQuote: QT-24-115\nPackage: Maldives Luxury 5N/6D\nHotel: Anantara Kihavah Maldives Villas\nFlights: Mumbai ↔ Malé (Return)\nTotal: ₹1,72,480 (3 Pax)\n\nValid till 24 Jun 2024. 50% advance to confirm.\n\nWarm regards,\nRavi Kumar | TravelCRM Pro`
    },
    confirm: {
      subj: 'Booking Confirmed! 🎉 — BK-24-040 | TravelCRM Pro',
      body: `Dear Priya,\n\nYour Maldives booking is CONFIRMED!\n\nBooking ID: BK-24-040\nDestination: Maldives 5N/6D\nHotel: Anantara Kihavah\nDeparture: 15 July 2024\nReturn: 21 July 2024\n\nGet ready for an incredible holiday! 🏝\n\nRavi Kumar | TravelCRM Pro`
    },
    reminder: {
      subj: 'Payment Reminder — BK-24-040 | TravelCRM Pro',
      body: `Dear Priya,\n\nFriendly reminder about the balance payment.\n\nBooking: BK-24-040\nTotal: ₹1,72,480\nPaid: ₹86,240\nBalance Due: ₹86,240\nDue Date: 15 Jun 2024\n\nBank: HDFC · IFSC: HDFC0001234\nAccount: 1234567890\n\nRavi Kumar | TravelCRM Pro`
    },
    travel: {
      subj: 'Your Maldives Trip is 7 Days Away! ✈️ | TravelCRM Pro',
      body: `Dear Priya,\n\nYour Maldives holiday is almost here!\n\nPre-Travel Checklist:\n✅ Passport (6+ months validity)\n✅ E-ticket (attached)\n✅ Travel insurance\n✅ Foreign currency\n✅ Hotel voucher\n\nEmergency: +91 98100 00000\n\nHave an amazing trip!\nTravelCRM Pro`
    }
  };

  $effect(() => {
    if (emailTpl && emailTemplatesMap[emailTpl]) {
      emailSubj = emailTemplatesMap[emailTpl].subj;
      emailBody = emailTemplatesMap[emailTpl].body;
    }
  });

  let waTpl = $state('q');
  let waMsg = $state('');

  const waTemplatesMap: Record<string, string> = {
    q: `Hi! 🌟 Your Maldives quote is ready!\n\n📦 Maldives Luxury 5N/6D\n🏨 Anantara Kihavah\n💰 ₹1,72,480 (3 Pax)\n📅 Valid till 24 Jun\n\nReply YES to confirm! 🏝\n— TravelCRM Pro`,
    f: `Hi! 👋 Quick follow-up on your travel enquiry.\n\nHave you reviewed our Maldives quote?\n\nCall us: +91 98100 00000\n— TravelCRM Pro`,
    p: `Hi! 📄 Payment reminder for BK-24-040\n\nBalance Due: ₹86,240\nDue Date: 15 Jul\n\nBank: HDFC · Acc: 1234567890\n\n— TravelCRM Pro`,
    c: `Hi! 🎉 Your Maldives booking is CONFIRMED!\n\nBK-24-040\nDeparture: 15 Jul 2024\nHotel: Anantara Kihavah\n\nHave a wonderful trip! 🏝\n— TravelCRM Pro`,
    t: `Hi! ✈️ Trip reminder — Maldives in 7 days!\n\nChecklist:\n✅ Passport\n✅ E-ticket (check email)\n✅ Travel insurance\n✅ USD/MVR currency\n\nEmergency: +91 98100 00000\n— TravelCRM Pro`
  };

  $effect(() => {
    if (waTpl && waTemplatesMap[waTpl]) {
      waMsg = waTemplatesMap[waTpl];
    }
  });

  // Reports Page States
  let activeReportTab = $state('summary');
  let revCanvas = $state<HTMLCanvasElement>();
  let trendCanvas = $state<HTMLCanvasElement>();
  let revChart: Chart | undefined;
  let trendChart: Chart | undefined;

  $effect(() => {
    if (activePage === 'reports' && activeReportTab === 'summary') {
      if (revCanvas) {
        if (revChart) revChart.destroy();
        revChart = new Chart(revCanvas, {
          type: 'bar',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              data: [8.2, 10.4, 14.8, 18.4, 16.2, 12.4],
              backgroundColor: 'rgba(13,124,110,.7)',
              borderRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: v => v + 'L', font: { size: 10 } },
                grid: { color: 'rgba(0,0,0,0.04)' }
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
              }
            }
          }
        });
      }

      if (trendCanvas) {
        if (trendChart) trendChart.destroy();
        trendChart = new Chart(trendCanvas, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Queries',
                data: [42, 54, 68, 78, 72, 88],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,.1)',
                tension: .4,
                fill: true
              },
              {
                label: 'Bookings',
                data: [16, 19, 24, 28, 25, 18],
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22,163,74,.1)',
                tension: .4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 10 } }
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
              }
            }
          }
        });
      }
    }

    return () => {
      revChart?.destroy();
      trendChart?.destroy();
    };
  });

  // Masters Tab
  let activeMasterTab = $state('dest');

  // B2B Tab
  let activeBizTab = $state('b2b');
</script>

{#if activePage === 'bookings'}
  <BookingsPage {leads} {onAction} />

{:else if activePage === 'followups'}
  <FollowupsPage {onOpenModal} {onAction} />

{:else if activePage === 'invoices'}
  <div class="page active" id="page-invoices">
    <div class="ph">
      <h2>Invoice Management</h2>
      <div class="ph-actions">
        <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'Proforma Invoice generated!', type: 'success' })} type="button"><i class="ti ti-file-dollar"></i>Proforma Invoice</button>
        <button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'Tax Invoice generated!', type: 'success' })} type="button"><i class="ti ti-file-invoice"></i>Tax Invoice</button>
      </div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi k-blue"><div class="kpi-label">Total Invoices</div><div class="kpi-value">94</div></div>
      <div class="kpi k-orange"><div class="kpi-label">Unpaid</div><div class="kpi-value" style="color:var(--warning)">22</div></div>
      <div class="kpi k-green"><div class="kpi-label">Paid</div><div class="kpi-value" style="color:var(--success)">68</div></div>
      <div class="kpi k-teal"><div class="kpi-label">Overdue</div><div class="kpi-value" style="color:var(--danger)">4</div></div>
    </div>
    <!-- Invoice Preview -->
    <div style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1); margin-bottom: 20px;">
      <div class="inv-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-size:22px;font-weight:700">TAX INVOICE</div><div style="font-size:12px;opacity:.7;margin-top:4px">TravelCRM Pro Agency · GST: 27AABCT1234F1Z5</div></div>
          <div style="text-align:right"><div style="font-size:11px;opacity:.6">INVOICE #</div><div style="font-size:20px;font-weight:700">INV-24-094</div><div style="font-size:11px;opacity:.7;margin-top:4px">Date: 17 Jun 2024</div></div>
        </div>
      </div>
      <div class="inv-body">
        <div class="g2" style="margin-bottom:20px">
          <div><div class="section-label">Billed To</div><div style="font-weight:700;font-size:15px">Mehta Family</div><div style="font-size:13px;color:var(--text2)">+91 65432 10987 · mehta@email.com</div></div>
          <div><div class="section-label">Booking Details</div><div style="font-weight:700">BK-24-041 · Dubai 7N/8D</div><div style="font-size:13px;color:var(--text2)">Atlantis The Palm</div></div>
        </div>
        <table class="inv-table" style="margin-bottom:18px">
          <thead><tr><th>Service</th><th>Details</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr><td>Hotel Accommodation</td><td>Atlantis The Palm · 7 Nights · 3 Rooms</td><td style="text-align:right;font-weight:600">₹2,80,000</td></tr>
            <tr><td>International Flights</td><td>Emirates EK501/EK502 · 6 Pax Return</td><td style="text-align:right;font-weight:600">₹96,000</td></tr>
            <tr style="background:var(--bg2)"><td colspan="2" style="font-weight:600">Subtotal</td><td style="text-align:right;font-weight:600">₹4,24,000</td></tr>
            <tr class="total-row"><td>TOTAL AMOUNT DUE</td><td></td><td style="text-align:right;font-weight:700">₹4,20,000</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap; margin-bottom: 20px;">
      <button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'PDF downloaded!', type: 'success' })} type="button"><i class="ti ti-download"></i>Download PDF</button>
      <button class="btn btn-sm" onclick={() => onAction('toast', { msg: 'URL copied!', type: 'info' })} type="button"><i class="ti ti-link"></i>Share URL</button>
      <button class="btn btn-wa btn-sm" onclick={() => onAction('toast', { msg: 'Opening WhatsApp…', type: 'info' })} type="button"><i class="ti ti-brand-whatsapp"></i>Send WhatsApp</button>
    </div>
  </div>

{:else if activePage === 'payments'}
  <PaymentManagement {leads} />

{:else if activePage === 'supplier-payments'}
  <SupplierPayments />

{:else if activePage === 'b2b'}
  <div class="page active" id="page-b2b">
    <div class="ph">
      <h2>B2B / B2C Management</h2>
    </div>
    <div class="tabs">
      <button class="tab" class:active={activeBizTab === 'b2b'} onclick={() => activeBizTab = 'b2b'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">B2B Agents (24)</button>
      <button class="tab" class:active={activeBizTab === 'b2c'} onclick={() => activeBizTab = 'b2c'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">B2C Clients (186)</button>
    </div>
    <div class="g3" id="agentCards">
      <div class="agent-card">
        <div class="agent-top"><div class="agent-avatar">SS</div><div><div style="font-size:14px;font-weight:700">Sunrise Travels</div><div style="font-size:12px;color:var(--text2)">Mumbai · B2B Agent</div></div><span class="badge b-green" style="margin-left:auto">Active</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:10px">
          <div style="background:var(--bg2);padding:8px;border-radius:var(--radius)"><div style="color:var(--text2)">Total Business</div><div style="font-weight:700;color:var(--teal)">₹18.4L</div></div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-xs btn-teal" onclick={() => onAction('toast', { msg: 'Emailed agent!', type: 'success' })} type="button"><i class="ti ti-mail"></i>Email</button>
        </div>
      </div>
    </div>
  </div>

{:else if activePage === 'suppliers'}
  <div class="page active" id="page-suppliers">
    <div class="ph"><h2>Supplier Management</h2></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Supplier</th><th>Type</th><th>Location</th><th>Contact</th><th>Bank Details</th><th>Total Business</th><th>Pending</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr>
            <td><div class="td-strong">Anantara Hotels & Resorts</div></td>
            <td><span class="badge b-teal">Hotel</span></td>
            <td>Maldives</td>
            <td>reservations@anantara.com</td>
            <td>HDFC ···4521</td>
            <td class="td-strong">₹12.4L</td>
            <td style="color:var(--danger)">₹1,20,000</td>
            <td><span class="badge b-green">Active</span></td>
            <td><button class="icon-btn" onclick={() => onAction('toast', { msg: 'Emailed supplier!', type: 'success' })} type="button"><i class="ti ti-mail"></i></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

{:else if activePage === 'masters'}
  <div class="page active" id="page-masters">
    <div class="ph"><h2>Master Management</h2></div>
    <div class="tabs">
      <button class="tab" class:active={activeMasterTab === 'dest'} onclick={() => activeMasterTab = 'dest'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Destinations</button>
      <button class="tab" class:active={activeMasterTab === 'hotel'} onclick={() => activeMasterTab = 'hotel'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Hotels & Tariff</button>
      <button class="tab" class:active={activeMasterTab === 'currency'} onclick={() => activeMasterTab = 'currency'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Currency / ROE</button>
    </div>
    
    {#if activeMasterTab === 'dest'}
      <div id="master-dest">
        <div class="g3" style="margin-top: 14px;">
          <div class="card card-sm" style="display:flex;align-items:center;gap:12px"><div style="font-size:28px">🏝</div><div><div style="font-weight:700">Maldives</div><div style="font-size:12px;color:var(--text2)">Indian Ocean · 24 packages</div></div></div>
          <div class="card card-sm" style="display:flex;align-items:center;gap:12px"><div style="font-size:28px">🇦🇪</div><div><div style="font-weight:700">Dubai, UAE</div><div style="font-size:12px;color:var(--text2)">Middle East · 18 packages</div></div></div>
        </div>
      </div>
    {:else if activeMasterTab === 'hotel'}
      <div id="master-hotel">
        <table class="cost-table" style="margin-top: 14px; width: 100%;">
          <thead>
            <tr><th>Hotel Name</th><th>Destination</th><th>Category</th><th>Base Tariff</th></tr>
          </thead>
          <tbody>
            <tr><td class="td-strong">Anantara Kihavah</td><td>Maldives</td><td><span class="badge b-gold">5-Star Luxury</span></td><td>₹38,000/night</td></tr>
          </tbody>
        </table>
      </div>
    {:else if activeMasterTab === 'currency'}
      <div id="master-currency" style="margin-top: 14px;">
        <div class="g3">
          <div class="card card-sm"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:700">USD → INR</div><div style="font-size:11px;color:var(--text2)">US Dollar</div></div><div style="font-size:22px;font-weight:700;color:var(--teal)">83.42</div></div></div>
          <div class="card card-sm"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:700">AED → INR</div><div style="font-size:11px;color:var(--text2)">UAE Dirham</div></div><div style="font-size:22px;font-weight:700;color:var(--teal)">22.71</div></div></div>
        </div>
      </div>
    {/if}
  </div>

{:else if activePage === 'communication'}
  <div class="page active" id="page-communication">
    <div class="ph"><h2>Client Communication</h2></div>
    <div class="tabs">
      <button class="tab" class:active={activeCommTab === 'email'} onclick={() => activeCommTab = 'email'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Email</button>
      <button class="tab" class:active={activeCommTab === 'whatsapp'} onclick={() => activeCommTab = 'whatsapp'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">WhatsApp</button>
    </div>
    
    {#if activeCommTab === 'email'}
      <div id="comm-email" style="margin-top: 14px;">
        <div class="g21">
          <div class="card">
            <div class="card-title"><i class="ti ti-mail"></i>Compose Email</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="fg"><label for="eto">To</label><input id="eto" value="priya.sharma@email.com"></div>
              <div class="fg">
                <label for="emailTpl">Template</label>
                <select id="emailTpl" bind:value={emailTpl}>
                  <option value="quote">Quotation Email</option>
                  <option value="confirm">Booking Confirmation</option>
                  <option value="reminder">Payment Reminder</option>
                  <option value="travel">Travel Reminder</option>
                </select>
              </div>
              <div class="fg"><label for="emailSubj">Subject</label><input id="emailSubj" bind:value={emailSubj}></div>
              <div class="fg"><label for="emailBody">Message</label><textarea id="emailBody" rows="9" bind:value={emailBody}></textarea></div>
              <div><button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'Email sent successfully!', type: 'success' })} type="button"><i class="ti ti-send"></i>Send Email</button></div>
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

{:else if activePage === 'reports'}
  <div class="page active" id="page-reports">
    <div class="ph"><h2>Reports & Analytics</h2></div>
    <div class="tabs">
      <button class="tab" class:active={activeReportTab === 'summary'} onclick={() => activeReportTab = 'summary'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Summary</button>
      <button class="tab" class:active={activeReportTab === 'leads'} onclick={() => activeReportTab = 'leads'} type="button" style="background: none; border: none; font: inherit; cursor: pointer;">Status-wise Queries</button>
    </div>
    
    {#if activeReportTab === 'summary'}
      <div id="report-summary" style="margin-top: 14px;">
        <div class="g2">
          <div class="card"><div class="card-title"><i class="ti ti-chart-bar"></i>Monthly Revenue (₹L)</div><div style="position:relative;height:200px"><canvas bind:this={revCanvas}></canvas></div></div>
          <div class="card"><div class="card-title"><i class="ti ti-chart-line"></i>Query Trend vs Bookings</div><div style="position:relative;height:200px"><canvas bind:this={trendCanvas}></canvas></div></div>
        </div>
      </div>
    {:else}
      <div id="report-leads" style="margin-top: 14px;">
        <table class="cost-table" style="width: 100%;">
          <thead>
            <tr><th>Status</th><th>Count</th><th>%</th><th>Avg Budget</th></tr>
          </thead>
          <tbody>
            <tr><td><span class="badge b-blue">New</span></td><td>42</td><td>12.1%</td><td>₹1,24,000</td></tr>
            <tr><td><span class="badge b-green">Confirmed</span></td><td>98</td><td>28.2%</td><td>₹2,84,000</td></tr>
          </tbody>
        </table>
      </div>
    {/if}
  </div>

{:else if activePage === 'duty-sheet'}
  <div class="page active" id="page-duty-sheet">
    <div class="ph"><h2>Daily Duty Sheet — <span style="color:var(--teal)">17 June 2024</span></h2></div>
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi k-blue"><div class="kpi-label">Tours Departing Today</div><div class="kpi-value">3</div></div>
      <div class="kpi k-green"><div class="kpi-label">Airport Pickups</div><div class="kpi-value">2</div></div>
    </div>
    <div class="g2" style="margin-top: 14px;">
      <div class="card">
        <div class="card-title"><i class="ti ti-plane-departure"></i>Today's Departures & Arrivals</div>
        <div class="duty-card"><div class="duty-time">06:30 AM</div><div class="duty-info"><div class="duty-title">Mehta Family — EK501 (Dubai)</div></div><span class="badge b-green">On Time</span></div>
      </div>
    </div>
  </div>

{:else if activePage === 'users'}
  <UsersManagement />

{:else if activePage === 'settings'}
  <div class="page active" id="page-settings">
    <div class="ph"><h2>Settings</h2><button class="btn btn-primary btn-sm" onclick={() => onAction('toast', { msg: 'Settings saved!', type: 'success' })} type="button"><i class="ti ti-device-floppy"></i>Save All</button></div>
    <div class="g2" style="margin-top: 14px;">
      <div class="card">
        <div class="card-title"><i class="ti ti-building"></i>Agency Configuration</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="fg"><label for="aname">Agency Name</label><input id="aname" value="TravelCRM Pro Agency"></div>
          <div class="fg"><label for="agst">GST / Tax Number</label><input id="agst" value="27AABCT1234F1Z5"></div>
        </div>
      </div>
    </div>
  </div>
{/if}
