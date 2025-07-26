// este service es para que funcione la elección de los niveles y se muestre el que guarde el profesor
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  // Este BehaviorSubject almacenará el nombre del nivel de rompecabezas actualmente activo.
  // Se inicializa con una cadena vacía, o podrías inicializarlo con un nivel por defecto si lo deseas.
  private currentPuzzleLevelSubject = new BehaviorSubject<string>('');
  currentPuzzleLevel$: Observable<string> = this.currentPuzzleLevelSubject.asObservable();

  private loggedInStudentIdSubject = new BehaviorSubject<string | null>(null);
  loggedInStudentId$: Observable<string | null> = this.loggedInStudentIdSubject.asObservable();

  constructor() {
    // Recuperar el nivel activo guardado en localStorage al iniciar el servicio
    const savedLevel = localStorage.getItem('currentPuzzleLevel');
    if (savedLevel) {
      this.currentPuzzleLevelSubject.next(savedLevel);
    }

    // Recuperar el ID del estudiante logueado guardado en localStorage al iniciar el servicio
    const savedStudentId = localStorage.getItem('loggedInStudentId');
    if (savedStudentId) {
      this.loggedInStudentIdSubject.next(savedStudentId);
    }
  }

  /**
   * Establece el nivel de rompecabezas actual que está activo para los estudiantes.
   * @param levelName El nombre del nivel a establecer como activo.
   */
  setCurrentPuzzleLevel(levelName: string): void {
    this.currentPuzzleLevelSubject.next(levelName);
    localStorage.setItem('currentPuzzleLevel', levelName);
    console.log(`[SharedDataService] Nivel de rompecabezas activo establecido a: ${levelName}`);
  }

  /**
   * Obtiene el nombre del nivel de rompecabezas actualmente activo.
   * @returns El nombre del nivel activo.
   */
  getCurrentPuzzleLevel(): string {
    return this.currentPuzzleLevelSubject.getValue();
  }

  /**
   * Establece el ID del estudiante que ha iniciado sesión.
   * @param studentId El ID del estudiante o null si no hay ninguno.
   */
  setLoggedInStudentId(studentId: string | null): void {
    this.loggedInStudentIdSubject.next(studentId);
    if (studentId) {
      localStorage.setItem('loggedInStudentId', studentId);
      console.log(`[SharedDataService] ID de estudiante logueado establecido y guardado: ${studentId}`);
    } else {
      localStorage.removeItem('loggedInStudentId');
      console.log(`[SharedDataService] ID de estudiante logueado limpiado.`);
    }
  }

  /**
   * Obtiene el ID del estudiante que ha iniciado sesión.
   * @returns El ID del estudiante o null si no hay ninguno.
   */
  getLoggedInStudentId(): string | null {
    return this.loggedInStudentIdSubject.getValue();
  }

  /**
   * Limpia el ID del estudiante logueado (logout).
   */
  clearLoggedInStudentId(): void {
    this.setLoggedInStudentId(null);
  }
}