import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Play, 
  Pause, 
  Plus, 
  Music, 
  Volume2, 
  CheckCircle2,
  Clock,
  Waves,
  Zap,
  Bell,
  Heart,
  History,
  TrendingUp,
  Sparkles,
  VolumeX,
  Volume1,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SoundEffect {
  id: string;
  name: string;
  category: string;
  duration: string;
  url: string;
  tags: string[];
}

const SFX_LIBRARY: SoundEffect[] = [
  {
    id: 'sfx-1',
    name: 'Cinematic Whoosh',
    category: 'Transitions',
    duration: '0:02',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3',
    tags: ['fast', 'impact', 'cinematic']
  },
  {
    id: 'sfx-2',
    name: 'Deep Bass Impact',
    category: 'Cinematic',
    duration: '0:04',
    url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_7839103210.mp3',
    tags: ['heavy', 'trailer', 'boom']
  },
  {
    id: 'sfx-3',
    name: 'Digital Glitch',
    category: 'UI/Tech',
    duration: '0:01',
    url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_8844762e4f.mp3',
    tags: ['tech', 'error', 'modern']
  },
  {
    id: 'sfx-4',
    name: 'Forest Ambience',
    category: 'Nature',
    duration: '0:30',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1346.mp3',
    tags: ['birds', 'peaceful', 'background']
  },
  {
    id: 'sfx-5',
    name: 'Keyboard Typing',
    category: 'UI/Tech',
    duration: '0:05',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_736636605e.mp3',
    tags: ['office', 'writing', 'mechanical']
  },
  {
    id: 'sfx-6',
    name: 'Thunder Strike',
    category: 'Nature',
    duration: '0:08',
    url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b07d5c31.mp3',
    tags: ['storm', 'loud', 'dramatic']
  },
  {
    id: 'sfx-7',
    name: 'Retro Game Jump',
    category: 'UI/Tech',
    duration: '0:01',
    url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
    tags: ['8-bit', 'fun', 'gaming']
  },
  {
    id: 'sfx-8',
    name: 'Camera Shutter',
    category: 'UI/Tech',
    duration: '0:01',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_447385465e.mp3',
    tags: ['photo', 'click', 'sharp']
  },
  {
    id: 'sfx-9',
    name: 'Ocean Waves',
    category: 'Nature',
    duration: '0:15',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_64b513443f.mp3',
    tags: ['water', 'relaxing', 'beach']
  },
  {
    id: 'sfx-10',
    name: 'Sci-Fi Door',
    category: 'UI/Tech',
    duration: '0:03',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8344762e4f.mp3',
    tags: ['future', 'space', 'mechanical']
  },
  {
    id: 'sfx-11',
    name: 'Rain on Window',
    category: 'Nature',
    duration: '0:20',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_8344762e4f.mp3',
    tags: ['rain', 'cozy', 'ambient']
  },
  {
    id: 'sfx-12',
    name: 'Heartbeat',
    category: 'Cinematic',
    duration: '0:10',
    url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_8844762e4f.mp3',
    tags: ['tension', 'medical', 'slow']
  },
  {
    id: 'sfx-13',
    name: 'Crowd Cheering',
    category: 'Nature',
    duration: '0:08',
    url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_7839103210.mp3',
    tags: ['applause', 'people', 'success']
  },
  {
    id: 'sfx-14',
    name: 'Sword Clash',
    category: 'Transitions',
    duration: '0:02',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3',
    tags: ['metal', 'fight', 'medieval']
  }
];

const CATEGORIES = ['All', 'Cinematic', 'Transitions', 'Nature', 'UI/Tech', 'Favorites'];

interface SoundLibraryProps {
  onNavigate: (nav: any) => void;
}

