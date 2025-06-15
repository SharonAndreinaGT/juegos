import { Component, OnInit } from '@angular/core';
import { PuzzleService } from '../puzzle.service';
import { PuzzleConfig } from '../puzzle-config.model';
import { SharedDataService } from '../sharedData.service';

@Component({
  selector: 'app-puzzle-settings',
  templateUrl: './puzzle-settings.component.html',
  styleUrls: ['./puzzle-settings.component.css'] // Corrected `styleUrl` to `styleUrls` as it's an array
})
export class PuzzleSettingsComponent implements OnInit {
  title = 'Rompecabezas';

  // Modelos para la configuración de cada nivel.
  // Inicializamos con valores por defecto y agregamos 'isActive'.
  level1Config: PuzzleConfig = { level_name: 'Nivel1', rows: 2, cols: 2, time_limit: 180, isActive: false };
  level2Config: PuzzleConfig = { level_name: 'Nivel2', rows: 3, cols: 3, time_limit: 120, isActive: false };
  level3Config: PuzzleConfig = { level_name: 'Nivel3', rows: 4, cols: 4, time_limit: 90, isActive: false };

  // Para previsualización de imágenes seleccionadas localmente
  level1ImagePreview: string | ArrayBuffer | null = null;
  level2ImagePreview: string | ArrayBuffer | null = null;
  level3ImagePreview: string | ArrayBuffer | null = null;

  // Para guardar el objeto File seleccionado temporalmente antes de subirlo a Directus
  level1ImageFile: File | null = null;
  level2ImageFile: File | null = null;
  level3ImageFile: File | null = null;

  constructor(
    private puzzleService: PuzzleService,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    // Cargar la configuración existente para cada nivel al iniciar el componente
    this.loadAllLevelConfigs();
  }

  loadAllLevelConfigs(): void {
    const levels = ['Nivel1', 'Nivel2', 'Nivel3'];
    levels.forEach(levelName => this.loadLevelConfig(levelName));
  }

