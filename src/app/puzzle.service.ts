
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PuzzleConfig, PuzzleResult } from './puzzle-config.model';

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {
  // Asegúrate que esta URL apunte a tu colección 'puzzle' en Directus
  private apiUrl = 'http://localhost:8055/items/puzzle';
  // URL base para la API de archivos de Directus
  private directusFilesUrl = 'http://localhost:8055/files';

  // Colección para guardar los resultados de los rompecabezas
  private puzzleResultsCollection = 'puzzle_results';
  // URL base de Directus (útil para construir otras URLs)
  private directusBaseUrl = 'http://localhost:8055';


  constructor(private http: HttpClient) {}

  /**
   * Obtiene la configuración del rompecabezas por el nombre del nivel.
   * @param levelName El nombre del nivel (ej. "Nivel1").
   * @returns Un Observable que emite la respuesta de Directus (que contiene un array de PuzzleConfig en `data`).
   */
  getPuzzleConfigByLevel(levelName: string): Observable<any> {
    // Directus usa el filtro `_eq` para igualdad. Se solicita el ID también.
    return this.http.get<any>(`${this.apiUrl}?filter[level_name][_eq]=${(levelName)}&fields=*,id`);
  }

  /**
   * Obtiene todas las configuraciones de rompecabezas.
   * Útil para la lógica de desactivación de otros niveles.
   * @returns Un Observable que emite un array de PuzzleConfig.
   */
  getAllPuzzleConfigs(): Observable<PuzzleConfig[]> {
    return this.http.get<any>(`${this.apiUrl}?fields=*,id`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Guarda o actualiza la configuración de un rompecabezas.
   * Si `config.id` está presente, se realiza un PATCH (actualización).
   * Si `config.id` es `undefined`, se realiza un POST (creación).
   * @param config El objeto PuzzleConfig a guardar.
   * @returns Un Observable que emite el objeto PuzzleConfig guardado/actualizado.
   */
  savePuzzleConfig(config: PuzzleConfig): Observable<PuzzleConfig> {
    if (config.id) {
      // Actualizar configuración existente
      console.log(`[PuzzleService] Actualizando configuración con ID: ${config.id}`, config);
      return this.http.patch<any>(`${this.apiUrl}/${config.id}`, config).pipe(
        map(response => response.data)
      );
    } else {
      // Crear nueva configuración
      console.log('[PuzzleService] Creando nueva configuración:', config);
      return this.http.post<any>(this.apiUrl, config).pipe(
        map(response => response.data)
      );
    }
  }

  /**
   * Sube un archivo (imagen) a Directus.
   * @param file El objeto File a subir.
   * @returns Un Observable que emite la respuesta de la API de archivos de Directus.
   */
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('storage', 'local');
    formData.append('file', file, file.name);
    return this.http.post<any>(this.directusFilesUrl, formData);
  }

  /**
   * Construye la URL completa para acceder a un archivo subido a Directus.
   * @param fileId El ID del archivo en Directus.
   * @returns La URL completa del archivo.
   */
  getDirectusFileUrl(fileId: string): string {
    return `http://localhost:8055/assets/${fileId}`;
  }

  /**
   * Guarda un resultado de rompecabezas en la colección 'puzzle_results'.
   * @param result El objeto PuzzleResult a guardar.
   * @returns Un Observable que emite el objeto PuzzleResult guardado.
   */
  savePuzzleResult(result: PuzzleResult): Observable<PuzzleResult> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('[PuzzleService] Enviando resultado de rompecabezas a Directus:', result);
    return this.http.post<any>(
      `${this.directusBaseUrl}/items/${this.puzzleResultsCollection}`,
      result,
      { headers: headers }
    ).pipe(
      map(response => {
        console.log('[PuzzleService] Respuesta de Directus al guardar resultado:', response);
        return response.data;
      })
    );
  }

  /**
   * Obtiene todos los resultados de rompecabezas para un estudiante específico.
   * Ordena los resultados por fecha de creación descendente para obtener el más reciente primero.
   * @param studentId El ID del estudiante (PK de la colección 'users').
   * @returns Un Observable que emite un array de PuzzleResult.
   */
  getStudentPuzzleResults(studentId: string): Observable<PuzzleResult[]> {
    console.log(`[PuzzleService] Obteniendo resultados para estudiante ID: ${studentId}`);
    return this.http.get<any>(
      `${this.directusBaseUrl}/items/${this.puzzleResultsCollection}?filter[student_id][_eq]=${studentId}` //por esta condicion no se mostraba el puntaje ni el tiempo, &sort=-date_created
    ).pipe(
      map(response => {
        console.log('[PuzzleService] Resultados de rompecabezas obtenidos:', response.data);
        return response.data || [];
      })
    );
  }

  /**
   * Obtiene el total de partidas jugadas (conteo de registros en puzzle_results)
   */
  getTotalPuzzleResults(): Observable<number> {
    return this.http.get<any>(`${this.directusBaseUrl}/items/${this.puzzleResultsCollection}?meta=filter_count`).pipe(
      map(response => response.meta?.filter_count ?? (response.data?.length ?? 0))
    );
  }
}