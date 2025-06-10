import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  constructor(private router: Router) {}

  navigateTo(view: string) {
    this.router.navigate([view]);
  }
}
