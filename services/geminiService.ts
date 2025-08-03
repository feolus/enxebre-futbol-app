import { GoogleGenAI, Type } from "@google/genai";
import type { TrainingSession, Exercise } from '../types';

// IMPORTANT: Set your API key in a .env file
// Create a file named .env in the root of your project
// and add the following line:
// VITE_API_KEY=YOUR_API_KEY_HERE

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_API_KEY is not set. Please add it to your .env file.");
}

const ai = new GoogleGenAI({ apiKey });

const trainingPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Un título creativo y descriptivo para la sesión de entrenamiento.'
    },
    warmup: {
      type: Type.ARRAY,
      description: 'Una lista de ejercicios de calentamiento.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nombre del ejercicio.' },
          duration: { type: Type.STRING, description: 'Duración del ejercicio (ej. "10 min").' },
          description: { type: Type.STRING, description: 'Breve descripción del ejercicio.' }
        },
        required: ['name', 'duration', 'description'],
      }
    },
    mainExercises: {
      type: Type.ARRAY,
      description: 'Una lista de ejercicios principales para la parte central de la sesión.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nombre del ejercicio.' },
          sets: { type: Type.INTEGER, description: 'Número de series.' },
          reps: { type: Type.STRING, description: 'Número de repeticiones por serie (ej. "10-12" o "30 seg").' },
          description: { type: Type.STRING, description: 'Breve descripción del ejercicio y su enfoque.' }
        },
        required: ['name', 'sets', 'reps', 'description'],
      }
    },
    cooldown: {
      type: Type.ARRAY,
      description: 'Una lista de ejercicios de enfriamiento.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nombre del ejercicio.' },
          duration: { type: Type.STRING, description: 'Duración del ejercicio (ej. "5 min").' },
          description: { type: Type.STRING, description: 'Breve descripción del ejercicio.' }
        },
        required: ['name', 'duration', 'description'],
      }
    }
  },
  required: ['title', 'warmup', 'mainExercises', 'cooldown']
};

export const generateTrainingPlan = async (prompt: string): Promise<Partial<TrainingSession> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Basado en la siguiente petición, crea un plan de entrenamiento detallado. Adhiérete estrictamente al esquema JSON proporcionado. Petición: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: trainingPlanSchema,
      },
    });

    const text = response.text?.trim();
    if (!text) {
        console.error("Gemini API returned an empty response.");
        return null;
    }

    const generatedPlan = JSON.parse(text);

    const addIds = (exercises: Omit<Exercise, 'id'>[], prefix: string): Exercise[] => 
      exercises.map((ex, i) => ({ ...ex, id: `${prefix}-${Date.now()}-${i}` }));

    return {
        ...generatedPlan,
        warmup: addIds(generatedPlan.warmup, 'w'),
        mainExercises: addIds(generatedPlan.mainExercises, 'm'),
        cooldown: addIds(generatedPlan.cooldown, 'c')
    };

  } catch (error) {
    console.error("Error generating training plan with Gemini:", error);
    return null;
  }
};