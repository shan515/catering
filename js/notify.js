/**
 * NOTIFY.JS - Quote Notification Methods (WhatsApp, Email, Copy)
 * Handles message formatting and sending via different channels
 */

'use strict';

// ═════════════════════════════════════════════════════════
// STATE
// ═════════════════════════════════════════════════════════

let activeReq = null;

// ═════════════════════════════════════════════════════════
// MESSAGE BUILDING
// ═════════════════════════════════════════════════════════

/**
 * Build formatted message for WhatsApp
 * @param {Object} req - Request object
 * @returns {string} WhatsApp message text
 */
function buildWhatsAppMessage(req) {
  const labels = { starters: 'Starters', main: 'Main Course', sweets: 'Sweets', drinks: 'Beverages' };
  const menu = req.menu || {};
  
  const menuLines = Object.entries(menu)
    .filter(([, v]) => v && v.length)
    .map(([k, v]) => `• ${labels[k]}: ${v.join(', ')}`)
    .join('\n');
  
  return `🙏 *Annapurna Catering – Quote for ${req.name}*\n\nNamaskar ${req.name}! Your menu quote is ready.\n\n*Event:* ${req.event_type}\n*Date:* ${req.event_date}\n*Venue:* ${req.venue || 'TBD'}\n*Guests:* ${req.guests}\n\n*Your Menu:*\n${menuLines}\n\n*💰 Per Plate: ₹${Number(req.per_plate).toLocaleString('en-IN')}*\n*🧾 Total Cost: ₹${Number(req.total_cost).toLocaleString('en-IN')}*\n\nTo confirm, please call or WhatsApp us. We look forward to serving you! 🍛\n– Annapurna Catering, Pune\n📞 +91 98765 43210`;
}

/**
 * Build plain text message for SMS/clipboard
 * @param {Object} req - Request object
 * @returns {string} Plain text message
 */
function buildPlainMessage(req) {
  // Same as WhatsApp but plain text
  return buildWhatsAppMessage(req);
}

// ═════════════════════════════════════════════════════════
// NOTIFY MODAL
// ═════════════════════════════════════════════════════════

/**
 * Open notify modal for sending quote to client
 * @param {Object|string} req - Request object or JSON string
 */
function openNotifyModal(req) {
  if (typeof req === 'string') {
    try {
      req = JSON.parse(req);
    } catch {
      return;
    }
  }
  
  activeReq = req;
  
  // Update summary pill
  getEl('modalSummary').innerHTML = `
    <div class="qs-name">${req.name} · ${req.event_type}</div>
    <div class="qs-price">₹${Number(req.per_plate).toLocaleString('en-IN')}/plate · ₹${Number(req.total_cost).toLocaleString('en-IN')} Total</div>
    <div class="qs-sub">${req.guests} guests · ${req.event_date} · ${req.venue || 'Venue TBD'}</div>`;
  
  // Update email button state
  updateEmailButtonState(req);
  
  // Show modal
  openModal('notifyModal');
}

/**
 * Update email button based on EmailJS config and email availability
 * @param {Object} req - Request object
 */
function updateEmailButtonState(req) {
  const cfg = getEmailJSConfig();
  const ejsNote = getEl('ejsNote');
  const emailBtn = getEl('emailBtn');
  const emailBtnSub = getEl('emailBtnSub');
  
  if (cfg.ready) {
    ejsNote.style.display = 'none';
    emailBtn.disabled = !req.email;
    
    if (req.email) {
      emailBtnSub.textContent = 'Sends to: ' + req.email;
      emailBtn.style.opacity = '1';
    } else {
      emailBtnSub.textContent = 'Client did not provide email';
      emailBtn.style.opacity = '0.5';
    }
  } else {
    ejsNote.style.display = 'block';
  }
  
  // Reset button HTML
  emailBtn.innerHTML = `<span class="nb-icon">✉️</span><span class="nb-text">Send Email to Client<small id="emailBtnSub">${emailBtnSub.textContent}</small></span>`;
}

// ═════════════════════════════════════════════════════════
// COMMUNICATION METHODS
// ═════════════════════════════════════════════════════════

