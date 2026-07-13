import React from 'react';
import { Package, FileText, Star, Calendar, ArrowRight, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { Producto, Publicacion } from '../types';
import { TEMPORADAS, calcularDiasRestantes } from '../utils';

interface DashboardProps {
  productos: Producto[];
  publicaciones: Publicacion[];
  setActiveTab: (tab: string) => void;
  openNewProductModal: () => void;
  openNewPublicationModal: () => void;
  t: any;
}

export const Dashboard: React.FC<DashboardProps> = ({
  productos,
  publicaciones,
  setActiveTab,
  openNewProductModal,
  openNewPublicationModal,
  t
}) => {
  // Estadísticas
  const totalProductos = productos.filter(p => p.activo).length;
  const totalPublicaciones = publicaciones.length;
  const publicacionesFavoritas = publicaciones.filter(p => p.favorita).length;

  // Próximas temporadas ordenadas por días restantes
  const temporadasCalculadas = TEMPORADAS.map(temp => {
    const calc = calcularDiasRestantes(temp.fecha);
    return { ...temp, ...calc };
  }).sort((a, b) => a.dias - b.dias);

  // Top publicaciones
  const topPublicaciones = [...publicaciones]
    .filter(p => p.contadorUso > 0)
    .sort((a, b) => b.contadorUso - a.contadorUso)
    .slice(0, 5);

  const proximaTemporada = temporadasCalculadas[0];
  const mostrarAlertaTemporada = proximaTemporada && proximaTemporada.dias <= 15;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* HERO CARD: Temporada Próxima / Bienvenida */}
        <div className="col-span-1 md:col-span-2 bento-card relative overflow-hidden bg-[#1A1A1A] border-stone-800 flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#C9A961] bg-amber-950/20 rounded-full border border-amber-950/40">
              {mostrarAlertaTemporada ? 'Temporada Próxima' : 'Panel de Control'}
            </span>
            <h2 className="text-3xl font-extrabold font-display text-white mt-4 tracking-tight leading-tight">
              {mostrarAlertaTemporada ? proximaTemporada.nombre : 'Forja Laser'}
            </h2>
            <p className="text-sm text-stone-300 mt-2 max-w-md font-medium">
              {mostrarAlertaTemporada 
                ? `Faltan ${proximaTemporada.dias} días para la festividad. ${proximaTemporada.descripcion}`
                : 'Gestión inteligente de MDF. Revisa productos activos, métricas de publicaciones en redes sociales y cotiza de manera automatizada.'}
            </p>
          </div>
          
          <div className="relative z-10 flex space-x-3 mt-6">
            {mostrarAlertaTemporada ? (
              <>
                <span className="px-3 py-1 rounded-full bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold">
                  Alta Demanda
                </span>
                <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-bold">
                  {proximaTemporada.fecha.split('-').reverse().slice(0, 2).join('/')}
                </span>
              </>
            ) : (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base de Datos Activa</span>
              </span>
            )}
          </div>
          
          {/* Ilustración de fondo geométrica abstracta estilo bento */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 opacity-10 pointer-events-none">
            <div className="w-full h-full" style={{ backgroundColor: '#C9A961', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          </div>
        </div>

        {/* STATS 1: Productos Activos */}
        <div className="bento-card bg-[#1A1A1A] border-stone-800 flex flex-col justify-between items-start min-h-[220px]">
          <div className="p-3 bg-stone-800 rounded-xl text-[#C9A961] border border-stone-750">
            <Package className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider font-extrabold text-stone-400">{t.totalProducts}</p>
            <h3 className="text-5xl font-bold font-display text-white mt-1 tracking-tight">
              {String(totalProductos).padStart(2, '0')}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('productos')}
            className="text-xs font-bold text-[#C9A961] hover:underline mt-4 flex items-center space-x-1 cursor-pointer"
          >
            <span>Administrar catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATS 2: Publicaciones */}
        <div className="bento-card bg-[#1A1A1A] border-stone-800 flex flex-col justify-between items-start min-h-[220px]">
          <div className="p-3 bg-stone-800 rounded-xl text-[#C9A961] border border-stone-750">
            <FileText className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider font-extrabold text-stone-400">{t.totalPublications}</p>
            <h3 className="text-5xl font-bold font-display text-white mt-1 tracking-tight">
              {String(totalPublicaciones).padStart(2, '0')}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('publicaciones')}
            className="text-xs font-bold text-[#C9A961] hover:underline mt-4 flex items-center space-x-1 cursor-pointer"
          >
            <span>Ver publicaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATS 3: Favoritas */}
        <div className="bento-card bg-[#1A1A1A] border-stone-800 flex flex-col justify-between items-start min-h-[220px] md:col-span-2 lg:col-span-1">
          <div className="p-3 bg-stone-800 rounded-xl text-yellow-500 border border-stone-750">
            <Star className="w-5 h-5 fill-yellow-500/10" />
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider font-extrabold text-stone-400">{t.favPublications}</p>
            <h3 className="text-5xl font-bold font-display text-white mt-1 tracking-tight">
              {String(publicacionesFavoritas).padStart(2, '0')}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('publicaciones')}
            className="text-xs font-bold text-[#C9A961] hover:underline mt-4 flex items-center space-x-1 cursor-pointer"
          >
            <span>Filtrar favoritas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* QUICK ACCESS: Bento Card Dark de estilo destacado */}
        <div className="bento-card-dark col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[350px]">
          <div>
            <span className="text-[#C9A961] font-bold text-[10px] uppercase tracking-widest block mb-1">
              {t.quickAccess}
            </span>
            <h3 className="text-lg font-bold font-display tracking-tight text-white mt-2">
              Acciones de Colaborador
            </h3>
            <p className="text-xs text-stone-300 mt-2 font-medium">
              Lanza rápidamente los flujos de creación para mantener el catálogo al día.
            </p>
          </div>

          <div className="space-y-3 my-6 flex-1 flex flex-col justify-center">
            <button
              id="quick-add-product"
              onClick={openNewProductModal}
              className="w-full flex items-center justify-between p-3 bg-stone-800/80 hover:bg-stone-800 rounded-xl text-left border border-stone-700/50 transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-200 group-hover:text-white">{t.newProduct}</p>
                <p className="text-[10px] text-stone-300 font-semibold">Crear MDF personalizado</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C9A961] transition-transform group-hover:translate-x-1" />
            </button>

            <button
              id="quick-add-publication"
              onClick={openNewPublicationModal}
              className="w-full flex items-center justify-between p-3 bg-stone-800/80 hover:bg-stone-800 rounded-xl text-left border border-stone-700/50 transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-200 group-hover:text-white">{t.newPublication}</p>
                <p className="text-[10px] text-stone-300 font-semibold">Texto optimizado para redes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C9A961] transition-transform group-hover:translate-x-1" />
            </button>

            <button
              id="quick-calculator"
              onClick={() => setActiveTab('calculadora')}
              className="w-full flex items-center justify-between p-3 bg-stone-800/80 hover:bg-stone-800 rounded-xl text-left border border-stone-700/50 transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-200 group-hover:text-white">{t.tabCalculator}</p>
                <p className="text-[10px] text-stone-300 font-semibold">Generar PDF y WhatsApp</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C9A961] transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-300 font-bold font-mono">
            <span>FORJA LASER</span>
            <span className="text-[#C9A961]">V1.5</span>
          </div>
        </div>

        {/* CALENDAR SEASONS CARD */}
        <div className="bento-card col-span-1 md:col-span-2 flex flex-col justify-between min-h-[350px] bg-[#1A1A1A] border-stone-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-display tracking-tight">
              <Calendar className="w-4 h-4 text-[#C9A961]" />
              {t.upcomingSeasons}
            </h3>
            <p className="text-xs text-stone-400 mt-1 font-medium">Sincronización de temporalidades y demandas del mercado.</p>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 my-4 flex-1">
            {temporadasCalculadas.map(temp => {
              let badgeColor = "bg-emerald-950/20 text-emerald-450 border-emerald-900/30";
              if (temp.dias === 0) {
                badgeColor = "bg-red-950/40 text-red-400 border-red-900/40 animate-pulse";
              } else if (temp.dias <= 10) {
                badgeColor = "bg-red-950/20 text-red-400 border-red-900/30";
              } else if (temp.dias <= 30) {
                badgeColor = "bg-amber-950/20 text-amber-400 border-amber-900/30";
              }

              return (
                <div key={temp.id} className="flex items-center justify-between p-2.5 bg-stone-850 rounded-xl border border-stone-800 hover:bg-stone-750 transition-colors">
                  <div className="truncate pr-2">
                    <p className="font-bold text-xs text-stone-100 truncate">{temp.nombre}</p>
                    <p className="text-[10px] text-stone-400 font-semibold truncate">{temp.descripcion}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                      {temp.dias === 0 ? "¡Hoy!" : temp.dias === 1 ? "Mañana" : `Faltan ${temp.dias} d`}
                    </span>
                    <p className="text-[9px] text-stone-300 font-extrabold mt-0.5">{temp.fecha.split('-').reverse().slice(0, 2).join('/')}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-800 text-right">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase">Estacionalidad Activa</span>
          </div>
        </div>

        {/* TOP PUBLICATIONS */}
        <div className="bento-card col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[350px] bg-[#1A1A1A] border-stone-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-display tracking-tight">
              <TrendingUp className="w-4 h-4 text-[#C9A961]" />
              {t.topPublications}
            </h3>
            <p className="text-xs text-stone-400 mt-1 font-semibold">Publicaciones más copiadas para promociones rápidas.</p>
          </div>

          <div className="space-y-2.5 flex-1 my-4 flex flex-col justify-center">
            {topPublicaciones.length > 0 ? (
              topPublicaciones.map((pub, idx) => {
                const prod = productos.find(p => p.id === pub.productoId);
                return (
                  <div key={pub.id} className="flex items-center justify-between p-2.5 bg-stone-850 rounded-xl border border-stone-800 hover:bg-stone-750 transition-colors">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-6.5 h-6.5 flex items-center justify-center bg-amber-950/20 text-[#C9A961] border border-amber-950/40 rounded-lg font-bold text-[11px] flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-stone-100 truncate">{pub.titulo}</p>
                        <p className="text-[10px] text-stone-400 font-semibold truncate">
                          {prod ? prod.nombre : 'Sin producto'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="bg-stone-800 text-stone-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {pub.contadorUso} copias
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-400 py-6 text-center">{t.noTopPublications}</p>
            )}
          </div>

          <div className="pt-2 border-t border-stone-800">
            <button 
              onClick={() => setActiveTab('publicaciones')}
              className="text-xs font-bold text-[#C9A961] hover:underline flex items-center justify-end w-full space-x-1 cursor-pointer"
            >
              <span>Ir al banco de textos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
