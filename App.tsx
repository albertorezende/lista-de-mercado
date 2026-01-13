
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  History, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle,
  X,
  Edit2,
  Package,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Eye,
  RefreshCw,
  Info,
  Home,
  User,
  Moon,
  LogOut,
  Import,
  Sun,
  Lock,
  UserPlus
} from 'lucide-react';
import { ShoppingItem, HistoryEntry, UnitOfMeasure, SECTORS, UNITS, UserProfile } from './types';

// Mock DB Key
const DB_USERS_KEY = 'superlist_db_users';

type Tab = 'inicio' | 'lista' | 'historico' | 'config';
type AuthMode = 'login' | 'register';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ name: '', username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // App State
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>('inicio');
  const [darkMode, setDarkMode] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());
  const [viewingHistoryEntry, setViewingHistoryEntry] = useState<HistoryEntry | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence per User
  useEffect(() => {
    if (currentUser) {
      const userDataKey = `superlist_data_${currentUser.username}`;
      const savedData = localStorage.getItem(userDataKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setItems(parsed.items || []);
        setHistory((parsed.history || []).map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
      } else {
        setItems([]);
        setHistory([]);
      }
      const savedDarkMode = localStorage.getItem('dark_mode');
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userDataKey = `superlist_data_${currentUser.username}`;
      localStorage.setItem(userDataKey, JSON.stringify({ items, history }));
      localStorage.setItem('dark_mode', JSON.stringify(darkMode));
    }
  }, [items, history, darkMode, currentUser]);

  useEffect(() => {
    if (priceWarning) {
      const timer = setTimeout(() => setPriceWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [priceWarning]);

  // Auth Functions
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');

    if (authMode === 'register') {
      if (!authForm.name || !authForm.username || !authForm.password) {
        setAuthError('Preencha todos os campos.');
        return;
      }
      if (authForm.password.length > 6) {
        setAuthError('Senha deve ter no máximo 6 dígitos.');
        return;
      }
      if (users.find(u => u.username === authForm.username)) {
        setAuthError('Usuário já existe.');
        return;
      }
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: authForm.name,
        username: authForm.username,
        passwordHash: authForm.password // In a real app, use bcrypt
      };
      localStorage.setItem(DB_USERS_KEY, JSON.stringify([...users, newUser]));
      setCurrentUser(newUser);
    } else {
      const user = users.find(u => u.username === authForm.username && u.passwordHash === authForm.password);
      if (user) {
        setCurrentUser(user);
      } else {
        setAuthError('Usuário ou senha inválidos.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('inicio');
    setAuthForm({ name: '', username: '', password: '' });
  };

  const updateProfileName = (newName: string) => {
    if (!currentUser) return;
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, name: newName } : u);
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(updatedUsers));
    setCurrentUser({ ...currentUser, name: newName });
    setShowEditNameModal(false);
  };

  const updatePassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return;
    if (currentUser.passwordHash !== oldPass) {
      alert('Senha atual incorreta.');
      return;
    }
    if (newPass.length > 6) {
      alert('Nova senha deve ter no máximo 6 dígitos.');
      return;
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, passwordHash: newPass } : u);
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(updatedUsers));
    setCurrentUser({ ...currentUser, passwordHash: newPass });
    setShowChangePassModal(false);
    alert('Senha alterada com sucesso!');
  };

  // CSV Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newItems: ShoppingItem[] = [];
      // Assume CSV: quantidade,item
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const qty = Number(parts[0].trim()) || 1;
          const name = parts[1].trim();
          if (name) {
            newItems.push({
              id: crypto.randomUUID(),
              name,
              quantity: qty,
              unit: 'uni',
              price: 0,
              sector: 'Outros',
              checked: false
            });
          }
        }
      });
      setItems(prev => [...prev, ...newItems]);
      setCurrentTab('lista');
    };
    reader.readAsText(file);
  };

  // Business Logic
  const itemsBySector = useMemo(() => {
    const grouped: Record<string, ShoppingItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.sector]) grouped[item.sector] = [];
      grouped[item.sector].push(item);
    });
    return grouped;
  }, [items]);

  const totalInCart = useMemo(() => {
    return items
      .filter(i => i.checked)
      .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [items]);

  const toggleCheck = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!item.checked && item.price <= 0) {
      setPriceWarning(`Insira o valor de "${item.name}" para colocar no carrinho.`);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const updateItemPrice = (id: string, price: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, price } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const saveItem = (itemData: Omit<ShoppingItem, 'id' | 'checked'>) => {
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...itemData } : item));
      setEditingItem(null);
    } else {
      const newItem: ShoppingItem = { ...itemData, id: crypto.randomUUID(), checked: false };
      setItems(prev => [...prev, newItem]);
    }
    setShowAddModal(false);
  };

  const toggleSector = (sector: string) => {
    setCollapsedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const finalizeList = () => {
    const newHistory: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      items: [...items],
      totalChecked: totalInCart
    };
    setHistory(prev => [newHistory, ...prev]);
    setItems([]);
    setShowConfirmModal(false);
    setCurrentTab('historico');
  };

  const reuseHistory = (historyEntry: HistoryEntry) => {
    const reusedItems = historyEntry.items.map(item => ({ ...item, id: crypto.randomUUID(), checked: false, price: item.price }));
    setItems(reusedItems);
    setViewingHistoryEntry(null);
    setCurrentTab('lista');
  };

  if (!currentUser) {
    return (
      <div className={`max-w-md mx-auto min-h-screen flex flex-col justify-center items-center px-6 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#faf9f6] text-slate-900'}`}>
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-xl shadow-red-900/20 mb-8 rotate-3">
          <ShoppingCart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">SuperList</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">O seu mercado inteligente</p>
        
        <form onSubmit={handleAuth} className={`w-full p-8 border rounded-[3rem] shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-4">{authMode === 'login' ? 'Acessar Conta' : 'Criar Conta'}</h2>
          
          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Nome Completo</label>
              <input 
                type="text"
                className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`}
                placeholder="Como quer ser chamado?"
                value={authForm.name}
                onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Usuário</label>
            <input 
              type="text"
              className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`}
              placeholder="usuário"
              value={authForm.username}
              onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-400">Senha (Máx 6 dígitos)</label>
            <input 
              type="password"
              maxLength={6}
              className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`}
              placeholder="******"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>

          {authError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{authError}</p>}

          <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-red-900/10 uppercase tracking-widest text-sm active:scale-95 transition-all mt-4">
            {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <button 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="mt-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
        >
          {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-44 relative flex flex-col transition-colors duration-300 overflow-x-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#faf9f6] text-slate-900'}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 ${darkMode ? 'opacity-[0.03]' : 'opacity-[0.08]'}`} style={{backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800')`, backgroundPosition: 'center', backgroundSize: 'cover'}} />

      <header className={`sticky top-0 z-20 shadow-sm backdrop-blur-xl border-b rounded-b-[2rem] transition-colors duration-300 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100/50'}`}>
        <div className="px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className={`text-[20px] font-black flex items-center gap-2 tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <ShoppingCart className={`w-5 h-5 ${darkMode ? 'text-red-500' : 'text-[#991b1b]'}`} />
              <span>SUPER<span className={darkMode ? 'text-red-500' : 'text-[#991b1b]'}>LISTA</span></span>
            </h1>
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ml-1 opacity-60 ${darkMode ? 'text-red-400' : 'text-[#991b1b]'}`}>{currentUser.name}</p>
          </div>
          {currentTab === 'lista' && items.length > 0 && (
            <button onClick={() => setShowAddModal(true)} className={`p-2 rounded-full active:scale-95 transition-all shadow-lg ${darkMode ? 'bg-red-600 text-white' : 'bg-[#991b1b] text-white'}`}><Plus className="w-4 h-4" /></button>
          )}
        </div>
      </header>

      {priceWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-xs bg-[#ef4444] text-white p-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-300">
          <Info className="w-4 h-4 shrink-0" /><p className="text-[11px] font-bold">{priceWarning}</p>
        </div>
      )}

      <main className="flex-1 px-4 pt-6 relative z-10 pb-10">
        {currentTab === 'inicio' && (
          <div className="space-y-6 flex flex-col items-center pt-10">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-md border-2 mb-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <Home className={`w-12 h-12 opacity-40 ${darkMode ? 'text-slate-400' : 'text-[#991b1b]'}`} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-center">Boas vindas, {currentUser.name.split(' ')[0]}!</h2>
            
            <div className="grid grid-cols-1 gap-4 w-full px-4">
              <button onClick={() => { const items = SAMPLE_LIST.map(item => ({ ...item, id: crypto.randomUUID(), checked: false })); setItems(prev => [...prev, ...items]); setCurrentTab('lista'); }} className={`w-full p-6 border rounded-[2rem] flex items-center gap-4 shadow-sm active:scale-95 transition-all group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className={`p-3 rounded-2xl transition-colors ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}>
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-black text-[14px] uppercase tracking-wider">Lista Sugerida</p>
                  <p className="text-[11px] text-slate-400 font-medium">Itens essenciais para o dia a dia</p>
                </div>
              </button>

              <button onClick={() => fileInputRef.current?.click()} className={`w-full p-6 border rounded-[2rem] flex items-center gap-4 shadow-sm active:scale-95 transition-all group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className={`p-3 rounded-2xl transition-colors ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50 group-hover:bg-amber-100'}`}>
                  <Import className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-black text-[14px] uppercase tracking-wider">Importar Lista (CSV)</p>
                  <p className="text-[11px] text-slate-400 font-medium">quantidade,item</p>
                </div>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVImport} className="hidden" />
              </button>

              <button onClick={() => { setCurrentTab('lista'); setShowAddModal(true); }} className={`w-full p-6 border rounded-[2rem] flex items-center gap-4 shadow-xl active:scale-95 transition-all group ${darkMode ? 'bg-red-600 border-red-700 shadow-red-900/40' : 'bg-[#991b1b] border-red-900/10 shadow-red-900/10'}`}>
                <div className="p-3 bg-white/20 rounded-2xl"><Plus className="w-6 h-6 text-white" /></div>
                <div className="text-left">
                  <p className="font-black text-white text-[14px] uppercase tracking-wider">Criar Nova Lista</p>
                  <p className="text-[11px] text-white/70 font-medium">Começar uma lista do zero</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentTab === 'lista' && (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Package className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-lg font-bold">Sua lista está vazia</p>
                <button onClick={() => setShowAddModal(true)} className={`mt-6 px-8 py-3 text-white font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg ${darkMode ? 'bg-red-600' : 'bg-[#991b1b]'}`}>Adicionar Item</button>
              </div>
            ) : (
              Object.entries(itemsBySector).sort().map(([sector, sectorItems]) => {
                const allChecked = sectorItems.every(i => i.checked);
                const isCollapsed = collapsedSectors.has(sector);
                return (
                  <div key={sector} className="mb-4">
                    <button onClick={() => toggleSector(sector)} className={`w-full flex items-center justify-between p-3 rounded-xl mb-1.5 transition-all ${allChecked ? (darkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700') : (darkMode ? 'bg-slate-900/50 text-slate-200 border border-slate-800' : 'bg-[#fff5f6] text-[#1e293b] border border-[#ffccd2]/30')}`}>
                      <div className="flex items-center gap-2">{isCollapsed ? <ChevronRight className={`w-3.5 h-3.5 ${darkMode ? 'text-red-500' : 'text-[#991b1b]'}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${darkMode ? 'text-red-500' : 'text-[#991b1b]'}`} />}<span className="text-[10px] font-black uppercase tracking-wider">{sector}</span></div>
                      <div className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${allChecked ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-200/50 text-emerald-700') : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-[#fecaca] text-[#991b1b]')}`}>{sectorItems.filter(i => i.checked).length}/{sectorItems.length}</div>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-1">
                        {sectorItems.map(item => (<ItemRow key={item.id} item={item} darkMode={darkMode} onToggle={() => toggleCheck(item.id)} onDelete={() => deleteItem(item.id)} onUpdatePrice={(p) => updateItemPrice(item.id, p)} onEdit={() => { setEditingItem(item); setShowAddModal(true); }} />))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {currentTab === 'historico' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tighter px-2 flex items-center gap-2"><History className={`w-5 h-5 ${darkMode ? 'text-red-500' : 'text-[#991b1b]'}`} /> Histórico do Cliente</h2>
            {history.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center"><History className="w-12 h-12 text-slate-200 mb-4 opacity-20" /><p className="text-slate-400 font-black uppercase tracking-widest text-xs">Histórico vazio.</p></div>
            ) : (
              history.map(entry => (
                <div key={entry.id} className={`border rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className={`absolute top-0 left-0 w-2 h-full opacity-20 group-hover:opacity-100 transition-opacity ${darkMode ? 'bg-red-500' : 'bg-[#991b1b]'}`} />
                  <div className="flex justify-between items-center mb-6">
                    <div><p className="font-black text-xl tracking-tight leading-none mb-1">{entry.timestamp.toLocaleDateString('pt-BR')} {entry.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{entry.items.length} ITENS</p></div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-red-400' : 'text-[#991b1b]'}`}>R$ {entry.totalChecked.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setViewingHistoryEntry(entry)} className={`flex-1 font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 border text-[11px] uppercase tracking-widest transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}><Eye className="w-4 h-4" /> Detalhes</button>
                    <button onClick={() => deleteHistory(entry.id)} className={`p-4 rounded-2xl active:scale-95 transition-colors ${darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {currentTab === 'config' && (
          <div className="space-y-8 pt-4">
            <div className="flex items-center gap-4 px-2">
              <div className={`w-16 h-16 border-2 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-red-500' : 'bg-white border-slate-100 text-[#991b1b]'}`}><User className="w-8 h-8" /></div>
              <div><p className="font-black text-xl leading-none">{currentUser.name}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">@{currentUser.username}</p></div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Opções do Cliente</p>
              <div className={`border rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <button onClick={() => setShowEditNameModal(true)} className={`w-full p-6 flex items-center justify-between transition-colors border-b ${darkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}><div className="flex items-center gap-4"><User className="w-5 h-5 text-slate-400" /><span className="font-bold text-sm">Editar Nome</span></div><ChevronRight className="w-4 h-4 text-slate-300" /></button>
                <button onClick={() => setShowChangePassModal(true)} className={`w-full p-6 flex items-center justify-between transition-colors border-b ${darkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}><div className="flex items-center gap-4"><Lock className="w-5 h-5 text-slate-400" /><span className="font-bold text-sm">Alterar Senha</span></div><ChevronRight className="w-4 h-4 text-slate-300" /></button>
                <div className={`w-full p-6 flex items-center justify-between border-b transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}><div className="flex items-center gap-4">{darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-500" />}<span className="font-bold text-sm">Modo Escuro</span></div><button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${darkMode ? 'bg-red-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} /></button></div>
                <button onClick={handleLogout} className={`w-full p-6 flex items-center gap-4 text-rose-500 transition-colors ${darkMode ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'}`}><LogOut className="w-5 h-5" /><span className="font-black uppercase tracking-widest text-[11px]">Sair da Conta</span></button>
              </div>
            </div>
          </div>
        )}
      </main>

      {currentTab === 'lista' && items.length > 0 && (
        <div className={`fixed bottom-[88px] left-0 right-0 max-w-md mx-auto border-t px-6 py-6 flex items-center justify-between z-20 rounded-t-[2.5rem] animate-in slide-in-from-bottom-5 duration-300 shadow-2xl transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">TOTAL NO CARRINHO</p><div className="flex items-baseline gap-1"><span className="text-[26px] font-black tracking-tighter leading-none">R$ {totalInCart.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div></div>
          <button onClick={handleFinish} className={`font-black text-[12px] uppercase tracking-widest px-8 py-4.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-xl ${darkMode ? 'bg-slate-100 text-slate-950' : 'bg-black text-white'}`}>FINALIZAR &gt;</button>
        </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t px-6 pt-3 pb-6 flex justify-between items-center z-30 shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <NavButton active={currentTab === 'inicio'} onClick={() => setCurrentTab('inicio')} darkMode={darkMode} icon={<Home className="w-6 h-6" />} label="Inicio" />
        <NavButton active={currentTab === 'lista'} onClick={() => setCurrentTab('lista')} darkMode={darkMode} icon={<ShoppingCart className="w-6 h-6" />} label="Listas" />
        <NavButton active={currentTab === 'historico'} onClick={() => setCurrentTab('historico')} darkMode={darkMode} icon={<History className="w-6 h-6" />} label="Histórico" />
        <NavButton active={currentTab === 'config'} onClick={() => setCurrentTab('config')} darkMode={darkMode} icon={<User className="w-6 h-6" />} label="Perfil" />
      </nav>

      {showAddModal && <AddItemModal darkMode={darkMode} onClose={() => { setShowAddModal(false); setEditingItem(null); }} onSave={saveItem} initialData={editingItem || undefined} />}
      {viewingHistoryEntry && <HistoryDetailsModal darkMode={darkMode} entry={viewingHistoryEntry} onClose={() => setViewingHistoryEntry(null)} onReuse={reuseHistory} />}
      
      {showEditNameModal && <EditValueModal title="Editar Nome" placeholder="Seu novo nome" initialValue={currentUser.name} onSave={updateProfileName} onClose={() => setShowEditNameModal(false)} darkMode={darkMode} />}
      {showChangePassModal && <ChangePasswordModal onSave={updatePassword} onClose={() => setShowChangePassModal(false)} darkMode={darkMode} />}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className={`rounded-[3rem] w-full max-w-sm p-10 shadow-2xl border-t-[10px] transition-colors ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-[#991b1b]'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${darkMode ? 'bg-red-900/30 text-red-500' : 'bg-rose-50 text-[#991b1b]'}`}><AlertTriangle className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-center mb-3 uppercase tracking-tighter">Falta Algo!</h3>
            <p className="text-slate-500 text-center mb-10 text-base leading-snug">Alguns itens ainda estão na prateleira. Confirmar finalização?</p>
            <div className="flex flex-col gap-4">
              <button onClick={finalizeList} className={`w-full text-white font-black py-5 rounded-[1.5rem] active:scale-95 transition-all shadow-lg uppercase tracking-widest text-xs ${darkMode ? 'bg-red-600' : 'bg-[#991b1b]'}`}>Sim, Finalizar</button>
              <button onClick={() => setShowConfirmModal(false)} className={`w-full font-black py-5 rounded-[1.5rem] active:scale-95 transition-all uppercase tracking-widest text-xs ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>Continuar Compras</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; darkMode: boolean }> = ({ active, onClick, icon, label, darkMode }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${active ? (darkMode ? 'text-red-500' : 'text-[#991b1b]') : (darkMode ? 'text-slate-600' : 'text-slate-300')}`}>
    <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const ItemRow: React.FC<{ item: ShoppingItem; darkMode: boolean; onToggle: () => void; onDelete: () => void; onEdit: () => void; onUpdatePrice: (p: number) => void; }> = ({ item, darkMode, onToggle, onDelete, onEdit, onUpdatePrice }) => (
  <div className={`flex items-start gap-3 p-3.5 rounded-[1.5rem] border transition-all duration-300 ${item.checked ? (darkMode ? 'bg-slate-900/40 opacity-40 border-transparent shadow-none' : 'bg-white opacity-40 border-transparent shadow-none') : (darkMode ? 'bg-slate-900 border-slate-800 shadow-lg' : 'bg-white border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md')}`}>
    <button onClick={onToggle} className={`flex-shrink-0 transition-all active:scale-75 mt-0.5 ${item.checked ? 'text-emerald-500' : (darkMode ? 'text-slate-700' : 'text-slate-200')}`}>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.checked ? (darkMode ? 'bg-emerald-900/40 border-emerald-500' : 'bg-emerald-50 border-emerald-500') : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-slate-200')}`}>{item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
    </button>
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <p className={`font-bold text-[15px] leading-tight whitespace-nowrap truncate ${item.checked ? 'line-through text-slate-400' : (darkMode ? 'text-slate-100' : 'text-slate-800')}`}>{item.name}</p>
      <div className="flex items-center gap-3">
        <p className="text-[12px] text-slate-400 font-medium whitespace-nowrap">{item.quantity}{item.unit}</p>
        <div className={`px-2 py-1 rounded-lg flex items-center gap-1 min-w-[75px] justify-center border transition-colors ${item.checked ? 'opacity-30' : ''} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#f1f5f9]/80 border-slate-100/30'}`}>
          <span className="text-[9px] font-black text-slate-400">R$</span>
          {(item.price === 0 && !item.checked) ? (<input type="number" className={`bg-transparent text-[12px] font-black outline-none w-10 text-center placeholder-slate-500 ${darkMode ? 'text-slate-100' : 'text-slate-600'}`} placeholder="0,00" onBlur={(e) => onUpdatePrice(Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />) : (<span className={`text-[12px] font-black ${darkMode ? 'text-slate-100' : 'text-slate-600'}`}>{item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>)}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-0.5 ml-auto self-center">
      <button onClick={onEdit} className={`p-1.5 active:scale-90 transition-transform ${darkMode ? 'text-red-400' : 'text-[#991b1b]'}`}><Edit2 className="w-4 h-4" /></button>
      <button onClick={onDelete} className={`p-1.5 active:scale-90 transition-transform ${darkMode ? 'text-red-400' : 'text-[#991b1b]'}`}><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);

const AddItemModal: React.FC<{ darkMode: boolean; onClose: () => void; onSave: (data: Omit<ShoppingItem, 'id' | 'checked'>) => void; initialData?: ShoppingItem; }> = ({ darkMode, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Omit<ShoppingItem, 'id' | 'checked'>>({ name: initialData?.name || '', quantity: initialData?.quantity || 1, unit: initialData?.unit || 'uni', price: initialData?.price || 0, sector: initialData?.sector || SECTORS[0] });
  const inputStyles = `w-full rounded-2xl px-6 py-5 font-bold outline-none border-2 transition-all shadow-inner ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600 text-slate-700'}`;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center">
      <div className={`w-full max-w-md rounded-t-[4rem] sm:rounded-[4rem] p-10 shadow-2xl border-t-[12px] transition-colors ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-red-600'}`}>
        <div className="flex justify-between items-center mb-8"><h2 className={`text-2xl font-black uppercase tracking-tighter ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{initialData ? 'Ajustar' : 'Novo Item'}</h2><button onClick={onClose} className={`p-2 rounded-full shadow-inner ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><X className="w-5 h-5" /></button></div>
        <div className="space-y-6"><input autoFocus className={inputStyles} placeholder="Ex: Abacaxi Doce" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /><div className="grid grid-cols-2 gap-4"><input type="number" className={inputStyles} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} /><select className={`${inputStyles} appearance-none`} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as UnitOfMeasure })}>{UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div><select className={`${inputStyles} appearance-none`} value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select><button disabled={!formData.name} onClick={() => onSave(formData)} className={`w-full text-white font-black py-6 rounded-[2.5rem] active:scale-95 transition-all mt-6 shadow-xl uppercase tracking-widest text-sm ${darkMode ? 'bg-red-600' : 'bg-red-600'}`}>Confirmar</button></div>
      </div>
    </div>
  );
};

const EditValueModal: React.FC<{ title: string; placeholder: string; initialValue: string; onSave: (v: string) => void; onClose: () => void; darkMode: boolean; }> = ({ title, placeholder, initialValue, onSave, onClose, darkMode }) => {
  const [val, setVal] = useState(initialValue);
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
      <div className={`w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border-t-[10px] ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-red-600'}`}>
        <h3 className="text-xl font-black uppercase tracking-tighter mb-6">{title}</h3>
        <input type="text" className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all mb-6 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} />
        <div className="flex flex-col gap-3"><button onClick={() => onSave(val)} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Salvar</button><button onClick={onClose} className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Cancelar</button></div>
      </div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{ onSave: (old: string, next: string) => void; onClose: () => void; darkMode: boolean; }> = ({ onSave, onClose, darkMode }) => {
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
      <div className={`w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border-t-[10px] ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-red-600'}`}>
        <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Mudar Senha</h3>
        <input type="password" maxLength={6} className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all mb-4 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`} placeholder="Senha Atual" value={oldP} onChange={e => setOldP(e.target.value)} />
        <input type="password" maxLength={6} className={`w-full px-6 py-4 rounded-2xl font-bold outline-none border-2 transition-all mb-6 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-red-500' : 'bg-slate-50 border-transparent focus:border-red-600'}`} placeholder="Nova Senha (Max 6)" value={newP} onChange={e => setNewP(e.target.value)} />
        <div className="flex flex-col gap-3"><button onClick={() => onSave(oldP, newP)} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Alterar</button><button onClick={onClose} className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Cancelar</button></div>
      </div>
    </div>
  );
};

const HistoryDetailsModal: React.FC<{ darkMode: boolean; entry: HistoryEntry; onClose: () => void; onReuse: (entry: HistoryEntry) => void; }> = ({ darkMode, entry, onClose, onReuse }) => {
  const boughtItems = entry.items.filter(i => i.checked);
  const missingItems = entry.items.filter(i => !i.checked);
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-3xl flex flex-col items-center">
      <div className={`w-full max-w-md h-full flex flex-col border-x transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
        <header className={`p-8 border-b-8 flex justify-between items-center sticky top-0 z-10 rounded-b-[3rem] shadow-sm transition-colors ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-red-600'}`}>
          <div><h2 className={`text-2xl font-black uppercase tracking-tighter ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Resumo</h2><p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">{entry.timestamp.toLocaleString('pt-BR')}</p></div>
          <button onClick={onClose} className={`p-3 rounded-full shadow-inner ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}><X className="w-6 h-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-20">
          {boughtItems.length > 0 && (
            <div>
              <h3 className="text-[12px] font-black text-emerald-500 uppercase tracking-widest mb-5 px-1 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> No Carrinho ({boughtItems.length})</h3>
              <div className="space-y-4">
                {boughtItems.map(item => (
                  <div key={item.id} className={`p-5 rounded-[2rem] flex justify-between items-center shadow-sm border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-emerald-50/20 border-emerald-100/50'}`}>
                    <div className="min-w-0 flex-1"><p className={`text-base font-bold leading-tight mb-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.name}</p><p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">{item.sector}</p></div>
                    <div className="text-right ml-4"><p className={`text-lg font-black leading-none mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>R$ {(item.price * item.quantity).toFixed(2)}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.quantity} {item.unit}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {missingItems.length > 0 && (
            <div>
              <h3 className="text-[12px] font-black text-rose-400 uppercase tracking-widest mb-5 px-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Não Localizados ({missingItems.length})</h3>
              <div className="space-y-4 opacity-60">
                {missingItems.map(item => (
                  <div key={item.id} className={`p-5 rounded-[2rem] flex justify-between items-center border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-rose-50/20 border-rose-100/50'}`}>
                    <div className="min-w-0 flex-1"><p className="text-base font-bold text-slate-400 leading-tight mb-1 truncate">{item.name}</p><p className="text-[9px] text-rose-300 uppercase font-black tracking-widest">{item.sector}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <footer className={`p-10 border-t-8 space-y-6 shadow-2xl rounded-t-[4rem] transition-colors ${darkMode ? 'bg-slate-900 border-red-600' : 'bg-white border-red-600'}`}>
          <div className="flex justify-between items-center px-1"><span className="text-slate-400 font-black text-[12px] uppercase tracking-[0.2em]">Investimento</span><span className={`text-4xl font-black tracking-tighter leading-none ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>R$ {entry.totalChecked.toFixed(2)}</span></div>
          <button onClick={() => onReuse(entry)} className={`w-full text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl text-[11px] uppercase tracking-[0.3em] ${darkMode ? 'bg-red-600' : 'bg-red-600'}`}><RefreshCw className="w-5 h-5" /> Refazer Lista</button>
        </footer>
      </div>
    </div>
  );
};
