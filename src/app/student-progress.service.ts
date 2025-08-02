import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface StudentProgress {
  studentId: string;
  game: 'puzzle' | 'memory' | 'riddle';
  currentLevel: string;
  completedLevels: string[];
  unlockedLevels: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentProgressService {
  private progressSubject = new BehaviorSubject<StudentProgress | null>(null);
  progress$ = this.progressSubject.asObservable();

  // Definir la secuencia de niveles para cada juego
  private readonly PUZZLE_LEVELS = [
    '183770b3-0e66-4932-8769-b0c1b4738d79', // Nivel 1
    '98fd8047-6897-4a86-85e2-f430e48956bd', // Nivel 2
    '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1'  // Nivel 3
  ];

  private readonly MEMORY_LEVELS = [
    '183770b3-0e66-4932-8769-b0c1b4738d79', // Nivel 1
    '98fd8047-6897-4a86-85e2-f430e48956bd', // Nivel 2
    '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1'  // Nivel 3
  ];

  private readonly RIDDLE_LEVELS = [
    '183770b3-0e66-4932-8769-b0c1b4738d79', // Nivel 1
    '98fd8047-6897-4a86-85e2-f430e48956bd', // Nivel 2
    '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1'  // Nivel 3
  ];

  constructor() {}

  /**
   * Inicializa el progreso del estudiante para un juego específico
   */
  initializeProgress(studentId: string, game: 'puzzle' | 'memory' | 'riddle'): void {
    const progress: StudentProgress = {
      studentId,
      game,
      currentLevel: this.getFirstLevel(game),
      completedLevels: [],
      unlockedLevels: [this.getFirstLevel(game)]
    };

    this.progressSubject.next(progress);
    this.saveProgressToLocalStorage(progress);
  }

  /**
   * Obtiene el progreso actual del estudiante
   */
  getCurrentProgress(): StudentProgress | null {
    return this.progressSubject.value;
  }

  /**
   * Marca un nivel como completado y desbloquea el siguiente
   */
  completeLevel(levelId: string): string | null {
    const currentProgress = this.progressSubject.value;
    if (!currentProgress) return null;

    // Agregar el nivel a completados si no está ya
    if (!currentProgress.completedLevels.includes(levelId)) {
      currentProgress.completedLevels.push(levelId);
    }

    // Obtener el siguiente nivel
    const nextLevel = this.getNextLevel(currentProgress.game, levelId);
    
    if (nextLevel && !currentProgress.unlockedLevels.includes(nextLevel)) {
      currentProgress.unlockedLevels.push(nextLevel);
    }

    // Actualizar el nivel actual al siguiente
    if (nextLevel) {
      currentProgress.currentLevel = nextLevel;
    }

    this.progressSubject.next(currentProgress);
    this.saveProgressToLocalStorage(currentProgress);

    return nextLevel;
  }

  /**
   * Obtiene el siguiente nivel disponible
   */
  getNextLevel(game: 'puzzle' | 'memory' | 'riddle', currentLevelId: string): string | null {
    const levels = this.getLevelsForGame(game);
    const currentIndex = levels.indexOf(currentLevelId);
    
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return null; // No hay siguiente nivel
    }

    return levels[currentIndex + 1];
  }

  /**
   * Verifica si un nivel está desbloqueado
   */
  isLevelUnlocked(levelId: string): boolean {
    const currentProgress = this.progressSubject.value;
    return currentProgress?.unlockedLevels.includes(levelId) || false;
  }

  /**
   * Obtiene el primer nivel para un juego
   */
  private getFirstLevel(game: 'puzzle' | 'memory' | 'riddle'): string {
    const levels = this.getLevelsForGame(game);
    return levels[0];
  }

  /**
   * Obtiene los niveles para un juego específico
   */
  private getLevelsForGame(game: 'puzzle' | 'memory' | 'riddle'): string[] {
    switch (game) {
      case 'puzzle':
        return this.PUZZLE_LEVELS;
      case 'memory':
        return this.MEMORY_LEVELS;
      case 'riddle':
        return this.RIDDLE_LEVELS;
      default:
        return [];
    }
  }

  /**
   * Guarda el progreso en localStorage
   */
  private saveProgressToLocalStorage(progress: StudentProgress): void {
    const key = `student_progress_${progress.studentId}_${progress.game}`;
    localStorage.setItem(key, JSON.stringify(progress));
  }

  /**
   * Carga el progreso desde localStorage
   */
  loadProgressFromLocalStorage(studentId: string, game: 'puzzle' | 'memory' | 'riddle'): StudentProgress | null {
    const key = `student_progress_${studentId}_${game}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const progress = JSON.parse(stored) as StudentProgress;
        this.progressSubject.next(progress);
        return progress;
      } catch (error) {
        console.error('Error al cargar progreso desde localStorage:', error);
      }
    }

    return null;
  }

  /**
   * Resetea el progreso del estudiante para un juego
   */
  resetProgress(studentId: string, game: 'puzzle' | 'memory' | 'riddle'): void {
    this.initializeProgress(studentId, game);
  }
} 