/**
 * BuildPro Vision Embed Widget
 * 
 * Usage (one line on contractor's website):
 *   <script src="https://yourapp.com/embed.js" data-tenant="claflin-construction"></script>
 *
 * Options (data attributes):
 *   data-tenant     — required, tenant slug
 *   data-mode       — "button" (default), "inline", "popup"
 *   data-text       — button text (default: "Visualize Your Home")
 *   data-position   — button position: "bottom-right" (default), "bottom-left"
 *   data-color      — button color hex (default: tenant primary)
 *   data-target     — CSS selector for inline mode container
 *   data-width      — iframe width for inline (default: "100%")
 *   data-height     — iframe height for inline (default: "700px")
 */
(function() {
  'use strict';

  // Find our script tag to read config
  var scripts = document.querySelectorAll('script[data-tenant]');
  var script = scripts[scripts.length - 1];
  if (!script) return;

  var tenant = script.getAttribute('data-tenant');
  if (!tenant) return;

  var mode = script.getAttribute('data-mode') || 'button';
  var text = script.getAttribute('data-text') || 'Visualize Your Home ✨';
  var position = script.getAttribute('data-position') || 'bottom-right';
  var color = script.getAttribute('data-color') || '#B8860B';
  var target = script.getAttribute('data-target');
  var width = script.getAttribute('data-width') || '100%';
  var height = script.getAttribute('data-height') || '700px';

  // Base URL (same origin as this script)
  var base = script.src.replace(/\/embed\.js.*$/, '');
  var embedUrl = base + '/embed?tenant=' + encodeURIComponent(tenant);

  // ——— INLINE MODE ——————————————————————————————————
  if (mode === 'inline') {
    var container = target ? document.querySelector(target) : script.parentNode;
    if (!container) return;

    var iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.cssText = 'width:' + width + ';height:' + height + ';border:none;border-radius:16px;';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'camera');
    iframe.title = 'BuildPro Vision';
    container.appendChild(iframe);
    return;
  }

  // ——— MODAL OVERLAY ————————————————————————————————
  var overlay = null;
  var modalIframe = null;

  function createModal() {
    overlay = document.createElement('div');
    overlay.id = 'bpv-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.6)', 'z-index:999998',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'opacity:0', 'transition:opacity 0.2s ease',
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background:#fff', 'border-radius:16px', 'overflow:hidden',
      'width:100%', 'max-width:800px', 'height:90vh', 'max-height:750px',
      'position:relative', 'box-shadow:0 25px 50px rgba(0,0,0,0.25)',
      'transform:translateY(20px)', 'transition:transform 0.2s ease',
    ].join(';');

    // Close button
    var close = document.createElement('button');
    close.innerHTML = '&times;';
    close.style.cssText = [
      'position:absolute', 'top:8px', 'right:12px', 'z-index:10',
      'background:rgba(0,0,0,0.08)', 'border:none', 'border-radius:50%',
      'width:32px', 'height:32px', 'font-size:20px', 'cursor:pointer',
      'display:flex', 'align-items:center', 'justify-content:center',
      'color:#333', 'line-height:1',
    ].join(';');
    close.onclick = closeModal;

    modalIframe = document.createElement('iframe');
    modalIframe.src = embedUrl;
    modalIframe.style.cssText = 'width:100%;height:100%;border:none;';
    modalIframe.setAttribute('allow', 'camera');
    modalIframe.title = 'BuildPro Vision';

    modal.appendChild(close);
    modal.appendChild(modalIframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Click outside to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    // Escape to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    // Animate in
    requestAnimationFrame(function() {
      overlay.style.opacity = '1';
      modal.style.transform = 'translateY(0)';
    });
  }

  function closeModal() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(function() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      modalIframe = null;
    }, 200);
    document.body.style.overflow = '';
  }

  function openModal() {
    document.body.style.overflow = 'hidden';
    createModal();
  }

  // ——— POPUP MODE (trigger from existing element) ———
  if (mode === 'popup') {
    if (target) {
      var el = document.querySelector(target);
      if (el) el.addEventListener('click', openModal);
    }
    return;
  }

  // ——— BUTTON MODE (floating FAB) ———————————————————
  var btn = document.createElement('button');
  btn.id = 'bpv-button';
  btn.innerHTML = text;
  btn.onclick = openModal;

  var posCSS = position === 'bottom-left'
    ? 'left:20px;right:auto;'
    : 'right:20px;left:auto;';

  btn.style.cssText = [
    'position:fixed', 'bottom:20px', posCSS,
    'z-index:999997',
    'background:' + color, 'color:#fff',
    'border:none', 'border-radius:50px',
    'padding:14px 24px',
    'font-size:15px', 'font-weight:700', 'font-family:system-ui,-apple-system,sans-serif',
    'cursor:pointer',
    'box-shadow:0 4px 20px rgba(0,0,0,0.2)',
    'transition:transform 0.15s ease, box-shadow 0.15s ease',
  ].join(';');

  btn.onmouseenter = function() { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 6px 30px rgba(0,0,0,0.25)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; };

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(btn); });
  } else {
    document.body.appendChild(btn);
  }
})();
