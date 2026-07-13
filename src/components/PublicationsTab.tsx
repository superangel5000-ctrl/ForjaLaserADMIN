import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Star, Copy, Check, Heart, MessageSquare, Facebook, Instagram, Share2, X } from 'lucide-react';
import { Publicacion, Producto } from '../types';
import { ref, set, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { formatDate, formatMoney } from '../utils';

interface PublicationsTabProps {
  publicaciones: Publicacion[];
  productos: Producto[];
  showNewPublicationModal: boolean;
  setShowNewPublicationModal: (show: boolean) => void;
  t: any;
}

export const PublicationsTab: React.FC<PublicationsTabProps> = ({
  publicaciones,
  productos,
  showNewPublicationModal,
  setShowNewPublicationModal,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados del Formulario de Publicación
  const [editingPub, setEditingPub] = useState<Publicacion | null>(null);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [redes, setRedes] = useState<string[]>([]);
  const [productoId, setProductoId] = useState('');
  const [favorita, setFavorita] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');

  // Resetear Formulario
  const resetForm = () => {
    setTitulo('');
    setContenido('');
    setRedes([]);
    setProductoId('');
    setFavorita(false);
    setHashtagInput('');
    setEditingPub(null);
  };

  // Abrir para crear nuevo
  const handleOpenCreate = () => {
    resetForm();
    setShowNewPublicationModal(true);
  };

  // Abrir para editar
  const handleOpenEdit = (pub: Publicacion) => {
    setEditingPub(pub);
    setTitulo(pub.titulo);
    setContenido(pub.contenido);
    setRedes(pub.redes || []);
    setProductoId(pub.productoId || '');
    setFavorita(pub.favorita || false);
    setHashtagInput(pub.hashtags ? pub.hashtags.join(', ') : '');
    setShowNewPublicationModal(true);
  };

  // Guardar publicación en Firebase
  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    const pid = editingPub ? editingPub.id : `pub_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Limpiar hashtags
    const parsedHashtags = hashtagInput
      .split(/[\s,]+/)
      .map(tag => tag.trim().replace(/^#/, ''))
      .filter(tag => tag.length > 0);

    const finalPub: Publicacion = {
      id: pid,
      titulo,
      contenido,
      redes,
      productoId,
      favorita,
      contadorUso: editingPub ? editingPub.contadorUso : 0,
      ultimoUso: editingPub ? editingPub.ultimoUso : undefined,
      hashtags: parsedHashtags,
      fechaCreacion: editingPub ? editingPub.fechaCreacion : timestamp,
      fechaActualizacion: timestamp
    };

    try {
      await set(ref(rtdb, `publicaciones/${pid}`), finalPub);
      setShowNewPublicationModal(false);
      resetForm();
    } catch (err) {
      console.error("Error guardando publicación:", err);
    }
  };

  // Eliminar publicación
  const handleDeletePublication = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await remove(ref(rtdb, `publicaciones/${id}`));
      } catch (err) {
        console.error("Error eliminando publicación:", err);
      }
    }
  };

  // Marcar/Desmarcar favorita de inmediato
  const toggleFavorite = async (pub: Publicacion) => {
    try {
      await set(ref(rtdb, `publicaciones/${pub.id}/favorita`), !pub.favorita);
    } catch (err) {
      console.error("Error cambiando favorita:", err);
    }
  };

  // Copiar Publicación al Portapapeles e incrementar contadores
  const copyToClipboard = async (pub: Publicacion) => {
    const hashtagsStr = pub.hashtags && pub.hashtags.length > 0
      ? '\n\n' + pub.hashtags.map(t => `#${t}`).join(' ')
      : '';
    const fullText = `${pub.titulo}\n\n${pub.contenido}${hashtagsStr}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId(pub.id);
      setTimeout(() => setCopiedId(null), 2000);

      // Incrementar contador de uso y actualizar último uso
      const currentCount = pub.contadorUso || 0;
      await set(ref(rtdb, `publicaciones/${pub.id}/contadorUso`), currentCount + 1);
      await set(ref(rtdb, `publicaciones/${pub.id}/ultimoUso`), new Date().toISOString());
    } catch (err) {
      console.error("Error al copiar texto:", err);
    }
  };

  // Toggle de redes en formulario
  const toggleNetworkInForm = (net: string) => {
    if (redes.includes(net)) {
      setRedes(redes.filter(r => r !== net));
    } else {
      setRedes([...redes, net]);
    }
  };

  // Filtrar publicaciones
  const filteredPublications = publicaciones.filter(pub => {
    const associatedProd = productos.find(p => p.id === pub.productoId);
    
    const matchesSearch =
      pub.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.hashtags.some(h => h.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (associatedProd && associatedProd.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNetwork = selectedNetwork ? pub.redes.includes(selectedNetwork) : true;
    const matchesProduct = selectedProduct ? pub.productoId === selectedProduct : true;

    return matchesSearch && matchesNetwork && matchesProduct;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-stone-500 dark:text-stone-400" />
          <input
            type="text"
            placeholder={t.pubSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 font-medium text-sm"
          />
        </div>

        <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
          {/* Filtro Red */}
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">{t.pubSocials}: {t.filterAll}</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>

          {/* Filtro Producto */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-850 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">{t.pubProduct}: {t.filterAll}</option>
            {productos.filter(p => p.activo).map(prod => (
              <option key={prod.id} value={prod.id}>{prod.nombre}</option>
            ))}
          </select>

          <button
            id="btn-new-publication"
            onClick={handleOpenCreate}
            className="col-span-2 md:col-auto flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{t.add}</span>
          </button>
        </div>
      </div>

      {/* Grid de Publicaciones */}
      {filteredPublications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPublications.map(pub => {
            const prod = productos.find(p => p.id === pub.productoId);
            return (
              <div key={pub.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 border border-stone-200 dark:border-stone-850 shadow-sm flex flex-col justify-between h-full hover:shadow-md hover:border-[#C9A961] dark:hover:border-[#C9A961] transition-all relative">
                
                {/* Cabecera Publicación */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-extrabold text-stone-900 dark:text-stone-50 text-lg flex items-center gap-2">
                        {pub.titulo}
                        {pub.favorita && <Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />}
                      </h4>
                      {prod && (
                        <p className="text-xs text-[#8B6F2A] dark:text-[#C9A961] font-bold bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-2.5 py-0.5 rounded-full inline-block mt-1">
                          {prod.nombre}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleFavorite(pub)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${pub.favorita ? 'bg-yellow-50 text-yellow-500 border border-yellow-200' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:text-yellow-500'}`}
                        title="Favorito"
                      >
                        <Heart className={`w-4.5 h-4.5 ${pub.favorita ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>
                      <button
                        id={`edit-pub-${pub.id}`}
                        onClick={() => handleOpenEdit(pub)}
                        className="p-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-750 rounded-lg cursor-pointer"
                        title={t.edit}
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        id={`delete-pub-${pub.id}`}
                        onClick={() => handleDeletePublication(pub.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-lg cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Redes Destinadas */}
                  <div className="flex gap-2 mb-3">
                    {pub.redes && pub.redes.map(net => {
                      let color = "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700";
                      let icon = <Share2 className="w-3 h-3" />;
                      
                      if (net === 'facebook') {
                        color = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";
                        icon = <Facebook className="w-3 h-3" />;
                      } else if (net === 'whatsapp') {
                        color = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40";
                        icon = <MessageSquare className="w-3 h-3" />;
                      } else if (net === 'instagram') {
                        color = "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/40";
                        icon = <Instagram className="w-3 h-3" />;
                      }

                      return (
                        <span key={net} className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color}`}>
                          {icon}
                          <span className="capitalize">{net}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Contenido principal */}
                  <div className="bg-stone-50 dark:bg-[#151515] p-4 rounded-xl border border-stone-200 dark:border-stone-850 text-sm text-stone-800 dark:text-stone-100 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto mb-4 font-sans select-text font-semibold">
                    {pub.contenido}
                  </div>

                  {/* Hashtags */}
                  {pub.hashtags && pub.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pub.hashtags.map(tag => (
                        <span key={tag} className="text-xs text-blue-700 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/30 px-2 py-0.5 rounded transition-colors cursor-default">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer de Tarjeta con Estadísticas y Botón Copiar */}
                <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 font-semibold">
                  <div>
                    <p>Usado: <span className="font-bold text-stone-900 dark:text-stone-100">{pub.contadorUso || 0} veces</span></p>
                    {pub.ultimoUso && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-450 mt-0.5">Último: {formatDate(pub.ultimoUso)}</p>
                    )}
                  </div>

                  <button
                    id={`copy-pub-${pub.id}`}
                    onClick={() => copyToClipboard(pub)}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      copiedId === pub.id 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    }`}
                  >
                    {copiedId === pub.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{t.pubCopyBtn}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-500">
          <MessageSquare className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="font-semibold">{t.pubNoData}</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PUBLICACIÓN */}
      {showNewPublicationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPub ? `${t.edit}: ${editingPub.titulo}` : t.newPublication}
              </h3>
              <button
                id="close-publication-modal"
                onClick={() => {
                  setShowNewPublicationModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSavePublication} className="p-6 space-y-6">
              {/* Título de la publicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.pubTitle}</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ej. Servilletero Boda - Oferta de temporada"
                />
              </div>

              {/* Producto Asociado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.pubProduct}</label>
                <select
                  required
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">-- Seleccionar Producto --</option>
                  {productos.filter(p => p.activo).map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nombre} (Menudeo: {formatMoney(prod.precioMenudeo)})</option>
                  ))}
                </select>
              </div>

              {/* Selección de Redes Destinadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.pubSocials}</label>
                <div className="flex flex-wrap gap-3">
                  {['facebook', 'whatsapp', 'instagram', 'tiktok'].map(net => {
                    const active = redes.includes(net);
                    return (
                      <button
                        type="button"
                        key={net}
                        onClick={() => toggleNetworkInForm(net)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors flex items-center space-x-2 cursor-pointer ${
                          active
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="capitalize">{net}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenido / Texto de Publicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.pubContent}</label>
                <textarea
                  required
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[180px] font-sans"
                  placeholder="Escribe el texto de venta aquí..."
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.pubHashtags}</label>
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="boda, mdf, cortelaser, manualidades"
                />
              </div>

              {/* Favorito */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="pub-fav-checkbox"
                  checked={favorita}
                  onChange={(e) => setFavorita(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="pub-fav-checkbox" className="text-sm font-semibold text-gray-700">
                  {t.pubFavorite} (Aparecerá destacado en Dashboard)
                </label>
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  id="cancel-publication-modal"
                  onClick={() => {
                    setShowNewPublicationModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="submit-publication-modal"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PublicationsTab;
