import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import App from "../agriconnect/App";
// The application UI is progressively localized from its existing JSX components.
// @ts-expect-error JSX context module has no standalone declaration file.
import { LanguageProvider } from "../agriconnect/i18n";
// @ts-expect-error JSX component has no standalone declaration file.
import LanguageGate from "../agriconnect/components/LanguageGate";

// Mettre à false pour rouvrir la plateforme.
const MAINTENANCE = true;

// Heure de fin fixe et commune à tous les visiteurs (26 sept. 2026, 13:04 UTC).
// Le compte à rebours est réel et continu : il ne dépend ni du navigateur,
// ni de l'utilisateur, ni du moment de la visite.
const COUNTDOWN_END = Date.UTC(2026, 8, 26, 13, 4, 0);

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

function Hourglass() {
  return (
    <div className="hourglass" aria-hidden="true">
      <svg viewBox="0 0 100 140" className="hourglass-svg" focusable="false">
        <defs>
          <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* Cadre */}
        <rect x="18" y="2" width="64" height="8" rx="4" className="hourglass-frame" />
        <rect x="18" y="130" width="64" height="8" rx="4" className="hourglass-frame" />
        {/* Verre */}
        <path
          d="M30 12 H70 L54 60 V80 L70 128 H30 L46 80 V60 Z"
          fill="none"
          className="hourglass-glass"
        />
        {/* Sable haut (se vide) */}
        <polygon points="35,18 65,18 50,58" className="hg-sand-top" fill="url(#hg-sand)" />
        {/* Filet de sable */}
        <rect x="49" y="60" width="2.4" height="46" rx="1.2" className="hg-stream" fill="url(#hg-sand)" />
        {/* Sable bas (se remplit) */}
        <polygon points="39,126 61,126 50,86" className="hg-sand-bottom" fill="url(#hg-sand)" />
      </svg>
    </div>
  );
}

function Countdown() {
  const endTime = COUNTDOWN_END;
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endTime - Date.now()) / 1000)),
  );

  useEffect(() => {
    const update = () =>
      setRemaining(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    // Recalculé depuis l'heure réelle : reste exact même si l'onglet
    // est en arrière-plan ou mis en veille par le navigateur.
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [endTime]);

  return (
    <div className="countdown" aria-live="off">
      <Hourglass />
      <p className="countdown-value">{formatCountdown(remaining)}</p>
    </div>
  );
}

function Maintenance() {
  return (
    <main className="maintenance-stage">
      <section className="maintenance-shell">
        <p className="maintenance-code" aria-hidden="true">404</p>
        <Countdown />
      </section>
    </main>
  );
}

function LocalizedApp() {
  if (MAINTENANCE) return <Maintenance />;
  return (
    <LanguageProvider>
      <LanguageGate><App /></LanguageGate>
    </LanguageProvider>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "404 — AgriConnect" },
      {
        name: "description",
        content:
          "La plateforme AgriConnect n’existe plus.",
      },
      { property: "og:title", content: "404 — AgriConnect" },
      {
        property: "og:description",
        content:
          "La plateforme AgriConnect n’existe plus.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://agriconnect-mr.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://agriconnect-mr.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AgriConnect",
          url: "https://agriconnect-mr.com/",
          inLanguage: "fr",
          description:
            "Réseau professionnel agricole : marketplace de produits, services, messagerie et analyse des plantes par IA.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AgriConnect",
          url: "https://agriconnect-mr.com/",
          logo: "https://agriconnect-mr.com/favicon.png",
          description:
            "Plateforme professionnelle mettant en relation agriculteurs, acheteurs, transporteurs et prestataires de services agricoles.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: "https://agriconnect-mr.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Conditions d'utilisation",
              item: "https://agriconnect-mr.com/conditions",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Mentions légales",
              item: "https://agriconnect-mr.com/mentions-legales",
            },
            {
              "@type": "ListItem",
              position: 4,
              name: "Politique d'utilisation",
              item: "https://agriconnect-mr.com/politique-d-utilisation",
            },
          ],
        }),
      },
    ],
  }),
  component: LocalizedApp,
});
