
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Asegúrate de importar HttpHeaders
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de importar map
import { PuzzleConfig, PuzzleResult } from './puzzle-config.model'; // Asegúrate de que PuzzleResult esté importado

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {
  // Asegúrate que esta URL apunte a tu colección 'puzzle' en Directus
  private apiUrl = 'http://localhost:8055/items/puzzle';
  // URL base para la API de archivos de Directus
  private directusFilesUrl = 'http://localhost:8055/files';

  // Colección para guardar los resultados de los rompecabezas
  // ¡VERIFICA QUE ESTA SEA LA COLECCIÓN CORRECTA EN TU DIRECTUS PARA LOS RESULTADOS!
  private puzzleResultsCollection = 'puzzle_results';
  // URL base de Directus (útil para construir otras URLs)
  private directusBaseUrl = 'http://localhost:8055';


  constructor(private http: HttpClient) {}

  /**
   * Obtiene la configuración del rompecabezas por el nombre del nivel.
   * @param levelName El nombre del nivel (ej. "Nivel 1").
   * @returns Un Observable que emite la respuesta de Directus (que contiene un array de PuzzleConfig en `data`).
   */
  getPuzzleConfigByLevel(levelName: string): Observable<any> {
    // Directus usa el filtro `_eq` para igualdad
    return this.http.get<any>(`${this.apiUrl}?filter[level_name][_eq]=${(levelName)}`);
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
      return this.http.patch<PuzzleConfig>(`${this.apiUrl}/${config.id}`, config);
    } else {
      // Crear nueva configuración
      return this.http.post<PuzzleConfig>(this.apiUrl, config);
    }
  }

  /**
   * Sube un archivo (imagen) a Directus.
   * @param file El objeto File a subir.
   * @returns Un Observable que emite la respuesta de la API de archivos de Directus.
   */
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('storage', 'local'); // O el storage que uses en Directus (ej. 's3')
    // Opcional: Si tienes carpetas en Directus, puedes especificar un ID de carpeta aquí:
    // formData.append('folder', 'tu_id_de_carpeta_en_directus');
    formData.append('file', file, file.name); // 'file' es el nombre de campo que espera Directus para el archivo
    return this.http.post<any>(this.directusFilesUrl, formData);
  }

  /**
   * Construye la URL completa para acceder a un archivo subido a Directus.
   * @param fileId El ID del archivo en Directus.
   * @returns La URL completa del archivo.
   */
  getDirectusFileUrl(fileId: string): string {
    return `http://localhost:8055/assets/${fileId}`; // ✅ Correcto
  }

  // --- NUEVOS MÉTODOS AÑADIDOS A CONTINUACIÓN ---

  /**
   * Guarda un resultado de rompecabezas en la colección 'puzzle_results'.
   * @param result El objeto PuzzleResult a guardar.
   * @returns Un Observable que emite el objeto PuzzleResult guardado.
   */
  savePuzzleResult(result: PuzzleResult): Observable<PuzzleResult> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('[PuzzleService] Enviando resultado de rompecabezas a Directus:', result);
    return this.http.post<any>(
      `${this.directusBaseUrl}/items/${this.puzzleResultsCollection}`, // Usamos directusBaseUrl y puzzleResultsCollection
      result,
      { headers: headers }
    ).pipe(
      map(response => {
        console.log('[PuzzleService] Respuesta de Directus al guardar resultado:', response);
        return response.data; // Directus devuelve el objeto guardado dentro de 'data'
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
      `${this.directusBaseUrl}/items/${this.puzzleResultsCollection}?filter[student_id][_eq]=${studentId}&sort=-date_created`
    ).pipe(
      map(response => {
        console.log('[PuzzleService] Resultados de rompecabezas obtenidos:', response.data);
        return response.data || []; // Devuelve el array de resultados dentro de 'data', o un array vacío si no hay
      })
    );
  }
}