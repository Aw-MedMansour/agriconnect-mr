import React, { useEffect, useState } from 'react';
import logo from '../assets/agriconnect-logo.png';
import { useLanguage } from '../i18n';

export default function SplashScreen({ done }) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 12));
    }, 180);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (done) setProgress(100);
  }, [done]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5 px-8 text-center">
        <img
          src={logo}
          alt="AgriConnect"
          width={128}
          height={128}
          className="h-28 w-28 animate-[pulse_2s_ease-in-out_infinite] object-contain drop-shadow-sm"
        />
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            Agri<span className="text-[#0a66c2]">Connect</span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {t('Le réseau professionnel agricole')}
          </p>
        </div>

        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#0a66c2] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-slate-400">Chargement…</p>
      </div>

      <div className="absolute bottom-8 text-[11px] font-medium text-slate-400 text-center px-4">
        Développé en partenariat par{' '}
        <a
          href="https://3A55.Fulania.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#0a66c2] hover:underline"
        >
          3A55
        </a>{' '}
        & Agrosky
      </div>
    </div>
  );
}
