export class MemoryConfig {
  id?: string;
  level_name?: string;
  card_count?: number;
  time_limit?: number;
  intent?: number | undefined;
  isActive?: boolean;
  images?: { id: number; url: string }[];
}
