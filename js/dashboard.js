/**
 * DASHBOARD.JS - Owner Dashboard & Quote Management
 * Displays requests, handles filtering, quote calculation, and quote sending
 */

'use strict';

// ═════════════════════════════════════════════════════════
// STATE
// ═════════════════════════════════════════════════════════

let activeFilter = 'all';

// ═════════════════════════════════════════════════════════
// DASHBOARD RENDERING
// ═════════════════════════════════════════════════════════

/**
 * Filter requests and re-render dashboard
 * @param {string} filter - Filter type: 'all', 'new', 'quoted'
 */
function filterRequests(filter) {
  activeFilter = filter;
  
  // Update filter button styles
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.style.background = 'white';
    b.style.color = 'var(--text-dark)';
    b.style.borderColor = '#ddd';
  });
  
  const fb = getEl('fb-' + filter);
  if (fb) {
    fb.style.background = 'var(--saffron)';
    fb.style.color = 'white';
    fb.style.borderColor = 'var(--saffron)';
  }
  
  renderDash(filter);
}

/**
 * Render full dashboard with requests and stats
 * @param {string} filter - Current filter type
 */
async function renderDash(filter) {
  filter = filter || activeFilter;
  
  // Show loading
  getEl('requestsList').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-mid);"><div class="big-spinner" style="margin:0 auto"></div></div>';
  
  let requests = [];
  let callbacks = [];
  
  try {
    if (supabaseClient) {
      // Fetch requests from Supabase
      let query = supabaseClient.from('requests').select('*').order('submitted_at', { ascending: false });
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      const { data: rData, error: rErr } = await query;
      
      if (rErr) {
        showToast('⚠️ Error loading requests: ' + rErr.message);
        return;
      }
      requests = rData || [];
      
      // Fetch callbacks
      const { data: cData } = await supabaseClient.from('callbacks').select('*').order('created_at', { ascending: false });
      callbacks = cData || [];
    } else {
      // Fallback to localStorage
      const all = JSON.parse(localStorage.getItem('annapurna_local_requests') || '[]');
      requests = filter === 'all' ? all : all.filter(r => r.status === filter);
      callbacks = JSON.parse(localStorage.getItem('annapurna_local_callbacks') || '[]');
    }
    
    // Get counts for stats
    let allReqs = requests;
    if (supabaseClient && filter !== 'all') {
      const { data } = await supabaseClient.from('requests').select('status');
      allReqs = data || [];
    }
    
    const totalCount = allReqs.length;
    const pendingCount = allReqs.filter(r => r.status === 'new').length;
    const quotedCount = allReqs.filter(r => r.status === 'quoted').length;
    
    // Render stats
    renderDashStats(totalCount, pendingCount, quotedCount);
    
    // Render requests list
    if (!requests.length) {
      getEl('requestsList').innerHTML = `
        <div style="text-align:center;padding:3rem;color:var(--text-mid);background:white;border-radius:20px;">
          <div style="font-size:3rem;margin-bottom:1rem">🍽️</div>
          <p>No ${filter === 'all' ? '' : filter + ' '}requests yet.</p>
        </div>`;
    } else {
      const requestsHtml = requests.map(req => renderRequestCard(req)).join('');
      getEl('requestsList').innerHTML = '<h3 style="font-family:Playfair Display,serif;color:var(--maroon-deep);margin-bottom:1.2rem;">📋 Menu Requests</h3>' + requestsHtml;
    }
    
    // Render callbacks
    if (callbacks.length) {
      const callbacksHtml = callbacks.map(cb => `
        <div style="background:white;border-radius:16px;padding:1.2rem 1.5rem;margin-bottom:.8rem;box-shadow:0 2px 8px rgba(122,21,21,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;border-left:4px solid var(--turmeric);">
          <div><strong style="color:var(--maroon-deep)">${cb.name}</strong> <span style="color:var(--saffron);font-weight:700;margin-left:.5rem">${cb.phone}</span></div>
          <div style="font-size:.85rem;color:var(--text-mid)">${cb.time || ''} ${cb.message ? '· "' + cb.message + '"' : ''}</div>
          <div style="font-size:.75rem;color:#bbb">${new Date(cb.created_at).toLocaleString('en-IN')}</div>
        </div>`).join('');
      
      getEl('callbacksList').innerHTML = `
        <h3 style="font-family:Playfair Display,serif;color:var(--maroon-deep);margin:2rem 0 1.2rem;">📞 Callback Requests (${callbacks.length})</h3>
        ${callbacksHtml}`;
    } else {
      getEl('callbacksList').innerHTML = '';
    }
  } catch (e) {
    showToast('⚠️ Error: ' + e.message);
  }
}

/**
 * Render dashboard statistics cards
 * @param {number} total - Total requests
 * @param {number} pending - Pending quote count
 * @param {number} quoted - Quoted count
 */
function renderDashStats(total, pending, quoted) {
  getEl('dashStats').innerHTML = `
    <div class="dash-stat-card"><div class="dash-stat-num">${total}</div><div class="dash-stat-label">Total Requests</div></div>
    <div class="dash-stat-card"><div class="dash-stat-num" style="color:var(--saffron)">${pending}</div><div class="dash-stat-label">Pending Quote</div></div>
    <div class="dash-stat-card"><div class="dash-stat-num" style="color:var(--green)">${quoted}</div><div class="dash-stat-label">Quoted</div></div>
  `;
}

// ═════════════════════════════════════════════════════════
// REQUEST CARD RENDERING
// ═════════════════════════════════════════════════════════

