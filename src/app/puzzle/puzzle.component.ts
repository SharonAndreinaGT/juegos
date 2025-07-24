import { Component, OnInit, OnDestroy, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { PuzzleService } from '../puzzle.service';
import { SharedDataService } from '../sharedData.service';
import { PuzzleConfig, PuzzleResult, User } from '../puzzle-config.model';
import { ActivatedRoute } from '@angular/router'; 
import { Router } from '@angular/router';

interface PuzzlePiece {
  index: number;
  bgPosition: string;
}

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css']
})
export class PuzzleComponent implements OnInit, OnDestroy {

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

  currentLevelName: string = 'Nivel1';
  currentStudentId: string | null = null;

  constructor(
    private puzzleService: PuzzleService,
    private sharedDataService: SharedDataService,
    private route: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.sharedDataService.loggedInStudentId$.subscribe((studentId: string | null) => {
      this.currentStudentId = studentId;
      console.log(`[PuzzleComponent] ID de estudiante obtenido del servicio compartido: ${this.currentStudentId}`);
    });

    this.route.paramMap.subscribe(params => {
      this.currentLevelName = params.get('levelName') || 'Nivel1';
      console.log(`[PuzzleComponent] Inicializando con nivel: ${this.currentLevelName}`);
      this.loadPuzzleConfiguration();
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadPuzzleConfiguration(): void {
    console.log(`[PuzzleComponent] Cargando configuración para: ${this.currentLevelName}`);
    this.puzzleService.getPuzzleConfigByLevel(this.currentLevelName).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response.data?.[0];
        console.log(`[PuzzleComponent] Datos de configuración obtenidos para ${this.currentLevelName}:`, configData);

        if (configData) {
          this.rows = configData.rows ?? 3;
          this.cols = configData.cols ?? 3;

          if (configData.imageUrl) {
            this.imageUrl = this.puzzleService.getDirectusFileUrl(configData.imageUrl);
            console.log(`[PuzzleComponent] URL de imagen Directus construida: ${this.imageUrl}`);
          } else {
            this.imageUrl = 'assets/img/prueba.jpg';
            console.warn(`[PuzzleComponent] URL de imagen no encontrada para ${this.currentLevelName}. Usando imagen por defecto.`);
          }

          this.timeLimit = configData.time_limit ?? 180;
          this.timeLeft = this.timeLimit;

          console.log(`[PuzzleComponent] Configuración de ${this.currentLevelName} cargada exitosamente:`, {
            level_name: this.currentLevelName,
            rows: this.rows,
            cols: this.cols,
            imageUrl: this.imageUrl,
            time_limit: this.timeLimit
          });

        } else {
          console.warn(`[PuzzleComponent] No se encontró configuración para ${this.currentLevelName}. Usando valores por defecto.`);
          this.resetToDefaultConfig();
        }
        this.initializeGame(); // Esta llamada se moverá para ser más oportuna en resetGame
      },
      (error) => {
        console.error(`[PuzzleComponent] Error al cargar la configuración del rompecabezas para ${this.currentLevelName}:`, error);
        this.resetToDefaultConfig();
        this.initializeGame(); // Esta llamada se moverá para ser más oportuna en resetGame
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
    }
  }

  playWinSound(): void {
    try {
      if (this.winSound && this.winSound.nativeElement) {
        this.winSound.nativeElement.currentTime = 0;
        this.winSound.nativeElement.volume = 0.7;
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
        this.loseSound.nativeElement.currentTime = 0;
        this.loseSound.nativeElement.volume = 0.7;
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
      level_name: this.currentLevelName,
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

  /**
   * Reinicia el juego. Primero, establece el estado inicial y desordena las piezas,
   * luego carga la configuración del rompecabezas de forma asíncrona.
   */
  resetGame(): void {
    // 1. Reinicia las variables de estado del juego de forma síncrona
    this.moves = 0;
    this.score = 0;
    this.isComplete = false; // Importante: marca como no completo para que se renderice el grid
    this.stars = 0;
    this.draggedIndex = null;
    this.stopTimer(); // Asegúrate de detener cualquier temporizador anterior

    // 2. Genera un rompecabezas desordenado *inmediatamente*
    // para que la UI no muestre la imagen completa.
    this.generatePuzzle(); 
    this.startTimer(); // Inicia el temporizador para el nuevo juego
    this.setCssVariables(); // Asegura que las variables CSS estén actualizadas

    // 3. Luego, carga la configuración del rompecabezas.
    // Una vez que esta llamada asíncrona regrese, initializeGame() se llamará de nuevo,
    // lo que re-generará el rompecabezas con la nueva configuración, pero para entonces
    // la vista ya habrá mostrado un rompecabezas desordenado inicial.
    this.loadPuzzleConfiguration(); 
  }

  options(): void {
    this.router.navigate(['/options']);
  }
}