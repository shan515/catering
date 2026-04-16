/**
 * TIFFIN-DASHBOARD.JS - Customer Dashboard Logic
 * Renders subscription details, menus, and order history
 */

'use strict';

let currentCustomer = null;
let currentSubscription = null;

/**
 * Initialize dashboard on page load
 */
window.addEventListener('load', async () => {
  try {
    // Check authentication
    const user = await checkTiffinAuth();
    if (!user) return;
    
    // Hide loading
    const loading = document.getElementById('pageLoading');
    if (loading) loading.style.display = 'none';
    
    // Load customer data
    currentCustomer = await getCurrentTiffinCustomer();
    if (!currentCustomer) throw new Error('Could not load customer profile');
    
    // Load and render subscription
    currentSubscription = await getActiveSubscription(user.id);
    if (currentSubscription) {
      renderSubscriptionCard();
      await renderWeeklyMenu();
    } else {
      renderNoSubscription();
    }
    
    // Render order history
    const orders = await fetchCustomerOrderHistory(user.id);
    renderOrderHistory(orders);
    
  } catch (err) {
    console.error('Dashboard init error:', err);
    showToast('Error loading dashboard', 'error');
  }
});

/**
 * Render subscription details card
 */
function renderSubscriptionCard() {
  if (!currentSubscription) return;
  
  const card = document.getElementById('subscriptionCard');
  if (!card) return;
  
  const subType = currentSubscription.subscription_type;
  const subTypeLabel = subType === 'daily' ? 'Daily' : subType === 'weekly' ? 'Weekly (7 days)' : 'Monthly (30 days)';
  const statusColor = currentSubscription.status === 'active' ? '#27ae60' : 
                      currentSubscription.status === 'paused' ? '#f39c12' : '#e74c3c';
  
  // Calculate next delivery date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(currentSubscription.start_date);
  const endDate = new Date(currentSubscription.end_date);
  
  let nextDeliveryDate = 'N/A';
  if (currentSubscription.status === 'active') {
    if (today <= endDate) {
      nextDeliveryDate = today.toLocaleDateString('en-IN');
    }
  }
  
  // Update elements
  const statusBadge = document.getElementById('statusBadge');
  if (statusBadge) {
    statusBadge.textContent = currentSubscription.status.toUpperCase();
    statusBadge.style.color = statusColor;
  }
  
  const nextDelivDate = document.getElementById('nextDelivDate');
  if (nextDelivDate) {
    nextDelivDate.textContent = `Next Delivery: ${nextDeliveryDate}`;
  }
  
  const subType_el = document.getElementById('subType');
  if (subType_el) subType_el.textContent = subTypeLabel;
  
  const subPricePerDay = document.getElementById('subPricePerDay');
  if (subPricePerDay) subPricePerDay.textContent = `₹${currentSubscription.price_per_day}`;
  
  const subTotalCost = document.getElementById('subTotalCost');
  if (subTotalCost) subTotalCost.textContent = `₹${currentSubscription.total_cost}`;
  
  const subStartDate = document.getElementById('subStartDate');
  if (subStartDate) subStartDate.textContent = new Date(currentSubscription.start_date).toLocaleDateString('en-IN');
}

/**
 * Render weekly menu with add-on options
 */
