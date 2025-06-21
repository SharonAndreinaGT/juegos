import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemoryConfig } from './memory-config-model';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  private apiUrl = 'http://localhost:8055/items/memory';    
  private directusFilesUrl = 'http://localhost:8055/files';


  constructor(private http: HttpClient) { }

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

}