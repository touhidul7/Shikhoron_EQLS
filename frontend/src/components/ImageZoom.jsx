import React, { useState } from 'react';

/**
 * ImageZoom component: shows an image, and when clicked, opens a modal with a zoomed-in version.
 * Usage: <ImageZoom src={...} alt={...} className={...} />
 */
export default function ImageZoom({ src, alt, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className + ' cursor-zoom-in'}
        onClick={() => setOpen(true)}
        style={{ transition: 'box-shadow 0.2s' }}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-white cursor-zoom-out"
            onClick={e => { e.stopPropagation(); setOpen(false); }}
          />
        </div>
      )}
    </>
  );
}
