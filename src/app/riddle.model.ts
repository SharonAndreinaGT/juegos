// Define la estructura de una palabra individual en el juego.
export interface RiddleWord {
  word: string; // La palabra en sí.
  hint?: string; // Pista opcional, usada principalmente para el Nivel 3.
}

// Define la estructura de la configuración para un nivel específico del juego.
export interface RiddleLevel {
  id: string | null;
  level_number: number; // Número de nivel (ej. 1, 2, 3).
  level_name: string; // Nombre del nivel (ej. "Fácil", "Medio", "Difícil").
  max_intents: number; // Número máximo de intentos permitidos para este nivel.
  words_level: number; // Cantidad de palabras que se mostrarán por partida en este nivel.
  words: RiddleWord[]; // Array de palabras disponibles para este nivel, incluyendo sus pistas.
  isActive: boolean;
}

// Define la estructura general de la configuración de todo el juego.
export interface RiddleGameSettings {
  levels: RiddleLevel[]; // Un array con la configuración de todos los niveles.
}