/**
 * ADMIN-TIFFIN.JS - Admin Panel for Tiffin Management
 * Handle menu editing, pricing, and subscription management
 */

'use strict';

let adminTiffinState = {
  currentMenus: null,
  currentPricing: null,
  currentAddons: null,
  currentSubscriptions: []
};

/**
 * Initialize admin tiffin panel
 */
async function initAdminTiffinPanel() {
  try {
    // Only show if owner is logged in (check is done in admin.html)
    const panel = document.getElementById('tiffinAdminPanel');
    if (!panel) return;
    
    await loadAllTiffinData();
    renderTiffinAdminUI();
    
  } catch (err) {
    console.error('Error initializing tiffin admin:', err);
  }
}

/**
 * Load all tiffin data for admin
 */
async function loadAllTiffinData() {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    // Load menus
    const { data: menus, error: menuErr } = await supabaseClient
      .from('tiffin_menus')
      .select('*')
      .order('day_of_week', { ascending: true });
    if (menuErr) throw menuErr;
    adminTiffinState.currentMenus = menus;
    
    // Load pricing
    const { data: pricing, error: pricingErr } = await supabaseClient
      .from('tiffin_pricing')
      .select('*');
    if (pricingErr) throw pricingErr;
    adminTiffinState.currentPricing = pricing;
    
    // Load add-ons
    const { data: addons, error: addonsErr } = await supabaseClient
      .from('tiffin_addons')
      .select('*')
      .order('name', { ascending: true });
    if (addonsErr) throw addonsErr;
    adminTiffinState.currentAddons = addons;
    
    // Load subscriptions
    const { data: subs, error: subsErr } = await supabaseClient
      .from('tiffin_subscriptions')
      .select('*, tiffin_customers(full_name, phone, address)')
      .order('created_at', { ascending: false });
    if (subsErr) throw subsErr;
    adminTiffinState.currentSubscriptions = subs;
    
  } catch (err) {
    console.error('Error loading tiffin data:', err);
  }
}

/**
 * Render tiffin admin UI sections
 */
function renderTiffinAdminUI() {
  const panel = document.getElementById('tiffinAdminPanel');
  if (!panel) return;
  
  panel.innerHTML = `
    <div style="margin-bottom:2rem;">
      <h2 style="font-family:'Playfair Display',serif;color:var(--maroon-deep);margin-bottom:1.5rem;">🍛 Tiffin Service Management</h2>
      
      <div style="display:flex;gap:.5rem;margin-bottom:2rem;flex-wrap:wrap;">
        <button class="filter-btn tiffin-tab-btn" id="tiffin-tab-menu" onclick="switchTiffinAdminTab('menu')" style="padding:.6rem 1rem;">📅 Weekly Menu</button>
        <button class="filter-btn tiffin-tab-btn" id="tiffin-tab-pricing" onclick="switchTiffinAdminTab('pricing')" style="padding:.6rem 1rem;">💳 Pricing</button>
        <button class="filter-btn tiffin-tab-btn" id="tiffin-tab-addons" onclick="switchTiffinAdminTab('addons')" style="padding:.6rem 1rem;">🥒 Add-ons</button>
        <button class="filter-btn tiffin-tab-btn" id="tiffin-tab-subscriptions" onclick="switchTiffinAdminTab('subscriptions')" style="padding:.6rem 1rem;">👥 Subscriptions</button>
      </div>
    </div>
    
    <div id="tiffin-menu-section" class="tiffin-tab-section"></div>
    <div id="tiffin-pricing-section" class="tiffin-tab-section" style="display:none;"></div>
    <div id="tiffin-addons-section" class="tiffin-tab-section" style="display:none;"></div>
    <div id="tiffin-subscriptions-section" class="tiffin-tab-section" style="display:none;"></div>
  `;
  
  renderMenuManager();
  renderPricingManager();
  renderAddonsManager();
  renderSubscriptionsManager();
  
  switchTiffinAdminTab('menu');
}

/**
 * Switch between admin tiffin tabs
 */
