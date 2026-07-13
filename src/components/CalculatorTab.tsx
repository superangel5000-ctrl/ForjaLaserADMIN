import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Send, Download, ShoppingBag, Calculator, Check, MessageSquare } from 'lucide-react';
import { Producto, Cotizacion } from '../types';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import { formatMoney } from '../utils';

interface CalculatorTabProps {
  productos: Producto[];
  t: any;
}

interface ItemCotizacion {
  producto: Producto;
  cantidad: number;
  precioAplicado: number;
  total: number;
  esMayoreo: boolean;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  productos,
  t
}) => {
  const [cliente, setCliente] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  
  // Costos extras
  const [extraEnvio, setExtraEnvio] = useState(0);
  const [extraPersonalizacion, setExtraPersonalizacion] = useState(0);
  const [extraEnsamble, setExtraEnsamble] = useState(0);
  const [notas, setNotas] = useState('');

  // Totales
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [total, setTotal] = useState(0);

  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Recalcular totales cuando cambian los items o extras
  useEffect(() => {
    let sub = 0;
    let desc = 0;

    items.forEach(item => {
      const precioMenudeoTotal = item.cantidad * item.producto.precioMenudeo;
      const precioRealTotal = item.cantidad * item.precioAplicado;
      
      sub += precioMenudeoTotal;
      desc += (precioMenudeoTotal - precioRealTotal);
    });

    const extTotal = extraEnvio + extraPersonalizacion + extraEnsamble;
    const finalTotal = sub - desc + extTotal;

    setSubtotal(sub);
    setDescuento(desc);
    setTotal(finalTotal);
    setIsSaved(false);
  }, [items, extraEnvio, extraPersonalizacion, extraEnsamble]);

  // Agregar item a la cotización
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const prod = productos.find(p => p.id === selectedProductId);
    if (!prod) return;

    const cant = Math.max(1, cantidad);
    
    // Detectar mayoreo automáticamente
    const esMayoreo = cant >= (prod.cantidadMayoreo || 6);
    const precioAplicado = esMayoreo ? prod.precioMayoreo : prod.precioMenudeo;

    // Verificar si ya existe en la lista para sumarle cantidad o actualizarlo
    const existingIdx = items.findIndex(item => item.producto.id === prod.id);

    if (existingIdx > -1) {
      const updated = [...items];
      const nuevaCantidad = updated[existingIdx].cantidad + cant;
      const nuevoEsMayoreo = nuevaCantidad >= (prod.cantidadMayoreo || 6);
      const nuevoPrecio = nuevoEsMayoreo ? prod.precioMayoreo : prod.precioMenudeo;

      updated[existingIdx] = {
        producto: prod,
        cantidad: nuevaCantidad,
        precioAplicado: nuevoPrecio,
        total: nuevaCantidad * nuevoPrecio,
        esMayoreo: nuevoEsMayoreo
      };
      setItems(updated);
    } else {
      setItems([...items, {
        producto: prod,
        cantidad: cant,
        precioAplicado,
        total: cant * precioAplicado,
        esMayoreo
      }]);
    }

    // Reset de selección de producto
    setSelectedProductId('');
    setCantidad(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Construir texto de WhatsApp
  const generateWhatsAppMessage = (): string => {
    let msg = `*🔥 FORJA LASER - COTIZACIÓN DE PRODUCTOS*\n`;
    if (cliente.trim()) {
      msg += `*Cliente:* ${cliente}\n`;
    }
    msg += `*Fecha:* ${new Date().toLocaleDateString('es-MX')}\n`;
    msg += `-------------------------------------------\n`;

    items.forEach(item => {
      msg += `• *${item.cantidad}x* ${item.producto.nombre}\n`;
      msg += `  P. Unitario: ${formatMoney(item.precioAplicado)}${item.esMayoreo ? ' *(Precio Mayoreo)*' : ''}\n`;
      msg += `  Subtotal: ${formatMoney(item.total)}\n`;
    });

    msg += `-------------------------------------------\n`;
    msg += `*Subtotal:* ${formatMoney(subtotal)}\n`;
    if (descuento > 0) {
      msg += `*Descuento Mayoreo:* -${formatMoney(descuento)}\n`;
    }
    if (extraEnvio > 0) msg += `*Costo de Envío:* ${formatMoney(extraEnvio)}\n`;
    if (extraPersonalizacion > 0) msg += `*Diseño/Personalización:* ${formatMoney(extraPersonalizacion)}\n`;
    if (extraEnsamble > 0) msg += `*Mano de Obra/Ensamble:* ${formatMoney(extraEnsamble)}\n`;
    msg += `*TOTAL A PAGAR:* ${formatMoney(total)}\n`;
    msg += `-------------------------------------------\n`;
    if (notas.trim()) {
      msg += `*Notas:* _${notas}_\n\n`;
    }
    msg += `¡Gracias por tu preferencia! Cualquier duda escríbenos. ✨`;
    return msg;
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const encoded = encodeURIComponent(text);
    // WhatsApp api
    window.open(`https://api.whatsapp.com/send?phone=525548241024&text=${encoded}`, '_blank');
  };

  // Copiar cotización de texto
  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Guardar Cotización en Firebase y abrir Diálogo de Impresión (PDF)
  const handleSaveAndPrint = async () => {
    if (items.length === 0) return;

    const id = `cot_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const cotizacion: Cotizacion = {
      id,
      cliente: cliente.trim() || 'Cliente General',
      fecha: timestamp,
      productos: items.map(item => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioAplicado,
        total: item.total
      })),
      subtotal,
      descuento,
      extras: {
        envio: extraEnvio,
        personalizacion: extraPersonalizacion,
        ensamble: extraEnsamble
      },
      total,
      notas,
      mensajeWhatsApp: generateWhatsAppMessage()
    };

    try {
      // Guardar en Firebase
      await set(ref(rtdb, `cotizaciones/${id}`), cotizacion);
      setIsSaved(true);

      // Lanzar impresión con diseño específico de impresión de factura
      window.print();
    } catch (err) {
      console.error("Error guardando cotización:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cotización Impresión CSS Invisible en Pantalla */}
      <div className="hidden print:block print:p-8 bg-white text-black font-sans leading-normal">
        <div className="flex justify-between items-start border-b-2 border-amber-600 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-700 uppercase tracking-wide">Forja Laser</h1>
            <p className="text-sm text-gray-500 font-medium">Ubicación: Ixtapaluca, Edo. de México, México</p>
            <p className="text-sm text-gray-500">WhatsApp: 55 4824 1024 y 55 2987 5728</p>
            <p className="text-xs text-gray-400 mt-1">Corte y grabado personalizado en MDF</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-gray-800 uppercase">Cotización de Servicio</h2>
            <p className="text-sm text-gray-500 mt-1">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
            <p className="text-sm text-gray-500 font-mono">No: {Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cliente</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{cliente.trim() || 'Cliente General'}</p>
        </div>

        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-amber-600 text-white font-bold uppercase text-xs">
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-center">Cantidad</th>
              <th className="p-3 text-right">Precio Unitario</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="p-3 font-semibold text-gray-800">{item.producto.nombre}</td>
                <td className="p-3 text-center font-mono">{item.cantidad}</td>
                <td className="p-3 text-right font-mono">{formatMoney(item.precioAplicado)}</td>
                <td className="p-3 text-right font-mono font-bold">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-1/2 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500 font-medium">Subtotal:</span>
              <span className="font-bold font-mono">{formatMoney(subtotal)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between border-b border-gray-100 py-1 text-emerald-600">
                <span className="font-semibold">Descuento Mayoreo:</span>
                <span className="font-bold font-mono">-{formatMoney(descuento)}</span>
              </div>
            )}
            {extraEnvio > 0 && (
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Envío:</span>
                <span className="font-bold font-mono">{formatMoney(extraEnvio)}</span>
              </div>
            )}
            {extraPersonalizacion > 0 && (
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Personalización:</span>
                <span className="font-bold font-mono">{formatMoney(extraPersonalizacion)}</span>
              </div>
            )}
            {extraEnsamble > 0 && (
              <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-500">Ensamble:</span>
                <span className="font-bold font-mono">{formatMoney(extraEnsamble)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-amber-600 pt-2 text-lg font-extrabold text-amber-800">
              <span>Total a Pagar:</span>
              <span className="font-mono">{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {notas.trim() && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm italic mb-10">
            <p className="font-bold text-gray-700 not-italic uppercase text-xs mb-1">Notas de la Cotización</p>
            {notas}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-6 mt-12">
          <p className="font-bold text-gray-500">Forja Laser © {new Date().getFullYear()}</p>
          <p className="mt-1">¡Gracias por hacer negocios con nosotros!</p>
        </div>
      </div>

      {/* DISEÑO EN PANTALLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Generador de Cotización */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              {t.calcTitle}
            </h3>

            {/* Datos del Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.calcClientName}</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nombre completo del cliente..."
              />
            </div>

            {/* Añadir Producto */}
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.calcProductSelect}</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- {t.calcProductSelect} --</option>
                  {productos.filter(p => p.activo).map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre} (Menudeo: {formatMoney(prod.precioMenudeo)} | Mayoreo: {formatMoney(prod.precioMayoreo)} al comprar {prod.cantidadMayoreo}+)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t.calcQty}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center font-bold"
                  />
                </div>

                <button
                  type="submit"
                  id="add-calc-item"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                  title="Agregar producto"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Listado de items agregados */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                {t.calcAddedProducts}
              </h4>

              {items.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-150 shadow-2xs hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.producto.nombre}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                          <span>Cant: <strong className="font-mono text-gray-700 text-sm">{item.cantidad}</strong></span>
                          <span>Unitario: <strong className="font-mono text-gray-700">{formatMoney(item.precioAplicado)}</strong></span>
                          {item.esMayoreo && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.2 rounded font-bold text-[10px]">
                              Mayoreo aplicado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 pl-4">
                        <span className="font-bold font-mono text-sm text-gray-800">{formatMoney(item.total)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/20">
                  Agrega productos para iniciar la cotización.
                </p>
              )}
            </div>
          </div>

          {/* Costos Extras y Notas */}
          {items.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-700 text-sm">Cargos Adicionales y Ajustes</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{t.calcExtraEnvio}</label>
                  <input
                    type="number"
                    value={extraEnvio}
                    onChange={(e) => setExtraEnvio(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{t.calcExtraPersonalizacion}</label>
                  <input
                    type="number"
                    value={extraPersonalizacion}
                    onChange={(e) => setExtraPersonalizacion(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{t.calcExtraEnsamble}</label>
                  <input
                    type="number"
                    value={extraEnsamble}
                    onChange={(e) => setExtraEnsamble(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t.calcNotes}</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Instrucciones especiales de ensamble, personalización o entrega..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm min-h-[80px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Resumen de Cotización */}
        <div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              {t.calcSummary}
            </h3>

            {/* desglose */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{t.calcSubtotal}:</span>
                <span className="font-bold font-mono">{formatMoney(subtotal)}</span>
              </div>

              {descuento > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded">
                  <span className="font-semibold">{t.calcDiscount} (Mayoreo):</span>
                  <span className="font-bold font-mono">-{formatMoney(descuento)}</span>
                </div>
              )}

              {extraEnvio > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Costo Envío:</span>
                  <span className="font-bold font-mono">+{formatMoney(extraEnvio)}</span>
                </div>
              )}

              {extraPersonalizacion > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Diseño / Personalización:</span>
                  <span className="font-bold font-mono">+{formatMoney(extraPersonalizacion)}</span>
                </div>
              )}

              {extraEnsamble > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Mano de Obra / Ensamble:</span>
                  <span className="font-bold font-mono">+{formatMoney(extraEnsamble)}</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-lg font-extrabold text-amber-800">
                <span>{t.calcTotal}:</span>
                <span className="font-mono text-2xl">{formatMoney(total)}</span>
              </div>
            </div>

            {/* Acciones de Cotización */}
            {items.length > 0 ? (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <button
                  id="calc-save-pdf"
                  onClick={handleSaveAndPrint}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>{t.calcDownloadPDF} / Imprimir</span>
                </button>

                <button
                  id="calc-copy-whatsapp"
                  onClick={handleCopyText}
                  className={`w-full py-3 font-extrabold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] border cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-100'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  <span>{copied ? t.copied : 'Copiar Reporte Texto'}</span>
                </button>

                <button
                  id="calc-send-whatsapp"
                  onClick={handleSendWhatsApp}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  <span>{t.calcSendWhatsApp}</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">
                {t.calcNoProducts}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CalculatorTab;
