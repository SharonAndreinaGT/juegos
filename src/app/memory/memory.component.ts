import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar'; // Necesitas MatSnackBar para los mensajes del juego.
import { Observable } from 'rxjs';

import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig, MemoryResult } from '../memory-config-model'; // Importa MemoryConfig
import { MemoryService } from '../memory.service';
import { SharedDataService } from '../sharedData.service';
import { Router } from '@angular/router';
import { CanComponentDeactivate, NavigationGuardService } from '../navigation-guard.service';
import { StudentProgressService } from '../student-progress.service';

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
export class MemoryComponent implements OnInit, CanComponentDeactivate {
  @ViewChild('winSound') winSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('loseSound') loseSound!: ElementRef<HTMLAudioElement>;

  cards: Card[] = [];
  activeLevel: MemoryConfig | null = null; // Variable para guardar la configuración del nivel activo
  currentLevel: any = ''; // Variable para el ID del nivel actual

  // Variables para el estado del juego (asegúrate de que las tienes inicializadas como necesites)
  intent: number = 0; // Intentos actuales
  elapsedTime: number = 0; // Tiempo restante en segundos (¡ahora descendente!)
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
  private initialTimeLimit: number = 0; // Para almacenar el límite de tiempo inicial

  constructor(
    //  Inyectar el servicio de estado del juego ---
    private sharedDataService: SharedDataService,
    private gameStateService: MemoryGameStateService,
    private router: Router,
    private memoryService: MemoryService,
    private snackBar: MatSnackBar, // Inyectar MatSnackBar para notificaciones
    private navigationGuardService: NavigationGuardService,
    private studentProgressService: StudentProgressService
  ) { }

  ngOnInit(): void {
    this.sharedDataService.loggedInStudentId$.subscribe((studentId: string | null) => {
      this.currentStudentId = studentId;
      console.log(`[MemoryComponent] ID de estudiante obtenido del servicio compartido: ${this.currentStudentId}`);
      
      if (studentId) {
        // Cargar o inicializar progreso del estudiante
        let progress = this.studentProgressService.loadProgressFromLocalStorage(studentId, 'memory');
        if (!progress) {
          this.studentProgressService.initializeProgress(studentId, 'memory');
          progress = this.studentProgressService.getCurrentProgress();
        }
        
        if (progress) {
          console.log(`[MemoryComponent] Progreso del estudiante cargado:`, progress);
        }
      }
    });

    this.loadActiveMemoryConfig();
  }


  loadActiveMemoryConfig(): void {
    // Obtener el grado del estudiante desde localStorage
    const grade = localStorage.getItem('gradeStudent') || '';
    if (!grade) {
      console.error('[MemoryComponent] No se encontró el grado del estudiante');
      this.snackBar.open('Error: No se encontró el grado del estudiante.', 'Cerrar', { duration: 5000 });
      return;
    }

    console.log(`[MemoryComponent] Cargando configuración del nivel activo del grado del estudiante: ${grade}`);
    
    // Obtener la configuración activa específica del grado del estudiante
    this.memoryService.getActiveMemoryConfigByGrade(grade).subscribe(
      (response: any) => {
        const configData: MemoryConfig | undefined = response?.data?.[0];
        console.log('[MemoryComponent] Configuración activa encontrada:', configData);

        if (configData) {
          // Asignar el ID del nivel a currentLevel
          this.currentLevel = configData.level!.level || '';
          console.log(`[MemoryComponent] Current level asignado: ${this.currentLevel}`);
          
          this.activeLevel = configData;
          this.initializeGame(configData); // Inicializar el juego con la nueva configuración
        } else {
          console.warn('[MemoryComponent] No se encontró configuración activa para el grado del estudiante');
          this.snackBar.open('No se encontró un nivel activo para tu grado. Por favor, contacta al administrador.', 'Cerrar', { duration: 5000 });
        }
      },
      (error) => {
        console.error('[MemoryComponent] Error al cargar la configuración:', error);
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
  this.score = 0; // Reiniciar el score
  this.stars = 0; // Reiniciar las estrellas

  // Configurar el juego con los valores de la configuración cargada
  this.intent = config.intent ?? 1; // Usa el número de intentos de la configuración o un valor predeterminado

  // Inicializar elapsedTime con el límite de tiempo para que sea descendente
  this.initialTimeLimit = config.time_limit ?? 0;
  this.elapsedTime = this.initialTimeLimit;

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
    // Inicializar el tiempo restante con el límite de tiempo
    this.elapsedTime = timeLimit;
    this.initialTimeLimit = timeLimit; // Guardar el límite de tiempo inicial

    this.timer = setInterval(() => {
        this.elapsedTime--; // Decrementar el tiempo
        if (this.elapsedTime <= 0) { // La condición ahora es cuando el tiempo llega a 0 o menos
            this.elapsedTime = 0; // Asegurarse de que no baje de 0
            this.timeExceeded = true;
            this.stopGameTimer();
            this.gameStarted = false;
            this.playLoseSound();
            this.snackBar.open('¡Se acabó el tiempo!', 'Cerrar', { duration: 3000 });
            this.checkGameEnd(); // Llamar a checkGameEnd cuando se acaba el tiempo
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
            this.playLoseSound();
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

      // Bonificación por tiempo restante: Si se completó rápido, bonificar
      if (this.activeLevel && this.activeLevel.time_limit! > 0) {
        // elapsedTime ahora es el tiempo restante, no el tiempo transcurrido
        const timeRemaining = this.elapsedTime;
        const initialTimeLimit = this.initialTimeLimit; // Usar el límite de tiempo inicial

        if (timeRemaining >= initialTimeLimit * 0.5) {
          this.score += 5; // Más puntos por rapidez
        } else if (timeRemaining >= initialTimeLimit * 0.25) {
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
      
      // Si el juego se completó exitosamente, actualizar el progreso del estudiante
      if (this.matchedPairs === this.totalPairs && this.currentStudentId) {
        this.studentProgressService.completeLevel(this.currentLevel);
        console.log(`[MemoryComponent] Nivel completado: ${this.currentLevel}`);
      }
      
      // guardar el resultado en directus
        const result: MemoryResult = {
        student_id: this.currentStudentId,
        level_id: this.activeLevel?.id, // Asumiendo que MemoryConfig tiene un ID
        score: this.score,
        stars: this.stars,
        elapsedTime: this.initialTimeLimit - this.elapsedTime, // Guardar el tiempo transcurrido real
        matchedPairs: this.matchedPairs,
        totalPairs: this.totalPairs,
        intentRemaining: this.intent,
        completed: this.matchedPairs === this.totalPairs
      };
        console.log('Resultado del juego:', result);
        console.log(`[MemoryComponent] Intentos restantes al guardar: ${this.intent}`);
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

  playLoseSound(): void {
    try {
      if (this.loseSound && this.loseSound.nativeElement) {
        this.loseSound.nativeElement.currentTime = 0; // Reiniciar el audio
        this.loseSound.nativeElement.volume = 0.7; // Volumen al 70%
        const playPromise = this.loseSound.nativeElement.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Sonido de derrota reproducido exitosamente en memoria');
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

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Si el juego está completado o no ha comenzado, permitir salir sin confirmación
    if (this.matchedPairs === this.totalPairs || !this.gameStarted) {
      return true;
    }
    
    // Si el juego está en progreso, mostrar confirmación
    return this.navigationGuardService.showNavigationConfirmDialog();
  }
}