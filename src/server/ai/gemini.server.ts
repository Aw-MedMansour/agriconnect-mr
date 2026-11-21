// Native Google Gemini API client (Google AI Studio key, generateContent REST endpoint).
export class GeminiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function geminiConfigured(): boolean {
  return Boolean(process.env["GEMINI_API_KEY"]);
}

export async function geminiGenerateJson(opts: {
  system: string;
  text: string;
  imageDataUrl?: string;
}): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new GeminiError(500, "GEMINI_API_KEY manquante");
  const model = process.env["GEMINI_MODEL"] || "gemini-2.5-flash";
  const parts: Array<Record<string, unknown>> = [{ text: opts.text }];
  if (opts.imageDataUrl) {
    const m = /^data:([^;]+);base64,(.+)$/s.exec(opts.imageDataUrl);
    if (!m) throw new GeminiError(400, "Image invalide");
    parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new GeminiError(res.status, body.slice(0, 300));
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}
