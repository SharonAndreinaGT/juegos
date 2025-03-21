import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginIDComponent } from './login-id/login-id.component';
import { GradeStudentsComponent } from './grade-students/grade-students.component';


//rutas de navegacion

const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent}, //ruta principal con botones de inicio jugar o administrador
  { path: 'loginID', component: LoginIDComponent}, //ruta de jugar para ir al componente del estudiante ingresar ID
  { path: 'login', component: LoginComponent}, // nuevo componente "inicio de sesión"
  { path: 'main', component: MainComponent}, //ruta siguiente, menu principal del docente

  { path: 'firstGrade',component: GradeStudentsComponent,data: { gradeTitle: 'Primer Grado', 
      students: [
        { id: 1, name: 'Ana', lastname: 'Pérez', grade: 90 },
        { id: 2, name: 'Luis', lastname: 'Martinez', grade: 85 },
        { id: 3, name: 'Paola', lastname: 'Gonzalez', grade: 90 },
        //supongo que aquí se consumiria la api para traer los datos reales
      ],
    },
  },
  { path: 'secondGrade', component: GradeStudentsComponent,data: { gradeTitle: 'Segundo Grado',
      students: [
        { id: 1, name: 'María', lastname: 'Gamboa', grade: 95 },
        { id: 2, name: 'Carlos', lastname: 'Silva', grade: 88 },
        { id: 3, name: 'Marta', lastname: 'Sosa', grade: 90 },
      ],
    },
  },
  { path: 'thirdGrade', component: GradeStudentsComponent, data: { gradeTitle: 'Tercer Grado',
      students: [
        { id: 1, name: 'Sofía', lastname: 'Blanco', grade: 92 },
        { id: 2, name: 'Pedro', lastname: 'Mendoza', grade: 89 },
        { id: 3, name: 'Carolina', lastname: 'Tanco', grade: 90 },
      ],
    },
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
