import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MemoryGameStateService } from '../memory-game-state.service';
import { MemoryConfig } from '../memory-config-model';
import { MemoryService } from '../memory.service';
import { AuthService } from '../auth.service';
import { forkJoin } from 'rxjs'; // Importar forkJoin para peticiones concurrentes
import { take } from 'rxjs/operators'; // Para desuscribirse automáticamente de observables que completan

@Component({
  selector: 'app-memory-settings',
  templateUrl: './memory-settings.component.html',
  styleUrls: ['./memory-settings.component.scss']
})
export class MemorySettingsComponent implements OnInit, OnDestroy {
  title: string = 'Memoria';
  grade = JSON.parse(localStorage.getItem('gradeFilter') || '{}').data[0].id;

  level1Form: FormGroup;
  level2Form: FormGroup;
  level3Form: FormGroup;

  selectedFilesByLevel: { [key: string]: { id?: number | null, file: File | null, preview: string }[] } = {
    'level1': [],
    'level2': [],
    'level3': []
  };

  readonly LEVEL_CARD_COUNTS = {
    level1: 6,
    level2: 8,
    level3: 12
  };

  // Define una configuración por defecto para cuando no hay un nivel activo
  readonly DEFAULT_MEMORY_CONFIG: MemoryConfig = {
    level_name: '', 
    card_count: 0,
    time_limit: 0,
    intent: 0,
    isActive: false,
    images: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private gameStateService: MemoryGameStateService,
    private memoryService: MemoryService,
    private authService: AuthService
  ) {
    this.level1Form = this.fb.group({
      level_name: ['Nivel1', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level1, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level1), Validators.pattern('^[0-9]*$')]],
      time_limit: [120, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false],
      level: ['183770b3-0e66-4932-8769-b0c1b4738d79']
    });

    this.level2Form = this.fb.group({
      level_name: ['Nivel2', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level2, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level2), Validators.pattern('^[0-9]*$')]],
      time_limit: [180, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false],
      level: ['98fd8047-6897-4a86-85e2-f430e48956bd']
    });

    this.level3Form = this.fb.group({
      level_name: ['Nivel3', Validators.required],
      card_count: [this.LEVEL_CARD_COUNTS.level3, [Validators.required, Validators.min(this.LEVEL_CARD_COUNTS.level3), Validators.pattern('^[0-9]*$')]],
      time_limit: [240, [Validators.required, Validators.min(1)]],
      intent: [0, [Validators.required, Validators.min(0)]],
      isActive: [false],
      level: ['3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1']
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

      // Limpiar las imágenes seleccionadas previamente para este nivel
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
            this.showSnackbar(`Ya has seleccionado el máximo de ${requiredPairs} imágenes para este nivel.`, 'Cerrar', 3000);
            break;
          }
        } else {
          this.showSnackbar(`Archivo no permitido: ${file.name}. Solo se aceptan imágenes.`, 'Cerrar', 3000);
        }
      }
      event.target.value = ''; // Limpiar el input de archivo para permitir seleccionar los mismos archivos de nuevo
    } else {
        this.selectedFilesByLevel[levelKey] = [];
        this.updateImageValidation(levelKey);
    }
  }

  removeImage(levelKey: string, index: number): void {
    this.selectedFilesByLevel[levelKey].splice(index, 1);
    this.selectedFilesByLevel[levelKey].forEach((img, i) => img.id = i); // Reindexar IDs locales
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

  /**
   * Maneja el cambio del slide toggle de 'Nivel Activo'.
   * Actualiza el estado local y el servicio de estado del juego,
   * pero NO guarda la configuración en la base de datos de inmediato.
   * El guardado ocurre solo al hacer clic en el botón "Guardar Configuración".
   */
  onLevelActiveChange(event: MatSlideToggleChange, levelKey: string): void {
    const isActive = event.checked;
    const currentLevelForm = this.getLevelForm(levelKey);

    // Si se activa este nivel, desactivar los demás en el modelo local de la UI
    if (isActive) {
      ['level1', 'level2', 'level3'].forEach(key => {
        if (key !== levelKey) {
          this.getLevelForm(key).get('isActive')?.setValue(false, { emitEvent: false }); 
        }
      });
      // Actualizar el servicio de estado del juego inmediatamente con el nivel activo
      this.gameStateService.setActiveLevel(currentLevelForm.value);
    } else {
      // Si se desactiva el nivel actual y era el que estaba activo en el servicio de estado
      if (this.gameStateService.getActiveLevel()?.level_name === currentLevelForm.get('level_name')?.value) {
        this.gameStateService.setActiveLevel(this.DEFAULT_MEMORY_CONFIG); // Limpiar el nivel activo en el servicio de estado
      }
    }

    // Actualizar el estado 'isActive' en el formulario local
    currentLevelForm.get('isActive')?.setValue(isActive);

  }

  async saveLevelConfig(levelKey: string): Promise<void> {
    const levelForm = this.getLevelForm(levelKey);
    console.log(levelForm.get('level')?.value);

    // Asegurarse de que el número de imágenes coincida antes de guardar
    const requiredPairs = this.LEVEL_CARD_COUNTS[levelKey as keyof typeof this.LEVEL_CARD_COUNTS] / 2;
    if (this.selectedFilesByLevel[levelKey].length !== requiredPairs) {
      this.showSnackbar(`El Nivel ${levelKey.replace('level', '')} requiere ${requiredPairs} imágenes para guardar.`, 'Cerrar', 5000);
      levelForm.setErrors({ notEnoughImages: true }); 
      return;
    } else {
      if (levelForm.hasError('notEnoughImages')) {
          levelForm.setErrors(null); 
      }
    }

    console.log(`Intentando guardar configuración para ${levelKey}:`, { levelFormValue: levelForm.value, levelFormValidity: levelForm.valid });

    if (levelForm.invalid) {
      this.showSnackbar('Por favor, completa todos los campos requeridos para el nivel seleccionado.', 'Cerrar', 5000);
      levelForm.markAllAsTouched(); 
      return;
    }

    // Obtener los archivos de imagen del nivel actual que necesitan ser cargados
    // Filtrar solo los archivos que son instancias de File (nuevos archivos seleccionados)
    const newImageFiles = this.selectedFilesByLevel[levelKey]
      .filter(fileItem => fileItem.file instanceof File)
      .map(fileItem => fileItem.file as File);

    // Obtener las URLs de imágenes existentes (que no son archivos nuevos)
    const existingImageUrls = this.selectedFilesByLevel[levelKey]
      .filter(fileItem => typeof fileItem.preview === 'string' && fileItem.preview.startsWith('http'))
      .map(fileItem => fileItem.preview);

    try {
      let uploadedImageUrls: string[] = [];
      
      // Solo subir imágenes si hay archivos nuevos
      if (newImageFiles.length > 0) {
        const imageUploads = newImageFiles.map(file => this.memoryService.uploadImage(file).toPromise());
        const imageResponses = await Promise.all(imageUploads);

        uploadedImageUrls = imageResponses.map(response => {
          const fileId = response.data.id;
          // Asegúrate de que esta URL sea correcta para tu Directus.
          // Si Directus espera solo el ID del archivo en el campo 'images',
          // entonces deberías guardar solo 'fileId' aquí y construir la URL al cargar.
          return `http://localhost:8055/assets/${fileId}`; 
        });
      }
      
      // Combinar las URLs de imágenes subidas y las existentes
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      console.log('URLs de imágenes a guardar:', finalImageUrls);

      const levelName = levelForm.get('level_name')?.value;
      const level = levelForm.get('level')?.value;
      
      // Obtener la configuración existente de Directus para este nivel
      const existingConfigResponse = await this.memoryService.getMemoryConfigByLevel(level).toPromise();
      const existingConfigData = existingConfigResponse?.data?.[0];
      console.log(levelForm.get('level')?.value);
      const configToSave: MemoryConfig = {
        level_name: levelName,
        card_count: levelForm.get('card_count')?.value,
        time_limit: levelForm.get('time_limit')?.value,
        intent: levelForm.get('intent')?.value,
        isActive: levelForm.get('isActive')?.value,
        images: finalImageUrls,
        level: levelForm.get('level')?.value,
        grade: this.grade
      };

      // Si existe un registro, asignar el ID para que se actualice en lugar de crear
      if (existingConfigData && existingConfigData.id) {
        configToSave.id = existingConfigData.id;
        console.log(`Actualizando configuración existente con ID: ${configToSave.id}`);
      } else {
        console.log('Creando nueva configuración');
      }

      // Si este nivel se va a activar, desactivar todos los demás niveles primero en la DB
      if (configToSave.isActive) {
        // Obtener todas las configuraciones existentes de Directus
        const allConfigsResponse = await this.memoryService.getAllMemoryConfigs().toPromise();
        const allConfigs: MemoryConfig[] = allConfigsResponse?.data || [];
        
        // Desactivar todos los niveles que están activos y no son el nivel actual
        const deactivationPromises = allConfigs
          .filter((config: MemoryConfig) => config.id !== configToSave.id && config.isActive)
          .map(async (config: MemoryConfig) => {
            console.log(`Desactivando nivel ${config.level_name} (ID: ${config.id}) en la DB.`);
            // Obtener la configuración completa del nivel a desactivar antes de enviarla
            const currentDbConfigResponse = await this.memoryService.getMemoryConfigByLevel(config.level!).toPromise();
            const currentDbConfig = currentDbConfigResponse?.data?.[0];

            if (currentDbConfig && currentDbConfig.id) {
                // Modificar la copia completa y enviarla
                currentDbConfig.isActive = false;
                return this.memoryService.saveMemoryConfig(currentDbConfig).toPromise();
            }
            return Promise.resolve(); // Si no se encuentra o no tiene ID, no hacer nada
          });

        if (deactivationPromises.length > 0) {
          await Promise.all(deactivationPromises);
          console.log('Otros niveles desactivados exitosamente en la base de datos.');
        }

        // Después de desactivar en la DB, actualizar el estado local de los otros toggles
        // para que la UI refleje el cambio inmediatamente al guardar.
        ['level1', 'level2', 'level3'].forEach(key => {
          const form = this.getLevelForm(key);
          if (form.get('level_name')?.value !== configToSave.level_name) {
            form.get('isActive')?.setValue(false, { emitEvent: false });
          }
        });
      }
      
      // Guardar la configuración (crear o actualizar) en Directus
      const savedConfig = await this.memoryService.saveMemoryConfig(configToSave).toPromise();
      
      this.showSnackbar(`Configuración del Nivel ${levelKey.replace('level', '')} guardada exitosamente.`, 'Ok', 3000);
      console.log(`Configuración del Nivel ${levelKey.replace('level', '')} Guardada:`, savedConfig);

      // Actualizar el servicio de estado del juego con la configuración recién guardada y activa
      if (savedConfig && savedConfig.isActive) {
        this.gameStateService.setActiveLevel(savedConfig);
      } else if (savedConfig && this.gameStateService.getActiveLevel()?.level_name === savedConfig.level_name) {
        this.gameStateService.setActiveLevel(this.DEFAULT_MEMORY_CONFIG);
      } else if (!savedConfig) {
        if (this.gameStateService.getActiveLevel()?.level_name === configToSave.level_name) {
          this.gameStateService.setActiveLevel(this.DEFAULT_MEMORY_CONFIG);
        }
      }

    } catch (error) {
      console.error(`Error al guardar la configuración del Nivel ${levelKey.replace('level', '')}:`, error);
      this.showSnackbar(`Error al guardar la configuración del Nivel ${levelKey.replace('level', '')}.`, 'Cerrar', 5000);
    }
  }

  /**
   * Carga la configuración de todos los niveles desde Directus al iniciar el componente.
   * Asegura que los toggles 'isActive' reflejen el estado real de la base de datos.
   */
  loadSettings(): void {
    console.log('Cargando configuración desde Directus...');
    const levelNames = ['Nivel1', 'Nivel2', 'Nivel3'];
    const levelsIds = ['183770b3-0e66-4932-8769-b0c1b4738d79', '98fd8047-6897-4a86-85e2-f430e48956bd', '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1'];
    const fetchPromises = levelsIds.map(level => this.memoryService.getMemoryConfigByLevel(level).pipe(take(1)).toPromise());

    forkJoin(fetchPromises).subscribe({
      next: (responses: any[]) => {
        let activeLevelFound: MemoryConfig | null = null;

        responses.forEach((response, index) => {
          const levelName = levelNames[index];
          const levelKey = `level${index + 1}`;
          const configData: MemoryConfig | undefined = response.data?.[0];

          if (configData) {
            console.log(`Configuración de ${levelName} cargada:`, configData);
            const levelForm = this.getLevelForm(levelKey);
            
            // PatchValue con los datos cargados, incluyendo isActive
            levelForm.patchValue({
              level_name: configData.level_name,
              card_count: configData.card_count, 
              time_limit: configData.time_limit,
              intent: configData.intent,
              isActive: configData.isActive // Esto establecerá el toggle correctamente
            });

            // Cargar imágenes existentes si las hay
            if (Array.isArray(configData.images)) {
              this.selectedFilesByLevel[levelKey] = configData.images.map(imgUrl => ({
                file: null, // No hay archivo File para imágenes ya en el servidor
                preview: imgUrl // Usar la URL como preview
              }));
            } else {
              this.selectedFilesByLevel[levelKey] = [];
            }
            this.updateImageValidation(levelKey);

            // Si este nivel está activo en Directus, marcarlo como el activo principal
            if (configData.isActive) {
              activeLevelFound = configData;
            }
          } else {
            console.log(`No se encontró configuración para ${levelName}. Usando valores por defecto.`);
            // Asegurarse de que el toggle isActive esté en false si no hay config
            this.getLevelForm(levelKey).get('isActive')?.setValue(false, { emitEvent: false });
            this.selectedFilesByLevel[levelKey] = []; // Asegurarse de que no haya imágenes
            this.updateImageValidation(levelKey);
          }
        });

        // Después de cargar todos los niveles, establecer el nivel activo en el gameStateService
        // Esto asegura que solo el nivel que Directus dice que está activo sea el activo en el juego.
        if (activeLevelFound) {
          this.gameStateService.setActiveLevel(activeLevelFound);
        } else {
          // Si no se encontró ningún nivel activo, explícitamente se establece la configuración por defecto.
          this.gameStateService.setActiveLevel(this.DEFAULT_MEMORY_CONFIG); 
        }
      },
      error: (err) => {
        console.error('Error al cargar la configuración de memoria desde Directus:', err);
        this.showSnackbar('Error al cargar la configuración. Se usarán valores por defecto.', 'Cerrar', 5000);
        // En caso de error, asegúrate de que todos los toggles estén en false en la UI
        ['level1', 'level2', 'level3'].forEach(key => {
          this.getLevelForm(key).get('isActive')?.setValue(false, { emitEvent: false });
          this.selectedFilesByLevel[key] = [];
          this.updateImageValidation(key);
        });
        this.gameStateService.setActiveLevel(this.DEFAULT_MEMORY_CONFIG);
      }
    });
  }

  /**
   * Muestra un mensaje de Snackbar.
   * @param message El mensaje a mostrar.
   * @param action La etiqueta del botón de acción (opcional).
   * @param duration La duración en milisegundos antes de que el snackbar se cierre automáticamente (opcional).
   */
  private showSnackbar(message: string, action: string = '', duration: number = 5000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'center', // Centrado horizontal
      verticalPosition: 'bottom', // Abajo
    });
  }

  //función para regresar a settings
  goBack() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
  }
}
