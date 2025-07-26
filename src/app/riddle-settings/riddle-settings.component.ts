import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RiddleService } from '../riddle.service';
import { RiddleLevel, RiddleWord } from '../riddle.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importar MatSnackBar
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-riddle-settings',
  templateUrl: './riddle-settings.component.html',
  styleUrls: ['./riddle-settings.component.css']
})
export class RiddleSettingsComponent implements OnInit {
  title = 'Adivinar la Palabra Oculta';

  // Cambiado a time_limit
  level1Config: RiddleLevel = { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [], isActive: false, time_limit: 300 };
  level2Config: RiddleLevel = { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [], isActive: false, time_limit: 240 };
  level3Config: RiddleLevel = { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [], isActive: false, time_limit: 180 };

  level1Form!: FormGroup;
  level2Form!: FormGroup;
  level3Form!: FormGroup;

  newWordInput: string = '';
  newHintInput: string = '';

  activeTabIndex: number = 0;
  activeLevelNumber: number = 1;

  // Inyectar MatSnackBar en el constructor
  constructor(
    private router: Router,
    private riddleService: RiddleService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar, // Inyección de MatSnackBar
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      if (levels && levels.length > 0) {
        this.level1Config = levels.find(lvl => lvl.level_number === 1) || this.level1Config;
        this.level2Config = levels.find(lvl => lvl.level_number === 2) || this.level2Config;
        this.level3Config = levels.find(lvl => lvl.level_number === 3) || this.level3Config;
      } else {
        console.warn('[RiddleSettingsComponent] La suscripción de niveles emitió un array vacío o nulo. Usando configuraciones predeterminadas.');
      }
      this.initForms();
    });
  }

  initForms(): void {
    this.level1Form = this.fb.group({
      maxIntents: [this.level1Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level1Config.words_level, [Validators.required, Validators.min(1)]],
      // Cambiado a timeLimit
      timeLimit: [this.level1Config.time_limit, [Validators.required, Validators.min(10)]] // Mínimo 10 segundos
    });

    this.level2Form = this.fb.group({
      maxIntents: [this.level2Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level2Config.words_level, [Validators.required, Validators.min(1)]],
      // Cambiado a timeLimit
      timeLimit: [this.level2Config.time_limit, [Validators.required, Validators.min(10)]]
    });

    this.level3Form = this.fb.group({
      maxIntents: [this.level3Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level3Config.words_level, [Validators.required, Validators.min(1)]],
      // Cambiado a timeLimit
      timeLimit: [this.level3Config.time_limit, [Validators.required, Validators.min(10)]]
    });
  }

  async toggleLevelActive(levelToActivate: RiddleLevel): Promise<void> {
    const isActivating = !levelToActivate.isActive;

    if (isActivating) {
      await this.deactivateOtherLevels(levelToActivate.level_number);
      levelToActivate.isActive = true;
    } else {
      levelToActivate.isActive = false;
    }

    await this.saveSingleLevelConfig(levelToActivate);
    console.log(`[RiddleSettingsComponent] Nivel ${levelToActivate.level_number} isActive: ${levelToActivate.isActive}`);
  }

  async addWord(levelConfig: RiddleLevel): Promise<void> {
    let value = this.newWordInput.trim().toUpperCase();
    let hint: string | undefined = this.newHintInput.trim() || undefined;

    if (!value) {
      this.snackBar.open('Por favor, introduce una palabra.', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validación para no aceptar caracteres especiales, acentos, números ni espacios en la palabra
    const wordRegex = /^[A-Z]*$/; // Solo letras mayúsculas
    if (!wordRegex.test(value)) {
      this.snackBar.open('La palabra no puede contener espacios, números, caracteres especiales ni acentos.', 'Cerrar', { duration: 5000 });
      return;
    }

    // Para el Nivel 3, la pista es obligatoria
    if (levelConfig.level_number === 3 && !hint) {
      this.snackBar.open('Para el Nivel 3, debes añadir una pista para la palabra.', 'Cerrar', { duration: 5000 });
      return;
    }

    if (!levelConfig.words) {
      levelConfig.words = [];
    }

    if (!levelConfig.words.some((w: RiddleWord) => w.word === value)) {
      levelConfig.words.push({ word: value, hint: hint });
      this.newWordInput = '';
      this.newHintInput = '';
      await this.saveSingleLevelConfig(levelConfig);
      this.snackBar.open(`Palabra "${value}" añadida al nivel ${levelConfig.level_number}.`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open(`La palabra "${value}" ya existe en el nivel ${levelConfig.level_number}.`, 'Cerrar', { duration: 3000 });
    }
  }

  async removeWord(levelConfig: RiddleLevel, index: number): Promise<void> {
    if (index >= 0 && index < levelConfig.words.length) {
      const removedWord = levelConfig.words[index].word;
      levelConfig.words.splice(index, 1);
      await this.saveSingleLevelConfig(levelConfig);
      this.snackBar.open(`Palabra "${removedWord}" eliminada del nivel ${levelConfig.level_number}.`, 'Cerrar', { duration: 3000 });
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.newWordInput = '';
    this.newHintInput = '';
    this.activeTabIndex = event.index;
    this.activeLevelNumber = event.index + 1;
    console.log(`[RiddleSettingsComponent] Pestaña activa: ${this.activeTabIndex}, Nivel activo: ${this.activeLevelNumber}`);
  }

  async saveSettings(): Promise<void> {
    let levelToSave: RiddleLevel | undefined;
    let formToValidate: FormGroup | undefined;

    switch (this.activeLevelNumber) {
      case 1:
        levelToSave = this.level1Config;
        formToValidate = this.level1Form;
        break;
      case 2:
        levelToSave = this.level2Config;
        formToValidate = this.level2Form;
        break;
      case 3:
        levelToSave = this.level3Config;
        formToValidate = this.level3Form;
        break;
      default:
        this.snackBar.open('No se pudo determinar el nivel a guardar.', 'Cerrar', { duration: 3000 });
        return;
    }

    if (formToValidate && formToValidate.invalid) {
      formToValidate.markAllAsTouched();
      this.snackBar.open('Por favor, corrige los errores en la configuración antes de guardar.', 'Cerrar', { duration: 5000 });
      console.error(`[RiddleSettingsComponent] El formulario para el Nivel ${this.activeLevelNumber} es inválido.`);
      return;
    }

    // Nueva validación para asegurar que haya al menos una palabra
    if (levelToSave && (!levelToSave.words || levelToSave.words.length === 0)) {
      this.snackBar.open('Debe añadir al menos una palabra para guardar la configuración del nivel.', 'Cerrar', { duration: 5000 });
      return;
    }

    if (levelToSave && formToValidate) {
      levelToSave.max_intents = formToValidate.value.maxIntents;
      levelToSave.words_level = formToValidate.value.wordsPerLevel;
      levelToSave.time_limit = formToValidate.value.timeLimit; // Guarda el nuevo campo de tiempo

      await this.saveSingleLevelConfig(levelToSave);
      this.snackBar.open('Configuración guardada exitosamente.', 'Cerrar', { duration: 3000 });
    }
  }

  private async saveSingleLevelConfig(config: RiddleLevel): Promise<void> {
    try {
      const savedConfig = await lastValueFrom(this.riddleService.saveRiddleLevel(config));

      if (savedConfig) {
        switch (savedConfig.level_number) {
          case 1: this.level1Config = { ...savedConfig }; break;
          case 2: this.level2Config = { ...savedConfig }; break;
          case 3: this.level3Config = { ...savedConfig }; break;
        }
        console.log(`[RiddleSettingsComponent] Nivel ${config.level_name} guardado/actualizado en Directus.`, savedConfig);
      } else {
        console.error(`[RiddleSettingsComponent] Error inesperado: saveRiddleLevel no devolvió una configuración válida para el nivel ${config.level_name}.`);
        this.snackBar.open(`Error inesperado al guardar la configuración del nivel ${config.level_name}.`, 'Cerrar', { duration: 5000 });
      }
    } catch (error) {
      console.error(`[RiddleSettingsComponent] Error al guardar la configuración del nivel ${config.level_name}:`, error);
      this.snackBar.open(`Error al guardar la configuración del nivel ${config.level_name}. Por favor, inténtalo de nuevo.`, 'Cerrar', { duration: 5000 });
    }
  }

  private async deactivateOtherLevels(activeLevelNumber: number): Promise<void> {
    const allLevels = [this.level1Config, this.level2Config, this.level3Config];
    const levelsToDeactivate = allLevels.filter(lvl => lvl.level_number !== activeLevelNumber && lvl.isActive);

    for (const level of levelsToDeactivate) {
      console.log(`[RiddleSettingsComponent] Desactivando nivel ${level.level_name} en Directus...`);
      level.isActive = false;
      if (level.id) {
        try {
          await lastValueFrom(this.riddleService.saveRiddleLevel(level));
          console.log(`[RiddleSettingsComponent] Nivel ${level.level_name} desactivado en Directus.`);
        } catch (error) {
          console.error(`[RiddleSettingsComponent] Error al desactivar nivel ${level.level_name} en Directus:`, error);
          this.snackBar.open(`Error al desactivar el nivel ${level.level_name}.`, 'Cerrar', { duration: 3000 });
        }
      }
    }
  }

  //función para regresar a settings
  goBack() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
  }
}