async function renderWeeklyMenu() {
  try {
    if (!currentSubscription) return;
    
    const menus = await fetchTiffinMenus();
    const addons = await fetchAddons();
    const orders = await fetchSubscriptionOrders(currentSubscription.id);
    
    const grid = document.getElementById('weeklyMenuGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(currentSubscription.end_date);
    
    for (let i = 0; i < 7; i++) {
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() + i);
      
      if (orderDate > endDate) break; // Don't show beyond subscription end
      
      const dayOfWeek = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1; // 0=Mon, 6=Sun
      const dayName = getDayName(dayOfWeek);
      const menu = menus[dayOfWeek];
      const order = orders.find(o => o.order_date === orderDate.toISOString().split('T')[0]);
      const selectedAddons = order?.addons_selected ? JSON.parse(order.addons_selected) : [];
      
      const card = document.createElement('div');
      card.className = 'menu-day-card';
      
      const items = menu.items || { starters: [], main: [], sweets: [], drinks: [] };
      const addonCheckboxes = addons.map(addon => `
        <label class="addon-checkbox">
          <input type="checkbox" 
                 data-addon-id="${addon.id}" 
                 data-order-date="${orderDate.toISOString().split('T')[0]}"
                 ${selectedAddons.includes(addon.id) ? 'checked' : ''}
                 onchange="updateOrderAddonCheckbox(this)" />
          <strong>${addon.name}</strong> +₹${addon.price_per_unit}
        </label>
      `).join('');
      
      card.innerHTML = `
        <div class="menu-day-header">${dayName} • ${orderDate.toLocaleDateString('en-IN')}</div>
        <div class="menu-day-items">
          ${items.main && items.main.length > 0 ? `<div><strong>🍲 Main:</strong> ${items.main.join(', ')}</div>` : '<div style="color:#999;">No menu</div>'}
          ${items.starters && items.starters.length > 0 ? `<div><strong>🥒 Starters:</strong> ${items.starters.join(', ')}</div>` : ''}
          ${items.sweets && items.sweets.length > 0 ? `<div><strong>🍮 Sweets:</strong> ${items.sweets.join(', ')}</div>` : ''}
          ${items.drinks && items.drinks.length > 0 ? `<div><strong>🥤 Drinks:</strong> ${items.drinks.join(', ')}</div>` : ''}
        </div>
        <div class="addon-section">
          <div style="font-weight:700;margin-bottom:.5rem;font-size:.85rem;">Add to this tiffin:</div>
          ${addonCheckboxes}
        </div>
      `;
      grid.appendChild(card);
    }
  } catch (err) {
    console.error('Error rendering weekly menu:', err);
  }
}

/**
 * Update add-on selection for an order
 */
async function updateOrderAddonCheckbox(checkbox) {
  try {
    if (!currentSubscription) return;
    
    const orderDate = checkbox.dataset.orderDate;
    const addonId = checkbox.dataset.addonId;
    
    // Get all selected addons for this date
    const allCheckboxes = document.querySelectorAll(`input[data-order-date="${orderDate}"][type="checkbox"]:checked`);
    const selectedAddonIds = Array.from(allCheckboxes).map(cb => cb.dataset.addonId);
    
    const success = await updateOrderAddons(currentSubscription.id, orderDate, selectedAddonIds);
    if (success) {
      showToast('✓ Add-ons updated', 'success');
    } else {
      showToast('Could not update add-ons', 'error');
      checkbox.checked = !checkbox.checked; // Revert
    }
  } catch (err) {
    console.error('Error updating add-ons:', err);
  }
}

/**
 * Render order history / delivery history
 */
