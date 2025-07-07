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

//rutas de navegacion

const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'loginID', component: LoginIDComponent },
  { path: 'login', component: LoginComponent },
  { path: 'main', component: MainComponent },
  { path: 'options', component: GamesOptionsComponent },
  { path: 'puzzle/:levelName', component: PuzzleComponent },
  { path: 'memory', component: MemoryComponent },
  { path: 'riddle', component: RiddleComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'chart', component: ChartComponent },

 
  { path: 'firstGrade', component: GradeStudentsComponent, data: { gradeTitle: 'Primer Grado', gradeFilter: 'first' }},
  { path: 'secondGrade', component: GradeStudentsComponent, data: { gradeTitle: 'Segundo Grado', gradeFilter: 'second' }},
  { path: 'thirdGrade', component: GradeStudentsComponent, data: { gradeTitle: 'Tercer Grado', gradeFilter: 'third' }},
  { path: 'settings', component: GamesSettingsComponent, data: { title: 'Configuración de Juegos'}},
  { path: 'puzzleSettings', component: PuzzleSettingsComponent, data: { title: 'Rompecabezas'}},
  { path: 'memorySettings', component: MemorySettingsComponent, data: { title: 'Memoria'}},
  { path: 'riddleSettings', component: RiddleSettingsComponent, data: { title: 'Adivina la Palabra Oculta'}},

  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
