import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ShoppingBag, Heart, Search, Menu, X, ChevronRight, Star, Plus, Minus, Trash2, 
  ArrowLeft, Settings, Edit, CheckCircle, Package, Flame, Filter, MapPin, Phone, User,
  Truck, ShieldCheck, Gift, Lock, LogOut, Instagram, Facebook, Twitter, Upload, 
  Image as ImageIcon, Wine, Percent, Crown, Zap, Mail, Send, MessageCircle, FileText,
  Grid, AlertTriangle, Clock
} from 'lucide-react';

// --- CONFIGURATION ---

// Относительный путь работает везде: и на localhost:8080, и на aura1.up.railway.app
const API_URL = '/api';

// --- TYPES ---

type CategoryId = 'balloons' | 'candles' | 'sets';

interface CategoryItem {
  id: CategoryId;
  n: string;
  i: string;
}

interface Product {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  description: string;
  image: string;
  rating: number;
  isNew?: boolean;
  isSale?: boolean;
  isSeasonal?: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

type ViewState = 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'admin' | 'success' | 'favorites' | 'privacy';
type ImageInputMode = 'url' | 'file';
type ContactMethod = 'telegram' | 'whatsapp' | 'phone';
type AdminTab = 'products' | 'categories';

// --- MOCK DATA FOR UI ---

const INITIAL_CATEGORIES: CategoryItem[] = [
  {id:'balloons', n:'Шары', i:'https://images.unsplash.com/photo-1514525253440-b393452e8d2e?auto=format&fit=crop&q=80&w=800'},
  {id:'candles', n:'Свечи', i:'https://images.unsplash.com/photo-1608181114410-db2bc2dc6481?auto=format&fit=crop&q=80&w=800'},
  {id:'sets', n:'Наборы', i:'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800'}
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Набор "Нежность"',
    category: 'balloons',
    price: 2500,
    description: 'Великолепный набор из 15 шаров пастельных оттенков. Идеально для дня рождения девочки или выписки из роддома.',
    image: 'https://images.unsplash.com/photo-1530103862676-de3c9da59af7?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    isNew: true
  },
  {
    id: '2',
    name: 'Свеча "Лаванда"',
    category: 'candles',
    price: 1200,
    description: 'Ароматическая свеча из соевого воска с натуральными маслами лаванды.',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800',
    rating: 4.9
  },
  {
    id: '3',
    name: 'Арка "Золото"',
    category: 'balloons',
    price: 5500,
    description: 'Фотозона из шаров хром-золото и белый песок.',
    image: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    isSeasonal: true
  },
  {
    id: '4',
    name: 'Свеча "Кофе"',
    category: 'candles',
    price: 1350,
    description: 'Бодрящий аромат свежемолотого кофе с нотками шоколада.',
    image: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&q=80&w=800',
    rating: 4.7,
    isNew: true
  },
  {
    id: '5',
    name: 'Сет "Лагуна"',
    category: 'balloons',
    price: 3200,
    description: 'Композиция из фольгированных звезд и латексных шаров.',
    image: 'https://images.unsplash.com/photo-1574515560829-9e7769cb6c6d?auto=format&fit=crop&q=80&w=800',
    rating: 4.6,
    isSale: true
  },
  {
    id: '6',
    name: 'Бокс "Романтика"',
    category: 'sets',
    price: 4500,
    description: 'Идеальный подарок: 2 свечи и связка красных сердец.',
    image: 'https://images.unsplash.com/photo-1572558616196-8486f5c53b26?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    isSeasonal: true
  },
  {
    id: '7',
    name: 'Свеча "Мох"',
    category: 'candles',
    price: 1100,
    description: 'Глубокий, землистый аромат дубового мха и кедра.',
    image: 'https://images.unsplash.com/photo-1608181114410-db2bc2dc6481?auto=format&fit=crop&q=80&w=800',
    rating: 4.5
  },
  {
    id: '8',
    name: 'Шар "Конфетти"',
    category: 'balloons',
    price: 1800,
    description: 'Огромный прозрачный шар с разноцветным конфетти внутри.',
    image: 'https://images.unsplash.com/photo-1575276329624-b15392d46df3?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    isNew: true
  }
];

