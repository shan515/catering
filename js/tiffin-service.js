/**
 * TIFFIN-SERVICE.JS - Core Tiffin Service Logic
 * Handles menus, pricing, subscriptions, and add-ons
 */

'use strict';

// ════════════════════════════════════════════════════════
// MENU FUNCTIONS
// ════════════════════════════════════════════════════════

/**
 * Fetch this week's complete menu (Monday-Sunday)
 */
async function fetchTiffinMenus() {
  try {
    if (!supabaseClient) return null;
    
    const { data, error } = await supabaseClient
      .from('tiffin_menus')
      .select('*')
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    
    // Fill missing days with empty menus
    const weekMenu = {};
    for (let i = 0; i < 7; i++) {
      const found = data.find(m => m.day_of_week === i);
      weekMenu[i] = found || {
        id: null,
        day_of_week: i,
        items: { starters: [], main: [], sweets: [], drinks: [] }
      };
    }
    
    return weekMenu;
  } catch (err) {
    console.error('Error fetching menus:', err);
    return null;
  }
}

/**
 * Get human-readable day name
 */
function getDayName(dayOfWeek) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek] || 'Unknown';
}

/**
 * Render menu preview on public landing page
 */
async function renderMenuPreview() {
  try {
    const menus = await fetchTiffinMenus();
    if (!menus) return;
    
    const grid = document.getElementById('menuWeekGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const menu = menus[i];
      const dayName = getDayName(i);
      const items = menu.items || { starters: [], main: [], sweets: [], drinks: [] };
      
      const card = document.createElement('div');
      card.className = 'menu-day-card';
      card.innerHTML = `
        <div class="menu-day-header">${dayName}</div>
        <div class="menu-day-items">
          ${items.main && items.main.length > 0 ? `<div><strong>🍲 Main:</strong> ${items.main.join(', ')}</div>` : '<div style="color:#999;">No menu set</div>'}
          ${items.starters && items.starters.length > 0 ? `<div><strong>🥒 Starters:</strong> ${items.starters.join(', ')}</div>` : ''}
          ${items.sweets && items.sweets.length > 0 ? `<div><strong>🍮 Sweets:</strong> ${items.sweets.join(', ')}</div>` : ''}
          ${items.drinks && items.drinks.length > 0 ? `<div><strong>🥤 Drinks:</strong> ${items.drinks.join(', ')}</div>` : ''}
        </div>
      `;
      grid.appendChild(card);
    }
  } catch (err) {
    console.error('Error rendering menu preview:', err);
  }
}

// ════════════════════════════════════════════════════════
// PRICING FUNCTIONS
// ════════════════════════════════════════════════════════

/**
 * Fetch subscription pricing (daily, weekly, monthly)
 */
async function fetchSubscriptionPricing() {
  try {
    if (!supabaseClient) return null;
    
    const { data, error } = await supabaseClient
      .from('tiffin_pricing')
      .select('*');
    
    if (error) throw error;
    
    const pricing = {};
    data.forEach(p => {
      pricing[p.subscription_type] = p.price_value;
    });
    
    return pricing;
  } catch (err) {
    console.error('Error fetching pricing:', err);
    return { daily: 150, weekly: 950, monthly: 4200 }; // Fallback
  }
}

/**
 * Render pricing tier cards on public page
 */
