import React, { useState, useEffect } from 'react';

export default function AsyncMediaItem({ item, onClick, className, style, isVideoThumbnail = false }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    // If the item already has a real URL (http/https or data URL) — use it directly
    if (item.url && !item.url.startsWith('blob:')) {
      setUrl(item.url);
    } else if (item.file) {
      // Temporary file object (preview before upload finishes)
      objectUrl = URL.createObjectURL(item.file);
      setUrl(objectUrl);
    } else if (item.url) {
      // blob URL fallback (only valid in this session)
      setUrl(item.url);
    }
    // item.dbId (IndexedDB) is no longer used — media is now in Supabase Storage

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  if (!url) return <div className={`bg-slate-800 animate-pulse ${className}`} style={style} />;

  const isClickable = !!onClick;

  if (item.type === 'video') {
    return (
      <div
        className={`relative w-full h-full ${isClickable ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        onClick={onClick}
      >
        <video
          src={url}
          controls={!isVideoThumbnail}
          preload="metadata"
          playsInline
          className="w-full h-full"
          style={{ objectFit: 'contain', background: '#000', display: 'block' }}
        />
        {isVideoThumbnail && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full ${isClickable ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      <img src={url} alt="Photo publiée sur AgriConnect" className="w-full h-full object-cover" style={{ display: 'block' }} />
    </div>
  );
}
