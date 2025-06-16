import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar'; // Necesitas MatSnackBar para los mensajes del juego.

// --- NUEVAS LÍNEAS ---
import { MemoryGameStateService } from '../memory-game-state.service';
import { LevelConfig } from '../memory-settings/memory-settings.component'; // Importa LevelConfig

// --- Tu interfaz Card (si ya la tienes, mantenla así) ---
export interface Card {
  id: number;
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
  cards: Card[] = [];
  activeLevel: LevelConfig | null = null; // Variable para guardar la configuración del nivel activo

  // Variables para el estado del juego (asegúrate de que las tienes inicializadas como necesites)
  intent: number = 0; // Intentos actuales
  elapsedTime: number = 0; // Tiempo transcurrido en segundos
  gameStarted: boolean = false; // Indica si el juego está en curso
  matchedPairs: number = 0; // Pares encontrados
  totalPairs: number = 0; // Total de pares a encontrar
  intentExceeded: boolean = false; // Indica si se acabaron los intentos
  timeExceeded: boolean = false; // Indica si se acabó el tiempo
  
  private timer: any; // Para el temporizador del juego
  private flippedCards: Card[] = []; // Para las cartas volteadas actualmente

  constructor(
    // --- NUEVA LÍNEA: Inyectar el servicio de estado del juego ---
    private gameStateService: MemoryGameStateService,
    private snackBar: MatSnackBar // Inyectar MatSnackBar para notificaciones
  ) { }

  ngOnInit(): void {
    // --- NUEVA LÓGICA: Suscribirse a los cambios del nivel activo ---
    this.gameStateService.activeLevel$.subscribe(level => {
      if (level) {
        this.activeLevel = level;
        console.log('Nivel activo cargado en MemoryComponent:', this.activeLevel);
        this.initializeGame(this.activeLevel); // Inicializar el juego con la nueva configuración
      } else {
        console.warn('No hay nivel activo seleccionado. Por favor, configura uno en los ajustes.');
        // Puedes añadir aquí una lógica para redirigir al usuario o mostrar un mensaje en la UI
        this.snackBar.open('Por favor, configura y activa un nivel en la sección de ajustes.', 'Cerrar', { duration: 5000 });
      }
    });

    // Opcional: También obtener el valor actual del BehaviorSubject en caso de que ya se haya emitido
    // antes de que este componente se suscriba (por ejemplo, si el servicio ya se inicializó).
    if (this.gameStateService.getActiveLevel()) {
      this.activeLevel = this.gameStateService.getActiveLevel();
      // Aseguramos que activeLevel no es null antes de pasarlo a initializeGame
      if (this.activeLevel) {
          this.initializeGame(this.activeLevel); 
      }
    }
  }

  // --- LÓGICA DEL JUEGO (asegúrate de que las funciones existan en tu componente) ---

  initializeGame(levelConfig: LevelConfig): void {
    this.stopGameTimer(); // Detener cualquier temporizador previo
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.gameStarted = false;
    this.intentExceeded = false;
    this.timeExceeded = false;
    this.elapsedTime = 0;

    const images = levelConfig.images;
    this.totalPairs = images.length; // El número de pares es la cantidad de imágenes únicas
    this.intent = levelConfig.intent; // Usar el número de intentos configurado

    let cardData: Card[] = [];
    images.forEach((image) => {
      // Crear dos cartas por cada imagen
      cardData.push({
        id: image.id,
        imageUrl: image.url, // Ya es la Data URL o URL del backend
        isFlipped: false,
        isMatched: false
      });
      cardData.push({
        id: image.id,
        imageUrl: image.url,
        isFlipped: false,
        isMatched: false
      });
    });

    // Mezclar las cartas
    this.cards = this.shuffle(cardData);
    this.startGameTimer(); // Iniciar el temporizador
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

  startGameTimer(): void {
    this.gameStarted = true;
    if (this.timer) {
        clearInterval(this.timer); // Asegurarse de limpiar cualquier temporizador anterior
    }
    this.timer = setInterval(() => {
        this.elapsedTime++;
        if (this.activeLevel && this.activeLevel.time_limit > 0 && this.elapsedTime >= this.activeLevel.time_limit) {
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
      if (this.activeLevel && this.activeLevel.intent > 0) {
        this.intent--; // Reduce intento solo si no es ilimitado
        if (this.intent < 0) this.intent = 0; // Asegura que no baja de 0
        if (this.intent === 0) {
            this.intentExceeded = true;
            this.stopGameTimer();
            this.gameStarted = false;
            this.snackBar.open('¡Se acabaron los intentos!', 'Cerrar', { duration: 3000 });
            return; // No procesar más si los intentos se agotaron
        }
      }

      // Comparar las dos cartas volteadas
      if (this.flippedCards[0].id === this.flippedCards[1].id) {
        // Coincidencia
        this.flippedCards[0].isMatched = true;
        this.flippedCards[1].isMatched = true;
        this.matchedPairs++;
        this.flippedCards = []; // Limpiar para el siguiente par

        if (this.matchedPairs === this.totalPairs) {
          this.stopGameTimer();
          this.gameStarted = false;
          this.snackBar.open('¡Felicidades, has encontrado todos los pares!', 'Cerrar', { duration: 5000 });
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
}