import { supabase } from '../utils/supabase';
import { BUCKETS, generateFilePath as configGenerateFilePath, validateFile as configValidateFile } from '../config/storage';

export { BUCKETS };

/**
 * Sube un archivo a Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta donde se guardará el archivo
 * @param {File} file - Archivo a subir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos del archivo subido
 */
export async function uploadFile(bucket, path, file, options = {}) {
  // Validar el archivo según las reglas del bucket
  const validation = configValidateFile(file, bucket);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { onProgress, upsert = true, contentType = file.type } = options;
  
  // Configurar el manejador de progreso si se proporciona
  const uploadOptions = {
    upsert,
    contentType,
    cacheControl: '3600',
  };

  if (onProgress) {
    uploadOptions.onUploadProgress = (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      onProgress(percent);
    };
  }

  // Subir el archivo
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, uploadOptions);

  if (error) {
    console.error('Error al subir archivo:', error);
    throw new Error(error.message || 'Error al subir el archivo');
  }
  
  return data;
}

/**
 * Obtiene la URL pública de un archivo
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {string} URL pública del archivo
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Elimina un archivo de Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string|string[]} paths - Ruta o rutas de los archivos a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function deleteFile(bucket, paths) {
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(pathsArray);
    
  if (error) {
    console.error('Error al eliminar archivo:', error);
    throw new Error(error.message || 'Error al eliminar el archivo');
  }
  
  return data;
}

/**
 * Genera una ruta de archivo consistente
 * @param {string} entityType - Tipo de entidad (users, parcels, etc.)
 * @param {string} entityId - ID de la entidad
 * @param {string} fileName - Nombre del archivo
 * @returns {string} Ruta completa del archivo
 */
export const generateFilePath = (entityType, entityId, fileName) => {
  return configGenerateFilePath(BUCKETS.DOCUMENTS, entityType, entityId, fileName);
};

/**
 * Obtiene la URL de descarga de un archivo
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @param {number} expiresIn - Tiempo de expiración en segundos (predeterminado: 1 hora)
 * @returns {Promise<string>} URL de descarga firmada
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
    
  if (error) {
    console.error('Error al generar URL firmada:', error);
    throw new Error(error.message || 'Error al generar URL de descarga');
  }
  
  return data.signedUrl;
}

/**
 * Lista los archivos en un directorio
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del directorio
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} Lista de archivos
 */
export async function listFiles(bucket, path = '', options = {}) {
  const { limit = 100, offset = 0, sortBy = { column: 'name', order: 'asc' } } = options;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit,
      offset,
      sortBy,
    });
    
  if (error) {
    console.error('Error al listar archivos:', error);
    throw new Error(error.message || 'Error al listar archivos');
  }
  
  return data;
}
