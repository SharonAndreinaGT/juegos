import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SharedDataService } from '../sharedData.service';
import { User } from '../puzzle-config.model';

@Component({
  selector: 'app-login-id',
  templateUrl: './login-id.component.html',
  styleUrls: ['./login-id.component.css']
})

export class LoginIDComponent {
  name: string = '';
  lastname: string = '';
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private sharedDataService: SharedDataService // Inyecta el SharedDataService
  ) {}

  login() {
    this.errorMessage = '';

    // Convertimos el nombre a minúsculas para la búsqueda.
const url = `http://localhost:8055/items/users?filter[name][_eq]=${this.name.toLowerCase()}&filter[lastname][_eq]=${this.lastname.toLowerCase()}`;
    this.http.get<any>(url).subscribe({
      next: (respuesta) => {
        console.log('[LoginIDComponent] Respuesta de login:', respuesta);
        if (respuesta.data && respuesta.data.length > 0) {
          // Usuario encontrado
          const loggedInUser: User = respuesta.data[0]; // Obtén el objeto User completo
          // Usa el método de tu SharedDataService para guardar el ID del estudiante
          this.sharedDataService.setLoggedInStudentId(loggedInUser.id);
          this.router.navigate(['/options']); // Navega a la página de opciones
        } else {
          // Usuario no encontrado
          this.errorMessage = 'Nombre no encontrado. Inténtelo de nuevo.';
        }
      },
      error: (err) => {
        console.error('[LoginIDComponent] Error en la petición de login:', err);
        this.errorMessage = 'No se puede iniciar con campos vacíos.';
      }
    });
  }
}
