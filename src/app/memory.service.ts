import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs'; 
import { map, switchMap, catchError } from 'rxjs/operators'; 
import { MemoryConfig, MemoryResult } from './memory-config-model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  private apiUrl = 'http://localhost:8055/items/memory';    
  private directusFilesUrl = 'http://localhost:8055/files';
  private memoryResultsApiUrl = 'http://localhost:8055/items/memory_results';
  private getGrade(): string {
    try {
      const gradeFilter = localStorage.getItem('gradeFilter');
      if (!gradeFilter) return '';
      
      const parsed = JSON.parse(gradeFilter);
      return parsed?.data?.[0]?.id || '';
    } catch (error) {
      console.warn('[MemoryService] Error al obtener grade:', error);
      return '';
    }
  }

  constructor(private http: HttpClient, private authService: AuthService) { }

  isAdmin() {
    return this.authService.isAdmin();
  }

  // Obtiene la configuración del juego de memoria por el nombre del nivel
  getMemoryConfigByLevel(level: string): Observable<any> {
    const grade = this.getGrade();
    const isAdmin = this.isAdmin();
    const gradeFilter = isAdmin ? '' : `&filter[grade][_eq]=${grade}`;
    return this.http.get<any>(`${this.apiUrl}?filter[level][_eq]=${level}${gradeFilter}&fields=*,id`);
  }

  // Obtiene la configuración activa del juego de memoria (isActive: true)
  getActiveMemoryConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?filter[isActive][_eq]=true&fields=*,id`);
  }

  // Obtiene todas las configuraciones del juego de memoria
  getAllMemoryConfigs(): Observable<any> {
    const isAdmin = this.isAdmin();
    const grade = this.getGrade();
    const gradeFilter = isAdmin ? '' : `?filter[grade][_eq]=${grade}&fields=*,id`;
    const url = isAdmin ? `${this.apiUrl}?fields=*,id` : `${this.apiUrl}${gradeFilter}`;
    
    return this.http.get<any>(url);
  }

  //metodo para guardar la configuracion del juego 
  saveMemoryConfig(config: MemoryConfig): Observable<MemoryConfig> {
    // Verificar que el campo level esté presente
    console.log('[MemoryService] Configuración a guardar:', {
      id: config.id,
      level_name: config.level_name,
      level: config.level,
      grade: config.grade,
      isActive: config.isActive,
      card_count: config.card_count,
      time_limit: config.time_limit,
      intent: config.intent,
      images: config.images
    });

    if (config.id) {
      // Actualizar configuración existente
      console.log(`[MemoryService] Actualizando configuración de memoria con ID: ${config.id}`, config);
      const isAdmin = this.isAdmin();
      if (!isAdmin) {
        config.grade = this.getGrade();
      }
      return this.http.patch<MemoryConfig>(`${this.apiUrl}/${config.id}`, config).pipe(
        map(response => response)
      );
    } else {
      // Crear nueva configuración
      console.log('[MemoryService] Creando nueva configuración de memoria:', config);
      const isAdmin = this.isAdmin();
      if (!isAdmin) {
        config.grade = this.getGrade();
      }
      return this.http.post<MemoryConfig>(this.apiUrl, config).pipe(
        map(response => response)
      );
    }
  }

  //metodo para guardar las imagenes

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('storage', 'local');
    formData.append('file', file, file.name);
    return this.http.post<any>(this.directusFilesUrl, formData);
  }

  //metodo ara guardar y enviar el resultado
  saveMemoryResult(result: MemoryResult): Observable<MemoryResult> {
    console.log('[MemoryService] Guardando resultado del juego de memoria:', result);
    return this.http.post<MemoryResult>(this.memoryResultsApiUrl, result).pipe(
      map(response => response)
    );
  }

  /**
   * Obtiene el total de partidas jugadas (conteo de registros en memory_results)
   */
  getTotalMemoryResults(): Observable<number> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?meta=filter_count`).pipe(
      map(response => response.meta?.filter_count ?? (response.data?.length ?? 0))
    );
  }

  /**
   * Obtiene todos los scores de memory_results
   */
  getAllMemoryScores(): Observable<number[]> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?fields=score&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => item.score))
    );
  }

  /**
   * Obtiene todos los tiempos (elapsedTime) de memory_results
   */
  getAllMemoryTimes(): Observable<number[]> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?fields=elapsedTime&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => item.elapsedTime))
    );
  }

  /**
   * Obtiene todos los scores y student_id de memory_results
   */
  getAllMemoryScoresWithStudent(): Observable<{ student_id: any, score: number }[]> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?fields=score,student_id&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => ({ student_id: item.student_id, score: item.score })))
    );
  }

  /**
   * Obtiene todos los scores y created_at de memory_results
   */
  getAllMemoryScoresWithDate(): Observable<{ score: number, created_at: string }[]> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?fields=score,created_at&limit=-1`).pipe(
      map(response => (response.data || []).map((item: any) => ({ score: item.score, created_at: item.created_at })))
    );
  }


/**
   * Obtiene los resultados de memoria para un estudiante específico,
   * y luego obtiene el level_name asociado a cada level_id.
   * Se ordena por fecha de creación descendente para obtener el más reciente.
   */
  getStudentMemoryResults(studentId: string): Observable<MemoryResult[]> {
    console.log(`[MemoryService] Obteniendo resultados de memoria para estudiante ID: ${studentId}`);
    return this.http.get<any>(
      `${this.memoryResultsApiUrl}?filter[student_id][_eq]=${studentId}&sort=-created_at`
    ).pipe(
      // Primer map para obtener los datos crudos de memory_results
      map(response => {
        console.log('[MemoryService] Raw Directus data for student memory results:', response.data);
        return response.data || [];
      }),
      // switchMap para hacer llamadas adicionales por cada resultado
      switchMap((results: any[]) => {
        if (results.length === 0) {
          return of([]); // Si no hay resultados, devuelve un array vacío
        }

        // Crear un array de Observables para obtener el nombre del nivel para cada resultado
        const resultsWithLevelNames$ = results.map(item => {
          if (item.level_id) {
            // Si hay level_id, busca la configuración del nivel para obtener el level_name
            return this.http.get<any>(`${this.apiUrl}/${item.level_id}?fields=level_name`).pipe(
              map(levelConfigResponse => {
                const levelName = levelConfigResponse.data?.level_name || 'N/A';
                return {
                  id: item.id,
                  level_id: item.level_id,
                  level_name: levelName, // Añadimos el level_name aquí
                  score: item.score,
                  stars: item.stars,
                  elapsedTime: item.elapsedTime,
                  matchedPairs: item.matchedPairs,
                  totalPairs: item.totalPairs,
                  intentRemaining: item.intentRemaining,
                  completed: item.completed,
                  student_id: item.student_id
                } as MemoryResult; // Casteamos a MemoryResult
              }),
              catchError(err => {
                console.error(`Error al obtener el nivel de memoria para ID ${item.level_id}:`, err);
                return of({
                  id: item.id,
                  level_id: item.level_id,
                  level_name: 'Error al cargar Nivel', // Manejo de error para el nombre del nivel
                  score: item.score,
                  stars: item.stars,
                  elapsedTime: item.elapsedTime,
                  matchedPairs: item.matchedPairs,
                  totalPairs: item.totalPairs,
                  intentRemaining: item.intentRemaining,
                  completed: item.completed,
                  student_id: item.student_id
                } as MemoryResult);
              })
            );
          } else {
            // Si no hay level_id, devuelve el resultado con level_name como 'N/A'
            return of({
              id: item.id,
              level_id: item.level_id,
              level_name: 'N/A',
              score: item.score,
              stars: item.stars,
              elapsedTime: item.elapsedTime,
              matchedPairs: item.matchedPairs,
              totalPairs: item.totalPairs,
              intentRemaining: item.intentRemaining,
              completed: item.completed,
              student_id: item.student_id
            } as MemoryResult);
          }
        });
        // Usa forkJoin para esperar a que todas las llamadas de nivel se completen
        return forkJoin(resultsWithLevelNames$);
      }),
      catchError(error => {
        console.error('[MemoryService] Error general al obtener resultados de memoria:', error);
        return of([]); // Devuelve un array vacío en caso de error principal
      })
    );
  }

  // Si también usas getAllMemoryResults, aplica una lógica similar:
  getAllMemoryResults(): Observable<MemoryResult[]> {
    return this.http.get<any>(`${this.memoryResultsApiUrl}?sort=-date_created&limit=-1`).pipe(
      map(response => response.data || []),
      switchMap((results: any[]) => {
        if (results.length === 0) {
          return of([]);
        }
        const resultsWithLevelNames$ = results.map(item => {
          if (item.level_id) {
            return this.http.get<any>(`${this.apiUrl}/${item.level_id}?fields=level_name`).pipe(
              map(levelConfigResponse => {
                const levelName = levelConfigResponse.data?.level_name || 'N/A';
                return {
                  id: item.id,
                  level_id: item.level_id,
                  level_name: levelName, // Añadimos el level_name aquí
                  score: item.score,
                  stars: item.stars,
                  elapsedTime: item.elapsedTime,
                  matchedPairs: item.matchedPairs,
                  totalPairs: item.totalPairs,
                  intentRemaining: item.intentRemaining,
                  completed: item.completed,
                  student_id: item.student_id
                } as MemoryResult;
              }),
              catchError(err => {
                console.error(`Error al obtener el nivel de memoria para ID ${item.level_id}:`, err);
                return of({ // Devuelve un objeto MemoryResult con el error
                  id: item.id, level_id: item.level_id, level_name: 'Error al cargar Nivel', score: item.score,
                  stars: item.stars, elapsedTime: item.elapsedTime, matchedPairs: item.matchedPairs,
                  totalPairs: item.totalPairs, intentRemaining: item.intentRemaining, completed: item.completed,
                  student_id: item.student_id
                } as MemoryResult);
              })
            );
          } else {
            return of({
              id: item.id, level_id: item.level_id, level_name: 'N/A', score: item.score,
              stars: item.stars, elapsedTime: item.elapsedTime, matchedPairs: item.matchedPairs,
              totalPairs: item.totalPairs, intentRemaining: item.intentRemaining, completed: item.completed,
              student_id: item.student_id
            } as MemoryResult);
          }
        });
        return forkJoin(resultsWithLevelNames$);
      }),
      catchError(error => {
        console.error('[MemoryService] Error general al obtener todos los resultados de memoria:', error);
        return of([]);
      })
    );
  }
}