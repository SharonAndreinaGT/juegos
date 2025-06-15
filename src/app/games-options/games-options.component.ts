import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { SharedDataService } from '../sharedData.service';

@Component({
  selector: 'app-games-options',
  templateUrl: './games-options.component.html',
  styleUrls: ['./games-options.component.css'] 
})
export class GamesOptionsComponent implements OnInit { 
  
  currentPuzzleLevel: string = 'Nivel1'; // iniciando con el valor por defecto

  //iniciando con el valor por defecto
  defaultMemoryLevel: string = 'Nivel 1'; 

  // inyecta el servicio que se supone que va a conectar los datos para los niveles
  constructor(
    private router: Router,
    private sharedDataService: SharedDataService
  ) {}


  ngOnInit(): void {
    
    this.sharedDataService.currentPuzzleLevel$.subscribe(level => {
      this.currentPuzzleLevel = level;
      console.log(`[GamesOptionsComponent] Current puzzle level updated to: ${this.currentPuzzleLevel}`);
    });
  }

 
  gamesRompecabezas(): void { 
    this.router.navigate(['/puzzle', this.currentPuzzleLevel]);
  }

  gamesMemory(): void {
    // ¡Aquí está el cambio! Pasamos explícitamente el nivel como parámetro.
    this.router.navigate(['/memory', this.defaultMemoryLevel]); 
    console.log(`[GamesOptionsComponent] Navigating to /memory/${this.defaultMemoryLevel}`);
  }

  gamesRiddle(): void {
    this.router.navigate(['/riddle']);
  }
}