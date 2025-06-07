import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';

import { MainComponent } from './main/main.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginIDComponent } from './login-id/login-id.component';
import { GradeStudentsComponent } from './grade-students/grade-students.component';
import { GamesSettingsComponent } from './games-settings/games-settings.component';
import { CreateUserFormComponent } from './create-user-form/create-user-form.component';
import { PuzzleComponent } from './puzzle/puzzle.component';
import { MemoryComponent } from './memory/memory.component';
import { RiddleComponent } from './riddle/riddle.component';
import { HttpClientModule } from '@angular/common/http';
import { EditUserFormComponent } from './edit-user-form/edit-user-form.component';
import { PuzzleSettingsComponent } from './puzzle-settings/puzzle-settings.component';
import { MemorySettingsComponent } from './memory-settings/memory-settings.component';
import { RiddleSettingsComponent } from './riddle-settings/riddle-settings.component';

//importaciones de angular material

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatDialogContent } from '@angular/material/dialog'
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';


@NgModule({
    declarations: [
      AppComponent,
      WelcomeComponent,//componente pricipal
      LoginComponent, // Declaramos el nuevo componente
      MainComponent, //componente siguiente del inicio de sesion, o sea el menu del docente
      LoginIDComponent, //componente que tiene el inicio despues de darle jugar para ingresar con el ID
      GradeStudentsComponent,
      GamesSettingsComponent,
      CreateUserFormComponent,
      PuzzleComponent,
      MemoryComponent,
      RiddleComponent,
      EditUserFormComponent,
      PuzzleSettingsComponent,
      MemorySettingsComponent,
      RiddleSettingsComponent
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
      MatCardModule,
      MatDialogModule,
      MatTableModule,
      MatPaginatorModule,
      MatButton,
      MatIconButton,
      MatDialogContent,
      MatFormField,
      MatLabel,
      ReactiveFormsModule,
      MatInputModule,
      MatFormFieldModule,
      MatButtonModule,
      FormsModule,
      MatTabsModule,
      HttpClientModule
    ],
    providers: [
     
      provideAnimationsAsync() //configura el cliente HTTP aquí, ahora se usa esta forma y no httpClientModule
    ],
    bootstrap: [AppComponent] // lo coloco asi para que luego se rediriga a login
  })
  export class AppModule { }