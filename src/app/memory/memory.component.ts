import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar'; // Necesitas MatSnackBar para los mensajes del juego.

// --- NUEVAS LÍNEAS ---
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig, MemoryResult } from '../memory-config-model'; // Importa MemoryConfig
import { MemoryService } from '../memory.service';
import { SharedDataService } from '../sharedData.service';
import { Router } from '@angular/router';

export interface Card {
  id?: number | null;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

@Component({
  selector: 'app-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.scss']
})
export class MemoryComponent implements OnInit {
  @ViewChild('winSound') winSound!: ElementRef<HTMLAudioElement>;

  cards: Card[] = [];
  activeLevel: MemoryConfig | null = null; // Variable para guardar la configuración del nivel activo

  // Variables para el estado del juego (asegúrate de que las tienes inicializadas como necesites)
  intent: number = 0; // Intentos actuales
  elapsedTime: number = 0; // Tiempo transcurrido en segundos
  gameStarted: boolean = false; // Indica si el juego está en curso
  matchedPairs: number = 0; // Pares encontrados
  totalPairs: number = 0; // Total de pares a encontrar
  intentExceeded: boolean = false; // Indica si se acabaron los intentos
  timeExceeded: boolean = false; // Indica si se acabó el tiempo
  
  //variables del score y studentID
  score: number = 0;
  stars: number = 0;
  currentStudentId: string | null = null;

  private timer: any; // Para el temporizador del juego
  private flippedCards: Card[] = []; // Para las cartas volteadas actualmente

  constructor(
    //  Inyectar el servicio de estado del juego ---
    private sharedDataService: SharedDataService,
    private gameStateService: MemoryGameStateService,
    private router: Router,
    private memoryService: MemoryService,
    private snackBar: MatSnackBar // Inyectar MatSnackBar para notificaciones
  ) { }

/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * ngOnInit
   *
   * Se llama justo antes de que el componente se vuelva a dibujar.
   * En este caso, se llama a loadActiveMemoryConfig() para obtener la configuración
   * del nivel activo cuando se inicia el componente.
   */
/*******  42785c72-6dab-4d7d-b731-0b90d52fc6d7  *******/
  ngOnInit(): void {
    this.sharedDataService.loggedInStudentId$.subscribe((studentId: string | null) => {
      this.currentStudentId = studentId;
      console.log(`[MemoryComponent] ID de estudiante obtenido del servicio compartido: ${this.currentStudentId}`);
    });

    this.loadActiveMemoryConfig();
  }

  // --- LÓGICA DEL JUEGO (asegúrate de que las funciones existan en tu componente) ---
  loadActiveMemoryConfig(): void {
    // Obtener la configuración activa (isActive: true) desde la base de datos
    this.memoryService.getActiveMemoryConfig().subscribe(
      (response: any) => {
        // Obtener el primer registro activo (debería ser solo uno)
        const activeConfig = response.data?.[0];
        console.log('Configuración activa encontrada:', activeConfig);
        
        if (activeConfig) {
          this.activeLevel = activeConfig;
          this.initializeGame(activeConfig); // Inicializar el juego con la nueva configuración
        } else {
          this.snackBar.open('No se encontró un nivel activo. Por favor, activa un nivel en los ajustes.', 'Cerrar', { duration: 5000 });
        }
      },
      (error) => {
        this.snackBar.open('Error al cargar la configuración del nivel activo. Por favor, comprueba la conexión con Directus.', 'Cerrar', { duration: 5000 });
      }
    );
  }

initializeGame(config: MemoryConfig): void {
  // Restablecer el estado del juego
  this.stopGameTimer();
  this.cards = [];
  this.flippedCards = [];
  this.matchedPairs = 0;
  this.gameStarted = false;
  this.intentExceeded = false;
  this.timeExceeded = false;
  this.elapsedTime = 0;
  this.score = 0; // Reiniciar el score
  this.stars = 0; // Reiniciar las estrellas

  // Configurar el juego con los valores de la configuración cargada
  this.intent = config.intent ?? 1; // Usa el número de intentos de la configuración o un valor predeterminado
  
  // Preparar las cartas con las imágenes de la configuración
  if (config.images && config.images.length > 0) {
    let cardData: Card[] = config.images.flatMap((imageConfig) => [
      { imageUrl: imageConfig, isFlipped: false, isMatched: false },
      { imageUrl: imageConfig, isFlipped: false, isMatched: false }
    ]);

    this.cards = this.shuffle(cardData);
    this.totalPairs = cardData.length / 2; // El número total de pares es la mitad del total de cartas
  } else {
    // Si no hay imágenes, muestra un mensaje de error o maneja el caso adecuadamente
    console.error('No se encontraron imágenes en la configuración del nivel.');
  }

  // Iniciar el temporizador del juego si hay un límite de tiempo
  if (config.time_limit && config.time_limit > 0) {
    this.startGameTimer(config.time_limit);
  }

  // Iniciar el juego
  this.gameStarted = true;
}

