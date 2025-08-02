import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private apiUrl = 'http://localhost:8055/users';

  constructor(private http: HttpClient) {}

  getUsers(teacherId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?filter[role][_eq]=${teacherId}`);
  }

  getRoles(): Observable<any> {
    const rolesUrl = 'http://localhost:8055/roles';
    return this.http.get<any>(rolesUrl);
  }

  getGrades(): Observable<any> {
    const gradesUrl = 'http://localhost:8055/items/grades';
    return this.http.get<any>(gradesUrl);
  }

  getSections(): Observable<any> {
    const sectionsUrl = 'http://localhost:8055/items/sections';
    return this.http.get<any>(sectionsUrl);
  }

  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${userId}`, userData);
  }
}
