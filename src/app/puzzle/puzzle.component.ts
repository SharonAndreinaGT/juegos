import { Component, OnInit, OnDestroy, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { interval, Subscription, Observable } from 'rxjs';
import { PuzzleService } from '../puzzle.service';
import { SharedDataService } from '../sharedData.service';
import { PuzzleConfig, PuzzleResult, User } from '../puzzle-config.model';
import { ActivatedRoute } from '@angular/router'; 
import { Router } from '@angular/router';
import { CanComponentDeactivate, NavigationGuardService } from '../navigation-guard.service';
import { StudentProgressService } from '../student-progress.service';

interface PuzzlePiece {
  index: number;
  bgPosition: string;
}

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css']
})
export class PuzzleComponent implements OnInit, OnDestroy, CanComponentDeactivate {

  @ViewChild('winSound') winSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('loseSound') loseSound!: ElementRef<HTMLAudioElement>;

  rows = 3;
  cols = 3;
  pieceSize = 110;
  imageUrl = 'assets/img/prueba.jpg';
  timeLimit = 180;

  pieces: PuzzlePiece[] = [];
  correctOrder: number[] = [];
  draggedIndex: number | null = null;
  moves = 0;
  score = 0;
  isComplete = false;
  stars = 0;

  timeLeft = this.timeLimit;
  elapsedTime = '03:00';
  timerSubscription: Subscription | null = null;

  currentGrade: string = 'Nivel1';
  currentLevel: any = '';
  currentStudentId: string | null = null;

  constructor(
    private puzzleService: PuzzleService,
    private sharedDataService: SharedDataService,
    private route: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2,
    private navigationGuardService: NavigationGuardService,
    private studentProgressService: StudentProgressService
  ) {}

