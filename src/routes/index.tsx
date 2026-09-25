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

const INITIAL_SECONDS = 24 * 60 * 60;

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

function Countdown() {
  const [remaining, setRemaining] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <p className="countdown" aria-live="off">
      <span className="countdown-value">{formatCountdown(remaining)}</span>
      <span className="countdown-label">Réactivation dans</span>
    </p>
  );
}

function Maintenance() {
  return (
    <main className="maintenance-stage">
      <section className="maintenance-shell" aria-labelledby="not-found-title">
        <p className="maintenance-code" aria-hidden="true">404</p>
        <h1 id="not-found-title">La plateforme n’existe plus.</h1>
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
