import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Laptop, Trophy } from "lucide-react";
import App from "../agriconnect/App";
import agriconnectLogo from "../agriconnect/assets/agriconnect-logo.png";
// The application UI is progressively localized from its existing JSX components.
// @ts-expect-error JSX context module has no standalone declaration file.
import { LanguageProvider } from "../agriconnect/i18n";
// @ts-expect-error JSX component has no standalone declaration file.
import LanguageGate from "../agriconnect/components/LanguageGate";

// Mettre à false pour rouvrir la plateforme.
const MAINTENANCE = true;

function Maintenance() {
  return (
    <main className="maintenance-stage min-h-screen overflow-hidden bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-5 py-8 text-center sm:flex-row sm:justify-between sm:gap-12 sm:px-8">
        <section className="z-10 max-w-lg space-y-4 sm:text-left">
          <div className="inline-flex items-center gap-3">
            <img
              src={agriconnectLogo}
              alt="Logo AgriConnect"
              className="h-11 w-11 object-contain"
            />
            <h1 className="text-3xl font-black sm:text-4xl">AgriConnect</h1>
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-bold sm:text-2xl">Plateforme temporairement inaccessible</p>
            <p className="text-sm text-primary-foreground/70">Platform temporarily unavailable</p>
            <p className="text-sm text-primary-foreground/70" dir="rtl">المنصة غير متاحة مؤقتًا</p>
          </div>
          <a
            href="https://3A55.Fulania.com"
            target="_blank"
            rel="noreferrer"
            className="maintenance-link inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Découvrir 3A55
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        <section className="robot-zone" aria-label="Robot 3A55 souriant, dansant avec un ballon et son ordinateur">
          <div className="robot-shadow" />
          <div className="football" aria-hidden="true">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="robot-dance">
            <div className="robot-antenna"><span /></div>
            <div className="robot-head">
              <div className="robot-face">
                <span className="robot-eye" />
                <span className="robot-smile" />
                <span className="robot-eye" />
              </div>
            </div>
            <div className="robot-body">
              <div className="robot-mark">3A55</div>
              <div className="robot-arm robot-arm-left"><span /></div>
              <div className="robot-arm robot-arm-right"><span /></div>
              <div className="robot-laptop">
                <Laptop className="h-10 w-10" aria-hidden="true" />
                <strong>3A55</strong>
              </div>
            </div>
            <div className="robot-legs">
              <span /><span />
            </div>
          </div>
        </section>
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
      { title: "AgriConnect — Le Réseau Professionnel Agricole" },
      {
        name: "description",
        content:
          "AgriConnect connecte agriculteurs, transporteurs, acheteurs et prestataires : marketplace de produits agricoles, services, réseau social et messagerie.",
      },
      { property: "og:title", content: "AgriConnect — Le Réseau Professionnel Agricole" },
      {
        property: "og:description",
        content:
          "Marketplace agricole, offres de services, réseau social et messagerie pour les acteurs de l'agriculture.",
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
