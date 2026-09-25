import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import App from "../agriconnect/App";
// The application UI is progressively localized from its existing JSX components.
// @ts-expect-error JSX context module has no standalone declaration file.
import { LanguageProvider } from "../agriconnect/i18n";
// @ts-expect-error JSX component has no standalone declaration file.
import LanguageGate from "../agriconnect/components/LanguageGate";

// Mettre à false pour rouvrir la plateforme.
const MAINTENANCE = true;

function Maintenance() {
  return (
    <main className="maintenance-stage">
      <section className="maintenance-shell" aria-labelledby="not-found-title">
        <p className="maintenance-code" aria-hidden="true">404</p>
        <h1 id="not-found-title">La plateforme n’existe plus.</h1>
        <nav className="ecosystem-links" aria-label="Autres sites disponibles">
          <a href="https://3A55.Fulania.com" target="_blank" rel="noreferrer">
            <span>3A55</span><ExternalLink aria-hidden="true" />
          </a>
          <a href="https://agrimIA.fulania.com" target="_blank" rel="noreferrer">
            <span>Agrim IA</span><ExternalLink aria-hidden="true" />
          </a>
          <a href="https://Fulania.com" target="_blank" rel="noreferrer">
            <span>FulanIA</span><ExternalLink aria-hidden="true" />
          </a>
        </nav>
      </div>
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
