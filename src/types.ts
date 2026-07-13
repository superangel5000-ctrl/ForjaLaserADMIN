export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string;
  medidaNombre: string;
  medidaAncho: number;
  medidaAlto: number;
  medidaProfundidad: number;
  tiempoCorteMinutos: number;
  ensambleHabilitado: boolean;
  costoEnsamble: number;
  costoMaterial: number;
  costoMaquina: number;
  costoTotal: number;
  precioMenudeo: number;
  precioMayoreo: number;
  cantidadMayoreo: number;
  descripcion: string;
  imagenes?: string[]; // Array de strings Base64 o referencias
  tags: string[];
  destacado: boolean;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  gananciaUnitaria: number;
  margenPorcentaje: number;
}

export interface Publicacion {
  id: string;
  titulo: string;
  contenido: string;
  redes: string[]; // ['facebook', 'whatsapp', 'instagram', 'tiktok']
  productoId: string;
  favorita: boolean;
  contadorUso: number;
  ultimoUso?: string;
  hashtags: string[];
  imagenes?: string; // Imagen principal Base64
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: 'Ocasión' | 'Tipo de Producto';
  activa: boolean;
  orden: number;
}

export interface Medida {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  profundidad: number;
}

export interface PlantillaMensaje {
  id: string;
  nombre: string;
  tipo: string;
  contenido: string;
  redes: string[];
  activa: boolean;
  contadorUso: number;
}

export interface Usuario {
  id: string;
  username: string;
  passwordHash: string;
  nombre: string;
  rol: 'administrador' | 'colaborador';
  activo: boolean;
}

export interface Configuracion {
  empresa: {
    nombre: string;
    eslogan: string;
    telefonos: string;
    direccion: string;
  };
  idioma: 'es' | 'en';
  tema: 'claro' | 'oscuro';
  moneda: string;
  costos: {
    precioTabla40x40: number;
    costoPorMinuto: number;
    costoEnsambleDefault: number;
  };
  inicializado: boolean;
}

export interface Cotizacion {
  id: string;
  cliente: string;
  fecha: string;
  productos: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }[];
  subtotal: number;
  descuento: number;
  extras: {
    envio: number;
    personalizacion: number;
    ensamble: number;
  };
  total: number;
  notas: string;
  mensajeWhatsApp: string;
}
