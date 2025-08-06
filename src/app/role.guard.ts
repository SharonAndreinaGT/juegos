import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    try {
      // Obtener los roles permitidos desde la configuración de la ruta
      const allowedRoles = route.data['allowedRoles'] as string[];
      
      if (!allowedRoles || allowedRoles.length === 0) {
        return true; // Si no se especifican roles, permitir acceso
      }

      // Obtener información del rol desde localStorage
      const userRole = JSON.parse(localStorage.getItem('userRole') || '{}');
      
      // Verificar si el usuario tiene uno de los roles permitidos
      if (userRole && userRole.name && allowedRoles.includes(userRole.name)) {
        return true;
      }
      
      // Si no tiene el rol requerido, redirigir a página no autorizada
      this.router.navigate(['/unauthorized']);
      return false;
      
    } catch (error) {
      console.error('Error verificando roles:', error);
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
