import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-riddle',
  templateUrl: './riddle.component.html',
  styleUrls: ['./riddle.component.css']
})
export class RiddleComponent implements OnInit {
  // Lista de palabras para el juego.
  // Aquí es donde en el futuro se conectaría con Directus para obtener palabras por nivel.
  // Por ahora, usamos una lista estática.
  words: string[] = [
    'ANGULAR', 'PROGRAMACION', 'DESARROLLO', 'COMPONENTE', 'INTERFAZ',
    'SERVICIOS', 'MODULO', 'ROUTING', 'DIRECTIVA', 'OBSERVABLE',
    'TYPESCRIPT', 'JAVASCRIPT', 'HTML', 'CSS', 'APLICACION',
    'FRONTEND', 'BACKEND', 'DATABASE', 'SEGURIDAD', 'ALGORITMO',
    'INTELIGENCIA', 'ARTIFICIAL', 'REDES', 'DATOS', 'CLOUD'
  ];

  secretWord: string = ''; // La palabra a adivinar
  displayWord: string = ''; // La palabra mostrada al usuario (con guiones bajos)
  guessedLetters: Set<string> = new Set<string>(); // Conjunto de letras ya adivinadas
  incorrectGuesses: number = 0; // Contador de suposiciones incorrectas
  maxIncorrectGuesses: number = 7; // Número máximo de suposiciones incorrectas permitidas
  gameStatus: 'playing' | 'won' | 'lost' = 'playing'; // Estado actual del juego
  message: string = ''; // Mensaje para el usuario (ganó, perdió, etc.)

  constructor() { }

  ngOnInit(): void {
    this.initializeGame(); // Inicializa el juego al cargar el componente
  }

  /**
   * Escucha eventos de teclado en todo el documento para la entrada de letras.
   * @param event El evento de teclado.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Convierte la tecla presionada a mayúscula para coincidir con el formato de las palabras.
    const key = event.key.toUpperCase();

    // Verifica si la tecla presionada es una letra del alfabeto.
    // Solo procesa la entrada si el juego está en estado 'playing' y la letra es válida.
    if (this.gameStatus === 'playing' && key.length === 1 && key >= 'A' && key <= 'Z') {
      this.checkGuess(key);
    }
  }

  /**
   * Inicializa un nuevo juego:
   * - Reinicia contadores y estados.
   * - Selecciona una nueva palabra secreta.
   * - Prepara la palabra a mostrar con guiones bajos.
   */
  initializeGame(): void {
    this.guessedLetters.clear(); // Limpia las letras adivinadas
    this.incorrectGuesses = 0; // Reinicia las suposiciones incorrectas
    this.gameStatus = 'playing'; // Establece el estado del juego a 'playing'
    this.message = ''; // Limpia el mensaje

    // Selecciona una palabra secreta al azar de la lista
    const randomIndex = Math.floor(Math.random() * this.words.length);
    this.secretWord = this.words[randomIndex].toUpperCase(); // Convierte a mayúsculas

    this.updateDisplayWord(); // Actualiza la palabra a mostrar inicialmente (todo con guiones bajos)

    // TODO: Integración con Directus:
    // Aquí podrías llamar a un servicio para cargar las palabras
    // basadas en el nivel actual del juego o la configuración del administrador.
    // Ejemplo:
    // this.wordService.getWordsByLevel(currentLevel).subscribe(words => {
    //   this.words = words;
    //   this.secretWord = this.words[Math.floor(Math.random() * this.words.length)].toUpperCase();
    //   this.updateDisplayWord();
    // });
  }

  /**
   * Actualiza la palabra que se muestra al usuario.
   * Remplaza las letras no adivinadas con guiones bajos.
   */
  updateDisplayWord(): void {
    this.displayWord = this.secretWord
      .split('') // Divide la palabra secreta en un array de caracteres
      .map(letter => (this.guessedLetters.has(letter) ? letter : '_')) // Si la letra fue adivinada, la muestra; de lo contrario, muestra un guion bajo
      .join(' '); // Une los caracteres con un espacio para una mejor lectura
  }

  /**
   * Maneja la suposición de una letra por parte del usuario.
   * @param letter La letra adivinada por el usuario.
   */
  checkGuess(letter: string): void {
    // Si el juego no está activo o la letra ya fue adivinada, no hace nada
    if (this.gameStatus !== 'playing' || this.guessedLetters.has(letter)) {
      return;
    }

    this.guessedLetters.add(letter); // Añade la letra al conjunto de letras adivinadas

    if (this.secretWord.includes(letter)) {
      this.updateDisplayWord(); // Si la letra está en la palabra secreta, actualiza la palabra mostrada
    } else {
      this.incorrectGuesses++; // Si la letra no está, incrementa el contador de suposiciones incorrectas
    }

    this.checkGameStatus(); // Verifica el estado del juego después de cada suposición
  }

  /**
   * Verifica si el juego ha terminado (ganado o perdido).
   */
  checkGameStatus(): void {
    if (this.displayWord.replace(/ /g, '') === this.secretWord) {
      this.gameStatus = 'won'; // Si la palabra mostrada coincide con la secreta, el jugador ha ganado
      this.message = '¡Felicidades! ¡Has adivinado la palabra!';
    } else if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
      this.gameStatus = 'lost'; // Si las suposiciones incorrectas alcanzan el límite, el jugador ha perdido
      this.message = `¡Oh no! Has perdido. La palabra era: ${this.secretWord}`;
    }
  }
}
