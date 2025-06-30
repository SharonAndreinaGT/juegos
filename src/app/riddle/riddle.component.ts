import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RiddleLevel } from '../riddle.model';
import { RiddleService } from '../riddle.service';
import { Subscription } from 'rxjs'; // Import Subscription to manage the subscription

@Component({
  selector: 'app-riddle',
  templateUrl: './riddle.component.html',
  styleUrls: ['./riddle.component.css']
})
export class RiddleComponent implements OnInit, OnDestroy {
  // --- PROPIEDADES DEL JUEGO ---
  words: string[] = [];
  secretWord: string = '';
  displayWord: string = '';
  guessedLetters: Set<string> = new Set<string>();
  incorrectGuesses: number = 0;
  maxIncorrectGuesses: number = 7;
  gameStatus: 'playing' | 'won' | 'lost' = 'playing';
  message: string = '';
  currentLevel: number = 1;
  
  // Propiedad para almacenar la configuración del nivel actual, obtenida del servicio
  currentLevelConfig!: RiddleLevel; 
  private levelsSubscription!: Subscription; // Property to hold the subscription

  constructor(private riddleService: RiddleService) { }

  ngOnInit(): void {
    // 1. Nos suscribimos al observable de niveles del servicio.
    // Guardamos la suscripción en una propiedad para poder desuscribirnos en ngOnDestroy.
    this.levelsSubscription = this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      // 2. Buscamos la configuración del nivel actual.
      this.currentLevelConfig = levels.find(lvl => lvl.level_number === this.currentLevel) || 
        { level_number: this.currentLevel, level_name: 'Nivel', max_intents: 5, words_level: 5, words: [] };

      // 3. Actualizamos las propiedades del juego con la nueva configuración.
      this.maxIncorrectGuesses = this.currentLevelConfig.max_intents;
      
      // Mapeamos el array de objetos { word: '...' } a un array de strings ['...']
      this.words = this.currentLevelConfig.words.map(wordObj => wordObj.word);

      // 4. Inicializamos el juego con la nueva configuración.
      this.initializeGame();
    });
  }
  
  ngOnDestroy(): void {
    // Es crucial desuscribirse para evitar fugas de memoria.
    if (this.levelsSubscription) {
      this.levelsSubscription.unsubscribe();
    }
  }

  /**
   * Cambia el nivel de juego y reinicia el juego con la nueva configuración.
   * Este método ahora obtiene la configuración a través del servicio sin acceder a `.value`.
   * @param level El número del nivel al que se desea cambiar (1, 2 o 3).
   */
  changeLevel(level: number): void {
    // Actualizamos el nivel actual.
    this.currentLevel = level;
    // La suscripción en ngOnInit se encargará de actualizar la configuración automáticamente.
    // Para forzar la actualización, podemos volver a inicializar el juego.
    // Simplemente llamamos a initializeGame() para que use el nuevo valor de this.currentLevel
    // que será capturado por la suscripción al servicio.
    // Esto asegura que la lógica de inicialización se ejecute con la configuración del nuevo nivel.
    this.initializeGame();
  }
  
  /**
   * Escucha eventos de teclado en todo el documento para la entrada de letras.
   * @param event El evento de teclado.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key.toUpperCase();

    if (this.gameStatus === 'playing' && key.length === 1 && key >= 'A' && key <= 'Z') {
      this.checkGuess(key);
    }
  }

  /**
   * Inicializa un nuevo juego:
   * - Reinicia contadores y estados.
   * - Selecciona una nueva palabra secreta del array de palabras del nivel actual.
   * - Prepara la palabra a mostrar con guiones bajos.
   */
  initializeGame(): void {
    this.guessedLetters.clear();
    this.incorrectGuesses = 0;
    this.gameStatus = 'playing';
    this.message = '';

    if (this.words && this.words.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.words.length);
      this.secretWord = this.words[randomIndex].toUpperCase();
      this.updateDisplayWord();
    } else {
      this.secretWord = '';
      this.displayWord = 'NO HAY PALABRAS CONFIGURADAS';
      this.gameStatus = 'lost';
      this.message = 'Por favor, configura palabras para este nivel en la sección de Ajustes.';
      console.warn('No hay palabras disponibles para el nivel', this.currentLevelConfig.level_name);
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
   * Verifica si el juego ha terminado (ganado o perdido).
   */
  checkGameStatus(): void {
    if (this.displayWord.replace(/ /g, '') === this.secretWord) {
      this.gameStatus = 'won';
      this.message = '¡Felicidades! ¡Has adivinado la palabra!';
    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      this.gameStatus = 'lost';
      this.message = `¡Oh no! Has perdido. La palabra era: ${this.secretWord}`;
    }
  }
}