import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Check, X, FileText, Copy, Play } from 'lucide-react';
import { PlantillaMensaje } from '../types';
import { ref, set, remove } from 'firebase/database';
import { rtdb } from '../firebase';

interface TemplatesTabProps {
  plantillas: PlantillaMensaje[];
  t: any;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  plantillas,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [editingTemp, setEditingTemp] = useState<PlantillaMensaje | null>(null);
  const [usingTemp, setUsingTemp] = useState<PlantillaMensaje | null>(null);

  // Formulario Plantilla
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [contenido, setContenido] = useState('');
  const [redes, setRedes] = useState<string[]>([]);
  const [activa, setActiva] = useState(true);

  // Variables para rellenar
  const [varCliente, setVarCliente] = useState('');
  const [varProducto, setVarProducto] = useState('');
  const [varPrecio, setVarPrecio] = useState('');
  const [varCantidad, setVarCantidad] = useState('');
  const [varTotal, setVarTotal] = useState('');
  const [varFecha, setVarFecha] = useState('');
  const [varColaborador, setVarColaborador] = useState('');
  const [copied, setCopied] = useState(false);

  // Variables disponibles a insertar con botones rápidos
  const VARIABLES = [
    { key: '{{cliente}}', label: 'Cliente' },
    { key: '{{producto}}', label: 'Producto' },
    { key: '{{precio}}', label: 'Precio' },
    { key: '{{cantidad}}', label: 'Cantidad' },
    { key: '{{total}}', label: 'Total' },
    { key: '{{fecha_evento}}', label: 'Fecha' },
    { key: '{{nombre_colaborador}}', label: 'Colaborador' }
  ];

  const resetForm = () => {
    setNombre('');
    setTipo('');
    setContenido('');
    setRedes([]);
    setActiva(true);
    setEditingTemp(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleOpenEdit = (temp: PlantillaMensaje) => {
    setEditingTemp(temp);
    setNombre(temp.nombre);
    setTipo(temp.tipo || '');
    setContenido(temp.contenido);
    setRedes(temp.redes || []);
    setActiva(temp.activa);
    setShowFormModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !contenido.trim()) return;

    const tid = editingTemp ? editingTemp.id : `temp_${Date.now()}`;
    const finalTemp: PlantillaMensaje = {
      id: tid,
      nombre,
      tipo,
      contenido,
      redes,
      activa,
      contadorUso: editingTemp ? editingTemp.contadorUso : 0
    };

    try {
      await set(ref(rtdb, `plantillas_mensaje/${tid}`), finalTemp);
      setShowFormModal(false);
      resetForm();
    } catch (err) {
      console.error("Error guardando plantilla:", err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await remove(ref(rtdb, `plantillas_mensaje/${id}`));
      } catch (err) {
        console.error("Error eliminando plantilla:", err);
      }
    }
  };

  // Abrir formulario rápido de uso de plantilla
  const handleOpenUse = (temp: PlantillaMensaje) => {
    setUsingTemp(temp);
    setVarCliente('');
    setVarProducto('');
    setVarPrecio('');
    setVarCantidad('');
    setVarTotal('');
    setVarFecha('');
    setVarColaborador('');
    setCopied(false);
    setShowUseModal(true);
  };

  // Procesar y copiar texto de plantilla rellenado
  const handleProcessAndCopy = async () => {
    if (!usingTemp) return;

    let text = usingTemp.contenido;
    text = text.replace(/\{\{cliente\}\}/g, varCliente || 'Cliente');
    text = text.replace(/\{\{producto\}\}/g, varProducto || 'Producto');
    text = text.replace(/\{\{precio\}\}/g, varPrecio || '$0.00');
    text = text.replace(/\{\{cantidad\}\}/g, varCantidad || '1');
    text = text.replace(/\{\{total\}\}/g, varTotal || '$0.00');
    text = text.replace(/\{\{fecha_evento\}\}/g, varFecha || 'Próximamente');
    text = text.replace(/\{\{nombre_colaborador\}\}/g, varColaborador || 'Equipo Forja Laser');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Incrementar contador de uso
      const currentCount = usingTemp.contadorUso || 0;
      await set(ref(rtdb, `plantillas_mensaje/${usingTemp.id}/contadorUso`), currentCount + 1);

      setTimeout(() => {
        setCopied(false);
        setShowUseModal(false);
        setUsingTemp(null);
      }, 1500);
    } catch (err) {
      console.error("Error copiando plantilla procesada:", err);
    }
  };

  const insertVariable = (variable: string) => {
    setContenido(prev => prev + variable);
  };

  const toggleNetworkInForm = (net: string) => {
    if (redes.includes(net)) {
      setRedes(redes.filter(r => r !== net));
    } else {
      setRedes([...redes, net]);
    }
  };

