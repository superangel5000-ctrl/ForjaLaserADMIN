import { Producto } from './types';

// Constantes de costos por defecto
export const COSTOS_DEFAULT = {
  precioTabla40x40: 15,
  costoPorMinuto: 0.15,
  costoEnsambleDefault: 5
};

// Función para generar Hash SHA-256 nativa y asíncrona
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cálculo automático de material
export function calcularCostoMaterial(
  ancho: number,
  alto: number,
  profundidad: number = 0,
  precioTabla: number = COSTOS_DEFAULT.precioTabla40x40
): number {
  let area = ancho * alto;
  if (profundidad > 0) {
    area += 2 * (ancho * profundidad) + 2 * (alto * profundidad);
  }
  const tablas = area / 1600;
  return Math.ceil(tablas * precioTabla);
}

// Cálculo automático de máquina
export function calcularCostoMaquina(
  tiempoMinutos: number,
  costoPorMinuto: number = COSTOS_DEFAULT.costoPorMinuto
): number {
  return Math.round(tiempoMinutos * costoPorMinuto * 100) / 100;
}

// Cálculo de costo total
export function calcularCostoTotal(
  ancho: number,
  alto: number,
  profundidad: number,
  tiempoMinutos: number,
  ensambleHabilitado: boolean,
  costoEnsamble: number = COSTOS_DEFAULT.costoEnsambleDefault,
  precioTabla: number = COSTOS_DEFAULT.precioTabla40x40,
  costoPorMinuto: number = COSTOS_DEFAULT.costoPorMinuto
): number {
  const mat = calcularCostoMaterial(ancho, alto, profundidad, precioTabla);
  const maq = calcularCostoMaquina(tiempoMinutos, costoPorMinuto);
  let total = mat + maq;
  if (ensambleHabilitado) {
    total += costoEnsamble;
  }
  return Math.round(total * 100) / 100;
}

// Comprimir imágenes antes de convertirlas a Base64
export async function compressImage(
  file: File,
  maxWidth: number = 1000,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D de canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Sistema de chunks (cuando Base64 > 1MB)
export const MAX_CHUNK_SIZE = 1000000; // 1MB

export function splitIntoChunks(base64String: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < base64String.length; i += MAX_CHUNK_SIZE) {
    chunks.push(base64String.slice(i, i + MAX_CHUNK_SIZE));
  }
  return chunks;
}

// Formateadores
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

// Temporadas de negocio
export interface Temporada {
  id: string;
  nombre: string;
  fecha: string; // MM-DD
  descripcion: string;
}

export const TEMPORADAS: Temporada[] = [
  { id: 'san_valentin', nombre: 'San Valentín', fecha: '02-14', descripcion: 'Día del Amor y la Amistad' },
  { id: 'dia_nino', nombre: 'Día del Niño', fecha: '04-30', descripcion: 'Celebraciones infantiles' },
  { id: 'dia_madres', nombre: 'Día de las Madres', fecha: '05-10', descripcion: 'Regalos para mamá' },
  { id: 'graduaciones', nombre: 'Temporada de Graduaciones', fecha: '05-15', descripcion: 'Recuerdos y charolas' },
  { id: 'dia_padre', nombre: 'Día del Padre', fecha: '06-15', descripcion: 'Regalos para papá' },
  { id: 'independencia', nombre: '15 de Septiembre', fecha: '09-15', descripcion: 'Fiestas Patrias' },
  { id: 'halloween', nombre: 'Halloween / Día de Muertos', fecha: '10-31', descripcion: 'Ofrendas y dulceros' },
  { id: 'navidad', nombre: 'Navidad', fecha: '12-25', descripcion: 'Adornos navideños y regalos' },
  { id: 'ano_nuevo', nombre: 'Año Nuevo', fecha: '01-01', descripcion: 'Fin de año' }
];

// Calcular días restantes para una temporada dada
export function calcularDiasRestantes(fechaTemporada: string): { dias: number; proximaFecha: Date } {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const [mes, dia] = fechaTemporada.split('-').map(Number);
  
  let fechaTemp = new Date(anioActual, mes - 1, dia);
  
  // Si la fecha de este año ya pasó, calcular para el próximo año
  if (fechaTemp.getTime() < hoy.getTime() && hoy.getDate() !== dia && hoy.getMonth() !== (mes - 1)) {
    fechaTemp.setFullYear(anioActual + 1);
  }
  
  const diferenciaMs = fechaTemp.getTime() - hoy.getTime();
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  return { dias: Math.max(0, dias), proximaFecha: fechaTemp };
}
