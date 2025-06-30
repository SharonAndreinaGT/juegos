import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RiddleLevel, RiddleWord } from './riddle.model';

@Injectable({
  providedIn: 'root'
})
export class RiddleService {
  // Initial default configuration for all levels
  private initialLevels: RiddleLevel[] = [
    { level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [] },
    { level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [] },
    { level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [] },
  ];

  // BehaviorSubject to hold the current level configurations
  private levelsSubject = new BehaviorSubject<RiddleLevel[]>(this.initialLevels);
  
  // Public Observable that components can subscribe to
  levels$: Observable<RiddleLevel[]> = this.levelsSubject.asObservable();

  constructor() { }

  /**
   * Retrieves the current configuration of all levels.
   */
  getLevels(): RiddleLevel[] {
    return this.levelsSubject.value;
  }

  /**
   * Updates the configuration of all levels and notifies subscribers.
   * This would typically send data to a backend API (e.g., Directus).
   * @param updatedLevels The array of updated level configurations.
   */
  updateLevels(updatedLevels: RiddleLevel[]): void {
    console.log('RiddleService: Updating levels with:', updatedLevels);
    // In a real application, you would make an HTTP request here.
    // For now, we just update the local subject's value.
    this.levelsSubject.next(updatedLevels);
  }

  /**
   * Retrieves the configuration for a specific level.
   * @param levelNumber The number of the level to retrieve.
   */
  getLevelConfig(levelNumber: number): RiddleLevel | undefined {
    return this.levelsSubject.value.find(level => level.level_number === levelNumber);
  }

  /**
   * Retrieves the word list for a specific level.
   * @param levelNumber The number of the level to get words from.
   */
  getWordsForLevel(levelNumber: number): RiddleWord[] | undefined {
    const level = this.getLevelConfig(levelNumber);
    return level ? level.words : undefined;
  }
}