/**
 * Render a single request card
 * @param {Object} req - Request object from database
 * @returns {string} HTML for request card
 */
function renderRequestCard(req) {
  const isQuoted = req.status === 'quoted';
  const menu = req.menu || {};
  const allItems = Object.values(menu).flat();
  const menuTagsHtml = allItems.map(i => `<span class="req-menu-tag">${i}</span>`).join('');
  const submittedStr = req.submitted_at ? new Date(req.submitted_at).toLocaleString('en-IN') : '—';
  
  return `
    <div class="request-card ${isQuoted ? 'quoted' : ''}" id="req-${req.id}">
      <div class="req-header">
        <div>
          <div class="req-name">${req.name}</div>
          <div class="req-meta">📱 ${req.phone}${req.email ? ' · ' + req.email : ''} · ${submittedStr}</div>
        </div>
        <span class="req-badge ${isQuoted ? 'badge-quoted' : 'badge-new'}">${isQuoted ? '✅ Quoted' : '🔔 New'}</span>
      </div>
      <div class="req-body">
        <div class="req-info-item"><strong>Event</strong>${req.event_type}</div>
        <div class="req-info-item"><strong>Date</strong>${req.event_date}</div>
        <div class="req-info-item"><strong>Guests</strong>${req.guests} pax</div>
        <div class="req-info-item"><strong>Venue</strong>${req.venue || '—'}</div>
        <div class="req-info-item"><strong>Meal</strong>${req.meal_type || '—'}</div>
        <div class="req-info-item"><strong>Notes</strong>${req.notes || '—'}</div>
      </div>
      ${menuTagsHtml ? `<div class="req-menu-tags">${menuTagsHtml}</div>` : ''}
      ${isQuoted ? renderQuotedDisplay(req) : renderQuoteForm(req)}
    </div>`;
}

/**
 * Render quote form for unquoted requests
 * @param {Object} req - Request object
 * @returns {string} HTML
 */
function renderQuoteForm(req) {
  return `
    <div class="quote-row">
      <div class="quote-input-wrap">
        <label>Per Plate Price (₹)</label>
        <input type="number" id="pp-${req.id}" placeholder="e.g. 850" min="1" oninput="calculateTotal('${req.id}',${req.guests})"/>
      </div>
      <div class="total-display">
        <span style="font-size:.78rem;text-transform:uppercase;display:block">Total Cost</span>
        <span class="total-num" id="total-${req.id}">₹ —</span>
        <span style="font-size:.75rem;color:#bbb">for ${req.guests} guests</span>
      </div>
      <button class="btn-quote" onclick="sendQuote('${req.id}',${req.guests})">Send Quote ✓</button>
    </div>`;
}

/**
 * Render quoted display for already-quoted requests
 * @param {Object} req - Request object
 * @returns {string} HTML
 */
function renderQuotedDisplay(req) {
  return `
    <div class="quoted-display">
      <div class="q-label">Quoted Price</div>
      <div class="q-val">₹${Number(req.per_plate).toLocaleString('en-IN')}/plate · Total ₹${Number(req.total_cost).toLocaleString('en-IN')}</div>
      <div style="font-size:.8rem;color:var(--text-mid);margin-top:.3rem">For ${req.guests} guests</div>
      <button class="btn-quote" style="margin-top:.8rem;background:var(--saffron);" onclick="openNotifyModal(${JSON.stringify(req).replace(/"/g, '&quot;')})">📤 Re-send Quote</button>
    </div>`;
}

// ═════════════════════════════════════════════════════════
// QUOTE CALCULATION & SUBMISSION
// ═════════════════════════════════════════════════════════

/**
 * Calculate and display total cost
 * @param {string} requestId - Request ID
 * @param {number} guests - Guest count
 */
function calculateTotal(requestId, guests) {
  const pp = parseFloat(getEl('pp-' + requestId).value);
  const totalEl = getEl('total-' + requestId);
  totalEl.textContent = pp && guests ? '₹ ' + (pp * guests).toLocaleString('en-IN') : '₹ —';
}

/**
 * Send quote (calculate, save, and open notify modal)
 * @param {string} requestId - Request ID
 * @param {number} guests - Guest count
 */
async function sendQuote(requestId, guests) {
  const ppInput = getEl('pp-' + requestId);
  const pp = parseFloat(ppInput.value);
  
  if (!pp || pp <= 0) {
    return showToast('⚠️ Enter a valid per-plate price');
  }
  
  const totalCost = pp * guests;
  
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('requests')
        .update({ status: 'quoted', per_plate: pp, total_cost: totalCost })
        .eq('id', requestId);
      
      if (error) {
        showToast('⚠️ Error saving quote: ' + error.message);
        return;
      }
    } else {
      const local = JSON.parse(localStorage.getItem('annapurna_local_requests') || '[]');
      const req = local.find(r => r.id === requestId);
      if (req) {
        req.status = 'quoted';
        req.per_plate = pp;
        req.total_cost = totalCost;
        localStorage.setItem('annapurna_local_requests', JSON.stringify(local));
      }
    }
    
    // Refresh dashboard
    await renderDash(activeFilter);
    
    // Get updated request and open notify modal
    let updatedReq;
    if (supabaseClient) {
      const { data } = await supabaseClient.from('requests').select('*').eq('id', requestId).single();
      updatedReq = data;
    } else {
      updatedReq = JSON.parse(localStorage.getItem('annapurna_local_requests') || '[]').find(r => r.id === requestId);
    }
    
    if (updatedReq) {
      openNotifyModal(updatedReq);
    }
  } catch (e) {
    showToast('⚠️ Error: ' + e.message);
  }
}
