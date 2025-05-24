import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-id',
  templateUrl: './login-id.component.html',
  styleUrls: ['./login-id.component.css']
})
export class LoginIDComponent {
  name: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const url = `http://localhost:8055/items/users?filter[name][_eq]=${this.name}`;

    this.http.get<any>(url).subscribe({
      next: (respuesta) => {
        console.log(respuesta)
        if (respuesta.data && respuesta.data.length > 0) {
          // Usuario encontrado
          this.router.navigate(['/options']); 
        } else {
          alert('Nombre no encontrado');
        }
      },
      error: (error) => {
        console.error('Error al consultar:', error);
        alert('Error al conectarse con el servidor.');
      }
    });
  }
}
