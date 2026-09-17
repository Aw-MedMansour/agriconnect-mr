import React, { useRef, useState } from 'react';
import {
  Leaf, Camera, Upload, Loader2, AlertTriangle, X,
  Bug, Droplets, Stethoscope, ClipboardCheck, Sparkles
} from 'lucide-react';
import { analyzePlant } from '@/lib/plant.functions';
import { useLanguage } from '../i18n';

const MAX_SIDE = 1024;

function fileToResizedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image illisible'));
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const HEALTH_STYLES = {
  bon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  moyen: 'bg-amber-50 text-amber-700 border-amber-200',
  mauvais: 'bg-rose-50 text-rose-700 border-rose-200',
};

function Section({ icon: Icon, title, color, items, empty }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <h4 className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide ${color} mb-3`}>
        <Icon className="w-4 h-4" /> {title}
      </h4>
      {(!items || items.length === 0) ? (
        <p className="text-xs text-slate-400 font-medium">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">{it.name}</span>
              {it.severity && (
                <span className="ml-2 text-[10px] font-bold uppercase text-slate-500">({it.severity})</span>
              )}
              {it.signs && <div className="text-slate-500 mt-0.5">{it.signs}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PlantAnalysis({ currentUser, onRequireAuth }) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const url = await fileToResizedDataUrl(file);
      setDataUrl(url);
      setPreview(url);
    } catch (err) {
      setError("Impossible de lire cette image. Essayez une autre photo (JPG ou PNG).");
    }
  };

  const run = async () => {
    if (!currentUser) { onRequireAuth?.(); return; }
    if (!dataUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzePlant({ data: { image: dataUrl, note: note.trim() || undefined } });
      setResult(res);
    } catch (err) {
      setError(err?.message || "L'analyse a échoué. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPreview(null); setDataUrl(null); setResult(null); setError(null); setNote(''); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white mb-6">
        <h2 className="flex items-center gap-2 text-xl font-extrabold">
           <Leaf className="w-6 h-6" /> {t('Analyse des plantes par IA')}
        </h2>
        <p className="text-emerald-50 text-xs mt-2 max-w-2xl leading-relaxed">
           {t("Prenez ou téléversez une photo d'une feuille, d'un fruit ou d'un plant entier. L'IA repère les maladies, parasites, carences visibles et vous donne des recommandations concrètes.")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Upload card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Plante à analyser" className="w-full h-64 object-cover rounded-xl border border-slate-200" />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow text-slate-600"
                title="Retirer la photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-center px-6">
              <Leaf className="w-10 h-10 text-emerald-400" />
              <p className="text-xs text-slate-500 font-medium">
                 {t('Cadrez bien la zone malade, en pleine lumière, sans flou.')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-full transition-colors"
            >
               <Camera className="w-4 h-4" /> {t('Prendre une photo')}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-full transition-colors"
            >
               <Upload className="w-4 h-4" /> {t('Téléverser')}
            </button>
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            maxLength={500}
             placeholder={t('Facultatif : culture, âge de la plante, symptômes observés...')}
            className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />

          <button
            onClick={run}
            disabled={!dataUrl || loading}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0a66c2] disabled:opacity-40 hover:bg-[#004182] text-white text-xs font-extrabold py-3 rounded-full transition-all"
          >
             {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Analyse en cours...')}</> : <><Sparkles className="w-4 h-4" /> {t('Analyser la plante')}</>}
          </button>
        </div>

        {/* Result card */}
        <div className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {!error && !result && !loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
               <p className="text-xs text-slate-500 font-medium">{t("Le résultat de l'analyse s'affichera ici.")}</p>
            </div>
          )}

          {loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <Loader2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-spin" />
               <p className="text-xs text-slate-500 font-medium">{t("L'IA examine votre photo...")}</p>
            </div>
          )}

          {result && result.reliable === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                 <p className="text-xs font-extrabold text-amber-900">{t('Analyse fiable impossible')}</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {result.reason || "L'image ne contient pas assez d'informations. Reprenez une photo nette, de près, bien éclairée."}
                </p>
              </div>
            </div>
          )}

          {result && result.reliable !== false && (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                     <p className="text-[10px] font-bold uppercase text-slate-400">{t('Plante identifiée')}</p>
                    <p className="text-sm font-extrabold text-slate-900">{result.plant || 'Indéterminée'}</p>
                  </div>
                  {result.health && (
                    <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${HEALTH_STYLES[result.health] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                       {t('État')} : {result.health}
                    </span>
                  )}
                </div>
                {result.healthSummary && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{result.healthSummary}</p>
                )}
                {result.confidence && (
                   <p className="text-[10px] text-slate-400 mt-2 font-semibold">{t('Niveau de confiance')} : {result.confidence}</p>
                )}
              </div>

               <Section icon={Stethoscope} color="text-rose-600" title={t('Maladies / symptômes')}
                items={result.diseases} empty="Aucune maladie clairement visible sur la photo." />
               <Section icon={Bug} color="text-orange-600" title={t('Parasites')}
                items={result.pests} empty="Aucun parasite visible détecté." />
               <Section icon={Droplets} color="text-blue-600" title={t('Carences / anomalies')}
                items={result.deficiencies} empty="Aucune carence évidente détectée." />

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700 mb-3">
                   <ClipboardCheck className="w-4 h-4" /> {t('Recommandations')}
                </h4>
                {result.recommendations?.length ? (
                  <ul className="space-y-1.5 list-disc list-inside">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-emerald-900 leading-relaxed">{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-800">Poursuivez vos pratiques habituelles et surveillez l'évolution.</p>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                {result.disclaimer || "Cette analyse est indicative. Pour un traitement, faites confirmer le diagnostic par un agronome."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
