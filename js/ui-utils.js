/**
 * UI-UTILS.JS - DOM Utilities & UI Helpers
 * Modals, toasts, scrolling, and general DOM manipulation
 */

'use strict';

// ═════════════════════════════════════════════════════════
// DOM HELPERS
// ═════════════════════════════════════════════════════════

/**
 * Scroll to a selector smoothly
 * @param {string} selector - CSS selector to scroll to
 */
function smoothScroll(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Get element by ID (shorthand)
 * @param {string} id - Element ID
 * @returns {Element|null}
 */
function getEl(id) {
  return document.getElementById(id);
}

/**
 * Add or remove class from element
 * @param {Element} el - DOM element
 * @param {string} className - Class name
 * @param {boolean} add - true to add, false to remove
 */
function setClass(el, className, add) {
  if (!el) return;
  if (add) {
    el.classList.add(className);
  } else {
    el.classList.remove(className);
  }
}

// ═════════════════════════════════════════════════════════
// MODALS
// ═════════════════════════════════════════════════════════

/**
 * Close modal with fade-out animation
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
  const modal = getEl(modalId);
  if (!modal) return;
  
  modal.classList.add('hide');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('hide');
    document.body.style.overflow = '';
  }, 200);
}

/**
 * Open modal (generic)
 * @param {string} modalId - ID of modal to open
 */
function openModal(modalId) {
  const modal = getEl(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// ═════════════════════════════════════════════════════════
// NOTIFICATIONS / TOASTS
// ═════════════════════════════════════════════════════════

let toastTimeout;

/**
 * Show a toast notification at bottom-right
 * @param {string} message - Message to display
 * @param {boolean} isSuccess - true for green success, false for red error
 * @param {number} duration - How long to show (ms). Default 3500
 */
function showToast(message, isSuccess = false, duration = 3500) {
  let t = getEl('toast');
  
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  
  t.className = 'toast' + (isSuccess ? ' green' : '');
  t.innerHTML = message;
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ═════════════════════════════════════════════════════════
// PROGRESS BAR / FORM STEP PROGRESS
// ═════════════════════════════════════════════════════════

/**
 * Update form progress indicators (dots and lines)
 * @param {number} stepNumber - Current step (1-4)
 */
function updateProgress(stepNumber) {
  for (let i = 1; i <= 4; i++) {
    const ps = getEl('ps' + i);
    if (ps) {
      ps.classList.remove('active', 'done');
      if (i < stepNumber) {
        ps.classList.add('done');
      } else if (i === stepNumber) {
        ps.classList.add('active');
      }
    }
  }
  
  for (let i = 1; i <= 3; i++) {
    const pl = getEl('pl' + i);
    if (pl) {
      pl.classList.toggle('done', i < stepNumber);
    }
  }
}
