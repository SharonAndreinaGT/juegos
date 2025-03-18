import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient } from '@angular/common/http';
import { MainComponent } from './main/main.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginIDComponent } from './login-id/login-id.component';
import { FirstGradeComponent } from './first-grade/first-grade.component'; 
import { SecondGradeComponent } from './second-grade/second-grade.component';
import { ThirdGradeComponent } from './third-grade/third-grade.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatCardModule } from '@angular/material/card';

@NgModule({
    declarations: [
      AppComponent,
      WelcomeComponent,//componente pricipal
      LoginComponent, // Declaramos el nuevo componente
      MainComponent, //componente siguiente del inicio de sesion, o sea el menu del docente
      LoginIDComponent, //componente que tiene el inicio despues de darle jugar para ingresar con el ID
      FirstGradeComponent,
      SecondGradeComponent,
      ThirdGradeComponent
    ],
    imports: [
      BrowserModule,
      FormsModule,
      AppRoutingModule, //se agrega el modulo de enrutamiento
      MatSidenavModule,
      MatListModule,
      MatToolbarModule,
      MatIconModule,
      BrowserAnimationsModule,
      MatCardModule
    ],
    providers: [
      provideHttpClient(),
      provideAnimationsAsync() //configura el cliente HTTP aquí, ahora se usa esta forma y no httpClientModule
    ],
    bootstrap: [AppComponent] // lo coloco asi para que luego se rediriga a login
  })
  export class AppModule { }