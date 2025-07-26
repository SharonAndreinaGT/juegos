import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {
  
  //se utiliza la función del ruteo
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Si el usuario ya está autenticado, redirigir al main
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/main']);
    }
  }

  //se llama la función jugar, que si presiona este boton pasa al siguiente componente para ingresar al juego con el ID del estudiante
  jugar() {
    this.router.navigate(['/loginID']);
  }

  // aqui pasa al componente login para iniciar sesión el administrador
  administrador(){
    this.router.navigate(['/login']);
  }
}
