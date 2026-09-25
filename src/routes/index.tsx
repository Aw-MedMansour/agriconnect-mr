import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, ExternalLink, Radio, ScanLine, Sparkles } from "lucide-react";
import App from "../agriconnect/App";
import agriconnectLogo from "../agriconnect/assets/agriconnect-logo.png";
import robot3A55 from "../assets/robot-3a55-original.jpg.asset.json";
// The application UI is progressively localized from its existing JSX components.
// @ts-expect-error JSX context module has no standalone declaration file.
import { LanguageProvider } from "../agriconnect/i18n";
// @ts-expect-error JSX component has no standalone declaration file.
import LanguageGate from "../agriconnect/components/LanguageGate";

// Mettre à false pour rouvrir la plateforme.
const MAINTENANCE = true;

function Maintenance() {
  return (
    <main className="maintenance-stage min-h-screen overflow-hidden text-primary-foreground">
      <div className="tech-grid" aria-hidden="true" />
      <div className="signal-scan" aria-hidden="true" />
      <div className="tech-orbit tech-orbit-one" aria-hidden="true" />
      <div className="tech-orbit tech-orbit-two" aria-hidden="true" />

      <div className="maintenance-shell mx-auto grid min-h-screen w-full max-w-6xl items-center gap-5 px-5 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10 lg:px-8">
        <section className="maintenance-copy z-10 text-left">
          <div className="brand-lockup inline-flex items-center gap-3">
            <img
              src={agriconnectLogo}
              alt="Logo AgriConnect"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            />
            <div>
              <p className="brand-name text-2xl font-black sm:text-3xl">AgriConnect</p>
              <p className="tech-kicker">AGRICULTURE · RÉSEAU · INTELLIGENCE</p>
            </div>
          </div>

          <div className="system-status mt-8 inline-flex items-center gap-2">
            <span className="status-dot" />
            <span>ÉVOLUTION DU SYSTÈME EN COURS</span>
          </div>

          <h1 className="maintenance-title mt-5 text-4xl font-black sm:text-6xl">
            Une nouvelle expérience <span>se prépare.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/70 sm:text-lg">
            AgriConnect revient bientôt avec une plateforme plus intelligente, plus rapide et profondément connectée à l’avenir agricole.
          </p>

          <div className="signal-strip mt-7" aria-label="État du système">
            <span><Radio className="h-4 w-4" /> Signal sécurisé</span>
            <span><BrainCircuit className="h-4 w-4" /> IA connectée</span>
            <span><ScanLine className="h-4 w-4" /> Mise à niveau</span>
          </div>

          <nav className="ecosystem-links mt-8" aria-label="Écosystème FulaniAI">
            <a href="https://3A55.Fulania.com" target="_blank" rel="noreferrer">
              <span className="link-index">01</span><span><strong>3A55</strong><small>Technologie & création</small></span><ExternalLink />
            </a>
            <a href="https://agrimIA.fulania.com" target="_blank" rel="noreferrer">
              <span className="link-index">02</span><span><strong>Agrim IA</strong><small>Intelligence agricole</small></span><ExternalLink />
            </a>
            <a href="https://Fulania.com" target="_blank" rel="noreferrer">
              <span className="link-index">03</span><span><strong>FulanIA</strong><small>Intelligence culturelle</small></span><ExternalLink />
            </a>
          </nav>

          <div className="mt-6 space-y-1 text-xs text-primary-foreground/45">
            <p>Platform temporarily unavailable</p>
            <p dir="rtl">المنصة غير متاحة مؤقتًا</p>
          </div>
        </section>

        <section className="robot-command" aria-label="Robot officiel 3A55 dans un environnement technologique">
          <div className="robot-hud" aria-hidden="true">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-tr" />
            <span className="hud-corner hud-corner-bl" />
            <span className="hud-corner hud-corner-br" />
            <div className="hud-label"><Sparkles className="h-4 w-4" /> DIGITAL INTELLIGENCE</div>
            <div className="hud-reading hud-reading-one"><small>CORE</small><strong>98.7%</strong></div>
            <div className="hud-reading hud-reading-two"><small>STATUS</small><strong>ONLINE</strong></div>
          </div>
          <div className="robot-visual">
            <img src={robot3A55.url} alt="Robot 3A55 original" />
          </div>
          <div className="robot-signal" aria-hidden="true"><span /><span /><span /></div>
          <div className="data-stream data-stream-left" aria-hidden="true">10110<br />01001<br />11010<br />00101</div>
          <div className="data-stream data-stream-right" aria-hidden="true">AGRI<br />NODE<br />AI.03<br />SYNC</div>
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
