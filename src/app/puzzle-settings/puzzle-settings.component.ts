import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PuzzleService } from '../puzzle.service';
import { PuzzleConfig } from '../puzzle-config.model';
import { SharedDataService } from '../sharedData.service';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importar MatSnackBar
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-puzzle-settings',
  templateUrl: './puzzle-settings.component.html',
  styleUrls: ['./puzzle-settings.component.css']
})
export class PuzzleSettingsComponent implements OnInit {
  title = 'Rompecabezas';

  // Modelos para la configuración de cada nivel.
  // Inicializamos con valores por defecto y agregamos 'isActive'.
  level1Config: PuzzleConfig = { level_name: 'Nivel1', rows: 2, cols: 2, time_limit: 180, isActive: false, level: '183770b3-0e66-4932-8769-b0c1b4738d79'   };
  level2Config: PuzzleConfig = { level_name: 'Nivel2', rows: 3, cols: 3, time_limit: 120, isActive: false, level: '98fd8047-6897-4a86-85e2-f430e48956bd' };
  level3Config: PuzzleConfig = { level_name: 'Nivel3', rows: 4, cols: 4, time_limit: 90, isActive: false, level: '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1' };

  // Para previsualización de imágenes seleccionadas localmente
  level1ImagePreview: string | ArrayBuffer | null = null;
  level2ImagePreview: string | ArrayBuffer | null = null;
  level3ImagePreview: string | ArrayBuffer | null = null;

  // Para guardar el objeto File seleccionado temporalmente antes de subirlo a Directus
  level1ImageFile: File | null = null;
  level2ImageFile: File | null = null;
  level3ImageFile: File | null = null;

  constructor(
    private router: Router,
    private puzzleService: PuzzleService,
    private sharedDataService: SharedDataService,
    private snackBar: MatSnackBar, // Inyectar MatSnackBar
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar la configuración existente para cada nivel al iniciar el componente
    this.loadAllLevelConfigs();
  }

  loadAllLevelConfigs(): void {
    const levelsIds = ['183770b3-0e66-4932-8769-b0c1b4738d79', '98fd8047-6897-4a86-85e2-f430e48956bd', '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1'];
    levelsIds.forEach((level, index) => this.loadLevelConfig(level));
  }

  /**
   * Carga la configuración de un nivel específico desde Directus.
   * @param level El nombre del nivel a cargar.
   */
  loadLevelConfig(level: string): void {
    this.puzzleService.getPuzzleConfigByLevel(level).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response.data?.[0];
        console.log(`[PuzzleSettingsComponent] Respuesta de Directus para ${level}:`, response);
        console.log(`[PuzzleSettingsComponent] Datos de configuración procesados para ${level}:`, configData);

        if (configData) {
          switch (configData.level) {
            case '183770b3-0e66-4932-8769-b0c1b4738d79':
              this.level1Config = { ...this.level1Config, ...configData };
              this.level1ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case '98fd8047-6897-4a86-85e2-f430e48956bd':
              this.level2Config = { ...this.level2Config, ...configData };
              this.level2ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case '3c16b66e-0fa4-4ecc-a9ae-41dd832f0bc1':
              this.level3Config = { ...this.level3Config, ...configData };
              this.level3ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
          }
          console.log(`[PuzzleSettingsComponent] Configuración de ${level} cargada:`, configData);

          if (configData.isActive) {
            this.sharedDataService.setCurrentPuzzleLevel(configData.level!);
          }
        } else {
          console.log(`[PuzzleSettingsComponent] No se encontró configuración para ${level}. Se usarán valores por defecto.`);
        }
      },
      (error) => {
        console.error(`[PuzzleSettingsComponent] Error al cargar la configuración de ${level}:`, error);
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
   * Actualiza el estado 'isActive' de un nivel en el modelo local.
   * La persistencia en la base de datos se realizará al hacer clic en "Guardar Configuración".
   * @param level El nivel cuya propiedad 'isActive' ha cambiado.
   * @param isActive El nuevo estado de 'isActive'.
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
      // Actualiza el servicio compartido inmediatamente para que el juego sepa qué nivel está activo
      this.sharedDataService.setCurrentPuzzleLevel(configToUpdate.level_name!);
    } else {
      // Si se desactiva el nivel actual y era el que estaba activo, limpiar el nivel activo en sharedDataService
      if (this.sharedDataService.getCurrentPuzzleLevel() === configToUpdate.level_name) {
        this.sharedDataService.setCurrentPuzzleLevel(''); 
      }
    }
    configToUpdate.isActive = isActive;

