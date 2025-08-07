// src/app/chart/chart.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { MemoryService } from '../memory.service';
import { RiddleService } from '../riddle.service';
import { AuthService } from '../auth.service';

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

  // Propiedades para el filtrado por grado
  currentGrade: string = '';
  gradeTitle: string = 'Gráficas del Progreso';

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

  rendimientoPorGrado: { [grade: string]: number } = { '87b4cb0a-81bb-4217-9f17-6a545fc39f73': 0, 'ef7220b7-7bc2-4b91-88d1-47892aa57576': 0, '0acec409-6850-4152-b640-662fe9217123': 0 };
  loadingRendimiento = true;
  errorRendimiento = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService,
    private memoryService: MemoryService,
    private riddleService: RiddleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    Chart.register();
    this.getCurrentGrade();
  }

  // Método para obtener el grado actual del usuario autenticado
  private getCurrentGrade(): void {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')[0];
      
      // ✅ Si es admin, no filtrar por grado (mostrar todos los datos)
      if (this.isAdmin()) {
        this.currentGrade = '';
        this.gradeTitle = 'Gráficas del Progreso - Todos los Grados';
      } else {
        // ✅ Para docentes, mantener la lógica actual
        this.currentGrade = userInfo.grade || '';
        this.updateGradeTitle();
      }
      
      // Cargar datos
      this.loadChartData();
    } catch (error) {
      console.error('Error al obtener el grado del usuario:', error);
      this.currentGrade = '';
      this.loadChartData();
    }
  }

  // Método para actualizar el título según el grado
  private updateGradeTitle(): void {
    switch (this.currentGrade) {
      case 'first':
        this.gradeTitle = 'Gráficas del Progreso - Primer Grado';
        break;
      case 'second':
        this.gradeTitle = 'Gráficas del Progreso - Segundo Grado';
        break;
      case 'third':
        this.gradeTitle = 'Gráficas del Progreso - Tercer Grado';
        break;
      default:
        this.gradeTitle = 'Gráficas del Progreso';
        break;
    }
  }

  // Método para cargar todos los datos de las gráficas
  private loadChartData(): void {
    this.getTotalEstudiantes();
    this.getTotalPartidas();
    this.getPromedioScore();
    this.getTiempoPromedio();
    this.getRendimientoPorGrado();
    
    // ✅ Solo cargar distribución por grado si es admin
    if (this.isAdmin()) {
      this.getDistribucionPorGrado();
    }
    
    this.getProgresoMensual();
  }

  // Métodos para obtener datos filtrados por grado
  getTotalEstudiantes() {
    this.loadingEstudiantes = true;
    this.errorEstudiantes = false;
    
    // ✅ Si es admin (currentGrade vacío), obtener todos los usuarios
    // ✅ Si es docente, filtrar por su grado específico
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.subscribe({
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

  getTotalPartidas() {
    this.loadingPartidas = true;
    this.errorPartidas = false;
    
    // ✅ Si es admin (currentGrade vacío), obtener todos los usuarios
    // ✅ Si es docente, filtrar por su grado específico
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.subscribe({
      next: (response) => {
        const users = response.data || [];
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

        // Contar partidas por estudiante del grado
        users.forEach((user: any) => {
          this.puzzleService.getStudentPuzzleResults(user.id).subscribe({
            next: (results) => {
              puzzleCount += results ? results.length : 0;
              onComplete();
            },
            error: () => onComplete()
          });

          this.memoryService.getStudentMemoryResults(user.id).subscribe({
            next: (results) => {
              memoryCount += results ? results.length : 0;
              onComplete();
            },
            error: () => onComplete()
          });

          this.riddleService.getStudentRiddleResults(user.id).subscribe({
            next: (results) => {
              riddleCount += results ? results.length : 0;
              onComplete();
            },
            error: () => onComplete()
          });
        });
      },
      error: () => {
        this.errorPartidas = true;
        this.loadingPartidas = false;
      }
    });
  }

  getPromedioScore() {
    this.loadingScore = true;
    this.errorScore = false;
    
    // ✅ Si es admin (currentGrade vacío), obtener todos los usuarios
    // ✅ Si es docente, filtrar por su grado específico
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.subscribe({
      next: (response) => {
        const users = response.data || [];
        let scores: number[] = [];
        let completed = 0;
        const totalUsers = users.length * 3; // 3 juegos por usuario

        const onComplete = () => {
          completed++;
          if (completed === totalUsers) {
            if (scores.length > 0) {
              const sum = scores.reduce((a, b) => a + b, 0);
              this.promedioScore = Math.round((sum / scores.length) * 100) / 100;
            } else {
              this.promedioScore = 0;
            }
            this.loadingScore = false;
          }
        };

        users.forEach((user: any) => {
          this.puzzleService.getStudentPuzzleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                scores = scores.concat(results.map((r: any) => r.score).filter((s: any) => typeof s === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.memoryService.getStudentMemoryResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                scores = scores.concat(results.map((r: any) => r.score).filter((s: any) => typeof s === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.riddleService.getStudentRiddleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                scores = scores.concat(results.map((r: any) => r.score).filter((s: any) => typeof s === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });
        });
      },
      error: () => {
        this.errorScore = true;
        this.loadingScore = false;
      }
    });
  }

  getTiempoPromedio() {
    this.loadingTiempo = true;
    this.errorTiempo = false;
    
    // ✅ Si es admin (currentGrade vacío), obtener todos los usuarios
    // ✅ Si es docente, filtrar por su grado específico
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.subscribe({
      next: (response) => {
        const users = response.data || [];
        let tiempos: number[] = [];
        let completed = 0;
        const totalUsers = users.length * 3; // 3 juegos por usuario

        const onComplete = () => {
          completed++;
          if (completed === totalUsers) {
            if (tiempos.length > 0) {
              const sum = tiempos.reduce((a, b) => a + b, 0);
              const avg = sum / tiempos.length;
              const min = Math.floor(avg / 60);
              const seg = Math.round(avg % 60);
              this.tiempoPromedio = `${min}:${seg.toString().padStart(2, '0')}`;
            } else {
              this.tiempoPromedio = '0:00';
            }
            this.loadingTiempo = false;
          }
        };

        users.forEach((user: any) => {
          this.puzzleService.getStudentPuzzleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                tiempos = tiempos.concat(results.map((r: any) => r.time_taken).filter((t: any) => typeof t === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.memoryService.getStudentMemoryResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                tiempos = tiempos.concat(results.map((r: any) => r.elapsedTime).filter((t: any) => typeof t === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.riddleService.getStudentRiddleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                tiempos = tiempos.concat(results.map((r: any) => r.time_taken).filter((t: any) => typeof t === 'number'));
              }
              onComplete();
            },
            error: () => onComplete()
          });
        });
      },
      error: () => {
        this.errorTiempo = true;
        this.loadingTiempo = false;
      }
    });
  }

  getRendimientoPorGrado() {
    this.loadingRendimiento = true;
    this.errorRendimiento = false;
    
    if (this.isAdmin()) {
      // ✅ Para admin: obtener usuarios de los 3 grados específicos y calcular rendimiento por separado      
      const primerGrado = '87b4cb0a-81bb-4217-9f17-6a545fc39f73';
      const segundoGrado = 'ef7220b7-7bc2-4b91-88d1-47892aa57576';
      const tercerGrado = '0acec409-6850-4152-b640-662fe9217123';
      
      // Obtener usuarios de cada grado
      const primerGradoUsers$ = this.userService.getUsersByGrade(primerGrado);
      const segundoGradoUsers$ = this.userService.getUsersByGrade(segundoGrado);
      const tercerGradoUsers$ = this.userService.getUsersByGrade(tercerGrado);
      
      // Combinar los resultados
      forkJoin([primerGradoUsers$, segundoGradoUsers$, tercerGradoUsers$]).subscribe({
        next: (responses) => {
          const primerGradoUsers = responses[0].data || [];
          const segundoGradoUsers = responses[1].data || [];
          const tercerGradoUsers = responses[2].data || [];
          
          console.log('🔍 [getRendimientoPorGrado] Usuarios Primer Grado:', primerGradoUsers.length);
          console.log('🔍 [getRendimientoPorGrado] Usuarios Segundo Grado:', segundoGradoUsers.length);
          console.log('🔍 [getRendimientoPorGrado] Usuarios Tercer Grado:', tercerGradoUsers.length);
          
          // Procesar cada grado por separado
          this.procesarRendimientoPorGradoAdmin(primerGradoUsers, primerGrado, 'Primer Grado');
          this.procesarRendimientoPorGradoAdmin(segundoGradoUsers, segundoGrado, 'Segundo Grado');
          this.procesarRendimientoPorGradoAdmin(tercerGradoUsers, tercerGrado, 'Tercer Grado');
        },
        error: (error) => {
          console.error('🔍 [getRendimientoPorGrado] Error obteniendo usuarios:', error);
          this.errorRendimiento = true;
          this.loadingRendimiento = false;
        }
      });
    } else {
      // ✅ Para docentes: mantener la lógica actual
      const usersObservable = this.userService.getUsersByGrade(this.currentGrade);
      
      usersObservable.subscribe({
        next: (response) => {
          const users = response.data || [];
          console.log('🔍 [getRendimientoPorGrado] Usuarios del docente:', users.length);
          
          let allResults: { student_id: any, score: number }[] = [];
          let completed = 0;
          const totalUsers = users.length * 3; // 3 juegos por usuario

          const onComplete = () => {
            completed++;
            if (completed === totalUsers) {
              console.log('🔍 [getRendimientoPorGrado] Total resultados del docente:', allResults.length);
              
              if (allResults.length > 0) {
                const sum = allResults.reduce((a, b) => a + b.score, 0);
                const average = sum / allResults.length;
                this.rendimientoPorGrado[this.currentGrade || 'general'] = Math.round(average * 100) / 100;
                console.log('🔍 [getRendimientoPorGrado] Promedio del docente:', this.rendimientoPorGrado[this.currentGrade || 'general']);
              } else {
                this.rendimientoPorGrado[this.currentGrade || 'general'] = 0;
              }
              
              // Actualizar gráfico para docente
              this.actualizarGraficoRendimiento([this.rendimientoPorGrado[this.currentGrade || 'general']], [this.gradeTitle], 'Puntaje Promedio del Grado');
              this.loadingRendimiento = false;
            }
          };

          users.forEach((user: any) => {
            this.obtenerResultadosUsuario(user, allResults, onComplete);
          });
        },
        error: () => {
          this.errorRendimiento = true;
          this.loadingRendimiento = false;
        }
      });
    }
  }

  // ✅ Método auxiliar para procesar rendimiento por grado específico para admin
  private procesarRendimientoPorGradoAdmin(users: any[], gradeId: string, gradeName: string) {
    console.log(`🔍 [procesarRendimientoPorGradoAdmin] Procesando ${gradeName}:`, users.length, 'usuarios');
    
    let allResults: { student_id: any, score: number }[] = [];
    let completed = 0;
    const totalUsers = users.length * 3; // 3 juegos por usuario

    const onComplete = () => {
      completed++;
      if (completed === totalUsers) {
        console.log(`🔍 [procesarRendimientoPorGradoAdmin] ${gradeName} - Total resultados:`, allResults.length);
        
        if (allResults.length > 0) {
          const sum = allResults.reduce((a, b) => a + b.score, 0);
          const average = sum / allResults.length;
          this.rendimientoPorGrado[gradeId] = Math.round(average * 100) / 100;
          console.log(`🔍 [procesarRendimientoPorGradoAdmin] ${gradeName} - Promedio:`, this.rendimientoPorGrado[gradeId]);
        } else {
          this.rendimientoPorGrado[gradeId] = 0;
        }
        
        // Verificar si todos los grados han sido procesados
        this.verificarYActualizarGraficoAdmin();
      }
    };

    users.forEach((user: any) => {
      this.obtenerResultadosUsuario(user, allResults, onComplete);
    });
  }

  // ✅ Método auxiliar para obtener resultados de un usuario
  private obtenerResultadosUsuario(user: any, allResults: any[], onComplete: () => void) {
    this.puzzleService.getStudentPuzzleResults(user.id).subscribe({
      next: (results) => {
        if (results) {
          // ✅ Usar push para agregar elementos al array existente
          results.forEach((r: any) => {
            allResults.push({ 
              student_id: user.id, 
              score: r.score 
            });
          });
        }
        onComplete();
      },
      error: () => onComplete()
    });

    this.memoryService.getStudentMemoryResults(user.id).subscribe({
      next: (results) => {
        if (results) {
          // ✅ Usar push para agregar elementos al array existente
          results.forEach((r: any) => {
            allResults.push({ 
              student_id: user.id, 
              score: r.score 
            });
          });
        }
        onComplete();
      },
      error: () => onComplete()
    });

    this.riddleService.getStudentRiddleResults(user.id).subscribe({
      next: (results) => {
        if (results) {
          // ✅ Usar push para agregar elementos al array existente
          results.forEach((r: any) => {
            allResults.push({ 
              student_id: user.id, 
              score: r.score 
            });
          });
        }
        onComplete();
      },
      error: () => onComplete()
    });
  }

  // ✅ Método auxiliar para verificar y actualizar gráfico de admin
  private verificarYActualizarGraficoAdmin() {
    const primerGrado = '87b4cb0a-81bb-4217-9f17-6a545fc39f73';
    const segundoGrado = 'ef7220b7-7bc2-4b91-88d1-47892aa57576';
    const tercerGrado = '0acec409-6850-4152-b640-662fe9217123';
    
    const array = [
      this.rendimientoPorGrado[primerGrado],
      this.rendimientoPorGrado[segundoGrado],
      this.rendimientoPorGrado[tercerGrado]
    ];
        
    this.actualizarGraficoRendimiento(array, ['Primer Grado', 'Segundo Grado', 'Tercer Grado'], 'Puntaje Promedio por Grado');
    this.loadingRendimiento = false;
  }

  // ✅ Método auxiliar para actualizar gráfico
  private actualizarGraficoRendimiento(data: number[], labels: string[], label: string) {
    if (this.barChartData && this.barChartData.datasets && this.barChartData.datasets[0]) {
      this.barChartData = {
        ...this.barChartData,
        labels: labels,
        datasets: [{
          ...this.barChartData.datasets[0],
          data: data,
          label: label
        }]
      };
      
      console.log('🔍 [actualizarGraficoRendimiento] Gráfica actualizada:', this.barChartData);
    }
  }

  actualizarJuegosMasJugados(puzzleCount: number, memoryCount: number, riddleCount: number) {
    if (this.barChartData2 && this.barChartData2.datasets && this.barChartData2.datasets[0]) {
      this.barChartData2 = {
        ...this.barChartData2,
        datasets: [{
          ...this.barChartData2.datasets[0],
          data: [puzzleCount, memoryCount, riddleCount]
        }]
      };
    }
  }

  actualizarDistribucionPorGrado(countFirst: number, countSecond: number, countThird: number) {
    if (this.pieChartData && this.pieChartData.datasets && this.pieChartData.datasets[0]) {
      this.pieChartData = {
        ...this.pieChartData,
        labels: ['Primer Grado', 'Segundo Grado', 'Tercer Grado'],
        datasets: [{
          ...this.pieChartData.datasets[0],
          data: [countFirst, countSecond, countThird]
        }]
      };
      
      console.log('🔍 [actualizarDistribucionPorGrado] Gráfica actualizada:', this.pieChartData);
    }
  }

  getDistribucionPorGrado() {
    // ✅ Solo ejecutar si es admin
    if (!this.isAdmin()) {
      return;
    }    
    // ✅ Para admin: obtener usuarios de los 3 grados específicos
    const primerGrado = '87b4cb0a-81bb-4217-9f17-6a545fc39f73';
    const segundoGrado = 'ef7220b7-7bc2-4b91-88d1-47892aa57576';
    const tercerGrado = '0acec409-6850-4152-b640-662fe9217123';
    
    // Obtener usuarios de cada grado
    const primerGradoUsers$ = this.userService.getUsersByGrade(primerGrado);
    const segundoGradoUsers$ = this.userService.getUsersByGrade(segundoGrado);
    const tercerGradoUsers$ = this.userService.getUsersByGrade(tercerGrado);
    
    // Combinar los resultados
    forkJoin([primerGradoUsers$, segundoGradoUsers$, tercerGradoUsers$]).subscribe({
        next: (responses) => {
          const primerGradoUsers = responses[0].data || [];
          const segundoGradoUsers = responses[1].data || [];
          const tercerGradoUsers = responses[2].data || [];
          // Actualizar la gráfica de distribución
          this.actualizarDistribucionPorGrado(
            primerGradoUsers.length,
            segundoGradoUsers.length,
            tercerGradoUsers.length
          );
        },
        error: (error) => {
          console.error('🔍 [getDistribucionPorGrado] Error obteniendo usuarios:', error);
          this.actualizarDistribucionPorGrado(0, 0, 0);
        }
      });
  }

  getProgresoMensual() {
    // ✅ Si es admin (currentGrade vacío), obtener todos los usuarios
    // ✅ Si es docente, filtrar por su grado específico
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.subscribe({
      next: (response) => {
        const users = response.data || [];
        let allResults: { score: number, created_at: string }[] = [];
        let completed = 0;
        const totalUsers = users.length * 3; // 3 juegos por usuario

        const onComplete = () => {
          completed++;
          if (completed === totalUsers) {
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

            // Ordenar meses
            const sortedMonths = Object.keys(monthMap).sort();
            let labels: string[] = [];
            let data: number[] = [];
            sortedMonths.forEach(month => {
              labels.push(month);
              const arr = monthMap[month];
              const promedio = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
              data.push(promedio);
            });

            // Incluir el mes actual aunque no tenga datos
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!labels.includes(currentMonth)) {
              labels.push(currentMonth);
              data.push(0);
            }

            // Actualizar gráfico
            if (this.lineChartData && this.lineChartData.datasets && this.lineChartData.datasets[0]) {
              this.lineChartData = {
                ...this.lineChartData,
                labels,
                datasets: [{
                  ...this.lineChartData.datasets[0],
                  data,
                  label: `Progreso Mensual - ${this.gradeTitle}`
                }]
              };
            }
          }
        };

        users.forEach((user: any) => {
          this.puzzleService.getStudentPuzzleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                allResults = allResults.concat(results.map((r: any) => ({ score: r.score, created_at: r.created_at })));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.memoryService.getStudentMemoryResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                allResults = allResults.concat(results.map((r: any) => ({ score: r.score, created_at: r.created_at })));
              }
              onComplete();
            },
            error: () => onComplete()
          });

          this.riddleService.getStudentRiddleResults(user.id).subscribe({
            next: (results) => {
              if (results) {
                allResults = allResults.concat(results.map((r: any) => ({ score: r.score, created_at: r.created_at })));
              }
              onComplete();
            },
            error: () => onComplete()
          });
        });
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
        text: 'Rendimiento Promedio del Grado'
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Grado Actual'],
    datasets: [
      {
        data: [0],
        label: 'Puntaje Promedio',
        backgroundColor: ['#FF6384'],
        borderColor: ['#FF6384'],
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
        data: [0, 0, 0],
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
        data: [0, 0, 0],
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
    labels: [],
    datasets: [
      {
        data: [],
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
      'first': 'grade',
      'second': 'grade',
      'third': 'grade'
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
    const doc = new jsPDF('p', 'mm', 'a4');
    let yOffset = 10;

    // Título del Reporte
    doc.setFontSize(20);
    doc.text(`Reporte de ${this.gradeTitle}`, 10, yOffset);
    yOffset += 15;
    doc.setFontSize(12);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 10, yOffset);
    yOffset += 20;

    const charts = [
      { canvas: this.barChartCanvas, title: 'Rendimiento Promedio del Grado' },
      { canvas: this.barChart2Canvas, title: 'Juegos más Jugados' },
      { canvas: this.pieChartCanvas, title: 'Distribución de Estudiantes por Grado' },
      { canvas: this.lineChartCanvas, title: `Progreso Mensual - ${this.gradeTitle}` }
    ];

    charts.forEach((chart, index) => {
      const canvas = chart.canvas.nativeElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (index > 0) {
          doc.addPage();
          yOffset = 10;
        }

        doc.setFontSize(16);
        doc.text(chart.title, 10, yOffset);
        yOffset += 10;

        const imgX = (doc.internal.pageSize.width - imgWidth) / 2;
        doc.addImage(imgData, 'PNG', imgX, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 20;
      }
    });

    const fileName = `reporte_graficas_${this.currentGrade}_grado.pdf`;
    doc.save(fileName);
  }

  logout() {
    this.authService.logout();
  }

   //Con este metodo solo podrá acceder a distintas funcionalidades solo si es administrador
  isAdmin() {
    return this.authService.isAdmin();
  }
}