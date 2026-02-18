
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Home as HomeIcon, 
  Bell, 
  User, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  Star, 
  ArrowRight, 
  Loader2, 
  LogOut, 
  Mail, 
  Lock, 
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- CONSTANTS & HELPERS ---
const STORAGE_KEY = 'vynornews_user_session';
const SAVED_ITEMS_KEY = 'vynornews_saved_items';

// Domínios de e-mail descartáveis/fakes comuns para bloquear
const DISPOSABLE_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'guerrillamail.com', 
  'yopmail.com', 'getnada.com', 'dispostable.com', 'temp-mail.org'
];

const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return { valid: false, msg: 'Formato de e-mail inválido.' };
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { valid: false, msg: 'E-mails temporários não são permitidos.' };
  }
  
  return { valid: true, msg: '' };
};

const getPasswordStrength = (pass: string) => {
  let score = 0;
  if (pass.length > 7) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score; // 0 a 4
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  } catch { return dateStr; }
};

// --- TYPES & ENUMS ---
enum NewsImpact { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }
interface NewsSource { title: string; uri: string; }
interface NewsItem { id: string; title: string; summary: string; content?: string; impact: NewsImpact; category: string; timestamp: string; publishedAt: string; imageUrl?: string; sources?: NewsSource[]; }
interface UserPreferences { interests: string[]; alertLevel: 'low' | 'medium' | 'high'; }
interface UserProfile { name: string; email: string; isLoggedIn: boolean; preferences: UserPreferences; }
type AppView = 'auth' | 'home' | 'alerts' | 'profile' | 'detail' | 'image-editor' | 'onboarding';

// --- AI SERVICES ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fetchNewsFeed = async (interests: string[], offset: number = 0): Promise<NewsItem[]> => {
  const prompt = `Gere 5 notícias REAIS de negócios (últimas 48h) sobre: ${interests.join(', ')}. O campo 'impact' deve ser 'low', 'medium', 'high' ou 'critical'. JSON puro.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              impact: { type: Type.STRING },
              category: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              publishedAt: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ['id', 'title', 'summary', 'impact', 'category', 'timestamp', 'publishedAt']
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.filter(c => c.web?.uri).map(c => ({ title: c.web.title || 'Fonte', uri: c.web.uri }));
    const news = JSON.parse(response.text.replace(/```json|```/g, '').trim());

    return news.map((item: any, index: number) => ({
      ...item,
      id: item.id || `n-${Date.now()}-${index}`,
      imageUrl: `https://images.unsplash.com/photo-${1550000000000 + (offset * 10) + index}?q=80&w=800&auto=format&fit=crop`,
      sources: sources.length > 0 ? sources : undefined
    }));
  } catch (error) { return []; }
};

// --- VIEWS ---

const AuthView: React.FC<{ onAuthComplete: (u: any) => void }> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const emailStatus = validateEmail(email);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailStatus.valid) {
      setError(emailStatus.msg);
      return;
    }

    if (!isLogin) {
      if (passwordStrength < 2) {
        setError('Sua senha é muito fraca.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
    } else {
      if (!password) {
        setError('Digite sua senha.');
        return;
      }
    }

    setLoading(true);
    // Simulando delay de rede/auth
    setTimeout(() => {
      setLoading(false);
      onAuthComplete({ name: email.split('@')[0], email });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col p-8 bg-slate-950 justify-center">
      <div className="text-center mb-10 animate-in fade-in zoom-in duration-700">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">VynorNew's</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Inteligência Corporativa</p>
      </div>

      <div className="bg-slate-900/50 p-2 rounded-2xl mb-8 flex border border-slate-800/50">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-400'}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-400'}`}>Cadastro</button>
      </div>

      <form onSubmit={handleAction} className="space-y-4">
        {/* Campo E-mail */}
        <div className="space-y-1.5">
          <div className="relative">
            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${email && !emailStatus.valid ? 'text-red-500' : 'text-slate-500'}`} size={18} />
            <input 
              type="email" placeholder="E-mail corporativo" value={email} onChange={e => setEmail(e.target.value)}
              className={`w-full bg-slate-900 border ${email && !emailStatus.valid ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
            />
            {email && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {emailStatus.valid ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
              </div>
            )}
          </div>
          {email && !emailStatus.valid && <p className="text-[10px] text-red-500 font-bold ml-4">{emailStatus.msg}</p>}
        </div>

        {/* Campo Senha */}
        <div className="space-y-1.5">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {!isLogin && password && (
            <div className="px-4 py-1">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? (passwordStrength <= 2 ? 'bg-orange-500' : 'bg-green-500') : 'bg-slate-800'}`} />
                ))}
              </div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                Força: {['Fraca', 'Razoável', 'Boa', 'Forte'][passwordStrength - 1] || 'Mínimo 8 chars'}
              </p>
            </div>
          )}
        </div>

        {/* Confirmação (Só Cadastro) */}
        {!isLogin && (
          <div className="relative animate-in slide-in-from-top-2">
            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${password && confirmPassword && password !== confirmPassword ? 'text-red-500' : 'text-slate-500'}`} size={18} />
            <input 
              type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full bg-slate-900 border ${password && confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none transition-all`}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-500">{error}</p>
          </div>
        )}

        <button 
          disabled={loading || (email && !emailStatus.valid)} 
          className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-center mt-10 text-[9px] text-slate-600 font-black uppercase tracking-widest opacity-40 italic">
        🔒 Criptografia Enterprise de Ponta a Ponta
      </p>
    </div>
  );
};

