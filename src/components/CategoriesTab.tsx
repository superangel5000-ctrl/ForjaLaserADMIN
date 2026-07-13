import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Categoria } from '../types';
import { ref, set, remove } from 'firebase/database';
import { rtdb } from '../firebase';

interface CategoriesTabProps {
  categorias: Categoria[];
  t: any;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categorias,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Formulario
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'Ocasión' | 'Tipo de Producto'>('Ocasión');
  const [activa, setActiva] = useState(true);
  const [orden, setOrden] = useState(1);

  // Resetear
  const resetForm = () => {
    setNombre('');
    setTipo('Ocasión');
    setActiva(true);
    setOrden(categorias.length + 1);
    setEditingCat(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditingCat(cat);
    setNombre(cat.nombre);
    setTipo(cat.tipo);
    setActiva(cat.activa);
    setOrden(cat.orden || 1);
    setShowModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const cid = editingCat ? editingCat.id : `cat_${Date.now()}`;
    const finalCat: Categoria = {
      id: cid,
      nombre,
      tipo,
      activa,
      orden: parseInt(orden as any) || 1
    };

    try {
      await set(ref(rtdb, `categorias/${cid}`), finalCat);
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error guardando categoría:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await remove(ref(rtdb, `categorias/${id}`));
      } catch (err) {
        console.error("Error eliminando categoría:", err);
      }
    }
  };

  const toggleCategoryActive = async (cat: Categoria) => {
    try {
      await set(ref(rtdb, `categorias/${cat.id}/activa`), !cat.activa);
    } catch (err) {
      console.error("Error cambiando estado categoría:", err);
    }
  };

  // Filtrar
  const filteredCategories = [...categorias]
    .filter(cat => {
      const matchesSearch = cat.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType ? cat.tipo === selectedType : true;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.orden - b.orden);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50 text-sm"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 flex-grow md:flex-grow-0"
          >
            <option value="">{t.catType}: {t.filterAll}</option>
            <option value="Ocasión">{t.catTypeOccasion}</option>
            <option value="Tipo de Producto">{t.catTypeProduct}</option>
          </select>

          <button
            id="btn-new-category"
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{t.add}</span>
          </button>
        </div>
      </div>

      {/* Tabla / Lista de Categorías */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-4 pl-6">Orden</th>
                  <th className="p-4">{t.catName}</th>
                  <th className="p-4">{t.catType}</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-bold">
                        {cat.orden}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{cat.nombre}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        cat.tipo === 'Ocasión' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {cat.tipo === 'Ocasión' ? t.catTypeOccasion : t.catTypeProduct}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleCategoryActive(cat)}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border ${
                          cat.activa 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}
                      >
                        {cat.activa ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{cat.activa ? 'Activa' : 'Inactiva'}</span>
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right flex items-center justify-end space-x-2">
                      <button
                        id={`edit-cat-${cat.id}`}
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 hover:bg-amber-50 text-amber-700 hover:border-amber-100 border border-transparent rounded-lg transition-colors cursor-pointer"
                        title={t.edit}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-cat-${cat.id}`}
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:border-red-100 border border-transparent rounded-lg transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>{t.catNoData}</p>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">
                {editingCat ? t.edit : t.add} Categoria
              </h3>
              <button
                id="close-category-modal"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.catName}</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Ej. Graduaciones, Charolas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.catType}</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                >
                  <option value="Ocasión">{t.catTypeOccasion}</option>
                  <option value="Tipo de Producto">{t.catTypeProduct}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.catOrder}</label>
                <input
                  type="number"
                  required
                  value={orden}
                  onChange={(e) => setOrden(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="cat-status"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="cat-status" className="text-sm font-semibold text-gray-700">Categoría Activa</label>
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-5 mt-6">
                <button
                  type="button"
                  id="cancel-category-modal"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="submit-category-modal"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm cursor-pointer"
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
export default CategoriesTab;
