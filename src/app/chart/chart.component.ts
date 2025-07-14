// src/app/chart/chart.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // Importa ElementRef
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts'; // Asegúrate de que esto esté importado en tu AppModule
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { MemoryService } from '../memory.service';
import { RiddleService } from '../riddle.service';

// Importa jsPDF
import jsPDF from 'jspdf';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  // Referencias a los elementos <canvas> de los gráficos
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart2Canvas') barChart2Canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;


  totalEstudiantes: number | null = null;
  loadingEstudiantes = true;
  errorEstudiantes = false;

  totalPartidas: number | null = null;
  loadingPartidas = true;
  errorPartidas = false;

  promedioScore: number | null = null;
  loadingScore = true;
  errorScore = false;

  tiempoPromedio: string | null = null;
  loadingTiempo = true;
  errorTiempo = false;

  rendimientoPorGrado: { [grade: string]: number } = { first: 0, second: 0, third: 0 };
  loadingRendimiento = true;
  errorRendimiento = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService,
    private memoryService: MemoryService,
    private riddleService: RiddleService
  ) {}

  actualizarDistribucionPorGrado(countFirst: number, countSecond: number, countThird: number) {
    this.pieChartData = {
      ...this.pieChartData,
      datasets: [{
        ...this.pieChartData.datasets[0],
        data: [countFirst, countSecond, countThird]
      }]
    };
  }

  getDistribucionPorGrado() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        const users = response.data || [];
        const countFirst = users.filter((u: any) => u.grade === 'first').length;
        const countSecond = users.filter((u: any) => u.grade === 'second').length;
        const countThird = users.filter((u: any) => u.grade === 'third').length;
        this.actualizarDistribucionPorGrado(countFirst, countSecond, countThird);
      },
      error: () => {
        this.actualizarDistribucionPorGrado(0, 0, 0);
      }
    });
  }

  getProgresoMensual() {
    let allResults: { score: number, created_at: string }[] = [];
    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === 3) {
        // Agrupar por mes
        const monthMap: { [month: string]: number[] } = {};
        allResults.forEach(res => {
          if (typeof res.score === 'number' && res.created_at) {
            const date = new Date(res.created_at);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const key = `${year}-${month}`;
            if (!monthMap[key]) monthMap[key] = [];
            monthMap[key].push(res.score);
          }
        });
        // Depuración: muestra el agrupamiento por mes
        console.log('Agrupación por mes:', monthMap);

        // Ordenar meses
        const sortedMonths = Object.keys(monthMap).sort();
        // Calcular promedios
        let labels: string[] = [];
        let data: number[] = [];
        sortedMonths.forEach(month => {
          labels.push(month);
          const arr = monthMap[month];
          const promedio = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
          data.push(promedio);
          // Depuración: muestra el promedio de cada mes
          console.log(`Mes ${month}: scores =`, arr, 'promedio =', promedio);
        });
        // Incluir el mes actual aunque no tenga datos
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!labels.includes(currentMonth)) {
          labels.push(currentMonth);
          data.push(0);
        }
        // Actualizar gráfico
        this.lineChartData = {
          ...this.lineChartData,
          labels,
          datasets: [{
            ...this.lineChartData.datasets[0],
            data
          }]
        };
        // Depuración: muestra los datos finales del gráfico
        console.log('Labels:', labels, 'Data:', data);
      }
    };
    this.puzzleService.getAllPuzzleScoresWithDate().subscribe({
      next: (arr) => {
        allResults = allResults.concat(arr);
        onComplete();
      },
      error: () => onComplete()
    });
    this.memoryService.getAllMemoryScoresWithDate().subscribe({
      next: (arr) => {
        allResults = allResults.concat(arr);
        onComplete();
      },
      error: () => onComplete()
    });
    this.riddleService.getAllRiddleScoresWithDate().subscribe({
      next: (arr) => {
        allResults = allResults.concat(arr);
        onComplete();
      },
      error: () => onComplete()
    });
  }

  // Función auxiliar para obtener el número de semana ISO
  getWeekNumber(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Jueves en la semana decide el año
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  ngOnInit(): void {
    Chart.register(); // Asegúrate de que los controladores de Chart.js estén registrados
    this.getTotalEstudiantes();
    this.getTotalPartidas();
    this.getPromedioScore();
    this.getTiempoPromedio();
    this.getRendimientoPorGrado();
    this.getDistribucionPorGrado();
    this.getProgresoMensual();
  }

  getTotalEstudiantes() {
    this.loadingEstudiantes = true;
    this.errorEstudiantes = false;
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.totalEstudiantes = response.data.length;
        } else {
          this.totalEstudiantes = 0;
        }
        this.loadingEstudiantes = false;
      },
      error: (err) => {
        this.errorEstudiantes = true;
        this.loadingEstudiantes = false;
        this.totalEstudiantes = null;
      }
    });
  }

  actualizarJuegosMasJugados(puzzleCount: number, memoryCount: number, riddleCount: number) {
    this.barChartData2 = {
      ...this.barChartData2,
      datasets: [{
        ...this.barChartData2.datasets[0],
        data: [puzzleCount, memoryCount, riddleCount]
      }]
    };
  }

  getTotalPartidas() {
    this.loadingPartidas = true;
    this.errorPartidas = false;
    let total = 0;
    let completed = 0;
    let puzzleCount = 0;
    let memoryCount = 0;
    let riddleCount = 0;
    const onComplete = () => {
      completed++;
      if (completed === 3) {
        this.totalPartidas = puzzleCount + memoryCount + riddleCount;
        this.loadingPartidas = false;
        this.actualizarJuegosMasJugados(puzzleCount, memoryCount, riddleCount);
      }
    };
    this.puzzleService.getTotalPuzzleResults().subscribe({
      next: (count) => {
        total += count;
        puzzleCount = count;
        onComplete();
      },
      error: () => {
        this.errorPartidas = true;
        onComplete();
      }
    });
    this.memoryService.getTotalMemoryResults().subscribe({
      next: (count) => {
        total += count;
        memoryCount = count;
        onComplete();
      },
      error: () => {
        this.errorPartidas = true;
        onComplete();
      }
    });
    this.riddleService.getTotalRiddleResults().subscribe({
      next: (count) => {
        total += count;
        riddleCount = count;
        onComplete();
      },
      error: () => {
        this.errorPartidas = true;
        onComplete();
      }
    });
  }

  getPromedioScore() {
    this.loadingScore = true;
    this.errorScore = false;
    let scores: number[] = [];
    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === 3) {
        if (scores.length > 0) {
          const sum = scores.reduce((a, b) => a + b, 0);
          this.promedioScore = Math.round((sum / scores.length) * 100) / 100;
        } else {
          this.promedioScore = 0;
        }
        this.loadingScore = false;
      }
    };
    this.puzzleService.getAllPuzzleScores().subscribe({
      next: (arr) => {
        scores = scores.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorScore = true;
        onComplete();
      }
    });
    this.memoryService.getAllMemoryScores().subscribe({
      next: (arr) => {
        scores = scores.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorScore = true;
        onComplete();
      }
    });
    this.riddleService.getAllRiddleScores().subscribe({
      next: (arr) => {
        scores = scores.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorScore = true;
        onComplete();
      }
    });
  }

  getTiempoPromedio() {
    this.loadingTiempo = true;
    this.errorTiempo = false;
    let tiempos: number[] = [];
    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === 3) {
        if (tiempos.length > 0) {
          const sum = tiempos.reduce((a, b) => a + b, 0);
          const avg = sum / tiempos.length;
          // Formatear a minutos y segundos
          const min = Math.floor(avg / 60);
          const sec = Math.round(avg % 60);
          this.tiempoPromedio = `${min} min ${sec} s`;
        } else {
          this.tiempoPromedio = '0 min';
        }
        this.loadingTiempo = false;
      }
    };
    this.puzzleService.getAllPuzzleTimes().subscribe({
      next: (arr) => {
        tiempos = tiempos.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorTiempo = true;
        onComplete();
      }
    });
    this.memoryService.getAllMemoryTimes().subscribe({
      next: (arr) => {
        tiempos = tiempos.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorTiempo = true;
        onComplete();
      }
    });
    this.riddleService.getAllRiddleTimes().subscribe({
      next: (arr) => {
        tiempos = tiempos.concat(arr.filter(s => typeof s === 'number'));
        onComplete();
      },
      error: () => {
        this.errorTiempo = true;
        onComplete();
      }
    });
  }

  getRendimientoPorGrado() {
    this.loadingRendimiento = true;
    this.errorRendimiento = false;
    let allResults: { student_id: any, score: number }[] = [];
    let users: any[] = [];
    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === 4) {
        // Map student_id to grade
        const gradeScores: { [grade: string]: number[] } = { first: [], second: [], third: [] };
        allResults.forEach(res => {
          const user = users.find(u => u.id === res.student_id);
          if (user && gradeScores[user.grade]) {
            gradeScores[user.grade].push(res.score);
          }
        });
        // Calcular promedios
        (['first', 'second', 'third'] as const).forEach(grade => {
          const arr = gradeScores[grade];
          this.rendimientoPorGrado[grade] = arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;
        });
        // Actualizar gráfico
        this.barChartData = {
          ...this.barChartData,
          datasets: [{
            ...this.barChartData.datasets[0],
            data: [
              this.rendimientoPorGrado['first'],
              this.rendimientoPorGrado['second'],
              this.rendimientoPorGrado['third']
            ]
          }]
        };
        this.loadingRendimiento = false;
      }
    };
    this.puzzleService.getAllPuzzleScores().subscribe({
      next: (arr) => {
        allResults = allResults.concat((arr as any[]).map((score, i) => ({ student_id: null, score })));
        this.puzzleService.getAllPuzzleScoresWithStudent().subscribe({
          next: (results) => {
            allResults = allResults.concat(results);
            onComplete();
          },
          error: () => {
            this.errorRendimiento = true;
            onComplete();
          }
        });
      },
      error: () => {
        this.errorRendimiento = true;
        onComplete();
      }
    });
    this.memoryService.getAllMemoryScoresWithStudent().subscribe({
      next: (results) => {
        allResults = allResults.concat(results);
        onComplete();
      },
      error: () => {
        this.errorRendimiento = true;
        onComplete();
      }
    });
    this.riddleService.getAllRiddleScoresWithStudent().subscribe({
      next: (results) => {
        allResults = allResults.concat(results);
        onComplete();
      },
      error: () => {
        this.errorRendimiento = true;
        onComplete();
      }
    });
    this.userService.getUsers().subscribe({
      next: (response) => {
        users = response.data || [];
        onComplete();
      },
      error: () => {
        this.errorRendimiento = true;
        onComplete();
      }
    });
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
    labels: ['Rompecabezas', 'Memoria', 'Adivinanzas'],
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

  // Gráfico 4: Línea - Progreso Mensual
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Progreso Mensual - Puntaje Promedio'
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

  /**
   * Genera un reporte PDF con las imágenes de los gráficos.
   */
  generateChartsPdf(): void {
    const doc = new jsPDF('p', 'mm', 'a4'); // 'p' para portrait, 'mm' para milímetros, 'a4' tamaño de página
    let yOffset = 10; // Margen superior inicial

    // Título del Reporte
    doc.setFontSize(20);
    doc.text('Reporte de Gráficas de Progreso', 10, yOffset);
    yOffset += 15;
    doc.setFontSize(12);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 10, yOffset);
    yOffset += 20;

    const charts = [
      { canvas: this.barChartCanvas, title: 'Rendimiento Promedio por Grado' },
      { canvas: this.barChart2Canvas, title: 'Juegos más Jugados' },
      { canvas: this.pieChartCanvas, title: 'Distribución de Estudiantes por Grado' },
      { canvas: this.lineChartCanvas, title: 'Progreso Mensual - Puntaje Promedio' }
    ];

    charts.forEach((chart, index) => {
      const canvas = chart.canvas.nativeElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180; // Ancho de la imagen en el PDF (ajustar según necesidad)
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calcular altura proporcional

        // Añadir página si no es la primera o si el contenido no cabe
        if (index > 0) {
          doc.addPage();
          yOffset = 10; // Reiniciar yOffset para la nueva página
        }

        // Añadir título del gráfico en el PDF
        doc.setFontSize(16);
        doc.text(chart.title, 10, yOffset);
        yOffset += 10;

        // Calcular posición X para centrar la imagen
        const imgX = (doc.internal.pageSize.width - imgWidth) / 2;

        // Añadir la imagen del gráfico
        doc.addImage(imgData, 'PNG', imgX, yOffset, imgWidth, imgHeight);

        // Actualizar yOffset para el siguiente contenido (o el final del documento)
        yOffset += imgHeight + 20; // Espacio después del gráfico
      }
    });

    doc.save('reporte_graficas.pdf');
  }
}