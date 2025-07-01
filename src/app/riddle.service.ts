import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RiddleLevel, RiddleWord } from './riddle.model';

@Injectable({
  providedIn: 'root'
})
export class RiddleService {
  private levelsSubject = new BehaviorSubject<RiddleLevel[]>([
    // Por defecto, solo el Nivel 1 está activo.
    { level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [{ word: 'ANGULAR' }, { word: 'PROGRAMACION' }, { word: 'DESARROLLO' }], isActive: true },
    { level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [{ word: 'COMPONENTE' }, { word: 'SERVICIOS' }, { word: 'ROUTING' }], isActive: false },
    { level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [{ word: 'TYPESCRIPT' }, { word: 'JAVASCRIPT' }, { word: 'ALGORITMO' }], isActive: false }
  ]);

  levels$: Observable<RiddleLevel[]> = this.levelsSubject.asObservable();

  constructor() { }

  updateLevels(updatedLevels: RiddleLevel[]): void {
    console.log('Niveles actualizados en el servicio:', updatedLevels);
    this.levelsSubject.next(updatedLevels);
  }
  
  getLevelConfig(levelNumber: number): RiddleLevel | undefined {
    return this.levelsSubject.value.find(level => level.level_number === levelNumber);
  }
}