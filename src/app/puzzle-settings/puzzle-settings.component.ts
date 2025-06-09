import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PuzzleService } from '../puzzle.service';
import { PuzzleConfig } from '../puzzle-config.model';

@Component({
  selector: 'app-puzzle-settings',
  templateUrl: './puzzle-settings.component.html',
  styleUrl: './puzzle-settings.component.css'
})
export class PuzzleSettingsComponent implements OnInit {
  title = 'Rompecabezas';

  // Modelos para la configuración de cada nivel.
  // Inicializamos con valores por defecto. Las propiedades son opcionales en la interfaz.
  level1Config: PuzzleConfig = { level_name: 'Nivel1', rows: 2, cols: 2, time_limit: 180 };
  level2Config: PuzzleConfig = { level_name: 'Nivel2', rows: 3, cols: 3, time_limit: 120 };
  level3Config: PuzzleConfig = { level_name: 'Nivel3', rows: 4, cols: 4, time_limit: 90 };

  // Para previsualización de imágenes seleccionadas localmente
  level1ImagePreview: string | ArrayBuffer | null = null;
  level2ImagePreview: string | ArrayBuffer | null = null;
  level3ImagePreview: string | ArrayBuffer | null = null;

  // Para guardar el objeto File seleccionado temporalmente antes de subirlo a Directus
  level1ImageFile: File | null = null;
  level2ImageFile: File | null = null;
  level3ImageFile: File | null = null;

  constructor(private puzzleService: PuzzleService) {}

  ngOnInit(): void {
    // Cargar la configuración existente para cada nivel al iniciar el componente
    this.loadLevelConfig('Nivel1');
    this.loadLevelConfig('Nivel2');
    this.loadLevelConfig('Nivel3');
  }

  /**
   * Carga la configuración de un nivel específico desde Directus.
   * @param levelName El nombre del nivel a cargar.
   */
  loadLevelConfig(levelName: string): void {
    this.puzzleService.getPuzzleConfigByLevel(levelName).subscribe(
      (response: any) => {
        const configData: PuzzleConfig | undefined = response.data?.[0]; // Usar optional chaining para seguridad
        console.log(`Respuesta de Directus para ${levelName}:`, response); // Debug: ver la respuesta completa
        console.log(`Datos de configuración procesados para ${levelName}:`, configData); // Debug: ver el objeto extraído

        if (configData) {
          // Asignar los datos cargados a la configuración correspondiente
          switch (levelName) {
            case 'Nivel1':
              this.level1Config = { ...this.level1Config, ...configData }; // Fusionar para no perder valores por defecto si no vienen
              // CORRECTO: Usar configData.imageUrl
              this.level1ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case 'Nivel2':
              this.level2Config = { ...this.level2Config, ...configData };
              // CORRECTO: Usar configData.imageUrl
              this.level2ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
            case 'Nivel3':
              this.level3Config = { ...this.level3Config, ...configData };
              // CORRECTO: Usar configData.imageUrl
              this.level3ImagePreview = configData.imageUrl ? this.puzzleService.getDirectusFileUrl(configData.imageUrl) : null;
              break;
          }
          console.log(`Configuración de ${levelName} cargada:`, configData);
        } else {
          console.log(`No se encontró configuración para ${levelName}. Se usarán valores por defecto.`);
        }
      },
      (error) => {
        console.error(`Error al cargar la configuración de ${levelName}:`, error);
        // Opcional: mostrar un mensaje al usuario o revertir a valores por defecto estáticos
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
          // Si el usuario deselecciona la imagen, también deberías considerar limpiar
          // la referencia en la configuración para que no se guarde una imagen anterior
          // si no se selecciona una nueva.
          this.level1Config.imageUrl = ''; // Borrar la referencia de imagen en el modelo
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
        console.error('Nivel de configuración no válido.');
        return;
    }

    try {
      // Paso 1: Subir la imagen a Directus si se seleccionó una nueva
      if (imageFile) {
        console.log(`Subiendo imagen para ${configToSave.level_name}...`);
        const uploadResponse = await this.puzzleService.uploadImage(imageFile).toPromise();

        if (uploadResponse && uploadResponse.data && uploadResponse.data.id) {
          // CORRECTO: Asigna el ID del archivo de Directus a configToSave.imageUrl
          configToSave.imageUrl = uploadResponse.data.id;
          console.log('Imagen subida, ID:', configToSave.imageUrl);
        } else {
          console.warn('La subida de imagen no devolvió un ID válido. La configuración se guardará sin la nueva imagen.');
          // Si la subida falla, asegúrate de que no se use un ID de imagen incorrecto.
          configToSave.imageUrl = ''; // O null, dependiendo de tu interfaz y si Directus lo acepta
        }
      }
      // Nota: Si imageFile es null, `configToSave.imageUrl` mantendrá su valor actual.
      // Si el usuario previamente tenía una imagen y la deseleccionó (en `onImageSelected`),
      // `configToSave.imageUrl` ya habrá sido limpiado a `''`.

      // Paso 2: Guardar la configuración (con el ID de la imagen o el existente) en Directus
      console.log(`Guardando configuración para ${configToSave.level_name}:`, configToSave);
      const savedConfig = await this.puzzleService.savePuzzleConfig(configToSave).toPromise();

      // Paso 3: Actualizar el estado del componente con la configuración guardada por Directus
      if (savedConfig) {
        switch (level) {
          case 'level1':
            this.level1Config = { ...savedConfig };
            // CORRECTO: Usar savedConfig.imageUrl
            this.level1ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level1ImageFile = null;
            break;
          case 'level2':
            this.level2Config = { ...savedConfig };
            // CORRECTO: Usar savedConfig.imageUrl
            this.level2ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level2ImageFile = null;
            break;
          case 'level3':
            this.level3Config = { ...savedConfig };
            // CORRECTO: Usar savedConfig.imageUrl
            this.level3ImagePreview = savedConfig.imageUrl ? this.puzzleService.getDirectusFileUrl(savedConfig.imageUrl) : null;
            this.level3ImageFile = null;
            break;
        }
        console.log(`Configuración de ${configToSave.level_name} guardada exitosamente:`, savedConfig);
        alert(`¡Configuración de ${configToSave.level_name} guardada exitosamente!`);
      } else {
        console.error(`La operación de guardado de la configuración para ${configToSave.level_name} no devolvió datos.`);
        alert(`Error al guardar la configuración de ${configToSave.level_name}: no se recibieron datos válidos.`);
      }

    } catch (error) {
      console.error(`Error al guardar la configuración de ${configToSave.level_name}:`, error);
      alert(`Error al guardar la configuración de ${configToSave.level_name}. Por favor, inténtalo de nuevo.`);
    }
  }
}