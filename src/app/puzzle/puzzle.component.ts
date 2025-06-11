import { Component, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { PuzzleService } from '../puzzle.service';
import { PuzzleConfig } from '../puzzle-config.model';
import { ActivatedRoute } from '@angular/router'; // Necesario para leer parámetros de la URL

/**
 * Interfaz para representar una pieza individual del rompecabezas.
 */
interface PuzzlePiece {
  index: number;      // Índice original de la pieza (para verificar el orden correcto)
  bgPosition: string; // Posición de la imagen de fondo para esta pieza (ej. "-0px -0px")
}

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css']
})
export class PuzzleComponent implements OnInit, OnDestroy {

  // Propiedades de configuración del rompecabezas, inicializadas con valores por defecto.
  // Estas se sobrescribirán con los datos cargados desde Directus.
  rows = 3;
  cols = 3;
  pieceSize = 110; // Tamaño en píxeles de cada pieza del rompecabezas (ancho y alto)
  imageUrl = 'assets/img/prueba.jpg'; // URL de la imagen principal del rompecabezas. Por defecto, una imagen local.
  timeLimit = 180; // Límite de tiempo en segundos para completar el rompecabezas.

  // Propiedades del estado del juego
  pieces: PuzzlePiece[] = [];       // Arreglo de piezas en el orden actual (mezclado o resuelto)
  correctOrder: number[] = [];      // Arreglo de índices en el orden correcto (0, 1, 2, ...)
  draggedIndex: number | null = null; // Índice de la pieza que se está arrastrando
  moves = 0;                        // Contador de movimientos realizados
  score = 0;                        // Puntaje obtenido al finalizar el juego
  isComplete = false;               // Indica si el rompecabezas ha sido completado
  stars = 0;                        // Número de estrellas obtenidas (1, 2 o 3)

  // Propiedades del temporizador
  timeLeft = this.timeLimit;             // Tiempo restante en segundos
  elapsedTime = '03:00';                 // Tiempo restante formateado para mostrar en la UI (ej. "03:00")
  timerSubscription: Subscription | null = null; // Suscripción al temporizador para poder detenerlo

  // Nombre del nivel actual que se está jugando 
  currentLevelName: string = 'Nivel1';

  constructor(
    private puzzleService: PuzzleService, // Servicio para interactuar con la API (Directus)
    private route: ActivatedRoute,       // Servicio para acceder a los parámetros de la ruta actual
    private el: ElementRef,              // Referencia al elemento DOM nativo del componente
    private renderer: Renderer2          // Servicio para manipular el DOM de forma segura
  ) {}

  /**
   * Método del ciclo de vida de Angular: se ejecuta al inicializar el componente.
   * Aquí se suscribe a los parámetros de la ruta para obtener el nombre del nivel.
   */
  ngOnInit(): void {
    // Se suscribe a los cambios en los parámetros de la ruta.
    // Esto permite que el componente reaccione si la ruta cambia sin ser destruido y recreado.
    this.route.paramMap.subscribe(params => {
      // Obtiene el parámetro 'levelName' de la URL. Si no existe, usa 'Nivel1' como valor por defecto.
      this.currentLevelName = params.get('levelName') || 'Nivel1';
      console.log(`[PuzzleComponent] Inicializando con nivel: ${this.currentLevelName}`);
      // Una vez que se tiene el nombre del nivel, se carga la configuración correspondiente.
      this.loadPuzzleConfiguration();
    });
  }

  /**
   * Método del ciclo de vida de Angular: se ejecuta justo antes de que el componente sea destruido.
   * Aquí es crucial desuscribirse del temporizador para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.stopTimer(); // Detiene el temporizador si está corriendo
  }

  /**
   * Carga la configuración del rompecabezas para el nivel actual desde el servicio.
   * Utiliza `this.currentLevelName` para solicitar la configuración específica.
   */
  loadPuzzleConfiguration(): void {
    console.log(`[PuzzleComponent] Cargando configuración para: ${this.currentLevelName}`);
    this.puzzleService.getPuzzleConfigByLevel(this.currentLevelName).subscribe(
      (response: any) => {
        // Accede a la primera entrada de 'data' si existe, que debería ser la configuración del nivel.
        const configData: PuzzleConfig | undefined = response.data?.[0];
        console.log(`[PuzzleComponent] Datos de configuración obtenidos para ${this.currentLevelName}:`, configData);

        if (configData) {
          // Asigna los valores de la configuración cargada.
          // Se usa el operador '??' (nullish coalescing) para usar un valor por defecto si la propiedad es null o undefined.
          this.rows = configData.rows ?? 3;
          this.cols = configData.cols ?? 3;

          // Verifica si se proporcionó un imageUrl en la configuración cargada.
          if (configData.imageUrl) {
            // Si hay un imageUrl (que es el ID del archivo en Directus), construye la URL completa.
            this.imageUrl = this.puzzleService.getDirectusFileUrl(configData.imageUrl);
            console.log(`[PuzzleComponent] URL de imagen Directus construida: ${this.imageUrl}`);
          } else {
            // Si no hay imageUrl o es nulo/vacío, se usa una imagen local por defecto.
            this.imageUrl = 'assets/img/prueba.jpg';
            console.warn(`[PuzzleComponent] URL de imagen no encontrada para ${this.currentLevelName}. Usando imagen por defecto.`);
          }

          this.timeLimit = configData.time_limit ?? 180;
          this.timeLeft = this.timeLimit; // Reinicia el tiempo restante al límite cargado.

          console.log(`[PuzzleComponent] Configuración de ${this.currentLevelName} cargada exitosamente:`, {
            level_name: this.currentLevelName,
            rows: this.rows,
            cols: this.cols,
            imageUrl: this.imageUrl, // Esto contendrá la URL completa (Directus o local)
            time_limit: this.timeLimit
          });

        } else {
          // Si no se encontró ninguna configuración para el nivel, se usan los valores por defecto del componente.
          console.warn(`[PuzzleComponent] No se encontró configuración para ${this.currentLevelName}. Usando valores por defecto.`);
          this.resetToDefaultConfig(); // Establece los valores por defecto explícitamente
        }
        this.initializeGame(); // Inicializa el juego con la configuración cargada o por defecto
      },
      (error) => {
        // En caso de error al cargar la configuración (ej. error de red, API inaccesible)
        console.error(`[PuzzleComponent] Error al cargar la configuración del rompecabezas para ${this.currentLevelName}:`, error);
        this.resetToDefaultConfig(); // Usa la configuración por defecto en caso de error
        this.initializeGame(); // Inicializa el juego con la configuración por defecto
      }
    );
  }

