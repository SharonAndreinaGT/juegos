import { Component, OnInit } from '@angular/core';
import { RiddleService } from '../riddle.service';
import { RiddleLevel, RiddleWord } from '../riddle.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-riddle-settings',
  templateUrl: './riddle-settings.component.html',
  styleUrls: ['./riddle-settings.component.css']
})
export class RiddleSettingsComponent implements OnInit {
  title = 'Configuración del Juego de Adivinar la Palabra';

  level1Config!: RiddleLevel;
  level2Config!: RiddleLevel;
  level3Config!: RiddleLevel;

  level1Form!: FormGroup;
  level2Form!: FormGroup;
  level3Form!: FormGroup;

  newWordInput: string = '';

  constructor(private riddleService: RiddleService, private fb: FormBuilder) { }

  ngOnInit(): void {
    // Suscríbete al observable para obtener las configuraciones iniciales
    this.riddleService.levels$.subscribe((levels: RiddleLevel[]) => {
      // Encuentra y asigna el objeto de configuración correcto para cada nivel
      this.level1Config = levels.find(lvl => lvl.level_number === 1) || { level_number: 1, level_name: 'Fácil', max_intents: 5, words_level: 5, words: [], isActive: false };
      this.level2Config = levels.find(lvl => lvl.level_number === 2) || { level_number: 2, level_name: 'Medio', max_intents: 4, words_level: 6, words: [], isActive: false };
      this.level3Config = levels.find(lvl => lvl.level_number === 3) || { level_number: 3, level_name: 'Difícil', max_intents: 3, words_level: 7, words: [], isActive: false };
      
      this.initForms();
    });
  }

  initForms(): void {
    // Inicializa un grupo de formulario separado para cada configuración de nivel
    this.level1Form = this.fb.group({
      maxIntents: [this.level1Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level1Config.words_level, [Validators.required, Validators.min(1)]],
    });

    this.level2Form = this.fb.group({
      maxIntents: [this.level2Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level2Config.words_level, [Validators.required, Validators.min(1)]],
    });

    this.level3Form = this.fb.group({
      maxIntents: [this.level3Config.max_intents, [Validators.required, Validators.min(1)]],
      wordsPerLevel: [this.level3Config.words_level, [Validators.required, Validators.min(1)]],
    });
  }

  /**
   * Toggles the active status of a level. When one is activated, others are deactivated.
   * This is the core logic for the level switch.
   * @param levelToActivate The RiddleLevel object to be activated.
   */
  toggleLevelActive(levelToActivate: RiddleLevel): void {
    // Desactivar todos los niveles primero
    this.level1Config.isActive = false;
    this.level2Config.isActive = false;
    this.level3Config.isActive = false;
    
    // Activa solo el nivel seleccionado.
    levelToActivate.isActive = true;
    
    console.log(`Nivel ${levelToActivate.level_number} ha sido activado.`);
  }

  /**
   * Adds a word (and an optional hint for Level 3) to the list of the specified level.
   * @param levelConfig The RiddleLevel object to which the word will be added.
   */
  addWord(levelConfig: RiddleLevel): void {
    let value = this.newWordInput.trim().toUpperCase();
    let hint: string | undefined = undefined;

    if (!value) {
      alert('Por favor, introduce una palabra.');
      return;
    }

    if (levelConfig.level_number === 3 && value.includes('(') && value.includes(')')) {
      const match = value.match(/(.*?)\((.*)\)/);
      if (match && match.length === 3) {
        value = match[1].trim();
        hint = match[2].trim();
      }
    }

    if (!levelConfig.words.some((w: RiddleWord) => w.word === value)) {
      levelConfig.words.push({ word: value, hint: hint });
      this.newWordInput = '';
    } else {
      alert(`La palabra "${value}" ya existe en el nivel ${levelConfig.level_number}.`);
    }
  }

  /**
   * Removes a word from the list of the specified level.
   * @param levelConfig The RiddleLevel object from which the word will be removed.
   * @param index The index of the word to remove in the array.
   */
  removeWord(levelConfig: RiddleLevel, index: number): void {
    if (index >= 0 && index < levelConfig.words.length) {
      levelConfig.words.splice(index, 1);
    }
  }

  /**
   * Clears the new word input when changing tabs.
   * @param event The MatTabChangeEvent object.
   */
  onTabChange(event: MatTabChangeEvent): void {
    this.newWordInput = '';
  }

  /**
   * Saves the settings by updating the service with the current form values and active status.
   */
  saveSettings(): void {
    let allFormsValid = true;

    if (this.level1Form.invalid) {
      allFormsValid = false;
      this.level1Form.markAllAsTouched();
      console.error(`El formulario para el Nivel 1 es inválido.`);
    }
    if (this.level2Form.invalid) {
      allFormsValid = false;
      this.level2Form.markAllAsTouched();
      console.error(`El formulario para el Nivel 2 es inválido.`);
    }
    if (this.level3Form.invalid) {
      allFormsValid = false;
      this.level3Form.markAllAsTouched();
      console.error(`El formulario para el Nivel 3 es inválido.`);
    }

    if (allFormsValid) {
      // Update config objects with form values
      this.level1Config.max_intents = this.level1Form.value.maxIntents;
      this.level1Config.words_level = this.level1Form.value.wordsPerLevel;

      this.level2Config.max_intents = this.level2Form.value.maxIntents;
      this.level2Config.words_level = this.level2Form.value.wordsPerLevel;

      this.level3Config.max_intents = this.level3Form.value.maxIntents;
      this.level3Config.words_level = this.level3Form.value.wordsPerLevel;

      // Collect all level configurations to send to the service, including the isActive status
      const updatedLevelsForService: RiddleLevel[] = [
        this.level1Config,
        this.level2Config,
        this.level3Config
      ];

      this.riddleService.updateLevels(updatedLevelsForService);
      alert('Configuración guardada exitosamente (localmente).');
    } else {
      alert('Por favor, corrige los errores en la configuración antes de guardar.');
    }
  }
}