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
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content:
          "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  }),
  component: App,
});
