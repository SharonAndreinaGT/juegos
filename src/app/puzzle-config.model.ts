export interface PuzzleConfig {
  id?: string;             // ID único del registro en Directus (opcional, Directus lo asigna)
  level_name?: string;     // Nombre del nivel (ej. "Nivel 1")
  imageUrl?: string;       // ID del archivo de la imagen en Directus
  rows?: number;           // Número de filas del rompecabezas
  cols?: number;           // Número de columnas del rompecabezas
  time_limit?: number;     // Tiempo límite en segundos (0 para ilimitado)
}