import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { SharedDataService } from '../sharedData.service';
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig } from '../memory-config-model';

@Component({
  selector: 'app-games-options',
  templateUrl: './games-options.component.html',
  styleUrls: ['./games-options.component.css'] 
})
export class GamesOptionsComponent implements OnInit { 
  
  currentPuzzleLevel: string = 'Nivel1'; // iniciando con el valor por defecto

  activeLevel: MemoryConfig | null = null; 

  // inyecta el servicio que se supone que va a conectar los datos para los niveles
  constructor(
    private router: Router,
    private sharedDataService: SharedDataService,
    private memoryGameStateService: MemoryGameStateService 
  ) {}


  ngOnInit(): void {
    
    this.sharedDataService.currentPuzzleLevel$.subscribe(level => {
      this.currentPuzzleLevel = level;
      console.log(`[GamesOptionsComponent] Current puzzle level updated to: ${this.currentPuzzleLevel}`);
    });

  
    // Suscripción para obtener el nivel activo de memoria
    this.memoryGameStateService.activeLevel$.subscribe(level => {
      this.activeLevel = level; // Asigna el nivel a la propiedad declarada
      console.log(level)
      if (level) {
        console.log(`[GamesOptionsComponent] Nivel de memoria activo cargado: ${level.level_name}`);
      } else {
        console.log(`[GamesOptionsComponent] No hay nivel de memoria activo establecido.`);
      }
    });

    // para obtener el nivel al inicio si ya está cargado
    // Aunque la suscripción anterior lo hará, esto asegura que 'activeLevel' tenga un valor inicial
    this.activeLevel = this.memoryGameStateService.getActiveLevel();
    if (this.activeLevel) {
      console.log(`[GamesOptionsComponent] Nivel de memoria inicial (desde servicio): ${this.activeLevel.level_name}`);
    }
  }

 
  gamesRompecabezas(): void { 
    this.router.navigate(['/puzzle', this.currentPuzzleLevel]);
  }

  gamesMemory(): void {
    this.router.navigate(['/memory']);
    console.log(`[GamesOptionsComponent] Navigating to /memory (MemoryComponent will get active level from service).`);
  }

  gamesRiddle(): void {
    this.router.navigate(['/riddle']);
  }

  exit(){
    this.router.navigate(['/welcome']);
  }
}