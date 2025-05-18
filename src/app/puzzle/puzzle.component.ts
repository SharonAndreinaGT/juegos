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
  styleUrl: './puzzle.component.css'
})
export class PuzzleComponent implements OnInit, OnDestroy {

  // Configuración del rompecabezas
  rows = 3;                      // Número de filas
  cols = 3;                      // Número de columnas
  pieceSize = 110;              // Tamaño en píxeles de cada pieza
  imageUrl = 'assets/img/prueba.jpg';  // Ruta de la imagen del rompecabezas

  // Estado del rompecabezas
  pieces: PuzzlePiece[] = [];   // Arreglo de piezas mezcladas
  correctOrder: number[] = [];  // Orden correcto de las piezas
  draggedIndex: number | null = null; // Índice de la pieza que se está arrastrando
  score = 0;                    // Conteo de movimientos realizados
  isComplete = false;          // Indica si el rompecabezas fue completado

  // Temporizador
  startTime: number | null = null;     // Marca de tiempo de inicio
  elapsedTime = '00:00';               // Tiempo transcurrido formateado
  timerSubscription: Subscription | null = null; // Subscripción al temporizador

  /**
   * Método que se ejecuta al iniciar el componente.
   * Genera las piezas del rompecabezas y arranca el temporizador.
   */
  ngOnInit(): void {
    this.generatePuzzle();
    this.startTimer();
  }

  /**
   * Método que se ejecuta al destruir el componente.
   * Detiene el temporizador para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * Genera y mezcla las piezas del rompecabezas.
   * Asigna posiciones de fondo para mostrar las partes correspondientes de la imagen.
   */
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
    this.draggedIndex = index;
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
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

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
   * Si es así, detiene el temporizador.
   */
  checkCompletion(): void {
    this.isComplete = this.pieces.every((piece, index) => piece.index === index);
    if (this.isComplete) {
      this.stopTimer();
    }
  }

  /**
   * Inicia el temporizador para medir el tiempo que tarda el jugador.
   */
  startTimer(): void {
    this.startTime = Date.now();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateElapsedTime();
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
    if (this.startTime) {
      const now = Date.now();
      const difference = Math.floor((now - this.startTime) / 1000);
      const minutes = Math.floor(difference / 60).toString().padStart(2, '0');
      const seconds = (difference % 60).toString().padStart(2, '0');
      this.elapsedTime = `${minutes}:${seconds}`;
    }
  }
}