/**
 * Send quote via WhatsApp
 */
function sendWhatsApp() {
  if (!activeReq) return;
  
  const phone = activeReq.phone.replace(/\D/g, '');
  const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
  
  const message = buildWhatsAppMessage(activeReq);
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  showToast('💬 WhatsApp opened!', true);
}

/**
 * Copy message to clipboard
 */
function copySmsText() {
  if (!activeReq) return;
  
  const message = buildPlainMessage(activeReq);
  navigator.clipboard.writeText(message)
    .then(() => showToast('📋 Copied!', true))
    .catch(() => prompt('Copy:', message));
}

// ═════════════════════════════════════════════════════════
// EMAILJS INTEGRATION
// ═════════════════════════════════════════════════════════

/**
 * Get stored EmailJS configuration
 * @returns {Object} Config with publicKey, serviceId, templateId, and ready flag
 */
function getEmailJSConfig() {
  const cfg = JSON.parse(localStorage.getItem('annapurna_ejs') || '{}');
  cfg.ready = !!(cfg.publicKey && cfg.serviceId && cfg.templateId);
  return cfg;
}

/**
 * Initialize EmailJS with public key
 */
function initEmailJS() {
  try {
    const cfg = getEmailJSConfig();
    if (cfg.publicKey) {
      emailjs.init(cfg.publicKey);
    }
  } catch (e) {
    console.error('EmailJS init error:', e);
  }
}

// Initialize EmailJS on page load
window.addEventListener('load', () => {
  try {
    initEmailJS();
  } catch (e) {
    console.error('EmailJS init error:', e);
  }
});

/**
 * Build email payload for EmailJS template
 * @param {Object} req - Request object
 * @returns {Object} Template parameters
 */
function buildEmailPayload(req) {
  const labels = { starters: 'Starters', main: 'Main Course', sweets: 'Sweets', drinks: 'Beverages' };
  const menu = req.menu || {};
  
  const menuText = Object.entries(menu)
    .filter(([, v]) => v && v.length)
    .map(([k, v]) => `${labels[k]}: ${v.join(', ')}`)
    .join(' | ');
  
  return {
    to_name: req.name,
    to_email: req.email,
    from_name: 'Annapurna Catering',
    event_type: req.event_type,
    event_date: req.event_date,
    venue: req.venue || 'TBD',
    guests: req.guests,
    meal_type: req.meal_type || 'N/A',
    menu_items: menuText,
    per_plate: '₹' + Number(req.per_plate).toLocaleString('en-IN'),
    total_cost: '₹' + Number(req.total_cost).toLocaleString('en-IN'),
    ref_id: req.id,
    owner_phone: '+91 98765 43210'
  };
}

/**
 * Send quote via email using EmailJS
 */
async function sendEmail() {
  if (!activeReq) return;
  if (!activeReq.email) {
    return showToast('⚠️ Client has no email');
  }
  
  const cfg = getEmailJSConfig();
  if (!cfg.ready) {
    return showToast('⚠️ Save EmailJS settings first');
  }
  
  // Ensure EmailJS is initialized
  try {
    initEmailJS();
  } catch (e) {
    return showToast('⚠️ EmailJS initialization failed');
  }
  
  const btn = getEl('emailBtn');
  btn.innerHTML = '<span class="nb-icon"><span class="spinner"></span></span><span class="nb-text">Sending…</span>';
  btn.disabled = true;
  
  try {
    const payload = buildEmailPayload(activeReq);
    
    await emailjs.send(cfg.serviceId, cfg.templateId, payload);
    
    btn.innerHTML = `<span class="nb-icon">✅</span><span class="nb-text">Email Sent!<small>Delivered to ${activeReq.email}</small></span>`;
    showToast('✅ Email sent to ' + activeReq.email, true);
  } catch (e) {
    btn.innerHTML = '<span class="nb-icon">✉️</span><span class="nb-text">Send Email<small>Failed: ' + (e.text || e.message || 'Unknown error') + '</small></span>';
    btn.disabled = false;
    showToast('⚠️ Email failed: ' + (e.text || e.message || 'Check EmailJS settings'));
    console.error('EmailJS send error:', e);
  }
}