// --- API CLIENT ---

const api = {
  async authStep1(login: string, password: string) {
    const res = await fetch(`${API_URL}/auth/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка сервера');
    return true;
  },

  async authStep2(secret: string) {
    const res = await fetch(`${API_URL}/auth/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка сервера');
    return true;
  },

  async sendOrder(message: string) {
    const res = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Ошибка отправки');
    return true;
  }
};

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-violet-500 shadow-lg shadow-violet-200 hover:shadow-violet-300",
    secondary: "bg-secondary text-white hover:bg-pink-500 shadow-lg shadow-pink-200 hover:shadow-pink-300",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary bg-transparent",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`}>{children}</button>;
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-600 ml-1">{label}</label>}
    <input className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-400" {...props} />
  </div>
);

const ProductCard = ({ product, onOpen, onToggleFavorite, isFavorite, onAddToCart }: any) => (
  <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-violet-100 transition-all duration-500 relative border border-gray-50 flex flex-col h-full transform hover:-translate-y-1">
    <div className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-gray-100" onClick={() => onOpen(product)}>
      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
        {product.isNew && <span className="bg-white/90 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider text-primary shadow-sm">Новинка</span>}
        {product.isSale && <span className="bg-red-500/90 text-white backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Скидка</span>}
        {product.isSeasonal && <span className="bg-green-500/90 text-white backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Сезонное</span>}
      </div>

      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }} className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform z-10">
        <Heart size={20} fill={isFavorite ? "#f472b6" : "none"} className={isFavorite ? "text-secondary" : "text-gray-400"} />
      </button>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <div className="mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">{product.category === 'balloons' ? 'Воздушные шары' : product.category === 'candles' ? 'Свечи' : 'Наборы'}</p>
        <h3 className="font-bold text-lg text-gray-800 leading-snug group-hover:text-primary transition-colors cursor-pointer" onClick={() => onOpen(product)}>{product.name}</h3>
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-gray-900">{product.price} ₽</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-900 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"><Plus size={20} /></button>
      </div>
    </div>
  </div>
);

// --- HOOKS ---

