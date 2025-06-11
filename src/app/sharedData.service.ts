// este service es para que funcione la elección de los niveles y se muestre el que guarde el profesor
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' 
})
export class SharedDataService {

  private currentPuzzleLevelSubject = new BehaviorSubject<string>('Nivel1');
  currentPuzzleLevel$: Observable<string> = this.currentPuzzleLevelSubject.asObservable();

  private loggedInStudentIdSubject = new BehaviorSubject<string | null>(null);
  loggedInStudentId$: Observable<string | null> = this.loggedInStudentIdSubject.asObservable();

  constructor() {
    const savedLevel = localStorage.getItem('currentPuzzleLevel');
    if (savedLevel) {
      this.currentPuzzleLevelSubject.next(savedLevel);
    }

    const savedStudentId = localStorage.getItem('loggedInStudentId');
    if (savedStudentId) {
      this.loggedInStudentIdSubject.next(savedStudentId);
    }
  }

  setCurrentPuzzleLevel(levelName: string): void {
    this.currentPuzzleLevelSubject.next(levelName);
    localStorage.setItem('currentPuzzleLevel', levelName);
  }

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
}