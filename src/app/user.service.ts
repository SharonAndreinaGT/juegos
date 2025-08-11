import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User } from './puzzle-config.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8055/items/users';
  private sectionsUrl = 'http://localhost:8055/items/sections';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Obtener todos los usuarios
  getUsers() {
    const fields = '?fields=id,name,lastname,grade,grade.grade,score,section.id,section.section';

    return this.http.get<any>(this.apiUrl + fields);
  }

  // Obtener usuarios por grado
  getUsersByGrade(grade: string | null) {
    const fields = '&fields=id,name,lastname,grade,grade.grade,score,section.id,section.section';
    
    const url = grade
    ? `${this.apiUrl}?filter[grade][_eq]=${grade}${fields}`
    : `${this.apiUrl}?limit=-1${fields}`; // limit=-1 para obtener todos

    return this.http.get<any>(url);
  }

// ✅ Añadir el nuevo método para obtener el ID de la sección
  /**
   * Obtiene el ID de la sección por su nombre (ej. 'A', 'B').
   * @param sectionName El nombre de la sección a buscar.
   * @returns Observable<string> que emite el ID de la sección.
   */
  getSectionIdByName(sectionName: string): Observable<string> {
    const queryUrl = `${this.sectionsUrl}?filter[section][_eq]=${sectionName}`;
    return this.http.get<any>(queryUrl).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        } else {
          // Si no se encuentra la sección, se lanza un error.
          throw new Error('Sección no encontrada');
        }
      }),
      catchError(error => {
        console.error('Error al obtener el ID de la sección:', error);
        // Devolver un Observable de error
        return of('');
      })
    );
  }

  // Crear un nuevo usuario
  createUser(userData: any) {
    return this.http.post<any>(this.apiUrl, userData);
  }

  updateStudent(id: number, studentData: any) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, studentData);
  }

  // Editar usuario por ID
  updateUser(id: number, userData: any) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, userData);
  }

  // Obtener un solo usuario por ID
  getUserById(id: number): Observable<User | null> {
    console.log(`[UserService] Buscando usuario con ID (PK): ${id}`);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        if (response.data) {
          const user: User = response.data;
          console.log('[UserService] Usuario encontrado por ID:', user);
          return user;
        } else {
          console.log(
            '[UserService] No se encontró ningún usuario con ese ID.'
          );
          return null;
        }
      }),
      catchError((error) => {
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
    return this.http
      .get<any>(`${this.apiUrl}?filter[name][_eq]=${userName}`)
      .pipe(
        map((response) => {
          if (response.data && response.data.length > 0) {
            const user: User = response.data[0];
            console.log('[UserService] Usuario encontrado:', user);
            return user; // Devuelve el primer usuario encontrado
          } else {
            console.log(
              '[UserService] No se encontró ningún usuario con ese nombre.'
            );
            return null; // No se encontró ningún usuario
          }
        }),
        catchError((error) => {
          console.error(
            '[UserService] Error al buscar usuario por nombre:',
            error
          );
          return of(null); // Devuelve null en caso de error
        })
      );
  }

 /**
   * Verifica si un estudiante ya existe en la base de datos por nombre, apellido, sección y grado.
   * @param name Nombre del estudiante.
   * @param lastname Apellido del estudiante.
   * @param sectionId ID de la sección del estudiante.
   * @param gradeId ID del grado del estudiante.
   * @returns Observable<boolean> que emite true si el estudiante existe, false en caso contrario.
   */
  checkIfStudentExists(
    name: string,
    lastname: string,
    sectionId: string,
    gradeId: string
  ): Observable<boolean> {
    const normalizedName = name.toLowerCase();
    const normalizedLastname = lastname.toLowerCase();
    
    const queryUrl = `${this.apiUrl}?filter[name][_eq]=${normalizedName}&filter[lastname][_eq]=${normalizedLastname}&filter[section][_eq]=${sectionId}&filter[grade][_eq]=${gradeId}`;
    console.log(`[UserService] Verificando existencia de estudiante con URL: ${queryUrl}`);

    return this.http.get<any>(queryUrl).pipe(
      map((response) => {
        const exists = response.data && response.data.length > 0;
        console.log(`[UserService] Estudiante existe: ${exists}`);
        return exists;
      }),
      catchError((error) => {
        console.error('[UserService] Error al verificar si el estudiante existe:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtiene la información del usuario autenticado
   */
  getUserInfo(email: string): Promise<any> {
    const token = this.authService.getToken();
    if (!token) {
      return Promise.resolve(null);
    }

    // Aquí puedes hacer una petición al servidor para obtener la información del usuario
    return firstValueFrom(
      this.http.get(`http://localhost:8055/users?filter[email][_eq]=${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }

  /**
   * Obtiene la informacion del grado del usuario autenticado
   */
  getGradeFilter(): Promise<any> {
    const token = this.authService.getToken();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')[0];
    const gradeId = userInfo.grade;
    if (!token || !gradeId) {
      return Promise.resolve('');
    }
    return firstValueFrom(
      this.http.get(
        `http://localhost:8055/items/grades?filter[id][_eq]=${gradeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    );
  }

  /**
   * Obtiene todos los grados ordenados por level
   */
  getAllGrades(): Observable<any> {
    return this.http.get<any>('http://localhost:8055/items/grades?sort=level&fields=*,id');
  }

  /**
   * Obtiene el siguiente grado basado en el level actual
   */
  getNextGrade(currentLevel: number): Observable<any> {
    const nextLevel = currentLevel + 1;
    return this.http.get<any>(`http://localhost:8055/items/grades?filter[level][_eq]=${nextLevel}&fields=*,id`);
  }

  /**
   * Promueve todos los estudiantes de un grado al siguiente nivel
   */
  promoteStudents(currentGradeId: string, newGradeId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ error: 'No hay token de autenticación' });
    }

    return this.getUsersByGrade(currentGradeId).pipe(
      map((studentsResponse: any) => {
        const students = studentsResponse.data || [];
        if (students.length === 0) {
          return { message: 'No hay estudiantes para promover' };
        }
        return students;
      }),
      switchMap((students: any[]) => {
        const updatePromises = students.map((student: any) => {
          const updateData = { grade: newGradeId };
          return this.http.patch<any>(`${this.apiUrl}/${student.id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        });

        return forkJoin(updatePromises);
      }),
      map((responses: any[]) => {
        console.log('[UserService] Estudiantes promovidos exitosamente:', responses.length);
        return { 
          success: true, 
          message: `${responses.length} estudiantes promovidos exitosamente`,
          count: responses.length 
        };
      }),
      catchError((error) => {
        console.error('[UserService] Error al promover estudiantes:', error);
        return of({ error: 'Error al promover estudiantes' });
      })
    );
  }

  // Elimina a todos los estudiantes de un grado específico.
  deleteStudentsByGrade(gradeId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, error: 'No hay token de autenticación' });
    }
    
    // Primero, obtenemos todos los IDs de los estudiantes en ese grado
    return this.getUsersByGrade(gradeId).pipe(
      map((studentsResponse: any) => studentsResponse.data || []),
      switchMap((students: any[]) => {
        if (students.length === 0) {
          return of({ success: true, message: 'No hay estudiantes para eliminar' });
        }

        // Creamos un array de IDs para la petición DELETE
        const studentIds = students.map(student => student.id);
        
        // enviando un array de IDs en el cuerpo de la petición DELETE
        const url = `${this.apiUrl}`; 
        const options = {
          headers: { Authorization: `Bearer ${token}` },
          body: studentIds // ✅ Envía los IDs en el cuerpo de la petición
        };

        return this.http.delete<any>(url, options).pipe(
          map(() => ({ success: true, message: `Se eliminaron ${studentIds.length} estudiantes.` })),
          catchError(error => {
            console.error('Error al eliminar estudiantes por grado:', error);
            return of({ success: false, error: 'Error al eliminar estudiantes.' });
          })
        );
      })
    );
  }
}
