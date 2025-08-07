import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = this.authService.getToken();

    // Si hay un token, agregarlo al header de Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(`[AuthInterceptor] Error HTTP ${error.status} en ${request.url}:`, error);
        
        // Si el error es 401 (Unauthorized), verificar si es un problema de autenticación real
        if (error.status === 401) {
          // Solo cerrar sesión si el error viene de operaciones de datos (no de login)
          if (!request.url.includes('/auth/login')) {
            console.log('[AuthInterceptor] Error 401 en operación de datos, cerrando sesión');
            this.authService.logout();
          } else {
            console.log('[AuthInterceptor] Error 401 en login, no cerrando sesión - el componente manejará el error');
            // Para errores de login, no cerrar sesión automáticamente
            // El componente de login manejará el error específicamente
          }
        }
        
        return throwError(() => error);
      })
    );
  }
} 