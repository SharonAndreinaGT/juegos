import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SharedDataService } from './sharedData.service';

@Injectable({
  providedIn: 'root'
})
export class StudentAuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private sharedDataService: SharedDataService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Verificar si el estudiante ha hecho login (tiene un ID de estudiante)
    const studentId = this.sharedDataService.getLoggedInStudentId();
    
    if (studentId) {
      // El estudiante está autenticado, permitir acceso
      return true;
    }

    // Si no está autenticado, redirigir al login de estudiantes
    this.router.navigate(['/loginID']);
    return false;
  }
} 