export function SoundLibrary({ onNavigate }: SoundLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('vidi-sfx-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('vidi-sfx-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [volume, setVolume] = useState(0.7);
  const [showToast, setShowToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    localStorage.setItem('vidi-sfx-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('vidi-sfx-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const filteredSFX = SFX_LIBRARY.filter(sfx => {
    const matchesSearch = sfx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sfx.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeCategory === 'Favorites') {
      return matchesSearch && favorites.includes(sfx.id);
    }
    
    const matchesCategory = activeCategory === 'All' || sfx.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePlay = (sfx: SoundEffect) => {
    if (playingId === sfx.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sfx.url;
        audioRef.current.play().catch(err => console.error("Playback failed:", err));
        setPlayingId(sfx.id);
        
        setHistory(prev => {
          const newHistory = [sfx.id, ...prev.filter(id => id !== sfx.id)].slice(0, 10);
          return newHistory;
        });
      }
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleEnded = () => {
    setPlayingId(null);
  };

  const handleAdd = (id: string) => {
    if (!addedIds.includes(id)) {
      setAddedIds([...addedIds, id]);
      setShowToast('Added to project');
    }
  };

  const handleDownload = async (sfx: SoundEffect) => {
    try {
      setShowToast('Preparing download...');
      const response = await fetch(sfx.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sfx.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowToast('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link if fetch fails (e.g. CORS)
      const link = document.createElement('a');
      link.href = sfx.url;
      link.target = '_blank';
      link.download = `${sfx.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowToast('Opening download link...');
    }
  };

  const handleShare = (sfx: SoundEffect) => {
    navigator.clipboard.writeText(sfx.url);
    setShowToast('Link copied to clipboard');
  };

  return (
    <div className="space-y-8 pb-24">
      <audio ref={audioRef} onEnded={handleEnded} />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            <span>Premium Assets</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight">
            Sound <span className="text-emerald-500 italic font-serif">Library</span>
          </h2>
          <p className="text-white/40 max-w-md">
            Browse through high-fidelity sound effects curated for professional creators.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2">
            <div className="flex items-center gap-2 px-3 border-r border-white/10">
              <Volume2 size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Volume</span>
            </div>
            <button 
              onClick={() => setVolume(v => Math.max(0, v - 0.1))}
              className="p-2 hover:text-emerald-500 transition-colors"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume1 size={18} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500 h-1"
            />
            <button 
              onClick={() => setVolume(v => Math.min(1, v + 0.1))}
              className="p-2 hover:text-emerald-500 transition-colors"
            >
              <Volume2 size={18} />
            </button>
            <span className="text-[10px] font-mono text-emerald-500 w-8 text-center">{Math.round(volume * 100)}%</span>
          </div>

          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search effects, moods, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-emerald-500/50 focus:bg-white/[0.07] outline-none transition-all w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeCategory === category 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              {category === 'Favorites' ? (
                <span className="flex items-center gap-2">
                  <Heart size={14} fill={activeCategory === 'Favorites' ? 'black' : 'none'} />
                  {category}
                </span>
              ) : category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>{SFX_LIBRARY.length} Effects Available</span>
          </div>
          <div className="flex items-center gap-2">
            <History size={14} className="text-blue-500" />
            <span>{history.length} Recently Played</span>
          </div>
        </div>
      </div>

      {/* Recently Played Section */}
      {history.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <History size={14} className="text-emerald-500" /> Recently Played
            </h3>
            <button 
              onClick={() => setHistory([])}
              className="text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-widest"
            >
              Clear History
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {history.slice(0, 5).map(id => {
              const sfx = SFX_LIBRARY.find(s => s.id === id);
              if (!sfx) return null;
              return (
                <motion.div
                  key={`history-${id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 w-56 bg-white/5 border border-white/10 rounded-2xl p-4 group hover:border-emerald-500/30 transition-all cursor-pointer"
                  onClick={() => togglePlay(sfx)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${playingId === id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 group-hover:text-emerald-500'}`}>
                      {playingId === id ? <Pause size={18} /> : <Play size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate group-hover:text-emerald-500 transition-colors">{sfx.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{sfx.duration}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSFX.map((sfx, index) => (
            <motion.div
              key={sfx.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className="group relative bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  playingId === sfx.id ? 'bg-emerald-500 text-black scale-110 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                }`}>
                  {sfx.category === 'Nature' ? <Waves size={24} /> : 
                   sfx.category === 'Transitions' ? <Zap size={24} /> :
                   sfx.category === 'Cinematic' ? <Music size={24} /> : <Bell size={24} />}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleShare(sfx)}
                      className="p-2 rounded-xl text-white/10 hover:text-white/40 hover:bg-white/5 transition-all"
                      title="Share"
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDownload(sfx)}
                      className="p-2 rounded-xl text-white/10 hover:text-white/40 hover:bg-white/5 transition-all"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => toggleFavorite(sfx.id)}
                      className={`p-2 rounded-xl transition-all ${
                        favorites.includes(sfx.id) ? 'text-rose-500 bg-rose-500/10' : 'text-white/10 hover:text-white/40 hover:bg-white/5'
                      }`}
                      title="Favorite"
                    >
                      <Heart size={18} fill={favorites.includes(sfx.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <Clock size={10} /> {sfx.duration}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="font-bold text-lg leading-tight group-hover:text-emerald-500 transition-colors">{sfx.name}</h3>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">{sfx.category}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlay(sfx)}
                  className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-bold text-sm ${
                    playingId === sfx.id 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {playingId === sfx.id ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleDownload(sfx)}
                  className="w-12 h-12 rounded-2xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all duration-300"
                  title="Download SFX"
                >
                  <Download size={20} />
                </button>

                <button
                  onClick={() => handleAdd(sfx.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    addedIds.includes(sfx.id)
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
                      : 'bg-white/5 text-white/20 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                  title="Add to Project"
                >
                  {addedIds.includes(sfx.id) ? <CheckCircle2 size={22} /> : <Plus size={22} />}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                {sfx.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-medium text-white/30 hover:text-white/60 hover:bg-white/10 cursor-default transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>

              {playingId === sfx.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20 overflow-hidden rounded-b-3xl">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSFX.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
            <Search size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">No sound effects found</h3>
            <p className="text-white/40 max-w-xs mx-auto">Try adjusting your search or category.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="text-emerald-500 text-sm font-bold hover:underline"
          >
            Clear all filters
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[60] bg-white text-black px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl"
          >
            {showToast}
          </motion.div>
        )}
        {addedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl"
          >
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
                    <Volume2 size={28} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black">
                    {addedIds.length}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Project Staging</p>
                  <p className="text-lg font-bold">Ready for Timeline</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setAddedIds([])}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-bold text-white/40 hover:text-white transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 sm:flex-none bg-white text-black px-8 py-3 rounded-2xl text-xs font-black hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  Import to Editor
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
