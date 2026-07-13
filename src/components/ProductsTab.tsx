import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, Star, Info, Upload, X, ArrowLeft, ArrowRight, Save, Download, Copy, Check, FileText } from 'lucide-react';
import { Producto, Categoria, Medida, Publicacion } from '../types';
import { ref, set, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { 
  calcularCostoMaterial, 
  calcularCostoMaquina, 
  calcularCostoTotal, 
  compressImage, 
  splitIntoChunks, 
  formatMoney 
} from '../utils';

interface ProductsTabProps {
  productos: Producto[];
  categorias: Categoria[];
  medidas: Medida[];
  publicaciones?: Publicacion[];
  showNewProductModal: boolean;
  setShowNewProductModal: (show: boolean) => void;
  t: any;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  productos,
  categorias,
  medidas,
  publicaciones = [],
  showNewProductModal,
  setShowNewProductModal,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFeatured, setSelectedFeatured] = useState('');
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Estados para el Detalle de un Producto seleccionado
  const [selectedProductDetail, setSelectedProductDetail] = useState<Producto | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedPubId, setCopiedPubId] = useState<string | null>(null);

  // Estados del Formulario de Producto
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('');
  const [medidaNombre, setMedidaNombre] = useState('');
  const [medidaAncho, setMedidaAncho] = useState(0);
  const [medidaAlto, setMedidaAlto] = useState(0);
  const [medidaProfundidad, setMedidaProfundidad] = useState(0);
  const [tiempoCorteMinutos, setTiempoCorteMinutos] = useState(0);
  const [ensambleHabilitado, setEnsambleHabilitado] = useState(false);
  const [costoEnsamble, setCostoEnsamble] = useState(5);
  const [precioMenudeo, setPrecioMenudeo] = useState(0);
  const [precioMayoreo, setPrecioMayoreo] = useState(0);
  const [cantidadMayoreo, setCantidadMayoreo] = useState(6);
  const [descripcion, setDescripcion] = useState('');
  const [destacado, setDestacado] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]); // Array de Base64
  const [isUploading, setIsUploading] = useState(false);

  // Cálculos dinámicos del formulario
  const [costoMaterial, setCostoMaterial] = useState(0);
  const [costoMaquina, setCostoMaquina] = useState(0);
  const [costoTotal, setCostoTotal] = useState(0);
  const [ganancia, setGanancia] = useState(0);
  const [margen, setMargen] = useState(0);

  // Resetear Formulario
  const resetForm = () => {
    setNombre('');
    setCategoria('');
    setTipo('');
    setMedidaNombre('');
    setMedidaAncho(0);
    setMedidaAlto(0);
    setMedidaProfundidad(0);
    setTiempoCorteMinutos(0);
    setEnsambleHabilitado(false);
    setCostoEnsamble(5);
    setPrecioMenudeo(0);
    setPrecioMayoreo(0);
    setCantidadMayoreo(6);
    setDescripcion('');
    setDestacado(false);
    setTags([]);
    setImagenes([]);
    setEditingProduct(null);
  };

  // Abrir para crear nuevo
  const handleOpenCreate = () => {
    resetForm();
    setShowNewProductModal(true);
  };

  // Abrir para editar
  const handleOpenEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setNombre(producto.nombre);
    setCategoria(producto.categoria);
    setTipo(producto.tipo);
    setMedidaNombre(producto.medidaNombre || '');
    setMedidaAncho(producto.medidaAncho || 0);
    setMedidaAlto(producto.medidaAlto || 0);
    setMedidaProfundidad(producto.medidaProfundidad || 0);
    setTiempoCorteMinutos(producto.tiempoCorteMinutos || 0);
    setEnsambleHabilitado(producto.ensambleHabilitado || false);
    setCostoEnsamble(producto.costoEnsamble !== undefined ? producto.costoEnsamble : 5);
    setPrecioMenudeo(producto.precioMenudeo || 0);
    setPrecioMayoreo(producto.precioMayoreo || 0);
    setCantidadMayoreo(producto.cantidadMayoreo || 6);
    setDescripcion(producto.descripcion || '');
    setDestacado(producto.destacado || false);
    setTags(producto.tags || []);
    setImagenes(producto.imagenes || []);
    setShowNewProductModal(true);
  };

  // Sincronizar cálculos en tiempo real
  useEffect(() => {
    const mat = calcularCostoMaterial(medidaAncho, medidaAlto, medidaProfundidad);
    const maq = calcularCostoMaquina(tiempoCorteMinutos);
    let tot = mat + maq;
    if (ensambleHabilitado) {
      tot += costoEnsamble;
    }
    
    setCostoMaterial(mat);
    setCostoMaquina(maq);
    setCostoTotal(tot);

    const gan = precioMenudeo - tot;
    const marg = precioMenudeo > 0 ? (gan / precioMenudeo) * 100 : 0;
    setGanancia(Math.round(gan * 100) / 100);
    setMargen(Math.round(marg * 100) / 100);
  }, [medidaAncho, medidaAlto, medidaProfundidad, tiempoCorteMinutos, ensambleHabilitado, costoEnsamble, precioMenudeo]);

  // Al seleccionar una medida predeterminada
  const handleSelectMedidaPredefinida = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const medId = e.target.value;
    if (!medId) return;
    const med = medidas.find(m => m.id === medId);
    if (med) {
      setMedidaNombre(med.nombre);
      setMedidaAncho(med.ancho);
      setMedidaAlto(med.alto);
      setMedidaProfundidad(med.profundidad);
    }
  };

  // Subir / Comprimir imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    
    const base64Images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const compressedBase64 = await compressImage(file, 1000, 0.7);
        base64Images.push(compressedBase64);
      } catch (err) {
        console.error("Error comprimiendo imagen", err);
      }
    }

    setImagenes(prev => [...prev, ...base64Images]);
    setIsUploading(false);
  };

  // Reordenar imágenes (Mover izquierda / derecha en el array)
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= imagenes.length) return;
    
    const updated = [...imagenes];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setImagenes(updated);
  };

  // Eliminar imagen individual
  const deleteImage = (index: number) => {
    setImagenes(prev => prev.filter((_, idx) => idx !== index));
  };

  // Agregar tag chip
  const addTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  // Guardar Producto en Firebase RTDB
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const pid = (editingProduct && editingProduct.id) ? editingProduct.id : `prod_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const finalProduct: Producto = {
      id: pid,
      nombre: nombre.trim(),
      categoria: categoria || '',
      tipo: tipo || '',
      medidaNombre: medidaNombre || '',
      medidaAncho: medidaAncho || 0,
      medidaAlto: medidaAlto || 0,
      medidaProfundidad: medidaProfundidad || 0,
      tiempoCorteMinutos: tiempoCorteMinutos || 0,
      ensambleHabilitado: ensambleHabilitado || false,
      costoEnsamble: ensambleHabilitado ? (costoEnsamble || 0) : 0,
      costoMaterial: costoMaterial || 0,
      costoMaquina: costoMaquina || 0,
      costoTotal: costoTotal || 0,
      precioMenudeo: precioMenudeo || 0,
      precioMayoreo: precioMayoreo || 0,
      cantidadMayoreo: cantidadMayoreo || 0,
      descripcion: descripcion || '',
      destacado: destacado || false,
      activo: true,
      tags: tags || [],
      imagenes: imagenes || [],
      fechaCreacion: (editingProduct && editingProduct.fechaCreacion) ? editingProduct.fechaCreacion : timestamp,
      fechaActualizacion: timestamp,
      gananciaUnitaria: ganancia || 0,
      margenPorcentaje: margen || 0
    };

    // Si hay imágenes grandes (> 1MB), las dividimos en chunks y las subimos a imagenes_chunks
    for (let i = 0; i < imagenes.length; i++) {
      const imgBase64 = imagenes[i];
      if (imgBase64 && imgBase64.length > 1000000) { // aprox 1MB en caracteres
        const chunks = splitIntoChunks(imgBase64);
        const imgId = `img_chunk_${pid}_${i}`;
        await set(ref(rtdb, `imagenes_chunks/${imgId}`), {
          chunks,
          totalChunks: chunks.length,
          productoId: pid,
          indice: i,
          fecha: timestamp
        });
      }
    }

    try {
      await set(ref(rtdb, `productos/${pid}`), finalProduct);
      setShowNewProductModal(false);
      resetForm();
    } catch (err) {
      console.error("Error guardando producto:", err);
    }
  };

  // Soft Delete (desactivar)
  const handleDeleteProduct = async (producto: Producto) => {
    if (window.confirm(t.confirmDeleteProduct)) {
      try {
        await set(ref(rtdb, `productos/${producto.id}/activo`), false);
      } catch (err) {
        console.error("Error desactivando producto:", err);
      }
    }
  };

  // Descargar imagen base64 como archivo real
  const handleDownloadImage = (base64Data: string, filename: string) => {
    try {
      if (!base64Data) return;
      const parts = base64Data.split(';base64,');
      const contentType = parts[0]?.split(':')[1] || 'image/png';
      const base64Str = parts[1] || parts[0];
      const raw = window.atob(base64Str);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const ext = contentType.split('/')[1] || 'png';
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar imagen:", err);
    }
  };

  // Copiar publicación desde el detalle e incrementar contador
  const handleCopyPub = async (pub: Publicacion) => {
    const hashtagsStr = pub.hashtags && pub.hashtags.length > 0
      ? '\n\n' + pub.hashtags.map(t => `#${t}`).join(' ')
      : '';
    const fullText = `${pub.titulo}\n\n${pub.contenido}${hashtagsStr}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedPubId(pub.id);
      setTimeout(() => setCopiedPubId(null), 2000);

      // Incrementar contador de uso y actualizar último uso en Firebase RTDB
      const currentCount = pub.contadorUso || 0;
      await set(ref(rtdb, `publicaciones/${pub.id}/contadorUso`), currentCount + 1);
      await set(ref(rtdb, `publicaciones/${pub.id}/ultimoUso`), new Date().toISOString());
    } catch (err) {
      console.error("Error al copiar texto:", err);
    }
  };

  // Vista Detallada de Producto
  if (selectedProductDetail) {
    const prod = selectedProductDetail;
    const prodPubs = publicaciones.filter(p => p.productoId === prod.id);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Cabecera de Detalle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedProductDetail(null)}
              className="p-2.5 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[#8B6F2A] dark:text-[#C9A961] text-[10px] font-bold rounded uppercase">
                  {prod.categoria}
                </span>
                {prod.tipo && (
                  <span className="px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold rounded uppercase">
                    {prod.tipo}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1 font-display tracking-tight">{prod.nombre}</h2>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                handleOpenEdit(prod);
                setSelectedProductDetail(null);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-amber-100 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar Producto</span>
            </button>
          </div>
        </div>

        {/* Grid de Detalle (Bento Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GALERÍA DE IMÁGENES */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between h-full min-h-[420px]">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 mb-4 font-display flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8B6F2A] dark:text-[#C9A961]" />
                Galería de Imágenes
              </h3>
              
              {/* Visor Principal */}
              <div className="relative aspect-video bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-850 overflow-hidden flex items-center justify-center">
                {prod.imagenes && prod.imagenes.length > 0 ? (
                  <>
                    <img
                      src={prod.imagenes[activeImageIndex]}
                      alt={`${prod.nombre} - vista ${activeImageIndex + 1}`}
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Botón de descargar */}
                    <button
                      onClick={() => handleDownloadImage(prod.imagenes[activeImageIndex], `${prod.nombre.replace(/\s+/g, '_')}_${activeImageIndex + 1}`)}
                      className="absolute bottom-3 right-3 p-2.5 bg-stone-900/90 hover:bg-stone-900 text-white rounded-xl transition-colors cursor-pointer shadow flex items-center space-x-1.5 text-xs font-semibold"
                      title="Descargar Imagen"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-xs font-medium">Este producto no contiene imágenes.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Miniaturas */}
            {prod.imagenes && prod.imagenes.length > 1 && (
              <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                {prod.imagenes.map((img, idx) => (
                  <button
                    key={`${prod.id}-galeria-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg border-2 overflow-hidden bg-stone-50 dark:bg-stone-900 transition-all ${
                      activeImageIndex === idx 
                        ? 'border-[#C9A961] ring-2 ring-[#C9A961]/20 scale-105' 
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DATOS TÉCNICOS Y RENDIMIENTO */}
          <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 font-display flex items-center gap-2">
                <Info className="w-5 h-5 text-[#8B6F2A] dark:text-[#C9A961]" />
                Datos del Producto
              </h3>

              {/* Ficha técnica estructurada */}
              <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-850/50 p-4 rounded-xl border border-stone-250 dark:border-stone-800/80 space-y-3">
                  <div className="flex justify-between text-sm pb-2 border-b border-stone-200/50 dark:border-stone-800/60">
                    <span className="text-stone-600 dark:text-stone-400 font-bold">Dimensiones:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {prod.medidaNombre ? `${prod.medidaNombre} ` : ''}({prod.medidaAncho}x{prod.medidaAlto}{prod.medidaProfundidad ? `x${prod.medidaProfundidad}` : ''} cm)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pb-2 border-b border-stone-200/50 dark:border-stone-800/60">
                    <span className="text-stone-600 dark:text-stone-400 font-bold">Tiempo de Corte:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{prod.tiempoCorteMinutos} minutos</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600 dark:text-stone-400 font-bold">Ensamble:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {prod.ensambleHabilitado ? `Habilitado (${formatMoney(prod.costoEnsamble)})` : 'No habilitado'}
                    </span>
                  </div>
                </div>

                {/* Estructura de Costos */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400 mb-2">Costos de Fabricación</h4>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3 bg-stone-50 dark:bg-stone-850/40 rounded-xl border border-stone-250 dark:border-stone-800">
                      <p className="text-[10px] text-stone-600 dark:text-stone-400 font-bold">Costo Material</p>
                      <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">{formatMoney(prod.costoMaterial)}</p>
                    </div>
                    <div className="p-3 bg-stone-50 dark:bg-stone-850/40 rounded-xl border border-stone-250 dark:border-stone-800">
                      <p className="text-[10px] text-stone-600 dark:text-stone-400 font-bold">Costo Máquina</p>
                      <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">{formatMoney(prod.costoMaquina)}</p>
                    </div>
                    {prod.ensambleHabilitado && (
                      <div className="p-3 bg-stone-50 dark:bg-stone-850/40 rounded-xl border border-stone-250 dark:border-stone-800">
                        <p className="text-[10px] text-stone-600 dark:text-stone-400 font-bold">Mano de Obra</p>
                        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">{formatMoney(prod.costoEnsamble)}</p>
                      </div>
                    )}
                    <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-red-950/20 col-span-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-red-700 dark:text-red-450 font-extrabold">Costo Fabricación Total</p>
                        <p className="text-base font-extrabold text-red-700 dark:text-red-450 font-mono">{formatMoney(prod.costoTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precios y Rendimiento */}
                <div className="pt-2 border-t border-stone-150 dark:border-stone-800">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400 mb-2">Precios y Rendimiento</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl border border-emerald-150 dark:border-emerald-950/20">
                      <div>
                        <p className="text-[10px] text-stone-650 dark:text-stone-400 font-bold">Precio Menudeo</p>
                        <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400 font-mono mt-0.5">{formatMoney(prod.precioMenudeo)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-650 dark:text-stone-400 font-bold">Margen / Ganancia</p>
                        <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 mt-0.5">
                          {prod.margenPorcentaje}% ({formatMoney(prod.gananciaUnitaria)})
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/20 dark:bg-amber-950/10 rounded-xl border border-amber-150 dark:border-amber-950/20 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-stone-650 dark:text-stone-400 font-bold">Precio Mayoreo</p>
                        <p className="text-base font-extrabold text-amber-800 dark:text-amber-400 font-mono mt-0.5">{formatMoney(prod.precioMayoreo)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-650 dark:text-stone-400 font-bold">Cantidad Mínima</p>
                        <p className="text-sm font-extrabold text-amber-850 dark:text-amber-400 mt-0.5">{prod.cantidadMayoreo} unidades</p>
                      </div>
                    </div>
                  </div>
                </div>

                {prod.descripcion && (
                  <div className="pt-2 border-t border-stone-150 dark:border-stone-800">
                    <h4 className="text-xs uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400 mb-1.5">Descripción</h4>
                    <p className="text-xs text-stone-800 dark:text-stone-300 leading-relaxed font-semibold bg-stone-50 dark:bg-stone-850 p-3 rounded-xl border border-stone-250 dark:border-stone-800">
                      {prod.descripcion}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {prod.tags && prod.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-stone-150 dark:border-stone-800">
                {prod.tags.map((tag, idx) => (
                  <span key={`${prod.id}-detail-tag-${tag || idx}-${idx}`} className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* BANCO DE PUBLICACIONES VINCULADAS */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8B6F2A] dark:text-[#C9A961]" />
                Publicaciones Disponibles para Redes Sociales
              </h3>
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-250 dark:border-stone-750">
                {prodPubs.length} {prodPubs.length === 1 ? 'publicación vinculada' : 'publicaciones vinculadas'}
              </span>
            </div>

            {prodPubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prodPubs.map(pub => {
                  return (
                    <div key={pub.id} className="p-4 bg-stone-50 dark:bg-stone-850/50 rounded-xl border border-stone-250 dark:border-stone-850 hover:border-stone-350 dark:hover:border-stone-700 transition-all flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-200 line-clamp-1 pr-4">{pub.titulo}</h4>
                          {pub.favorita && (
                            <span className="text-xs bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-900/30 font-extrabold">
                              ★ Favorita
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-850 dark:text-stone-300 mt-2 whitespace-pre-wrap leading-relaxed font-semibold bg-white dark:bg-[#151515] p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                          {pub.contenido}
                        </p>
                        {pub.hashtags && pub.hashtags.length > 0 && (
                          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-2.5">
                            {pub.hashtags.map(t => `#${t}`).join(' ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                        <span className="font-mono text-[10px] font-bold">{pub.contadorUso || 0} copias realizadas</span>
                        <button
                          onClick={() => handleCopyPub(pub)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white rounded-lg font-bold transition-all cursor-pointer shadow-sm text-xs"
                        >
                          {copiedPubId === pub.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Texto</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-50 dark:bg-stone-850 rounded-xl border border-dashed border-stone-250 dark:border-stone-800 text-stone-500 dark:text-stone-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-bold">No hay publicaciones guardadas vinculadas a este producto.</p>
                <p className="text-[10px] text-stone-400 mt-1">Crea una publicación en la pestaña "Publicaciones" y vincúlala a este producto.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Filtrar productos
  const filteredProducts = productos.filter(prod => {
    if (!prod.activo) return false;

    const matchesSearch = 
      prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.descripcion && prod.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      prod.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory ? prod.categoria === selectedCategory : true;
    const matchesType = selectedType ? prod.tipo === selectedType : true;
    const matchesFeatured = selectedFeatured ? (selectedFeatured === 'si' ? prod.destacado : !prod.destacado) : true;

    return matchesSearch && matchesCategory && matchesType && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-stone-500 dark:text-stone-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 font-medium text-sm"
          />
        </div>

        <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
          {/* Filtro Categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">{t.category}: {t.filterAll}</option>
            {Array.from(new Set(productos.map(p => p.categoria).filter(Boolean))).map((cat, idx) => (
              <option key={`filter-cat-${cat || idx}-${idx}`} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filtro Tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">{t.type}: {t.filterAll}</option>
            <option value="Ocasión">Ocasión</option>
            <option value="Tipo de Producto">Tipo de Producto</option>
          </select>

          {/* Filtro Destacados */}
          <select
            value={selectedFeatured}
            onChange={(e) => setSelectedFeatured(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">{t.featured}: {t.filterAll}</option>
            <option value="si">Destacados ⭐</option>
            <option value="no">No destacados</option>
          </select>

          <button
            id="btn-new-product"
            onClick={handleOpenCreate}
            className="col-span-2 md:col-auto flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{t.add}</span>
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => (
            <div 
              key={prod.id} 
              onClick={() => { setSelectedProductDetail(prod); setActiveImageIndex(0); }}
              className="bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-[#C9A961] dark:hover:border-[#C9A961] transition-all flex flex-col h-full group cursor-pointer"
            >
              {/* Contenedor de Imagen */}
              <div className="relative aspect-video bg-stone-50 dark:bg-stone-900 overflow-hidden border-b border-stone-100 dark:border-stone-850">
                {prod.imagenes && prod.imagenes.length > 0 ? (
                  <img
                    src={prod.imagenes[0]}
                    alt={prod.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-900">
                    <ImageIcon className="w-10 h-10 mb-1" />
                    <span className="text-xs font-semibold">Sin imagen</span>
                  </div>
                )}
                
                {/* Badge de destacado */}
                {prod.destacado && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-900" />
                    <span>Destacado</span>
                  </div>
                )}

                {/* Badge de Categoría */}
                <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-xs font-bold">
                  {prod.categoria}
                </span>
              </div>

              {/* Detalles del Producto */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-stone-900 dark:text-stone-50 text-lg mb-1 line-clamp-1 group-hover:text-[#8B6F2A] dark:group-hover:text-[#C9A961] transition-colors">{prod.nombre}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 font-bold">{prod.medidaNombre || `${prod.medidaAncho}x${prod.medidaAlto} cm`}</p>
                  
                  {prod.descripcion && (
                    <p className="text-sm text-stone-800 dark:text-stone-300 line-clamp-2 mb-4 font-semibold">{prod.descripcion}</p>
                  )}

                  {/* Ficha técnica rápida */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-b border-stone-150 dark:border-stone-800 py-3 mb-4 text-xs font-semibold">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Corte:</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{prod.tiempoCorteMinutos} min</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Costo Total:</span>
                      <span className="font-bold text-red-700 dark:text-red-400">{formatMoney(prod.costoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Menudeo:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatMoney(prod.precioMenudeo)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Mayoreo ({prod.cantidadMayoreo}+):</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">{formatMoney(prod.precioMayoreo)}</span>
                    </div>
                  </div>

                  {/* Etiquetas / Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {prod.tags && prod.tags.map((tag, idx) => (
                      <span key={`${prod.id}-tag-${tag || idx}-${idx}`} className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                  <button
                    id={`edit-prod-${prod.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(prod);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 border border-amber-100 dark:border-amber-900/30 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/35 text-amber-800 dark:text-amber-400 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{t.edit}</span>
                  </button>
                  <button
                    id={`delete-prod-${prod.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(prod);
                    }}
                    className="p-2 border border-red-100 dark:border-red-950/30 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl transition-colors cursor-pointer"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-500">
          <ImageIcon className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="font-semibold">{t.noProducts}</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? `${t.edit}: ${editingProduct.nombre}` : t.newProduct}
              </h3>
              <button
                id="close-product-modal"
                onClick={() => {
                  setShowNewProductModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido / Formulario */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.productName}</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ej. Servilletero de Boda Minimalista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
                  <input
                    type="text"
                    list="categorias-list"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Escribe o selecciona categoría..."
                  />
                  <datalist id="categorias-list">
                    {categorias.map((cat, idx) => (
                      <option key={cat.id || `form-cat-option-${idx}`} value={cat.nombre} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Ocasión">Ocasión</option>
                    <option value="Tipo de Producto">Tipo de Producto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medida Predefinida (Autocompletar)</label>
                  <select
                    onChange={handleSelectMedidaPredefinida}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Seleccionar estándar --</option>
                    {medidas.map((med, idx) => (
                      <option key={med.id || `form-med-option-${idx}`} value={med.id}>{med.nombre} ({med.ancho}x{med.alto}x{med.profundidad}cm)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ficha de Medidas y Tiempos */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-700 text-sm">Ficha Técnica de Fabricación</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.measureName}</label>
                    <input
                      type="text"
                      value={medidaNombre}
                      onChange={(e) => setMedidaNombre(e.target.value)}
                      placeholder="Medida personalizada"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.width}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={medidaAncho}
                      onChange={(e) => setMedidaAncho(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.height}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={medidaAlto}
                      onChange={(e) => setMedidaAlto(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.depth}</label>
                    <input
                      type="number"
                      step="any"
                      value={medidaProfundidad}
                      onChange={(e) => setMedidaProfundidad(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.cutTime}</label>
                    <input
                      type="number"
                      required
                      value={tiempoCorteMinutos}
                      onChange={(e) => setTiempoCorteMinutos(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-5">
                    <input
                      type="checkbox"
                      id="requires-assembly"
                      checked={ensambleHabilitado}
                      onChange={(e) => setEnsambleHabilitado(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <label htmlFor="requires-assembly" className="text-sm font-semibold text-gray-700">{t.requiresAssembly}</label>
                  </div>

                  {ensambleHabilitado && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{t.assemblyCost}</label>
                      <input
                        type="number"
                        step="any"
                        value={costoEnsamble}
                        onChange={(e) => setCostoEnsamble(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Costos y Margen (Cálculo Automático) */}
              <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-3 rounded-xl border border-amber-50 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.materialCost}</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{formatMoney(costoMaterial)}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-50 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.machineCost}</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{formatMoney(costoMaquina)}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-50 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.totalCost}</p>
                  <p className="text-lg font-extrabold text-red-600 mt-1">{formatMoney(costoTotal)}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-50 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.unitGain}</p>
                  <p className={`text-lg font-bold mt-1 ${ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatMoney(ganancia)}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-50 shadow-xs col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.profitMargin}</p>
                  <p className={`text-lg font-bold mt-1 ${margen >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {margen}%
                  </p>
                </div>
              </div>

              {/* Precios de Venta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.retailPrice}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={precioMenudeo}
                    onChange={(e) => setPrecioMenudeo(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.wholesalePrice}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={precioMayoreo}
                    onChange={(e) => setPrecioMayoreo(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.wholesaleQty}</label>
                  <input
                    type="number"
                    required
                    value={cantidadMayoreo}
                    onChange={(e) => setCantidadMayoreo(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                  placeholder="Detalles del producto (ensamble, acabado, etc.)..."
                />
              </div>

              {/* Tags / Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.tags}</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-xl bg-gray-50/50 min-h-[50px] items-center">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="p-0.5 hover:bg-amber-200 rounded-full focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex-1 min-w-[120px] flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="border-none bg-transparent focus:outline-none focus:ring-0 text-sm flex-grow py-1"
                      placeholder={t.addTag}
                    />
                  </div>
                </div>
              </div>

              {/* Imágenes del Producto (Requisitos Críticos del Admin de Forja Laser) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>{t.images}</span>
                  </label>
                  <span className="text-xs text-gray-400">{imagenes.length} {imagenes.length === 1 ? 'imagen' : 'imágenes'} subidas</span>
                </div>

                {/* Zona de Arrastre */}
                <div className="relative border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-gray-50/30 hover:bg-amber-50/10 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-600">{t.uploadImages}</p>
                    <p className="text-xs text-gray-400">{t.imageLimitWarning}</p>
                  </div>
                </div>

                {isUploading && (
                  <p className="text-xs text-amber-600 font-semibold animate-pulse text-center">Optimizando y comprimiendo imágenes...</p>
                )}

                {/* Grid de Imágenes con reordenación y eliminación */}
                {imagenes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 italic flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>{t.dragDropToReorder}</span>
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      {imagenes.map((imgBase64, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm group">
                          <img
                            src={imgBase64}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />

                          {/* Número / Orden de imagen */}
                          <div className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </div>

                          {/* Botón de Borrar */}
                          <button
                            type="button"
                            onClick={() => deleteImage(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
                            title={t.delete}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Controles de Reordenación (Flechas Izquierda / Derecha) */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/85 p-1 rounded-lg">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveImage(idx, 'left')}
                              className="p-1 hover:bg-white/20 text-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Mover Izquierda"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-white font-bold">{idx + 1}</span>
                            <button
                              type="button"
                              disabled={idx === imagenes.length - 1}
                              onClick={() => moveImage(idx, 'right')}
                              className="p-1 hover:bg-white/20 text-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Mover Derecha"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Destacado */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="featured-field"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="featured-field" className="text-sm font-semibold text-gray-700">
                  {t.featured} - Mostrar este producto en secciones principales
                </label>
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  id="cancel-product-modal"
                  onClick={() => {
                    setShowNewProductModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="submit-product-modal"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductsTab;
