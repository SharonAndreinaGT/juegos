import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    // Verificar si hay un token al inicializar el servicio
    this.checkAuthStatus();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Verifica el estado de autenticación y actualiza el BehaviorSubject
   */
  private checkAuthStatus(): void {
    const isAuth = this.isAuthenticated();
    this.isAuthenticatedSubject.next(isAuth);
  }

  /**
   * Realiza el login del usuario
   */
  login(email: string, password: string): Observable<any> {
    const data = { email, password };

    return this.http.post('http://localhost:8055/auth/login', data);
  }

  /**
   * Establece el token de autenticación
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/welcome']);
  }

  /**
   * Obtiene la información del usuario autenticado
   */
  getUserInfo(email: string): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    // Aquí puedes hacer una petición al servidor para obtener la información del usuario
    return this.http.get(
      `http://localhost:8055/users?filter[email][_eq]=${email}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Verifica si el token es válido haciendo una petición al servidor
   */
  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable((observer) => {
        observer.next(false);
        observer.complete();
      });
    }

    // Aquí puedes hacer una petición al servidor para verificar el token
    // Por ahora, solo verificamos que existe
    return new Observable((observer) => {
      observer.next(true);
      observer.complete();
    });
  }
}
