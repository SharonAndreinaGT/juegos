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
  level_id?: string;
  score: number;
  stars: number;
  elapsedTime: number;
  matchedPairs: number;
  totalPairs: number;
  intentRemaining: number;
  completed: boolean;
  student_id: string | null;
}