// --- REST OF THE APP (SIMPLIFIED RE-IMPLEMENTATION) ---

const OnboardingView: React.FC<{ onComplete: (p: UserPreferences) => void }> = ({ onComplete }) => (
  <div className="min-h-screen p-8 bg-slate-950 flex flex-col items-center justify-center">
    <div className="p-5 bg-blue-600/10 rounded-full mb-6 border border-blue-500/20"><Sparkles className="text-blue-500" size={32} /></div>
    <h2 className="text-3xl font-black text-white text-center mb-4">Bem-vindo à Elite</h2>
    <p className="text-slate-500 text-center mb-10 text-sm font-medium">Estamos preparando seu terminal de inteligência personalizada.</p>
    <button onClick={() => onComplete({ interests: ['IA', 'Finanças'], alertLevel: 'medium' })} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Iniciar Monitoramento</button>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { name: '', email: '', isLoggedIn: false, preferences: { interests: [], alertLevel: 'medium' } };
  });
  const [view, setView] = useState<AppView>(user.isLoggedIn ? 'home' : 'auth');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }, [user]);

  const loadNews = useCallback(async () => {
    if (!user.isLoggedIn) return;
    setLoading(true);
    const data = await fetchNewsFeed(user.preferences.interests || ['Negócios']);
    setNews(data);
    setLoading(false);
  }, [user.isLoggedIn, user.preferences.interests]);

  useEffect(() => { if (user.isLoggedIn && news.length === 0) loadNews(); }, [user.isLoggedIn, loadNews, news.length]);

  if (view === 'auth') return <AuthView onAuthComplete={(u) => { setUser({ ...user, ...u }); setView('onboarding'); }} />;
  if (view === 'onboarding') return <OnboardingView onComplete={(p) => { setUser({ ...user, isLoggedIn: true, preferences: p }); setView('home'); }} />;

  return (
    <div className="mobile-container flex flex-col bg-slate-950 h-screen overflow-hidden">
      <header className="p-6 pt-10 flex justify-between items-center border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <h1 className="text-2xl font-black text-white tracking-tighter" onClick={() => { setView('home'); setSelectedNews(null); }}>VynorNew's</h1>
        <div className="flex gap-2">
          <button onClick={loadNews} className={`p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 ${loading ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
          <button onClick={() => setView('profile')} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500"><User size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {view === 'home' && !selectedNews && (
          <div className="p-5 space-y-5">
            {news.map(item => (
              <div key={item.id} onClick={() => setSelectedNews(item)} className="bg-slate-900 rounded-[2rem] border border-slate-800/50 overflow-hidden group active:scale-[0.98] transition-all">
                <div className="h-40 overflow-hidden"><img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" /></div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{item.category}</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">{item.timestamp}</span>
                  </div>
                  <h3 className="text-white font-bold leading-tight group-hover:text-blue-400">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedNews && (
          <div className="animate-in fade-in duration-300">
            <div className="relative h-60">
              <img src={selectedNews.imageUrl} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedNews(null)} className="absolute top-8 left-6 p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white border border-white/10"><ArrowLeft size={20} /></button>
            </div>
            <div className="p-8 bg-slate-950 -mt-10 rounded-t-[40px] relative">
              <h2 className="text-2xl font-black text-white mb-4 leading-tight">{selectedNews.title}</h2>
              <div className="bg-slate-900/50 border-l-4 border-blue-600 p-5 rounded-r-2xl mb-8 text-slate-300 italic text-sm">"{selectedNews.summary}"</div>
              <div className="text-slate-400 text-sm leading-relaxed mb-10">{selectedNews.content || "Processando análise de longo prazo..."}</div>
              
              {selectedNews.sources && (
                <div className="space-y-2 border-t border-slate-900 pt-6">
                  <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Fontes Verificadas</h4>
                  {selectedNews.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" className="flex justify-between p-4 bg-slate-900 rounded-2xl text-[10px] text-slate-300 font-bold border border-slate-800">
                      {s.title} <ExternalLink size={12} className="text-blue-500" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="p-8 flex flex-col items-center">
             <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-3xl font-black text-white mb-6 border border-white/5">{user.email.charAt(0).toUpperCase()}</div>
             <p className="text-white font-black uppercase text-xs tracking-widest mb-10">{user.email}</p>
             <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full p-5 bg-red-500/5 border border-red-500/10 rounded-[2.2rem] text-red-500 text-[10px] font-black uppercase tracking-widest flex justify-between items-center">Sair do Terminal <LogOut size={18} /></button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-0 right-0 max-w-[480px] mx-auto px-10">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex justify-around shadow-2xl">
          <button onClick={() => { setView('home'); setSelectedNews(null); }} className={`p-4 rounded-full transition-all ${view === 'home' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><HomeIcon size={20} /></button>
          <button onClick={() => setView('alerts')} className={`p-4 rounded-full transition-all ${view === 'alerts' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><Bell size={20} /></button>
          <button onClick={() => setView('profile')} className={`p-4 rounded-full transition-all ${view === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><User size={20} /></button>
        </div>
      </nav>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
