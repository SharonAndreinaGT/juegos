import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    declarations: [
      AppComponent,
      LoginComponent // Declaramos el nuevo componente
    ],
    imports: [
      BrowserModule,
      FormsModule,
      HttpClientModule,
      AppRoutingModule //se agrega el modulo de enrutamiento
    ],
    providers: [],
    bootstrap: [LoginComponent] // Establecemos logincomponent como la vista principal
  })
  export class AppModule { }