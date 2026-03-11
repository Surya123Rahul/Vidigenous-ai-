import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  History, 
  ShieldCheck, 
  Coins, 
  LogOut, 
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Zap,
  ShoppingBag,
  Mic,
  Volume2,
  Wand2,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  user: any;
  steps: any[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  fastProcessingEnabled: boolean;
  setFastProcessingEnabled: (enabled: boolean) => void;
  usageData: { stats: any[], history: any[] };
  onVoiceClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  steps, 
  activeTab, 
  setActiveTab, 
  onProfileClick,
  onLogout,
  fastProcessingEnabled,
  setFastProcessingEnabled,
  usageData,
  onVoiceClick
}) => {
  const [isPipelineOpen, setIsPipelineOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'use-ai', label: 'Use AI Step', icon: Layers, hasSubmenu: true },
    { id: 'ai-lab', label: 'AI Lab', icon: Sparkles },
    { id: 'smart-graphics', label: 'Smart Graphics', icon: Wand2 },
    { id: 'sound-library', label: 'Sound Library', icon: Volume2 },
    { id: 'trading-floor', label: 'Trading Floor', icon: ShoppingBag },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'api-keys', label: 'API Keys', icon: ShieldCheck },
    { id: 'earnings', label: 'Earnings', icon: Coins },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  ];

  return (
    <aside className="w-72 border-r border-white/10 bg-[#0a0a0a] flex flex-col sticky top-0 h-screen shrink-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="text-black" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter">VidiGenius</span>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div 
          onClick={onProfileClick}
          className="p-6 border-b border-white/10 hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-12 h-12 rounded-xl border-2 border-emerald-500/50 group-hover:scale-105 transition-transform" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{user.name}</h3>
              <p className="text-[10px] text-white/40 truncate">{user.email || user.mobile}</p>
              <div className="flex items-center gap-1 mt-1">
                <Coins size={10} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500">{user.credits} Credits</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {navItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.id === 'use-ai') {
                  setIsPipelineOpen(!isPipelineOpen);
                } else {
                  // Only set active tab if it's a main navigation item
                  const mainNavIds = ['dashboard', 'projects', 'ai-lab', 'smart-graphics', 'sound-library', 'trading-floor', 'privacy-policy'];
                  if (mainNavIds.includes(item.id)) {
                    setActiveTab(item.id);
                  }
                  
                  // Open profile modal for profile-related items
                  const profileNavIds = ['usage', 'history', 'api-keys', 'earnings'];
                  if (profileNavIds.includes(item.id)) {
                    onProfileClick();
                  }
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-emerald-500 text-black' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                isPipelineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
              )}
            </button>

            {item.id === 'use-ai' && (
              <AnimatePresence>
                {isPipelineOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 mt-2 border-l border-white/10 pl-4 space-y-4 py-2"
                  >
                    {steps.map((step, idx) => (
                      <div key={step.id} className="relative">
                        {idx !== steps.length - 1 && (
                          <div className={`absolute left-[7px] top-5 w-[1px] h-6 ${step.status === 'completed' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        )}
                        <div className="flex gap-3">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            step.status === 'completed' ? 'bg-emerald-500 text-black' : 
                            step.status === 'loading' ? 'bg-emerald-500/20 text-emerald-500 animate-pulse' : 
                            'bg-white/5 text-white/20'
                          }`}>
                            {step.status === 'completed' ? <CheckCircle2 size={10} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                          </div>
                          <span className={`text-[11px] font-bold ${step.status === 'pending' ? 'text-white/20' : 'text-white/60'}`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {/* Quick Usage Stats */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Usage</span>
            <Activity size={12} className="text-emerald-500" />
          </div>
          <div className="space-y-2">
            {(() => {
              const apiCalls = usageData.stats.find(s => s.type === 'api_call')?.total || 0;
              const generations = usageData.stats.find(s => s.type === 'generation')?.total || 0;
              
              return (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">API Calls</span>
                      <span className="text-white/60">{apiCalls} / 2000</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min((apiCalls / 2000) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">Generations</span>
                      <span className="text-white/60">{generations} / 100</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((generations / 100) * 100, 100)}%` }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-emerald-500" />
            <span className="text-xs font-bold">Voice Assistant</span>
          </div>
          <button 
            onClick={onVoiceClick}
            className="px-3 py-1 bg-emerald-500 text-black rounded-lg text-[10px] font-bold hover:bg-emerald-400 transition-all"
          >
            Open
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Zap size={16} className={fastProcessingEnabled ? 'text-emerald-500' : 'text-white/20'} />
            <span className="text-xs font-bold">Fast Mode</span>
          </div>
          <button 
            onClick={() => setFastProcessingEnabled(!fastProcessingEnabled)}
            className={`w-10 h-5 rounded-full transition-all relative ${fastProcessingEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <motion.div 
              animate={{ x: fastProcessingEnabled ? 22 : 2 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 text-white/40 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all text-sm font-bold"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
