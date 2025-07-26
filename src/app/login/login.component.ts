import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

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
  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}


  //función de inicio de sesion
  login(){
    this.errorMessage = ''; 

    this.authService.login(this.email, this.password).subscribe({
      next: (respuesta: any) => {
        console.log(respuesta) 
        this.authService.setToken(respuesta.data.access_token);
        
        // Obtener la URL de retorno si existe
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/main';
        this.router.navigate([returnUrl]);
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
    //función para alternar la visibilidad de la contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  //función para regresar a welcome
  goBack() {
    this.router.navigate(['/welcome']);
  }
}

