import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MatSnackBar } from '@angular/material/snack-bar'; // Para mostrar mensajes al guardar
import { MatSlideToggleChange } from '@angular/material/slide-toggle'; // Para el evento del slide toggle
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig } from '../memory-config-model';
import { MemoryService } from '../memory.service';

export interface LevelConfig {
  level_name: string;
  card_count: number; 
  time_limit: number; 
  intent: number; 
  images: { id: number, url: string, file?: File }[]; 
  isActive: boolean; 
}

@Component({
  selector: 'app-memory-settings',
  templateUrl: './memory-settings.component.html',
  styleUrls: ['./memory-settings.component.scss']
})
export class MemorySettingsComponent implements OnInit, OnDestroy {
  title: string = 'Memoria';

  level1Form: FormGroup;
  level2Form: FormGroup;
  level3Form: FormGroup;

  selectedFilesByLevel: { [key: string]: { id: number, file: File | null, preview: string }[] } = {
    'level1': [],
    'level2': [],
    'level3': []
  };

  readonly LEVEL_CARD_COUNTS = {
    level1: 6,
    level2: 8,
    level3: 12
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    // --- NUEVA LÍNEA: Inyectar el servicio de estado del juego ---
    private gameStateService: MemoryGameStateService,
    private memoryService: MemoryService
  ) {
    this.level1Form = this.fb.group({
      level_name: ['Nivel1', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level1, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level1), Validators.pattern('^[0-9]*$')]],
      time_limit: [120, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false]
    });

    this.level2Form = this.fb.group({
      level_name: ['Nivel2', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level2, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level2), Validators.pattern('^[0-9]*$')]],
      time_limit: [180, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false]
    });

    this.level3Form = this.fb.group({
      level_name: ['Nivel3', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level3, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level3), Validators.pattern('^[0-9]*$')]],
      time_limit: [240, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false]
    });
  }

  ngOnInit() {
    console.log('Inicialización de componentes de configuración de memoria');
    this.loadSettings(); 
  }

  ngOnDestroy(): void {
    //limpiar suscripciones
  }

  getLevelForm(levelKey: string): FormGroup {

    switch (levelKey) {
      case 'level1': return this.level1Form;
      case 'level2': return this.level2Form;
      case 'level3': return this.level3Form;
      default: throw new Error(`Nivel desconocido: ${levelKey}`);
    }
  }

  getImagesForLevel(levelKey: string) {
    return this.selectedFilesByLevel[levelKey];
  }

  onFileSelected(event: any, levelKey: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const requiredPairs = this.LEVEL_CARD_COUNTS[levelKey as keyof typeof this.LEVEL_CARD_COUNTS] / 2;

      this.selectedFilesByLevel[levelKey] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.match(/image\/*/)) {
          if (this.selectedFilesByLevel[levelKey].length < requiredPairs) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              const newImageId = this.selectedFilesByLevel[levelKey].length;
              this.selectedFilesByLevel[levelKey].push({ id: newImageId, file: file, preview: e.target.result });
              this.updateImageValidation(levelKey);
            };
            reader.readAsDataURL(file);
          } else {
            this.snackBar.open(`Ya has seleccionado el máximo de ${requiredPairs} imágenes para este nivel.`, 'Cerrar', { duration: 3000 });
            break;
          }
        } else {
          this.snackBar.open(`Archivo no permitido: ${file.name}. Solo se aceptan imágenes.`, 'Cerrar', { duration: 3000 });
        }
      }
      event.target.value = '';
    } else {
        this.selectedFilesByLevel[levelKey] = [];
        this.updateImageValidation(levelKey);
    }
  }

  removeImage(levelKey: string, index: number): void {
    this.selectedFilesByLevel[levelKey].splice(index, 1);
    this.selectedFilesByLevel[levelKey].forEach((img, i) => img.id = i);
    this.updateImageValidation(levelKey);
  }

  updateImageValidation(levelKey: string): void {
    const imagesCount = this.selectedFilesByLevel[levelKey].length;
    const requiredPairs = this.LEVEL_CARD_COUNTS[levelKey as keyof typeof this.LEVEL_CARD_COUNTS] / 2;
    const levelFormGroup = this.getLevelForm(levelKey);

      console.log(`Validación de imagen para ${levelKey}:`, { imagesCount, requiredPairs });

    if (imagesCount !== requiredPairs) {
      levelFormGroup.setErrors({ notEnoughImages: true });
    } else {
      if (levelFormGroup.hasError('notEnoughImages')) {
          levelFormGroup.setErrors(null);
      }
    }
  }

  onLevelActiveChange(event: MatSlideToggleChange, levelKey: string): void {
    const isActive = event.checked;
    const currentLevelForm = this.getLevelForm(levelKey);

    // Si se activa este nivel, desactivar los demás
    if (isActive) {
      ['level1', 'level2', 'level3'].forEach(key => {
        if (key !== levelKey) {
          this.getLevelForm(key).get('isActive')?.setValue(false, { emitEvent: false }); 
        }
      });
    }

    // Actualizar el estado 'isActive' en el formulario
    currentLevelForm.get('isActive')?.setValue(isActive);

    // Guardar la configuración del nivel actual
    // Lo hacemos de forma asíncrona para no bloquear el UI.
    this.saveLevelConfig(levelKey);
  }

  async saveLevelConfig(levelKey: string): Promise<void> {
    const levelForm = this.getLevelForm(levelKey);

    // Asegurarse de que el número de imágenes coincida antes de guardar
    const requiredPairs = this.LEVEL_CARD_COUNTS[levelKey as keyof typeof this.LEVEL_CARD_COUNTS] / 2;
    if (this.selectedFilesByLevel[levelKey].length !== requiredPairs) {
      this.snackBar.open(`El Nivel ${levelKey.replace('level', '')} requiere ${requiredPairs} imágenes para guardar.`, 'Cerrar', { duration: 5000 });
      levelForm.setErrors({ notEnoughImages: true }); 
      return;
    } else {
        if (levelForm.hasError('notEnoughImages')) {
            levelForm.setErrors(null); 
        }
    }
  console.log(`Intentando guardar configuración para ${levelKey}:`, { levelFormValue: levelForm.value, levelFormValidity: levelForm.valid });

    console.log(levelForm)
    if (levelForm.invalid) {
      this.snackBar.open('Por favor, completa todos los campos requeridos para el nivel seleccionado.', 'Cerrar', { duration: 5000 });
      levelForm.markAllAsTouched(); 
      return;
    }

    const configToSave: LevelConfig = {
      level_name: levelForm.get('level_name')?.value,
      card_count: levelForm.get('card_count')?.value,
      time_limit: levelForm.get('time_limit')?.value,
      intent: levelForm.get('intent')?.value,
      isActive: levelForm.get('isActive')?.value,
      images: this.selectedFilesByLevel[levelKey].map(img => ({
        id: img.id,
        url: img.preview 
      }))
    };

    try {
      const allLevelsConfig = JSON.parse(localStorage.getItem('memoryGameLevelsConfig') || '{}');
      allLevelsConfig[levelKey] = configToSave;

      localStorage.setItem('memoryGameLevelsConfig', JSON.stringify(allLevelsConfig));
      this.snackBar.open(`Configuración del Nivel ${levelKey.replace('level', '')} guardada exitosamente.`, 'Cerrar', { duration: 3000 });
      console.log(`Configuración del Nivel ${levelKey.replace('level', '')} Guardada:`, configToSave);

      // Si este nivel se acaba de activar, lo enviamos al servicio de estado ---
      if (configToSave.isActive) {
        this.gameStateService.setActiveLevel(configToSave); 
      }

      //se llama el metodo del service y se manda la configuracion al backend
      await this.memoryService.saveMemoryConfig(configToSave).toPromise();
    } catch (error) {
      console.error(`Error al guardar la configuración del Nivel ${levelKey.replace('level', '')}:`, error);
      this.snackBar.open(`Error al guardar la configuración del Nivel ${levelKey.replace('level', '')}.`, 'Cerrar', { duration: 5000 });
    }
  }

  // Cargar la configuración al iniciar el componente
loadSettings(): void {
  const savedConfig = localStorage.getItem('memoryGameLevelsConfig');
  if (savedConfig) {
    const parsedConfig: { [key: string]: LevelConfig } = JSON.parse(savedConfig);

      console.log('Configuración cargada desde localStorage:', parsedConfig);

    ['level1', 'level2', 'level3'].forEach(levelKey => {
      const levelData = parsedConfig[levelKey];
      if (levelData) {
        const levelForm = this.getLevelForm(levelKey);

        levelForm.patchValue({
          level_name: levelData.level_name,
          card_count: levelData.card_count, 
          time_limit: levelData.time_limit,
          intent: levelData.intent,
          isActive: levelData.isActive
        });

        // Verifica si 'images' es un arreglo antes de intentar mapear
        if (Array.isArray(levelData.images)) {
          this.selectedFilesByLevel[levelKey] = levelData.images.map(img => ({
            id: img.id,
            file: null,
            preview: img.url
          }));
        } else {
          // Si 'images' no es un arreglo, establece un arreglo vacío
          this.selectedFilesByLevel[levelKey] = [];
          console.log(`Advertencia: 'images' no está definido o no es un arreglo en la configuración del nivel '${levelKey}'.`);
        }
        
        this.updateImageValidation(levelKey); 

        // --- NUEVA LÓGICA: Si este nivel estaba activo al cargar, también lo establecemos en el servicio de estado. ---
        if (levelData.isActive) {
          this.gameStateService.setActiveLevel(levelData); 
        }
      }
    });
    this.snackBar.open('Configuración cargada.', 'Cerrar', { duration: 2000 });
  }
}
}