import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/embed/snippet?slug=xxx&mode=inline|popup|button
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const mode = searchParams.get('mode') || 'inline';

  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, company_name, colors, plan')
    .eq('slug', slug).eq('active', true).single();

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://homevisualizer.ai';
  const embedUrl = baseUrl + '/embed?tenant=' + slug;
  const primary = (tenant.colors && tenant.colors.primary) || '#B8860B';

  let snippet = '';
  let instructions = '';

  if (mode === 'inline') {
    snippet = buildInlineSnippet(tenant.company_name, embedUrl);
    instructions = 'Paste this where you want the visualizer to appear on your page.';
  } else if (mode === 'popup') {
    snippet = buildPopupSnippet(tenant.company_name, embedUrl, primary);
    instructions = 'Paste before </body>. Adds a floating button that opens the visualizer. Goes full-screen on mobile.';
  } else if (mode === 'button') {
    snippet = buildButtonSnippet(tenant.company_name, embedUrl, primary);
    instructions = 'Paste where you want the button. Opens the visualizer in a new tab.';
  }

  return NextResponse.json({ snippet, instructions, mode, embedUrl });
}

function buildInlineSnippet(name, url) {
  return [
    '<!-- HomeVisualizer \u2014 ' + name + ' -->',
    '<div id="hv-visualizer" style="width:100%;max-width:900px;margin:0 auto;">',
    '  <iframe',
    '    id="hv-frame"',
    '    style="width:100%;height:700px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);"',
    '    allow="camera"',
    '    loading="lazy"',
    '    title="Home Visualizer"',
    '  ></iframe>',
    '</div>',
    '<script>',
    '(function(){',
    '  // Forward UTM params from parent page to visualizer',
    '  var base="' + url + '";',
    '  var params=new URLSearchParams(window.location.search);',
    '  var utm=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];',
    '  var extra=[];',
    '  utm.forEach(function(k){var v=params.get(k);if(v)extra.push(k+"="+encodeURIComponent(v));});',
    '  var sep=base.indexOf("?")>-1?"&":"?";',
    '  document.getElementById("hv-frame").src=base+(extra.length?sep+extra.join("&"):"");',
    '  // Auto-resize',
    '  window.addEventListener("message",function(e){',
    '    if(e.data&&e.data.type==="hv-resize"){',
    '      var f=document.getElementById("hv-frame");',
    '      if(f&&e.data.height)f.style.height=e.data.height+"px";',
    '    }',
    '  });',
    '})();',
    '</script>',
  ].join('\n');
}

function buildPopupSnippet(name, url, primary) {
  // Mobile-friendly: goes full-screen on viewports < 640px
  return [
    '<!-- HomeVisualizer Popup \u2014 ' + name + ' -->',
    '<style>',
    '#hv-fab{position:fixed;bottom:24px;right:24px;z-index:9999;cursor:pointer;',
    '  background:' + primary + ';color:#fff;padding:14px 24px;border-radius:50px;',
    '  font-family:system-ui,-apple-system,sans-serif;font-weight:700;font-size:15px;',
    '  box-shadow:0 4px 20px ' + primary + '40;display:flex;align-items:center;gap:8px;',
    '  border:none;transition:transform 0.2s;-webkit-tap-highlight-color:transparent}',
    '#hv-fab:hover{transform:scale(1.05)}',
    '#hv-overlay{display:none;position:fixed;inset:0;z-index:10000;',
    '  background:rgba(0,0,0,0.6);align-items:center;justify-content:center;padding:16px}',
    '#hv-frame-wrap{position:relative;width:100%;max-width:480px;height:90vh;max-height:800px;',
    '  background:#fff;border-radius:20px;overflow:hidden;',
    '  box-shadow:0 20px 60px rgba(0,0,0,0.3)}',
    '#hv-close{position:absolute;top:12px;right:12px;z-index:10;',
    '  background:rgba(0,0,0,0.12);border:none;border-radius:50%;',
    '  width:36px;height:36px;font-size:20px;cursor:pointer;color:#333;',
    '  display:flex;align-items:center;justify-content:center}',
    '/* Mobile: full screen */',
    '@media(max-width:639px){',
    '  #hv-overlay{padding:0}',
    '  #hv-frame-wrap{max-width:100%;height:100dvh;max-height:100dvh;border-radius:0}',
    '  #hv-close{top:8px;right:8px;background:rgba(0,0,0,0.25);color:#fff}',
    '}',
    '</style>',
    '<script>',
    '(function(){',
    '  function open(){document.getElementById("hv-overlay").style.display="flex";}',
    '  function close(){document.getElementById("hv-overlay").style.display="none";}',
    '  var h=\'<button id="hv-fab" aria-label="Visualize Your Home">\\u2728 Visualize Your Home</button>\';',
    '  h+=\'<div id="hv-overlay">\';',
    '  h+=\'<div id="hv-frame-wrap">\';',
    '  h+=\'<button id="hv-close" aria-label="Close">\\u2715</button>\';',
    '  // Build URL with UTM passthrough',
    '  var base="' + url + '";',
    '  var p=new URLSearchParams(window.location.search);',
    '  var u=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];',
    '  var x=[];u.forEach(function(k){var v=p.get(k);if(v)x.push(k+"="+encodeURIComponent(v));});',
    '  var src=base+(x.length?(base.indexOf("?")>-1?"&":"?")+x.join("&"):"");',
    '  h+=\'<iframe src="\'+src+\'" style="width:100%;height:100%;border:none" allow="camera" title="Home Visualizer"></iframe>\';',
    '  h+=\'</div></div>\';',
    '  document.body.insertAdjacentHTML("beforeend",h);',
    '  document.getElementById("hv-fab").onclick=open;',
    '  document.getElementById("hv-close").onclick=close;',
    '  document.getElementById("hv-overlay").onclick=function(e){if(e.target===this)close();};',
    '})();',
    '</script>',
  ].join('\n');
}

function buildButtonSnippet(name, url, primary) {
  return [
    '<!-- HomeVisualizer Button \u2014 ' + name + ' -->',
    '<a',
    '  href="' + url + '"',
    '  target="_blank"',
    '  rel="noopener"',
    '  style="display:inline-flex;align-items:center;gap:8px;',
    '    background:' + primary + ';color:#fff;padding:14px 28px;',
    '    border-radius:12px;font-family:system-ui,-apple-system,sans-serif;',
    '    font-weight:700;font-size:16px;text-decoration:none;',
    '    box-shadow:0 4px 12px ' + primary + '30;"',
    '>',
    '  \u2728 Visualize Your Home',
    '</a>',
  ].join('\n');
}
