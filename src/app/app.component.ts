import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'juegos';
  
  @ViewChild('backgroundMusic') backgroundMusic!: ElementRef<HTMLAudioElement>;
  
  isPlaying: boolean = false;
  private audioElement: HTMLAudioElement | null = null;

  ngOnInit() {
    // Inicializar el estado del audio
    this.isPlaying = false;
  }

  ngAfterViewInit() {
    // Obtener referencia al elemento de audio
    this.audioElement = this.backgroundMusic.nativeElement;
    
    // Configurar el audio
    if (this.audioElement) {
      this.audioElement.volume = 0.5; // Volumen al 50%
      this.audioElement.loop = true; // Reproducción en loop
      
      // Manejar eventos del audio
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
      });
      
      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
      });
      
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
      });
    }
  }

  toggleMusic() {
    if (!this.audioElement) return;
    
    try {
      if (this.isPlaying) {
        this.audioElement.pause();
      } else {
        // Intentar reproducir el audio
        const playPromise = this.audioElement.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Reproducción iniciada exitosamente
              console.log('Música de fondo iniciada');
            })
            .catch(error => {
              // Error al reproducir (probablemente restricción de autoplay)
              console.log('No se pudo reproducir automáticamente:', error);
              // Mostrar mensaje al usuario sobre la restricción de autoplay
              alert('Para escuchar la música de fondo, haz clic en el botón de play. Los navegadores requieren interacción del usuario para reproducir audio.');
            });
        }
      }
    } catch (error) {
      console.error('Error al controlar el audio:', error);
    }
  }
}
