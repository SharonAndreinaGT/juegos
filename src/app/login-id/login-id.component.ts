import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-id',
  templateUrl: './login-id.component.html',
  styleUrl: './login-id.component.css'
})
export class LoginIDComponent {

   //utilizando servicio de ruteo para poder navegar entre los componentes
   constructor(private router: Router) {}
   
  navegar(){ //se llama la funcion para navegar entre componentes
    this.router.navigate(['/options']);
  }
}