  /**
   * Carga la configuración de un nivel específico desde Directus.
   * @param levelName El nombre del nivel a cargar.
   */
  loadLevelConfig(levelName: string): void {
    this.puzzleService.getPuzzleConfigByLevel(levelName).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response.data?.[0];
        console.log(`[PuzzleSettingsComponent] Respuesta de Directus para ${levelName}:`, response);
        console.log(`[PuzzleSettingsComponent] Datos de configuración procesados para ${levelName}:`, configData);

        if (configData) {
          switch (levelName) {
            case 'Nivel1':
              this.level1Config = { ...this.level1Config, ...configData };
              this.level1ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case 'Nivel2':
              this.level2Config = { ...this.level2Config, ...configData };
              this.level2ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case 'Nivel3':
              this.level3Config = { ...this.level3Config, ...configData };
              this.level3ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
          }
          console.log(`[PuzzleSettingsComponent] Configuración de ${levelName} cargada:`, configData);

          // Si el nivel cargado está activo, actualiza el servicio compartido
          if (configData.isActive) {
            this.sharedDataService.setCurrentPuzzleLevel(configData.level_name!);
          }
        } else {
          console.log(`[PuzzleSettingsComponent] No se encontró configuración para ${levelName}. Se usarán valores por defecto.`);
        }
      },
      (error) => {
        console.error(`[PuzzleSettingsComponent] Error al cargar la configuración de ${levelName}:`, error);
      }
    );
  }

  /**
   * Maneja el evento de selección de archivo de imagen.
   * Crea una previsualización y guarda el archivo para futura subida.
   * @param event El evento de cambio del input de archivo.
   * @param level Indica a qué nivel de configuración pertenece la imagen.
   */
  onImageSelected(event: Event, level: 'level1' | 'level2' | 'level3'): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const previewUrl = reader.result;
        switch (level) {
          case 'level1':
            this.level1ImagePreview = previewUrl;
            this.level1ImageFile = file;
            break;
          case 'level2':
            this.level2ImagePreview = previewUrl;
            this.level2ImageFile = file;
            break;
          case 'level3':
            this.level3ImagePreview = previewUrl;
            this.level3ImageFile = file;
            break;
        }
      };
      reader.readAsDataURL(file);
    } else {
      switch (level) {
        case 'level1':
          this.level1ImagePreview = null;
          this.level1ImageFile = null;
          this.level1Config.imageUrl = '';
          break;
        case 'level2':
          this.level2ImagePreview = null;
          this.level2ImageFile = null;
          this.level2Config.imageUrl = '';
          break;
        case 'level3':
          this.level3ImagePreview = null;
          this.level3ImageFile = null;
          this.level3Config.imageUrl = '';
          break;
      }
    }
  }

  /**
   * Actualiza el estado 'isActive' de un nivel y asegura que solo uno esté activo.
   * @param level El nivel cuya propiedad 'isActive' ha cambiado.
   * @param event El evento de cambio del slide toggle.
   */
  onLevelActiveChange(level: 'level1' | 'level2' | 'level3', isActive: boolean): void {
    let configToUpdate: PuzzleConfig;
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
      if (level !== 'level1') this.level1Config.isActive = false;
      if (level !== 'level2') this.level2Config.isActive = false;
      if (level !== 'level3') this.level3Config.isActive = false;
      this.sharedDataService.setCurrentPuzzleLevel(configToUpdate.level_name!);
    } else {
      // Si se desactiva el nivel actual y es el que estaba activo, limpiar el nivel activo en sharedDataService
      if (this.sharedDataService.getCurrentPuzzleLevel() === configToUpdate.level_name) {
        this.sharedDataService.setCurrentPuzzleLevel(''); 
      }
    }
    configToUpdate.isActive = isActive;

    // Aunque el slide toggle actualiza el modelo, es buena práctica llamar a saveLevelConfig
    // para persistir este cambio en la base de datos de inmediato.
    this.saveLevelConfig(level);
  }


  /**
   * Guarda la configuración de un nivel específico en Directus.
   * Incluye la subida de la imagen si se seleccionó una nueva.
   * @param level Indica qué nivel de configuración se va a guardar.
   */
  async saveLevelConfig(level: 'level1' | 'level2' | 'level3'): Promise<void> {
    let configToSave: PuzzleConfig;
    let imageFile: File | null;

    switch (level) {
      case 'level1':
        configToSave = { ...this.level1Config };
        imageFile = this.level1ImageFile;
        break;
      case 'level2':
        configToSave = { ...this.level2Config };
        imageFile = this.level2ImageFile;
        break;
      case 'level3':
        configToSave = { ...this.level3Config };
        imageFile = this.level3ImageFile;
        break;
      default:
        console.error('[PuzzleSettingsComponent] Nivel de configuración no válido.');
        return;
    }

    try {
      // Paso 1: Subir la imagen a Directus si se seleccionó una nueva
      if (imageFile) {
        console.log(`[PuzzleSettingsComponent] Subiendo imagen para ${configToSave.level_name}...`);
        const uploadResponse = await this.puzzleService.uploadImage(imageFile).toPromise();

        if (uploadResponse && uploadResponse.data && uploadResponse.data.id) {
          configToSave.imageUrl = uploadResponse.data.id;
          console.log('[PuzzleSettingsComponent] Imagen subida, ID:', configToSave.imageUrl);
        } else {
          console.warn('[PuzzleSettingsComponent] La subida de imagen no devolvió un ID válido. La configuración se guardará sin la nueva imagen.');
          configToSave.imageUrl = '';
        }
      }

      // Paso 2: Desactivar todos los demás niveles antes de guardar la configuración del nivel actual
      // Esto se hace en el backend para asegurar la consistencia.
      if (configToSave.isActive) {
        await this.deactivateOtherLevels(configToSave.level_name!);
      }

      // Paso 3: Guardar la configuración (con el ID de la imagen o el existente) en Directus
      console.log(`[PuzzleSettingsComponent] Guardando configuración para ${configToSave.level_name}:`, configToSave);

      const savedConfig: PuzzleConfig | undefined = await this.puzzleService.savePuzzleConfig(configToSave).toPromise();

      if (savedConfig) {
        // Paso 4: Actualizar el estado del componente con la configuración guardada por Directus
        switch (level) {
          case 'level1':
            this.level1Config = { ...savedConfig };
            this.level1ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level1ImageFile = null;
            break;
          case 'level2':
            this.level2Config = { ...savedConfig };
            this.level2ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level2ImageFile = null;
            break;
          case 'level3':
            this.level3Config = { ...savedConfig };
            this.level3ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level3ImageFile = null;
            break;
        }
        console.log(`[PuzzleSettingsComponent] Configuración de ${configToSave.level_name} guardada exitosamente:`, savedConfig);
        alert(`¡Configuración de ${configToSave.level_name} guardada exitosamente!`);

        // Si este nivel se acaba de activar, establecerlo como el nivel de rompecabezas actual en el servicio compartido.
        if (savedConfig.isActive && savedConfig.level_name) {
          this.sharedDataService.setCurrentPuzzleLevel(savedConfig.level_name);
          console.log(`[PuzzleSettingsComponent] Nivel de rompecabezas actual establecido a: ${savedConfig.level_name}`);
        } else if (!savedConfig.isActive && this.sharedDataService.getCurrentPuzzleLevel() === savedConfig.level_name) {
            // Si el nivel se desactiva y era el activo, limpiar el nivel activo
            this.sharedDataService.setCurrentPuzzleLevel('');
        }

      } else {
        console.error(`[PuzzleSettingsComponent] La operación de guardado de la configuración para ${configToSave.level_name} no devolvió datos válidos.`);
        alert(`Error al guardar la configuración de ${configToSave.level_name}: no se recibieron datos válidos.`);
      }

    } catch (error) {
      console.error(`[PuzzleSettingsComponent] Error al guardar la configuración de ${configToSave.level_name}:`, error);
      alert(`Error al guardar la configuración de ${configToSave.level_name}. Por favor, inténtalo de nuevo.`);
    }
  }

  /**
   * Desactiva todos los niveles de rompecabezas excepto el especificado.
   * Esto debe actualizar la base de datos a través de PuzzleService.
   */
  private async deactivateOtherLevels(activeLevelName: string): Promise<void> {
    const allLevelNames = ['Nivel1', 'Nivel2', 'Nivel3'];
    const levelsToDeactivate = allLevelNames.filter(name => name !== activeLevelName);

    for (const levelName of levelsToDeactivate) {
      let configToUpdate: PuzzleConfig | undefined;
      switch (levelName) {
        case 'Nivel1': configToUpdate = this.level1Config; break;
        case 'Nivel2': configToUpdate = this.level2Config; break;
        case 'Nivel3': configToUpdate = this.level3Config; break;
      }

      if (configToUpdate && configToUpdate.isActive) {
        console.log(`[PuzzleSettingsComponent] Desactivando ${levelName}...`);
        configToUpdate.isActive = false;
        // Solo guardamos si ya tiene un ID, lo que significa que existe en Directus.
        // Si no tiene ID, significa que nunca se ha guardado, así que no hay nada que actualizar en Directus.
        if (configToUpdate.id) {
          try {
            await this.puzzleService.savePuzzleConfig(configToUpdate).toPromise();
            console.log(`[PuzzleSettingsComponent] ${levelName} desactivado en Directus.`);
          } catch (error) {
            console.error(`[PuzzleSettingsComponent] Error al desactivar ${levelName} en Directus:`, error);
          }
        }
      }
    }
  }
}