import { Component } from '@angular/core';
import { Route, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
 
//Variables
email = '';
password = '';
errorMessage: string = ''; 
showPassword: boolean = false;

  //utilizando servicio de ruteo para poder navegar entre los componentes
  constructor(private http: HttpClient, private router: Router) {}


  //función de inicio de sesion
  login(){
    this.errorMessage = ''; 

    //constante que va a guardar los datos
    const data = {
      email: this.email,
      password: this.password
    };

   // petición al backend para el inicio de sesion
    this.http.post('http://localhost:8055/auth/login', data).subscribe({
      next: (respuesta: any) => {
        console.log(respuesta) 
        localStorage.setItem('token', respuesta.data.access_token);
        this.router.navigate(['/main']);
      },
      error: (error) => {
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        } else {
          this.errorMessage = 'Error al conectarse con el servidor. Por favor, inténtalo más tarde.';
        }
      }
    });
  }
    // <-- Nueva función para alternar la visibilidad de la contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}

