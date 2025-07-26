// src/app/riddle/riddle.component.ts

import { Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RiddleLevel, RiddleWord, RiddleResult } from '../riddle.model';
import { RiddleService } from '../riddle.service';
import { SharedDataService } from '../sharedData.service';
import { Subscription, interval, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { CanComponentDeactivate, NavigationGuardService } from '../navigation-guard.service';

@Component({
  selector: 'app-riddle',
  templateUrl: './riddle.component.html',
  styleUrls: ['./riddle.component.css']
})
export class RiddleComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  // propiedades para el sonido
  @ViewChild('winSound') winSound!: ElementRef<HTMLAudioElement>;
  @ViewChild('loseSound') loseSound!: ElementRef<HTMLAudioElement>;
  
  // --- PROPIEDADES DEL JUEGO ---
  words: RiddleWord[] = [];
  secretWord: string = '';
  displayWord: string = '';
  guessedLetters: Set<string> = new Set<string>();
  incorrectGuesses: number = 0; // Intentos incorrectos para la palabra actual
  maxIncorrectGuesses: number = 7; // Valor por defecto, se sobrescribe con la configuración del nivel
  gameStatus: 'playing' | 'won' | 'lost' | 'level-complete' | 'time-up' = 'playing';
  message: string = '';

  // --- PROPIEDADES PARA EL PROGRESO Y PUNTUACIÓN ---
  currentWordIndex: number = 0;
  guessedWordsCount: number = 0; // Contador de palabras adivinadas correctamente en el nivel
  score: number = 0; // ¡Puntuación final del nivel, de 0 a 20!
  stars: number = 0; // Estrellas para la puntuación cualitativa
  totalIncorrectGuessesMade: number = 0; // Acumula los intentos incorrectos de todas las palabras del nivel

  // --- PROPIEDADES DE TIEMPO ---
  gameStartTime: number = 0; // Marca el inicio de la partida completa (en milisegundos)
  timeTaken: number = 0;     // Tiempo transcurrido en segundos
  timeRemaining: number = 0; // Tiempo restante en segundos
  private timerSubscription: Subscription | undefined;

  // Propiedad para almacenar la configuración del nivel activo
  activeLevelConfig: RiddleLevel = {
    id: null,
    level_number: 0,
    level_name: 'Cargando Configuración...',
    max_intents: 7,
    words_level: 0,
    words: [],
    isActive: false,
    time_limit: 0
  };

  private levelsSubscription!: Subscription;
  private studentIdSubscription!: Subscription;
  currentStudentId: string | null = null;

  constructor(
    private router: Router,
    private riddleService: RiddleService,
    private sharedDataService: SharedDataService,
    private navigationGuardService: NavigationGuardService
  ) { }

  ngOnInit(): void {
    this.studentIdSubscription = this.sharedDataService.loggedInStudentId$.subscribe((studentId: string | null) => {
      this.currentStudentId = studentId;
      console.log(`[RiddleComponent] ID de estudiante obtenido del servicio compartido: ${this.currentStudentId}`);
    });

    this.levelsSubscription = this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      const activeLevel = levels.find(lvl => lvl.isActive);

      if (activeLevel) {
        this.activeLevelConfig = activeLevel;
        if (typeof this.activeLevelConfig.time_limit !== 'number' || this.activeLevelConfig.time_limit <= 0) {
          console.warn(`[RiddleComponent] Nivel ${this.activeLevelConfig.level_name} tiene un time_limit inválido (${this.activeLevelConfig.time_limit}). Estableciendo por defecto a 300 segundos.`);
          this.activeLevelConfig.time_limit = 300;
        }
        this.timeRemaining = this.activeLevelConfig.time_limit;

        if (this.activeLevelConfig.words && this.activeLevelConfig.words.length > 0 && this.activeLevelConfig.words_level > 0) {
          const shuffledWords = this.shuffleArray([...this.activeLevelConfig.words]);
          this.words = shuffledWords.slice(0, this.activeLevelConfig.words_level);
          console.log(`[RiddleComponent] Palabras para el nivel ${this.activeLevelConfig.level_name}:`, this.words.map(w => w.word));
          this.resetGame();
        } else {
          this.gameStatus = 'lost';
          this.message = 'El nivel activo no tiene palabras o la cantidad de palabras por nivel es cero. Por favor, configura el nivel.';
          this.words = [];
          this.secretWord = '';
          this.displayWord = '';
          console.warn('El nivel activo no tiene palabras o words_level es 0.');
          this.stopGameTimer();
        }
      } else {
        this.gameStatus = 'lost';
        this.message = 'No hay ningún nivel activo. Por favor, activa un nivel en la configuración del docente.';
        this.words = [];
        this.secretWord = '';
        this.displayWord = '';
        console.warn('Ningún nivel está activo.');
        this.stopGameTimer();

        this.activeLevelConfig = {
          id: null,
          level_number: 0,
          level_name: 'Ningún Nivel Activo',
          max_intents: 7,
          words_level: 0,
          words: [],
          isActive: false,
          time_limit: 0
        };
      }
      this.startGameTimer();
    });
  }

  ngOnDestroy(): void {
    if (this.levelsSubscription) {
      this.levelsSubscription.unsubscribe();
    }
    if (this.studentIdSubscription) {
      this.studentIdSubscription.unsubscribe();
    }
    this.stopGameTimer();
    // Si el juego está activo al salir del componente, calcula el score y guarda el resultado como no completado
    if (this.gameStatus === 'playing') {
        this.calculateScoreAndStars(); // Calcula el score y estrellas finales
        this.saveGameResult(false, this.timeTaken); // Se guarda como no completado
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    if (this.gameStatus === 'playing' && key.length === 1 && key >= 'A' && key <= 'Z') {
      this.checkGuess(key);
    }
  }

  startGameTimer(): void {
    this.stopGameTimer();
    this.gameStartTime = Date.now();
    this.timeTaken = 0;

    this.timeRemaining = this.activeLevelConfig.time_limit || 0;

    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeTaken = Math.floor((Date.now() - this.gameStartTime) / 1000);
      this.timeRemaining = (this.activeLevelConfig.time_limit || 0) - this.timeTaken;

      if (this.timeRemaining <= 0) {
        this.stopGameTimer();
        this.gameStatus = 'time-up';
        this.message = `¡Se acabó el tiempo! La partida ha terminado.`;
        this.calculateScoreAndStars(); // Calcula score y estrellas al agotar el tiempo
        this.saveGameResult(false, (this.activeLevelConfig.time_limit || 0)); // Se guarda como no completado por tiempo
        this.playLoseSound();
      }
    });
  }

  stopGameTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  initializeGame(): void {
    if (!this.activeLevelConfig || this.activeLevelConfig.words_level === 0 || !this.activeLevelConfig.words || this.activeLevelConfig.words.length === 0) {
      this.gameStatus = 'lost';
      this.message = 'Configuración del nivel inválida o sin palabras para jugar.';
      this.stopGameTimer();
      return;
    }

    if (this.guessedWordsCount >= this.activeLevelConfig.words_level) {
      this.gameStatus = 'level-complete';
      this.calculateScoreAndStars(); // Calcula score y estrellas al completar el nivel
      this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
      this.stopGameTimer();
      this.saveGameResult(true, this.timeTaken);
      this.playWinSound();
      return;
    }

    this.guessedLetters.clear();
    this.incorrectGuesses = 0;
    this.gameStatus = 'playing';
    this.message = '';

    this.maxIncorrectGuesses = this.activeLevelConfig.max_intents;

    if (this.words.length > 0 && this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
      this.secretWord = this.words[this.currentWordIndex].word.toUpperCase();
      this.updateDisplayWord();
    } else {
      this.gameStatus = 'level-complete';
      this.calculateScoreAndStars(); // Calcula score y estrellas si no hay suficientes palabras al inicio
      this.message = 'No hay suficientes palabras disponibles para el nivel configurado o se han jugado todas las palabras.';
      console.error('Error: No hay suficientes palabras para el nivel configurado o se ha excedido el límite de palabras del nivel.');
      this.stopGameTimer();
      this.saveGameResult(true, this.timeTaken); // Se guarda como completado si se terminaron las palabras disponibles
    }
  }

  updateDisplayWord(): void {
    this.displayWord = this.secretWord
      .split('')
      .map(letter => (this.guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  }

  checkGuess(letter: string): void {
    if (this.gameStatus !== 'playing' || this.guessedLetters.has(letter)) {
      return;
    }

    this.guessedLetters.add(letter);

    if (this.secretWord.includes(letter)) {
      this.updateDisplayWord();
    } else {
      this.incorrectGuesses++;
    }

    this.checkGameStatus();
  }

  checkGameStatus(): void {
    if (this.gameStatus !== 'playing') {
      return;
    }

    if (this.displayWord.replace(/ /g, '') === this.secretWord) {
      this.gameStatus = 'won';
      this.message = '¡Correcto!';

      this.guessedWordsCount++;
      // this.score++; // ¡Eliminado! El score final se calcula al final del nivel
      this.totalIncorrectGuessesMade += this.incorrectGuesses; // Suma los intentos incorrectos de esta palabra

      if (this.guessedWordsCount < this.activeLevelConfig.words_level) {
        this.currentWordIndex++;
        setTimeout(() => {
          if (this.gameStatus === 'won') {
            this.initializeGame();
          }
        }, 1500);
      } else {
        this.gameStatus = 'level-complete';
        this.calculateScoreAndStars(); // Calcula score y estrellas al completar el nivel
        this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
        this.stopGameTimer();
        this.saveGameResult(true, this.timeTaken);
        this.playWinSound(); // REPRODUCIR SONIDO DE VICTORIA (nivel completado)
      }

    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      this.gameStatus = 'lost';
      this.message = `¡Oh no! Has perdido esta palabra. La palabra era: ${this.secretWord}.`;

      this.totalIncorrectGuessesMade += this.maxIncorrectGuesses; // Suma los intentos máximos si se pierde la palabra
      this.currentWordIndex++;

      setTimeout(() => {
        if (this.gameStatus === 'lost' && this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
          this.initializeGame();
        } else if (this.gameStatus === 'lost') {
          this.gameStatus = 'level-complete';
          this.calculateScoreAndStars(); // Calcula score y estrellas al finalizar el nivel
          if (this.guessedWordsCount === 0) {
            this.message = 'Has terminado el nivel, pero no adivinaste ninguna palabra.';
          } else {
            this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
          }
          this.stopGameTimer();
          this.saveGameResult(false, this.timeTaken); // Se guarda como no completado si no se adivinaron todas
          this.playLoseSound(); // REPRODUCIR SONIDO DE DERROTA (nivel terminado por pérdida)
        }
      }, 2000);
    }
  }

  /**
   * Calcula el puntaje (0-20) y la cantidad de estrellas (0-3)
   * basándose en palabras adivinadas, intentos incorrectos y tiempo empleado.
   */
  calculateScoreAndStars(): void {
    const maxOverallScore = 20;
    let calculatedScore = 0;

    // Porcentaje de Palabras Adivinadas (hasta 10 puntos)
    if (this.activeLevelConfig.words_level > 0) {
        const wordsGuessedRatio = this.guessedWordsCount / this.activeLevelConfig.words_level;
        calculatedScore += Math.round(wordsGuessedRatio * 10); // Max 10 puntos por palabras
    }

    //Eficiencia de Intentos Incorrectos (hasta 5 puntos)
    const totalPossibleAttemptsInLevel = this.activeLevelConfig.words_level * this.activeLevelConfig.max_intents;
    if (totalPossibleAttemptsInLevel > 0) {
        const incorrectRatio = this.totalIncorrectGuessesMade / totalPossibleAttemptsInLevel;
        // Cuanto menor sea, mayor el puntaje.
        calculatedScore += Math.round((1 - Math.min(1, incorrectRatio)) * 5); // Max 5 puntos por intentos
    } else {
        calculatedScore += 5; // Si no hay palabras o intentos, asume eficiencia perfecta
    }

    // Eficiencia del Tiempo (hasta 5 puntos)
    const timeLimit = this.activeLevelConfig.time_limit;
    if (timeLimit && timeLimit > 0 && this.timeTaken > 0) {
        const timeUsedRatio = this.timeTaken / timeLimit;
        // Cuanto menor sea el tiempo usado, mayor el puntaje.
        calculatedScore += Math.round((1 - Math.min(1, timeUsedRatio)) * 5); // Max 5 puntos por tiempo
    } else {
        calculatedScore += 5; // Si no hay límite de tiempo, asume eficiencia perfecta
    }

    // Asegura que el puntaje esté dentro del rango 0-20
    this.score = Math.min(Math.max(0, calculatedScore), maxOverallScore);

    // Convertir el score (0-20) a estrellas (0-3)
    if (this.score >= 18) { // Rango alto
        this.stars = 3;
    } else if (this.score >= 12) { // Rango medio
        this.stars = 2;
    } else if (this.score >= 6) { // Rango básico
        this.stars = 1;
    } else {
        this.stars = 0;
    }

    console.log(`[RiddleComponent] Puntaje Final: ${this.score}, Estrellas: ${this.stars}`);
  }

  get currentHint(): string | undefined {
    if (this.activeLevelConfig && this.activeLevelConfig.level_number === 3 && this.currentWordIndex < this.words.length) {
      return this.words[this.currentWordIndex].hint;
    }
    return undefined;
  }

  resetGame(): void {
    this.currentWordIndex = 0;
    this.guessedWordsCount = 0;
    this.score = 0; // Reinicia el score final
    this.stars = 0; // Reinicia las estrellas
    this.totalIncorrectGuessesMade = 0;

    this.timeTaken = 0;
    this.timeRemaining = this.activeLevelConfig.time_limit || 0;
    this.stopGameTimer();
    this.startGameTimer();

    if (this.activeLevelConfig.words && this.activeLevelConfig.words.length > 0) {
      const shuffledWords = this.shuffleArray([...this.activeLevelConfig.words]);
      this.words = shuffledWords.slice(0, this.activeLevelConfig.words_level);
    } else {
      this.words = [];
      this.gameStatus = 'lost';
      this.message = 'No se puede reiniciar el juego: el nivel no tiene palabras configuradas.';
      this.stopGameTimer();
      return;
    }
    this.initializeGame();
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  options(): void {
    this.router.navigate(['/options']);
  }

  /**
   * Guarda el resultado de la partida en Directus.
   * @param isGameCompleted Indica si el juego (nivel) fue completado exitosamente (todas las palabras adivinadas).
   * @param finalTime La duración final de la partida en segundos.
   */
  saveGameResult(isGameCompleted: boolean, finalTime: number): void {
    if (!this.currentStudentId) {
      console.warn('No se pudo guardar el resultado del juego: No hay ID de estudiante disponible. Asegúrate de que el estudiante haya iniciado sesión.');
      alert('Tu resultado no pudo ser guardado. Por favor, asegúrate de haber iniciado sesión.');
      return;
    }

    const gameResult: RiddleResult = {
      level_name: this.activeLevelConfig.level_name,
      score: this.score, 
      attempts_made: this.totalIncorrectGuessesMade,
      words_guessed: this.guessedWordsCount,
      time_taken: finalTime,
      is_complete: isGameCompleted,
      student_id: this.currentStudentId
    };

    console.log('[RiddleComponent] Intentando guardar resultado:', gameResult);
    this.riddleService.saveRiddleResult(gameResult).subscribe(
      (response) => {
        console.log('Resultado del juego de Riddle guardado exitosamente:', response);
      },
      (error) => {
        console.error('Error al guardar el resultado del juego de Riddle:', error);
      }
    );
  }


  //metodo para el sonido cuando gane
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

  //metodo para el sonido cuando pierde
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
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Si el juego está completado o no ha comenzado, permitir salir sin confirmación
    if (this.gameStatus === 'level-complete' || this.gameStatus === 'time-up' || this.gameStatus === 'lost') {
      return true;
    }
    
    // Si el juego está en progreso, mostrar confirmación
    return this.navigationGuardService.showNavigationConfirmDialog();
  }
}