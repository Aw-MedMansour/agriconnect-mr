import { createFileRoute } from "@tanstack/react-router";
import App from "../agriconnect/App";

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
  component: App,
});
