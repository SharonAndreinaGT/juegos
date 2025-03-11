import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginIDComponent } from './login-id/login-id.component';

//rutas de navegacion

const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent}, //ruta principal con botones de inicio jugar o administrador
  { path: 'loginID', component: LoginIDComponent}, //ruta de jugar para ir al componente del estudiante ingresar ID
  { path: 'login', component: LoginComponent}, // nuevo componente "inicio de sesión"
  { path: 'main', component: MainComponent}, //ruta siguiente, menu principal del docente
  { path: '', redirectTo: 'welcome', pathMatch: 'full'}, //redirige a welcome por defecto
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
