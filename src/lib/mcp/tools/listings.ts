import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SENSITIVE = new Set(["phone", "email", "contact", "whatsapp"]);

function clean(data: unknown): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  if (!data || typeof data !== "object") return out;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE.has(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 1000);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

function makeListTool(table: "products" | "services" | "posts", name: string, title: string, description: string) {
  return defineTool({
    name,
    title,
    description,
    inputSchema: {
      query: z.string().trim().max(100).optional().describe("Mot-clé à rechercher (optionnel)."),
      limit: z.number().int().min(1).max(50).optional().describe("Nombre maximum de résultats (défaut 20)."),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async ({ query, limit }, ctx) => {
      if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
      const { data, error } = await supabaseForUser(ctx)
        .from(table)
        .select("id, data, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      const q = query?.toLowerCase();
      const items = (data ?? [])
        .map((r) => ({ id: String(r.id), created_at: String(r.created_at), ...clean(r.data) }))
        .filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q))
        .slice(0, limit ?? 20);
      return { content: [{ type: "text", text: JSON.stringify(items) }], structuredContent: { items } };
    },
  });
}

export const listProducts = makeListTool("products", "list_products", "Lister les produits", "Rechercher les produits agricoles du Marketplace AgriConnect.");
export const listServices = makeListTool("services", "list_services", "Lister les services", "Rechercher les services agricoles proposés sur AgriConnect.");
export const listPosts = makeListTool("posts", "list_posts", "Lister les publications", "Lire les dernières publications du réseau social AgriConnect.");
