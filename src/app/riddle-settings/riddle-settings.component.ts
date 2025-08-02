// src/app/riddle-settings/riddle-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RiddleService } from '../riddle.service';
import { RiddleLevel, RiddleWord } from '../riddle.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-riddle-settings',
  templateUrl: './riddle-settings.component.html',
  styleUrls: ['./riddle-settings.component.css']
})
export class RiddleSettingsComponent implements OnInit {
  title = 'Adivinar la Palabra Oculta';

  level1Config: RiddleLevel = { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [], isActive: false, time_limit: 300 };
  level2Config: RiddleLevel = { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [], isActive: false, time_limit: 240 };
  level3Config: RiddleLevel = { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [], isActive: false, time_limit: 180 };

  level1Form!: FormGroup;
  level2Form!: FormGroup;
  level3Form!: FormGroup;

  newWordInput: string = '';
  newHintInput: string = '';
  newHintImageFile: File | null = null;
  newHintImageUrl: string | null = null;

  activeTabIndex: number = 0;
  activeLevelNumber: number = 1;

  constructor(
    private router: Router,
    private riddleService: RiddleService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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
      timeLimit: [this.level1Config.time_limit, [Validators.required, Validators.min(10)]]
    });

    this.level2Form = this.fb.group({
      maxIntents: [this.level2Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level2Config.words_level, [Validators.required, Validators.min(1)]],
      timeLimit: [this.level2Config.time_limit, [Validators.required, Validators.min(10)]]
    });

    this.level3Form = this.fb.group({
      maxIntents: [this.level3Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level3Config.words_level, [Validators.required, Validators.min(1)]],
      timeLimit: [this.level3Config.time_limit, [Validators.required, Validators.min(10)]]
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.newWordInput = '';
    this.newHintInput = '';
    this.newHintImageFile = null;
    this.newHintImageUrl = null;
    this.activeTabIndex = event.index;
    this.activeLevelNumber = event.index + 1;
  }

  getCurrentLevelConfig(): RiddleLevel {
    switch (this.activeLevelNumber) {
      case 1: return this.level1Config;
      case 2: return this.level2Config;
      case 3: return this.level3Config;
      default: return this.level1Config;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.newHintImageFile = file;
      this.newHintImageUrl = URL.createObjectURL(file);
    }
  }

  async addWord(levelConfig: RiddleLevel): Promise<void> {
    let value = this.newWordInput.trim().toUpperCase();
    let hint: string | undefined = this.newHintInput.trim() || undefined;

    if (!value) {
      this.snackBar.open('Por favor, introduce una palabra.', 'Cerrar', { duration: 3000 });
      return;
    }

    const wordRegex = /^[A-Z]*$/;
    if (!wordRegex.test(value)) {
      this.snackBar.open('La palabra no puede contener espacios, números, caracteres especiales ni acentos.', 'Cerrar', { duration: 5000 });
      return;
    }

    if (levelConfig.level_number === 3 && !hint && !this.newHintImageFile) {
      this.snackBar.open('Para el Nivel 3, debes añadir una pista de texto o una imagen.', 'Cerrar', { duration: 5000 });
      return;
    }

    let hintImageUrl: string | undefined = undefined;
    if (this.newHintImageFile) {
      try {
        const response = await lastValueFrom(this.riddleService.uploadFile(this.newHintImageFile));
        const imageId = response.data.id;
        hintImageUrl = `http://localhost:8055/assets/${imageId}`;
      } catch (error) {
        this.snackBar.open('Error al subir la imagen.', 'Cerrar', { duration: 3000 });
        console.error('Error al subir la imagen:', error);
        return;
      }
    }

    if (!levelConfig.words) {
      levelConfig.words = [];
    }

    if (!levelConfig.words.some((w: RiddleWord) => w.word === value)) {
      levelConfig.words.push({ word: value, hint: hint, hint_image: hintImageUrl });
      this.newWordInput = '';
      this.newHintInput = '';
      this.newHintImageFile = null;
      this.newHintImageUrl = null;
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

  async saveSettings(): Promise<void> {
    const levelToSave = this.getCurrentLevelConfig();
    let formToValidate: FormGroup;

    switch (this.activeLevelNumber) {
      case 1: formToValidate = this.level1Form; break;
      case 2: formToValidate = this.level2Form; break;
      case 3: formToValidate = this.level3Form; break;
      default: return;
    }

    if (formToValidate.invalid) {
      formToValidate.markAllAsTouched();
      this.snackBar.open('Por favor, corrige los errores en la configuración antes de guardar.', 'Cerrar', { duration: 5000 });
      console.error(`[RiddleSettingsComponent] El formulario para el Nivel ${this.activeLevelNumber} es inválido.`);
      return;
    }

    if (!levelToSave.words || levelToSave.words.length === 0) {
      this.snackBar.open('Debe añadir al menos una palabra para guardar la configuración del nivel.', 'Cerrar', { duration: 5000 });
      return;
    }

    levelToSave.max_intents = formToValidate.value.maxIntents;
    levelToSave.words_level = formToValidate.value.wordsPerLevel;
    levelToSave.time_limit = formToValidate.value.timeLimit;

    await this.saveSingleLevelConfig(levelToSave);
    this.snackBar.open('Configuración guardada exitosamente.', 'Cerrar', { duration: 3000 });
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
      } else {
        console.error(`Error inesperado: saveRiddleLevel no devolvió una configuración válida para el nivel ${config.level_name}.`);
        this.snackBar.open(`Error inesperado al guardar la configuración del nivel ${config.level_name}.`, 'Cerrar', { duration: 5000 });
      }
    } catch (error) {
      console.error(`Error al guardar la configuración del nivel ${config.level_name}:`, error);
      this.snackBar.open(`Error al guardar la configuración del nivel ${config.level_name}. Por favor, inténtalo de nuevo.`, 'Cerrar', { duration: 5000 });
    }
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
  }

  private async deactivateOtherLevels(activeLevelNumber: number): Promise<void> {
    const allLevels = [this.level1Config, this.level2Config, this.level3Config];
    const levelsToDeactivate = allLevels.filter(lvl => lvl.level_number !== activeLevelNumber && lvl.isActive);
    for (const level of levelsToDeactivate) {
      level.isActive = false;
      if (level.id) {
        try {
          await lastValueFrom(this.riddleService.saveRiddleLevel(level));
        } catch (error) {
          console.error(`Error al desactivar nivel ${level.level_name}:`, error);
          this.snackBar.open(`Error al desactivar el nivel ${level.level_name}.`, 'Cerrar', { duration: 3000 });
        }
      }
    }
  }

  goBack() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
  }
}