const useIdleTimer = (onIdle: () => void, timeoutMs: number) => {
  useEffect(() => {
    let timer: number;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = window.setTimeout(onIdle, timeoutMs);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, [onIdle, timeoutMs]);
};

// --- MAIN APP ---

const App = () => {
  const [view, setView] = useState<ViewState>('home');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  // Checkout Form State
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', comment: '', contactMethod: 'whatsapp' as ContactMethod });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminStep, setAdminStep] = useState(0); // 0: Login/Pass, 1: Secret Question
  const [adminTab, setAdminTab] = useState<AdminTab>('products');
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [imageInputMode, setImageInputMode] = useState<ImageInputMode>('file');

  // Security State
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // --- LOGIC ---

  useEffect(() => {
    const storedLockout = localStorage.getItem('aura_admin_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (Date.now() < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('aura_admin_lockout');
      }
    }
  }, []);

  useIdleTimer(() => {
    if (isAdminAuthenticated) {
      setIsAdminAuthenticated(false);
      setAdminStep(0);
      setAuthError('Сессия завершена из-за неактивности');
      setView('admin');
    }
  }, 15 * 60 * 1000);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchCategory && matchSearch && matchPrice;
    });
  }, [products, activeCategory, searchQuery, priceRange]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      return existing ? prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  const toggleFavorite = (id: string) => setFavorites(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  // --- SECURITY LOGIC ---

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (lockoutUntil) {
      if (Date.now() < lockoutUntil) {
        setAuthError(`Слишком много попыток. Попробуйте через ${Math.ceil((lockoutUntil - Date.now()) / 60000)} мин.`);
        return;
      } else {
        setLockoutUntil(null);
        localStorage.removeItem('aura_admin_lockout');
        setLoginAttempts(0);
      }
    }

    setIsVerifying(true);

    try {
      if (adminStep === 0) {
        // Step 1: Login & Password
        const isValid = await api.authStep1(adminLogin, adminPassword);

        if (isValid) {
          setAdminStep(1);
          setLoginAttempts(0);
        } else {
          // Эта часть кода выполнится только если сервер вернет успех: false, но статус 200
          // Однако api.authStep1 выбрасывает ошибку, если !res.ok.
          // Поэтому основная обработка ошибок будет в catch.
        }
      } else {
        // Step 2: Secret Question
        const isValid = await api.authStep2(adminSecret);

        if (isValid) {
          setIsAdminAuthenticated(true);
          setAdminLogin('');
          setAdminPassword('');
          setAdminSecret('');
          setAdminStep(0);
          setLoginAttempts(0);
        }
      }
    } catch (err: any) {
      // Обработка ошибок от сервера (401, 429, 500)
      setAuthError(err.message || 'Ошибка сервера');
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Если сервер вернул 429 (Too many requests) или мы набрали много попыток на клиенте
      if ((err.message && err.message.includes('Слишком много')) || newAttempts >= 3) {
         const lockout = Date.now() + (15 * 60 * 1000);
         setLockoutUntil(lockout);
         localStorage.setItem('aura_admin_lockout', lockout.toString());
         setAuthError('Доступ временно заблокирован.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const img = editingProduct.image || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800';
    if (editingProduct.id) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct, image: img } as Product : p));
    } else {
      setProducts(prev => [{ ...editingProduct, id: Math.random().toString(), rating: 5, image: img } as Product, ...prev]);
    }
    setEditingProduct(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isCategory = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isCategory) {
          setEditingCategory(prev => prev ? ({ ...prev, i: reader.result as string }) : null);
        } else {
          setEditingProduct(prev => prev ? ({ ...prev, image: reader.result as string }) : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      if (view !== 'catalog') setView('catalog');
    } else {
      setView('home');
    }
  };

  const sendOrderToTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const itemsList = cart.map(i => `- ${i.name} (x${i.quantity}) - ${i.price * i.quantity}₽`).join('\n');
    const contactMethodLabel = formData.contactMethod === 'telegram' ? 'Telegram' : formData.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Звонок';
    
    const message = 
      `📦 *НОВАЯ ЗАЯВКА С САЙТА*\n\n` +
      `👤 *Имя:* ${formData.name}\n` +
      `📱 *Телефон:* ${formData.phone}\n` +
      `💬 *Связь:* ${contactMethodLabel}\n` +
      `📍 *Адрес:* ${formData.address || 'Самовывоз'}\n` +
      `📝 *Комментарий:* ${formData.comment || 'Нет'}\n\n` +
      `🛒 *ЗАКАЗ:* \n${itemsList}\n\n` +
      `💰 *ИТОГО: ${cartTotal} ₽*`;

    try {
      await api.sendOrder(message);
      setView('success');
      setCart([]);
      setFormData({ name: '', phone: '', address: '', comment: '', contactMethod: 'whatsapp' });
    } catch (error) {
      alert('Ошибка отправки. Проверьте, запущен ли сервер (node server.js) и доступен ли он.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-background text-gray-900 flex flex-col selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <button className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight" onClick={() => setView('home')}>Аура</button>
              <nav className="hidden md:flex gap-1 bg-gray-50/80 p-1.5 rounded-2xl">
                {[{id: 'all', l: 'Каталог'}, {id: 'balloons', l: 'Шары'}, {id: 'candles', l: 'Свечи'}].map(i => (
                  <button key={i.id} onClick={() => { setView('catalog'); setActiveCategory(i.id as any); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'catalog' && activeCategory === i.id ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>{i.l}</button>
                ))}
              </nav>
            </div>
            <div className="flex-1 max-w-md mx-8 hidden md:block relative group">
              <input type="text" placeholder="Поиск..." value={searchQuery} onChange={handleSearch} className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-gray-50/80 focus:bg-white focus:ring-4 focus:ring-violet-100 transition-all text-sm outline-none" />
              <Search className="absolute left-3.5 top-2.5 text-gray-400" size={18} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setView('favorites')} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-secondary relative">
                <Heart size={22} className={favorites.size > 0 ? "fill-secondary text-secondary" : ""} />
                {favorites.size > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>}
              </button>
              <button onClick={() => setView('cart')} className="relative p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-primary">
                <ShoppingBag size={22} />
                {cartCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {view === 'home' && (
          <div className="space-y-20 pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-[#fdfbf7]">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
              <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-8">
                  <h1 className="text-5xl md:text-7xl font-bold leading-[1.1]">Атмосфера <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">праздника</span></h1>
                  <p className="text-lg text-gray-500">Воздушные шары и свечи ручной работы для ваших лучших моментов.</p>
                  <Button onClick={() => setView('catalog')} className="px-10 py-4 text-lg">В каталог</Button>
                </div>
                <div className="relative">
                   <img src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=1200" loading="eager" className="rounded-[2.5rem] shadow-2xl w-full aspect-[16/9] object-cover border-4 border-white transform md:scale-125 origin-center transition-transform duration-700" alt="Подарок" />
                   <div className="absolute -bottom-8 -left-8 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100 z-10">
                      <div className="bg-green-100 p-2 rounded-full text-green-600"><Truck size={20}/></div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">Быстрая доставка</p>
                        <p className="text-xs text-gray-500">Доставим за 2 часа</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-10">Категории</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {categories.map(c => (
                  <div key={c.id} onClick={() => { setView('catalog'); setActiveCategory(c.id as any); }} className="relative h-80 rounded-[2rem] overflow-hidden cursor-pointer group">
                    <img src={c.i} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={c.n} />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-3xl font-bold">{c.n}</div>
                  </div>
                ))}
              </div>
            </section>

             {/* New Arrivals */}
            <section className="max-w-7xl mx-auto px-4">
               <div className="flex justify-between items-end mb-10">
                 <h2 className="text-3xl font-bold">Новинки</h2>
                 <button onClick={() => setView('catalog')} className="text-primary font-bold">Смотреть все</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onOpen={() => {setSelectedProduct(p); setView('product')}} onToggleFavorite={toggleFavorite} isFavorite={favorites.has(p.id)} onAddToCart={addToCart}/>)}
               </div>
            </section>
          </div>
        )}

        {view === 'catalog' && (
           <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex gap-4 overflow-x-auto pb-4 mb-8 sticky top-20 bg-white/90 z-40 backdrop-blur-sm py-4">
                 {['all', 'balloons', 'candles', 'sets'].map(c => (
                   <button key={c} onClick={() => setActiveCategory(c as any)} className={`px-6 py-2 rounded-full border transition-all ${activeCategory === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-900'}`}>
                     {c === 'all' ? 'Все' : c === 'balloons' ? 'Шары' : c === 'candles' ? 'Свечи' : 'Наборы'}
                   </button>
                 ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} onOpen={() => {setSelectedProduct(p); setView('product')}} onToggleFavorite={toggleFavorite} isFavorite={favorites.has(p.id)} onAddToCart={addToCart}/>)}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <Search size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>Ничего не найдено</p>
                </div>
              )}
           </div>
        )}

        {view === 'favorites' && (
           <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-2"><Heart className="fill-secondary text-secondary"/> Избранное</h2>
              {favorites.size === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400"><Heart size={40}/></div>
                  <p className="text-xl text-gray-500">В избранном пока пусто</p>
                  <Button onClick={() => setView('catalog')}>Перейти в каталог</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {products.filter(p => favorites.has(p.id)).map(p => <ProductCard key={p.id} product={p} onOpen={() => {setSelectedProduct(p); setView('product')}} onToggleFavorite={toggleFavorite} isFavorite={true} onAddToCart={addToCart}/>)}
                </div>
              )}
           </div>
        )}

        {view === 'product' && selectedProduct && (
          <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-12">
            <img src={selectedProduct.image} className="rounded-[2.5rem] w-full object-cover shadow-xl" alt={selectedProduct.name}/>
            <div className="space-y-6">
              <button onClick={() => setView('catalog')} className="flex items-center gap-2 text-gray-500"><ArrowLeft size={20}/> Назад</button>
              <h1 className="text-4xl font-bold">{selectedProduct.name}</h1>
              <p className="text-3xl text-primary font-bold">{selectedProduct.price} ₽</p>
              <p className="text-gray-600 text-lg leading-relaxed">{selectedProduct.description}</p>
              <div className="flex gap-4 pt-4">
                 <Button onClick={() => addToCart(selectedProduct)} className="flex-1 py-4 text-lg">В корзину</Button>
                 <button onClick={() => toggleFavorite(selectedProduct.id)} className="p-4 rounded-2xl border border-gray-200 hover:border-secondary"><Heart className={favorites.has(selectedProduct.id) ? "fill-secondary text-secondary" : ""}/></button>
              </div>
            </div>
          </div>
        )}

        {view === 'cart' && (
           <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-3xl font-bold mb-8">Корзина</h2>
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                   <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400"><ShoppingBag size={40}/></div>
                   <p className="text-xl text-gray-500">Корзина пуста</p>
                   <Button onClick={() => setView('catalog')}>Перейти в каталог</Button>
                </div>
              ) : (
                 <div className="grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-4">
                       {cart.map(i => (
                          <div key={i.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100">
                             <img src={i.image} className="w-20 h-20 rounded-xl object-cover" alt={i.name}/>
                             <div className="flex-1">
                                <h3 className="font-bold">{i.name}</h3>
                                <p className="text-primary font-bold">{i.price} ₽</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(i.id, -1)} className="p-1"><Minus size={16}/></button>
                                <span>{i.quantity}</span>
                                <button onClick={() => updateQuantity(i.id, 1)} className="p-1"><Plus size={16}/></button>
                             </div>
                             <button onClick={() => removeFromCart(i.id)} className="text-red-500"><Trash2 size={20}/></button>
                          </div>
                       ))}
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 h-fit sticky top-24">
                       <h3 className="text-xl font-bold mb-4">Итого</h3>
                       <div className="flex justify-between mb-2"><span>Товары</span><span>{cartTotal} ₽</span></div>
                       <div className="flex justify-between mb-6"><span>Доставка</span><span className="text-green-500">0 ₽</span></div>
                       <Button onClick={() => setView('checkout')} className="w-full">Оформить заявку</Button>
                    </div>
                 </div>
              )}
           </div>
        )}

        {view === 'checkout' && (
           <div className="max-w-3xl mx-auto px-4 py-8">
              <button onClick={() => setView('cart')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"><ArrowLeft size={20}/> Назад в корзину</button>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <h2 className="text-3xl font-bold">Оформление заявки</h2>
                   <p className="text-gray-500">Заполните форму, и мы свяжемся с вами для подтверждения деталей и оплаты.</p>
                   
                   <form className="space-y-4" onSubmit={sendOrderToTelegram}>
                      <Input label="Ваше имя" required placeholder="Как к вам обращаться" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} />
                      <Input label="Телефон" required placeholder="+7 (999) 000-00-00" value={formData.phone} onChange={(e:any) => setFormData({...formData, phone: e.target.value})} />
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 ml-1">Как с вами связаться?</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => setFormData({...formData, contactMethod: 'whatsapp'})} className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.contactMethod === 'whatsapp' ? 'bg-green-50 border-green-500 text-green-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}><MessageCircle size={18}/> WhatsApp</button>
                          <button type="button" onClick={() => setFormData({...formData, contactMethod: 'telegram'})} className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.contactMethod === 'telegram' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}><Send size={18}/> Telegram</button>
                          <button type="button" onClick={() => setFormData({...formData, contactMethod: 'phone'})} className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.contactMethod === 'phone' ? 'bg-purple-50 border-purple-500 text-purple-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}><Phone size={18}/> Телефон</button>
                        </div>
                      </div>

                      <Input label="Адрес доставки (необязательно)" placeholder="Улица, дом, квартира" value={formData.address} onChange={(e:any) => setFormData({...formData, address: e.target.value})} />
                      
                      <div className="flex flex-col gap-1.5 w-full">
                         <label className="text-sm font-medium text-gray-600 ml-1">Комментарий к заказу</label>
                         <textarea className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-400 min-h-[100px]" placeholder="Пожелания по цвету, дата доставки..." value={formData.comment} onChange={(e:any) => setFormData({...formData, comment: e.target.value})} />
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-lg mt-4">
                        {isSubmitting ? 'Отправка...' : `Отправить заявку на ${cartTotal} ₽`}
                      </Button>
                      <p className="text-xs text-center text-gray-400">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
                   </form>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] h-fit border border-gray-100 shadow-lg">
                  <h3 className="font-bold text-xl mb-6">Ваш заказ</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <img src={item.image} className="w-16 h-16 rounded-xl object-cover bg-gray-50" alt={item.name}/>
                        <div className="flex-1">
                          <p className="font-medium text-sm leading-tight mb-1">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} шт x {item.price} ₽</p>
                        </div>
                        <p className="font-bold">{item.price * item.quantity} ₽</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center">
                    <span className="text-gray-500">Итого к оплате</span>
                    <span className="text-2xl font-bold text-primary">{cartTotal} ₽</span>
                  </div>
                </div>
              </div>
           </div>
        )}

        {view === 'success' && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-md mx-auto">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-100 animate-pulse"><CheckCircle size={48}/></div>
              <h2 className="text-3xl font-bold mb-4">Заявка отправлена!</h2>
              <p className="text-gray-500 mb-8 text-lg">Спасибо за заказ. Менеджер свяжется с вами в ближайшее время через выбранный способ связи.</p>
              <Button onClick={() => setView('home')} className="w-full">Вернуться в магазин</Button>
           </div>
        )}

        {view === 'privacy' && (
           <div className="max-w-4xl mx-auto px-4 py-12">
             <button onClick={() => setView('home')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"><ArrowLeft size={20}/> На главную</button>
             <h1 className="text-4xl font-bold mb-8">Обработка персональных данных</h1>
             <div className="prose prose-lg text-gray-600 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <p className="mb-4">
                 Настоящим, свободно, своей волей и в своем интересе даю согласие магазину «Аура» на автоматизированную и неавтоматизированную обработку моих персональных данных.
               </p>
               <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">1. Цель обработки</h3>
               <p className="mb-4">
                 Обработка персональных данных осуществляется в целях заключения и исполнения договоров купли-продажи, информирования о товарах и услугах, а также для обеспечения обратной связи с клиентом.
               </p>
               <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">2. Перечень данных</h3>
               <p className="mb-4">
                 Согласие распространяется на следующую информацию: фамилия, имя, отчество, номер телефона, адрес электронной почты, адрес доставки.
               </p>
               <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">3. Срок действия</h3>
               <p className="mb-4">
                 Согласие действует до момента его отзыва субъектом персональных данных путем направления письменного заявления.
               </p>
               <p className="mt-8 text-sm text-gray-400">
                 Редакция от 15.01.2026
               </p>
             </div>
           </div>
        )}

        {view === 'admin' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            {!isAdminAuthenticated ? (
               <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
                  <h2 className="text-2xl font-bold text-center mb-6">Вход в систему</h2>
                  
                  {authError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start text-red-700 text-sm">
                      <AlertTriangle className="shrink-0" size={20}/>
                      <div>{authError}</div>
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    {adminStep === 0 ? (
                      <>
                         <Input label="Логин" value={adminLogin} onChange={(e: any) => setAdminLogin(e.target.value)} disabled={isVerifying || !!lockoutUntil} />
                         <Input label="Пароль" type="password" value={adminPassword} onChange={(e: any) => setAdminPassword(e.target.value)} disabled={isVerifying || !!lockoutUntil} />
                      </>
                    ) : (
                      <>
                         <div className="text-center text-sm text-gray-500 mb-2">Введите секретное слово</div>
                         <Input type="text" value={adminSecret} onChange={(e: any) => setAdminSecret(e.target.value)} placeholder="" autoFocus disabled={isVerifying || !!lockoutUntil} />
                      </>
                    )}
                     <Button type="submit" className="w-full" disabled={isVerifying || !!lockoutUntil}>
                        {isVerifying ? (
                          <span className="flex items-center gap-2"><Clock size={16} className="animate-spin"/> Проверка...</span>
                        ) : (
                          adminStep === 0 ? 'Далее' : 'Войти'
                        )}
                     </Button>
                  </form>
               </div>
            ) : (
               <div>
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-bold">Админ-панель</h2>
                     <Button variant="outline" onClick={() => { setIsAdminAuthenticated(false); setAdminStep(0); }}><LogOut size={20}/></Button>
                  </div>

                  <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setAdminTab('products')} className={`px-6 py-2 rounded-lg font-medium transition-all ${adminTab === 'products' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Товары</button>
                    <button onClick={() => setAdminTab('categories')} className={`px-6 py-2 rounded-lg font-medium transition-all ${adminTab === 'categories' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Категории</button>
                  </div>

                  {adminTab === 'products' ? (
                    <>
                      <div className="flex justify-end mb-6">
                        <Button onClick={() => setEditingProduct({} as any)}><Plus size={20}/> Добавить товар</Button>
                      </div>
                      {editingProduct && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <form onSubmit={handleSaveProduct} className="bg-white p-8 rounded-[2rem] w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                              <h3 className="text-xl font-bold mb-4">{editingProduct.id ? 'Редактировать' : 'Новый товар'}</h3>
                              <div className="flex gap-2 mb-2 bg-gray-50 p-1 rounded-lg w-fit">
                                  <button type="button" onClick={() => setImageInputMode('file')} className={`px-3 py-1 rounded-md text-sm ${imageInputMode === 'file' ? 'bg-white shadow-sm' : ''}`}>Файл</button>
                                  <button type="button" onClick={() => setImageInputMode('url')} className={`px-3 py-1 rounded-md text-sm ${imageInputMode === 'url' ? 'bg-white shadow-sm' : ''}`}>Ссылка</button>
                              </div>
                              {imageInputMode === 'file' ? (
                                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary relative">
                                    <input type="file" onChange={(e) => handleImageUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                    <Upload className="mx-auto text-gray-400 mb-2"/>
                                    <span className="text-sm text-gray-500">Нажмите для загрузки</span>
                                    {editingProduct.image && <img src={editingProduct.image} className="mt-4 h-20 mx-auto object-cover rounded-lg"/>}
                                  </div>
                              ) : (
                                  <Input label="URL фото" value={editingProduct.image || ''} onChange={(e: any) => setEditingProduct({...editingProduct, image: e.target.value})} />
                              )}
                              <Input label="Название" value={editingProduct.name || ''} onChange={(e: any) => setEditingProduct({...editingProduct, name: e.target.value})} required />
                              <Input label="Цена" type="number" value={editingProduct.price || ''} onChange={(e: any) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} required />
                              
                              <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium ml-1">Категория</label>
                                  <select className="px-4 py-3 rounded-xl border border-gray-200 bg-white" value={editingProduct.category || 'balloons'} onChange={(e: any) => setEditingProduct({...editingProduct, category: e.target.value})}>
                                    <option value="balloons">Шары</option>
                                    <option value="candles">Свечи</option>
                                    <option value="sets">Наборы</option>
                                  </select>
                              </div>

                              <div className="flex gap-4 p-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={editingProduct.isNew || false} onChange={(e) => setEditingProduct({...editingProduct, isNew: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
                                  <span className="text-sm font-medium">Новинка</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={editingProduct.isSeasonal || false} onChange={(e) => setEditingProduct({...editingProduct, isSeasonal: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
                                  <span className="text-sm font-medium">Сезонное</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={editingProduct.isSale || false} onChange={(e) => setEditingProduct({...editingProduct, isSale: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
                                  <span className="text-sm font-medium">Скидка</span>
                                </label>
                              </div>

                              <Input label="Описание" value={editingProduct.description || ''} onChange={(e: any) => setEditingProduct({...editingProduct, description: e.target.value})} />
                              <div className="flex gap-2 pt-4">
                                  <Button variant="ghost" onClick={() => setEditingProduct(null)}>Отмена</Button>
                                  <Button type="submit">Сохранить</Button>
                              </div>
                            </form>
                        </div>
                      )}
                      <div className="space-y-2">
                        {products.map(p => (
                            <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                              <img src={p.image} className="w-12 h-12 rounded-lg object-cover" alt={p.name}/>
                              <div className="flex-1 font-medium">
                                {p.name}
                                <div className="flex gap-1 mt-1">
                                  {p.isNew && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Новинка</span>}
                                  {p.isSeasonal && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Сезон</span>}
                                  {p.isSale && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Скидка</span>}
                                </div>
                              </div>
                              <div className="text-gray-500">{p.price} ₽</div>
                              <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                              <button onClick={() => { if(confirm('Удалить?')) setProducts(prev => prev.filter(i => i.id !== p.id)) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                            </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                       {editingCategory && (
                          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                             <form onSubmit={handleSaveCategory} className="bg-white p-8 rounded-[2rem] w-full max-w-lg space-y-4">
                                <h3 className="text-xl font-bold mb-4">Редактировать категорию</h3>
                                <div className="flex gap-2 mb-2 bg-gray-50 p-1 rounded-lg w-fit">
                                    <button type="button" onClick={() => setImageInputMode('file')} className={`px-3 py-1 rounded-md text-sm ${imageInputMode === 'file' ? 'bg-white shadow-sm' : ''}`}>Файл</button>
                                    <button type="button" onClick={() => setImageInputMode('url')} className={`px-3 py-1 rounded-md text-sm ${imageInputMode === 'url' ? 'bg-white shadow-sm' : ''}`}>Ссылка</button>
                                </div>
                                {imageInputMode === 'file' ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary relative">
                                      <input type="file" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                      <Upload className="mx-auto text-gray-400 mb-2"/>
                                      <span className="text-sm text-gray-500">Нажмите для загрузки</span>
                                      {editingCategory.i && <img src={editingCategory.i} className="mt-4 h-20 mx-auto object-cover rounded-lg"/>}
                                    </div>
                                ) : (
                                    <Input label="URL фото" value={editingCategory.i || ''} onChange={(e: any) => setEditingCategory({...editingCategory, i: e.target.value})} />
                                )}
                                <div className="text-lg font-bold text-center py-2">{editingCategory.n}</div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => setEditingCategory(null)}>Отмена</Button>
                                    <Button type="submit">Сохранить</Button>
                                </div>
                             </form>
                          </div>
                       )}
                       <div className="grid grid-cols-1 gap-4">
                          {categories.map(c => (
                             <div key={c.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                                <img src={c.i} className="w-20 h-20 rounded-lg object-cover" alt={c.n}/>
                                <div className="flex-1 font-bold text-lg">{c.n}</div>
                                <button onClick={() => setEditingCategory(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={20}/></button>
                             </div>
                          ))}
                       </div>
                    </>
                  )}
               </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-12">
            <div>
               <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Аура</h3>
               <p className="text-gray-500 text-sm">Создаем атмосферу праздника и уюта.</p>
            </div>
            <div>
               <h4 className="font-bold mb-4">Меню</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                  <li><button onClick={() => setView('catalog')}>Каталог</button></li>
                  <li><button onClick={() => setView('home')}>О нас</button></li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold mb-4">Контакты</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex gap-2 items-center"><Phone size={16}/> +7 (923) 152-86-87</li>
                  <li className="flex gap-2 items-center"><MapPin size={16}/> г. Обь, ул. Веселая, дом 7</li>
                  <li className="flex gap-2 items-center"><Mail size={16}/> oksana-0788@mail.ru</li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
               <p>© 2026 Aura Shop</p>
               <span className="hidden md:inline text-gray-300">|</span>
               <button onClick={() => setView('privacy')} className="hover:text-gray-600 transition-colors text-left">Обработка персональных данных</button>
            </div>
            <button onClick={() => setView('admin')} className="flex items-center gap-2 hover:text-primary"><Lock size={14}/> Админ</button>
         </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);