async function renderPricingCards() {
  try {
    const pricing = await fetchSubscriptionPricing();
    if (!pricing) return;
    
    const grid = document.getElementById('pricingGrid');
    if (!grid) return;
    
    const plans = [
      { type: 'daily', label: 'Daily Tiffin', period: '1 day', description: 'Perfect for trying us out' },
      { type: 'weekly', label: 'Weekly Tiffin', period: '7 days', description: 'Most flexible commitment' },
      { type: 'monthly', label: 'Monthly Tiffin', period: '30 days', description: 'Best value & commitment' }
    ];
    
    grid.innerHTML = '';
    plans.forEach(plan => {
      const price = pricing[plan.type] || 0;
      const perDay = (price / (plan.type === 'daily' ? 1 : plan.type === 'weekly' ? 7 : 30)).toFixed(0);
      
      const card = document.createElement('div');
      card.className = 'pricing-card';
      if (plan.type === 'weekly') card.classList.add('pricing-popular');
      
      card.innerHTML = `
        <div class="pricing-badge">${plan.label}</div>
        <div class="pricing-period">${plan.period}</div>
        <div class="pricing-description">${plan.description}</div>
        <div class="pricing-amount">
          <span class="price-currency">₹</span><span class="price-value">${price}</span>
          <span class="price-period">/${plan.type === 'daily' ? 'day' : plan.type === 'weekly' ? 'week' : 'month'}</span>
        </div>
        <div class="pricing-subtext">₹${perDay}/day</div>
        <button class="btn-primary" style="width:100%;margin-top:1.5rem;" onclick="selectPricingPlan('${plan.type}', '${plan.label}', ${price})">
          Choose ${plan.label}
        </button>
        <div class="pricing-features">
          <div>✓ Fresh daily delivery</div>
          <div>✓ Flexible add-ons</div>
          <div>✓ Pause anytime</div>
          <div>✓ Manual billing</div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error rendering pricing:', err);
  }
}

/**
 * Handle plan selection - opens subscription modal
 */
function selectPricingPlan(type, label, price) {
  // Store in session for checkout flow
  sessionStorage.setItem('selectedTiffinPlan', JSON.stringify({ type, label, price }));
  
  // Show auth modal or redirect to dashboard
  const user = getCurrentUser();
  if (user) {
    window.location.href = 'tiffin_dashboard.html?selectPlan=' + type;
  } else {
    showAuthModal();
  }
}

/**
 * Get current logged-in user (helper)
 */
function getCurrentUser() {
  if (!supabaseClient) return null;
  return supabaseClient.auth.getUser().then(res => res.data?.user || null).catch(() => null);
}

// ════════════════════════════════════════════════════════
// ADD-ON FUNCTIONS
// ════════════════════════════════════════════════════════

/**
 * Fetch available add-ons (chapatis, rice, etc.)
 */
async function fetchAddons() {
  try {
    if (!supabaseClient) return [];
    
    const { data, error } = await supabaseClient
      .from('tiffin_addons')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching add-ons:', err);
    return [
      { id: 'chapati', name: 'Chapatis', price_per_unit: 20 },
      { id: 'rice', name: 'Rice', price_per_unit: 15 }
    ]; // Fallback
  }
}

// ════════════════════════════════════════════════════════
// SUBSCRIPTION FUNCTIONS
// ════════════════════════════════════════════════════════

/**
 * Create new tiffin subscription and generate daily orders
 * @param {string} customerId - Tiffin customer ID (auth.users.id)
 * @param {string} subscriptionType - 'daily', 'weekly', or 'monthly'
 * @param {number} daysCount - Number of days to subscribe (1, 7, or 30)
 * @param {Array} selectedAddons - Array of addon IDs to add to each day
 */
async function createTiffinSubscription(customerId, subscriptionType, daysCount, selectedAddons = []) {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const pricing = await fetchSubscriptionPricing();
    const totalCost = pricing[subscriptionType] || 150;
    const pricePerDay = (totalCost / daysCount).toFixed(2);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysCount);
    
    // Create subscription
    const { data: subData, error: subErr } = await supabaseClient
      .from('tiffin_subscriptions')
      .insert([{
        customer_id: customerId,
        subscription_type: subscriptionType,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        price_per_day: pricePerDay,
        total_cost: totalCost
      }])
      .select()
      .single();
    
    if (subErr) throw subErr;
    const subscriptionId = subData.id;
    
    // Create daily tiffin orders
    const menus = await fetchTiffinMenus();
    const orders = [];
    
    for (let i = 0; i < daysCount; i++) {
      const orderDate = new Date(startDate);
      orderDate.setDate(orderDate.getDate() + i);
      const dayOfWeek = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1; // Convert to 0=Mon, 6=Sun
      
      orders.push({
        subscription_id: subscriptionId,
        order_date: orderDate.toISOString().split('T')[0],
        menu_from_id: menus[dayOfWeek]?.id || null,
        addons_selected: JSON.stringify(selectedAddons),
        status: 'pending'
      });
    }
    
    const { error: ordersErr } = await supabaseClient
      .from('tiffin_orders')
      .insert(orders);
    
    if (ordersErr) throw ordersErr;
    
    return subData;
  } catch (err) {
    console.error('Error creating subscription:', err);
    throw err;
  }
}

/**
 * Get active subscription for current customer
 */
async function getActiveSubscription(customerId) {
  try {
    if (!supabaseClient) return null;
    
    const { data, error } = await supabaseClient
      .from('tiffin_subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    
    return data;
  } catch (err) {
    console.error('Error fetching active subscription:', err);
    return null;
  }
}

/**
 * Pause subscription temporarily
 */
async function pauseSubscription(subscriptionId, weeksToPause = 0) {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const updates = { status: 'paused' };
    
    const { error } = await supabaseClient
      .from('tiffin_subscriptions')
      .update(updates)
      .eq('id', subscriptionId);
    
    if (error) throw error;
    
    showToast('✓ Subscription paused. Resume anytime!', 'success');
    return true;
  } catch (err) {
    console.error('Error pausing subscription:', err);
    showToast('Error pausing subscription', 'error');
    return false;
  }
}

/**
 * Resume paused subscription
 */
async function resumeSubscription(subscriptionId) {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient
      .from('tiffin_subscriptions')
      .update({ status: 'active' })
      .eq('id', subscriptionId);
    
    if (error) throw error;
    
    showToast('✓ Subscription resumed!', 'success');
    return true;
  } catch (err) {
    console.error('Error resuming subscription:', err);
    showToast('Error resuming subscription', 'error');
    return false;
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId, reason = '') {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient
      .from('tiffin_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);
    
    if (error) throw error;
    
    // TODO: Log cancellation reason to analytics
    
    showToast('✓ Subscription cancelled', 'success');
    setTimeout(() => {
      window.location.href = 'tiffin_service.html';
    }, 1500);
    return true;
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    showToast('Error cancelling subscription', 'error');
    return false;
  }
}

/**
 * Extend subscription end date
 */
async function extendSubscription(subscriptionId, additionalDays) {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    // Fetch current subscription
    const { data: sub, error: fetchErr } = await supabaseClient
      .from('tiffin_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (fetchErr) throw fetchErr;
    
    const newEndDate = new Date(sub.end_date);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);
    
    // Update subscription
    const { error: updateErr } = await supabaseClient
      .from('tiffin_subscriptions')
      .update({ end_date: newEndDate.toISOString().split('T')[0] })
      .eq('id', subscriptionId);
    
    if (updateErr) throw updateErr;
    
    // Create new daily orders for extended dates
    const menus = await fetchTiffinMenus();
    const orders = [];
    
    for (let i = 0; i < additionalDays; i++) {
      const orderDate = new Date(sub.end_date);
      orderDate.setDate(orderDate.getDate() + i + 1);
      const dayOfWeek = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1;
      
      orders.push({
        subscription_id: subscriptionId,
        order_date: orderDate.toISOString().split('T')[0],
        menu_from_id: menus[dayOfWeek]?.id || null,
        addons_selected: '[]',
        status: 'pending'
      });
    }
    
    const { error: ordersErr } = await supabaseClient
      .from('tiffin_orders')
      .insert(orders);
    
    if (ordersErr) throw ordersErr;
    
    showToast('✓ Subscription extended!', 'success');
    return true;
  } catch (err) {
    console.error('Error extending subscription:', err);
    showToast('Error extending subscription', 'error');
    return false;
  }
}

// ════════════════════════════════════════════════════════
// ORDER/ADD-ON MANAGEMENT
// ════════════════════════════════════════════════════════

/**
 * Fetch all orders for a subscription
 */
async function fetchSubscriptionOrders(subscriptionId) {
  try {
    if (!supabaseClient) return [];
    
    const { data, error } = await supabaseClient
      .from('tiffin_orders')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('order_date', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

/**
 * Update add-ons for a specific order date
 */
async function updateOrderAddons(subscriptionId, orderDate, selectedAddonIds) {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient
      .from('tiffin_orders')
      .update({ addons_selected: JSON.stringify(selectedAddonIds) })
      .eq('subscription_id', subscriptionId)
      .eq('order_date', orderDate);
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error('Error updating order add-ons:', err);
    return false;
  }
}

/**
 * Fetch order history for current customer
 */
async function fetchCustomerOrderHistory(customerId, limit = 30) {
  try {
    if (!supabaseClient) return [];
    
    const { data, error } = await supabaseClient
      .from('tiffin_orders')
      .select('*, tiffin_subscriptions(subscription_type, status)')
      .eq('tiffin_subscriptions.customer_id', customerId)
      .order('order_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching order history:', err);
    return [];
  }
}
