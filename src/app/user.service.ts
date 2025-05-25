import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
  getUserById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}