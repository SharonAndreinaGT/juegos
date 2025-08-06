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
  incorrectGuesses: number = 0;
  maxIncorrectGuesses: number = 7;
  gameStatus: 'playing' | 'won' | 'lost' | 'level-complete' | 'time-up' = 'playing';
  message: string = '';

  // --- PROPIEDADES PARA EL PROGRESO Y PUNTUACIÓN ---
  currentWordIndex: number = 0;
  guessedWordsCount: number = 0;
  score: number = 0;
  stars: number = 0;
  totalIncorrectGuessesMade: number = 0;

  // --- PROPIEDADES DE TIEMPO ---
  gameStartTime: number = 0;
  timeTaken: number = 0;
  timeRemaining: number = 0;
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
    time_limit: 0,
    grade: '',
    level: ''
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
    if (this.gameStatus === 'playing') {
        this.calculateScoreAndStars();
        this.saveGameResult(false, this.timeTaken);
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
        this.calculateScoreAndStars();
        this.saveGameResult(false, (this.activeLevelConfig.time_limit || 0));
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
      this.calculateScoreAndStars();
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
      this.calculateScoreAndStars();
      this.message = 'No hay suficientes palabras disponibles para el nivel configurado o se han jugado todas las palabras.';
      console.error('Error: No hay suficientes palabras para el nivel configurado o se ha excedido el límite de palabras del nivel.');
      this.stopGameTimer();
      this.saveGameResult(true, this.timeTaken);
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
      this.totalIncorrectGuessesMade += this.incorrectGuesses;

      if (this.guessedWordsCount < this.activeLevelConfig.words_level) {
        this.currentWordIndex++;
        setTimeout(() => {
          if (this.gameStatus === 'won') {
            this.initializeGame();
          }
        }, 1500);
      } else {
        this.gameStatus = 'level-complete';
        this.calculateScoreAndStars();
        this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
        this.stopGameTimer();
        this.saveGameResult(true, this.timeTaken);
        this.playWinSound();
      }

    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      this.gameStatus = 'lost';
      this.message = `¡Oh no! Has perdido esta palabra. La palabra era: ${this.secretWord}.`;

      this.totalIncorrectGuessesMade += this.maxIncorrectGuesses;
      this.currentWordIndex++;

      setTimeout(() => {
        if (this.gameStatus === 'lost' && this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
          this.initializeGame();
        } else if (this.gameStatus === 'lost') {
          this.gameStatus = 'level-complete';
          this.calculateScoreAndStars();
          if (this.guessedWordsCount === 0) {
            this.message = 'Has terminado el nivel, pero no adivinaste ninguna palabra.';
          } else {
            this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
          }
          this.stopGameTimer();
          this.saveGameResult(false, this.timeTaken);
          this.playLoseSound();
        }
      }, 2000);
    }
  }

  calculateScoreAndStars(): void {
    const maxOverallScore = 20;
    let calculatedScore = 0;

    if (this.activeLevelConfig.words_level > 0) {
        const wordsGuessedRatio = this.guessedWordsCount / this.activeLevelConfig.words_level;
        calculatedScore += Math.round(wordsGuessedRatio * 10);
    }

    const totalPossibleAttemptsInLevel = this.activeLevelConfig.words_level * this.activeLevelConfig.max_intents;
    if (totalPossibleAttemptsInLevel > 0) {
        const incorrectRatio = this.totalIncorrectGuessesMade / totalPossibleAttemptsInLevel;
        calculatedScore += Math.round((1 - Math.min(1, incorrectRatio)) * 5);
    } else {
        calculatedScore += 5;
    }

    const timeLimit = this.activeLevelConfig.time_limit;
    if (timeLimit && timeLimit > 0 && this.timeTaken > 0) {
        const timeUsedRatio = this.timeTaken / timeLimit;
        calculatedScore += Math.round((1 - Math.min(1, timeUsedRatio)) * 5);
    } else {
        calculatedScore += 5;
    }

    this.score = Math.min(Math.max(0, calculatedScore), maxOverallScore);

    if (this.score >= 18) {
        this.stars = 3;
    } else if (this.score >= 12) {
        this.stars = 2;
    } else if (this.score >= 6) {
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

  // AGREGADO: Nueva propiedad computada para la URL de la imagen de la pista
  get currentHintImage(): string | undefined {
    if (this.activeLevelConfig && this.activeLevelConfig.level_number === 3 && this.currentWordIndex < this.words.length) {
      return this.words[this.currentWordIndex].hint_image;
    }
    return undefined;
  }

  resetGame(): void {
    this.currentWordIndex = 0;
    this.guessedWordsCount = 0;
    this.score = 0;
    this.stars = 0;
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

  playWinSound(): void {
    try {
      if (this.winSound && this.winSound.nativeElement) {
        this.winSound.nativeElement.currentTime = 0;
        this.winSound.nativeElement.volume = 0.7;
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
        this.loseSound.nativeElement.currentTime = 0;
        this.loseSound.nativeElement.volume = 0.7;
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
    if (this.gameStatus === 'level-complete' || this.gameStatus === 'time-up' || this.gameStatus === 'lost') {
      return true;
    }
    
    return this.navigationGuardService.showNavigationConfirmDialog();
  }
}