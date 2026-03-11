import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Coins, 
  Plus, 
  Lock, 
  Star, 
  ShoppingBag, 
  TrendingUp, 
  ArrowUpRight, 
  Award 
} from 'lucide-react';

export const MARKETPLACE_ITEMS = [
  { id: 'p1', type: 'prompt', title: 'Cyberpunk Rain', author: 'NeonDreamer', price: 10, rating: 4.9, sales: 124, preview: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=400&h=225', prompt: 'cyberpunk rainy city, neon signs reflecting in puddles, cinematic lighting, 8k' },
  { id: 'p2', type: 'style', title: 'Ghibli Dream', author: 'StudioFan', price: 25, rating: 5.0, sales: 89, preview: 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=400&h=225', prompt: 'studio ghibli animation style, lush green hills, soft sunlight, nostalgic atmosphere' },
  { id: 'p3', type: 'prompt', title: 'Space Odyssey', author: 'Cosmos', price: 15, rating: 4.7, sales: 210, preview: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400&h=225', prompt: 'interstellar space travel, nebula background, realistic spaceship, cinematic scale' },
  { id: 'p4', type: 'style', title: 'Noir Mystery', author: 'Detective', price: 12, rating: 4.8, sales: 56, preview: 'https://images.unsplash.com/photo-1502700807168-484a3e7889d0?auto=format&fit=crop&q=80&w=400&h=225', prompt: 'film noir aesthetic, high contrast black and white, dramatic shadows, moody atmosphere' },
  { id: 'p5', type: 'prompt', title: 'Ancient Ruins', author: 'Explorer', price: 8, rating: 4.6, sales: 342, preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400&h=225', prompt: 'overgrown ancient jungle ruins, mystical lighting, vines and moss, 8k hyper-realistic' },
  { id: 'p6', type: 'style', title: 'Vaporwave 80s', author: 'RetroWave', price: 20, rating: 4.9, sales: 167, preview: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400&h=225', prompt: '80s vaporwave aesthetic, pink and purple grid, retro-futurism, low poly mountains' }
];

interface TradingFloorProps {
  credits: number;
  unlockedItems: string[];
  onUnlock: (itemId: string, price: number) => Promise<void>;
  onBuyCredits: () => void;
  onUsePrompt: (prompt: string) => void;
}

export function TradingFloor({ credits, unlockedItems, onUnlock, onBuyCredits, onUsePrompt }: TradingFloorProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'prompts' | 'styles'>('all');
  const [isUnlocking, setIsUnlocking] = useState<string | null>(null);

  const filteredItems = MARKETPLACE_ITEMS.filter(item => 
    activeCategory === 'all' || 
    (activeCategory === 'prompts' && item.type === 'prompt') || 
    (activeCategory === 'styles' && item.type === 'style')
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">The Trading Floor</h2>
          <p className="text-white/40 text-sm">Trade high-performing prompts and custom styles with the community.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Your Balance</p>
            <p className="text-xl font-bold text-emerald-500 flex items-center gap-2 justify-end">
              <Coins size={18} /> {credits}
            </p>
          </div>
          <button 
            onClick={onBuyCredits}
            className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {(['all', 'prompts', 'styles'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeCategory === cat ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all"
          >
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={item.preview} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  {item.type}
                </span>
              </div>
              {!unlockedItems.includes(item.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setIsUnlocking(item.id);
                      onUnlock(item.id, item.price).finally(() => setIsUnlocking(null));
                    }}
                    disabled={isUnlocking === item.id}
                    className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {isUnlocking === item.id ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    Unlock for {item.price}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-xs text-white/40">by @{item.author}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{item.rating}</span>
                </div>
              </div>

              {unlockedItems.includes(item.id) ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Unlocked Prompt</p>
                  <p className="text-xs text-white/80 font-mono line-clamp-2">{item.prompt}</p>
                  <button 
                    onClick={() => onUsePrompt(item.prompt)}
                    className="w-full py-2 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight size={12} /> Use in AI Lab
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-white/40">
                      <ShoppingBag size={14} />
                      <span className="text-[10px] font-bold">{item.sales}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <TrendingUp size={14} />
                      <span className="text-[10px] font-bold">Trending</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <Coins size={14} /> {item.price}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
            <Award className="text-emerald-500" /> Become a Top Trader
          </h3>
          <p className="text-sm text-white/60">Share your best video prompts and earn VidiCredits every time someone unlocks them.</p>
        </div>
        <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-emerald-50 transition-all flex items-center gap-2">
          <Plus size={20} /> List Your Prompt
        </button>
      </div>
    </div>
  );
}
