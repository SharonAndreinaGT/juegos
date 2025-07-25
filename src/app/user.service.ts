import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User } from './puzzle-config.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8055/items/users';

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getUsers() {
    return this.http.get<any>(this.apiUrl);
  }

  // Obtener usuarios por grado
  getUsersByGrade(grade: string) {
    return this.http.get<any>(`${this.apiUrl}?filter[grade][_eq]=${grade}`);
  }

  // Crear un nuevo usuario
  createUser(userData: any) {
    return this.http.post<any>(this.apiUrl, userData);
  }

  // Editar usuario por ID
  updateUser(id: number, userData: any) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, userData);
  }

  // Obtener un solo usuario por ID
  getUserById(id: number): Observable<User | null> {
    console.log(`[UserService] Buscando usuario con ID (PK): ${id}`);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.data) {
          const user: User = response.data;
          console.log('[UserService] Usuario encontrado por ID:', user);
          return user;
        } else {
          console.log('[UserService] No se encontró ningún usuario con ese ID.');
          return null;
        }
      }),
      catchError(error => {
        console.error('[UserService] Error al buscar usuario por ID:', error);
        return of(null); // Devuelve null en caso de error
      })
    );
  }

  /**
   * Busca un usuario por su 'name' en la colección 'users' de Directus.
   * Si lo encuentra, devuelve el objeto User (incluyendo su 'id' PK).
   */
  getUserByName(userName: string): Observable<User | null> {
    console.log(`[UserService] Buscando usuario con nombre: ${userName}`);
    return this.http.get<any>(
      `${this.apiUrl}?filter[name][_eq]=${userName}`
    ).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          const user: User = response.data[0];
          console.log('[UserService] Usuario encontrado:', user);
          return user; // Devuelve el primer usuario encontrado
        } else {
          console.log('[UserService] No se encontró ningún usuario con ese nombre.');
          return null; // No se encontró ningún usuario
        }
      }),
      catchError(error => {
        console.error('[UserService] Error al buscar usuario por nombre:', error);
        return of(null); // Devuelve null en caso de error
      })
    );
  }

  /**
   * Verifica si un estudiante ya existe en la base de datos por nombre, apellido y sección.
   * @param name Nombre del estudiante.
   * @param lastname Apellido del estudiante.
   * @param section Sección del estudiante.
   * @returns Observable<boolean> que emite true si el estudiante existe, false en caso contrario.
   */
  checkIfStudentExists(name: string, lastname: string, section: string): Observable<boolean> {
    // Normaliza los valores para la búsqueda (Directus es sensible a mayúsculas/minúsculas en filtros exactos)
    const normalizedName = name.toLowerCase();
    const normalizedLastname = lastname.toLowerCase();
    const normalizedSection = section.toUpperCase(); // La sección ya se normaliza a mayúsculas en el formulario

    const queryUrl = `${this.apiUrl}?filter[name][_eq]=${normalizedName}&filter[lastname][_eq]=${normalizedLastname}&filter[section][_eq]=${normalizedSection}`;
    console.log(`[UserService] Verificando existencia de estudiante con URL: ${queryUrl}`);

    return this.http.get<any>(queryUrl).pipe(
      map(response => {
        // Si response.data tiene elementos, significa que se encontró un usuario con esos criterios
        const exists = response.data && response.data.length > 0;
        console.log(`[UserService] Estudiante existe: ${exists}`);
        return exists;
      }),
      catchError(error => {
        console.error('[UserService] Error al verificar si el estudiante existe:', error);
        // En caso de error de la API, asumimos que no existe para no bloquear el registro
        // o puedes decidir manejarlo de otra forma (ej. lanzar el error)
        return of(false);
      })
    );
  }
}