  shuffle(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  startGameTimer(timeLimit: number): void {
    this.gameStarted = true;
    if (this.timer) {
        clearInterval(this.timer); // Asegurarse de limpiar cualquier temporizador anterior
    }
    this.timer = setInterval(() => {
        this.elapsedTime++;
        if (this.activeLevel && this.activeLevel.time_limit! > 0 && this.elapsedTime >= this.activeLevel.time_limit!) {
            this.timeExceeded = true;
            this.stopGameTimer();
            this.gameStarted = false;
            this.snackBar.open('¡Se acabó el tiempo!', 'Cerrar', { duration: 3000 });
        }
    }, 1000);
  }

  stopGameTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onCardClick(clickedCard: Card): void {
    if (!this.gameStarted || clickedCard.isFlipped || clickedCard.isMatched || this.flippedCards.length === 2) {
      return;
    }

    clickedCard.isFlipped = true;
    this.flippedCards.push(clickedCard);

    if (this.flippedCards.length === 2) {
      // Comprobar si excedimos los intentos antes de comparar
      if (this.activeLevel && this.activeLevel.intent! > 0) {
        this.intent--; // Reduce intento solo si no es ilimitado
        if (this.intent < 0) this.intent = 0; // Asegura que no baja de 0
        if (this.intent === 0 && this.matchedPairs !== this.totalPairs) { // Solo si los intentos se agotan y no se han encontrado todos los pares
            this.intentExceeded = true;
            this.stopGameTimer();
            this.gameStarted = false;
            this.snackBar.open('¡Se acabaron los intentos!', 'Cerrar', { duration: 3000 });
            this.checkGameEnd(); // Llamar a checkGameEnd cuando se agotan los intentos
            return; // No procesar más si los intentos se agotaron
        }
      }

      console.log(this.flippedCards)
      // Comparar las dos cartas volteadas
      if (this.flippedCards[0].imageUrl === this.flippedCards[1].imageUrl) {
        // Coincidencia
        this.flippedCards[0].isMatched = true;
        this.flippedCards[1].isMatched = true;
        this.matchedPairs++;
        this.flippedCards = []; // Limpiar para el siguiente par

        if (this.matchedPairs === this.totalPairs) {
          this.stopGameTimer();
          this.gameStarted = false;
          this.playWinSound();
          this.checkGameEnd(); // Llamar a checkGameEnd cuando se completa el juego
        }
      } else {
        // No coinciden, voltearlas de nuevo después de un breve retraso
        setTimeout(() => {
          this.flippedCards[0].isFlipped = false;
          this.flippedCards[1].isFlipped = false;
          this.flippedCards = []; // Limpiar para el siguiente par
        }, 1000);
      }
    }
}

  // Nueva función para calcular el score y las estrellas
  private calculateScoreAndStars(): void {
    const maxScore = 20;
    const maxStars = 3;

    // Lógica de puntuación
    // Si se completó el juego
    if (this.matchedPairs === this.totalPairs) {
      // Base de la puntuación: 10 puntos por completar el juego
      this.score = 10;

      // Penalización por intentos restantes: Si quedan intentos, bonificar
      if (this.activeLevel && this.activeLevel.intent! > 0) {
        const initialIntent = this.activeLevel.intent!;
        const intentsUsed = initialIntent - this.intent;
        // Bonificación por pocos intentos usados
        if (intentsUsed <= initialIntent / 2) {
          this.score += 5; // Más puntos por eficiencia
        } else if (intentsUsed <= initialIntent * 0.75) {
          this.score += 2; // Puntos por un uso moderado
        }
      }

      // Penalización por tiempo restante: Si se completó rápido, bonificar
      if (this.activeLevel && this.activeLevel.time_limit! > 0) {
        const timeRemaining = this.activeLevel.time_limit! - this.elapsedTime;
        if (timeRemaining >= this.activeLevel.time_limit! * 0.5) {
          this.score += 5; // Más puntos por rapidez
        } else if (timeRemaining >= this.activeLevel.time_limit! * 0.25) {
          this.score += 2; // Puntos por una finalización razonable
        }
      }

      // Asegurarse de que el puntaje no exceda el máximo
      this.score = Math.min(this.score, maxScore);

    } else {
      // Si no se completó (tiempo agotado o intentos agotados)
      this.score = 0; // Sin puntaje si no se completó
    }

    // Convertir el score (0-20) a estrellas (0-3)
    if (this.score >= 15) {
      this.stars = 3;
    } else if (this.score >= 10) {
      this.stars = 2;
    } else if (this.score >= 5) {
      this.stars = 1;
    } else {
      this.stars = 0;
    }
    console.log(`Puntaje del juego: ${this.score}, Estrellas: ${this.stars}`);
  }

  // Nueva función para manejar el fin del juego
  private checkGameEnd(): void {
    if (!this.gameStarted && (this.matchedPairs === this.totalPairs || this.intentExceeded || this.timeExceeded)) {
      this.calculateScoreAndStars();
      // guardar el resultado en directus
        const result: MemoryResult = {
        student_id: this.currentStudentId,
        level_id: this.activeLevel?.id, // Asumiendo que MemoryConfig tiene un ID
        score: this.score,
        stars: this.stars,
        elapsedTime: this.elapsedTime,
        matchedPairs: this.matchedPairs,
        totalPairs: this.totalPairs,
        intentRemaining: this.intent,
        completed: this.matchedPairs === this.totalPairs
      };
        console.log('Resultado del juego:', result);
        this.memoryService.saveMemoryResult(result).subscribe(
        () => console.log('Resultado del juego guardado con éxito'),
        (error) => console.error('Error al guardar el resultado del juego', error)
      );
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
              console.log('Sonido de victoria reproducido exitosamente en memoria');
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

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  resetGame(): void {
    this.stopGameTimer(); // Asegurar que el temporizador se detiene al reiniciar
    if (this.activeLevel) {
      this.initializeGame(this.activeLevel);
    } else {
      this.snackBar.open('No se pudo reiniciar el juego. No hay un nivel activo cargado.', 'Cerrar', { duration: 3000 });
    }
  }

  options(): void {
    this.router.navigate(['/options']);
  }
}