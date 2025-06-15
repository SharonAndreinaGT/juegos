export interface MemoryGameLevel {
  id?: string;
  level_name: string;
  card_count: number;
  time_limit: number;
  intent: number;
  score: number;
  image: any[]; // Un array de objetos de imagen, donde cada objeto tiene al menos un 'id'
}