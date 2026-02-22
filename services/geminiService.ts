import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedOrderData } from "../types";

// Helper to get client safely
const getAiClient = () => {
  // Use the env var exclusively as per guidelines.
  // In Vite, process.env.API_KEY is replaced at build time (via define in vite.config.ts).
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key ontbreekt. Configureer process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Converts a File object to a Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Analyzes an image of a work order to extract details.
 */
export const analyzeWorkOrderImage = async (file: File): Promise<ExtractedOrderData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key ontbreekt. Configureer process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const base64Data = await fileToBase64(file);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || "image/jpeg",
            },
          },
          {
            text: "Analyze this work order. Extract 'Order Number'. Extract 'Opdrachtgever'. Look for a section named 'Project Gegevens' (Project Details) for address and project name. IMPORTANT: Look for a 'Planning' section or checkmarks. Extract the date associated with 'Leverdatum' (Delivery Date) as 'deliveryDate'. Extract the date associated with 'Inmeten' (Measurement) as 'measurementDate'. Return dates in YYYY-MM-DD format. Return JSON."
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderNumber: { type: Type.STRING, description: "The unique identifier." },
            opdrachtgever: { type: Type.STRING, description: "Client name." },
            projectRef: { type: Type.STRING, description: "The content of 'Werk' or 'Project' field." },
            address: { type: Type.STRING, description: "The full address." },
            date: { type: Type.STRING, description: "General date of the document YYYY-MM-DD." },
            deliveryDate: { type: Type.STRING, description: "Date found next to 'Leverdatum' or Delivery YYYY-MM-DD." },
            measurementDate: { type: Type.STRING, description: "Date found next to 'Inmeten' or Measurement YYYY-MM-DD." },
            description: { type: Type.STRING, description: "Brief summary in Dutch." },
          },
          required: ["orderNumber", "opdrachtgever"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Geen tekst ontvangen van AI service.");
    }

    return JSON.parse(jsonText) as ExtractedOrderData;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    // Return a user-friendly error message
    throw new Error(error.message || "Fout bij analyseren afbeelding");
  }
};