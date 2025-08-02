export class MemoryConfig {
  id?: string;
  level_name?: string;
  level?: string;
  card_count?: number;
  time_limit?: number;
  intent?: number | undefined;
  isActive?: boolean;
  images?: string[];
  grade?: string;
}

export interface MemoryResult {
  id?: string;
  level_id?: string;
  level_name?: string | null;
  score: number;
  stars: number;
  elapsedTime: number;
  matchedPairs: number;
  totalPairs: number;
  intentRemaining: number;
  completed: boolean;
  student_id: string | null;
}