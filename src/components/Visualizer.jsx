'use client';

import { useState, useRef, useEffect } from 'react';
import { PROJECTS, MATERIALS, COLOR_FAMILIES, TOTAL_PRODUCTS, POPULAR_PRODUCTS, SUBCATEGORIES, getSubcategories, getMaterialsBySubcategory } from '@/lib/materials';
import { STYLE_PRESETS, getStylesByCategory } from '@/lib/styles';
import { trackEvent } from '@/lib/analytics';
import { getVariant, getAllAssignments } from '@/lib/ab-test';
import { EXAMPLE_TRANSFORMATIONS, TESTIMONIALS, getPopularityBadge } from '@/lib/social-proof';
import CompareSlider from './CompareSlider';
import ShowerBuilder from './ShowerBuilder';
import DesignMode from './DesignMode';
// MagicWand removed — DesignMode is the only mode for exterior

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const RESIZE_MAX_PX = 1024; // Resize to 1024px max before sending

// ═══════════════════════════════════════════════════════════
// HOMEOWNER-FACING VISUALIZER — v3
// 2 taps to wow. Mobile-first. Contractor website embed.
// Fixes: client resize, palette→colors, progress stages,
//        better style cards, address field, funnel tracking
// ═══════════════════════════════════════════════════════════

