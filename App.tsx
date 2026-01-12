
import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, ViewMode, User } from './types';
import PayPalButton from './components/PayPalButton';
import { 
  Lock, Upload, X, ShoppingBag, 
  ShieldCheck, Trash2, Settings, 
  ShieldAlert, Package, 
  Home, User as UserIcon, Plus,
  Edit3, Save, Camera
} from 'lucide-react';

const ADMIN_CREDENTIALS = {
  EMAIL: '183327A3@',
  PASS: 'redsecamising'
};

const DEFAULT_PROFILE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";

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
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE);
  
  // Estados para nueva carga
  const [tempFile, setTempFile] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [priceInput, setPriceInput] = useState('5.00');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Estado para edición rápida de precio
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');

  useEffect(() => {
    const handleVisibility = () => setIsSecured(document.visibilityState === 'hidden');
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    const saved = localStorage.getItem('romin_data');
    if (saved) setItems(JSON.parse(saved));

    const savedProfile = localStorage.getItem('romin_profile_img');
    if (savedProfile) setProfileImage(savedProfile);

    const session = localStorage.getItem('romin_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
      setViewMode(ViewMode.GALLERY);
    }

    setTimeout(() => setIsAppLoading(false), 1500);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const save = (newItems: MediaItem[]) => {
    setItems(newItems);
    localStorage.setItem('romin_data', JSON.stringify(newItems));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setProfileImage(url);
      localStorage.setItem('romin_profile_img', url);
    };
    reader.readAsDataURL(file);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const email = form.email.value.trim();
    const pass = form.pass.value;

    if (email === ADMIN_CREDENTIALS.EMAIL && pass === ADMIN_CREDENTIALS.PASS) {
      const admin: User = { id: 'admin', email, name: 'Admin', role: 'admin', purchasedIds: [] };
      setCurrentUser(admin);
      localStorage.setItem('romin_session', JSON.stringify(admin));
      setViewMode(ViewMode.GALLERY);
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('romin_users') || '[]');
    if (isLoginMode) {
      const found = users.find(u => u.email === email);
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('romin_session', JSON.stringify(found));
        setViewMode(ViewMode.GALLERY);
      } else {
        setAuthError('Credenciales incorrectas');
      }
    } else {
      if (users.find(u => u.email === email)) {
        setAuthError('Email ya registrado');
      } else {
        const newUser: User = { id: 'u-'+Date.now(), email, name: email.split('@')[0], role: 'user', purchasedIds: [] };
        localStorage.setItem('romin_users', JSON.stringify([...users, newUser]));
        setCurrentUser(newUser);
        localStorage.setItem('romin_session', JSON.stringify(newUser));
        setViewMode(ViewMode.GALLERY);
      }
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTempFile(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!tempFile || !titleInput) return;
    setIsUploading(true);
    const newItem: MediaItem = {
      id: 'm-'+Date.now(),
      type: 'image',
      url: tempFile,
      title: titleInput,
      description: descInput || 'Contenido Premium',
      price: parseFloat(priceInput) || 5.00
    };
    save([newItem, ...items]);
    setTempFile(null);
    setTitleInput('');
    setDescInput('');
    setPriceInput('5.00');
    setIsUploading(false);
    setViewMode(ViewMode.GALLERY);
  };

  const updateItemPrice = (id: string) => {
    const priceNum = parseFloat(newPriceValue);
    if (isNaN(priceNum)) return;
    const updatedItems = items.map(item => item.id === id ? { ...item, price: priceNum } : item);
    save(updatedItems);
    setEditingPriceId(null);
  };

  const isUnlocked = (id: string) => currentUser?.purchasedIds.includes(id) || currentUser?.role === 'admin';

  if (isAppLoading) return (
    <div className="fixed inset-0 premium-gradient flex flex-col items-center justify-center text-white z-[999]">
      <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center mb-6 animate-pulse shadow-2xl">
        <ShieldCheck size={40} />
      </div>
      <h1 className="text-3xl font-black italic tracking-tighter">rominvpinto</h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`security-blackout ${isSecured ? 'active' : ''}`}>
        <ShieldAlert size={64} className="text-teal-400 mb-4" />
        <p className="font-black uppercase tracking-[0.3em] text-xs">Bóveda Protegida</p>
      </div>

      {viewMode === ViewMode.AUTH ? (
        <div className="max-w-md mx-auto min-h-screen p-10 flex flex-col justify-center">
          <div className="text-center mb-12">
            <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">rominvpinto</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Área Exclusiva</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authError && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase text-center">{authError}</div>}
            <input name="email" type="text" placeholder="Correo Electrónico" required className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-400 font-bold" />
            <input name="pass" type="password" placeholder="Contraseña" required className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-400 font-bold" />
            <button className="w-full premium-gradient text-white py-5 rounded-3xl font-black shadow-xl uppercase text-xs tracking-widest mt-4">
              {isLoginMode ? 'Acceder a la Bóveda' : 'Crear Cuenta VIP'}
            </button>
          </form>

          <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest block mx-auto underline decoration-teal-400 decoration-2 underline-offset-4">
            {isLoginMode ? '¿No tienes cuenta? Únete aquí' : 'Ya soy miembro'}
          </button>
        </div>
      ) : (
        <div className="pb-32">
          <header className="px-8 pt-12 pb-6 text-center">
            <div className="relative inline-block group">
              <img 
                src={profileImage} 
                className="w-32 h-32 rounded-[3rem] mx-auto border-8 border-white shadow-2xl mb-6 object-cover" 
              />
              {currentUser?.role === 'admin' && (
                <>
                  <button 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-4 right-0 p-3 bg-teal-500 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all border-4 border-white"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    ref={profileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleProfileChange}
                    accept="image/*"
                  />
                </>
              )}
            </div>
            <h2 className="text-3xl font-black tracking-tighter">@rominvpinto</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Contenido Privado Verificado</p>
          </header>

          <main className="px-6 max-w-lg mx-auto">
            {viewMode === ViewMode.UPLOAD ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black uppercase tracking-widest">Publicar Contenido</h3>
                </div>

                {!tempFile ? (
                  <div onClick={() => fileInputRef.current?.click()} className="bg-white border-4 border-dashed border-teal-100 rounded-[3rem] p-16 text-center cursor-pointer shadow-inner">
                    <Plus className="mx-auto text-teal-300 mb-4" size={40} />
                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Elegir Foto o Video</p>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelect} accept="image/*,video/*" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                      <img src={tempFile} className="w-full h-full object-cover" />
                      <button onClick={() => setTempFile(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Título</label>
                        <input 
                          value={titleInput} 
                          onChange={e => setTitleInput(e.target.value)}
                          placeholder="Título sugerente..."
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-teal-500/10 focus:ring-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Precio (€)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={priceInput} 
                          onChange={e => setPriceInput(e.target.value)}
                          placeholder="5.00"
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-teal-500/10 focus:ring-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Descripción</label>
                        <textarea 
                          value={descInput} 
                          onChange={e => setDescInput(e.target.value)}
                          placeholder="Descripción corta..."
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold min-h-[100px] outline-none ring-teal-500/10 focus:ring-2"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleUpload}
                      disabled={isUploading || !titleInput}
                      className="w-full premium-gradient text-white py-5 rounded-3xl font-black shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Upload size={20} /> {isUploading ? 'Guardando...' : 'Publicar en Bóveda'}
                    </button>
                  </div>
                )}
                
                <div className="pt-10 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4">Inventario Actual</h4>
                  {items.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <img src={item.url} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-[11px] truncate">{item.title}</p>
                          {editingPriceId === item.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input 
                                autoFocus
                                type="number"
                                className="w-16 bg-slate-50 border border-teal-200 rounded px-1 py-0.5 text-[10px] font-black"
                                value={newPriceValue}
                                onChange={(e) => setNewPriceValue(e.target.value)}
                              />
                              <button onClick={() => updateItemPrice(item.id)} className="text-teal-500"><Save size={14}/></button>
                              <button onClick={() => setEditingPriceId(null)} className="text-slate-300"><X size={14}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-teal-600 font-black text-[10px]">{item.price.toFixed(2)} €</p>
                              <button onClick={() => { setEditingPriceId(item.id); setNewPriceValue(item.price.toString()); }} className="text-slate-300 hover:text-teal-500">
                                <Edit3 size={12}/>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => save(items.filter(i => i.id !== item.id))} className="p-3 text-red-200 hover:text-red-500 shrink-0"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {items
                  .filter(item => viewMode === ViewMode.MY_CONTENT ? isUnlocked(item.id) : true)
                  .map(item => (
                    <div key={item.id} className="relative group animate-in zoom-in-95 duration-700">
                      <div className="aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-2xl relative bg-slate-200">
                        <img 
                          src={item.url} 
                          className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked(item.id) ? 'blur-[80px] grayscale scale-125 opacity-30' : 'hover:scale-105'}`} 
                        />
                        
                        {!isUnlocked(item.id) ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
                              <Lock className="text-white" size={30} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-widest">{item.title}</h4>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 opacity-60 italic">Contenido Bloqueado</p>
                            <button 
                              onClick={() => { setSelectedItem(item); setShowPaymentModal(true); }} 
                              className="w-full py-5 premium-gradient text-white font-black rounded-[2rem] shadow-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                            >
                              Adquirir por {item.price.toFixed(2)} €
                            </button>
                          </div>
                        ) : (
                          <div className="absolute top-8 right-8 bg-teal-500/90 p-4 rounded-3xl text-white shadow-2xl border border-white/20">
                            <ShieldCheck size={24} />
                          </div>
                        )}
                      </div>
                      {isUnlocked(item.id) && (
                        <div className="mt-8 px-6">
                          <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{item.title}</h4>
                          <p className="text-sm text-slate-500 mt-3 leading-relaxed font-bold opacity-60 italic">"{item.description}"</p>
                        </div>
                      )}
                    </div>
                ))}
                
                {items.length === 0 && (
                  <div className="text-center py-24 opacity-20">
                    <Package size={64} className="mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Sin contenido disponible</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {currentUser && (
        <nav className="fixed bottom-0 inset-x-0 h-24 glass flex items-center justify-around px-8 z-[100] rounded-t-[3.5rem] shadow-2xl">
          <button onClick={() => setViewMode(ViewMode.GALLERY)} className={`p-4 rounded-2xl ${viewMode === ViewMode.GALLERY ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
            <Home size={28} strokeWidth={3} />
          </button>
          <button onClick={() => setViewMode(ViewMode.MY_CONTENT)} className={`p-4 rounded-2xl ${viewMode === ViewMode.MY_CONTENT ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
            <ShoppingBag size={28} strokeWidth={3} />
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={() => setViewMode(ViewMode.UPLOAD)} className={`p-4 rounded-2xl ${viewMode === ViewMode.UPLOAD ? 'text-teal-600 bg-teal-50 scale-110' : 'text-slate-300'}`}>
              <Settings size={28} strokeWidth={3} />
            </button>
          )}
          <button onClick={() => { localStorage.removeItem('romin_session'); window.location.reload(); }} className="p-4 text-slate-300">
            <UserIcon size={28} strokeWidth={3} />
          </button>
        </nav>
      )}

      {showPaymentModal && selectedItem && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-white rounded-[4rem] p-12 animate-in slide-in-from-bottom duration-500 relative border-t-8 border-teal-400">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:bg-slate-50 rounded-full"><X size={24}/></button>
            <div className="mb-10 text-center">
               <span className="bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-[0.3em] py-2 px-6 rounded-full mb-4 inline-block">Checkout VIP</span>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{selectedItem.title}</h3>
            </div>
            <div className="bg-slate-50 p-10 rounded-[3rem] mb-10 flex justify-between items-center border-2 border-slate-100">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a enviar</p>
                 <p className="text-5xl font-black turquesa-text tracking-tighter">{selectedItem.price.toFixed(2)} €</p>
               </div>
               <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-3">
                 <Package className="text-teal-400" size={40} />
               </div>
            </div>
            <PayPalButton 
              amount={selectedItem.price} 
              onSuccess={() => {
                const updated = { ...currentUser!, purchasedIds: [...new Set([...currentUser!.purchasedIds, selectedItem.id])] };
                setCurrentUser(updated);
                localStorage.setItem('romin_session', JSON.stringify(updated));
                if (currentUser?.role !== 'admin') {
                  const users: User[] = JSON.parse(localStorage.getItem('romin_users') || '[]');
                  localStorage.setItem('romin_users', JSON.stringify(users.map(u => u.id === currentUser?.id ? updated : u)));
                }
                setShowPaymentModal(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
