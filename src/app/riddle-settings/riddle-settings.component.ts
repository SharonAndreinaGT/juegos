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
  grade = JSON.parse(localStorage.getItem('gradeFilter') || '{}').data[0].id;

  // Cambiado a time_limit
  level1Config: RiddleLevel = { id: null, level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [], isActive: false, time_limit: 300, grade: this.grade, level: '183770b3-0e66-4932-8769-b0c1b4738d79'  };
  level2Config: RiddleLevel = { id: null, level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [], isActive: false, time_limit: 240, grade: this.grade, level: '98fd8047-6897-4a86-85e2-f430e48956bd' };
  level3Config: RiddleLevel = { id: null, level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [], isActive: false, time_limit: 180, grade: this.grade, level: '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1' };

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
    // Obtener el grado actual
    const grade = JSON.parse(localStorage.getItem('gradeFilter') || '{}').data?.[0]?.id || '';
    console.log(`[RiddleSettingsComponent] Grado actual en ngOnInit: ${grade}`);
    
    this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      if (levels && levels.length > 0) {
        this.level1Config = levels.find(lvl => lvl.level === '183770b3-0e66-4932-8769-b0c1b4738d79') || this.level1Config;
        this.level2Config = levels.find(lvl => lvl.level === '98fd8047-6897-4a86-85e2-f430e48956bd') || this.level2Config;
        this.level3Config = levels.find(lvl => lvl.level === '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1') || this.level3Config;
        
        // Asegurar que todos los niveles tengan el grado asignado
        if (grade) {
          this.level1Config.grade = grade;
          this.level2Config.grade = grade;
          this.level3Config.grade = grade;
        }
        
        console.log(`[RiddleSettingsComponent] Niveles cargados con grado ${grade}:`, {
          level1: this.level1Config,
          level2: this.level2Config,
          level3: this.level3Config
        });
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

  onLevelActiveChange(level: 'level1' | 'level2' | 'level3', isActive: boolean): void {
    console.log(`[RiddleSettingsComponent] Cambio de estado para ${level}: ${isActive}`);
    
    let configToUpdate: RiddleLevel;
    switch (level) {
      case 'level1':
        configToUpdate = this.level1Config;
        break;
      case 'level2':
        configToUpdate = this.level2Config;
        break;
      case 'level3':
        configToUpdate = this.level3Config;
        break;
      default:
        return;
    }

    // Desactivar todos los demás niveles si este se está activando
    if (isActive) {
      console.log(`[RiddleSettingsComponent] Activando ${level}, desactivando otros niveles...`);
      if (level !== 'level1') this.level1Config.isActive = false;
      if (level !== 'level2') this.level2Config.isActive = false;
      if (level !== 'level3') this.level3Config.isActive = false;
    }
    
    configToUpdate.isActive = isActive;

    console.log(`[RiddleSettingsComponent] Estados finales de los niveles:`, {
      level1: this.level1Config.isActive,
      level2: this.level2Config.isActive,
      level3: this.level3Config.isActive
    });
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

    // Si este nivel se va a activar, desactivar todos los demás niveles del mismo grado primero
    if (levelToSave.isActive) {
      console.log(`[RiddleSettingsComponent] Nivel ${levelToSave.level_name} se está activando. Desactivando otros niveles del mismo grado...`);
      await this.deactivateOtherLevelsByGrade(levelToSave);
    } else {
      console.log(`[RiddleSettingsComponent] Nivel ${levelToSave.level_name} se está desactivando. No se desactivarán otros niveles.`);
    }

    await this.saveSingleLevelConfig(levelToSave);
    this.snackBar.open('Configuración guardada exitosamente.', 'Cerrar', { duration: 3000 });
  }

  private async saveSingleLevelConfig(config: RiddleLevel): Promise<void> {
    try {
      console.log(config);
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

  /**
   * Desactiva todos los niveles de riddle del mismo grado excepto el especificado en la base de datos.
   */
  private async deactivateOtherLevelsByGrade(activeLevel: RiddleLevel): Promise<void> {
    console.log(`[RiddleSettingsComponent] Iniciando desactivación de otros niveles del mismo grado. Nivel activo: ${activeLevel.level_name} (ID: ${activeLevel.level})`);
    
    // Obtener el grado actual del usuario
    const grade = JSON.parse(localStorage.getItem('gradeFilter') || '{}').data?.[0]?.id || '';
    console.log(`[RiddleSettingsComponent] Grado actual: ${grade}`);
    
    if (!grade) {
      console.warn(`[RiddleSettingsComponent] No se pudo obtener el grado actual. No se desactivarán otros niveles.`);
      return;
    }

    // Obtener todas las configuraciones del mismo grado directamente desde la base de datos
    try {
      // Obtener todos los niveles desde Directus con filtro por grado
      const grade = JSON.parse(localStorage.getItem('gradeFilter') || '{}').data?.[0]?.id || '';
      const isAdmin = this.authService.isAdmin();
      const gradeFilter = isAdmin ? '' : `&filter[grade][_eq]=${grade}`;
      const url = `http://localhost:8055/items/riddle?fields=*,id${gradeFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      const allConfigs: RiddleLevel[] = data.data || [];
      
      console.log(`[RiddleSettingsComponent] Configuraciones obtenidas directamente de Directus:`, allConfigs);
      console.log(`[RiddleSettingsComponent] Grado a filtrar: ${grade}`);
      
      // Verificar que todos los niveles tengan el grado asignado
      allConfigs.forEach((config, index) => {
        if (!config.grade) {
          console.warn(`[RiddleSettingsComponent] Nivel ${index + 1} no tiene grado asignado:`, config);
        }
      });
      
      // Filtrar solo las configuraciones del mismo grado que están activas y no son el nivel actual
      const configsToDeactivate = allConfigs.filter((config: RiddleLevel) => {
        // Asegurar que el grado esté asignado correctamente
        if (!config.grade) {
          config.grade = grade;
        }
        
        const isSameGrade = config.grade === grade;
        const isActive = config.isActive;
        const isNotCurrentLevel = config.level !== activeLevel.level;
        
        console.log(`[RiddleSettingsComponent] Evaluando configuración desde DB:`, {
          level_name: config.level_name,
          level_id: config.level,
          grade: config.grade,
          isActive: config.isActive,
          isSameGrade,
          isActiveState: isActive,
          isNotCurrentLevel,
          shouldDeactivate: isSameGrade && isActive && isNotCurrentLevel
        });
        
        return isSameGrade && isActive && isNotCurrentLevel;
      });
      
      console.log(`[RiddleSettingsComponent] Configuraciones a desactivar:`, configsToDeactivate);
      console.log(`[RiddleSettingsComponent] Total de niveles activos en DB del grado ${grade}: ${allConfigs.filter(c => c.isActive).length}`);
      
      // Desactivar cada configuración encontrada
      for (const configToDeactivate of configsToDeactivate) {
        try {
          console.log(`[RiddleSettingsComponent] Desactivando ${configToDeactivate.level_name} (ID: ${configToDeactivate.id})`);
          
          configToDeactivate.isActive = false;
          await lastValueFrom(this.riddleService.saveRiddleLevel(configToDeactivate));
          
          console.log(`[RiddleSettingsComponent] ${configToDeactivate.level_name} desactivado en Directus.`);
          
          // También actualiza el estado local del componente para consistencia inmediata de la UI
          switch (configToDeactivate.level_name) {
            case 'Fácil': this.level1Config.isActive = false; break;
            case 'Medio': this.level2Config.isActive = false; break;
            case 'Difícil': this.level3Config.isActive = false; break;
          }
        } catch (error) {
          console.error(`[RiddleSettingsComponent] Error al desactivar ${configToDeactivate.level_name} en Directus:`, error);
        }
      }
      
      console.log(`[RiddleSettingsComponent] Proceso de desactivación completado. ${configsToDeactivate.length} niveles desactivados.`);
      
    } catch (error) {
      console.error(`[RiddleSettingsComponent] Error al obtener configuraciones del grado ${grade}:`, error);
    }
  }

  goBack() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
  }
}