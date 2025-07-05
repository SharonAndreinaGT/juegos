import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RiddleLevel, RiddleWord } from '../riddle.model';
import { RiddleService } from '../riddle.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-riddle',
  templateUrl: './riddle.component.html',
  styleUrls: ['./riddle.component.css']
})
export class RiddleComponent implements OnInit, OnDestroy {
  // --- PROPIEDADES DEL JUEGO ---
  words: RiddleWord[] = []; // Almacena las palabras del nivel activo, incluyendo la pista
  secretWord: string = '';
  displayWord: string = '';
  guessedLetters: Set<string> = new Set<string>();
  incorrectGuesses: number = 0; // Intentos incorrectos para la palabra actual
  maxIncorrectGuesses: number = 7; // Valor por defecto, se sobrescribe con la configuración del nivel
  gameStatus: 'playing' | 'won' | 'lost' | 'level-complete' = 'playing'; // Estados del juego
  message: string = ''; // Mensajes informativos para el usuario

  // --- PROPIEDADES PARA EL PROGRESO Y PUNTUACIÓN ---
  currentWordIndex: number = 0; // Índice de la palabra actual en el array 'words'
  guessedWordsCount: number = 0; // Contador de palabras adivinadas correctamente en el nivel
  score: number = 0; // Puntuación numérica general del nivel
  stars: number = 0; // Estrellas para la puntuación cualitativa
  totalIncorrectGuessesMade: number = 0; // Acumula los intentos incorrectos de todas las palabras del nivel

  // Propiedad para almacenar la configuración del nivel activo
  // Inicializa con un objeto por defecto para que las propiedades no sean 'undefined'
  // mientras se esperan los datos del servicio.
  activeLevelConfig: RiddleLevel = {
    id: null, // Asigna un valor inicial, aunque sea nulo
    level_number: 0,
    level_name: 'Cargando Configuración...',
    max_intents: 7, // Valor seguro para evitar errores en el template antes de la carga real
    words_level: 0,
    words: [],
    isActive: false
  };

  private levelsSubscription!: Subscription; // Suscripción para desuscribirse al destruir el componente

  constructor(private router: Router, private riddleService: RiddleService) { }

