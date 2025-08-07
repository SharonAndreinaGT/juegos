// Define la estructura de una palabra individual en el juego.
export interface RiddleWord {
  word: string; // La palabra en sí.
  hint?: string; // Pista opcional, usada principalmente para el Nivel 3.
  hint_image?: string; // URL de la imagen
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
  time_limit?: number;
  grade?: string;
  level?: any;
}

export interface RiddleResult {
  id?: string; // Directus ID, será generado por Directus
  level_name: string; // Nombre del nivel jugado (e.g., 'Fácil', 'Medio', 'Difícil')
  score: number;      // Puntaje obtenido
  attempts_made: number; // Intentos usados
  words_guessed: number; // Cantidad de palabras adivinadas
  time_taken: number; // Tiempo que tomó la partida (en segundos)
  is_complete: boolean; // Si la partida se completó (todas las palabras adivinadas o nivel finalizado)
  student_id: string;   // ID del estudiante que jugó la partida (vinculado a la colección 'users' o 'students' de Directus)
}

export interface User {
  id: string; // El Primary Key de Directus, angular lo maneja como string
  name: string; // identificador
  lastname?: string;
  score?: number;
  grade?: string;
  section?: string;
  status?: string;
}

export interface RiddleStudentDisplay {
  id: string; // Student ID
  name: string;
  lastname: string;
  grade?: string;
  level_name: string | null; 
  score: number;
  time_taken: number; 
  words_guessed: number;
  is_complete: boolean; 
}

// Define la estructura general de la configuración de todo el juego.
export interface RiddleGameSettings {
  levels: RiddleLevel[]; // Un array con la configuración de todos los niveles.
}