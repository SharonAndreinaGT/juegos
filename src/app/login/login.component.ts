import { Component } from '@angular/core';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
 
  //utilizando servicio de ruteo para poder navegar entre los componentes
  constructor(private router: Router) {}

  navegar(){ //se llama la funcion para navegar entre componentes
    this.router.navigate(['/main']);
  }
}