    // IMPORTANTE: Se ha eliminado la llamada a this.saveLevelConfig(level) aquí.
    // Los cambios de isActive se guardarán solo cuando el usuario haga clic en el botón "Guardar Configuración".
  }


  /**
   * Guarda la configuración de un nivel específico en Directus.
   * Incluye la subida de la imagen si se seleccionó una nueva.
   * Realiza validaciones antes de guardar.
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
        this.showSnackbar('Error de Configuración: Nivel de configuración no válido.', 'Cerrar');
        return;
    }

    // --- Validación de campos vacíos/inválidos ---
    const rows = Number(configToSave.rows);
    const cols = Number(configToSave.cols);
    const timeLimit = Number(configToSave.time_limit);

    if (isNaN(rows) || rows <= 0 || !Number.isInteger(rows)) {
      this.showSnackbar(`Error de Validación: El número de filas para ${configToSave.level_name} no es válido. Debe ser un número entero positivo.`, 'Cerrar');
      return;
    }
    if (isNaN(cols) || cols <= 0 || !Number.isInteger(cols)) {
      this.showSnackbar(`Error de Validación: El número de columnas para ${configToSave.level_name} no es válido. Debe ser un número entero positivo.`, 'Cerrar');
      return;
    }
    if (isNaN(timeLimit) || timeLimit < 0 || !Number.isInteger(timeLimit)) {
      this.showSnackbar(`Error de Validación: El tiempo límite para ${configToSave.level_name} no es válido. Debe ser un número entero positivo o cero.`, 'Cerrar');
      return;
    }
    
    // Asignar los valores numéricos validados de vuelta al objeto
    configToSave.rows = rows;
    configToSave.cols = cols;
    configToSave.time_limit = timeLimit;

    // Validación específica para el número de piezas por lado (rows/cols)
    if (configToSave.level_name === 'Nivel1' && (configToSave.rows !== 2 || configToSave.cols !== 2)) {
      this.showSnackbar('Error de Validación: Para Nivel 1, la cantidad de piezas por lado debe ser 2.', 'Cerrar');
      return;
    }
    if (configToSave.level_name === 'Nivel2' && (configToSave.rows !== 3 || configToSave.cols !== 3)) {
      this.showSnackbar('Error de Validación: Para Nivel 2, la cantidad de piezas por lado debe ser 3.', 'Cerrar');
      return;
    }
    if (configToSave.level_name === 'Nivel3' && (configToSave.rows !== 4 || configToSave.cols !== 4)) {
      this.showSnackbar('Error de Validación: Para Nivel 3, la cantidad de piezas por lado debe ser 4.', 'Cerrar');
      return;
    }
    
    // Validación de imagen: Se requiere una imagen si no hay una URL existente y no se ha subido un nuevo archivo.
    if (!configToSave.imageUrl && !imageFile) {
        this.showSnackbar(`Error de Validación: Debe seleccionar una imagen para ${configToSave.level_name}.`, 'Cerrar');
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
      // Solo si el nivel actual se está activando, se desactivan los demás.
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
        
        // Mostrar el Snackbar de éxito solo al hacer clic en "Guardar Configuración"
        this.showSnackbar(`¡Configuración de ${configToSave.level_name} guardada exitosamente!`, 'Ok', 3000); // Duración de 3 segundos

        // Si este nivel se acaba de activar, establecerlo como el nivel de rompecabezas actual en el servicio compartido.
        // Esto ya se maneja en onLevelActiveChange al manipular el slide toggle.
        // Sin embargo, si el usuario cambia el toggle y luego guarda, esta lógica asegura que sharedDataService esté sincronizado.
        if (savedConfig.isActive && savedConfig.level_name) {
          this.sharedDataService.setCurrentPuzzleLevel(savedConfig.level_name);
          console.log(`[PuzzleSettingsComponent] Nivel de rompecabezas actual establecido a: ${savedConfig.level_name}`);
        } else if (!savedConfig.isActive && this.sharedDataService.getCurrentPuzzleLevel() === savedConfig.level_name) {
            // Si el nivel se desactiva y era el activo, limpiar el nivel activo
            this.sharedDataService.setCurrentPuzzleLevel('');
        }

      } else {
        console.error(`[PuzzleSettingsComponent] La operación de guardado de la configuración para ${configToSave.level_name} no devolvió datos válidos.`);
        this.showSnackbar(`Error al guardar la configuración de ${configToSave.level_name}: no se recibieron datos válidos.`, 'Cerrar');
      }

    } catch (error) {
      console.error(`[PuzzleSettingsComponent] Error al guardar la configuración de ${configToSave.level_name}:`, error);
      this.showSnackbar(`Error al guardar la configuración de ${configToSave.level_name}. Por favor, inténtalo de nuevo.`, 'Cerrar');
    }
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

  /**
   * Desactiva todos los niveles de rompecabezas excepto el especificado en la base de datos.
   * Obtiene la configuración más reciente de cada nivel antes de actualizarla.
   */
  private async deactivateOtherLevels(activeLevelName: string): Promise<void> {
    const allLevelNames = ['Nivel1', 'Nivel2', 'Nivel3'];

    for (const levelName of allLevelNames) {
      if (levelName === activeLevelName) {
        continue; 
      }

      console.log(`[PuzzleSettingsComponent] Intentando desactivar ${levelName} en la base de datos...`);
      try {
        const response: any = await this.puzzleService.getPuzzleConfigByLevel(levelName).toPromise();
        const configToDeactivate: PuzzleConfig | undefined = response.data?.[0];

        // Solo intentar desactivar si el objeto de configuración existe, tiene un ID
        // y actualmente está activo en la base de datos.
        if (configToDeactivate && configToDeactivate.id && configToDeactivate.isActive) {
          configToDeactivate.isActive = false;

          await this.puzzleService.savePuzzleConfig(configToDeactivate).toPromise();
          console.log(`[PuzzleSettingsComponent] ${levelName} desactivado en Directus.`);

          // También actualiza el estado local del componente para consistencia inmediata de la UI
          // Esto es importante para que los toggles se desactiven visualmente.
          switch (levelName) {
            case 'Nivel1': this.level1Config.isActive = false; break;
            case 'Nivel2': this.level2Config.isActive = false; break;
            case 'Nivel3': this.level3Config.isActive = false; break;
          }
        } else {
          console.log(`[PuzzleSettingsComponent] ${levelName} no encontrado, no tiene ID, o ya estaba inactivo en la DB. No se necesita desactivación.`);
        }
      } catch (error) {
        console.error(`[PuzzleSettingsComponent] Error al desactivar ${levelName} en Directus:`, error);
        // Considera mostrar un snackbar de error aquí si es crítico para el usuario saber
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
