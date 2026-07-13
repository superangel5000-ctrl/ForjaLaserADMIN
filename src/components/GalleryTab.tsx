import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, ImageIcon, Maximize2 } from 'lucide-react';
import { Producto } from '../types';

interface GalleryTabProps {
  productos: Producto[];
  t: any;
}

interface GaleriaItem {
  producto: Producto;
  imageUrl: string;
  indice: number;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  productos,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estados para el Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [allGalleryItems, setAllGalleryItems] = useState<GaleriaItem[]>([]);

  // Agrupar y preparar todos los elementos de galería filtrados
  useEffect(() => {
    const items: GaleriaItem[] = [];
    
    productos
      .filter(p => p.activo)
      .filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? p.categoria === selectedCategory : true;
        return matchesSearch && matchesCategory;
      })
      .forEach(prod => {
        if (prod.imagenes && prod.imagenes.length > 0) {
          prod.imagenes.forEach((imgUrl, idx) => {
            items.push({
              producto: prod,
              imageUrl: imgUrl,
              indice: idx
            });
          });
        }
      });

    setAllGalleryItems(items);
  }, [productos, searchTerm, selectedCategory]);

  // Manejador de navegación por teclado en Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === 'Escape' || e.key === 'Esc') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allGalleryItems]);

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev < allGalleryItems.length - 1) ? prev + 1 : 0);
  };

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev > 0) ? prev - 1 : allGalleryItems.length - 1);
  };

  // Categorías de tipo pill
  const categoriasUnicas = Array.from(new Set(productos.filter(p => p.activo).map(p => p.categoria).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2 mb-4">
        <h3 className="text-2xl font-bold text-gray-800">{t.galleryTitle}</h3>
        <p className="text-sm text-gray-500">{t.gallerySubtitle}</p>
      </div>

      {/* Buscador y Filtros (Pills) */}
      <div className="space-y-4">
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-xs text-sm"
          />
        </div>

        {/* Categorías Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              selectedCategory === ''
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.filterAll}
          </button>
          
          {categoriasUnicas.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Imágenes de la Galería (2 móvil, 3 tablet, 4 desktop, mínimo 280px, aspect-ratio 1:1) */}
      {allGalleryItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allGalleryItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxIndex(idx)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group aspect-square cursor-pointer hover:border-amber-400 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              style={{ minWidth: '240px' }}
            >
              <img
                src={item.imageUrl}
                alt={item.producto.nombre}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Hover overlay completo */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="absolute top-4 right-4 bg-amber-600 p-2 rounded-lg text-white shadow-md transform translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="transform translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300">
                  <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 border border-amber-500">
                    {item.producto.categoria}
                  </span>
                  <h4 className="font-extrabold text-white text-sm line-clamp-1">{item.producto.nombre}</h4>
                  <p className="text-[10px] text-gray-300 font-semibold mt-0.5">
                    Imagen {item.indice + 1} de {item.producto.imagenes?.length}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>{t.galleryNoImages}</p>
        </div>
      )}

      {/* LIGHTBOX DE PANTALLA COMPLETA */}
      {lightboxIndex !== null && allGalleryItems.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4 backdrop-blur-md select-none">
          {/* Botón de cerrar (X) */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Flecha de Navegación Izquierda */}
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            title="Anterior (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Contenedor de Imagen Central Completa */}
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center text-center">
            <img
              src={allGalleryItems[lightboxIndex].imageUrl}
              alt={allGalleryItems[lightboxIndex].producto.nombre}
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none"
              referrerPolicy="no-referrer"
            />
            
            {/* Detalles de la imagen en Lightbox */}
            <div className="mt-4 text-white space-y-1">
              <h4 className="text-lg font-bold text-amber-400">
                {allGalleryItems[lightboxIndex].producto.nombre}
              </h4>
              <p className="text-sm text-gray-400">
                {allGalleryItems[lightboxIndex].producto.categoria} • Imagen {allGalleryItems[lightboxIndex].indice + 1} de {allGalleryItems[lightboxIndex].producto.imagenes?.length}
              </p>
            </div>
          </div>

          {/* Flecha de Navegación Derecha */}
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            title="Siguiente (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
export default GalleryTab;
