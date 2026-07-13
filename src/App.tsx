import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Home, 
  Package, 
  FileText, 
  Tag, 
  Mail, 
  Calculator as CalcIcon, 
  Image as GalleryIcon, 
  LogOut, 
  Globe, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { rtdb, ref, get, set } from './firebase';
import { onValue } from 'firebase/database';
import { Producto, Publicacion, Categoria, Medida, PlantillaMensaje, Usuario } from './types';
import { sha256 } from './utils';
import { translations, Language } from './translations';
import { 
  CATEGORIAS_INICIALES, 
  MEDIDAS_INICIALES, 
  PLANTILLAS_INICIALES, 
  PRODUCTOS_INICIALES 
} from './dataInicial';

// Componentes
import Dashboard from './components/Dashboard';
import ProductsTab from './components/ProductsTab';
import PublicationsTab from './components/PublicationsTab';
import CategoriesTab from './components/CategoriesTab';
import TemplatesTab from './components/TemplatesTab';
import CalculatorTab from './components/CalculatorTab';
import GalleryTab from './components/GalleryTab';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  // Configuración de idioma y tema (local o guardado)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('forja_lang') as Language) || 'es';
  });
  
  const [theme, setTheme] = useState<'oscuro'>('oscuro');

  const t = translations[lang];

  // Estado de Autenticación
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<Usuario | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estado Global de la Base de Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaMensaje[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [activeTab, setActiveTab] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modales compartidos de acción rápida
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewPublicationModal, setShowNewPublicationModal] = useState(false);

  // Helper para lanzar toasts
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Verificar sesión activa (24 horas)
  useEffect(() => {
    const sessionStr = localStorage.getItem('forja_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const diffHours = (Date.now() - session.timestamp) / (1000 * 60 * 60);
        if (diffHours < 24) {
          setIsLoggedIn(true);
          setLoggedInUser(session.user);
        } else {
          localStorage.removeItem('forja_session');
        }
      } catch (e) {
        localStorage.removeItem('forja_session');
      }
    }
  }, []);

  // Sincronizar tema con la clase HTML del DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('forja_theme', theme);
  }, [theme]);

  // Sincronización de Base de Datos en Tiempo Real
  useEffect(() => {
    setLoading(true);
    
    // 1. Escuchar Configuración y verificar inicialización
    const configRef = ref(rtdb, 'configuracion');
    const unsubscribeConfig = onValue(configRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.inicializado) {
        console.log("Base de datos vacía o no inicializada. Ejecutando inicialización automática...");
        await inicializarBaseDeDatos();
      }
    });

    // 2. Escuchar Productos
    const unsubscribeProductos = onValue(ref(rtdb, 'productos'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setProductos(list);
      } else {
        setProductos([]);
      }
    });

    // 3. Escuchar Publicaciones
    const unsubscribePublicaciones = onValue(ref(rtdb, 'publicaciones'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setPublicaciones(list);
      } else {
        setPublicaciones([]);
      }
    });

    // 4. Escuchar Categorías
    const unsubscribeCategorias = onValue(ref(rtdb, 'categorias'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setCategorias(list);
      } else {
        setCategorias([]);
      }
    });

    // 5. Escuchar Medidas
    const unsubscribeMedidas = onValue(ref(rtdb, 'medidas'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setMedidas(list);
      } else {
        setMedidas([]);
      }
    });

    // 6. Escuchar Plantillas
    const unsubscribePlantillas = onValue(ref(rtdb, 'plantillas_mensaje'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setPlantillas(list);
      } else {
        setPlantillas([]);
      }
    });

    // 7. Escuchar Usuarios
    const unsubscribeUsuarios = onValue(ref(rtdb, 'usuarios'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        setUsuarios(list);
      } else {
        setUsuarios([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeProductos();
      unsubscribePublicaciones();
      unsubscribeCategorias();
      unsubscribeMedidas();
      unsubscribePlantillas();
      unsubscribeUsuarios();
    };
  }, []);

  // Función de Inicialización Automática
  const inicializarBaseDeDatos = async () => {
    try {
      addToast('success', 'Inicializando catálogo y configuraciones base...');
      
      // Categorías
      for (const cat of CATEGORIAS_INICIALES) {
        await set(ref(rtdb, `categorias/${cat.id}`), cat);
      }

      // Medidas
      for (const med of MEDIDAS_INICIALES) {
        await set(ref(rtdb, `medidas/${med.id}`), med);
      }

      // Plantillas
      for (const temp of PLANTILLAS_INICIALES) {
        await set(ref(rtdb, `plantillas_mensaje/${temp.id}`), temp);
      }

      // Productos
      for (const prod of PRODUCTOS_INICIALES) {
        await set(ref(rtdb, `productos/${prod.id}`), prod);
      }

      // Usuario Admin Inicial (contraseña admin123 hash pre-calculado)
      const adminUser: Usuario = {
        id: 'usr_admin',
        username: 'admin',
        passwordHash: '240751a0be5f308960f224f8d9515904b78932462e0ff3c690f339cf0122e232', // sha256 de admin123
        nombre: 'Administrador Forja Laser',
        rol: 'administrador',
        activo: true
      };
      await set(ref(rtdb, `usuarios/usr_admin`), adminUser);

      // Configuración Base
      const config = {
        empresa: {
          nombre: "Forja Laser",
          eslogan: "Corte y grabado personalizado en MDF",
          telefonos: "55 4824 1024 / 55 2987 5728",
          direccion: "Ixtapaluca, Edo. de México"
        },
        idioma: "es",
        tema: "claro",
        moneda: "MXN",
        costos: {
          precioTabla40x40: 15,
          costoPorMinuto: 0.15,
          costoEnsambleDefault: 5
        },
        inicializado: true
      };
      await set(ref(rtdb, 'configuracion'), config);

      addToast('success', 'Base de datos inicializada con éxito.');
    } catch (e) {
      console.error("Error durante la inicialización:", e);
      addToast('error', 'Error al inicializar base de datos.');
    }
  };

  // Manejador de Login SHA-256 Custom
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError(t.invalidLogin);
      return;
    }

    try {
      const pHash = await sha256(loginPassword);
      
      // Buscar usuario coincidente
      const found = usuarios.find(u => 
        u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
        u.passwordHash === pHash &&
        u.activo
      );

      if (found) {
        setIsLoggedIn(true);
        setLoggedInUser(found);
        
        // Guardar sesión por 24 horas
        localStorage.setItem('forja_session', JSON.stringify({
          user: found,
          timestamp: Date.now()
        }));

        setLoginUsername('');
        setLoginPassword('');
        addToast('success', t.welcome.replace('{{name}}', found.nombre));
      } else {
        setLoginError(t.invalidLogin);
      }
    } catch (e) {
      console.error(e);
      setLoginError('Error del servidor de autenticación.');
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser(null);
    localStorage.removeItem('forja_session');
  };

  // Cambiar idioma
  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    localStorage.setItem('forja_lang', nextLang);
  };

  // Cambiar tema
  const toggleTheme = () => {
    // Forzado a oscuro permanente
  };

  // Renderizar la vista de Login si no está logueado
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5EFE0] dark:bg-[#121212] p-4 font-sans transition-colors duration-200 select-none">
        <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-800/60 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#5C3A1E] dark:text-[#C9A961] tracking-tight font-display">Forja Laser</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{t.title}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{t.username}</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-2 border border-stone-200 dark:border-stone-850 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{t.password}</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-200 dark:border-stone-850 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-950/40">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              className="w-full py-3 bg-[#5C3A1E] dark:bg-[#C9A961] hover:bg-[#432A15] dark:hover:bg-[#8B6F2A] text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 cursor-pointer font-display"
            >
              {t.loginTitle}
            </button>
          </form>

          {/* Toggle de idioma en login */}
          <div className="flex justify-center pt-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-xs text-stone-400 hover:text-[#C9A961] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 {lang === 'es' ? 'English' : 'Español'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFE0] dark:bg-[#121212] text-stone-900 dark:text-stone-100 font-sans flex flex-col md:flex-row transition-colors duration-200">
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1A1A1A] dark:bg-[#111111] border-r border-stone-850 dark:border-stone-900 sticky top-0 h-screen justify-between py-6 flex-shrink-0">
        <div className="space-y-6">
          <div className="px-6 space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-[#C9A961] font-display">FORJA LASER</h1>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{t.subtitle}</p>
          </div>

          <nav className="space-y-1.5 px-3">
            {[
              { id: 'inicio', label: t.tabDashboard, icon: <Home className="w-5 h-5" /> },
              { id: 'productos', label: t.tabProducts, icon: <Package className="w-5 h-5" /> },
              { id: 'publicaciones', label: t.tabPublications, icon: <FileText className="w-5 h-5" /> },
              { id: 'categorias', label: t.tabCategories, icon: <Tag className="w-5 h-5" /> },
              { id: 'plantillas', label: t.tabTemplates, icon: <Mail className="w-5 h-5" /> },
              { id: 'calculadora', label: t.tabCalculator, icon: <CalcIcon className="w-5 h-5" /> },
              { id: 'galeria', label: t.tabGallery, icon: <GalleryIcon className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-stone-850 text-white border-l-4 border-[#C9A961] pl-3 rounded-r-lg rounded-l-none' 
                    : 'text-stone-400 hover:bg-stone-850/60 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="px-4 space-y-4">
          <div className="border-t border-stone-850 pt-4 space-y-1 text-xs text-stone-500">
            <p className="px-2">Colaborador:</p>
            <p className="px-2 font-bold text-stone-250 truncate">{loggedInUser?.nombre}</p>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-950/20 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & MENU */}
      <header className="md:hidden bg-[#1A1A1A] text-stone-200 border-b border-stone-800 p-4 sticky top-0 z-40 flex items-center justify-between select-none">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-[#C9A961] tracking-tight font-display">FORJA LASER</h1>
          <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{t.subtitle}</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Toggle de idioma móvil */}
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-stone-800 rounded-full transition-colors cursor-pointer text-stone-400 hover:text-[#C9A961]"
            title="Switch Language"
          >
            <Globe className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-stone-850 border border-stone-800 rounded-xl text-stone-300 cursor-pointer hover:bg-stone-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[61px] bottom-0 bg-[#1A1A1A] z-30 flex flex-col justify-between py-6 animate-in slide-in-from-top-10 duration-200">
          <nav className="space-y-1.5 px-4">
            {[
              { id: 'inicio', label: t.tabDashboard, icon: <Home className="w-5 h-5" /> },
              { id: 'productos', label: t.tabProducts, icon: <Package className="w-5 h-5" /> },
              { id: 'publicaciones', label: t.tabPublications, icon: <FileText className="w-5 h-5" /> },
              { id: 'categorias', label: t.tabCategories, icon: <Tag className="w-5 h-5" /> },
              { id: 'plantillas', label: t.tabTemplates, icon: <Mail className="w-5 h-5" /> },
              { id: 'calculadora', label: t.tabCalculator, icon: <CalcIcon className="w-5 h-5" /> },
              { id: 'galeria', label: t.tabGallery, icon: <GalleryIcon className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                id={`mobile-tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-stone-850 text-white border-l-4 border-[#C9A961] pl-3 rounded-r-lg rounded-l-none' 
                    : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-4 space-y-4">
            <div className="border-t border-stone-800 pt-4 text-xs text-stone-500">
              <p>Colaborador:</p>
              <p className="font-bold text-stone-200 mt-1">{loggedInUser?.nombre}</p>
            </div>
            <button
              id="mobile-logout-btn"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-950/20 rounded-xl font-semibold text-sm cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>{t.logoutBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* TOP BAR / HEADER CONTROL (DESKTOP) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-[#1A1A1A] border-b border-stone-200 dark:border-stone-850 z-10 select-none">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center space-x-2 font-display tracking-tight capitalize">
              <span>{activeTab === 'inicio' ? t.tabDashboard : activeTab}</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Panel administrativo y cotizador para colaboradores internos</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Toggle de idioma */}
            <button
              id="desktop-lang-toggle"
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-4 py-2 border border-stone-200 dark:border-stone-850 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors shadow-sm bg-white dark:bg-[#1A1A1A]"
              title="Toggle Language"
            >
              <Globe className="w-4 h-4 text-stone-500" />
              <span>🌐 {lang.toUpperCase()}</span>
            </button>

            {/* Idioma */}
          </div>
        </header>

        {/* CONTENIDO INTERNO */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-24 text-gray-400 text-sm font-semibold animate-pulse">
              {t.loading}
            </div>
          ) : (
            <>
              {activeTab === 'inicio' && (
                <Dashboard 
                  productos={productos} 
                  publicaciones={publicaciones} 
                  setActiveTab={setActiveTab}
                  openNewProductModal={() => setShowNewProductModal(true)}
                  openNewPublicationModal={() => setShowNewPublicationModal(true)}
                  t={t}
                />
              )}

              {activeTab === 'productos' && (
                <ProductsTab 
                  productos={productos} 
                  categorias={categorias}
                  medidas={medidas}
                  publicaciones={publicaciones}
                  showNewProductModal={showNewProductModal}
                  setShowNewProductModal={setShowNewProductModal}
                  t={t}
                />
              )}

              {activeTab === 'publicaciones' && (
                <PublicationsTab 
                  publicaciones={publicaciones}
                  productos={productos}
                  showNewPublicationModal={showNewPublicationModal}
                  setShowNewPublicationModal={setShowNewPublicationModal}
                  t={t}
                />
              )}

              {activeTab === 'categorias' && (
                <CategoriesTab 
                  categorias={categorias} 
                  t={t}
                />
              )}

              {activeTab === 'plantillas' && (
                <TemplatesTab 
                  plantillas={plantillas} 
                  t={t}
                />
              )}

              {activeTab === 'calculadora' && (
                <CalculatorTab 
                  productos={productos} 
                  t={t}
                />
              )}

              {activeTab === 'galeria' && (
                <GalleryTab 
                  productos={productos} 
                  t={t}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* SISTEMA DE TOAST NOTIFICACIONES */}
      <div className="fixed bottom-6 right-6 z-55 space-y-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold pointer-events-auto animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/40 text-emerald-800 dark:text-emerald-400' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-950/40 text-red-800 dark:text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