function switchTiffinAdminTab(tab) {
  // Hide all sections
  document.querySelectorAll('.tiffin-tab-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.tiffin-tab-btn').forEach(b => b.classList.remove('active'));
  
  // Show selected
  const section = document.getElementById(`tiffin-${tab}-section`);
  const btn = document.getElementById(`tiffin-tab-${tab}`);
  
  if (section) section.style.display = 'block';
  if (btn) btn.classList.add('active');
}

// ════════════════════════════════════════════════════════
// MENU MANAGER
// ════════════════════════════════════════════════════════

/**
 * Render menu manager (edit weekly menus)
 */
function renderMenuManager() {
  const section = document.getElementById('tiffin-menu-section');
  if (!section || !adminTiffinState.currentMenus) return;
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  let html = '<div style="margin-top:1rem;"><h3>Edit Weekly Menu</h3>';
  
  adminTiffinState.currentMenus.forEach((menu, index) => {
    const items = menu.items || { starters: [], main: [], sweets: [], drinks: [] };
    const starters = Array.isArray(items.starters) ? items.starters.join('\n') : '';
    const main = Array.isArray(items.main) ? items.main.join('\n') : '';
    const sweets = Array.isArray(items.sweets) ? items.sweets.join('\n') : '';
    const drinks = Array.isArray(items.drinks) ? items.drinks.join('\n') : '';
    
    html += `
      <div class="menu-editor-day" style="background:var(--cream);padding:1.5rem;border-radius:8px;margin-bottom:1.5rem;">
        <h4 style="margin-top:0;color:var(--maroon-deep);">${days[index]}</h4>
        
        <div class="input-group">
          <label>Starters (one per line)</label>
          <textarea id="menu-starters-${index}" placeholder="Samosa&#10;Pakora" rows="2">${starters}</textarea>
        </div>
        
        <div class="input-group">
          <label>Main Course (one per line)</label>
          <textarea id="menu-main-${index}" placeholder="Paneer Butter Masala&#10;Chikpea Curry" rows="2">${main}</textarea>
        </div>
        
        <div class="input-group">
          <label>Sweets/Desserts (one per line)</label>
          <textarea id="menu-sweets-${index}" placeholder="Kheer&#10;Halwa" rows="1">${sweets}</textarea>
        </div>
        
        <div class="input-group">
          <label>Drinks (one per line)</label>
          <textarea id="menu-drinks-${index}" placeholder="Lassi&#10;Chaas" rows="1">${drinks}</textarea>
        </div>
        
        <button class="btn-primary" onclick="saveMenuForDay(${index})" style="margin-top:.5rem;">💾 Save ${days[index]}</button>
      </div>
    `;
  });
  
  html += '</div>';
  section.innerHTML = html;
}

/**
 * Save menu for a specific day
 */