function renderOrderHistory(orders) {
  try {
    const historySection = document.getElementById('historySection');
    const table = document.getElementById('ordersTable');
    
    if (!historySection || !table) return;
    
    if (orders.length === 0) {
      historySection.style.display = 'block';
      table.innerHTML = '<p style="text-align:center;color:#999;">No delivery history yet</p>';
      return;
    }
    
    historySection.style.display = 'block';
    
    const html = `
      <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
        <thead>
          <tr style="background:var(--cream);border-bottom:2px solid #ddd;">
            <th style="padding:.5rem;text-align:left;">Date</th>
            <th style="padding:.5rem;text-align:left;">Plan</th>
            <th style="padding:.5rem;text-align:left;">Add-ons</th>
            <th style="padding:.5rem;text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.slice(0, 20).map(order => {
            const date = new Date(order.order_date).toLocaleDateString('en-IN');
            const plan = order.tiffin_subscriptions?.[0]?.subscription_type || '—';
            const addons = order.addons_selected ? (JSON.parse(order.addons_selected).length > 0 ? '✓' : '—') : '—';
            const status = order.status === 'delivered' ? '✓ Delivered' : order.status === 'pending' ? '📦 Pending' : '❌ Cancelled';
            
            return `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:.5rem;">${date}</td>
                <td style="padding:.5rem;">${plan}</td>
                <td style="padding:.5rem;">${addons}</td>
                <td style="padding:.5rem;text-align:center;font-weight:700;">${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    table.innerHTML = html;
  } catch (err) {
    console.error('Error rendering order history:', err);
  }
}

/**
 * Render when customer has no active subscription
 */
function renderNoSubscription() {
  const card = document.getElementById('subscriptionCard');
  const thisWeekSection = document.getElementById('thisWeekSection');
  
  if (card) {
    card.innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">📦</div>
        <h3>No Active Subscription</h3>
        <p style="color:#666;">You don't have an active tiffin subscription yet.</p>
        <button class="btn-primary" style="margin-top:1rem;" onclick="window.location.href='tiffin_service.html'">
          🍛 Browse Plans
        </button>
      </div>
    `;
  }
  
  if (thisWeekSection) {
    thisWeekSection.style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════
// PAUSE/CANCEL/EXTEND ACTIONS
// ════════════════════════════════════════════════════════

/**
 * Pause subscription
 */
async function pauseSubscription() {
  try {
    if (!currentSubscription) return;
    
    const duration = document.getElementById('pauseDuration')?.value;
    
    const success = await pauseSubscription(currentSubscription.id, duration);
    if (success) {
      closeModal('pauseModal');
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    console.error('Error pausing:', err);
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription() {
  try {
    if (!currentSubscription) return;
    
    const reason = document.getElementById('cancelReason')?.value || '';
    
    const success = await cancelSubscription(currentSubscription.id, reason);
    if (success) {
      closeModal('cancelModal');
    }
  } catch (err) {
    console.error('Error cancelling:', err);
  }
}

/**
 * Extend subscription
 */
async function extendSubscription() {
  try {
    if (!currentSubscription) return;
    
    const months = parseInt(document.getElementById('extendMonths')?.value) || 1;
    const daysToAdd = months * 30; // Approximate
    
    const success = await extendSubscription(currentSubscription.id, daysToAdd);
    if (success) {
      closeModal('extendModal');
      showToast('Extension initiated. Invoice will be sent shortly.', 'info');
      setTimeout(() => {
        location.reload();
      }, 2000);
    }
  } catch (err) {
    console.error('Error extending:', err);
  }
}

/**
 * Update account settings
 */
async function updateAccountSettings() {
  try {
    if (!currentCustomer) return;
    
    const name = document.getElementById('accName')?.value?.trim();
    const phone = document.getElementById('accPhone')?.value?.trim();
    const address = document.getElementById('accAddress')?.value?.trim();
    const instructions = document.getElementById('accInstructions')?.value?.trim();
    
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient
      .from('tiffin_customers')
      .update({
        full_name: name,
        phone,
        address,
        delivery_instructions: instructions
      })
      .eq('id', currentCustomer.id);
    
    if (error) throw error;
    
    showToast('✓ Account updated', 'success');
  } catch (err) {
    console.error('Error updating account:', err);
    showToast('Could not update account', 'error');
  }
}

/**
 * Switch dashboard tabs
 */
function switchDashboardTab(tab) {
  const subscriptionCard = document.getElementById('subscriptionCard');
  const thisWeekSection = document.getElementById('thisWeekSection');
  const accountSection = document.getElementById('accountSection');
  const historySection = document.getElementById('historySection');
  
  // Hide all
  if (subscriptionCard) subscriptionCard.style.display = 'none';
  if (thisWeekSection) thisWeekSection.style.display = 'none';
  if (accountSection) accountSection.style.display = 'none';
  if (historySection) historySection.style.display = 'none';
  
  // Show selected
  if (tab === 'subscription' && subscriptionCard) subscriptionCard.style.display = 'block';
  if (tab === 'menu' && thisWeekSection) thisWeekSection.style.display = 'block';
  if (tab === 'account' && accountSection) accountSection.style.display = 'block';
  if (tab === 'history' && historySection) historySection.style.display = 'block';
}