  // Filtrar
  const filteredTemplates = plantillas.filter(temp => {
    return temp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (temp.tipo && temp.tipo.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50 text-sm"
          />
        </div>

        <button
          id="btn-new-template"
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>{t.add}</span>
        </button>
      </div>

      {/* Grid de Plantillas */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map(temp => (
            <div key={temp.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{temp.nombre}</h4>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block border border-amber-100">
                      {temp.tipo || 'General'}
                    </span>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      id={`edit-temp-${temp.id}`}
                      onClick={() => handleOpenEdit(temp)}
                      className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg cursor-pointer"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-temp-${temp.id}`}
                      onClick={() => handleDeleteTemplate(temp.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vista previa de contenido */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-50 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto mb-4 font-mono select-all">
                  {temp.contenido}
                </div>
              </div>

              {/* Footer de Tarjeta */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Usada: <span className="font-bold text-gray-600">{temp.contadorUso || 0} veces</span></span>
                <button
                  id={`use-temp-${temp.id}`}
                  onClick={() => handleOpenUse(temp)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{t.tempUseBtn}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
          <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>{t.tempNoData}</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PLANTILLA */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTemp ? t.edit : t.add} Plantilla
              </h3>
              <button
                id="close-template-modal"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.tempName}</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="Ej. Saludo de Bienvenida"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.tempType}</label>
                  <input
                    type="text"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="Ej. Cotización, Venta, etc."
                  />
                </div>
              </div>

              {/* Botones de Variables Rápidas */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t.tempVariables}</label>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  {VARIABLES.map(v => (
                    <button
                      type="button"
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-700 text-gray-600 rounded-lg text-xs font-bold shadow-xs border border-gray-200/60 flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.tempContent}</label>
                <textarea
                  required
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[180px] font-mono text-sm leading-relaxed"
                  placeholder="Hola {{cliente}}, gracias por escribirnos..."
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-5 mt-6">
                <button
                  type="button"
                  id="cancel-template-modal"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="submit-template-modal"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USAR PLANTILLA (RELLENAR VARIABLES) */}
      {showUseModal && usingTemp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">
                {t.tempFillVariables}
              </h3>
              <button
                id="close-use-modal"
                onClick={() => {
                  setShowUseModal(false);
                  setUsingTemp(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400 italic mb-2">
                Rellena los campos necesarios. Los campos vacíos usarán valores predeterminados.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {usingTemp.contenido.includes('{{cliente}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderClient}</label>
                    <input
                      type="text"
                      value={varCliente}
                      onChange={(e) => setVarCliente(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. María López"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{producto}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderProduct}</label>
                    <input
                      type="text"
                      value={varProducto}
                      onChange={(e) => setVarProducto(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. Servilletero Boda"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{precio}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderPrice}</label>
                    <input
                      type="text"
                      value={varPrecio}
                      onChange={(e) => setVarPrecio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. $30.00"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{cantidad}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderQty}</label>
                    <input
                      type="text"
                      value={varCantidad}
                      onChange={(e) => setVarCantidad(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. 50 pzas"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{total}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderTotal}</label>
                    <input
                      type="text"
                      value={varTotal}
                      onChange={(e) => setVarTotal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. $1,500.00"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{fecha_evento}}') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderDate}</label>
                    <input
                      type="text"
                      value={varFecha}
                      onChange={(e) => setVarFecha(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. 12 de Octubre"
                    />
                  </div>
                )}

                {usingTemp.contenido.includes('{{nombre_colaborador}}') && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.tempPlaceholderColab}</label>
                    <input
                      type="text"
                      value={varColaborador}
                      onChange={(e) => setVarColaborador(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      placeholder="Ej. Angel / Colaborador de Forja Laser"
                    />
                  </div>
                )}
              </div>

              {/* Vista Previa en Tiempo Real */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vista Previa del Mensaje</p>
                <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto font-mono">
                  {usingTemp.contenido
                    .replace(/\{\{cliente\}\}/g, varCliente || 'Maria Lopez')
                    .replace(/\{\{producto\}\}/g, varProducto || 'Servilletero Boda')
                    .replace(/\{\{precio\}\}/g, varPrecio || '$30.00')
                    .replace(/\{\{cantidad\}\}/g, varCantidad || '50 pzas')
                    .replace(/\{\{total\}\}/g, varTotal || '$1,500.00')
                    .replace(/\{\{fecha_evento\}\}/g, varFecha || '12 Oct')
                    .replace(/\{\{nombre_colaborador\}\}/g, varColaborador || 'Equipo Forja Laser')
                  }
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-5 mt-6">
                <button
                  type="button"
                  id="cancel-use-modal"
                  onClick={() => {
                    setShowUseModal(false);
                    setUsingTemp(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  id="copy-processed-template"
                  onClick={handleProcessAndCopy}
                  className={`px-5 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center space-x-2 cursor-pointer transition-all ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar y Usar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TemplatesTab;
