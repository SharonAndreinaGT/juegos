import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemoryConfig, MemoryResult } from './memory-config-model';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  private apiUrl = 'http://localhost:8055/items/memory';    
  private directusFilesUrl = 'http://localhost:8055/files';
  private memoryResultsApiUrl = 'http://localhost:8055/items/memory_results';

  constructor(private http: HttpClient) { }

  // Obtiene la configuración del juego de memoria por el nombre del nivel
  getMemoryConfigByLevel(levelName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?filter[level_name][_eq]=${levelName}&fields=*,id`);
  }

  // Obtiene la configuración activa del juego de memoria (isActive: true)
  getActiveMemoryConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?filter[isActive][_eq]=true&fields=*,id`);
  }

  // Obtiene todas las configuraciones del juego de memoria
  getAllMemoryConfigs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?fields=*,id`);
  }

  //metodo para guardar la configuracion del juego 
  saveMemoryConfig(config: MemoryConfig): Observable<MemoryConfig> {
    if (config.id) {
      // Actualizar configuración existente
      console.log(`[MemoryService] Actualizando configuración de memoria con ID: ${config.id}`, config);
      return this.http.patch<MemoryConfig>(`${this.apiUrl}/${config.id}`, config).pipe(
        map(response => response)
      );
    } else {
      // Crear nueva configuración
      console.log('[MemoryService] Creando nueva configuración de memoria:', config);
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
   * Ordena por fecha de creación descendente para obtener el más reciente.
   * Mapea los campos usando el casing exacto de Directus (camelCase).
   */
  getStudentMemoryResults(studentId: string): Observable<MemoryResult[]> {
    console.log(`[MemoryService] Obteniendo resultados de memoria para estudiante ID: ${studentId}`);
    // Añade el sort a la URL para obtener el más reciente primero
    return this.http.get<any>(`${this.memoryResultsApiUrl}?filter[student_id][_eq]=${studentId}`).pipe( // Added &sort=-date_created
      map(response => {
        console.log('[MemoryService] Raw Directus data for student memory results:', response.data);
        return (response.data || []).map((item: any) => ({
          id: item.id,
          level_id: item.level_id,
          score: item.score,
          stars: item.stars, 
          elapsedTime: item.elapsedTime,    
          matchedPairs: item.matchedPairs,  
          totalPairs: item.totalPairs,      
          intentRemaining: item.intentRemaining, 
          completed: item.completed,        
          student_id: item.student_id,
          date_created: item.date_created 
        } as MemoryResult));
      })
    );
  }

  /**
   * Obtiene todos los resultados de memoria.
   * Útil para la tabla general de progreso.
   * Ordena por fecha de creación descendente.
   */
  getAllMemoryResults(): Observable<MemoryResult[]> {
    // Añade el sort a la URL
    return this.http.get<any>(`${this.memoryResultsApiUrl}?sort=-date_created&limit=-1`).pipe(
      map(response => {
        return (response.data || []).map((item: any) => ({
          id: item.id,
          level_id: item.level_id,
          score: item.score,
          stars: item.stars,
          elapsedTime: item.elapsedTime,     
          matchedPairs: item.matchedPairs,   
          totalPairs: item.totalPairs,       
          intentRemaining: item.intentRemaining, 
          completed: item.completed,
          student_id: item.student_id,
          date_created: item.date_created
        } as MemoryResult));
      })
    );
  }
}