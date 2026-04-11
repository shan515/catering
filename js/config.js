/**
 * CONFIG.JS - Supabase Setup & Global Configuration
 * Handles initialization, configuration storage, and localStorage fallbacks
 */

'use strict';

// ═════════════════════════════════════════════════════════
// SUPABASE CLIENT & INITIALIZATION
// ═════════════════════════════════════════════════════════

let supabaseClient = null;

/**
 * Get stored Supabase configuration from localStorage
 * @returns {Object|null} Config object with url and key, or null if not set
 */
function getStoredConfig() {
  try {
    return JSON.parse(localStorage.getItem('annapurna_sb') || 'null');
  } catch {
    return null;
  }
}

/**
 * Initialize Supabase client with URL and key
 * @param {string} url - Supabase project URL
 * @param {string} key - Supabase anonymous key
 * @returns {boolean} Success status
 */
function initSupabase(url, key) {
  try {
    supabaseClient = window.supabase.createClient(url, key);
    return true;
  } catch (e) {
    console.error('Supabase init error:', e);
    return false;
  }
}

/**
 * Initialize page on load - checks for existing session and DB config
 */
window.addEventListener('load', async () => {
  try {
    const cfg = getStoredConfig();
    if (cfg && cfg.url && cfg.key) {
      initSupabase(cfg.url, cfg.key);
    }
    
    // Check for existing auth session
    if (supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) showDashboard();
      } catch (e) {
        console.error('Session check error:', e);
      }
    }
  } catch (e) {
    console.error('Page init error:', e);
  } finally {
    // Hide loading screen
    const pageLoading = document.getElementById('pageLoading');
    if (pageLoading) pageLoading.style.display = 'none';
  }
});
