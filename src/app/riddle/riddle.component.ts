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
  activeLevelConfig!: RiddleLevel; // '!' asegura a TypeScript que será inicializada

  private levelsSubscription!: Subscription; // Suscripción para desuscribirse al destruir el componente

  constructor(private router:Router,private riddleService: RiddleService) { }

  ngOnInit(): void {
    // Nos suscribimos al observable de niveles para obtener la configuración guardada.
    this.levelsSubscription = this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      // Buscamos el nivel que ha sido marcado como activo.
      const activeLevel = levels.find(lvl => lvl.isActive);

      if (activeLevel) {
        // Si encontramos un nivel activo, usamos su configuración.
        this.activeLevelConfig = activeLevel;
        // Mezclamos las palabras al inicio del nivel para que no siempre salgan en el mismo orden
        // Usamos spread operator para crear una copia y no modificar el array original del servicio directamente si no queremos.
        this.words = this.shuffleArray([...this.activeLevelConfig.words]);
        this.initializeGame(); // Inicializamos el juego con la configuración del nivel activo.
      } else {
        // Si no hay ningún nivel activo, mostramos un mensaje de error y deshabilitamos el juego.
        this.gameStatus = 'lost'; // O un estado más apropiado si no hay nivel activo
        this.message = 'No hay ningún nivel activo. Por favor, activa un nivel en la configuración del docente.';
        this.words = []; // Aseguramos que no haya palabras activas
        this.secretWord = '';
        this.displayWord = '';
        console.warn('Ningún nivel está activo.');
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
    // Se utiliza activeLevelConfig.words_level para saber cuántas palabras del arreglo `words` se deben jugar.
    if (this.words.length > 0 && this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
      this.secretWord = this.words[this.currentWordIndex].word.toUpperCase();
      this.updateDisplayWord();
    } else {
      // Si no hay suficientes palabras configuradas para el nivel, o se terminó el arreglo de palabras.
      this.gameStatus = 'level-complete'; // Consideramos el nivel como "terminado" si no hay más palabras para jugar
      this.calculateStars(); // Calcula las estrellas con las palabras que se lograron adivinar
      this.message = 'No hay suficientes palabras disponibles para el nivel configurado. Por favor, añade más palabras.';
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
    // No hacer nada si el juego no está en estado "playing" o la letra ya fue adivinada.
    if (this.gameStatus !== 'playing' || this.guessedLetters.has(letter)) {
      return;
    }

    this.guessedLetters.add(letter); // Agrega la letra a las adivinadas

    if (this.secretWord.includes(letter)) {
      this.updateDisplayWord(); // Si es correcta, actualiza la palabra mostrada
    } else {
      this.incorrectGuesses++; // Si es incorrecta, incrementa los intentos fallidos para la palabra actual
    }

    this.checkGameStatus(); // Verifica el estado del juego después de cada intento
  }

  /**
   * Verifica si el juego ha terminado para la palabra actual (ganada o perdida)
   * o si el nivel completo ha sido finalizado.
   */
  checkGameStatus(): void {
    if (this.displayWord.replace(/ /g, '') === this.secretWord) {
      // La palabra actual fue adivinada correctamente
      this.gameStatus = 'won'; // Establece temporalmente a 'won' para la retroalimentación visual
      this.message = '¡Correcto!';

      this.guessedWordsCount++; // Incrementa el contador de palabras adivinadas
      this.score++; // Incrementa la puntuación general
      this.totalIncorrectGuessesMade += this.incorrectGuesses; // **ACTUALIZACIÓN:** Suma los intentos incorrectos de esta palabra al total del nivel

      // Comprueba si aún quedan palabras por adivinar en el nivel según la configuración
      if (this.guessedWordsCount < this.activeLevelConfig.words_level) {
        this.currentWordIndex++; // Prepara la siguiente palabra
        setTimeout(() => {
          this.initializeGame(); // Inicia el proceso para la siguiente palabra
        }, 1500); // Pequeño retraso para que el usuario vea el mensaje "Correcto"
      } else {
        // Todas las palabras del nivel fueron adivinadas
        this.gameStatus = 'level-complete';
        this.calculateStars(); // Calcula las estrellas al finalizar el nivel
        this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
      }

    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      // Se agotaron los intentos para la palabra actual
      this.gameStatus = 'lost'; // Establece temporalmente a 'lost' para la retroalimentación visual
      this.message = `¡Oh no! Has perdido esta palabra.`;

      this.totalIncorrectGuessesMade += this.maxIncorrectGuesses; // **ACTUALIZACIÓN:** Suma todos los intentos posibles de esta palabra al total del nivel (ya que se perdieron)
      this.currentWordIndex++; // Pasa a la siguiente palabra

      setTimeout(() => {
        // Verifica si todavía hay palabras para jugar en el nivel
        // currentWordIndex < this.words.length: si el array de palabras aún tiene elementos
        // currentWordIndex < this.activeLevelConfig.words_level: si no hemos excedido la cantidad de palabras a jugar para este nivel
        if (this.currentWordIndex < this.words.length && this.currentWordIndex < this.activeLevelConfig.words_level) {
          this.initializeGame(); // Inicia el proceso para la siguiente palabra
        } else {
          // Si no quedan más palabras por jugar o se alcanzó el límite de palabras del nivel, finaliza el nivel.
          this.gameStatus = 'level-complete';
          this.calculateStars(); // Calcula las estrellas al finalizar el nivel
          if (this.guessedWordsCount === 0) {
            this.message = 'Has terminado el nivel, pero no adivinaste ninguna palabra.';
          } else {
            this.message = `¡Nivel ${this.activeLevelConfig.level_name} completado!`;
          }
        }
      }, 2000); // 2 segundos para que el usuario vea el mensaje "Has perdido"
    }
  }

  /**
   * Calcula la cantidad de estrellas en base a las palabras adivinadas y la eficiencia de los intentos.
   * Puedes ajustar los umbrales y la lógica según tu criterio para definir 0, 1, 2 o 3 estrellas.
   */
  calculateStars(): void {
    if (this.activeLevelConfig.words_level === 0) {
      this.stars = 0;
      return;
    }

    const wordsGuessedPercentage = (this.guessedWordsCount / this.activeLevelConfig.words_level) * 100;

    // Calcula el total de intentos posibles si todas las palabras se jugaran hasta el final.
    const totalPossibleAttemptsInLevel = this.activeLevelConfig.words_level * this.activeLevelConfig.max_intents;

    let incorrectGuessesEfficiency = 0;
    if (totalPossibleAttemptsInLevel > 0) {
      // Calcula la eficiencia de los intentos incorrectos:
      // Un porcentaje bajo de intentos incorrectos significa alta eficiencia.
      incorrectGuessesEfficiency = (this.totalIncorrectGuessesMade / totalPossibleAttemptsInLevel) * 100;
    }

    // Lógica para asignar estrellas:
    // 3 Estrellas: Todas las palabras adivinadas y muy pocos errores.
    if (wordsGuessedPercentage === 100 && incorrectGuessesEfficiency <= 20) { // Menos del 20% de los intentos totales fueron incorrectos
      this.stars = 3;
    }
    // 2 Estrellas: Alto porcentaje de palabras adivinadas con errores moderados.
    else if (wordsGuessedPercentage >= 80 && incorrectGuessesEfficiency <= 50) { // Más del 80% de palabras y menos del 50% de errores
      this.stars = 2;
    }
    // 1 Estrella: Porcentaje decente de palabras adivinadas.
    else if (wordsGuessedPercentage >= 50) { // Más del 50% de palabras adivinadas
      this.stars = 1;
    }
    // 0 Estrellas: Bajo rendimiento general.
    else {
      this.stars = 0;
    }
  }

  /**
   * Obtiene la pista para la palabra secreta actual (solo para Nivel 3).
   * @returns La pista de la palabra actual, o undefined si no hay.
   */
  get currentHint(): string | undefined {
    // Comprueba si activeLevelConfig existe y es Nivel 3, y si la palabra actual tiene una pista.
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
    this.currentWordIndex = 0; // Vuelve a la primera palabra
    this.guessedWordsCount = 0; // Reinicia el contador de palabras adivinadas
    this.score = 0; // Reinicia el puntaje numérico
    this.stars = 0; // Reinicia las estrellas
    this.totalIncorrectGuessesMade = 0; // **IMPORTANTE:** Reinicia el contador de intentos incorrectos del nivel

    // Vuelve a mezclar las palabras para una nueva partida, para que no salgan en el mismo orden
    this.words = this.shuffleArray([...this.activeLevelConfig.words]);
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