  /**
   * Reinicia las propiedades de configuración del rompecabezas a sus valores iniciales por defecto.
   */
  resetToDefaultConfig(): void {
    this.rows = 3;
    this.cols = 3;
    this.imageUrl = 'assets/img/prueba.jpg'; // Asegura que se use la imagen local por defecto
    this.timeLimit = 180;
    this.timeLeft = this.timeLimit;
  }

  /**
   * Inicializa un nuevo juego de rompecabezas, reiniciando el estado, generando las piezas y el temporizador.
   */
  initializeGame(): void {
    this.moves = 0;
    this.score = 0;
    this.isComplete = false;
    this.stars = 0;
    this.draggedIndex = null;
    this.stopTimer(); // Asegura que cualquier temporizador anterior se detenga
    this.generatePuzzle(); // Genera las piezas del rompecabezas
    this.startTimer(); // Inicia el nuevo temporizador
    this.setCssVariables(); // Establece las variables CSS para el diseño de la cuadrícula
  }

  /**
   * Establece variables CSS personalizadas en el elemento host del componente.
   */
  setCssVariables(): void {
    this.renderer.setStyle(this.el.nativeElement, '--cols', this.cols);
    this.renderer.setStyle(this.el.nativeElement, '--rows', this.rows);
    this.renderer.setStyle(this.el.nativeElement, '--piece-size', `${this.pieceSize}px`); // Asegura la unidad 'px'
  }

  /**
   * Genera las piezas del rompecabezas en un orden aleatorio.
   */
  generatePuzzle(): void {
    const total = this.rows * this.cols;
    this.correctOrder = Array.from({ length: total }, (_, i) => i); // Crea [0, 1, ..., total-1]

    // Crea una copia del orden correcto y lo mezcla aleatoriamente
    const randomOrder = [...this.correctOrder].sort(() => Math.random() - 0.5);

    // Mapea los índices mezclados a objetos de pieza, calculando su posición de fondo
    this.pieces = randomOrder.map((index) => {
      const row = Math.floor(index / this.cols); // Fila original de la pieza
      const col = index % this.cols;     // Columna original de la pieza
      return {
        index, // El índice original de la pieza (para la verificación de finalización)
        // Calcula la posición del fondo para mostrar la parte correcta de la imagen
        bgPosition: `-${col * this.pieceSize}px -${row * this.pieceSize}px`
      };
    });
  }

  /**
   * Maneja el evento de inicio de arrastre de una pieza.
   * @param event El evento de arrastre (DragEvent).
   * @param index El índice actual de la pieza que se está arrastrando en el arreglo `pieces`.
   */
  onDragStart(event: DragEvent, index: number): void {
    // Solo permite arrastrar si el juego no está completo y queda tiempo.
    if (!this.isComplete && this.timeLeft > 0) {
      this.draggedIndex = index;
    }
  }

