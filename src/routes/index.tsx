import { createFileRoute } from "@tanstack/react-router";
import App from "../agriconnect/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroConnect — Le Réseau Professionnel Agricole" },
      {
        name: "description",
        content:
          "AgroConnect connecte agriculteurs, transporteurs, acheteurs et prestataires : marketplace de produits agricoles, services, réseau social et messagerie.",
      },
      { property: "og:title", content: "AgroConnect — Le Réseau Professionnel Agricole" },
      {
        property: "og:description",
        content:
          "Marketplace agricole, offres de services, réseau social et messagerie pour les acteurs de l'agriculture.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://agriconnect.fulania.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://agriconnect.fulania.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AgroConnect",
          url: "https://agriconnect.fulania.com/",
          description:
            "Réseau professionnel agricole : marketplace de produits, services, messagerie et analyse des plantes par IA.",
        }),
      },
    ],
  }),
  component: App,
});
