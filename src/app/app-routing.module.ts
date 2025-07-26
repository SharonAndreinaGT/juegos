import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginIDComponent } from './login-id/login-id.component';
import { GradeStudentsComponent } from './grade-students/grade-students.component';
import { GamesSettingsComponent } from './games-settings/games-settings.component';
import { GamesOptionsComponent } from './games-options/games-options.component';
import { PuzzleComponent } from './puzzle/puzzle.component';
import { MemoryComponent } from './memory/memory.component';
import { RiddleComponent } from './riddle/riddle.component';
import { PuzzleSettingsComponent } from './puzzle-settings/puzzle-settings.component';
import { MemorySettingsComponent } from './memory-settings/memory-settings.component';
import { RiddleSettingsComponent } from './riddle-settings/riddle-settings.component';
import { ProgressComponent } from './progress/progress.component';
import { ChartComponent } from './chart/chart.component';
import { AuthGuard } from './auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

//rutas de navegacion

const routes: Routes = [
  // Rutas públicas (no requieren autenticación)
  { path: 'welcome', component: WelcomeComponent },
  { path: 'loginID', component: LoginIDComponent },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // Rutas protegidas (requieren autenticación)
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'options', component: GamesOptionsComponent, canActivate: [AuthGuard] },
  { path: 'puzzle/:levelName', component: PuzzleComponent, canActivate: [AuthGuard] },
  { path: 'memory', component: MemoryComponent, canActivate: [AuthGuard] },
  { path: 'riddle', component: RiddleComponent, canActivate: [AuthGuard] },
  { path: 'progress', component: ProgressComponent, canActivate: [AuthGuard] },
  { path: 'chart', component: ChartComponent, canActivate: [AuthGuard] },
  { path: 'firstGrade', component: GradeStudentsComponent, canActivate: [AuthGuard], data: { gradeTitle: 'Primer Grado', gradeFilter: 'first' }},
  { path: 'secondGrade', component: GradeStudentsComponent, canActivate: [AuthGuard], data: { gradeTitle: 'Segundo Grado', gradeFilter: 'second' }},
  { path: 'thirdGrade', component: GradeStudentsComponent, canActivate: [AuthGuard], data: { gradeTitle: 'Tercer Grado', gradeFilter: 'third' }},
  { path: 'settings', component: GamesSettingsComponent, canActivate: [AuthGuard], data: { title: 'Configuración de Juegos'}},
  { path: 'puzzleSettings', component: PuzzleSettingsComponent, canActivate: [AuthGuard], data: { title: 'Rompecabezas'}},
  { path: 'memorySettings', component: MemorySettingsComponent, canActivate: [AuthGuard], data: { title: 'Memoria'}},
  { path: 'riddleSettings', component: RiddleSettingsComponent, canActivate: [AuthGuard], data: { title: 'Adivina la Palabra Oculta'}},

  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