  ngOnInit(): void {
    this.sharedDataService.loggedInStudentId$.subscribe((studentId: string | null) => {
      this.currentStudentId = studentId;
      console.log(`[PuzzleComponent] ID de estudiante obtenido del servicio compartido: ${this.currentStudentId}`);
      
      if (studentId) {
        // Inicializar o cargar progreso del estudiante
        let progress = this.studentProgressService.loadProgressFromLocalStorage(studentId, 'puzzle');
        if (!progress) {
          this.studentProgressService.initializeProgress(studentId, 'puzzle');
          progress = this.studentProgressService.getCurrentProgress();
        }
        
        if (progress) {
          this.currentGrade = progress.currentLevel;
          console.log(`[PuzzleComponent] Progreso cargado - Nivel actual: ${this.currentGrade}`);
        }
      }
    });

    this.route.paramMap.subscribe(params => {
      const routeLevel = params.get('levelName');
      if (routeLevel) {
        this.currentGrade = routeLevel;
        console.log(`[PuzzleComponent] Nivel desde ruta: ${routeLevel}`);
      }
      console.log(`[PuzzleComponent] Inicializando puzzle component`);
      this.loadPuzzleConfiguration();
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadPuzzleConfiguration(): void {
    console.log(`[PuzzleComponent] Cargando configuración del nivel activo del grado del estudiante`);
    
    // Obtener el grado del estudiante
    const grade = localStorage.getItem('gradeStudent') || '';
    console.log(`[PuzzleComponent] Grado del estudiante: ${grade}`);
    
    if (!grade) {
      console.warn(`[PuzzleComponent] No se pudo obtener el grado del estudiante. Usando configuración por defecto.`);
      this.resetToDefaultConfig();
      this.initializeGame();
      return;
    }
    
    // Obtener el nivel activo del grado del estudiante
    this.puzzleService.getActivePuzzleConfigByGrade(grade).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response?.data?.[0];
        console.log(`[PuzzleComponent] Configuración activa obtenida:`, configData);
        
        if (configData) {
          console.log(`[PuzzleComponent] Usando configuración activa:`, configData);
          
          // Asignar el ID del nivel a currentLevel
          this.currentLevel = configData.level?.level || '';
          console.log(`[PuzzleComponent] Current level asignado: ${this.currentLevel}`);
          
          this.rows = configData.rows ?? 3;
          this.cols = configData.cols ?? 3;

          if (configData.imageUrl) {
            this.imageUrl = this.puzzleService.getDirectusFileUrl(configData.imageUrl);
            console.log(`[PuzzleComponent] URL de imagen Directus construida: ${this.imageUrl}`);
          } else {
            this.imageUrl = 'assets/img/prueba.jpg';
            console.warn(`[PuzzleComponent] URL de imagen no encontrada. Usando imagen por defecto.`);
          }

          this.timeLimit = configData.time_limit ?? 180;
          this.timeLeft = this.timeLimit;

          console.log(`[PuzzleComponent] Configuración activa cargada exitosamente:`, {
            level_name: configData.level_name,
            rows: this.rows,
            cols: this.cols,
            imageUrl: this.imageUrl,
            time_limit: this.timeLimit
          });

        } else {
          console.warn(`[PuzzleComponent] No se encontró configuración activa para el grado ${grade}. Usando valores por defecto.`);
          this.resetToDefaultConfig();
        }
        this.initializeGame();
      },
      (error) => {
        console.error(`[PuzzleComponent] Error al cargar la configuración activa del rompecabezas:`, error);
        this.resetToDefaultConfig();
        this.initializeGame();
      }
    );
  }

  resetToDefaultConfig(): void {
    this.rows = 3;
    this.cols = 3;
    this.imageUrl = 'assets/img/prueba.jpg';
    this.timeLimit = 180;
    this.timeLeft = this.timeLimit;
  }

  initializeGame(): void {
    this.moves = 0;
    this.score = 0;
    this.isComplete = false;
    this.stars = 0;
    this.draggedIndex = null;
    this.stopTimer();
    this.generatePuzzle();
    this.startTimer();
    this.setCssVariables();
  }

  setCssVariables(): void {
    this.renderer.setStyle(this.el.nativeElement, '--cols', this.cols);
    this.renderer.setStyle(this.el.nativeElement, '--rows', this.rows);
    this.renderer.setStyle(this.el.nativeElement, '--piece-size', `${this.pieceSize}px`);
  }

  generatePuzzle(): void {
    const total = this.rows * this.cols;
    this.correctOrder = Array.from({ length: total }, (_, i) => i);
    const randomOrder = [...this.correctOrder].sort(() => Math.random() - 0.5);
    this.pieces = randomOrder.map((index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      return {
        index,
        bgPosition: `-${col * this.pieceSize}px -${row * this.pieceSize}px`
      };
    });
  }

  onDragStart(event: DragEvent, index: number): void {
    if (!this.isComplete && this.timeLeft > 0) {
      this.draggedIndex = index;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    if (this.draggedIndex === null || this.draggedIndex === targetIndex || this.isComplete || this.timeLeft <= 0) {
      return;
    }
    const temp = this.pieces[targetIndex];
    this.pieces[targetIndex] = this.pieces[this.draggedIndex];
    this.pieces[this.draggedIndex] = temp;
    this.draggedIndex = null;
    this.moves += 1;
    this.checkCompletion();
  }

  checkCompletion(): void {
    this.isComplete = this.pieces.every((piece, index) => piece.index === index);
    if (this.isComplete) {
      this.stopTimer();
      this.playWinSound();
      this.calculateScoreAndStars();
      this.saveGameResult();
      
      // Desbloquear siguiente nivel si hay estudiante logueado
      if (this.currentStudentId) {
        const nextLevel = this.studentProgressService.completeLevel(this.currentGrade);
        if (nextLevel) {
          console.log(`[PuzzleComponent] ¡Nivel completado! Siguiente nivel desbloqueado: ${nextLevel}`);
        } else {
          console.log(`[PuzzleComponent] ¡Felicidades! Has completado todos los niveles del puzzle.`);
        }
      }
    }
  }

  playWinSound(): void {
    try {
      if (this.winSound && this.winSound.nativeElement) {
        this.winSound.nativeElement.currentTime = 0; // Reiniciar el audio
        this.winSound.nativeElement.volume = 0.7; // Volumen al 70%
        const playPromise = this.winSound.nativeElement.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Sonido de victoria reproducido exitosamente');
            })
            .catch(error => {
              console.log('No se pudo reproducir el sonido de victoria:', error);
            });
        }
      }
    } catch (error) {
      console.error('Error al reproducir el sonido de victoria:', error);
    }
  }

  playLoseSound(): void {
    try {
      if (this.loseSound && this.loseSound.nativeElement) {
        this.loseSound.nativeElement.currentTime = 0; // Reiniciar el audio
        this.loseSound.nativeElement.volume = 0.7; // Volumen al 70%
        const playPromise = this.loseSound.nativeElement.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Sonido de derrota reproducido exitosamente en puzzle');
            })
            .catch(error => {
              console.log('No se pudo reproducir el sonido de derrota:', error);
            });
        }
      }
    } catch (error) {
      console.error('Error al reproducir el sonido de derrota:', error);
    }
  }

  calculateScoreAndStars(): void {
    let rawScore = 0;
    const maxPossibleMoves = (this.rows * this.cols) * 5;

    if (this.isComplete) {
      if (this.timeLimit === 0) {
        this.stars = 3;
      } else if (this.timeLeft >= (this.timeLimit * 0.66)) {
        this.stars = 3;
      } else if (this.timeLeft >= (this.timeLimit * 0.33)) {
        this.stars = 2;
      } else {
        this.stars = 1;
      }
      const timeFactor = this.timeLimit > 0 ? (this.timeLeft / this.timeLimit) : 1;
      const movesFactor = 1 - Math.min(1, this.moves / maxPossibleMoves);
      rawScore = (timeFactor * 0.7 + movesFactor * 0.3) * 20;
      this.score = Math.max(0, Math.min(20, Math.round(rawScore)));
    } else {
      this.stars = 0;
      this.score = 0;
    }
    console.log(`¡Ganaste ${this.stars} estrellas! Tu puntaje es: ${this.score}`);
  }

  saveGameResult(): void {
    if (!this.currentStudentId) {
      console.warn('No se pudo guardar el resultado del juego: No hay ID de estudiante disponible. Asegúrate de que el estudiante haya iniciado sesión.');
      return;
    }

    const gameResult: PuzzleResult = {
      level_name: this.currentGrade,
      score: this.score,
      moves: this.moves,
      stars: this.stars,
      time: this.timeLimit - this.timeLeft,
      is_complete: this.isComplete,
      student_id: this.currentStudentId
    };

    console.log('[PuzzleComponent] Intentando guardar resultado:', gameResult);
    this.puzzleService.savePuzzleResult(gameResult).subscribe(
      (response) => {
        console.log('Resultado del juego guardado exitosamente:', response);
      },
      (error) => {
        console.error('Error al guardar el resultado del juego:', error);
      }
    );
  }

  startTimer(): void {
    if (this.timeLimit > 0) {
      this.timeLeft = this.timeLimit;
      this.updateElapsedTime();
      this.timerSubscription = interval(1000).subscribe(() => {
        this.timeLeft--;
        this.updateElapsedTime();
        if (this.timeLeft <= 0) {
          this.stopTimer();
          if (!this.isComplete) {
            this.playLoseSound();
            this.calculateScoreAndStars();
            this.saveGameResult();
          }
        }
      });
    } else {
      this.elapsedTime = '∞';
    }
  }

  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  updateElapsedTime(): void {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
    this.elapsedTime = `${minutes}:${seconds}`;
  }

  resetGame(): void {
    if (this.isComplete && this.currentStudentId) {
      // Si completó el nivel, avanzar al siguiente
      const progress = this.studentProgressService.getCurrentProgress();
      if (progress) {
        const nextLevel = this.studentProgressService.getNextLevel('puzzle', this.currentGrade);
        if (nextLevel) {
          this.currentGrade = nextLevel;
          console.log(`[PuzzleComponent] Avanzando al siguiente nivel: ${this.currentGrade}`);
          this.loadPuzzleConfiguration();
          return;
        } else {
          console.log(`[PuzzleComponent] No hay más niveles disponibles. Reiniciando al primer nivel.`);
          // Si no hay más niveles, volver al primero
          this.studentProgressService.resetProgress(this.currentStudentId, 'puzzle');
          const newProgress = this.studentProgressService.getCurrentProgress();
          if (newProgress) {
            this.currentGrade = newProgress.currentLevel;
          }
        }
      }
    }
    
    // Reiniciar el juego con la configuración actual
    this.loadPuzzleConfiguration();
  }

  restartCurrentLevel(): void {
    // Reiniciar el mismo nivel sin avanzar
    this.isComplete = false;
    this.moves = 0;
    this.score = 0;
    this.stars = 0;
    this.loadPuzzleConfiguration();
  }

  options(): void {
    this.router.navigate(['/options']);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Si el juego está completado o no ha comenzado, permitir salir sin confirmación
    if (this.isComplete || this.timeLeft === this.timeLimit) {
      return true;
    }
    
    // Si el juego está en progreso, mostrar confirmación
    return this.navigationGuardService.showNavigationConfirmDialog();
  }
}