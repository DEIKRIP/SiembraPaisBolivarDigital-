/**
 * Configuración de buckets de almacenamiento
 * 
 * Cada bucket tiene sus propias políticas de seguridad y configuración
 */

export const BUCKETS = {
  DOCUMENTS: 'documents', // Documentos generales (PDF, Word, etc.)
  IMAGES: 'images',       // Imágenes (perfiles, fotos, etc.)
  MEDIA: 'media',         // Archivos multimedia (videos, audio)
  TEMP: 'temp',           // Archivos temporales
};

/**
 * Tipos de archivo permitidos por bucket
 */
export const ALLOWED_FILE_TYPES = {
  [BUCKETS.DOCUMENTS]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/rtf',
  ],
  [BUCKETS.IMAGES]: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  [BUCKETS.MEDIA]: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ],
  [BUCKETS.TEMP]: ['*/*'], // Cualquier tipo de archivo
};

/**
 * Tamaño máximo de archivo por bucket (en bytes)
 */
export const MAX_FILE_SIZES = {
  [BUCKETS.DOCUMENTS]: 10 * 1024 * 1024, // 10MB
  [BUCKETS.IMAGES]: 5 * 1024 * 1024,     // 5MB
  [BUCKETS.MEDIA]: 50 * 1024 * 1024,     // 50MB
  [BUCKETS.TEMP]: 10 * 1024 * 1024,      // 10MB
};

/**
 * Genera rutas consistentes para los archivos
 * 
 * @param {string} bucket - Nombre del bucket
 * @param {string} entityType - Tipo de entidad (users, parcels, etc.)
 * @param {string} entityId - ID de la entidad
 * @param {string} fileName - Nombre del archivo
 * @returns {string} Ruta completa del archivo
 */
export const generateFilePath = (bucket, entityType, entityId, fileName) => {
  const timestamp = new Date().getTime();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-]/g, '_');
  return `${bucket}/${entityType}/${entityId}/${timestamp}_${cleanFileName}`;
};

/**
 * Extrae metadatos útiles de un archivo
 */
export const getFileMetadata = (file) => ({
  name: file.name,
  type: file.type,
  size: file.size,
  lastModified: file.lastModified,
  extension: file.name.split('.').pop().toLowerCase(),
});

/**
 * Valida un archivo según las reglas del bucket
 */
export const validateFile = (file, bucket) => {
  const maxSize = MAX_FILE_SIZES[bucket] || MAX_FILE_SIZES[BUCKETS.DOCUMENTS];
  const allowedTypes = ALLOWED_FILE_TYPES[bucket] || [];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSize / (1024 * 1024)}MB`,
    };
  }
  
  if (allowedTypes[0] !== '*/*' && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Formatos permitidos: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
};
