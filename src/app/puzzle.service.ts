import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PuzzleConfig } from './puzzle-config.model';

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {
  // Asegúrate que esta URL apunte a tu colección 'puzzle' en Directus
  private apiUrl = 'http://localhost:8055/items/puzzle';
  // URL base para la API de archivos de Directus
  private directusFilesUrl = 'http://localhost:8055/files';

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
}