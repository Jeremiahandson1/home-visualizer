'use client';

import { useState } from 'react';
import {
  BUILDER_STEPS, LAYOUT_OPTIONS, WALL_TILE_OPTIONS, FLOOR_OPTIONS,
  GLASS_OPTIONS, FIXTURE_FINISH_OPTIONS, SHOWERHEAD_OPTIONS,
  TUB_OPTIONS, NICHE_OPTIONS, EXTRAS_OPTIONS,
  compileShowerPrompt, getBuilderSummary,
} from '@/lib/shower-options';

// ═══════════════════════════════════════════════════════════
// SHOWER & TUB BUILDER — Step-by-Step Configurator
// Walks user through layout → tile → fixtures → extras
// Compiles selections into a single AI prompt
// ═══════════════════════════════════════════════════════════

export default function ShowerBuilder({ onGenerate, onBack, primary, muted, border, surface, text }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});

  // Filter steps based on selections (e.g. hide tub step if no tub layout)
  const visibleSteps = BUILDER_STEPS.filter(step => {
    if (step.showIf) return step.showIf(selections);
    return true;
  });

  const step = visibleSteps[currentStep];
  const isLast = currentStep === visibleSteps.length - 1;
  const canProceed = step?.required ? !!selections[step.id] : true;

  const select = (stepId, value) => {
    setSelections(prev => ({ ...prev, [stepId]: value }));
  };

  const toggleExtra = (option) => {
    setSelections(prev => {
      const current = prev.extras || [];
      const exists = current.find(e => e.id === option.id);
      if (exists) {
        return { ...prev, extras: current.filter(e => e.id !== option.id) };
      }
      return { ...prev, extras: [...current, option] };
    });
  };

  const next = () => {
    if (isLast) {
      const prompt = compileShowerPrompt(selections);
      if (prompt) {
        onGenerate({
          prompt,
          summary: getBuilderSummary(selections),
          selections,
        });
      }
    } else {
      setCurrentStep(c => Math.min(c + 1, visibleSteps.length - 1));
    }
  };

  const prev = () => {
    if (currentStep === 0) {
      onBack();
    } else {
      setCurrentStep(c => c - 1);
    }
  };

  // Get options for current step
  const getOptions = () => {
    switch (step?.id) {
      case 'layout': return LAYOUT_OPTIONS;
      case 'walls': return WALL_TILE_OPTIONS;
      case 'floor': return FLOOR_OPTIONS;
      case 'glass': return GLASS_OPTIONS;
      case 'fixtures': return FIXTURE_FINISH_OPTIONS;
      case 'tub': return TUB_OPTIONS.filter(t => {
        if (selections.layout?.id === 'freestanding-tub') return t.category === 'freestanding';
        if (selections.layout?.id === 'alcove-tub') return t.category === 'builtin';
        if (selections.layout?.id === 'tub-shower-combo') return true;
        return true;
      });
      case 'niche': return NICHE_OPTIONS;
      case 'extras': return EXTRAS_OPTIONS;
      default: return [];
    }
  };

  // Add showerhead sub-step after fixtures
  const [showShowerhead, setShowShowerhead] = useState(false);

  const options = getOptions();
  const selected = selections[step?.id];
  const isMultiSelect = step?.id === 'extras';

  // ═══ RENDER ═══════════════════════════════════════════
  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {visibleSteps.map((s, i) => {
          const isDone = selections[s.id] || (s.id === 'extras' && selections.extras?.length > 0);
          const isCurrent = i === currentStep;
          return (
            <button
              key={s.id}
              onClick={() => i <= currentStep && setCurrentStep(i)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isCurrent ? primary : isDone ? primary + '15' : text + '06',
                color: isCurrent ? '#fff' : isDone ? primary : muted,
                cursor: i <= currentStep ? 'pointer' : 'default',
                opacity: i > currentStep ? 0.4 : 1,
              }}
            >
              {isDone && !isCurrent && <span>✓</span>}
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-base">
            {step?.icon} {step?.label}
            {step?.required && <span className="text-xs font-normal ml-1" style={{ color: muted }}>Required</span>}
          </h3>
          {step?.id === 'extras' && (
            <p className="text-xs" style={{ color: muted }}>Select any that apply (optional)</p>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: text + '08', color: muted }}>
          {currentStep + 1} / {visibleSteps.length}
        </span>
      </div>

      {/* Showerhead sub-step */}
      {step?.id === 'fixtures' && selections.fixtures && !showShowerhead && (
        <div className="mb-3 p-2.5 rounded-xl border flex items-center gap-2"
          style={{ borderColor: primary + '40', background: primary + '08' }}>
          <div className="w-6 h-6 rounded-full" style={{ background: selections.fixtures.color, border: `1px solid ${text}20` }} />
          <span className="text-sm font-medium flex-1">{selections.fixtures.name} selected</span>
          <button onClick={() => setShowShowerhead(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ background: primary, color: '#fff' }}>
            Choose Showerhead →
          </button>
        </div>
      )}

      {step?.id === 'fixtures' && showShowerhead && (
        <>
          <p className="text-xs font-semibold mb-2" style={{ color: muted }}>🚿 Showerhead Style</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {SHOWERHEAD_OPTIONS.map(opt => {
              const isSel = selections.showerhead?.id === opt.id;
              return (
                <button key={opt.id}
                  onClick={() => select('showerhead', opt)}
                  className="rounded-xl border p-3 text-left transition-all active:scale-[0.97]"
                  style={{
                    borderColor: isSel ? primary : border,
                    background: surface,
                    boxShadow: isSel ? `0 0 0 2px ${primary}` : 'none',
                  }}>
                  <p className="font-semibold text-sm">{opt.name}</p>
                  <p className="text-xs" style={{ color: muted }}>{opt.desc}</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowShowerhead(false)}
            className="text-xs underline mb-2" style={{ color: primary }}>← Back to finishes</button>
        </>
      )}

      {/* Options grid */}
      {!(step?.id === 'fixtures' && showShowerhead) && (
        <div className={
          step?.id === 'layout' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
            : step?.id === 'fixtures' ? 'grid grid-cols-3 sm:grid-cols-4 gap-2'
            : step?.id === 'glass' || step?.id === 'niche' || step?.id === 'extras' || step?.id === 'tub'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
              : 'grid grid-cols-2 sm:grid-cols-3 gap-2'
        }>
          {options.map(opt => {
            const isSel = isMultiSelect
              ? (selections.extras || []).find(e => e.id === opt.id)
              : selected?.id === opt.id;

            // Layout cards (bigger, with icon)
            if (step?.id === 'layout') {
              return (
                <button key={opt.id}
                  onClick={() => {
                    select('layout', opt);
                    // Clear tub if switching to non-tub layout
                    if (!opt.hasTub && selections.tub) {
                      setSelections(prev => { const n = { ...prev, layout: opt }; delete n.tub; return n; });
                    }
                  }}
                  className="rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97]"
                  style={{
                    borderColor: isSel ? primary : border,
                    background: surface,
                    boxShadow: isSel ? `0 0 0 2px ${primary}` : 'none',
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{opt.icon}</span>
                    {isSel && <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: primary }}>✓</span>}
                  </div>
                  <p className="font-bold text-sm">{opt.name}</p>
                  <p className="text-xs" style={{ color: muted }}>{opt.desc}</p>
                </button>
              );
            }

            // Fixture finish cards (color swatch focused)
            if (step?.id === 'fixtures') {
              return (
                <button key={opt.id}
                  onClick={() => { select('fixtures', opt); setShowShowerhead(false); }}
                  className="rounded-xl border p-2.5 text-center transition-all active:scale-[0.97]"
                  style={{
                    borderColor: isSel ? primary : border,
                    background: surface,
                    boxShadow: isSel ? `0 0 0 2px ${primary}` : 'none',
                  }}>
                  <div className="w-10 h-10 rounded-full mx-auto mb-1.5 border"
                    style={{ background: opt.color, borderColor: text + '15' }} />
                  <p className="font-semibold text-xs leading-tight">{opt.name}</p>
                </button>
              );
            }

            // Tile cards (color swatch + name)
            if (step?.id === 'walls' || step?.id === 'floor') {
              const showColor = opt.color || (opt.family === 'match' ? (selections.walls?.color || '#999') : '#999');
              return (
                <button key={opt.id}
                  onClick={() => select(step.id, opt)}
                  className="rounded-lg border p-2.5 text-left transition-all active:scale-[0.97] relative"
                  style={{
                    borderColor: isSel ? primary : border,
                    background: surface,
                    boxShadow: isSel ? `0 0 0 2px ${primary}` : 'none',
                  }}>
                  {isSel && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                      style={{ background: primary }}>✓</span>
                  )}
                  <div className="w-full h-8 rounded mb-1.5 border"
                    style={{ background: showColor, borderColor: text + '10' }} />
                  <p className="font-semibold text-xs leading-tight">{opt.name}</p>
                  <p className="text-xs truncate" style={{ color: muted }}>{opt.desc}</p>
                </button>
              );
            }

            // List cards (glass, tub, niche, extras)
            return (
              <button key={opt.id}
                onClick={() => isMultiSelect ? toggleExtra(opt) : select(step.id, opt)}
                className="rounded-xl border p-3 text-left transition-all active:scale-[0.97] flex items-start gap-3"
                style={{
                  borderColor: isSel ? primary : border,
                  background: isSel ? primary + '08' : surface,
                  boxShadow: isSel ? `0 0 0 2px ${primary}` : 'none',
                }}>
                <div className="flex-shrink-0 mt-0.5">
                  {isMultiSelect ? (
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center text-xs"
                      style={{ borderColor: isSel ? primary : text + '30', background: isSel ? primary : 'transparent', color: isSel ? '#fff' : 'transparent' }}>
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: isSel ? primary : text + '30' }}>
                      {isSel && <div className="w-2.5 h-2.5 rounded-full" style={{ background: primary }} />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{opt.name}</p>
                  <p className="text-xs" style={{ color: muted }}>{opt.desc}</p>
                  {opt.color && (
                    <div className="w-6 h-6 rounded mt-1 border" style={{ background: opt.color, borderColor: text + '10' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selection summary strip */}
      {Object.keys(selections).filter(k => selections[k] && k !== 'extras').length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {selections.layout && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: primary + '12', color: primary }}>
              📐 {selections.layout.name}
            </span>
          )}
          {selections.walls && (
            <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: primary + '12', color: primary }}>
              <span className="w-3 h-3 rounded" style={{ background: selections.walls.color }} />
              {selections.walls.name}
            </span>
          )}
          {selections.floor && selections.floor.id !== 'floor-match' && (
            <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: primary + '12', color: primary }}>
              <span className="w-3 h-3 rounded" style={{ background: selections.floor.color || '#999' }} />
              {selections.floor.name}
            </span>
          )}
          {selections.fixtures && (
            <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: primary + '12', color: primary }}>
              <span className="w-3 h-3 rounded-full" style={{ background: selections.fixtures.color }} />
              {selections.fixtures.name}
            </span>
          )}
          {selections.tub && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: primary + '12', color: primary }}>
              🛁 {selections.tub.name}
            </span>
          )}
          {selections.glass && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: primary + '12', color: primary }}>
              🪟 {selections.glass.name}
            </span>
          )}
          {(selections.extras || []).length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: primary + '12', color: primary }}>
              ✨ {selections.extras.length} extra{selections.extras.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-2 mt-5">
        <button onClick={prev}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition active:scale-[0.97]"
          style={{ borderColor: border, color: muted }}>
          ← Back
        </button>
        <button onClick={next}
          disabled={!canProceed}
          className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition active:scale-[0.97] disabled:opacity-40"
          style={{ background: primary }}>
          {isLast ? '🚀 Generate My Shower' : `Next: ${visibleSteps[currentStep + 1]?.label || ''} →`}
        </button>
      </div>
    </div>
  );
}
