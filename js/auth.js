/**
 * AUTH.JS - Owner Authentication (Supabase Login)
 * Handles login, logout, and session management
 */

'use strict';

// ═════════════════════════════════════════════════════════
// LOGIN VALIDATION & ERROR HANDLING
// ═════════════════════════════════════════════════════════

/**
 * Validate login form inputs
 * @returns {Object|null} Returns {email, password} if valid, null otherwise
 */
function validateLoginForm() {
  const email = getEl('ownerEmail').value.trim();
  const pass = getEl('ownerPass').value;
  const errEl = getEl('loginErr');
  
  errEl.style.display = 'none';
  
  if (!email || !pass) {
    errEl.textContent = 'Please enter email and password';
    errEl.style.display = 'block';
    return null;
  }
  
  return { email, password: pass };
}

/**
 * Format error message for display
 * @param {Error} error - Supabase auth error
 * @returns {string} User-friendly error message
 */
function formatAuthError(error) {
  if (error.message === 'Invalid login credentials') {
    return '❌ Wrong email or password';
  }
  return '❌ ' + error.message;
}

// ═════════════════════════════════════════════════════════
// LOGIN / LOGOUT
// ═════════════════════════════════════════════════════════

/**
 * Attempt login with email and password
 */
async function ownerLogin() {
  const creds = validateLoginForm();
  if (!creds) return;
  
  if (!supabaseClient) {
    showToast('⚠️ Database not configured');
    return;
  }
  
  const btn = getEl('loginBtn');
  const errEl = getEl('loginErr');
  
  btn.innerHTML = '<span class="spinner"></span> Signing in…';
  btn.disabled = true;
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: creds.email,
      password: creds.password
    });
    
    if (error) {
      errEl.textContent = formatAuthError(error);
      errEl.style.display = 'block';
      btn.innerHTML = 'Login →';
      btn.disabled = false;
      return;
    }
    
    showDashboard();
  } catch (e) {
    errEl.textContent = '❌ ' + e.message;
    errEl.style.display = 'block';
  } finally {
    btn.innerHTML = 'Login →';
    btn.disabled = false;
  }
}

/**
 * Logout user and return to login screen
 */
async function ownerLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  
  getEl('dashPanel').classList.remove('active');
  getEl('dashLogin').style.display = 'block';
  getEl('ownerPass').value = '';
  getEl('ownerEmail').value = '';
}

// ═════════════════════════════════════════════════════════
// DASHBOARD DISPLAY
// ═════════════════════════════════════════════════════════

/**
 * Show dashboard and load initial data
 */
function showDashboard() {
  getEl('dashLogin').style.display = 'none';
  getEl('dashPanel').classList.add('active');
  renderDash('all');
}