async function saveMenuForDay(dayOfWeek) {
  try {
    const starters = document.getElementById(`menu-starters-${dayOfWeek}`)?.value || '';
    const main = document.getElementById(`menu-main-${dayOfWeek}`)?.value || '';
    const sweets = document.getElementById(`menu-sweets-${dayOfWeek}`)?.value || '';
    const drinks = document.getElementById(`menu-drinks-${dayOfWeek}`)?.value || '';
    
    const items = {
      starters: starters.split('\n').filter(s => s.trim()),
      main: main.split('\n').filter(s => s.trim()),
      sweets: sweets.split('\n').filter(s => s.trim()),
      drinks: drinks.split('\n').filter(s => s.trim())
    };
    
    if (!supabaseClient) throw new Error('Database not initialized');
    
    // Check if menu exists for this day
    const existingMenu = adminTiffinState.currentMenus.find(m => m.day_of_week === dayOfWeek);
    
    if (existingMenu) {
      const { error } = await supabaseClient
        .from('tiffin_menus')
        .update({ items })
        .eq('id', existingMenu.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('tiffin_menus')
        .insert([{ day_of_week: dayOfWeek, items }]);
      if (error) throw error;
    }
    
    showToast(`✓ ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek]} menu saved`, 'success');
    await loadAllTiffinData();
    renderMenuManager();
    
  } catch (err) {
    console.error('Error saving menu:', err);
    showToast('Error saving menu', 'error');
  }
}

// ════════════════════════════════════════════════════════
// PRICING MANAGER
// ════════════════════════════════════════════════════════

/**
 * Render pricing manager
 */
function renderPricingManager() {
  const section = document.getElementById('tiffin-pricing-section');
  if (!section || !adminTiffinState.currentPricing) return;
  
  let html = '<div style="margin-top:1rem;"><h3>Subscription Pricing</h3>';
  
  adminTiffinState.currentPricing.forEach(pricing => {
    const label = pricing.subscription_type === 'daily' ? 'Daily' : 
                  pricing.subscription_type === 'weekly' ? 'Weekly (7 days)' : 
                  'Monthly (30 days)';
    
    html += `
      <div class="pricing-editor" style="background:var(--cream);padding:1.5rem;border-radius:8px;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h4 style="margin:0;">${label}</h4>
            <p style="color:#666;font-size:.9rem;margin:.3rem 0 0 0;">₹${pricing.price_value}</p>
          </div>
          <button class="btn-secondary" onclick="openPricingEditModal('${pricing.subscription_type}', ${pricing.price_value})">✏️ Edit</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  section.innerHTML = html;
}

/**
 * Open pricing edit modal
 */
function openPricingEditModal(type, currentPrice) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'pricingModal';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Edit Pricing</h3>
        <button class="modal-close" onclick="document.getElementById('pricingModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p>Subscription Type: <strong>${type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Monthly'}</strong></p>
        <div class="input-group">
          <label>Price (₹)</label>
          <input type="number" id="priceInput" value="${currentPrice}" step="0.01" />
        </div>
        <button class="btn-primary" style="width:100%;margin-top:1rem;" onclick="savePricing('${type}')">Save Price</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/**
 * Save pricing
 */
async function savePricing(type) {
  try {
    const newPrice = parseFloat(document.getElementById('priceInput')?.value) || 0;
    
    if (newPrice <= 0) {
      showToast('Price must be greater than 0', 'error');
      return;
    }
    
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient
      .from('tiffin_pricing')
      .update({ price_value: newPrice })
      .eq('subscription_type', type);
    
    if (error) throw error;
    
    showToast('✓ Pricing updated', 'success');
    document.getElementById('pricingModal')?.remove();
    await loadAllTiffinData();
    renderPricingManager();
    
  } catch (err) {
    console.error('Error saving pricing:', err);
    showToast('Error saving pricing', 'error');
  }
}

// ════════════════════════════════════════════════════════
// ADD-ONS MANAGER
// ════════════════════════════════════════════════════════

/**
 * Render add-ons manager
 */
function renderAddonsManager() {
  const section = document.getElementById('tiffin-addons-section');
  if (!section || !adminTiffinState.currentAddons) return;
  
  let html = '<div style="margin-top:1rem;"><h3>Add-on Options & Pricing</h3>';
  
  adminTiffinState.currentAddons.forEach(addon => {
    html += `
      <div class="addon-item" style="background:var(--cream);padding:1rem;border-radius:8px;margin-bottom:.8rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h5 style="margin:0;">${addon.name}</h5>
          <p style="color:#666;font-size:.9rem;margin:.3rem 0 0 0;">₹${addon.price_per_unit} per order</p>
        </div>
        <button class="btn-secondary" onclick="openAddonEditModal('${addon.id}', '${addon.name}', ${addon.price_per_unit})">✏️ Edit</button>
      </div>
    `;
  });
  
  html += '<button class="btn-primary" style="margin-top:1.5rem;" onclick="openNewAddonModal()">➕ Add New Add-on</button>';
  html += '</div>';
  section.innerHTML = html;
}

/**
 * Open add-on edit modal
 */
function openAddonEditModal(id, name, price) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'addonModal';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Edit Add-on</h3>
        <button class="modal-close" onclick="document.getElementById('addonModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="input-group">
          <label>Name</label>
          <input type="text" id="addonName" value="${name}" />
        </div>
        <div class="input-group">
          <label>Price (₹)</label>
          <input type="number" id="addonPrice" value="${price}" step="0.01" />
        </div>
        <div style="display:flex;gap:.5rem;margin-top:1.5rem;">
          <button class="btn-secondary" style="flex:1;" onclick="document.getElementById('addonModal').remove()">Cancel</button>
          <button class="btn-primary" style="flex:1;" onclick="saveAddon('${id}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/**
 * Open new add-on modal
 */
function openNewAddonModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'addonModal';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Create New Add-on</h3>
        <button class="modal-close" onclick="document.getElementById('addonModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="input-group">
          <label>Name</label>
          <input type="text" id="addonName" placeholder="e.g., Extra Rice" />
        </div>
        <div class="input-group">
          <label>Price (₹)</label>
          <input type="number" id="addonPrice" placeholder="20" step="0.01" />
        </div>
        <button class="btn-primary" style="width:100%;margin-top:1.5rem;" onclick="saveAddon(null)">Create Add-on</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/**
 * Save add-on
 */
async function saveAddon(id) {
  try {
    const name = document.getElementById('addonName')?.value?.trim();
    const price = parseFloat(document.getElementById('addonPrice')?.value) || 0;
    
    if (!name || price <= 0) {
      showToast('Name and valid price required', 'error');
      return;
    }
    
    if (!supabaseClient) throw new Error('Database not initialized');
    
    if (id) {
      // Update existing
      const { error } = await supabaseClient
        .from('tiffin_addons')
        .update({ name, price_per_unit: price })
        .eq('id', id);
      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabaseClient
        .from('tiffin_addons')
        .insert([{ name, price_per_unit: price }]);
      if (error) throw error;
    }
    
    showToast('✓ Add-on saved', 'success');
    document.getElementById('addonModal')?.remove();
    await loadAllTiffinData();
    renderAddonsManager();
    
  } catch (err) {
    console.error('Error saving add-on:', err);
    showToast('Error saving add-on', 'error');
  }
}

// ════════════════════════════════════════════════════════
// SUBSCRIPTIONS MANAGER
// ════════════════════════════════════════════════════════

/**
 * Render subscriptions manager
 */
function renderSubscriptionsManager() {
  const section = document.getElementById('tiffin-subscriptions-section');
  if (!section) return;
  
  if (!adminTiffinState.currentSubscriptions || adminTiffinState.currentSubscriptions.length === 0) {
    section.innerHTML = '<p style="text-align:center;color:#999;margin:2rem 0;">No subscriptions yet</p>';
    return;
  }
  
  let html = '<div style="margin-top:1rem;"><h3>Active Subscriptions</h3>';
  html += `<table style="width:100%;border-collapse:collapse;font-size:.9rem;">
    <thead>
      <tr style="background:var(--cream);border-bottom:2px solid #ddd;">
        <th style="padding:.5rem;text-align:left;">Customer</th>
        <th style="padding:.5rem;text-align:left;">Plan</th>
        <th style="padding:.5rem;text-align:left;">Cost</th>
        <th style="padding:.5rem;text-align:center;">Status</th>
        <th style="padding:.5rem;text-align:center;">Next Delivery</th>
      </tr>
    </thead>
    <tbody>`;
  
  adminTiffinState.currentSubscriptions.slice(0, 50).forEach(sub => {
    const customer = sub.tiffin_customers;
    const name = customer?.full_name || 'Unknown';
    const phone = customer?.phone || '—';
    const plan = sub.subscription_type === 'daily' ? 'Daily' : 
                 sub.subscription_type === 'weekly' ? 'Weekly' : 'Monthly';
    const cost = `₹${sub.total_cost}`;
    const status = sub.status.toUpperCase();
    const statusColor = sub.status === 'active' ? '#27ae60' : 
                        sub.status === 'paused' ? '#f39c12' : '#e74c3c';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(sub.end_date);
    const nextDelivery = today <= endDate ? today.toLocaleDateString('en-IN') : 'Ended';
    
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:.5rem;">
          <strong>${name}</strong>
          <div style="font-size:.8rem;color:#999;">${phone}</div>
        </td>
        <td style="padding:.5rem;">${plan}</td>
        <td style="padding:.5rem;">${cost}</td>
        <td style="padding:.5rem;text-align:center;color:${statusColor};font-weight:700;">${status}</td>
        <td style="padding:.5rem;text-align:center;">${nextDelivery}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  section.innerHTML = html;
}
