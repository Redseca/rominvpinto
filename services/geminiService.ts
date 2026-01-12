
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Genera textos de marketing premium utilizando el modelo Gemini.
 * Sigue estrictamente el formato de inicialización: new GoogleGenAI({ apiKey: process.env.API_KEY })
 */
export const generatePremiumCopy = async (concept: string) => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  // Inicialización correcta según directrices
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Genera un título y una descripción teaser (max 12 palabras) para este concepto: "${concept}". Formato JSON con campos "title" y "teaser".`
        }]
      }],
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return { title: concept, teaser: "Contenido exclusivo disponible." };
  }
};

export const isAiConfigured = () => {
  return !!process.env.API_KEY;
};
