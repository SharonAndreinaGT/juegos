import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    try {
      // Obtener información del rol desde localStorage
      const userRole = JSON.parse(localStorage.getItem('userRole') || '{}');

      // Verificar si el usuario tiene rol de admin
      if (userRole && userRole.data.name === 'user-admin') {
        return true;
      }
      
      // Si no es admin, redirigir a página no autorizada
      this.router.navigate(['/unauthorized']);
      return false;
      
    } catch (error) {
      console.error('Error verificando rol de admin:', error);
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
