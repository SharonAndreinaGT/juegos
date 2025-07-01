import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RiddleLevel } from '../riddle.model';
import { RiddleService } from '../riddle.service';
import { Subscription } from 'rxjs';

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
  
  // Propiedad para almacenar la configuración del nivel activo, no un número de nivel.
  activeLevelConfig!: RiddleLevel; 

  private levelsSubscription!: Subscription;

  constructor(private riddleService: RiddleService) { }

  ngOnInit(): void {
    // 1. Nos suscribimos al observable de niveles para obtener la configuración guardada.
    this.levelsSubscription = this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      // 2. Buscamos el nivel que ha sido marcado como activo.
      const activeLevel = levels.find(lvl => lvl.isActive);
      
      if (activeLevel) {
        // Si encontramos un nivel activo, usamos su configuración.
        this.activeLevelConfig = activeLevel;
        // 3. Inicializamos el juego con la configuración del nivel activo.
        this.initializeGame();
      } else {
        // Si no hay ningún nivel activo, mostramos un mensaje de error.
        this.gameStatus = 'lost';
        this.message = 'No hay ningún nivel activo. Por favor, activa un nivel en la configuración del docente.';
        this.words = []; // Aseguramos que no haya palabras
        this.secretWord = '';
        this.displayWord = '';
        console.warn('Ningún nivel está activo.');
      }
    });
  }

  ngOnDestroy(): void {
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
    if (this.gameStatus === 'playing' && key.length === 1 && key >= 'A' && key <= 'Z') {
      this.checkGuess(key);
    }
  }

  /**
   * Inicializa un nuevo juego con la configuración del nivel activo.
   */
  initializeGame(): void {
    // Reiniciamos los estados del juego.
    this.guessedLetters.clear();
    this.incorrectGuesses = 0;
    this.gameStatus = 'playing';
    this.message = '';
    
    // Configuramos el juego con los valores del nivel activo.
    this.maxIncorrectGuesses = this.activeLevelConfig.max_intents;
    
    // Mapeamos los objetos de palabras a un array de strings.
    this.words = this.activeLevelConfig.words.map(wordObj => wordObj.word);

    // Seleccionamos una palabra al azar si hay palabras disponibles.
    if (this.words && this.words.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.words.length);
      this.secretWord = this.words[randomIndex].toUpperCase();
      this.updateDisplayWord();
    } else {
      // Si no hay palabras, mostramos un mensaje de error.
      this.secretWord = '';
      this.displayWord = 'NO HAY PALABRAS CONFIGURADAS';
      this.gameStatus = 'lost';
      this.message = 'No hay palabras disponibles para el nivel activo. Por favor, añade palabras en la configuración.';
      console.warn('No hay palabras disponibles para el nivel activo', this.activeLevelConfig.level_name);
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