import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { GameResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Eres el "Game Master" de una aventura conversacional de texto llamada "Profesor.exe".
El jugador asume el rol de un Profesor de Ciencias de la Computación (CS) en una universidad tecnológica.

**Objetivo del Jugador:**
1. Mantener alta la MOTIVACIÓN de los alumnos (0-100).
2. Mantener alta su AUTORIDAD en clase (0-100).
3. Gestionar su propia ENERGÍA (0-100).

**Reglas:**
- Empieza la partida introduciendo una situación típica (ej. primer día de clase, alumnos distraídos con móviles, fallo en el proyector, pregunta difícil sobre Punteros en C).
- El tono debe ser "Geek/Académico", con referencias a programación (bugs, compilación, stack overflow, café).
- Sé conciso en la narrativa (máximo 3 párrafos).
- Ofrece siempre 3 opciones de acción variadas (una sensata, una arriesgada/divertida, una estricta).

**Formato de Respuesta:**
SIEMPRE debes responder con un JSON válido que siga este esquema. NO incluyas bloques de código markdown (\`\`\`json), solo el JSON crudo.

Esquema JSON:
{
  "narrative": "string (descripción de lo que pasa, usa Markdown simple)",
  "stats": {
    "motivation": number (entero 0-100),
    "authority": number (entero 0-100),
    "energy": number (entero 0-100)
  },
  "choices": ["string", "string", "string"],
  "gameOver": boolean (true si autoridad o energía llegan a 0),
  "victory": boolean (true si logras sobrevivir el semestre o un hito importante con motivación alta),
  "reason": "string (opcional, razón del fin del juego)"
}

Valores iniciales recomendados: Motivation: 50, Authority: 80, Energy: 100.
Ajusta los stats dinámicamente según las acciones del jugador.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING },
    stats: {
      type: Type.OBJECT,
      properties: {
        motivation: { type: Type.INTEGER },
        authority: { type: Type.INTEGER },
        energy: { type: Type.INTEGER },
      },
      required: ["motivation", "authority", "energy"]
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    gameOver: { type: Type.BOOLEAN },
    victory: { type: Type.BOOLEAN },
    reason: { type: Type.STRING }
  },
  required: ["narrative", "stats", "choices", "gameOver", "victory"]
};

export class GeminiGameService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // Uses process.env.API_KEY strictly as per rules
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async startGame(): Promise<GameResponse> {
    this.chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    try {
      const response = await this.chat.sendMessage({
        message: "Inicializa el juego. Primer día de clase de 'Introducción a Algoritmos'."
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      return JSON.parse(text) as GameResponse;
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }

  public async sendAction(action: string): Promise<GameResponse> {
    if (!this.chat) {
      throw new Error("Game not started");
    }

    try {
      const response = await this.chat.sendMessage({ message: action });
      const text = response.text;
      if (!text) throw new Error("No response from AI");

      return JSON.parse(text) as GameResponse;
    } catch (error) {
      console.error("Error sending action:", error);
      throw error;
    }
  }
}

// Singleton-ish usage usually preferred in React but class instance is fine
export const gameService = new GeminiGameService();
