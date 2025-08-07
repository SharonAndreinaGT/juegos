export interface PuzzleConfig {
  id?: string;             // ID único del registro en Directus (opcional, Directus lo asigna)
  level_name?: string;     // Nombre del nivel (ej. "Nivel 1")
  level?: any;     // Nombre del nivel (ej. "Nivel 1")
  imageUrl?: string;       // ID del archivo de la imagen en Directus
  rows?: number;           // Número de filas del rompecabezas
  cols?: number;           // Número de columnas del rompecabezas
  time_limit?: number;     // Tiempo límite en segundos (0 para ilimitado)
  isActive?: boolean; //para saber que nivl está activo
  grade?: string; //para saber que grado tiene el nivel
}

export interface PuzzleResult {
  id?: string;
  student_id: string; // Este será el ID (PK) de Directus, aunque sea Integer en DB, Directus API lo envía como string.
  level_name: string;
  level?: any; // ✅ ID del nivel que se está jugando
  score: number;
  stars: number;
  moves: number;
  time: number;
  is_complete: boolean;
  date_created?: string;
}

// Interfaz para la estructura del usuario de Directus 
export interface User {
  id: string; // El Primary Key de Directus, angular lo maneja como string
  name: string; // identificador
  lastname?: string;
  score?: number;
  grade?: string;
  section?: string;
  status?: string;
}