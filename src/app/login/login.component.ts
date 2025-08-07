import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  //función de inicio de sesion
  async login() {
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: async (respuesta: any) => {
        this.authService.setToken(respuesta.data.access_token);

        const userInfo = await this.userService.getUserInfo(this.email);
        localStorage.setItem('userInfo', JSON.stringify(userInfo.data));
        console.log('userInfo', userInfo.data);

        this.authService.isAuthenticatedSubject.next(true);

        const gradeFilter = await this.userService.getGradeFilter();
        localStorage.setItem('gradeFilter', JSON.stringify(gradeFilter));

        console.log('User info:', userInfo.data);
        const userRole = await firstValueFrom(
          this.authService.getUserRole(userInfo.data[0].role)
        );
        localStorage.setItem('userRole', JSON.stringify(userRole));

        // Obtener la URL de retorno si existe
        const returnUrl =
          this.route.snapshot.queryParams['returnUrl'] || '/main';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        console.log('Error en login:', error);
        console.log('Error status:', error.status);
        console.log('Error message:', error.message);
        
        // Verificar diferentes tipos de errores de autenticación
        if (error.status === 401 || error.status === 403 || 
            (error.error && error.error.message && 
             (error.error.message.includes('Invalid credentials') || 
              error.error.message.includes('Invalid email or password') ||
              error.error.message.includes('Invalid email') ||
              error.error.message.includes('Invalid password')))) {
          this.errorMessage =
            'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        } else {
          this.errorMessage =
            'Error al conectarse con el servidor. Por favor, inténtalo más tarde.';
        }
      },
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
