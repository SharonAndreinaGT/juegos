import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8055/auth/login' //url de directus
  
  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { email, password})
    .pipe(
      map((Response: any) => { //Mapea la respuesta para obtener el token
        return Response.data.access_token; // ajusta segun la estructura de la respueta
      }),
      catchError((error) => {
        console.error("Error en el servicio", error);
        return throwError(() => error)
      })
    );
  }

  logout(){
    localStorage.removeItem('token'); // indica que el usuario ha cerrado sesión
  }

  setToken(token: string){
    localStorage.setItem('token', token); // almacena el token en el localStorage para que pueda ser utilizado en futuras solicitudes
  }

  getToken(): string | null {
    return localStorage.getItem('token'); //recupera el token del localStorage
  }

  isLoggedIn(): boolean {
    return !!this.getToken(); //verifica si hay un token almacenado, lo que indica si el usuario está autenticado o no
  }
}
