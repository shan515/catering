/**
 * TIFFIN-AUTH.JS - Customer Authentication
 * Handles signup, login, logout for tiffin subscribers
 */

'use strict';

/**
 * Show auth modal
 */
function showAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'flex';
    switchAuthTab('signup');
  }
}

/**
 * Switch between signup and login tabs
 */
function switchAuthTab(tab) {
  const signupTab = document.getElementById('signupTab');
  const loginTab = document.getElementById('loginTab');
  const signupBtn = document.getElementById('signupTabBtn');
  const loginBtn = document.getElementById('loginTabBtn');
  
  if (tab === 'signup') {
    if (signupTab) signupTab.style.display = 'block';
    if (loginTab) loginTab.style.display = 'none';
    if (signupBtn) signupBtn.classList.add('active');
    if (loginBtn) loginBtn.classList.remove('active');
  } else {
    if (signupTab) signupTab.style.display = 'none';
    if (loginTab) loginTab.style.display = 'block';
    if (signupBtn) signupBtn.classList.remove('active');
    if (loginBtn) loginBtn.classList.add('active');
  }
}

/**
 * Sign up new customer
 */
async function tiffinSignup() {
  try {
    const name = document.getElementById('signupName')?.value?.trim();
    const email = document.getElementById('signupEmail')?.value?.trim();
    const phone = document.getElementById('signupPhone')?.value?.trim();
    const address = document.getElementById('signupAddress')?.value?.trim();
    const password = document.getElementById('signupPass')?.value;
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    const signupErr = document.getElementById('signupErr');
    
    // Validation
    if (!name || !email || !phone || !address || !password) {
      if (signupErr) signupErr.textContent = '✗ All fields required';
      return;
    }
    if (password.length < 6) {
      if (signupErr) signupErr.textContent = '✗ Password must be at least 6 characters';
      return;
    }
    
    if (signupBtn) signupBtn.disabled = true;
    if (signupBtnText) signupBtnText.textContent = 'Creating account...';
    if (signupErr) signupErr.textContent = '';
    
    // Create auth user
    if (!supabaseClient) {
      throw new Error('Database not initialized');
    }
    
    const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
      email,
      password
    });
    
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('Signup failed - no user returned');
    
    // Create tiffin customer profile
    const { error: profileErr } = await supabaseClient.from('tiffin_customers').insert([{
      id: authData.user.id,
      full_name: name,
      phone,
      address,
      delivery_instructions: ''
    }]);
    
    if (profileErr) throw profileErr;
    
    // Success
    showToast('✓ Account created! Redirecting to subscription page...', 'success');
    setTimeout(() => {
      window.location.href = 'tiffin_dashboard.html';
    }, 1500);
    
  } catch (err) {
    console.error('Signup error:', err);
    const errMsg = err.message || 'Signup failed. Please try again.';
    const signupErr = document.getElementById('signupErr');
    if (signupErr) signupErr.textContent = `✗ ${errMsg}`;
  } finally {
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    if (signupBtn) signupBtn.disabled = false;
    if (signupBtnText) signupBtnText.textContent = 'Create Account →';
  }
}

/**
 * Login existing customer
 */
async function tiffinLogin() {
  try {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPass')?.value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginErr = document.getElementById('loginErr');
    
    if (!email || !password) {
      if (loginErr) loginErr.textContent = '✗ Email and password required';
      return;
    }
    
    if (loginBtn) loginBtn.disabled = true;
    if (loginBtnText) loginBtnText.textContent = 'Logging in...';
    if (loginErr) loginErr.textContent = '';
    
    if (!supabaseClient) throw new Error('Database not initialized');
    
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    showToast('✓ Logged in! Redirecting to your dashboard...', 'success');
    setTimeout(() => {
      window.location.href = 'tiffin_dashboard.html';
    }, 1500);
    
  } catch (err) {
    console.error('Login error:', err);
    const errMsg = err.message || 'Login failed. Please try again.';
    const loginErr = document.getElementById('loginErr');
    if (loginErr) loginErr.textContent = `✗ ${errMsg}`;
  } finally {
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    if (loginBtn) loginBtn.disabled = false;
    if (loginBtnText) loginBtnText.textContent = 'Login →';
  }
}

/**
 * Logout current customer
 */
async function tiffinLogout() {
  try {
    if (!supabaseClient) throw new Error('Database not initialized');
    
    await supabaseClient.auth.signOut();
    showToast('Logged out', 'info');
    setTimeout(() => {
      window.location.href = 'tiffin_service.html';
    }, 1000);
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout error', 'error');
  }
}

/**
 * Check if customer is logged in
 * Redirect to login if not
 */
async function checkTiffinAuth() {
  try {
    if (!supabaseClient) return false;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session?.user) {
      return session.user;
    } else {
      // Redirect to login
      if (window.location.pathname.includes('tiffin_dashboard')) {
        window.location.href = 'tiffin_service.html';
      }
      return null;
    }
  } catch (err) {
    console.error('Auth check error:', err);
    return null;
  }
}

/**
 * Get current logged-in customer's profile
 */
async function getCurrentTiffinCustomer() {
  try {
    if (!supabaseClient) return null;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabaseClient
      .from('tiffin_customers')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching customer:', err);
    return null;
  }
}
