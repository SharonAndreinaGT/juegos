import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-games-settings',
  templateUrl: './games-settings.component.html',
  styleUrl: './games-settings.component.css'
})
export class GamesSettingsComponent implements OnInit {

  //Declara la variable de tipo entero y vacio porque se llama el dato que fue declarado anteriormente
  title: string = '';

  constructor(private route: ActivatedRoute) {} // permite acceder a la ruta actual dentro del componente.

  //Metodo que recibe los datos y los almacena en las variables de la instancia 
  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.title = data['title'];
    });
  }

}
