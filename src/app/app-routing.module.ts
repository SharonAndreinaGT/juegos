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
import { AdminGuard } from './admin.guard';
import { StudentAuthGuard } from './student-auth.guard';
import { NavigationGuardService } from './navigation-guard.service';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AdminComponent } from './admin/admin.component';

const getGradeFilter = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')[0];
    return userInfo.grade;
  } catch {
    return '';
  }
};

const getGradeTitle = () => {
  const gradeFilter = JSON.parse(localStorage.getItem('gradeFilter') || '{}');
  const gradeData = Array.isArray(gradeFilter.data) ? gradeFilter.data[0] : undefined;
  const grade = gradeData && gradeData.grade ? gradeData.grade : '';
  console.log('Grade:', grade);
  return grade;
};

//rutas de navegacion

const routes: Routes = [
  // Rutas públicas (no requieren autenticación)
  { path: 'welcome', component: WelcomeComponent },
  { path: 'loginID', component: LoginIDComponent },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // Rutas protegidas (requieren autenticación de administrador)
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },

  // Rutas de estudiantes (no requieren autenticación de administrador)
  {
    path: 'options',
    component: GamesOptionsComponent,
    canActivate: [StudentAuthGuard],
  },
  {
    path: 'puzzle/:levelName',
    component: PuzzleComponent,
    canActivate: [StudentAuthGuard],
    canDeactivate: [NavigationGuardService, AuthGuard],
  },
  {
    path: 'memory',
    component: MemoryComponent,
    canActivate: [StudentAuthGuard],
    canDeactivate: [NavigationGuardService, AuthGuard],
  },
  {
    path: 'riddle',
    component: RiddleComponent,
    canActivate: [StudentAuthGuard],
    canDeactivate: [NavigationGuardService, AuthGuard],
  },
  { path: 'progress', component: ProgressComponent, canActivate: [] },
  { path: 'chart', component: ChartComponent, canActivate: [] },
  {
    path: 'grade',
    component: GradeStudentsComponent,
    data: {
      gradeTitle: `Grado: ${getGradeTitle()}`,
      gradeFilter: getGradeFilter(),
    },
  },
  {
    path: 'settings',
    component: GamesSettingsComponent,
    canActivate: [],
    data: { title: 'Configuración de Juegos' },
  },
  {
    path: 'puzzleSettings',
    component: PuzzleSettingsComponent,
    canActivate: [],
    data: { title: 'Rompecabezas' },
  },
  {
    path: 'memorySettings',
    component: MemorySettingsComponent,
    canActivate: [],
    data: { title: 'Memoria' },
  },
  {
    path: 'riddleSettings',
    component: RiddleSettingsComponent,
    canActivate: [],
    data: { title: 'Adivina la Palabra Oculta' },
  },

  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