  ngOnInit(): void {
    // Nos suscribimos al observable de niveles para obtener la configuración guardada.
    this.levelsSubscription = this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      // Buscamos el nivel que ha sido marcado como activo.
      const activeLevel = levels.find(lvl => lvl.isActive);

      if (activeLevel) {
        this.activeLevelConfig = activeLevel;
        // Solo inicializa el juego si el nivel activo tiene palabras
        if (this.activeLevelConfig.words && this.activeLevelConfig.words.length > 0 && this.activeLevelConfig.words_level > 0) {
          // Mezclamos las palabras al inicio del nivel para que no siempre salgan en el mismo orden
          this.words = this.shuffleArray([...this.activeLevelConfig.words]);
          this.resetGame(); // Llama a resetGame para inicializar el juego con la nueva configuración
        } else {
          this.gameStatus = 'lost'; // O un estado más apropiado
          this.message = 'El nivel activo no tiene palabras o la cantidad de palabras por nivel es cero. Por favor, configura el nivel.';
          this.words = []; // Aseguramos que no haya palabras activas
          this.secretWord = '';
          this.displayWord = '';
          console.warn('El nivel activo no tiene palabras o words_level es 0.');
        }
      } else {
        // Si no hay ningún nivel activo, mostramos un mensaje de error y deshabilitamos el juego.
        this.gameStatus = 'lost';
        this.message = 'No hay ningún nivel activo. Por favor, activa un nivel en la configuración del docente.';
        this.words = [];
        this.secretWord = '';
        this.displayWord = '';
        console.warn('Ningún nivel está activo.');

        // Restablece activeLevelConfig a un estado seguro para evitar errores en el template
        this.activeLevelConfig = {
          id: null,
          level_number: 0,
          level_name: 'Ningún Nivel Activo',
          max_intents: 7,
          words_level: 0,
          words: [],
          isActive: false
        };
      }
    });
  }

  ngOnDestroy(): void {
    // Es crucial desuscribirse para evitar fugas de memoria.
    if (this.levelsSubscription) {
      this.levelsSubscription.unsubscribe();
    }
  }

  /**
   * Escucha eventos de teclado en todo el documento para la entrada de letras.
   * @param event El evento de teclado.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    // Solo procesa la entrada si el juego está en curso y la tecla es una letra del alfabeto
    if (this.gameStatus === 'playing' && key.length === 1 && key >= 'A' && key <= 'Z') {
      this.checkGuess(key);
    }
  }

  /**
   * Inicializa un nuevo juego o la siguiente palabra si el nivel no ha terminado.
   */
  initializeGame(): void {
    // Asegúrate de que activeLevelConfig tiene un valor válido antes de usarlo
    if (!this.activeLevelConfig || this.activeLevelConfig.words_level === 0 || !this.activeLevelConfig.words || this.activeLevelConfig.words.length === 0) {
      this.gameStatus = 'lost';
      this.message = 'Configuración del nivel inválida o sin palabras para jugar.';
      return;
    }

    // Si ya adivinamos todas las palabras requeridas para el nivel, marcamos el nivel como completo.
    if (this.guessedWordsCount >= this.activeLevelConfig.words_level) {
      this.gameStatus = 'level-complete';
      this.calculateStars(); // Calcula las estrellas al finalizar el nivel
      this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
      return;
    }

    // Reiniciamos los estados para la nueva palabra
    this.guessedLetters.clear();
    this.incorrectGuesses = 0; // Reinicia intentos para la palabra actual
    this.gameStatus = 'playing';
    this.message = '';

    // Configuramos el número máximo de intentos con el valor del nivel activo.
    this.maxIncorrectGuesses = this.activeLevelConfig.max_intents;

    // Seleccionamos la siguiente palabra si hay palabras disponibles y no hemos excedido el límite del nivel
    if (this.words.length > 0 && this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
      this.secretWord = this.words[this.currentWordIndex].word.toUpperCase();
      this.updateDisplayWord();
    } else {
      // Si no hay suficientes palabras configuradas para el nivel, o se terminó el arreglo de palabras.
      this.gameStatus = 'level-complete'; // Consideramos el nivel como "terminado"
      this.calculateStars();
      this.message = 'No hay suficientes palabras disponibles para el nivel configurado o se han jugado todas las palabras.';
      console.error('Error: No hay suficientes palabras para el nivel configurado o se ha excedido el límite de palabras del nivel.');
    }
  }

  /**
   * Actualiza la palabra que se muestra al usuario.
   * Remplaza las letras no adivinadas con guiones bajos.
   */
  updateDisplayWord(): void {
    this.displayWord = this.secretWord
      .split('')
      .map(letter => (this.guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  }

  /**
   * Maneja la suposición de una letra por parte del usuario.
   * @param letter La letra adivinada por el usuario.
   */
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

  /**
   * Verifica si el juego ha terminado para la palabra actual (ganada o perdida)
   * o si el nivel completo ha sido finalizado.
   */
  checkGameStatus(): void {
    if (this.displayWord.replace(/ /g, '') === this.secretWord) {
      // La palabra actual fue adivinada correctamente
      this.gameStatus = 'won';
      this.message = '¡Correcto!';

      this.guessedWordsCount++;
      this.score++;
      this.totalIncorrectGuessesMade += this.incorrectGuesses;

      if (this.guessedWordsCount < this.activeLevelConfig.words_level) {
        this.currentWordIndex++;
        setTimeout(() => {
          this.initializeGame();
        }, 1500);
      } else {
        this.gameStatus = 'level-complete';
        this.calculateStars();
        this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
      }

    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      // Se agotaron los intentos para la palabra actual
      this.gameStatus = 'lost';
      this.message = `¡Oh no! Has perdido esta palabra.`;

      this.totalIncorrectGuessesMade += this.maxIncorrectGuesses;
      this.currentWordIndex++;

      setTimeout(() => {
        if (this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
          this.initializeGame();
        } else {
          this.gameStatus = 'level-complete';
          this.calculateStars();
          if (this.guessedWordsCount === 0) {
            this.message = 'Has terminado el nivel, pero no adivinaste ninguna palabra.';
          } else {
            this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
          }
        }
      }, 2000);
    }
  }

  /**
   * Calcula la cantidad de estrellas en base a las palabras adivinadas y la eficiencia de los intentos.
   */
  calculateStars(): void {
    if (this.activeLevelConfig.words_level === 0) {
      this.stars = 0;
      return;
    }

    const wordsGuessedPercentage = (this.guessedWordsCount / this.activeLevelConfig.words_level) * 100;

    const totalPossibleAttemptsInLevel = this.activeLevelConfig.words_level * this.activeLevelConfig.max_intents;

    let incorrectGuessesEfficiency = 0;
    if (totalPossibleAttemptsInLevel > 0) {
      incorrectGuessesEfficiency = (this.totalIncorrectGuessesMade / totalPossibleAttemptsInLevel) * 100;
    }

    if (wordsGuessedPercentage === 100 && incorrectGuessesEfficiency <= 20) {
      this.stars = 3;
    }
    else if (wordsGuessedPercentage >= 80 && incorrectGuessesEfficiency <= 50) {
      this.stars = 2;
    }
    else if (wordsGuessedPercentage >= 50) {
      this.stars = 1;
    }
    else {
      this.stars = 0;
    }
  }

  /**
   * Obtiene la pista para la palabra secreta actual (solo para Nivel 3).
   * @returns La pista de la palabra actual, o undefined si no hay.
   */
  get currentHint(): string | undefined {
    if (this.activeLevelConfig && this.activeLevelConfig.level_number === 3 && this.currentWordIndex < this.words.length) {
      return this.words[this.currentWordIndex].hint;
    }
    return undefined;
  }

  /**
   * Reinicia el juego completamente para el nivel actual.
   * Vuelve a la primera palabra y reinicia todos los contadores.
   */
  resetGame(): void {
    this.currentWordIndex = 0;
    this.guessedWordsCount = 0;
    this.score = 0;
    this.stars = 0;
    this.totalIncorrectGuessesMade = 0;

    // Vuelve a mezclar las palabras para una nueva partida (solo si ya tenemos palabras cargadas)
    if (this.activeLevelConfig.words && this.activeLevelConfig.words.length > 0) {
        this.words = this.shuffleArray([...this.activeLevelConfig.words]);
    } else {
        this.words = []; // Asegura que el array de palabras esté vacío si no hay configuración válida
        this.gameStatus = 'lost';
        this.message = 'No se puede reiniciar el juego: el nivel no tiene palabras configuradas.';
        return; // Detiene el reinicio si no hay palabras
    }
    this.initializeGame(); // Inicia una nueva partida
  }

  /**
   * Mezcla aleatoriamente un array utilizando el algoritmo de Fisher-Yates.
   * @param array El array a mezclar.
   * @returns El array mezclado.
   */
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
}