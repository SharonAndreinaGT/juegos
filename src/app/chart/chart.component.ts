import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent {

  constructor(private router: Router) {}

  /**
   * Navega al menú principal
   */
  navigateToMain(): void {
    this.router.navigate(['/main']);
  }

  /**
   * Navega a la vista de calificación de estudiantes
   */
  navigateToGradeStudents(grade: string): void {
    const routeMap: { [key: string]: string } = {
      'first': 'firstGrade',
      'second': 'secondGrade', 
      'third': 'thirdGrade'
    };
    
    const route = routeMap[grade];
    if (route) {
      this.router.navigate([route]);
    }
  }

  /**
   * Navega a la vista de progreso
   */
  navigateToProgress(): void {
    this.router.navigate(['/progress']);
  }

  /**
   * Navega a la configuración de juegos
   */
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Navega a la vista de reportes
   */
  navigateToReports(): void {
    this.router.navigate(['/report']);
  }

  /**
   * Navega al módulo Chart
   */
  navigateToChart(): void {
    this.router.navigate(['/chart']);
  }

  /**
   * Navega a la página de bienvenida
   */
  navigateToWelcome(): void {
    this.router.navigate(['/welcome']);
  }
} 