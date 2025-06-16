import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-memory-card',
  templateUrl: './memory-card.component.html',
  styleUrls: ['./memory-card.component.scss']
})
export class MemoryCardComponent {
  @Input() card: any; // La data de la carta (e.g., { id: 1, value: 'A', image: 'url', isFlipped: false, isMatched: false })
  @Output() cardClick = new EventEmitter<any>(); // Evento que emite cuando la carta es clicada

  constructor() { }

  onCardClick(): void {
    if (!this.card.isFlipped && !this.card.isMatched) {
      this.cardClick.emit(this.card);
    }
  }
}
