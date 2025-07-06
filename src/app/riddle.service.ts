// src/app/riddle/riddle.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, lastValueFrom } from 'rxjs';
import { RiddleLevel, RiddleWord, RiddleResult } from './riddle.model'; // Importa RiddleResult
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RiddleService {
  private directusUrl = 'http://localhost:8055/items/riddle';
  private directusResultsUrl = 'http://localhost:8055/items/riddle_results'; //URL para los resultados

  private levelsSubject = new BehaviorSubject<RiddleLevel[]>([]);
  levels$: Observable<RiddleLevel[]> = this.levelsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadLevelsFromDirectus();
  }

  private loadLevelsFromDirectus(): void {
    this.http.get<any>(this.directusUrl).pipe(
      map(response => response.data as RiddleLevel[]),
      tap(levels => {
        if (levels && levels.length > 0) {
          console.log('[RiddleService] Configuración cargada desde Directus:', levels);
          this.levelsSubject.next(levels);
        } else {
          console.log('[RiddleService] No se encontraron niveles en Directus. Creando configuración por defecto...');
          const defaultLevels: RiddleLevel[] = [
            { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [{ word: 'ANGULAR' }, { word: 'PROGRAMACION' }, { word: 'DESARROLLO' }], isActive: true },
            { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [{ word: 'COMPONENTE' }, { word: 'SERVICIOS' }, { word: 'ROUTING' }], isActive: false },
            { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [{ word: 'TYPESCRIPT' }, { word: 'JAVASCRIPT' }, { word: 'ALGORITMO' }], isActive: false }
          ];

          lastValueFrom(
            this.http.post<any>(this.directusUrl, defaultLevels).pipe(
              map(response => response.data as RiddleLevel[]),
              tap(createdLevels => {
                console.log('[RiddleService] Configuración por defecto guardada en Directus y IDs asignados:', createdLevels);
                this.levelsSubject.next(createdLevels);
              }),
              catchError(error => {
                console.error('[RiddleService] Error al guardar configuración por defecto en Directus:', error);
                this.levelsSubject.next(defaultLevels);
                return of([]);
              })
            )
          ).catch(err => console.error('Unhandled promise rejection during default level creation:', err));
        }
      }),
      catchError(error => {
        console.error('[RiddleService] Error al cargar la configuración desde Directus (GET inicial):', error);
        const defaultLevelsOnError: RiddleLevel[] = [
          { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [{ word: 'ANGULAR' }, { word: 'PROGRAMACION' }, { word: 'DESARROLLO' }], isActive: true },
          { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [{ word: 'COMPONENTE' }, { word: 'SERVICIOS' }, { word: 'ROUTING' }], isActive: false },
          { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [{ word: 'TYPESCRIPT' }, { word: 'JAVASCRIPT' }, { word: 'ALGORITMO' }], isActive: false }
        ];
        this.levelsSubject.next(defaultLevelsOnError);
        return of([]);
      })
    ).subscribe();
  }

  saveRiddleLevel(level: RiddleLevel): Observable<RiddleLevel> {
    let request: Observable<any>;
    let operation: 'update' | 'create';

    if (level.id) {
      operation = 'update';
      request = this.http.patch<any>(`${this.directusUrl}/${level.id}`, level);
    } else {
      operation = 'create';
      const { id, ...newLevelData } = level;
      request = this.http.post<any>(this.directusUrl, newLevelData);
    }

    return request.pipe(
      map(response => {
        if (response && response.data) {
          return response.data as RiddleLevel;
        } else {
          throw new Error('No data received from Directus on save operation.');
        }
      }),
      tap(savedLevel => {
        console.log(`[RiddleService] Nivel ${savedLevel.level_number} ${operation}d en Directus:`, savedLevel);
        const currentLevels = this.levelsSubject.value;
        const updatedLevels = currentLevels.map(lvl => lvl.id === savedLevel.id ? savedLevel : lvl);
        if (operation === 'create' && !currentLevels.some(lvl => lvl.id === savedLevel.id)) {
            updatedLevels.push(savedLevel);
        }
        this.levelsSubject.next(updatedLevels);
      }),
      catchError(error => {
        console.error(`[RiddleService] Error al ${operation} nivel ${level.level_number} (ID: ${level.id || 'nuevo'}) en Directus:`, error);
        return of(level);
      })
    );
  }

  updateLevels(updatedLevels: RiddleLevel[]): void {
      console.log('[RiddleService] Actualizando BehaviorSubject con nuevos niveles:', updatedLevels);
      this.levelsSubject.next(updatedLevels);
  }

  getLevelConfig(levelNumber: number): RiddleLevel | undefined {
    return this.levelsSubject.value.find(level => level.level_number === levelNumber);
  }

  // Nuevo método para guardar los resultados de la partida de Riddle
  saveRiddleResult(result: RiddleResult): Observable<RiddleResult> {
    console.log('[RiddleService] Enviando resultado de Riddle a Directus:', result);
    return this.http.post<any>(this.directusResultsUrl, result).pipe(
      map(response => {
        if (response && response.data) {
          console.log('[RiddleService] Resultado de Riddle guardado exitosamente:', response.data);
          return response.data as RiddleResult;
        } else {
          throw new Error('No data received from Directus on saving riddle result.');
        }
      }),
      catchError(error => {
        console.error('[RiddleService] Error al guardar el resultado de Riddle:', error);
        return of(result); 
      })
    );
  }

  /**
   * Obtiene todos los resultados de "Adivina la Palabra Oculta" para un estudiante específico.
   * Ordena los resultados por fecha de creación descendente para obtener el más reciente primero.
   * @param studentId El ID del estudiante.
   * @returns Un Observable que emite un array de RiddleResult.
   */
  getStudentRiddleResults(studentId: string): Observable<RiddleResult[]> {
    console.log(`[RiddleService] Obteniendo resultados de Riddle para estudiante ID: ${studentId}`);
    return this.http.get<any>(
      `${this.directusResultsUrl}?filter[student_id][_eq]=${studentId}`
    ).pipe(
      map(response => {
        console.log('[RiddleService] Raw Directus data for student riddle results:', response.data);
        return (response.data || []).map((item: any) => ({
          id: item.id,
          level_name: item.level_name,
          score: item.score,
          attempts_made: item.attempts_made,
          words_guessed: item.words_guessed,
          time_taken: item.time_taken,
          is_complete: item.is_complete,
          student_id: item.student_id,
          created_at: item.created_at 
        } as RiddleResult));
      }),
      catchError(error => {
        console.error(`[RiddleService] Error al obtener resultados de Riddle para estudiante ${studentId}:`, error);
        return of([]); 
      })
    );
  }

  /**
   * Obtiene todos los resultados de "Adivina la Palabra Oculta" de todos los estudiantes.
   * Útil para la tabla general de progreso.
   * Ordena por fecha de creación descendente.
   */
  getAllRiddleResults(): Observable<RiddleResult[]> {
    return this.http.get<any>(`${this.directusResultsUrl}?sort=-date_created&limit=-1`).pipe(
      map(response => {
        return (response.data || []).map((item: any) => ({
          id: item.id,
          level_name: item.level_name,
          score: item.score,
          attempts_made: item.attempts_made,
          words_guessed: item.words_guessed,
          time_taken: item.time_taken,
          is_complete: item.is_complete,
          student_id: item.student_id,
          created_at: item.created_at
        } as RiddleResult));
      }),
      catchError(error => {
        console.error(`[RiddleService] Error al obtener todos los resultados de Riddle:`, error);
        return of([]); 
      })
    );
  }
}