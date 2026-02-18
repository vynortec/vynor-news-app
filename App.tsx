
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Bell, 
  User, 
  Search, 
  Settings, 
  ArrowLeft, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { NewsItem, AppView, UserProfile, NewsImpact } from './types';
import { fetchNewsFeed } from './services/gemini';

// View Components
import HomeView from './views/Home';
import AlertsView from './views/Alerts';
import ProfileView from './views/Profile';
import NewsDetailView from './views/NewsDetail';
import ImageEditorView from './views/ImageEditor';
import OnboardingView from './views/Onboarding';
import AuthView from './views/Auth';

const STORAGE_KEY = 'vynornews_user_session';
const SAVED_ITEMS_KEY = 'vynornews_saved_items';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error("Erro ao carregar sessão salva", e);
      }
    }
    return {
      name: '',
      email: '',
      role: '',
      company: '',
      isLoggedIn: false,
      preferences: {
        interests: [],
        alertLevel: 'medium',
        companyTypes: []
      }
    };
  });

  const [savedNews, setSavedNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem(SAVED_ITEMS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.isLoggedIn ? 'home' : 'auth';
      } catch (e) {}
    }
    return 'auth';
  });

  const [authInitialIsLogin, setAuthInitialIsLogin] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedNews));
  }, [savedNews]);

  useEffect(() => {
    if (user.isLoggedIn && user.preferences.interests.length > 0 && news.length === 0) {
      loadInitialNews();
    }
  }, [user.isLoggedIn, user.preferences.interests]);

  const loadInitialNews = async () => {
    setLoading(true);
    const data = await fetchNewsFeed(user.preferences.interests, 0);
    setNews(data);
    setLoading(false);
  };

  const loadMoreNews = useCallback(async () => {
    if (loadingMore || loading || !user.isLoggedIn) return;
    setLoadingMore(true);
    const newData = await fetchNewsFeed(user.preferences.interests, news.length);
    
    setNews(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const filtered = newData.filter(n => !existingIds.has(n.id));
      return [...prev, ...filtered];
    });
    setLoadingMore(false);
  }, [news.length, user.preferences.interests, loadingMore, loading, user.isLoggedIn]);

  const handleToggleSave = (item: NewsItem) => {
    setSavedNews(prev => {
      const isAlreadySaved = prev.some(n => n.id === item.id);
      if (isAlreadySaved) {
        return prev.filter(n => n.id !== item.id);
      }
      return [...prev, { ...item, isSaved: true }];
    });
  };

  const handleNewsSelect = (item: NewsItem) => {
    setSelectedNews(item);
    setCurrentView('detail');
  };

  const handleAuthComplete = (userData: { name: string; email: string; role?: string; company?: string }) => {
    setUser(prev => ({ 
      ...prev, 
      name: userData.name, 
      email: userData.email, 
      role: userData.role || '', 
      company: userData.company || '' 
    }));
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = (prefs: any) => {
    setUser(prev => ({ ...prev, isLoggedIn: true, preferences: prefs }));
    setNews([]); 
    setCurrentView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.clear(); 
    setNews([]);
    setSavedNews([]);
    setSelectedNews(null);
    setUser({
      name: '',
      email: '',
      role: '',
      company: '',
      isLoggedIn: false,
      preferences: {
        interests: [],
        alertLevel: 'medium',
        companyTypes: []
      }
    });
    setAuthInitialIsLogin(true);
    setCurrentView('auth');
  };

  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return <AuthView onAuthComplete={handleAuthComplete} initialIsLogin={authInitialIsLogin} />;
      case 'onboarding':
        return <OnboardingView onComplete={handleOnboardingComplete} />;
      case 'home':
        return (
          <HomeView 
            news={news} 
            loading={loading} 
            loadingMore={loadingMore}
            savedIds={savedNews.map(n => n.id)}
            onSelect={handleNewsSelect} 
            onRefresh={loadInitialNews}
            onLoadMore={loadMoreNews}
            onToggleSave={handleToggleSave}
          />
        );
      case 'alerts':
        return <AlertsView news={news.filter(n => n.impact === NewsImpact.HIGH || n.impact === NewsImpact.CRITICAL)} onSelect={handleNewsSelect} />;
      case 'profile':
        return <ProfileView user={user} savedCount={savedNews.length} setUser={setUser} onLogout={handleLogout} onViewChange={setCurrentView} />;
      case 'detail':
        return selectedNews ? (
          <NewsDetailView 
            item={selectedNews} 
            isSaved={savedNews.some(n => n.id === selectedNews.id)}
            onToggleSave={() => handleToggleSave(selectedNews)}
            onBack={() => setCurrentView('home')} 
          />
        ) : null;
      case 'image-editor':
        return <ImageEditorView onBack={() => setCurrentView('home')} />;
      default:
        return <AuthView onAuthComplete={handleAuthComplete} initialIsLogin={authInitialIsLogin} />;
    }
  };

  return (
    <div className="mobile-container h-screen overflow-hidden flex flex-col bg-slate-950">
      {!['auth', 'onboarding', 'detail'].includes(currentView) && (
        <header className="shrink-0 px-6 pt-8 pb-4 bg-slate-950/80 backdrop-blur-md flex justify-between items-center border-b border-slate-900 z-50">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter">
                VynorNew's
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('image-editor')}
            className="p-2 bg-slate-900 text-slate-300 rounded-full hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <Sparkles size={20} />
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto bg-slate-950 scroll-smooth">
        {renderView()}
      </main>

      {user.isLoggedIn && !['auth', 'onboarding', 'detail'].includes(currentView) && (
        <nav className="shrink-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-900 px-8 py-2.5 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <NavItem 
            active={currentView === 'home'} 
            onClick={() => setCurrentView('home')} 
            icon={<HomeIcon size={20} />} 
            label="Feed" 
          />
          <NavItem 
            active={currentView === 'alerts'} 
            onClick={() => setCurrentView('alerts')} 
            icon={<Bell size={20} />} 
            label="Alertas" 
            badge={news.filter(n => n.impact === NewsImpact.CRITICAL).length}
          />
          <NavItem 
            active={currentView === 'profile'} 
            onClick={() => setCurrentView('profile')} 
            icon={<User size={20} />} 
            label="Perfil" 
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 transition-all relative group ${active ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`p-1 rounded-lg transition-all ${active ? 'bg-blue-500/10 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'group-hover:scale-105'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
      {label}
    </span>
    {badge && badge > 0 && (
      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

export default App;
