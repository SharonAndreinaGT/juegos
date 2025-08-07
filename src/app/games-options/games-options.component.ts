import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { SharedDataService } from '../sharedData.service';
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig } from '../memory-config-model';
import { StudentProgressService } from '../student-progress.service';

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
    private memoryGameStateService: MemoryGameStateService,
    private studentProgressService: StudentProgressService
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
    // Obtener el ID del estudiante y su progreso actual
    this.sharedDataService.loggedInStudentId$.subscribe(studentId => {
      if (studentId) {
        // Cargar o inicializar progreso del estudiante
        let progress = this.studentProgressService.loadProgressFromLocalStorage(studentId, 'puzzle');
        if (!progress) {
          this.studentProgressService.initializeProgress(studentId, 'puzzle');
          progress = this.studentProgressService.getCurrentProgress();
        }
        
        if (progress) {
          // Navegar al nivel actual del estudiante
          this.router.navigate(['/puzzle', progress.currentLevel]);
        } else {
          // Fallback al primer nivel
          this.router.navigate(['/puzzle', '183770b3-0e66-4932-8769-b0c1b4738d79']);
        }
      } else {
        // Si no hay estudiante logueado, ir al primer nivel
        this.router.navigate(['/puzzle', '183770b3-0e66-4932-8769-b0c1b4738d79']);
      }
    });
  }

  gamesMemory(): void {
    // Obtener el ID del estudiante y su progreso actual
    this.sharedDataService.loggedInStudentId$.subscribe(studentId => {
      if (studentId) {
        // Cargar o inicializar progreso del estudiante
        let progress = this.studentProgressService.loadProgressFromLocalStorage(studentId, 'memory');
        if (!progress) {
          this.studentProgressService.initializeProgress(studentId, 'memory');
          progress = this.studentProgressService.getCurrentProgress();
        }
        
        if (progress) {
          // Navegar al nivel actual del estudiante
          this.router.navigate(['/memory']);
          console.log(`[GamesOptionsComponent] Navigating to /memory with current level: ${progress.currentLevel}`);
        } else {
          // Fallback al primer nivel
          this.router.navigate(['/memory']);
        }
      } else {
        // Si no hay estudiante logueado, ir al primer nivel
        this.router.navigate(['/memory']);
      }
    });
  }

  gamesRiddle(): void {
    this.router.navigate(['/riddle']);
  }

  exit(){
    // Limpiar el ID del estudiante al salir
    this.sharedDataService.clearLoggedInStudentId();
    this.router.navigate(['/welcome']);
  }
}