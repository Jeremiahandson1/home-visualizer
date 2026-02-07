'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function CompareSlider({ beforeSrc, afterSrc, primaryColor = '#B8860B' }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
    };
    const onUp = () => setDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ aspectRatio: '16/10', cursor: 'col-resize' }}
      onMouseDown={(e) => { setDragging(true); handleMove(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); handleMove(e.touches[0].clientX); }}
    >
      {/* After image (full, underneath) */}
      <img
        src={afterSrc}
        alt="After visualization"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white z-10"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Drag handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16M13 4L17 10L13 16" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-sm text-white px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase z-[5]">
        Before
      </div>
      <div
        className="absolute top-3.5 right-3.5 text-white px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase z-[5]"
        style={{ background: primaryColor }}
      >
        After
      </div>
    </div>
  );
}
