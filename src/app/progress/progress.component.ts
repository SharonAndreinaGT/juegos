import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css'
})
export class ProgressComponent {
  constructor(private router: Router) {}

  navigateTo(view: string) {
    this.router.navigate([view]);
  }
}
