import { auth, defineMcp } from "@lovable.dev/mcp-js";
import { listProducts, listServices, listPosts } from "./tools/listings";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "agriconnect",
  title: "Agriconnect",
  version: "0.1.0",
  instructions:
    "Outils AgriConnect (plateforme agricole en Mauritanie). Utilisez list_products, list_services et list_posts pour consulter le Marketplace, les services et le réseau social.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listServices, listPosts],
});
