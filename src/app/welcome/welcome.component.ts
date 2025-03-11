import { Component} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  
  //se utiliza la funcion del ruteo
  constructor(private router: Router) {}

  //se llama la función jugar, que si presiona este boton pasa al siguiente componente para ingresar al juego con el ID del estudiante
  jugar() {
    this.router.navigate(['/loginID']);
  }

  // aqui pasa al componente login para iniciar sesión el administrador
  administrador(){
    this.router.navigate(['/login']);
  }
}
