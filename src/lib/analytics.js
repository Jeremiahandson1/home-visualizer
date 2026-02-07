// ═══════════════════════════════════════════════════════
// ANALYTICS TRACKER — Fire-and-forget client-side events
// ═══════════════════════════════════════════════════════

export function trackEvent(eventType, tenantId = null, metadata = {}) {
  // Fire-and-forget — never block UI
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: tenantId,
      event_type: eventType,
      metadata,
    }),
  }).catch(() => {}); // Silently ignore errors
}