// ─── Client-side image resize ───────────────────────
function resizeImage(dataUrl, maxPx) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w <= maxPx && h <= maxPx) {
        resolve(dataUrl); return;
      }
      const scale = Math.min(maxPx / w, maxPx / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Progress stages for loading screen ─────────────
const PROGRESS_STAGES = [
  { pct: 10, label: 'Uploading your photo...', delay: 0 },
  { pct: 20, label: 'Analyzing the space...', delay: 2000 },
  { pct: 30, label: 'Detecting surfaces & features...', delay: 5000 },
  { pct: 40, label: 'Mapping material zones...', delay: 9000 },
  { pct: 50, label: 'Applying new design...', delay: 14000 },
  { pct: 60, label: 'Rendering new materials...', delay: 20000 },
  { pct: 70, label: 'Adding realistic shadows & depth...', delay: 28000 },
  { pct: 80, label: 'Matching lighting conditions...', delay: 36000 },
  { pct: 88, label: 'Refining details & edges...', delay: 45000 },
  { pct: 94, label: 'Almost there — finalizing image...', delay: 55000 },
  { pct: 97, label: 'Just a few more seconds...', delay: 65000 },
];

const LOADING_TIPS = [
  'AI analyzes every surface in your photo individually',
  'Each visualization is unique to your exact space',
  'Results typically look best with a straight-on photo',
  'Pro tip: try multiple styles to find your favorite',
  'The AI preserves elements you didn\'t change',
  'Higher quality = a little more wait time',
];

// ─── Remodel types — feature-flagged, combineable ─────
// Each type is toggled via config.features (e.g. remodel_exterior: true)
// If only one is enabled, the selection step is skipped entirely
const REMODEL_TYPES = [
  { id: 'exterior',  featureKey: 'remodel_exterior',  label: 'Exterior Remodel', icon: '🏠', desc: 'Siding, roofing, paint, windows, doors & more', default: true },
  { id: 'kitchen',   featureKey: 'remodel_kitchen',   label: 'Kitchen Remodel',  icon: '🍳', desc: 'Cabinets, countertops, backsplash & hardware', default: false },
  { id: 'bathroom',  featureKey: 'remodel_bathroom',  label: 'Bathroom Remodel', icon: '🛁', desc: 'Tile, vanity, fixtures, shower & flooring', default: false },
];

const REMODEL_PROJECTS = {
  exterior: ['siding', 'roofing', 'paint', 'windows', 'deck', 'garage', 'gutters', 'exterior'],
  kitchen: ['kitchen'],
  bathroom: ['bathroom'],
};

export default function Visualizer({ config }) {
  const c = config.colors || {};
  const primary = c.primary || '#B8860B';
  const bg = c.bg || '#FDFBF7';
  const text = c.text || '#1C1917';
  const muted = c.muted || '#78716C';
  const surface = c.surface || '#FFFFFF';
  const border = c.border || '#E7E5E4';

  // ─── State ───────────────────────────────────────────
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [imageRaw, setImageRaw] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const [mode, setMode] = useState('products');
  const [remodel, setRemodel] = useState(null); // 'exterior' | 'kitchen' | 'bathroom'
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [project, setProject] = useState(null);
  const [material, setMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selections, setSelections] = useState({}); // { categoryId: material }
  const [activeSubcat, setActiveSubcat] = useState(null); // for kitchen/bathroom subcategory tabs
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedBase64, setGeneratedBase64] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [iterationBase, setIterationBase] = useState(null); // base64 for iterative stacking — null = use original
  const [iterationCount, setIterationCount] = useState(0); // how many renders stacked
  const MAX_SELECTIONS = 3; // max products per render
  const [genError, setGenError] = useState(null);
  const [genTime, setGenTime] = useState(null);
  const [resultRevealed, setResultRevealed] = useState(false);

  // Progress
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const [refineText, setRefineText] = useState('');
  const [refining, setRefining] = useState(false);

  const [lead, setLead] = useState({ name: '', email: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Read UTM params from URL (passed through by embed)
  const [utm, setUtm] = useState({});
  const [referrer, setReferrer] = useState('');

  // A/B test assignments — stable per session
  const [abVariants, setAbVariants] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utmData = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
        const val = params.get(key);
        if (val) utmData[key.replace('utm_', '')] = val;
      });
      if (Object.keys(utmData).length) setUtm(utmData);
      try {
        setReferrer(document.referrer || '');
      } catch (e) {}

      // Assign A/B variants
      const assignments = getAllAssignments();
      setAbVariants(assignments);
      trackEvent('ab_assignment', config.tenantId, assignments);
    }
  }, []);

  const allEnabledProjects = PROJECTS.filter(p => config.features?.[p.id] !== false);
  const enabledProjects = remodel
    ? allEnabledProjects.filter(p => REMODEL_PROJECTS[remodel]?.includes(p.id))
    : allEnabledProjects;

  // ─── Enabled remodel types from config ──────────────
  // ─── Brand filtering per tenant ──────────────────────
  // config.features.allowed_brands = ['GAF', 'James Hardie', ...] — whitelist
  // If not set or empty, all brands shown
  const allowedBrands = config.features?.allowed_brands;
  const brandFilter = (m) => !allowedBrands?.length || allowedBrands.includes(m.brand);

  const enabledRemodels = REMODEL_TYPES.filter(rt => {
    const val = config.features?.[rt.featureKey];
    return val === true || (val === undefined && rt.default);
  });

  // Live social stats for social proof counter
  const [socialStats, setSocialStats] = useState({ totalDesigns: 0, thisWeek: 0 });

  useEffect(() => {
    trackEvent('page_view', config.tenantId, { slug: config.slug });
    // Fetch social proof stats
    fetch('/api/analytics/stats' + (config.tenantId ? '?tenant_id=' + config.tenantId : ''))
      .then(r => r.json())
      .then(setSocialStats)
      .catch(() => {});
  }, []);

  // Lead form behavior controlled by A/B test
  const leadFormVariant = getVariant('lead_form_timing');
  const leadFormDelay = leadFormVariant?.config?.delayMs ?? 3000;
  const leadFormMode = leadFormVariant?.config?.mode ?? 'slide';

  useEffect(() => {
    if (step === 'result' && !leadSubmitted) {
      if (leadFormDelay === 0) {
        setShowLeadForm(true);
      } else {
        const t = setTimeout(() => setShowLeadForm(true), leadFormDelay);
        return () => clearTimeout(t);
      }
    }
  }, [step, leadSubmitted, leadFormDelay]);

  // Result reveal
  useEffect(() => {
    if (step === 'result') {
      const t = setTimeout(() => setResultRevealed(true), 80);
      return () => clearTimeout(t);
    }
    setResultRevealed(false);
  }, [step]);

  // Progress animation during generating
  useEffect(() => {
    if (step !== 'generating') { setProgressPct(0); setProgressLabel(''); setElapsedSec(0); setCurrentTip(0); return; }
    const timers = PROGRESS_STAGES.map(({ pct, label, delay }) =>
      setTimeout(() => { setProgressPct(pct); setProgressLabel(label); }, delay)
    );
    // Elapsed seconds counter
    const ticker = setInterval(() => setElapsedSec(s => s + 1), 1000);
    // Rotate tips every 8 seconds
    const tipRotator = setInterval(() => setCurrentTip(t => (t + 1) % LOADING_TIPS.length), 8000);
    return () => { timers.forEach(clearTimeout); clearInterval(ticker); clearInterval(tipRotator); };
  }, [step]);

  // Fetch materials
  useEffect(() => {
    if (!project) { setMaterials([]); return; }
    let cancelled = false;
    setLoadingMaterials(true);
    setFilterBrand(''); setFilterColor(''); setSearchTerm('');
    const params = new URLSearchParams({ category: project.id });
    if (config.tenantId) params.set('tenant_id', config.tenantId);
    fetch(`/api/materials?${params}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setMaterials((Array.isArray(data) ? data : []).filter(brandFilter)); setLoadingMaterials(false); } })
      .catch(() => { if (!cancelled) { setMaterials((MATERIALS[project.id] || []).filter(brandFilter)); setLoadingMaterials(false); } });
    return () => { cancelled = true; };
  }, [project, config.tenantId]);

  const subcats = project ? getSubcategories(project.id) : null;
  const filteredMaterials = materials.filter(m => {
    if (activeSubcat && m.subcategory && m.subcategory !== activeSubcat) return false;
    if (filterBrand && m.brand !== filterBrand) return false;
    if (filterColor && m.colorFamily !== filterColor) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!m.name.toLowerCase().includes(s) && !m.brand.toLowerCase().includes(s)) return false;
    }
    return true;
  });
  const brands = [...new Set(materials.filter(m => !activeSubcat || !m.subcategory || m.subcategory === activeSubcat).map(m => m.brand))];

  // ─── File handling with client-side resize ─────────
  const handleFile = async (file) => {
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please upload a photo (JPG, PNG, or WebP).'); return; }
    if (file.size > MAX_FILE_SIZE) { setUploadError('Photo too large. Max 10MB.'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target.result;
      // Validate dimensions
      const img = new window.Image();
      img.onload = async () => {
        if (img.width < 200 || img.height < 200) {
          setUploadError('Photo too small. Try a higher resolution.'); return;
        }
        // Resize on client — crucial for mobile (12MP phone photos → 1024px)
        const resized = await resizeImage(rawDataUrl, RESIZE_MAX_PX);
        setImage(resized);
        setImageRaw(resized.split(',')[1]);
        trackEvent('upload', config.tenantId, {
          original_kb: Math.round(file.size / 1024),
          resized_kb: Math.round((resized.length * 3 / 4) / 1024),
        });
        // If only one remodel type enabled, skip type selection
        const enabled = REMODEL_TYPES.filter(rt => {
          const val = config.features?.[rt.featureKey];
          return val === true || (val === undefined && rt.default);
        });
        if (enabled.length === 1) {
          // Auto-select and go straight to design
          handleRemodelType(enabled[0].id);
        } else {
          setStep('remodel-type');
        }
      };
      img.onerror = () => setUploadError('Could not read this image.');
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ─── Generation ────────────────────────────────────
  // ─── Generation with auto-retry ─────────────────
  const MAX_RETRIES = 2;

  const generate = async (styleOverride, materialOverride) => {
    const style = styleOverride || selectedStyle;
    const mat = materialOverride || material;
    setStep('generating');
    setGenError(null); setShowLeadForm(false);
    trackEvent('generate', config.tenantId, {
      mode: style ? 'style' : 'material',
      selection: style?.id || mat?.id,
    });

    let lastError = 'Generation failed';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setProgressLabel(`Retrying... (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, 1500 * attempt)); // 1.5s, 3s backoff
        }

        let response;
        if (style) {
          response = await fetch('/api/visualize/style', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: iterationBase || imageRaw, styleId: style.id, tenantSlug: config.slug }),
          });
        } else {
          response = await fetch('/api/visualize', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: iterationBase || imageRaw, project: project.id, materialId: mat.id, tenantSlug: config.slug }),
          });
        }

        const data = await response.json();

        // Non-retryable errors (image gate, bad request) — fail immediately
        if (response.status === 422 || response.status === 400) {
          throw { message: data.error || 'Invalid request', noRetry: true };
        }
        if (!response.ok) {
          throw { message: data.error || 'Generation failed', noRetry: false };
        }

        setGeneratedImage(`data:image/jpeg;base64,${data.generatedBase64}`);
        setGeneratedBase64(data.generatedBase64);
        setOriginalUrl(data.originalUrl);
        setGeneratedUrl(data.generatedUrl);
        setGenTime(data.generationTimeMs);
        setIterationCount(c => c + 1);
        trackEvent('generate_complete', config.tenantId, {
          time_ms: data.generationTimeMs, provider: data.provider, isDemo: data.isDemo,
          attempts: attempt + 1, iteration: iterationCount + 1,
        });
        setStep('result');
        return; // Success — exit retry loop
      } catch (err) {
        lastError = err.message || String(err);
        if (err.noRetry) break; // Don't retry validation errors
        if (attempt === MAX_RETRIES) break; // Last attempt
        // Otherwise loop continues to retry
      }
    }

    // All retries exhausted
    setGenError(lastError);
    trackEvent('generate_error', config.tenantId, { error: lastError, attempts: MAX_RETRIES + 1 });
    setStep('design');
  };

  const handleStyleTap = (style) => { setSelectedStyle(style); setMaterial(null); setProject(null); setSelections({}); generate(style); };
  const handleRemodelType = (type) => {
    setRemodel(type);
    trackEvent('remodel_type', config.tenantId, { type });
    // For kitchen/bathroom, auto-set the project since there's only one
    if (type === 'kitchen' || type === 'bathroom') {
      const proj = PROJECTS.find(p => p.id === type);
      if (proj) {
        setProject(proj);
        const sc = getSubcategories(proj.id);
        setActiveSubcat(sc ? sc[0].id : null);
      }
    }
    // Exterior goes straight to products (styles removed for exterior)
    if (type === 'exterior') setMode('products');
    setStep('design');
  };
  const handleMaterialTap = (mat, categoryOverride) => {
    const cat = categoryOverride || project?.id;
    if (!cat) return;
    // For subcategorized projects (kitchen/bathroom), use subcategory as selection key
    const subcatKey = mat.subcategory ? `${cat}_${mat.subcategory}` : cat;
    // Enforce max selections — allow replacing existing key, block new keys past limit
    const isReplacing = selections[subcatKey] !== undefined;
    if (!isReplacing && Object.keys(selections).length >= MAX_SELECTIONS) return;
    setSelections(prev => ({ ...prev, [subcatKey]: mat }));
    setMaterial(mat);
    // Auto-advance to next subcategory if available
    if (subcats && mat.subcategory) {
      const currentIdx = subcats.findIndex(sc => sc.id === mat.subcategory);
      if (currentIdx < subcats.length - 1) {
        setTimeout(() => {
          setActiveSubcat(subcats[currentIdx + 1].id);
          setSearchTerm(''); setFilterBrand(''); setFilterColor('');
        }, 300);
      }
    }
  };
  const removeSelection = (key) => {
    setSelections(prev => { const next = { ...prev }; delete next[key]; return next; });
  };
  // Get display label for a selection key like 'kitchen_cabinets' or 'siding'
  const getSelectionLabel = (key) => {
    const parts = key.split('_');
    const proj = enabledProjects.find(p => p.id === parts[0]);
    if (parts.length > 1 && SUBCATEGORIES[parts[0]]) {
      const sc = SUBCATEGORIES[parts[0]].find(s => s.id === parts.slice(1).join('_'));
      return `${proj?.icon || ''} ${sc?.label || parts.slice(1).join(' ')}`;
    }
    return `${proj?.icon || ''} ${proj?.label || key}`;
  };
  const generateFromSelections = () => {
    const sels = Object.entries(selections).map(([key, mat]) => {
      // Keys like 'kitchen_cabinets' or 'siding'
      const parts = key.split('_');
      const category = parts[0]; // 'kitchen', 'bathroom', 'siding', etc.
      return { category, materialId: mat.id };
    });
    if (sels.length === 0) return;
    setSelectedStyle(null);
    setStep('generating');
    setGenError(null); setShowLeadForm(false);
    trackEvent('generate', config.tenantId, {
      mode: 'multi', count: sels.length,
      categories: sels.map(s => s.category).join('+'),
    });
    generateMultiApi(sels);
  };
  const generateMultiApi = async (sels) => {
    let lastError = 'Generation failed';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setProgressLabel(`Retrying... (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
        }
        const response = await fetch('/api/visualize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: iterationBase || imageRaw, selections: sels, tenantSlug: config.slug }),
        });
        const data = await response.json();
        if (response.status === 422 || response.status === 400) {
          throw { message: data.error || 'Invalid request', noRetry: true };
        }
        if (!response.ok) throw { message: data.error || 'Generation failed', noRetry: false };

        setGeneratedImage(`data:image/jpeg;base64,${data.generatedBase64}`);
        setGeneratedBase64(data.generatedBase64);
        setOriginalUrl(data.originalUrl);
        setGeneratedUrl(data.generatedUrl);
        setGenTime(data.generationTimeMs);
        setIterationCount(c => c + 1);
        trackEvent('generate_complete', config.tenantId, { time_ms: data.generationTimeMs, mode: 'multi', attempts: attempt + 1, iteration: iterationCount + 1 });
        setStep('result');
        setResultRevealed(false);
        setTimeout(() => setResultRevealed(true), 100);
        return;
      } catch (err) {
        lastError = err.message || 'Generation failed';
        if (err.noRetry) break;
      }
    }
    setGenError(lastError);
    setStep('design');
  };

  // ─── Refinement ────────────────────────────────────
  const refine = async () => {
    if (!refineText.trim()) return;
    setRefining(true); setGenError(null);
    trackEvent('refine', config.tenantId, { instruction: refineText });
    try {
      const response = await fetch('/api/visualize/refine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedBase64, instruction: refineText, originalBase64: imageRaw, tenantSlug: config.slug,
          context: { project: project?.id || 'exterior', materialName: material?.name || selectedStyle?.name || '', materialBrand: material?.brand || '' },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Refinement failed');
      setGeneratedImage(`data:image/jpeg;base64,${data.generatedBase64}`);
      setGeneratedBase64(data.generatedBase64);
      setGeneratedUrl(data.generatedUrl);
      setRefineText('');
    } catch (err) { setGenError(err.message); }
    finally { setRefining(false); }
  };

  // ─── Share ─────────────────────────────────────────
  const share = async () => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: config.tenantId, original_photo_url: originalUrl, generated_photo_url: generatedUrl,
          project_type: project?.id || 'exterior', material_brand: material?.brand || '', material_name: material?.name || '', style_name: selectedStyle?.name || '',
        }),
      });
      const data = await res.json();
      trackEvent('share', config.tenantId, {});
      if (navigator.share) {
        navigator.share({ title: `${config.companyName} Design`, url: data.shareUrl }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(data.shareUrl);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) { console.error('Share:', err); }
  };

  // ─── Lead submission ───────────────────────────────
  const submitLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    trackEvent('lead_submit', config.tenantId, {});
    try {
      await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead, tenantSlug: config.slug, projectType: project?.id || 'exterior',
          materialId: material?.id || selectedStyle?.id || '', materialBrand: material?.brand || '',
          materialName: material?.name || selectedStyle?.name || '', originalPhotoUrl: originalUrl, generatedPhotoUrl: generatedUrl,
          utm, referrer,
          abVariants,
        }),
      });
      setLeadSubmitted(true); setStep('submitted');
    } catch (err) { setGenError('Could not submit. Please try again.'); }
    setSubmitting(false);
  };

  const saveFavorite = () => {
    if (favorites.find(f => f.image === generatedImage)) return;
    setFavorites(prev => [...prev, { id: Date.now(), image: generatedImage, label: material?.name || selectedStyle?.name || 'Design' }]);
    trackEvent('favorite', config.tenantId, {});
  };

  const tryAnother = () => {
    // Keep stacking — use last generated as new base for next render
    if (generatedBase64) setIterationBase(generatedBase64);
    setGeneratedImage(null); setGeneratedBase64(null); setGenError(null);
    setRefineText(''); setSelectedStyle(null); setMaterial(null); setShowLeadForm(false);
    setSelections({});
    setStep('design');
  };

  const startFresh = () => {
    // Reset to original photo — start over without re-uploading
    setIterationBase(null); setIterationCount(0);
    setGeneratedImage(null); setGeneratedBase64(null); setGenError(null);
    setRefineText(''); setSelectedStyle(null); setMaterial(null); setShowLeadForm(false);
    setSelections({});
    setStep('design');
  };

  const startOver = () => {
    startFresh(); setImage(null); setImageRaw(null); setProject(null);
    setMode('products'); setFavorites([]); setSelections({}); setRemodel(null);
    setIterationBase(null); setIterationCount(0);
    setLead({ name: '', email: '', phone: '', address: '' });
    setLeadSubmitted(false); setStep('upload');
  };

  const selectionLabel = selectedStyle?.name
    || (Object.keys(selections).length > 1
      ? Object.values(selections).map(m => m.name).join(' + ')
      : material ? `${material.brand} ${material.name}` : '');

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen font-sans" style={{ background: bg, color: text }}>

      {/* Header */}
      <header className="px-4 py-3 border-b" style={{ borderColor: border }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {config.logo ? (
            <img src={config.logo} alt={config.companyName} className="h-8 sm:h-10 object-contain" />
          ) : (
            <span className="text-lg font-bold" style={{ color: primary }}>{config.companyName}</span>
          )}
          <div className="flex items-center gap-3">
            {favorites.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: primary + '15', color: primary }}>
                ★ {favorites.length}
              </span>
            )}
            {config.phone && (
              <a href={`tel:${config.phone}`} className="text-xs font-medium hidden sm:block" style={{ color: muted }}>{config.phone}</a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 sm:py-8">

        {/* ═══════════ UPLOAD ═══════════════════════════ */}
        {step === 'upload' && (
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
              {enabledRemodels.length === 1 && enabledRemodels[0].id === 'exterior'
                ? 'See Your Home Transformed' : 'See Your Space Transformed'}
            </h2>
            <p className="text-sm mb-6" style={{ color: muted }}>
              {enabledRemodels.length === 1 && enabledRemodels[0].id === 'exterior'
                ? 'Upload a photo and pick a style — see it in seconds'
                : 'Upload a photo of your home, kitchen, or bathroom'}
            </p>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 cursor-pointer transition-all ${dragOver ? 'scale-[1.01]' : ''}`}
              style={{ borderColor: dragOver ? primary : border, background: dragOver ? primary + '08' : surface }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="font-semibold text-lg mb-1">Take or upload a photo</p>
              <p className="text-sm mb-4" style={{ color: muted }}>
                {enabledRemodels.length === 1 && enabledRemodels[0].id === 'exterior'
                  ? 'of your home' : 'of your space'}
              </p>
              <button
                className="px-8 py-3 rounded-xl text-white font-bold shadow-lg active:scale-[0.98] transition"
                style={{ background: primary }}
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              >Choose Photo</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
            {uploadError && <p className="mt-3 text-sm text-red-600 font-medium">{uploadError}</p>}
            <p className="text-xs mt-4" style={{ color: muted + '80' }}>
              {enabledRemodels.length === 1 && enabledRemodels[0].id === 'exterior'
                ? 'JPG, PNG · Max 10MB · Exterior photos work best'
                : 'JPG, PNG · Max 10MB · Straight-on photos work best'}
            </p>

            {/* Live counter */}
            {socialStats.totalDesigns > 5 && (
              <p className="mt-3 text-xs font-medium" style={{ color: primary }}>
                ✨ {socialStats.totalDesigns.toLocaleString()} homes visualized
                {socialStats.thisWeek > 0 ? ` · ${socialStats.thisWeek} this week` : ''}
              </p>
            )}

            {/* ── Example transformations ──────────────── */}
            <div className="mt-8">
              <p className="text-xs font-semibold mb-3" style={{ color: muted }}>What you can expect</p>
              <div className="flex gap-2 justify-center">
                {EXAMPLE_TRANSFORMATIONS.map(ex => (
                  <div key={ex.id} className="rounded-xl border p-2.5 text-center flex-1 max-w-[120px]"
                    style={{ borderColor: border, background: surface }}>
                    {/* Before → After swatch */}
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <div className="w-6 h-6 rounded" style={{ background: ex.beforeColor }} />
                      <span className="text-xs" style={{ color: muted }}>→</span>
                      <div className="w-6 h-6 rounded" style={{ background: ex.afterColor }} />
                    </div>
                    <p className="text-xs font-semibold leading-tight">{ex.label}</p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: muted }}>{ex.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Testimonial ─────────────────────────── */}
            <TestimonialCarousel testimonials={TESTIMONIALS} muted={muted} border={border} surface={surface} />
          </div>
        )}

        {/* ═══════════ REMODEL TYPE ═══════════════════════ */}
        {step === 'remodel-type' && (
          <div className="max-w-md mx-auto text-center">
            <div className="flex items-center gap-3 mb-5">
              <img src={image} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-lg sm:text-xl font-bold leading-tight">What are you remodeling?</h2>
                <button onClick={startOver} className="text-xs underline" style={{ color: muted }}>Change photo</button>
              </div>
            </div>

            <div className="grid gap-3">
              {enabledRemodels.map(rt => (
                  <button key={rt.id} onClick={() => handleRemodelType(rt.id)}
                    className="rounded-2xl border-2 p-5 text-left transition-all hover:shadow-lg active:scale-[0.98] group"
                    style={{ borderColor: border, background: surface }}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl flex-shrink-0">{rt.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg leading-tight mb-0.5">{rt.label}</p>
                        <p className="text-sm" style={{ color: muted }}>{rt.desc}</p>
                      </div>
                      <div className="text-lg" style={{ color: muted }}>→</div>
                    </div>
                  </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ DESIGN ══════════════════════════ */}
        {step === 'design' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={iterationBase ? `data:image/jpeg;base64,${iterationBase}` : image} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold leading-tight">
                  {mode === 'styles'
                    ? `${remodel === 'kitchen' ? '🍳' : remodel === 'bathroom' ? '🛁' : '🏠'} Pick a style`
                    : project ? `${project.icon} ${project.label}` : 'Build your design'}
                </h2>
                {iterationCount > 0 && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>
                    🔄 Round {iterationCount + 1} — changes stack on your last render
                  </p>
                )}
                <div className="flex gap-2">
                  {enabledRemodels.length > 1 && (
                    <button onClick={() => { setStep('remodel-type'); setProject(null); setMaterial(null); setSelections({}); setMode('products'); }}
                      className="text-xs underline" style={{ color: muted }}>← Change type</button>
                  )}
                  {iterationCount > 0 && (
                    <button onClick={startFresh} className="text-xs underline" style={{ color: muted }}>Reset to original</button>
                  )}
                  <button onClick={startOver} className="text-xs underline" style={{ color: muted }}>Change photo</button>
                </div>
              </div>
            </div>

            {/* Mode tabs — only shown for kitchen/bathroom. Exterior uses DesignMode directly. */}
            {(remodel === 'kitchen' || remodel === 'bathroom') && (
            <div className="flex gap-2 mb-4">
              {(remodel === 'kitchen' || remodel === 'bathroom') && (
                <button onClick={() => { setMode('styles'); setProject(null); setMaterial(null); }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                  style={{ background: mode === 'styles' ? primary : text + '06', color: mode === 'styles' ? '#fff' : muted }}>
                  ✨ Style Makeover
                </button>
              )}
              <button onClick={() => {
                setMode('products'); setSelectedStyle(null);
                if (remodel === 'kitchen' || remodel === 'bathroom') {
                  const proj = PROJECTS.find(p => p.id === remodel);
                  if (proj) {
                    setProject(proj);
                    const sc = getSubcategories(proj.id);
                    setActiveSubcat(sc ? sc[0].id : null);
                  }
                }
              }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                style={{ background: mode === 'products' ? primary : text + '06', color: mode === 'products' ? '#fff' : muted }}>
                🎨 By Product
              </button>
              {remodel === 'bathroom' && (
                <button onClick={() => { setMode('builder'); setSelectedStyle(null); setProject(null); }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                  style={{ background: mode === 'builder' ? primary : text + '06', color: mode === 'builder' ? '#fff' : muted }}>
                  🚿 Shower Builder
                </button>
              )}
            </div>
            )}

            {genError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 flex items-start gap-2">
                <span className="flex-1">{genError}</span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => {
                    setGenError(null);
                    if (selectedStyle) generate(selectedStyle);
                    else if (Object.keys(selections).length > 0) generateFromSelections();
                    else if (material) generate(null, material);
                  }} className="underline font-semibold whitespace-nowrap">Retry</button>
                  <button onClick={() => setGenError(null)} className="underline whitespace-nowrap">Dismiss</button>
                </div>
              </div>
            )}

            {/* ── EXTERIOR — DesignMode is the only mode ──── */}
            {remodel === 'exterior' && (
              <DesignMode
                imageSrc={iterationBase ? `data:image/jpeg;base64,${iterationBase}` : image}
                imageBase64={iterationBase || imageRaw}
                tenantSlug={config.slug}
                config={config}
                onRenderStart={() => {
                  trackEvent('generate', config.tenantId, { mode: 'design' });
                }}
                onRenderComplete={(newBase64) => {
                  setIterationBase(newBase64);
                  setIterationCount(c => c + 1);
                  setGeneratedImage(`data:image/jpeg;base64,${newBase64}`);
                  setGeneratedBase64(newBase64);
                  setStep('design');
                  trackEvent('generate_complete', config.tenantId, { mode: 'design' });
                }}
              />
            )}

            {/* ── STYLES — full architectural transformations (kitchen/bathroom only) ──── */}
            {mode === 'styles' && (remodel === 'kitchen' || remodel === 'bathroom') && (
              <>
                <p className="text-xs mb-3 px-1" style={{ color: muted }}>
                  {remodel === 'kitchen' ? 'Complete kitchen style transformations — tap one to generate.'
                    : remodel === 'bathroom' ? 'Complete bathroom style transformations — tap one to generate.'
                    : 'Full style makeover — tap one to generate.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getStylesByCategory(remodel || 'exterior').map(style => {
                  const badge = getPopularityBadge(style.id);
                  return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleTap(style)}
                    className="rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-[0.97] group relative"
                    style={{ borderColor: border, background: surface }}
                  >
                    {/* Popularity badge */}
                    {badge && (
                      <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm z-10"
                        style={{ background: badge.color }}>{badge.label}</span>
                    )}
                    {/* Color preview — siding + trim + accent simulation */}
                    <div className="rounded-lg overflow-hidden mb-2 border" style={{ borderColor: text + '10' }}>
                      {/* Mini house silhouette with style colors */}
                      <div className="h-16 relative" style={{ background: style.colors.primary }}>
                        {/* Roof */}
                        <div className="absolute top-0 left-0 right-0 h-5" style={{ background: style.colors.secondary }} />
                        {/* Accent strip (door/trim) */}
                        <div className="absolute bottom-1 left-3 w-3 h-6 rounded-sm" style={{ background: style.colors.accent }} />
                        {/* Windows */}
                        <div className="absolute bottom-2 right-3 flex gap-1">
                          <div className="w-3 h-3 rounded-sm border" style={{ borderColor: style.colors.secondary, background: '#87CEEB40' }} />
                          <div className="w-3 h-3 rounded-sm border" style={{ borderColor: style.colors.secondary, background: '#87CEEB40' }} />
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-sm leading-tight mb-0.5">{style.name}</p>
                    <p className="text-xs leading-snug line-clamp-2" style={{ color: muted }}>{style.shortDesc}</p>
                  </button>
                  );
                })}
              </div>
              </>
            )}

            {/* ── PRODUCTS — popular first, then browse by category (kitchen/bathroom only) ── */}
            {mode === 'products' && remodel !== 'exterior' && (
              <>
                {/* Popular products — tap to add to your design */}
                {!project && (
                  <>
                    {/* Selections summary */}
                    {Object.keys(selections).length > 0 && (
                      <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: primary + '40', background: primary + '08' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: primary }}>
                          Your selections ({Object.keys(selections).length}/{MAX_SELECTIONS})
                          {Object.keys(selections).length >= MAX_SELECTIONS && (
                            <span className="ml-1 font-normal" style={{ color: muted }}> — max {MAX_SELECTIONS} per render for best results</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Object.entries(selections).map(([key, mat]) => (
                              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border"
                                style={{ borderColor: border, background: surface }}>
                                <div className="w-4 h-4 rounded" style={{ background: mat.color || mat.colorHex || '#888' }} />
                                <span className="font-medium">{getSelectionLabel(key)}: {mat.name}</span>
                                <button onClick={() => removeSelection(key)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                              </div>
                          ))}
                        </div>
                        <button onClick={generateFromSelections}
                          className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition hover:opacity-90"
                          style={{ background: primary }}>
                          Generate Visualization →
                        </button>
                      </div>
                    )}

                    <p className="text-xs font-semibold mb-2" style={{ color: muted }}>
                      {iterationCount > 0
                        ? `Round ${iterationCount + 1} — pick up to ${MAX_SELECTIONS} more changes to layer on`
                        : `Popular Products — pick up to ${MAX_SELECTIONS}, then add more in the next round`}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                      {POPULAR_PRODUCTS.filter(brandFilter).map(m => {
                        const isSelected = selections[m.category]?.id === m.id;
                        return (
                        <button key={m.id} onClick={() => {
                          const proj = enabledProjects.find(p => p.id === m.category);
                          if (proj) setProject(null); // stay on overview
                          handleMaterialTap(m, m.category);
                        }}
                          className="rounded-lg border p-2.5 text-left transition-all hover:shadow-md active:scale-[0.97] relative"
                          style={{ borderColor: isSelected ? primary : border, background: surface,
                            boxShadow: isSelected ? `0 0 0 2px ${primary}` : 'none' }}>
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                              style={{ background: primary }}>✓</span>
                          )}
                          <div className="w-full h-8 rounded mb-1.5 border"
                            style={{ background: m.color || m.colorHex || '#888', borderColor: text + '10' }} />
                          <p className="font-semibold text-xs leading-tight truncate">{m.name}</p>
                          <p className="text-xs truncate" style={{ color: muted }}>{m.brand}</p>
                        </button>
                        );
                      })}
                    </div>

                    {/* Browse all categories */}
                    <p className="text-xs font-semibold mb-2" style={{ color: muted }}>Or browse by category</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {enabledProjects.map(p => (
                        <button key={p.id} onClick={() => {
                          setProject(p);
                          const sc = getSubcategories(p.id);
                          setActiveSubcat(sc ? sc[0].id : null);
                        }}
                          className="rounded-xl border p-3 text-center transition-all hover:shadow-md active:scale-[0.97]"
                          style={{ borderColor: border, background: surface }}>
                          <div className="text-2xl mb-1">{p.icon}</div>
                          <p className="font-semibold text-xs">{p.label}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {project && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => {
                        if (remodel === 'kitchen' || remodel === 'bathroom') {
                          // For kitchen/bathroom, back goes to styles mode since there's no category grid
                          setMode('styles'); setProject(null); setMaterial(null); setMaterials([]); setActiveSubcat(null);
                        } else {
                          setProject(null); setMaterial(null); setMaterials([]); setActiveSubcat(null);
                        }
                      }}
                        className="text-xs font-semibold px-2 py-1 rounded" style={{ color: primary }}>← Back</button>
                      <span className="text-xs ml-auto" style={{ color: muted }}>
                        {filteredMaterials.length} product{filteredMaterials.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Subcategory tabs for kitchen/bathroom */}
                    {subcats && (
                      <>
                        <p className="text-xs mb-2" style={{ color: muted }}>
                          Pick one from each category, then generate them all at once.
                        </p>
                        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                          {subcats.map(sc => {
                            const selKey = `${project.id}_${sc.id}`;
                            const hasSel = !!selections[selKey];
                            return (
                              <button key={sc.id} onClick={() => { setActiveSubcat(sc.id); setSearchTerm(''); setFilterBrand(''); setFilterColor(''); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all relative flex-shrink-0"
                                style={{
                                  background: activeSubcat === sc.id ? primary : text + '06',
                                  color: activeSubcat === sc.id ? '#fff' : muted,
                                }}>
                                {sc.icon} {sc.label}
                                {hasSel && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[9px] flex items-center justify-center"
                                    style={{ background: '#22C55E' }}>✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <input type="text" placeholder="Search..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border text-sm flex-1 min-w-[100px] max-w-[180px]"
                        style={{ borderColor: border, background: surface }} />
                      {brands.length > 1 && (
                        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: border, background: surface }}>
                          <option value="">All brands</option>
                          {brands.map(b => <option key={b}>{b}</option>)}
                        </select>
                      )}
                      <div className="flex gap-1">
                        {COLOR_FAMILIES.slice(0, 7).map(cf => (
                          <button key={cf} onClick={() => setFilterColor(filterColor === cf ? '' : cf)}
                            className="w-6 h-6 rounded-full border-2 transition-all" title={cf}
                            style={{
                              background: cf === 'white' ? '#fff' : cf === 'beige' ? '#D4C5A9' : cf,
                              borderColor: filterColor === cf ? primary : text + '20',
                              transform: filterColor === cf ? 'scale(1.15)' : 'scale(1)',
                            }} />
                        ))}
                      </div>
                    </div>

                    {loadingMaterials ? (
                      <div className="text-center py-12" style={{ color: muted }}>Loading products...</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filteredMaterials.map(m => {
                          const selKey = m.subcategory ? `${project.id}_${m.subcategory}` : project.id;
                          const isSelected = selections[selKey]?.id === m.id;
                          return (
                          <button key={m.id} onClick={() => handleMaterialTap(m)}
                            className="rounded-lg border p-2.5 text-left transition-all hover:shadow-md active:scale-[0.97] relative"
                            style={{ borderColor: isSelected ? primary : border, background: surface,
                              boxShadow: isSelected ? `0 0 0 2px ${primary}` : 'none' }}>
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                                style={{ background: primary }}>✓</span>
                            )}
                            <div className="w-full h-8 rounded mb-1.5 border"
                              style={{ background: m.color || m.colorHex || '#888', borderColor: text + '10' }} />
                            <p className="font-semibold text-xs leading-tight truncate">{m.name}</p>
                            <p className="text-xs truncate" style={{ color: muted }}>{m.brand}</p>
                          </button>
                          );
                        })}
                        {filteredMaterials.length === 0 && (
                          <div className="col-span-full text-center py-8 text-sm" style={{ color: muted }}>No products match</div>
                        )}
                      </div>
                    )}

                    {/* Selections tray inside category */}
                    {Object.keys(selections).length > 0 && (
                      <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: primary + '40', background: primary + '08' }}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Object.entries(selections).map(([key, mat]) => (
                              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border"
                                style={{ borderColor: border, background: surface }}>
                                <div className="w-4 h-4 rounded" style={{ background: mat.color || mat.colorHex || '#888' }} />
                                <span className="font-medium">{getSelectionLabel(key)}: {mat.name}</span>
                                <button onClick={() => removeSelection(key)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                              </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            if (remodel === 'kitchen' || remodel === 'bathroom') {
                              // Stay in project, just reset subcategory to first one
                              const sc = getSubcategories(project?.id);
                              setActiveSubcat(sc ? sc[0].id : null);
                              setSearchTerm(''); setFilterBrand(''); setFilterColor('');
                            } else {
                              setProject(null); setMaterial(null); setMaterials([]); setActiveSubcat(null);
                            }
                          }}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold border transition"
                            style={{ borderColor: border, color: muted }}>
                            + Add more
                          </button>
                          <button onClick={generateFromSelections}
                            className="flex-1 py-2 rounded-lg font-bold text-sm text-white transition hover:opacity-90"
                            style={{ background: primary }}>
                            Generate →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── BUILDER — shower/tub configurator ────────── */}
            {mode === 'builder' && (
              <ShowerBuilder
                onGenerate={async ({ prompt, summary }) => {
                  // Use the style API path with a custom style object
                  setSelectedStyle({ id: 'custom-shower', name: summary, prompt, category: 'bathroom' });
                  setMaterial(null); setProject(null); setSelections({});
                  setStep('generating');
                  setGenError(null); setShowLeadForm(false);
                  trackEvent('generate', config.tenantId, { mode: 'shower-builder', summary });

                  let lastError = 'Generation failed';
                  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                    try {
                      if (attempt > 0) {
                        setProgressLabel(`Retrying... (attempt ${attempt + 1})`);
                        await new Promise(r => setTimeout(r, 1500 * attempt));
                      }
                      const response = await fetch('/api/visualize/style', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          imageBase64: imageRaw,
                          styleId: 'custom-shower',
                          customPrompt: prompt,
                          tenantSlug: config.slug,
                        }),
                      });
                      const data = await response.json();
                      if (response.status === 422 || response.status === 400) {
                        throw { message: data.error || 'Invalid request', noRetry: true };
                      }
                      if (!response.ok) throw { message: data.error || 'Generation failed', noRetry: false };

                      setGeneratedImage(`data:image/jpeg;base64,${data.generatedBase64}`);
                      setGeneratedBase64(data.generatedBase64);
                      setOriginalUrl(data.originalUrl);
                      setGeneratedUrl(data.generatedUrl);
                      setGenTime(data.generationTimeMs);
                      trackEvent('generate_complete', config.tenantId, { mode: 'shower-builder', time_ms: data.generationTimeMs, attempts: attempt + 1 });
                      setStep('result');
                      return;
                    } catch (err) {
                      lastError = err.message || 'Generation failed';
                      if (err.noRetry) break;
                    }
                  }
                  setGenError(lastError);
                  setStep('design');
                }}
                onBack={() => setMode('styles')}
                primary={primary} muted={muted} border={border} surface={surface} text={text}
              />
            )}

            {/* DesignMode for exterior is rendered above — no wand mode needed */}
          </div>
        )}

        {/* ═══════════ GENERATING — with progress ════ */}
        {step === 'generating' && (
          <div className="max-w-sm mx-auto text-center py-10 sm:py-16">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <img src={image} alt="" className="w-20 h-20 rounded-xl object-cover" />
              <div className="absolute inset-0 rounded-xl border-2 animate-pulse" style={{ borderColor: primary }} />
              {/* Spinning ring */}
              <div className="absolute -inset-2 rounded-2xl border-2 border-transparent animate-spin"
                style={{ borderTopColor: primary, animationDuration: '2s' }} />
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full mb-3 overflow-hidden" style={{ background: text + '10' }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%`, background: primary }} />
            </div>

            <h3 className="text-base font-bold mb-1">{progressLabel || 'Starting...'}</h3>
            <p className="text-sm" style={{ color: muted }}>
              {selectedStyle ? selectedStyle.name
                : Object.keys(selections).length > 1
                  ? `${Object.keys(selections).length} changes`
                  : `${material?.brand} ${material?.name}`}
            </p>

            {/* Elapsed timer */}
            <p className="text-xs mt-2 tabular-nums" style={{ color: muted }}>
              {elapsedSec < 60
                ? `${elapsedSec}s elapsed`
                : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s elapsed`}
              {elapsedSec > 5 && <span className="animate-pulse"> — still working</span>}
            </p>

            {/* Rotating tips */}
            <div className="mt-4 px-4 py-2 rounded-lg text-xs transition-opacity duration-500"
              style={{ background: text + '05', color: muted }}>
              💡 {LOADING_TIPS[currentTip]}
            </div>

            {/* Style preview hint */}
            {selectedStyle && (
              <div className="mt-4 p-3 rounded-xl border text-left" style={{ borderColor: border, background: surface }}>
                <p className="text-xs font-semibold mb-1" style={{ color: muted }}>What to expect</p>
                <p className="text-xs" style={{ color: muted }}>{selectedStyle.shortDesc}</p>
                <div className="flex gap-1 mt-2">
                  {[selectedStyle.colors.primary, selectedStyle.colors.secondary, selectedStyle.colors.accent].map((col, i) => (
                    <div key={i} className="w-8 h-4 rounded" style={{ background: col, border: `1px solid ${text}15` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Multi-material preview */}
            {!selectedStyle && Object.keys(selections).length > 0 && (
              <div className="mt-4 p-3 rounded-xl border text-left" style={{ borderColor: border, background: surface }}>
                <p className="text-xs font-semibold mb-1" style={{ color: muted }}>Applying {Object.keys(selections).length} changes</p>
                {Object.entries(selections).map(([key, mat]) => (
                    <div key={key} className="flex items-center gap-2 mt-1.5">
                      <div className="w-4 h-4 rounded" style={{ background: mat.color || mat.colorHex || '#888' }} />
                      <span className="text-xs" style={{ color: muted }}>{getSelectionLabel(key)}: {mat.brand} {mat.name}</span>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ RESULT ══════════════════════════ */}
        {(step === 'result' || step === 'submitted') && (
          <div className="transition-all duration-500"
            style={{ opacity: resultRevealed ? 1 : 0, transform: resultRevealed ? 'translateY(0)' : 'translateY(12px)' }}>

            <div className="flex items-start gap-2 mb-3">
              <h2 className="flex-1 text-lg sm:text-xl font-bold leading-tight truncate">
                {step === 'submitted' ? '✅ Request sent!' : selectionLabel}
              </h2>
              <div className="flex gap-1.5 flex-shrink-0">
                <Pill onClick={tryAnother} style={{ background: primary + '12', color: primary }}>✚ Keep & Change More</Pill>
                <Pill onClick={startFresh} style={{ borderColor: border, color: muted }}>↺ Start Fresh</Pill>
                <Pill onClick={share} style={{ borderColor: border, color: muted }}>
                  {copied ? '✓ Copied' : '↗ Share'}
                </Pill>
                {!favorites.find(f => f.image === generatedImage) && (
                  <Pill onClick={saveFavorite} style={{ background: primary + '12', color: primary }}>★</Pill>
                )}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-xl mb-4">
              <CompareSlider beforeSrc={image} afterSrc={generatedImage} primaryColor={primary} />
            </div>

            {/* Refinement */}
            {step === 'result' && (
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder='Try "darker trim" or "red door"'
                    value={refineText} onChange={e => setRefineText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && refine()} disabled={refining}
                    className="flex-1 px-3 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: border, background: surface }} />
                  <button onClick={refine} disabled={refining || !refineText.trim()}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 active:scale-[0.97] transition"
                    style={{ background: primary }}>{refining ? '...' : 'Go'}</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(remodel === 'kitchen'
                    ? ['Darker cabinets', 'White backsplash', 'Gold hardware', 'Butcher block island', 'Open shelving']
                    : remodel === 'bathroom'
                    ? ['Darker tile', 'White vanity', 'Gold fixtures', 'Frameless glass', 'Patterned floor']
                    : ['Darker trim', 'Red door', 'Stone accents', 'Black windows', 'White gutters']
                  ).map(chip => (
                    <button key={chip} onClick={() => setRefineText(chip)}
                      className="text-xs px-2.5 py-1 rounded-full border transition active:scale-[0.95]"
                      style={{ borderColor: border, color: muted }}>{chip}</button>
                  ))}
                </div>
                {genError && <p className="mt-2 text-xs text-red-600">{genError}</p>}
              </div>
            )}

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1.5" style={{ color: muted }}>Saved ({favorites.length})</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favorites.map(fav => (
                    <img key={fav.id} src={fav.image} alt={fav.label}
                      className="w-16 h-12 rounded-lg object-cover border-2 cursor-pointer flex-shrink-0 transition active:scale-[0.95]"
                      style={{ borderColor: generatedImage === fav.image ? primary : border }}
                      onClick={() => setGeneratedImage(fav.image)} />
                  ))}
                </div>
              </div>
            )}

            {/* Lead form — A/B tested: 'slide' (slide-in panel) vs 'sticky' (fixed bottom bar) */}
            {step === 'result' && !leadSubmitted && leadFormMode === 'slide' && (
              <div className="transition-all duration-500 overflow-hidden"
                style={{ maxHeight: showLeadForm ? '500px' : '0', opacity: showLeadForm ? 1 : 0 }}>
                <LeadForm lead={lead} setLead={setLead} submitLead={submitLead} submitting={submitting}
                  companyName={config.companyName} primary={primary} muted={muted} border={border} surface={surface} />
              </div>
            )}

            {step === 'result' && !leadSubmitted && leadFormMode === 'sticky' && (
              <StickyLeadBar
                lead={lead} setLead={setLead} submitLead={submitLead} submitting={submitting}
                companyName={config.companyName} primary={primary} muted={muted} border={border} surface={surface}
                show={showLeadForm}
              />
            )}

            {/* Submitted */}
            {step === 'submitted' && (
              <div className="rounded-2xl p-5 text-center" style={{ background: '#10B981' + '10', border: '2px solid #10B98140' }}>
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#065F46' }}>Design received!</h3>
                <p className="text-sm mb-3" style={{ color: '#047857' }}>
                  {config.companyName} will reach out shortly. Check your email for a confirmation.
                  {config.phone && <> Or call <a href={`tel:${config.phone}`} className="underline font-semibold">{config.phone}</a>.</>}
                </p>
                <button onClick={startOver} className="text-sm font-semibold px-4 py-2 rounded-lg active:scale-[0.97] transition"
                  style={{ background: primary + '15', color: primary }}>Design Another →</button>
              </div>
            )}
          </div>
        )}
      </main>

      {config.plan !== 'enterprise' && (
        <footer className="text-center py-2 text-xs" style={{ color: muted + '50' }}>
          Powered by <a href="/" target="_blank" rel="noopener" className="underline">HomeVisualizer</a>
        </footer>
      )}
    </div>
  );
}

function Pill({ children, onClick, style }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition active:scale-[0.95]" style={style}>
      {children}
    </button>
  );
}

function LeadForm({ lead, setLead, submitLead, submitting, companyName, primary, muted, border, surface }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 border-2 mt-2"
      style={{ borderColor: primary + '30', background: primary + '05' }}>
      <h3 className="font-bold mb-0.5">Love it? Get a free estimate.</h3>
      <p className="text-xs mb-3" style={{ color: muted }}>{companyName} will contact you with pricing.</p>
      <form onSubmit={submitLead} className="space-y-2">
        <div className="grid sm:grid-cols-2 gap-2">
          <input required type="text" placeholder="Name *" value={lead.name}
            onChange={e => setLead(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: border, background: surface }} />
          <input required type="email" placeholder="Email *" value={lead.email}
            onChange={e => setLead(p => ({ ...p, email: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: border, background: surface }} />
          <input type="tel" placeholder="Phone" value={lead.phone}
            onChange={e => setLead(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: border, background: surface }} />
          <input type="text" placeholder="Address" value={lead.address}
            onChange={e => setLead(p => ({ ...p, address: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: border, background: surface }} />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-60 active:scale-[0.98] transition"
          style={{ background: primary }}>{submitting ? 'Sending...' : 'Get My Free Estimate →'}</button>
      </form>
    </div>
  );
}

function StickyLeadBar({ lead, setLead, submitLead, submitting, companyName, primary, muted, border, surface, show }) {
  const [expanded, setExpanded] = useState(false);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300"
      style={{ transform: show ? 'translateY(0)' : 'translateY(100%)' }}>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t shadow-2xl p-4" style={{ background: surface, borderColor: border }}>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">Get your free estimate</h3>
              <button onClick={() => setExpanded(false)} className="text-xs" style={{ color: muted }}>✕</button>
            </div>
            <form onSubmit={submitLead} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input required type="text" placeholder="Name *" value={lead.name}
                  onChange={e => setLead(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: border }} />
                <input required type="email" placeholder="Email *" value={lead.email}
                  onChange={e => setLead(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: border }} />
                <input type="tel" placeholder="Phone" value={lead.phone}
                  onChange={e => setLead(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: border }} />
                <input type="text" placeholder="Address" value={lead.address}
                  onChange={e => setLead(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: border }} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 active:scale-[0.98] transition"
                style={{ background: primary }}>{submitting ? 'Sending...' : 'Get My Free Estimate →'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Collapsed sticky bar */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-3.5 px-4 text-white font-bold text-sm text-center shadow-2xl active:scale-[0.99] transition"
          style={{ background: primary }}
        >
          Love this design? Get a Free Estimate →
        </button>
      )}
    </div>
  );
}

function TestimonialCarousel({ testimonials, muted, border, surface }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  if (!testimonials.length) return null;
  const t = testimonials[idx];

  return (
    <div className="mt-6">
      <div className="rounded-xl border p-4 text-left transition-all duration-500"
        style={{ borderColor: border, background: surface }}>
        <p className="text-sm italic leading-relaxed mb-2" style={{ color: muted }}>
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">
            {t.name} <span style={{ color: muted }}>&middot; {t.location}</span>
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: muted + '15', color: muted }}>
            {t.project}
          </span>
        </div>
      </div>
      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? muted : muted + '30' }} />
          ))}
        </div>
      )}
    </div>
  );
}
