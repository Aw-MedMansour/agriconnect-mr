import React from 'react';
import { Construction } from 'lucide-react';

export default function ComingSoonModule({ title, icon: Icon, description }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm inline-flex flex-col items-center max-w-2xl">
        <div className="w-20 h-20 bg-blue-50 text-[#0a66c2] rounded-full flex items-center justify-center mb-6">
          {Icon ? <Icon className="w-10 h-10" /> : <Construction className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
          {title}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
          {description || "Ce module est en cours de développement. Il sera bientôt disponible pour vous offrir encore plus de services."}
        </p>
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold px-4 py-2 rounded-full text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Bientôt disponible
        </div>
      </div>
    </div>
  );
}
