import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar'; // Necesitas MatSnackBar para los mensajes del juego.

// --- NUEVAS LÍNEAS ---
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig } from '../memory-config-model'; // Importa MemoryConfig
import { MemoryService } from '../memory.service';

// --- Tu interfaz Card (si ya la tienes, mantenla así) ---
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
  
  private timer: any; // Para el temporizador del juego
  private flippedCards: Card[] = []; // Para las cartas volteadas actualmente

  constructor(
    // --- NUEVA LÍNEA: Inyectar el servicio de estado del juego ---
    private gameStateService: MemoryGameStateService,
    private memoryService: MemoryService,
    private snackBar: MatSnackBar // Inyectar MatSnackBar para notificaciones
  ) { }

  ngOnInit(): void {
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
        if (this.intent === 0) {
            this.intentExceeded = true;
            this.stopGameTimer();
            this.gameStarted = false;
            this.snackBar.open('¡Se acabaron los intentos!', 'Cerrar', { duration: 3000 });
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