import React, { useEffect, useState } from 'react';

// Palette variée : chaque compte reçoit une couleur stable dérivée de son nom/id.
const PALETTE = [
  { bg: 'bg-gradient-to-br from-[#0a66c2] to-[#0ea5a0]', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-violet-500 to-indigo-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-sky-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-lime-500 to-green-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600', text: 'text-white' },
];

// Anciennes photos "par défaut" : on ne les affiche plus, on met les initiales.
const PLACEHOLDERS = ['photo-1560250097-0b93528c311a'];

export function isPlaceholderAvatar(src) {
  if (!src || typeof src !== 'string') return true;
  return PLACEHOLDERS.some((p) => src.includes(p));
}

export function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function paletteFor(seed = '') {
  const s = String(seed) || '?';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({
  src,
  name = 'Utilisateur',
  seed,
  className = 'w-10 h-10',
  textClassName = 'text-xs',
  ringClassName = '',
  onClick,
  title,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [src]);
  const showImage = !imageFailed && !isPlaceholderAvatar(src);
  const colors = paletteFor(seed || name);
  const base = `relative shrink-0 rounded-full overflow-hidden ${className} ${ringClassName}`;

  if (showImage) {
    return (
      <img
        src={src}
        alt={name}
        title={title || name}
        onClick={onClick}
        onError={() => setImageFailed(true)}
        className={`${base} object-cover bg-slate-100`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      title={title || name}
      aria-label={name}
      className={`${base} ${colors.bg} ${colors.text} flex items-center justify-center font-black tracking-tight select-none ${textClassName}`}
    >
      {initialsOf(name)}
    </div>
  );
}
