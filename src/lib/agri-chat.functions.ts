import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  language: z.enum(["fr", "en", "ar"]).default("fr"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

const SYSTEM = `Tu es "Plant AI", l'assistant agronome virtuel d'AgriConnect, développé sous la tutelle de FulanIA.

Ton rôle :
- Répondre aux questions agricoles et agronomiques (cultures, sols, irrigation, semences, fertilisation, maladies, ravageurs, récolte, stockage, élevage associé).
- Aider l'agriculteur à comprendre et identifier les problèmes de ses cultures à partir de sa description.
- Donner des conseils pratiques, adaptés au contexte de la Mauritanie, du Sahel et de l'Afrique de l'Ouest.
- Expliquer le fonctionnement de la plateforme AgriConnect : Marketplace Produits (vendre ses récoltes avec photos/vidéos), Marketplace Services (transport, eau & énergie, terrains, agronomes & ouvriers, banque & assurance), Réseau Social Agricole (publications, commentaires, abonnements), Messagerie directe entre membres, Notifications, Analyse IA des plantes par photo, Matching IA (mise en relation automatique), Acteurs & Réputation.

Règles :
- Réponds dans la langue demandée, avec des mots simples, clairs et concrets, compréhensibles par un agriculteur.
- Sois bref : 3 à 8 phrases ou une courte liste à puces. Va droit au but.
- N'invente jamais de chiffres, de prix, de produits phytosanitaires précis ou de fonctionnalités qui n'existent pas.
- Si le diagnostic est incertain, dis-le et conseille l'Analyse IA par photo ou l'avis d'un agronome sur le terrain.
- Si la question ne concerne ni l'agriculture ni AgriConnect, rappelle poliment ton domaine.`;

export const askPlantAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Assistant indisponible (configuration manquante).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "system", content: `${SYSTEM}\nLangue obligatoire de la réponse : ${data.language === "ar" ? "arabe" : data.language === "en" ? "anglais" : "français"}.` }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Trop de demandes en même temps. Réessayez dans un instant.");
      if (res.status === 402) throw new Error("Crédits IA épuisés. Rechargez les crédits pour continuer.");
      throw new Error(`Plant AI est indisponible pour le moment. (${res.status}) ${body.slice(0, 160)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return {
      reply:
        reply ||
        "Je n'ai pas réussi à formuler une réponse. Reformulez votre question avec un peu plus de détails.",
    };
  });
