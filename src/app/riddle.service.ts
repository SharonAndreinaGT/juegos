import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, lastValueFrom } from 'rxjs';
import { RiddleLevel, RiddleWord, RiddleResult } from './riddle.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RiddleService {
  private directusUrl = 'http://localhost:8055/items/riddle';
  private directusResultsUrl = 'http://localhost:8055/items/riddle_results'; //URL para los resultados
  private getGrade(): string {
    try {
      const gradeFilter = localStorage.getItem('gradeFilter');
      if (!gradeFilter) return '';
      
      const parsed = JSON.parse(gradeFilter);
      return parsed?.data?.[0]?.id || '';
    } catch (error) {
      console.warn('[RiddleService] Error al obtener grade:', error);
      return '';
    }
  }

  private directusFilesUrl = 'http://localhost:8055/files';

  private levelsSubject = new BehaviorSubject<RiddleLevel[]>([]);
  levels$: Observable<RiddleLevel[]> = this.levelsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadLevelsFromDirectus();
  }

  isAdmin() {
    return this.authService.isAdmin();
  }

  private loadLevelsFromDirectus(): void {
    const grade = this.getGrade();
    const isAdmin = this.isAdmin();
    const gradeFilter = isAdmin ? '' : `&filter[grade][_eq]=${grade}`;
    const url = `${this.directusUrl}?fields=*,id${gradeFilter}`;
    this.http.get<any>(url).pipe(
      map(response => response.data as RiddleLevel[]),
      tap(levels => {
        if (levels && levels.length > 0) {
          console.log('[RiddleService] Configuración cargada desde Directus:', levels);
          this.levelsSubject.next(levels);
        } else {
          console.log('[RiddleService] No se encontraron niveles en Directus. Creando configuración por defecto...');
          const defaultLevels: RiddleLevel[] = [
            { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [{ word: 'ANGULAR' }, { word: 'PROGRAMACION' }, { word: 'DESARROLLO' }], isActive: true, grade: grade, time_limit: 300, level: '183770b3-0e66-4932-8769-b0c1b4738d79' },
            { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [{ word: 'COMPONENTE' }, { word: 'SERVICIOS' }, { word: 'ROUTING' }], isActive: false, grade: grade, time_limit: 240, level: '98fd8047-6897-4a86-85e2-f430e48956bd' },
            { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [{ word: 'TYPESCRIPT' }, { word: 'JAVASCRIPT' }, { word: 'ALGORITMO' }], isActive: false, grade: grade, time_limit: 180, level: '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1' }
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
          { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [{ word: 'ANGULAR' }, { word: 'PROGRAMACION' }, { word: 'DESARROLLO' }], isActive: true, grade: grade, time_limit: 300 },
          { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [{ word: 'COMPONENTE' }, { word: 'SERVICIOS' }, { word: 'ROUTING' }], isActive: false, grade: grade, time_limit: 240 },
          { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [{ word: 'TYPESCRIPT' }, { word: 'JAVASCRIPT' }, { word: 'ALGORITMO' }], isActive: false, grade: grade, time_limit: 180 }
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
      const isAdmin = this.isAdmin();
      if (!isAdmin) {
        newLevelData.grade = this.getGrade();
      }
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

  getCurrentLevels(): RiddleLevel[] {
    return this.levelsSubject.value;
  }

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

  getStudentRiddleResults(studentId: string): Observable<RiddleResult[]> {
    console.log(`[RiddleService] Obteniendo resultados de Riddle para estudiante ID: ${studentId}`);
    return this.http.get<any>(
      `${this.directusResultsUrl}?filter[student_id][_eq]=${studentId}&sort=-created_at`
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

  getAllRiddleScores(): Observable<number[]> {
    return this.http.get<any>(`${this.directusResultsUrl}?fields=score&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => item.score))
    );
  }

  getAllRiddleTimes(): Observable<number[]> {
    return this.http.get<any>(`${this.directusResultsUrl}?fields=time_taken&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => item.time_taken))
    );
  }

  getAllRiddleScoresWithStudent(): Observable<{ student_id: string, score: number }[]> {
    return this.http.get<any>(`${this.directusResultsUrl}?fields=score,student_id&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => ({ student_id: item.student_id, score: item.score })))
    );
  }

  getAllRiddleScoresWithDate(): Observable<{ score: number, created_at: string }[]> {
    return this.http.get<any>(`${this.directusResultsUrl}?fields=score,created_at&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => ({ score: item.score, created_at: item.created_at })))
    );
  }

  getTotalRiddleResults(): Observable<number> {
    return this.http.get<any>(`${this.directusResultsUrl}?meta=filter_count`).pipe(
      map(response => response.meta?.filter_count ?? (response.data?.length ?? 0))
    );
  }

  /**
   * Método para manejar la subida de la imagen a Directus
   * @param file El archivo de imagen a subir.
   * @returns Un Observable que emite la respuesta de la API de Directus.
   */
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.directusFilesUrl, formData);
  }
}