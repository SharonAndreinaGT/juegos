import { Component, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { PuzzleService } from '../puzzle.service';
import { PuzzleConfig } from '../puzzle-config.model';
import { ActivatedRoute } from '@angular/router';

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

  rows = 3;
  cols = 3;
  pieceSize = 110; // Default piece size
  imageUrl = 'assets/img/prueba.jpg'; // Default local image
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

  constructor(
    private puzzleService: PuzzleService,
    private route: ActivatedRoute,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.currentLevelName = params.get('levelName') || 'Nivel1';
      this.loadPuzzleConfiguration();
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

loadPuzzleConfiguration(): void {
    console.log(`Cargando configuración para: ${this.currentLevelName}`);
    this.puzzleService.getPuzzleConfigByLevel(this.currentLevelName).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response.data?.[0];
        console.log('Config data final:', configData); // Para confirmar que es correcto

        if (configData) {
          this.rows = configData.rows ?? 3;
          this.cols = configData.cols ?? 3;

          // Accede a configData.imageUrl directamente, ya es el ID del archivo
          if (configData.imageUrl) { // <-- Ahora configData.imageUrl es el ID directamente
            this.imageUrl = this.puzzleService.getDirectusFileUrl(configData.imageUrl); // <-- Pasar configData.imageUrl directamente
            console.log(`URL de imagen Directus construida: ${this.imageUrl}`);
          } else {
            this.imageUrl = 'assets/img/prueba.jpg'; // Fallback a la imagen local
            console.warn(`URL de imagen no encontrada para ${this.currentLevelName}. Usando imagen por defecto.`);
          }

          this.timeLimit = configData.time_limit ?? 180;
          this.timeLeft = this.timeLimit;

          console.log(`Configuración de ${this.currentLevelName} cargada exitosamente:`, {
            level_name: this.currentLevelName,
            rows: this.rows,
            cols: this.cols,
            imageUrl: this.imageUrl, // Esto ahora será la URL completa generada
            time_limit: this.timeLimit
          });

        } else {
          console.warn(`No se encontró configuración para ${this.currentLevelName}. Usando valores por defecto.`);
          this.resetToDefaultConfig();
        }
        this.initializeGame();
      },
      (error) => {
        console.error(`Error al cargar la configuración del rompecabezas para ${this.currentLevelName}:`, error);
        this.resetToDefaultConfig();
        this.initializeGame();
      }
    );
  }

  resetToDefaultConfig(): void {
    this.rows = 3;
    this.cols = 3;
    this.imageUrl = 'assets/img/prueba.jpg'; // Ensure fallback to local image
    this.timeLimit = 180;
    this.timeLeft = this.timeLimit;
  }

  initializeGame(): void {
    this.moves = 0;
    this.score = 0;
    this.isComplete = false;
    this.stars = 0;
    this.draggedIndex = null;
    this.stopTimer(); // Ensure any running timer is stopped
    this.generatePuzzle();
    this.startTimer();
    this.setCssVariables();
  }

  // ... (rest of your component methods: setCssVariables, generatePuzzle, onDragStart, etc.)
  // NO CHANGES BELOW HERE, assuming previous parts were correct.
  setCssVariables(): void {
    this.renderer.setStyle(this.el.nativeElement, '--cols', this.cols);
    this.renderer.setStyle(this.el.nativeElement, '--rows', this.rows);
    this.renderer.setStyle(this.el.nativeElement, '--piece-size', this.pieceSize);
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
    if (this.draggedIndex === null || this.draggedIndex === targetIndex || this.isComplete || this.timeLeft <= 0) return;

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
      this.calculateScoreAndStars();
      // Call saveGameResult() here
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
    // Call saveGameResult() here as well if you want to save on time out
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
            this.calculateScoreAndStars();
            // Call saveGameResult() here
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
    this.loadPuzzleConfiguration(); // Reloads config and initializes game
  }
}

