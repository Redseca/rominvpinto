
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Genera textos de marketing premium basados en un concepto de texto.
 * NO recibe archivos multimedia por razones de privacidad y seguridad.
 */
export const generatePremiumCopy = async (concept: string) => {
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
};
