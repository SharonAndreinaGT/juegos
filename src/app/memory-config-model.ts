export class MemoryConfig {
  id?: string;
  level_name?: string;
  card_count?: number;
  time_limit?: number;
  intent?: number | undefined;
  isActive?: boolean;
  images?: string[];
}

export interface MemoryResult {
  id?: string;
  level_name: string;
  score: number;
  flips: number;       // Puede ser el número total de pares de volteos, o intentos restantes si se agotan
  stars: number;
  time: number;
  is_complete: boolean;
  student_id: string;
}