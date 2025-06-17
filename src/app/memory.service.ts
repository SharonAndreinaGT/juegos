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

  constructor(private http: HttpClient) { }

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


}