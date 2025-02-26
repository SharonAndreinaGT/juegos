import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Route, Router } from '@angular/router';
import { Token } from '@angular/compiler';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}


  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (token) => { //recibe el token directamente
        console.log("Token recibido:", token);
        this.authService.setToken(token);
        this.router.navigate(['/main']); //redirige al usuario al menu principal
      },
      error: (error) => {
        console.error("Error en el login:", error);
        this.errorMessage = error.error.message || 'Credenciales incorrectas'; // Muestra el mensaje de error
      }
    });
  }
}
