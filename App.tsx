
import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, ViewMode, User } from './types';
import { generatePremiumCopy } from './services/geminiService';
import PayPalButton from './components/PayPalButton';
import { 
  Lock, Upload, Grid, X, ShoppingBag, Star, 
  ShieldCheck, Edit3, Trash2, Camera, Settings, 
  Heart, Share2, ShieldAlert, Package, Download,
  Home, User as UserIcon, Bell, CheckCircle, Plus,
  UserPlus, LogIn, AlertCircle, Info, Sparkles
} from 'lucide-react';

interface ProfileData {
  coverUrl: string;
  avatarUrl: string;
  bio: string;
  username: string;
}

const ADMIN_CONFIG = {
  EMAIL: '183327A3@',
  PASS: 'redsecamising'
};

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.AUTH);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSecured, setIsSecured] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Estados para el flujo de carga segura
  const [tempFile, setTempFile] = useState<string | null>(null);
  const [tempMime, setTempMime] = useState<string>('');
  const [uploadConcept, setUploadConcept] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    bio: 'Contenido exclusivo y momentos únicos. Creado para tu disfrute privado.',
    username: 'rominvpinto'
  });

  useEffect(() => {
    const handleVisibilityChange = () => setIsSecured(document.visibilityState === 'hidden');
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    const savedItems = localStorage.getItem('rominvpinto_items');
    if (savedItems) setItems(JSON.parse(savedItems));

    const session = localStorage.getItem('rominvpinto_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
      setViewMode(ViewMode.GALLERY);
    }

    setTimeout(() => setIsAppLoading(false), 1200);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const saveItems = (newItems: MediaItem[]) => {
    setItems(newItems);
    localStorage.setItem('rominvpinto_items', JSON.stringify(newItems));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rominvpinto_session');
    setViewMode(ViewMode.AUTH);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target as any;
    const email = form.email.value.trim();
    const password = form.pass.value;

    if (email === ADMIN_CONFIG.EMAIL && password === ADMIN_CONFIG.PASS) {
      const admin: User = { id: 'admin-root', email, name: 'Administrador', role: 'admin', purchasedIds: [] };
      setCurrentUser(admin);
      localStorage.setItem('rominvpinto_session', JSON.stringify(admin));
      setViewMode(ViewMode.GALLERY);
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('rominvpinto_users') || '[]');
    if (isLoginMode) {
      const found = users.find(u => u.email === email);
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('rominvpinto_session', JSON.stringify(found));
        setViewMode(ViewMode.GALLERY);
      } else {
        setAuthError('Credenciales inválidas');
      }
    } else {
      if (users.find(u => u.email === email) || email === ADMIN_CONFIG.EMAIL) {
        setAuthError('Correo no disponible');
      } else {
        const newUser: User = { id: 'u-'+Date.now(), email, name: email.split('@')[0], role: 'user', purchasedIds: [] };
        localStorage.setItem('rominvpinto_users', JSON.stringify([...users, newUser]));
        setCurrentUser(newUser);
        localStorage.setItem('rominvpinto_session', JSON.stringify(newUser));
        setViewMode(ViewMode.GALLERY);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTempFile(ev.target?.result as string);
      setTempMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const finalizeUpload = async () => {
    if (!tempFile || !uploadConcept) return;
    setIsUploading(true);
    try {
      // SOLO enviamos el concepto de texto a la IA. La imagen se queda local.
      const analysis = await generatePremiumCopy(uploadConcept);
      const newItem: MediaItem = {
        id: 'm-' + Date.now(),
        type: tempMime.startsWith('video') ? 'video' : 'image',
        url: tempFile,
        title: analysis.title,
        description: analysis.teaser,
        price: 5.00
      };
      saveItems([newItem, ...items]);
      setTempFile(null);
      setUploadConcept('');
      setViewMode(ViewMode.GALLERY);
    } catch (err) {
      alert('Error de conexión con la IA');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePurchaseSuccess = (itemId: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, purchasedIds: [...new Set([...currentUser.purchasedIds, itemId])] };
    setCurrentUser(updatedUser);
    localStorage.setItem('rominvpinto_session', JSON.stringify(updatedUser));
    if (currentUser.role !== 'admin') {
      const users: User[] = JSON.parse(localStorage.getItem('rominvpinto_users') || '[]');
      localStorage.setItem('rominvpinto_users', JSON.stringify(users.map(u => u.id === currentUser.id ? updatedUser : u)));
    }
    setShowPaymentModal(false);
  };

  const isUnlocked = (itemId: string) => currentUser?.purchasedIds.includes(itemId) || currentUser?.role === 'admin';

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 premium-gradient flex flex-col items-center justify-center text-white z-[999999]">
        <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center mb-6 animate-bounce shadow-2xl backdrop-blur-md">
          <ShieldCheck size={44} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter italic">rominvpinto</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className={`security-blackout ${isSecured ? 'active' : ''}`}>
        <ShieldAlert size={64} className="text-teal-400 mb-4" />
        <p className="font-black uppercase tracking-widest text-xs">Protección de Bóveda</p>
      </div>

      {viewMode === ViewMode.AUTH ? (
        <div className="min-h-screen p-10 flex flex-col justify-center max-w-md mx-auto">
           <div className="text-center mb-12">
             <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
                <Lock className="text-white" size={32} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter">rominvpinto</h1>
             <p className="text-slate-400 text-sm mt-2">{isLoginMode ? 'Acceso VIP Privado' : 'Registro de Usuario'}</p>
           </div>
           
           <form onSubmit={handleAuth} className="space-y-4">
             {authError && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">{authError}</div>}
             <input name="email" type="text" placeholder="Identificador / Email" required className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-400 font-bold" />
             <input name="pass" type="password" placeholder="Contraseña" required className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-400 font-bold" />
             <button className="w-full premium-gradient text-white py-5 rounded-2xl font-black shadow-xl uppercase text-[11px] tracking-widest mt-4 active:scale-95 transition-all">
               {isLoginMode ? 'Entrar a la Bóveda' : 'Crear Cuenta'}
             </button>
           </form>

           <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest block mx-auto underline decoration-teal-200 decoration-2 underline-offset-4">
             {isLoginMode ? '¿Nuevo? Regístrate gratis' : 'Ya tengo cuenta'}
           </button>
        </div>
      ) : (
        <div className="pb-32">
          {/* Header */}
          <header className="relative mb-12">
            <div className="h-56 w-full bg-slate-200 overflow-hidden">
              <img src={profile.coverUrl} className="w-full h-full object-cover opacity-80" />
            </div>
            <div className="px-8 -mt-16 flex flex-col items-center relative z-10">
              <img src={profile.avatarUrl} className="w-32 h-32 rounded-[2.5rem] border-8 border-[#f8fafc] shadow-2xl" />
              <h2 className="text-3xl font-black text-slate-900 mt-4 tracking-tighter">@{profile.username}</h2>
              <p className="text-slate-500 text-xs font-bold px-8 text-center mt-2 leading-relaxed opacity-60 uppercase tracking-tight">{profile.bio}</p>
            </div>
          </header>

          <main className="px-6">
            {viewMode === ViewMode.UPLOAD ? (
              <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Panel de Carga</h3>
                   <div className="flex items-center justify-center gap-2 text-teal-600 mt-1">
                      <ShieldCheck size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Modo Privacidad Activa</p>
                   </div>
                </div>

                {!tempFile ? (
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-4 border-dashed border-teal-100 rounded-[3rem] p-16 text-center cursor-pointer hover:border-teal-300 transition-colors shadow-inner"
                   >
                     <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="text-teal-500" />
                     </div>
                     <p className="font-black text-slate-800 uppercase tracking-widest text-xs">Seleccionar Media</p>
                     <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*" />
                   </div>
                ) : (
                   <div className="space-y-6">
                     <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                        <img src={tempFile} className="w-full h-full object-cover" />
                        <button onClick={() => setTempFile(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X size={20}/></button>
                     </div>
                     
                     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Concepto para la IA (Tema)</label>
                        <textarea 
                          value={uploadConcept}
                          onChange={(e) => setUploadConcept(e.target.value)}
                          placeholder="Ej: Lencería roja elegante, luz tenue, mirada seductora..."
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-300 min-h-[100px] outline-none focus:ring-2 ring-teal-500/20"
                        />
                        <div className="flex items-center gap-2 px-2">
                           <Info size={12} className="text-teal-500" />
                           <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight">La IA solo verá este texto, nunca tu imagen original por seguridad.</p>
                        </div>
                     </div>

                     <button 
                       disabled={!uploadConcept || isUploading}
                       onClick={finalizeUpload}
                       className="w-full premium-gradient text-white py-5 rounded-2xl font-black shadow-xl uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
                     >
                        {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={18}/>}
                        {isUploading ? 'Procesando Texto...' : 'Publicar con IA'}
                     </button>
                   </div>
                )}
                
                {/* Lista de items existentes para gestión */}
                <div className="pt-10 space-y-4">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-4">Contenido en Bóveda ({items.length})</h4>
                   {items.map(item => (
                     <div key={item.id} className="bg-white p-4 rounded-[1.5rem] flex items-center justify-between border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={item.url} className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <p className="font-black text-slate-800 text-[11px] truncate w-32">{item.title}</p>
                            <p className="text-teal-500 font-black text-[10px]">{item.price} €</p>
                          </div>
                        </div>
                        <button onClick={() => saveItems(items.filter(i => i.id !== item.id))} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter px-2 uppercase tracking-widest">
                  {viewMode === ViewMode.MY_CONTENT ? 'Mis Adquisiciones' : 'Galería Premium'}
                </h3>
                
                {items
                  .filter(item => viewMode === ViewMode.MY_CONTENT ? isUnlocked(item.id) : true)
                  .map((item) => (
                  <div key={item.id} className="relative group animate-in zoom-in-95 duration-700">
                    <div className="aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative bg-slate-100">
                      <img 
                        src={item.url} 
                        className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked(item.id) ? 'blur-[60px] grayscale opacity-40 scale-125' : 'hover:scale-105'}`} 
                      />
                      
                      {!isUnlocked(item.id) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
                            <Lock className="text-white" size={26} />
                          </div>
                          <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase tracking-wider">{item.title}</h4>
                          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-8 px-4 opacity-70">Contenido Exclusivo</p>
                          <button 
                            onClick={() => { setSelectedItem(item); setShowPaymentModal(true); }} 
                            className="w-full py-5 premium-gradient text-white font-black rounded-3xl shadow-2xl uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-transform"
                          >
                            Acceder por {item.price} €
                          </button>
                        </div>
                      ) : (
                        <div className="absolute top-8 right-8 bg-teal-500/90 backdrop-blur-md p-4 rounded-[1.5rem] text-white shadow-2xl border border-white/20">
                          <ShieldCheck size={20} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    {isUnlocked(item.id) && (
                      <div className="mt-8 px-6">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[9px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-full uppercase tracking-widest">Verificado</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{item.title}</h4>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed font-bold opacity-70 italic">"{item.description}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {currentUser && (
        <div className="fixed bottom-0 inset-x-0 h-24 glass flex items-center justify-around px-8 z-[100] border-t border-slate-100 rounded-t-[3.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
          <button onClick={() => setViewMode(ViewMode.GALLERY)} className={`p-4 rounded-2xl transition-all ${viewMode === ViewMode.GALLERY ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
            <Home size={26} strokeWidth={3} />
          </button>
          <button onClick={() => setViewMode(ViewMode.MY_CONTENT)} className={`p-4 rounded-2xl transition-all ${viewMode === ViewMode.MY_CONTENT ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
            <ShoppingBag size={26} strokeWidth={3} />
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={() => setViewMode(ViewMode.UPLOAD)} className={`p-4 rounded-2xl transition-all ${viewMode === ViewMode.UPLOAD ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
              <Settings size={26} strokeWidth={3} />
            </button>
          )}
          <button onClick={logout} className="p-4 text-slate-300">
            <UserIcon size={26} strokeWidth={3} />
          </button>
        </div>
      )}

      {showPaymentModal && selectedItem && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="w-full max-w-md bg-white rounded-t-[4rem] sm:rounded-[4rem] p-12 animate-in slide-in-from-bottom duration-500 shadow-2xl relative border-t-8 border-teal-400">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:bg-slate-50 rounded-full"><X size={24}/></button>
            
            <div className="mb-10 text-center pt-4">
               <div className="bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-[0.3em] py-2 px-6 rounded-full inline-block mb-4">Checkout VIP</div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{selectedItem.title}</h3>
            </div>
            
            <div className="bg-slate-50 p-10 rounded-[3rem] mb-10 flex justify-between items-center border-2 border-slate-100">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Miembro</p>
                 <p className="text-5xl font-black turquesa-text tracking-tighter">{selectedItem.price.toFixed(2)} €</p>
               </div>
               <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-3 border border-slate-100">
                 <Package className="text-teal-400" size={40} />
               </div>
            </div>

            <PayPalButton amount={selectedItem.price} onSuccess={() => handlePurchaseSuccess(selectedItem.id)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
