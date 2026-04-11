/**
 * FORM.JS - Menu Builder & Multi-Step Form
 * Handles form navigation, menu management, and submission
 */

'use strict';

// ═════════════════════════════════════════════════════════
// STATE
// ═════════════════════════════════════════════════════════

let menuData = { starters: [], main: [], sweets: [], drinks: [] };
let selectedEvent = '';
let currentStep = 1;

const catEmoji = { starters: '🥗', main: '🍛', sweets: '🍮', drinks: '🥤' };
const catLabels = { starters: 'Starters / Farsan', main: 'Main Course', sweets: 'Sweets', drinks: 'Beverages' };

// ═════════════════════════════════════════════════════════
// EVENT SELECTION
// ═════════════════════════════════════════════════════════

/**
 * Select event type from chips
 * @param {Element} el - Clicked chip element
 * @param {string} eventName - Event name to select
 */
function selectEvent(el, eventName) {
  document.querySelectorAll('.event-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedEvent = eventName;
}

// ═════════════════════════════════════════════════════════
// MENU MANAGEMENT
// ═════════════════════════════════════════════════════════

/**
 * Add menu item to a category
 * @param {string} category - Category key (starters, main, sweets, drinks)
 * @param {string} value - Item value (optional, will get from input if not provided)
 */
function addItem(category) {
  const inp = getEl('inp-' + category);
  const val = inp.value.trim();
  if (!val) return;
  
  menuData[category].push(val);
  inp.value = '';
  renderList(category);
}

/**
 * Remove menu item from category
 * @param {string} category - Category key
 * @param {number} index - Item index to remove
 */
function removeItem(category, idx) {
  menuData[category].splice(idx, 1);
  renderList(category);
}

/**
 * Quick add a known dish from suggestion chips
 * @param {string} category - Category key
 * @param {string} dishName - Name of dish to add
 */
function quickAdd(category, dishName) {
  if (menuData[category].includes(dishName)) {
    return showToast('Already added!');
  }
  menuData[category].push(dishName);
  renderList(category);
}

/**
 * Render all items in a menu category
 * @param {string} category - Category key
 */
function renderList(category) {
  const list = getEl('list-' + category);
  list.innerHTML = menuData[category].map((item, i) => `
    <div class="menu-item-row">
      <span class="item-dot">${catEmoji[category]}</span>
      <span>${item}</span>
      <button class="item-remove" onclick="removeItem('${category}',${i})">✕</button>
    </div>`).join('');
  
  updateMenuPreview();
}

/**
 * Update live menu preview
 */
function updateMenuPreview() {
  const wrap = getEl('menuPreviewWrap');
  const total = Object.values(menuData).flat().length;
  
  if (!total) {
    wrap.innerHTML = '';
    return;
  }
  
  let html = '<div class="menu-preview"><h4>🍽️ Your Menu So Far</h4>';
  for (const cat in menuData) {
    if (!menuData[cat].length) continue;
    html += `<div class="preview-category">
      <div class="preview-cat-title">${catLabels[cat]}</div>
      <div class="preview-items">${menuData[cat].map(i => `<span class="preview-item-tag">${i}</span>`).join('')}</div>
    </div>`;
  }
  html += '</div>';
  wrap.innerHTML = html;
}

// ═════════════════════════════════════════════════════════
// MULTI-STEP FORM NAVIGATION
// ═════════════════════════════════════════════════════════

/**
 * Navigate to a specific step
 * @param {number} n - Step number (1-5)
 */
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;
  
  currentStep = n;
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  getEl('step' + n).classList.add('active');
  updateProgress(n);
  
  if (n === 4) buildSummary();
  
  getEl('mainForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═════════════════════════════════════════════════════════
// FORM VALIDATION
// ═════════════════════════════════════════════════════════

/**
 * Validate current step before moving forward
 * @param {number} n - Step number to validate
 * @returns {boolean} true if valid, false otherwise
 */
function validateStep(n) {
  if (n === 1) {
    if (!selectedEvent) {
      showToast('⚠️ Please select an event type');
      return false;
    }
    if (!getEl('eventDate').value.trim()) {
      showToast('⚠️ Please enter event date');
      return false;
    }
    if (!getEl('guestCount').value) {
      showToast('⚠️ Please enter guest count');
      return false;
    }
  }
  
  if (n === 2 && !Object.values(menuData).flat().length) {
    showToast('⚠️ Please add at least one dish');
    return false;
  }
  
  if (n === 3) {
    if (!getEl('clientName').value.trim()) {
      showToast('⚠️ Please enter your name');
      return false;
    }
    if (!getEl('clientPhone').value.trim()) {
      showToast('⚠️ Please enter your phone');
      return false;
    }
  }
  
  return true;
}

// ═════════════════════════════════════════════════════════
// SUMMARY & SUBMISSION
// ═════════════════════════════════════════════════════════

/**
 * Build review summary from form data
 */
function buildSummary() {
  let menuHtml = Object.entries(menuData)
    .filter(([, v]) => v.length)
    .map(([k, v]) => `<div class="preview-category">
      <div class="preview-cat-title">${catLabels[k]}</div>
      <div class="preview-items">${v.map(i => `<span class="preview-item-tag">${i}</span>`).join('')}</div>
    </div>`)
    .join('');
  
  const specialNotes = getEl('specialNotes').value;
  
  getEl('summaryBox').innerHTML = `
    <div class="summary-row"><span class="summary-key">Event Type</span><span class="summary-val">${selectedEvent}</span></div>
    <div class="summary-row"><span class="summary-key">Date</span><span class="summary-val">${getEl('eventDate').value}</span></div>
    <div class="summary-row"><span class="summary-key">Venue</span><span class="summary-val">${getEl('eventVenue').value || '—'}</span></div>
    <div class="summary-row"><span class="summary-key">Guests</span><span class="summary-val">${getEl('guestCount').value}</span></div>
    <div class="summary-row"><span class="summary-key">Meal Type</span><span class="summary-val">${getEl('mealType').value || '—'}</span></div>
    <div class="summary-row"><span class="summary-key">Name</span><span class="summary-val">${getEl('clientName').value}</span></div>
    <div class="summary-row"><span class="summary-key">Phone</span><span class="summary-val">${getEl('clientPhone').value}</span></div>
    <div class="summary-row"><span class="summary-key">Menu</span><span class="summary-val">${menuHtml || '—'}</span></div>
    ${specialNotes ? `<div class="summary-row"><span class="summary-key">Notes</span><span class="summary-val">${specialNotes}</span></div>` : ''}
  `;
}

/**
 * Generate unique reference ID for submission
 * @returns {string} Reference ID like "APC-123456"
 */
function generateReferenceId() {
  return 'APC-' + Date.now().toString().slice(-6);
}

/**
 * Build request payload from form data
 * @returns {Object} Payload ready for database insertion
 */
function buildRequestPayload(refId) {
  return {
    id: refId,
    name: getEl('clientName').value.trim(),
    phone: getEl('clientPhone').value.trim(),
    email: getEl('clientEmail').value.trim() || null,
    event_type: selectedEvent,
    event_date: getEl('eventDate').value.trim(),
    venue: getEl('eventVenue').value.trim() || null,
    guests: parseInt(getEl('guestCount').value),
    meal_type: getEl('mealType').value || null,
    menu: menuData,
    notes: getEl('specialNotes').value.trim() || null,
    preferred_time: getEl('preferredTime').value || null,
    status: 'new'
  };
}

/**
 * Submit menu request to database
 */
async function submitRequest() {
  const btn = getEl('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';
  
  const refId = generateReferenceId();
  const payload = buildRequestPayload(refId);
  
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('requests').insert(payload);
      if (error) {
        showToast('⚠️ Submission failed: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = '✅ Submit Request';
        return;
      }
    } else {
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem('annapurna_local_requests') || '[]');
      local.unshift({ ...payload, submitted_at: new Date().toISOString() });
      localStorage.setItem('annapurna_local_requests', JSON.stringify(local));
      showToast('⚠️ Saved locally (Supabase not connected)', false);
    }
    
    getEl('refNum').textContent = 'Ref: ' + refId;
    goStep(5);
    showToast('🎊 Request submitted successfully!', true);
  } catch (e) {
    showToast('⚠️ Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✅ Submit Request';
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  menuData = { starters: [], main: [], sweets: [], drinks: [] };
  selectedEvent = '';
  
  ['eventDate', 'eventVenue', 'guestCount', 'specialNotes', 'clientName', 'clientPhone', 'clientEmail']
    .forEach(id => getEl(id).value = '');
  
  ['mealType', 'preferredTime', 'referral']
    .forEach(id => {
      const el = getEl(id);
      if (el) el.selectedIndex = 0;
    });
  
  document.querySelectorAll('.event-chip').forEach(c => c.classList.remove('selected'));
  ['starters', 'main', 'sweets', 'drinks'].forEach(renderList);
  
  getEl('menuPreviewWrap').innerHTML = '';
  goStep(1);
}

// ═════════════════════════════════════════════════════════
// CALLBACK REQUEST (CONTACT SECTION)
// ═════════════════════════════════════════════════════════

/**
 * Submit callback request from contact section
 */
async function submitCallback() {
  const name = getEl('cbName').value.trim();
  const phone = getEl('cbPhone').value.trim();
  
  if (!name) return showToast('⚠️ Please enter your name');
  if (!phone) return showToast('⚠️ Please enter your phone number');
  
  const btn = getEl('cbSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending…';
  
  const payload = {
    name,
    phone,
    time: getEl('cbTime').value,
    message: getEl('cbMessage').value.trim() || null
  };
  
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('callbacks').insert(payload);
      if (error) {
        showToast('⚠️ Failed: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = '📞 Request Callback';
        return;
      }
    } else {
      const local = JSON.parse(localStorage.getItem('annapurna_local_callbacks') || '[]');
      local.unshift({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('annapurna_local_callbacks', JSON.stringify(local));
    }
    
    ['cbName', 'cbPhone', 'cbMessage'].forEach(id => getEl(id).value = '');
    showToast('📞 Callback request sent! We\'ll call you soon.', true);
  } catch (e) {
    showToast('⚠️ Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📞 Request Callback';
  }
}
