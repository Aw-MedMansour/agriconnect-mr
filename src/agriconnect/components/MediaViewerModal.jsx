import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import AsyncMediaItem from './AsyncMediaItem';

export default function MediaViewerModal({ isOpen, onClose, mediaItems, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || !mediaItems || mediaItems.length === 0) return null;

  const total = mediaItems.length;
  const currentItem = mediaItems[currentIndex];

  const prev = (e) => {
    e.stopPropagation();
    setCurrentIndex(i => (i - 1 + total) % total);
  };
  
  const next = (e) => {
    e.stopPropagation();
    setCurrentIndex(i => (i + 1) % total);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50 cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50 cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div className="w-full h-full max-w-6xl max-h-screen p-8 flex items-center justify-center" onClick={onClose}>
        <div 
          className="relative w-full h-full max-h-[90vh] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-black" 
          onClick={e => e.stopPropagation()}
        >
          <AsyncMediaItem 
            item={currentItem} 
            className="w-full h-full" 
            style={{ objectFit: 'contain' }}
            isVideoThumbnail={false} // Full controls in modal
          />
        </div>
      </div>

      {/* Status Bar */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full z-50 pointer-events-none">
          {currentIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}
