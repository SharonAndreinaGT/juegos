import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// Importamos la interfaz LevelConfig desde el archivo donde está definida
import { LevelConfig } from './memory-settings/memory-settings.component';

@Injectable({
  providedIn: 'root'
})
export class MemoryGameStateService {
  // BehaviorSubject para el nivel activo.
  // Permite que cualquier componente que se suscriba reciba el valor actual y los futuros cambios.
  // inicia con 'null' ya que al principio no hay ningún nivel activo cargado.
  private activeLevelSource = new BehaviorSubject<LevelConfig | null>(null);
  
  // Exponemos el BehaviorSubject como un Observable público para que los componentes puedan suscribirse.
  activeLevel$: Observable<LevelConfig | null> = this.activeLevelSource.asObservable();

  constructor() {
    // Cuando el servicio se inicializa (normalmente al cargar la aplicación),
    //carga el último nivel activo guardado en localStorage.
    this.loadActiveLevelFromStorage();
  }

  /**
   * Establece la configuración del nivel que actualmente está activo.
   * Se llamará desde MemorySettingsComponent cuando un nivel se activa.
   * @param level La configuración completa del nivel a establecer como activo.
   */
  setActiveLevel(level: LevelConfig): void {
    // Emitimos el nuevo nivel activo a todos los suscriptores.
    this.activeLevelSource.next(level);
    
    // Además, lo guardamos en localStorage para que persista incluso si el usuario cierra la pestaña.
    // Esto asegura que al volver a cargar la aplicación, el juego recuerde el último nivel activo.
    localStorage.setItem('memoryGameActiveLevel', JSON.stringify(level));
  }

  /**
   * Obtiene la configuración actual del nivel activo de forma síncrona.
   * Útil para cuando un componente necesita el valor inmediatamente y no suscribirse a cambios.
   * @returns La configuración del nivel activo o null si no hay ninguno.
   */
  getActiveLevel(): LevelConfig | null {
    return this.activeLevelSource.getValue();
  }

  /**
   * Intenta cargar el nivel activo desde localStorage al inicio del servicio.
   * Es un método privado porque solo el servicio lo usa internamente.
   */
  private loadActiveLevelFromStorage(): void {
    const savedActiveLevel = localStorage.getItem('memoryGameActiveLevel');
    if (savedActiveLevel) {
      try {
        // la cadena JSON a un objeto LevelConfig
        const level: LevelConfig = JSON.parse(savedActiveLevel);
        // Establecemos este nivel como el activo, notificando a los suscriptores
        this.activeLevelSource.next(level);
      } catch (e) {
        // En caso de que los datos en localStorage estén corruptos, los limpiamos y logeamos el error.
        console.error('Error al parsear el nivel activo guardado en localStorage', e);
        localStorage.removeItem('memoryGameActiveLevel'); 
      }
    }
  }
}