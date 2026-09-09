import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  image: z.string().min(100), // data URL (base64)
  note: z.string().max(500).optional(),
});

const SYSTEM = `Tu es un agronome expert en phytopathologie, spécialisé dans les cultures d'Afrique de l'Ouest et du Sahel.
On te fournit la photo d'une plante. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{
  "reliable": true|false,
  "reason": "si reliable=false, explique en français pourquoi l'image ne permet pas une analyse fiable (flou, trop sombre, pas de plante visible, cadrage trop large...)",
  "plant": "nom probable de la plante ou 'Indéterminé'",
  "confidence": "faible|moyenne|élevée",
  "health": "bon|moyen|mauvais",
  "healthSummary": "une phrase claire sur l'état général",
  "diseases": [{"name":"...","signs":"symptômes visibles observés","severity":"faible|modérée|élevée"}],
  "pests": [{"name":"...","signs":"indices visibles"}],
  "deficiencies": [{"name":"ex: carence en azote","signs":"indices visibles"}],
  "recommendations": ["action concrète 1", "action concrète 2"],
  "disclaimer": "courte note rappelant qu'un diagnostic terrain reste conseillé"
}
Règles : n'invente rien. Si un élément n'est pas observable, laisse le tableau vide. Si l'image est inexploitable ou ne montre pas de plante, mets reliable=false et remplis reason. Écris tout en français simple et compréhensible par un agriculteur.`;

export const analyzePlant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Service d'analyse indisponible (configuration manquante).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.note
                  ? `Analyse cette plante. Contexte donné par l'agriculteur : ${data.note}`
                  : "Analyse cette plante.",
              },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Trop de demandes en même temps. Réessayez dans un instant.");
      if (res.status === 402) throw new Error("Crédits d'analyse épuisés. Rechargez les crédits pour continuer.");
      throw new Error(`Analyse impossible pour le moment. (${res.status}) ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    try {
      const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        reliable: false,
        reason: "L'analyse n'a pas pu être interprétée. Réessayez avec une photo plus nette de la plante.",
      };
    }
  });