  /**
   * Maneja el evento de arrastre sobre una pieza. Previene el comportamiento por defecto
   * para permitir el evento 'drop'.
   * @param event El evento de arrastre (DragEvent).
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Maneja el evento de soltar una pieza sobre otra. Intercambia las piezas y verifica la finalización.
   * @param event El evento de arrastre (DragEvent).
   * @param targetIndex El índice de la pieza sobre la cual se soltó la pieza arrastrada.
   */
  onDrop(event: DragEvent, targetIndex: number): void {
    // Si no hay una pieza arrastrada, o se suelta sobre sí misma, o el juego está completo, o el tiempo se acabó, no hace nada.
    if (this.draggedIndex === null || this.draggedIndex === targetIndex || this.isComplete || this.timeLeft <= 0) {
      return;
    }

    // Intercambia las piezas en el arreglo
    const temp = this.pieces[targetIndex];
    this.pieces[targetIndex] = this.pieces[this.draggedIndex];
    this.pieces[this.draggedIndex] = temp;

    this.draggedIndex = null; // Reinicia el índice de la pieza arrastrada
    this.moves += 1;          // Incrementa el contador de movimientos
    this.checkCompletion();   // Verifica si el rompecabezas está resuelto
  }

  /**
   * Verifica si el rompecabezas ha sido completado comparando el orden actual con el orden correcto.
   */
  checkCompletion(): void {
    // `every()` verifica si todos los elementos cumplen la condición:
    // Que el `index` original de cada pieza coincida con su posición actual en el arreglo.
    this.isComplete = this.pieces.every((piece, index) => piece.index === index);
    if (this.isComplete) {
      this.stopTimer(); // Detiene el temporizador
      this.calculateScoreAndStars(); // Calcula el puntaje y las estrellas
      // TODO: Aquí puedes llamar a una función para guardar el resultado del juego en la base de datos
      // this.saveGameResult();
    }
  }

  /**
   * Calcula el puntaje y el número de estrellas obtenidas al completar el juego.
   */
  calculateScoreAndStars(): void {
    let rawScore = 0;
    // Calcula un número máximo de movimientos posibles para normalizar el factor de movimientos.
    const maxPossibleMoves = (this.rows * this.cols) * 5; // Un valor heurístico

    if (this.isComplete) {
      // Lógica para asignar estrellas basada en el tiempo restante
      if (this.timeLimit === 0) { // Si no hay límite de tiempo, siempre 3 estrellas por tiempo
        this.stars = 3;
      } else if (this.timeLeft >= (this.timeLimit * 0.66)) {
        this.stars = 3; // Más del 66% del tiempo restante
      } else if (this.timeLeft >= (this.timeLimit * 0.33)) {
        this.stars = 2; // Más del 33% del tiempo restante
      } else {
        this.stars = 1; // Menos del 33% del tiempo restante
      }

      // Calcula un factor de tiempo (cuanto más tiempo quede, mejor)
      const timeFactor = this.timeLimit > 0 ? (this.timeLeft / this.timeLimit) : 1;
      // Calcula un factor de movimientos (cuantos menos movimientos, mejor)
      const movesFactor = 1 - Math.min(1, this.moves / maxPossibleMoves);

      // Combina los factores de tiempo y movimientos para un puntaje en bruto
      rawScore = (timeFactor * 0.7 + movesFactor * 0.3) * 20; // Pondera el tiempo (70%) y movimientos (30%)
      this.score = Math.max(0, Math.min(20, Math.round(rawScore))); // Limita el puntaje entre 0 y 20
    } else {
      // Si el juego no está completo (ej. se acabó el tiempo), el puntaje y las estrellas son 0.
      this.stars = 0;
      this.score = 0;
    }
    console.log(`¡Ganaste ${this.stars} estrellas! Tu puntaje es: ${this.score}`);
    // TODO: Aquí también podrías llamar a saveGameResult() si quieres guardar resultados incluso al agotarse el tiempo
  }

  /**
   * Inicia el temporizador de cuenta regresiva del juego.
   */
  startTimer(): void {
    if (this.timeLimit > 0) { // Solo inicia el temporizador si hay un límite de tiempo
      this.timeLeft = this.timeLimit; // Reinicia el tiempo
      this.updateElapsedTime();       // Actualiza la visualización del tiempo
      this.timerSubscription = interval(1000).subscribe(() => { // Emite un valor cada segundo
        this.timeLeft--;          // Decrementa el tiempo restante
        this.updateElapsedTime(); // Actualiza la visualización
        if (this.timeLeft <= 0) {
          this.stopTimer();       // Detiene el temporizador
          if (!this.isComplete) { // Si el tiempo se acaba y el juego no está completo
            this.calculateScoreAndStars(); // Calcula el puntaje (que será 0 estrellas)
            // TODO: Podrías guardar el resultado aquí también
            // this.saveGameResult();
          }
        }
      });
    } else {
      this.elapsedTime = '∞'; // Si no hay límite de tiempo, muestra infinito
    }
  }

  /**
   * Detiene el temporizador y desuscribe para liberar recursos.
   */
  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe(); // Desuscribe del Observable para detener las emisiones
      this.timerSubscription = null;        // Establece la suscripción a null
    }
  }

  /**
   * Actualiza la cadena de tiempo restante formateada (MM:SS).
   */
  updateElapsedTime(): void {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
    this.elapsedTime = `${minutes}:${seconds}`;
  }

  /**
   * Reinicia el juego cargando la configuración actual del nivel y reinicializando el estado del juego.
   */
  resetGame(): void {
    this.loadPuzzleConfiguration(); // Recarga la configuración del nivel actual y reinicia el juego
  }
}