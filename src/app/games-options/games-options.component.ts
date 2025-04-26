import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-games-options',
  standalone: true,
  imports: [],
  templateUrl: './games-options.component.html',
  styleUrl: './games-options.component.css'
})
export class GamesOptionsComponent {
 
  //utilizando servicio de ruteo para poder navegar entre los componentes
   constructor(private router: Router) {}
   
   gamesRompecabezas(){ //se llama la funcion para navegar entre componentes
    this.router.navigate(['/puzzle']);
  }

  gamesMemory(){
    this.router.navigate(['/memory']);
  }

  gamesRiddle(){
    this.router.navigate(['/riddle']);
  }
}
