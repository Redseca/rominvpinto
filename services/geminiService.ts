
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Genera textos de marketing premium basados en un concepto de texto.
 * Valida la existencia de la API_KEY antes de proceder.
 */
export const generatePremiumCopy = async (concept: string) => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: `Eres un curador de contenido premium y exclusivo. Basado en el siguiente concepto o tema: "${concept}", proporciona un título atractivo y una breve descripción teaser (máximo 12 palabras) que sea sugerente y elegante para incitar a los usuarios a pagar por el contenido. 
            REGLAS:
            1. ESCRIBE TODO EN ESPAÑOL.
            2. No menciones que está bloqueado.
            3. Sé sofisticado y profesional.
            4. Devuelve el resultado exclusivamente en formato JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            teaser: { type: Type.STRING }
          },
          required: ["title", "teaser"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw new Error("AI_CALL_FAILED");
  }
};

/**
 * Verifica si la clave está presente en el entorno.
 */
export const isAiConfigured = () => {
  return !!process.env.API_KEY && process.env.API_KEY !== "undefined";
};
