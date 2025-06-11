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
    this.router.navigate(['/memory']);
  }

  gamesRiddle(): void {
    this.router.navigate(['/riddle']);
  }
}