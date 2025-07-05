import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Registrar los plugins necesarios
    Chart.register();
  }

  // Gráfico 1: Barras verticales - Rendimiento por Grado
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Rendimiento Promedio por Grado'
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Primer Grado', 'Segundo Grado', 'Tercer Grado'],
    datasets: [
      {
        data: [85, 78, 92],
        label: 'Puntaje Promedio',
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 1
      }
    ]
  };

  // Gráfico 2: Barras verticales - Juegos más Jugados
  public barChartOptions2: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Juegos más Jugados'
      }
    }
  };

  public barChartType2: ChartType = 'bar';
  public barChartData2: ChartData<'bar'> = {
    labels: ['Rompecabezas', 'Memoria', 'Acertijos'],
    datasets: [
      {
        data: [45, 32, 23],
        label: 'Partidas Jugadas',
        backgroundColor: ['#4BC0C0', '#FF9F40', '#9966FF'],
        borderColor: ['#4BC0C0', '#FF9F40', '#9966FF'],
        borderWidth: 1
      }
    ]
  };

  // Gráfico 3: Circular/Pie - Distribución de Estudiantes
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribución de Estudiantes por Grado'
      }
    }
  };

  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: ['Primer Grado', 'Segundo Grado', 'Tercer Grado'],
    datasets: [
      {
        data: [35, 28, 37],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 2
      }
    ]
  };

  // Gráfico 4: Línea - Progreso Semanal
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Progreso Semanal - Puntaje Promedio'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'],
    datasets: [
      {
        data: [65, 72, 78, 81, 85, 88],
        label: 'Puntaje Promedio',
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

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