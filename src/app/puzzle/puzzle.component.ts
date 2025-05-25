import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { interval, Subscription } from 'rxjs';

// Interfaz que representa una pieza del rompecabezas
interface PuzzlePiece {
  index: number;        // Índice correcto de la pieza
  bgPosition: string;   // Posición del fondo para mostrar parte de la imagen
}

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css']
})
export class PuzzleComponent implements OnInit, OnDestroy {

  // Configuración del rompecabezas
  rows = 3;                      // Número de filas
  cols = 3;                      // Número de columnas
  pieceSize = 110;              // Tamaño en píxeles de cada pieza
  imageUrl = 'assets/img/prueba.jpg';

  // Estado del rompecabezas
  pieces: PuzzlePiece[] = [];   // Arreglo de piezas mezcladas
  correctOrder: number[] = [];  // Orden correcto de las piezas
  draggedIndex: number | null = null; // Índice de la pieza que se está arrastrando
  score = 0;                    // Conteo de movimientos realizados
  isComplete = false;          // Indica si el rompecabezas fue completado
  stars = 0;                   // Número de estrellas ganadas

  // Temporizador
  timeLimit = 180;             
  timeLeft = this.timeLimit;    // Tiempo restante
  elapsedTime = '03:00';        // Tiempo formateado para mostrar
  timerSubscription: Subscription | null = null; 

  ngOnInit(): void {
    this.generatePuzzle();
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  generatePuzzle(): void {
    const total = this.rows * this.cols;
    this.correctOrder = Array.from({ length: total }, (_, i) => i); // Orden correcto

    // Mezcla aleatoriamente las piezas
    const randomOrder = [...this.correctOrder].sort(() => Math.random() - 0.5);

    // Crea las piezas con su posición de fondo correspondiente
    this.pieces = randomOrder.map((index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      return {
        index,
        bgPosition: `-${col * this.pieceSize}px -${row * this.pieceSize}px`
      };
    });
  }

  /**
   * Evento al iniciar el arrastre de una pieza.
   * @param event Evento de arrastre
   * @param index Índice de la pieza arrastrada
   */
  onDragStart(event: DragEvent, index: number): void {
    // Solo permitir arrastrar si el juego no ha terminado
    if (!this.isComplete && this.timeLeft > 0) {
      this.draggedIndex = index;
    }
  }

  /**
   * Permite que una pieza se pueda soltar sobre otra.
   * @param event Evento de arrastre
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necesario para permitir el "drop"
  }

  /**
   * Intercambia dos piezas al soltar una sobre otra.
   * @param event Evento de soltado
   * @param targetIndex Índice del objetivo donde se suelta la pieza
   */
  onDrop(event: DragEvent, targetIndex: number): void {
    // Solo permitir soltar si el juego no ha terminado
    if (this.draggedIndex === null || this.draggedIndex === targetIndex || this.isComplete || this.timeLeft <= 0) return;

    // Intercambio de piezas
    const temp = this.pieces[targetIndex];
    this.pieces[targetIndex] = this.pieces[this.draggedIndex];
    this.pieces[this.draggedIndex] = temp;

    this.draggedIndex = null;
    this.score += 1;

    this.checkCompletion(); // Verifica si el rompecabezas fue completado
  }

  /**
   * Verifica si las piezas están en el orden correcto.
   * Si es así, detiene el temporizador y calcula las estrellas.
   */
  checkCompletion(): void {
    this.isComplete = this.pieces.every((piece, index) => piece.index === index);
    if (this.isComplete) {
      this.stopTimer();
      this.calculateStars(); // Calcula las estrellas al completar
    }
  }

  /**
   * Calcula el número de estrellas en función del tiempo restante.
   */
  calculateStars(): void {
    if (this.isComplete) { // Solo calcula estrellas altas si se completó
      if (this.timeLeft >= 120) { // Si quedan 2 minutos o más
        this.stars = 3;
      } else if (this.timeLeft >= 60) { // Si queda 1 minuto o más
        this.stars = 2;
      } else if (this.timeLeft > 0) { // Si queda algo de tiempo
        this.stars = 1;
      } else { // Si el tiempo se agotó antes de completar
        this.stars = 0;
      }
    } else { // Si el tiempo se agotó y no se completó
      this.stars = 0;
    }
    console.log(`¡Ganaste ${this.stars} estrellas!`);
  }

  /**
   * Inicia el temporizador para medir el tiempo que tarda el jugador.
   */
  startTimer(): void {
    this.timeLeft = this.timeLimit; // Inicializa el tiempo restante
    this.updateElapsedTime();       // Actualiza la visualización inicial
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeLeft--;              // Decrementa el tiempo restante
      this.updateElapsedTime();       // Actualiza la visualización
      if (this.timeLeft <= 0) {
        this.stopTimer();          // Detiene el temporizador si se acaba el tiempo
        // Si el tiempo se agota y el rompecabezas no está completo
        if (!this.isComplete) {
          this.calculateStars();     // Calcula las estrellas (que será 0)
          console.log("¡Tiempo agotado!");
        }
      }
    });
  }

  /**
   * Detiene el temporizador.
   */
  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  /**
   * Actualiza el tiempo transcurrido desde el inicio del juego.
   */
  updateElapsedTime(): void {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
    this.elapsedTime = `${minutes}:${seconds}`;
  }

  /**
   * Reinicia el juego a su estado inicial.
   */
  resetGame(): void {
    this.score = 0;
    this.isComplete = false;
    this.stars = 0;
    this.draggedIndex = null;
    this.stopTimer(); 
    this.generatePuzzle(); // Genera un nuevo rompecabezas
    this.startTimer(); // Inicia un nuevo temporizador
  }
}