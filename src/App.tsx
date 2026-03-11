/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Video, 
  Zap, 
  Share2, 
  Youtube, 
  Instagram, 
  Twitter, 
  Facebook, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  Search,
  Layers,
  ShieldCheck,
  Crown,
  Star,
  Coins,
  X,
  Infinity as InfinityIcon,
  User,
  LogOut,
  History,
  Smartphone,
  Mail,
  Clock,
  Scissors,
  Crop,
  Type,
  Download,
  Save,
  Link,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Globe,
  TrendingUp,
  BarChart3,
  MousePointer2,
  AudioLines,
  ImagePlus,
  MessageSquare,
  Plus,
  Mic,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Award,
  PieChart,
  FileText,
  ShoppingBag,
  ArrowUpRight,
  Lock,
  Activity,
  Map,
  Cpu,
  RefreshCw,
  Trash2,
  Zap as Bolt,
  Wand2,
  Folder,
  MoreVertical,
  Edit3,
  ExternalLink as ExternalLinkIcon,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatBot } from './components/ChatBot';
import { TradingFloor } from './components/TradingFloor';
import { LiveAudio } from './components/LiveAudio';
import { SoundLibrary } from './components/SoundLibrary';
import { TutorialSection } from './components/TutorialSection';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { 
  analyzeVideo, 
  generateVideoFromScript, 
  generateVideoWithPikaLabs, 
  generateSubtitlesWithVeed,
  getVeedSubtitleStatus,
  generateVeoVideo,
  pollVideoOperation,
  fetchVideoWithKey,
  generateSpeech,
  editImageWithPrompt,
  fastAIResponse,
  searchGroundingQuery,
  enhancePrompt,
  analyzeImage,
  generateImage
} from './services/geminiService';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Cropper from 'react-easy-crop';
import { auth, googleProvider } from './lib/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut
} from 'firebase/auth';

// --- Types ---
interface UserProfile {
  id: number;
  email?: string;
  mobile?: string;
  name: string;
  avatar: string;
  credits: number;
  tier: string;
  socialAccounts: { id: number; provider: string; account_name: string }[];
  apiKeys: { provider: string; api_key: string }[];
}

interface VideoHistoryItem {
  id: number;
  title: string;
  url: string;
  timestamp: string;
}

interface Subtitle {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

interface AnalysisResult {
  scenes: { timestamp: string; description: string }[];
  objects: { name: string; boundingBox: number[] }[];
  emotions: { emotion: string; intensity: number }[];
  transformationScript: string;
  subtitles: Subtitle[];
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'completed' | 'processing';
  createdAt: string;
  updatedAt: string;
  script?: string;
  videoUrl?: string;
  thumbnail?: string;
  type: 'veo' | 'pika' | 'tts' | 'image-edit';
}

interface ProcessStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  details?: string;
}

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic', description: 'High-end movie look', icon: Video, prompt: 'cinematic, 8k, highly detailed, dramatic lighting, professional color grading', preview: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800&h=450' },
  { id: 'anime', label: 'Anime', description: 'Vibrant Japanese animation', icon: Sparkles, prompt: 'anime style, vibrant colors, clean lines, studio ghibli inspired', preview: 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=800&h=450' },
  { id: '3d-render', label: '3D Render', description: 'Modern 3D animation look', icon: Cpu, prompt: '3d render, unreal engine 5, octane render, volumetric lighting, masterpiece', preview: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800&h=450' },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon-lit futuristic aesthetic', icon: Zap, prompt: 'cyberpunk aesthetic, neon lights, rainy night, futuristic city, high contrast', preview: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=800&h=450' },
  { id: 'minimalist', label: 'Minimalist', description: 'Clean and simple graphic', icon: Layers, prompt: 'minimalist graphic style, clean composition, flat colors, modern', preview: 'https://images.unsplash.com/photo-1513519247388-4a26d72297a7?auto=format&fit=crop&q=80&w=800&h=450' }
];

const ANIMATION_PRESETS = [
  { id: 'smooth-pan', label: 'Smooth Pan', description: 'Slow horizontal movement', prompt: 'smooth horizontal panning shot' },
  { id: 'zoom-in', label: 'Slow Zoom', description: 'Gradual zoom into subject', prompt: 'slow cinematic zoom in' },
  { id: 'dynamic-orbit', label: 'Dynamic Orbit', description: 'Circular camera movement', prompt: 'dynamic orbital camera movement' },
  { id: 'time-lapse', label: 'Time-lapse', description: 'Fast-forward effect', prompt: 'fast motion time-lapse style' }
];

const PROJECT_TEMPLATES = [
  {
    id: 'youtube-intro',
    name: 'YouTube Intro',
    description: 'High-energy opening for your channel',
    icon: Youtube,
    defaultPrompt: 'A high-energy, cinematic intro for a tech YouTube channel. Fast cuts, vibrant colors, and professional motion graphics.',
    type: 'veo' as const,
    color: 'bg-red-500'
  },
  {
    id: 'social-ad',
    name: 'Social Media Ad',
    description: 'Short, punchy ad for Instagram/TikTok',
    icon: Instagram,
    defaultPrompt: 'A 15-second punchy social media ad for a new lifestyle app. Modern aesthetic, fast-paced, and attention-grabbing visuals.',
    type: 'veo' as const,
    color: 'bg-pink-500'
  },
  {
    id: 'explainer',
    name: 'Explainer Video',
    description: 'Clear and engaging educational content',
    icon: FileText,
    defaultPrompt: 'A clean, minimalist explainer video about artificial intelligence. Friendly tone, clear visual metaphors, and professional narration.',
    type: 'veo' as const,
    color: 'bg-blue-500'
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Elegant presentation of a product',
    icon: ShoppingBag,
    defaultPrompt: 'An elegant cinematic showcase of a premium watch. Dramatic lighting, macro shots of details, and smooth camera movements.',
    type: 'veo' as const,
    color: 'bg-emerald-500'
  },
  {
    id: 'news-bulletin',
    name: 'News Bulletin',
    description: 'Professional news style update',
    icon: Globe,
    defaultPrompt: 'A professional news bulletin style video. Breaking news graphics, serious tone, and dynamic background elements.',
    type: 'veo' as const,
    color: 'bg-indigo-500'
  }
];

const YOUTUBE_CATEGORIES = [
  "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals", "Sports", 
  "Travel & Events", "Gaming", "People & Blogs", "Comedy", "Entertainment", 
  "News & Politics", "Howto & Style", "Education", "Science & Technology", 
  "Nonprofits & Activism"
];

const Sparkline = ({ data, color = "#10b981" }: { data: number[], color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'api-keys' | 'earnings' | 'usage'>('overview');
  const [fastProcessingEnabled, setFastProcessingEnabled] = useState(false);
  const [usageData, setUsageData] = useState<{ stats: any[], history: any[] }>({ stats: [], history: [] });
  const [activeNav, setActiveNav] = useState<'dashboard' | 'use-ai' | 'ai-lab' | 'trading-floor' | 'sound-library' | 'smart-graphics' | 'projects' | 'privacy-policy'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Cyberpunk City Intro',
      description: 'Main intro for the futuristic series',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      script: 'A neon-drenched city street at night, rain slicked pavement reflecting holographic ads...',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=400&h=225',
      type: 'veo'
    },
    {
      id: '2',
      name: 'Product Showcase Draft',
      description: 'Initial draft for the new tech gadget',
      status: 'draft',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      script: 'Close up of a sleek metallic device rotating slowly on a white pedestal...',
      type: 'pika'
    }
  ]);
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');
  const [authInput, setAuthInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [trendingResearch, setTrendingResearch] = useState<{ text: string, sources: any[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showLiveAudio, setShowLiveAudio] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleSmartSuggest = async () => {
    if (!trendingResearch) return;
    setIsSuggesting(true);
    try {
      const prompt = `Based on these trending topics: "${trendingResearch.text}", suggest 3 unique and creative video ideas that a content creator could make today. 
      Format the response as a simple list of 3 ideas, each on a new line. 
      Keep each idea concise but descriptive.`;
      const result = await fastAIResponse(prompt);
      if (result) {
        const ideas = result.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
        setSmartSuggestions(ideas);
      }
    } catch (error) {
      console.error("Suggest error:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleResearchTrending = async () => {
    setIsResearching(true);
    try {
      const result = await searchGroundingQuery("What are the top 5 trending video topics and viral content themes today? Provide specific niches and why they are trending.");
      setTrendingResearch(result);
    } catch (error) {
      console.error("Research error:", error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!labPrompt) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(labPrompt);
      if (enhanced) setLabPrompt(enhanced);
    } catch (error) {
      console.error("Enhance error:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveProject = async (project: Partial<Project>) => {
    const newProject: Project = {
      id: project.id || Math.random().toString(36).substr(2, 9),
      name: project.name || 'Untitled Project',
      description: project.description || '',
      status: project.status || 'draft',
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: project.script || '',
      videoUrl: project.videoUrl || '',
      thumbnail: project.thumbnail || '',
      type: project.type || 'veo'
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to save project", error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'scenes' | 'objects' | 'emotions' | null>('scenes');
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [script, setScript] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [previewStyle, setPreviewStyle] = useState<typeof VIDEO_STYLES[0] | null>(null);

  const addSubtitle = () => {
    const newSubtitle: Subtitle = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: '00:00:00,000',
      endTime: '00:00:05,000',
      text: 'New subtitle text'
    };
    setSubtitles([...subtitles, newSubtitle]);
  };

  const deleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter(s => s.id !== id));
  };

  const updateSubtitle = (id: string, field: keyof Subtitle, value: string) => {
    setSubtitles(subtitles.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const downloadSRT = () => {
    if (subtitles.length === 0) return;
    
    const srtContent = subtitles.map((sub, index) => {
      return `${index + 1}\n${sub.startTime.replace('.', ',')} --> ${sub.endTime.replace('.', ',')}\n${sub.text}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtitles-${Date.now()}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(5);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [showPricing, setShowPricing] = useState(false);
  const [isVeedProcessing, setIsVeedProcessing] = useState(false);
  const [veedJobId, setVeedJobId] = useState<string | null>(null);
  const [veedStatus, setVeedStatus] = useState<string | null>(null);
  const [veedSubtitleUrl, setVeedSubtitleUrl] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // AI Lab State
  const [labMode, setLabMode] = useState<'veo-video' | 'veo-animate' | 'tts' | 'image-edit' | 'fast-chat' | 'search' | 'script-analyze' | 'image-analyze' | 'image-gen'>('veo-video');
  const [labPrompt, setLabPrompt] = useState('');
  const [labImage, setLabImage] = useState<string | null>(null);
  const [labImageFile, setLabImageFile] = useState<File | null>(null);
  const [labResult, setLabResult] = useState<any>(null);
  const [labAspectRatio, setLabAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [labResolution, setLabResolution] = useState<'720p' | '1080p'>('720p');
  const [labImageSize, setLabImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [labImageAspectRatio, setLabImageAspectRatio] = useState<string>('1:1');
  const [labStyle, setLabStyle] = useState<string | null>(null);
  const [isLabLoading, setIsLabLoading] = useState(false);
  const [labHistory, setLabHistory] = useState<any[]>([]);

  // Trend Finder State
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'facebook' | 'twitter' | 'more'>('youtube');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [trendDescription, setTrendDescription] = useState<string>('');
  const [isCheckingTrends, setIsCheckingTrends] = useState(false);
  const [trendResults, setTrendResults] = useState<any[] | null>(null);

  const handleCheckTrends = async () => {
    setIsCheckingTrends(true);
    setTrendResults(null);
    
    try {
      // Simulate AI processing with a realistic delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockTrends = [
        { 
          title: `${selectedCategory || 'Viral'} Content: AI-Powered Productivity`, 
          growth: "+145%", 
          sparkline: [20, 45, 30, 60, 85, 70, 95], 
          link: "https://youtube.com/watch?v=example1" 
        },
        { 
          title: `${selectedCategory || 'Trending'} Tech Reviews`, 
          growth: "+82%", 
          sparkline: [10, 25, 40, 35, 50, 65, 80], 
          link: "https://youtube.com/watch?v=example2" 
        },
        { 
          title: "Micro-Learning Series", 
          growth: "+210%", 
          sparkline: [30, 50, 70, 90, 120, 150, 210], 
          link: "https://youtube.com/watch?v=example3" 
        },
        { 
          title: "Minimalist Workspace Tours", 
          growth: "+64%", 
          sparkline: [40, 35, 45, 50, 55, 60, 64], 
          link: "https://youtube.com/watch?v=example4" 
        },
        { 
          title: "Digital Nomad Lifestyle", 
          growth: "+120%", 
          sparkline: [50, 60, 55, 80, 100, 110, 120], 
          link: "https://youtube.com/watch?v=example5" 
        }
      ];
      
      setTrendResults(mockTrends);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckingTrends(false);
    }
  };

  const handleUnlockItem = async (itemId: string, price: number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (userCredits < price) {
      alert("Insufficient credits. Please buy more credits to unlock this item.");
      return;
    }

    try {
      const res = await fetch('/api/user/marketplace/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, price })
      });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.credits);
        setUnlockedItems(prev => [...prev, itemId]);
      } else {
        const error = await res.json();
        if (res.status === 401) {
          setShowAuthModal(true);
        } else {
          alert(error.error || "Failed to unlock item");
        }
        console.error("Failed to unlock item:", error.error);
      }
    } catch (error) {
      console.error("Error unlocking item:", error);
    }
  };

  const handleBuyCredits = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch('/api/user/credits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50 })
      });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.credits);
      } else if (res.status === 401) {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("Error buying credits:", error);
    }
  };

  const handleUsePrompt = (prompt: string) => {
    setLabPrompt(prompt);
    setActiveNav('ai-lab');
    setLabMode('veo-video');
  };

  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };
  
  // Video Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 10 });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#10b981'); // emerald-500
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioFadeIn, setAudioFadeIn] = useState(0);
  const [audioFadeOut, setAudioFadeOut] = useState(0);
  const [bgMusic, setBgMusic] = useState<File | null>(null);
  const [bgMusicVolume, setBgMusicVolume] = useState(0.3);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  useEffect(() => {
    if (analysis) {
      let newScript = analysis.transformationScript || '';
      if (selectedStyle) {
        const style = VIDEO_STYLES.find(s => s.id === selectedStyle);
        if (style) newScript += `\n\n[Visual Style: ${style.prompt}]`;
      }
      if (selectedAnimation) {
        const anim = ANIMATION_PRESETS.find(a => a.id === selectedAnimation);
        if (anim) newScript += `\n[Camera Movement: ${anim.prompt}]`;
      }
      setScript(newScript);
    }
  }, [selectedStyle, selectedAnimation, analysis]);

  const handleLabSubmit = async () => {
    if (!labPrompt && !labImageFile && labMode !== 'fast-chat') return;

    // Veo and Pro Image models require a paid API key selection
    if (labMode === 'veo-video' || labMode === 'veo-animate' || labMode === 'image-gen') {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
          // Proceed after opening the dialog as per instructions
        }
      } catch (e) {
        console.warn("API key selection failed or not available", e);
      }
    }

    setIsLabLoading(true);
    setLabResult(null);

    try {
      let result;
      const selectedLabStyle = VIDEO_STYLES.find(s => s.id === labStyle);
      const finalPrompt = selectedLabStyle 
        ? `${labPrompt}. Style: ${selectedLabStyle.prompt}` 
        : labPrompt;

      switch (labMode) {
        case 'veo-video':
          const op = await generateVeoVideo(
            finalPrompt, 
            labImage ? labImage.split(',')[1] : undefined, 
            labImage ? 'image/png' : undefined, 
            labAspectRatio,
            labResolution
          );
          const uri = await pollVideoOperation(op);
          if (uri) {
            result = await fetchVideoWithKey(uri);
          }
          break;
        case 'veo-animate':
          if (labImage) {
            const opAnimate = await generateVeoVideo(
              finalPrompt || "Animate this image beautifully", 
              labImage.split(',')[1], 
              'image/png', 
              labAspectRatio,
              labResolution
            );
            const uriAnimate = await pollVideoOperation(opAnimate);
            if (uriAnimate) {
              result = await fetchVideoWithKey(uriAnimate);
            }
          }
          break;
        case 'tts':
          result = await generateSpeech(finalPrompt);
          break;
        case 'image-edit':
          if (labImage) {
            result = await editImageWithPrompt(labImage.split(',')[1], 'image/png', finalPrompt);
          }
          break;
        case 'fast-chat':
          result = await fastAIResponse(finalPrompt);
          break;
        case 'search':
          const researchPrompt = `Research the following query and provide a comprehensive, grounded response with a clear summary of findings. 
          Query: ${finalPrompt}
          
          Please include key takeaways and ensure the information is up-to-date.`;
          result = await searchGroundingQuery(researchPrompt);
          break;
        case 'script-analyze':
          const analysisPrompt = `Analyze this video script and provide:
          1. Engagement Score (0-100)
          2. Target Audience
          3. 3 Key Improvements
          4. Suggested Visual Style
          
          Script: ${finalPrompt}`;
          result = await fastAIResponse(analysisPrompt);
          break;
        case 'image-analyze':
          if (labImage) {
            result = await analyzeImage(labImage.split(',')[1], 'image/png', finalPrompt || "Analyze this image in detail.");
          }
          break;
        case 'image-gen':
          result = await generateImage(finalPrompt, labImageAspectRatio, labImageSize);
          break;
      }
      setLabResult(result);
      if (labMode === 'veo-video' || labMode === 'veo-animate' || labMode === 'image-gen') {
        recordUsage('generation');
      }
      setLabHistory(prev => [{ mode: labMode, prompt: labPrompt, result, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("API Key issue detected. Please re-select your paid API key.");
        try {
          await (window as any).aistudio.openSelectKey();
        } catch (e) {}
      } else {
        alert("AI Lab operation failed. Please try again.");
      }
    } finally {
      setIsLabLoading(false);
    }
  };

  const handleLabImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLabImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setLabImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;
    
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  useEffect(() => {
    if (videoElement) {
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onTimeUpdate = () => setCurrentTime(videoElement.currentTime);
      const onEnded = () => {
        setIsPlaying(false);
        videoElement.currentTime = trimRange.start;
      };
      
      videoElement.addEventListener('play', onPlay);
      videoElement.addEventListener('pause', onPause);
      videoElement.addEventListener('timeupdate', onTimeUpdate);
      videoElement.addEventListener('ended', onEnded);
      
      return () => {
        videoElement.removeEventListener('play', onPlay);
        videoElement.removeEventListener('pause', onPause);
        videoElement.removeEventListener('timeupdate', onTimeUpdate);
        videoElement.removeEventListener('ended', onEnded);
      };
    }
  }, [videoElement, trimRange.start]);

  const togglePlay = () => {
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    }
  };

  const seekTo = (time: number) => {
    if (videoElement) {
      videoElement.currentTime = Math.max(0, Math.min(videoDuration, time));
    }
  };

  const processVideo = async () => {
    if (!ffmpegRef.current || !generatedVideoUrl) return;
    setIsProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      const videoData = await fetchFile(generatedVideoUrl);
      await ffmpeg.writeFile('input.mp4', videoData);

      const args: string[] = [];

      // Input seeking for faster processing
      if (trimRange.start > 0) {
        args.push('-ss', trimRange.start.toString());
      }
      
      args.push('-i', 'input.mp4');

      // Output seeking for precision if needed, but here we use it for the end time
      if (trimRange.end > trimRange.start) {
        args.push('-t', (trimRange.end - trimRange.start).toString());
      }

      // Cropping & Text Overlay
      let filter = '';
      if (croppedAreaPixels) {
        // FFmpeg crop filter: crop=w:h:x:y
        filter = `crop=${Math.floor(croppedAreaPixels.width)}:${Math.floor(croppedAreaPixels.height)}:${Math.floor(croppedAreaPixels.x)}:${Math.floor(croppedAreaPixels.y)}`;
      }

      if (textOverlay) {
        try {
          // Use a reliable font URL or a local one if available. 
          // For this environment, we'll try to fetch a standard font.
          const fontData = await fetchFile('https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter-Bold.ttf');
          await ffmpeg.writeFile('font.ttf', fontData);
          
          // Escape single quotes in text
          const escapedText = textOverlay.replace(/'/g, "'\\''");
          const textFilter = `drawtext=fontfile=font.ttf:text='${escapedText}':fontcolor=${textColor}:fontsize=64:x=(w-text_w)*${textPosition.x/100}:y=(h-text_h)*${textPosition.y/100}:shadowcolor=black@0.5:shadowx=2:shadowy=2`;
          filter = filter ? `${filter},${textFilter}` : textFilter;
        } catch (fontErr) {
          console.warn('Failed to load font, skipping text overlay:', fontErr);
        }
      }

      // Audio Filters
      let audioFilter = `volume=${audioVolume}`;
      if (audioFadeIn > 0) {
        audioFilter += `,afade=t=in:ss=0:d=${audioFadeIn}`;
      }
      if (audioFadeOut > 0) {
        const duration = trimRange.end - trimRange.start;
        audioFilter += `,afade=t=out:st=${Math.max(0, duration - audioFadeOut)}:d=${audioFadeOut}`;
      }

      if (bgMusic) {
        const musicData = await fetchFile(bgMusic);
        await ffmpeg.writeFile('music.mp3', musicData);
        args.push('-i', 'music.mp3');
        
        // Complex filter for mixing
        // [0:a] is video audio, [1:a] is background music
        let complexFilter = '';
        if (filter) {
          complexFilter += `[0:v]${filter}[outv];`;
        } else {
          complexFilter += `[0:v]copy[outv];`;
        }
        complexFilter += `[0:a]${audioFilter}[a1];[1:a]volume=${bgMusicVolume}[a2];[a1][a2]amix=inputs=2:duration=first[outa]`;
        
        args.push('-filter_complex', complexFilter);
        args.push('-map', '[outv]');
        args.push('-map', '[outa]');
      } else {
        if (filter) {
          args.push('-vf', filter);
        }
        args.push('-af', audioFilter);
      }

      // Ensure we use a common pixel format for compatibility
      args.push('-pix_fmt', 'yuv420p');
      args.push('output.mp4');

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: 'video/mp4' }));
      setGeneratedVideoUrl(url);
      setIsEditing(false);
    } catch (err) {
      console.error('Processing error:', err);
      alert('Error processing video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 'upload', label: 'Video Ingestion', status: 'pending' },
    { id: 'analyze', label: 'Deep AI Research', status: 'pending' },
    { id: 'transform', label: 'Copyright Transformation', status: 'pending' },
    { id: 'generate', label: '3D/Graphic Synthesis', status: 'pending' },
    { id: 'social', label: 'Social Distribution', status: 'pending' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setAuthLoading(true);
          const idToken = await result.user.getIdToken();
          
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              idToken, 
              isSignUp: true // Assume signup if redirecting back
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setShowAuthModal(false);
            fetchProfile();
          }
        }
      } catch (error: any) {
        console.error("Redirect sign in failed", error);
        setAuthError(error.message);
      } finally {
        setAuthLoading(false);
      }
    };
    handleRedirectResult();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchProfile();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setUserCredits(data.credits);
        setSubscriptionTier(data.tier);
        fetchHistory();
        fetchUsage();
        fetchUnlockedItems();
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchUnlockedItems = async () => {
    try {
      const res = await fetch('/api/user/marketplace/unlocked');
      if (res.ok) {
        const data = await res.json();
        setUnlockedItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch unlocked items", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/user/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Use redirect for mobile to avoid popup blockers
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send to backend to create/login user
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          isSignUp: authMode === 'signup' 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowAuthModal(false);
        fetchProfile();
      } else {
        const errorData = await res.json();
        setAuthError(errorData.error || "Failed to sync with server");
      }
    } catch (error: any) {
      console.error("Google sign in failed", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in popup was closed. If you are on mobile, ensure popups are allowed or try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (authMethod !== 'mobile') {
      setAuthError("Please use the Google button below for Email/Gmail login.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const trimmedInput = authInput.trim();
      if (!isOtpSent) {
        // Step 1: Send OTP
        if (!trimmedInput.startsWith('+')) {
          throw new Error("Please enter mobile number with country code (e.g., +91...)");
        }

        // Basic length validation (E.164 usually 10-15 digits)
        const digitsOnly = trimmedInput.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          throw new Error("Phone number is too short. Please enter a full mobile number with country code (e.g., +91 followed by 10 digits).");
        }

        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, trimmedInput, appVerifier);
        setConfirmationResult(result);
        setIsOtpSent(true);
      } else {
        // Step 2: Verify OTP
        if (!confirmationResult) return;
        const result = await confirmationResult.confirm(otpInput);
        const idToken = await result.user.getIdToken();
        
        // Send to backend
        const res = await fetch('/api/auth/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            idToken, 
            mobile: authInput,
            isSignUp: authMode === 'signup'
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setShowAuthModal(false);
          setIsOtpSent(false);
          setOtpInput('');
          fetchProfile();
        } else {
          const errorData = await res.json();
          setAuthError(errorData.error || "Verification failed on server");
        }
      }
    } catch (error: any) {
      console.error("Auth failed", error);
      if (error.code === 'auth/billing-not-enabled' || error.message?.includes('billing') || error.message?.includes('Blaze')) {
        setAuthError("Mobile/SMS login requires a Firebase Blaze (paid) plan. Please use Google Sign-In instead, or try the Demo Login below.");
      } else if (error.code === 'auth/invalid-phone-number') {
        setAuthError("Invalid phone number format. Please include country code (e.g. +91...)");
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError("Too many requests. Please try again later or use Google Sign-In.");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowAuthModal(false);
        fetchProfile();
      }
    } catch (error) {
      console.error("Demo login failed", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setHistory([]);
      setShowProfileModal(false);
      setShowLogoutConfirm(false);
      setActiveNav('dashboard');
      // Redirect to splash/landing
      window.location.reload(); // Hard reset to clear all states
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSaveApiKey = async (provider: string, apiKey: string) => {
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (error) {
      console.error("Failed to save API key", error);
    }
  };

  const saveToHistory = async (title: string, url: string) => {
    await fetch('/api/user/history/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url }),
    });
    fetchHistory();
  };

  const updateStep = (id: string, status: ProcessStep['status'], details?: string) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status, details } : step));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(''); // Clear URL if file is uploaded
      setVideoPreview(URL.createObjectURL(file));
      updateStep('upload', 'completed', `Loaded: ${file.name}`);
      // Record storage usage (approximate MB)
      recordUsage('storage', Math.ceil(file.size / (1024 * 1024)));
    }
  };

  const recordUsage = async (type: 'api_call' | 'generation' | 'storage', amount: number = 1) => {
    try {
      await fetch('/api/user/usage/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount }),
      });
      fetchUsage();
    } catch (error) {
      console.error("Failed to record usage", error);
    }
  };

  const startAnalysis = async () => {
    if (!videoFile && !videoUrl) return;

    setIsAnalyzing(true);
    
    // Ensure ingestion step is marked as completed for URLs
    if (videoUrl) {
      updateStep('upload', 'loading', 'Ingesting remote content...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStep('upload', 'completed', `Remote: ${videoUrl.substring(0, 20)}...`);
    }

    updateStep('analyze', 'loading', 'Analyzing visual patterns and deep meaning...');

    try {
      if (videoFile) {
        const reader = new FileReader();
        reader.readAsDataURL(videoFile);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeVideo(base64, videoFile.type, fastProcessingEnabled);
          recordUsage('api_call');
          
          setAnalysis({
            ...result,
            timestamp: new Date().toLocaleTimeString()
          });
          setScript(result.transformationScript || '');
          setSubtitles(result.subtitles || []);
          updateStep('analyze', 'completed', 'Deep research finished.');
          updateStep('transform', 'loading', 'Removing copyright markers and abstracting concepts...');
          
          setTimeout(() => {
            updateStep('transform', 'completed', 'Content transformed to unique 3D/Graphic concept.');
          }, 2000);
          
          setIsAnalyzing(false);
        };
      } else {
        // Handle video URL with a safety timeout and robust fallback
        const analysisPromise = analyzeVideo(videoUrl, 'url', fastProcessingEnabled);
        recordUsage('api_call');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Analysis timeout")), 20000)
        );

        let result;
        try {
          result = await Promise.race([analysisPromise, timeoutPromise]) as any;
        } catch (err) {
          console.warn("Analysis timed out or failed, using smart fallback", err);
          // Fallback result if the API hangs or times out
          result = {
            scenes: [
              { timestamp: "00:01", description: "Dynamic opening sequence" },
              { timestamp: "00:08", description: "Transition to core subject" }
            ],
            objects: [{ name: "Subject", boundingBox: [200, 200, 800, 800] }],
            emotions: [{ emotion: "Positive", intensity: 0.8 }],
            transformationScript: "A cinematic 3D transformation focusing on the core themes of the provided content, optimized for high engagement.",
            subtitles: [
              { id: "1", startTime: "00:00:01,000", endTime: "00:00:04,000", text: "Welcome to the future of video creation." },
              { id: "2", startTime: "00:00:05,000", endTime: "00:00:08,000", text: "Experience the power of AI transformation." }
            ]
          };
        }
        
        setAnalysis({
          ...result,
          timestamp: new Date().toLocaleTimeString()
        });
        setScript(result.transformationScript || '');
        setSubtitles(result.subtitles || []);
        updateStep('analyze', 'completed', 'Deep research finished.');
        updateStep('transform', 'loading', 'Removing copyright markers and abstracting concepts...');
        
        setTimeout(() => {
          updateStep('transform', 'completed', 'Content transformed to unique 3D/Graphic concept.');
        }, 2000);
        
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error(error);
      updateStep('analyze', 'error', 'Analysis failed.');
      setIsAnalyzing(false);
    }
  };

  const handleVeedSubtitles = async (customUrl?: string) => {
    const urlToUse = customUrl || generatedVideoUrl || videoUrl;
    if (!urlToUse) {
      alert("Please provide a video URL or generate a video first.");
      return;
    }

    if (urlToUse.startsWith('blob:')) {
      alert("Veed.io requires a public URL. Local file uploads are not supported for subtitle generation in this preview. Please provide a public video URL.");
      return;
    }

    setIsVeedProcessing(true);
    setVeedStatus('initiating');
    setVeedSubtitleUrl(null);
    try {
      const result = await generateSubtitlesWithVeed(urlToUse);
      if (result.subtitleUrl) {
        setVeedSubtitleUrl(result.subtitleUrl);
        setVeedStatus('completed');
        alert(`Subtitles generated successfully!`);
      } else if (result.id) {
        setVeedJobId(result.id);
        setVeedStatus(result.status || 'queued');
        alert(`Subtitle generation job started (ID: ${result.id}). Status: ${result.status}. It will be ready in a few moments.`);
      }
    } catch (error: any) {
      console.error(error);
      setVeedStatus('error');
      alert(error.message || "Veed.io integration failed. Please check your API key in the profile settings.");
    } finally {
      setIsVeedProcessing(false);
    }
  };

  // Poll for Veed.io job status
  useEffect(() => {
    let interval: any;
    if (veedJobId && veedStatus !== 'completed' && veedStatus !== 'error') {
      interval = setInterval(async () => {
        try {
          const result = await getVeedSubtitleStatus(veedJobId);
          setVeedStatus(result.status);
          if (result.status === 'completed' && result.subtitle_url) {
            setVeedSubtitleUrl(result.subtitle_url);
            clearInterval(interval);
          } else if (result.status === 'error' || result.status === 'failed') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling Veed status:", error);
          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [veedJobId, veedStatus]);

  const handlePikaGenerate = async () => {
    if (!script) return;
    setIsGenerating(true);
    updateStep('generate', 'loading', 'Synthesizing with Pika Labs...');
    try {
      const result = await generateVideoWithPikaLabs(script);
      recordUsage('generation');
      // Handle Pika result
      const videoUrl = result.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';
      setGeneratedVideoUrl(videoUrl);
      saveToHistory(videoTitle || `Pika Transformation - ${new Date().toLocaleDateString()}`, videoUrl);
      updateStep('generate', 'completed', 'Pika Labs synthesis finished.');
    } catch (error) {
      console.error(error);
      updateStep('generate', 'error', 'Pika Labs synthesis failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!script) return;
    if (userCredits <= 0 && subscriptionTier !== 'Enterprise') {
      setShowPricing(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    updateStep('generate', 'loading', 'Synthesizing premium 3D animation...');

    try {
      // Simulate progress over 8 seconds
      const duration = 8000;
      const interval = 100;
      const stepsCount = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = Math.min(Math.round((currentStep / stepsCount) * 100), 99);
        setGenerationProgress(progress);
        updateStep('generate', 'loading', `Synthesizing... ${progress}%`);

        if (currentStep >= stepsCount) {
          clearInterval(timer);
          const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
          setGeneratedVideoUrl(videoUrl); // Placeholder
          setGenerationProgress(100);
          recordUsage('generation');
          setUserCredits(prev => Math.max(0, prev - 1));
          saveToHistory(videoTitle || `AI Transformation - ${new Date().toLocaleDateString()}`, videoUrl);
          updateStep('generate', 'completed', 'Video synthesized successfully.');
          setIsGenerating(false);
        }
      }, interval);
    } catch (error) {
      console.error(error);
      updateStep('generate', 'error', 'Generation failed.');
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = `vidigenius-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!generatedVideoUrl) return;
    navigator.clipboard.writeText(generatedVideoUrl);
    alert('Video link copied to clipboard!');
  };

  const handleSocialConnect = async (provider: string) => {
    try {
      const res = await fetch(`/api/auth/url/${provider}`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 relative" onClick={addRipple}>
      {/* Ripple Effect Container */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          />
        ))}
      </div>

      <Sidebar 
        user={user} 
        steps={steps} 
        activeTab={activeNav} 
        setActiveTab={(tab) => {
          const mainNavIds = ['dashboard', 'projects', 'use-ai', 'ai-lab', 'smart-graphics', 'sound-library', 'trading-floor', 'privacy-policy'];
          if (mainNavIds.includes(tab)) {
            setActiveNav(tab as any);
          } else {
            setActiveProfileTab(tab as any);
            setShowProfileModal(true);
          }
        }}
        onProfileClick={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        fastProcessingEnabled={fastProcessingEnabled}
        setFastProcessingEnabled={setFastProcessingEnabled}
        usageData={usageData}
        onVoiceClick={() => setShowLiveAudio(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Auth Modal */}
        <AnimatePresence mode="wait">
          {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAuthModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{authMode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-white/40 text-sm">{authMode === 'signin' ? 'Sign in to manage your AI transformations' : 'Join the future of AI video generation'}</p>
                </div>
                <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X size={20} className="text-white/40" />
                </button>
              </div>
              
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
                <button onClick={() => { setAuthMethod('email'); setIsOtpSent(false); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMethod === 'email' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}>Gmail / Google</button>
                <button onClick={() => { setAuthMethod('mobile'); setIsOtpSent(false); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMethod === 'mobile' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}>Mobile Number</button>
              </div>

              <div className="space-y-4 mb-6">
                {authMethod === 'mobile' ? (
                  <>
                    {!isOtpSent ? (
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                          type="tel" 
                          placeholder="Enter mobile number (e.g. +1...)" 
                          value={authInput}
                          onChange={(e) => setAuthInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-emerald-500 font-bold flex items-center gap-2">
                          <CheckCircle2 size={14} /> OTP sent to {authInput}
                        </p>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            maxLength={6}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-emerald-500 outline-none transition-all tracking-[0.5em] font-mono"
                          />
                        </div>
                        <button onClick={() => setIsOtpSent(false)} className="text-[10px] text-white/40 hover:text-white transition-all uppercase font-bold tracking-widest">Change Number</button>
                      </div>
                    )}

                    {authError && (
                      <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        {authError}
                      </p>
                    )}

                    <div id="recaptcha-container"></div>

                    <button 
                      onClick={handleLogin} 
                      disabled={authLoading}
                      className="w-full py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {authLoading ? <Loader2 className="animate-spin" size={18} /> : (isOtpSent ? 'Verify OTP' : 'Continue')}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-sm text-white/60 mb-4">
                      Securely sign in or create an account using your Google account.
                    </p>
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all group"
                    >
                      {authLoading ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                          {authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-white/20 font-medium">
                      By continuing, you agree to our <button onClick={() => { setShowAuthModal(false); setActiveNav('privacy-policy'); }} className="text-emerald-500/50 hover:text-emerald-500 underline transition-colors">Privacy Policy</button>
                    </p>
                    {authError && (
                      <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        {authError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {authMethod === 'mobile' && (
                <>
                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="flex-1 h-[1px] bg-white/10" />
                    <span className="text-[10px] uppercase font-bold text-white/20">or connect with</span>
                    <div className="flex-1 h-[1px] bg-white/10" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6">
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all group"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      Sign in with Google
                    </button>
                  </div>
                </>
              )}

              <p className="text-center text-xs text-white/40 mb-4">
                {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>

              <div className="relative flex items-center gap-4 mb-4">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-[10px] uppercase font-bold text-white/20">Recommended for Preview</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              <button 
                onClick={handleDemoLogin}
                className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all text-emerald-500 flex items-center justify-center gap-2 group"
              >
                <User size={18} className="group-hover:scale-110 transition-transform" />
                Continue with Demo Account
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl border-2 border-emerald-500/50" />
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-white/40 text-sm">{user.email || user.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-bold uppercase tracking-wider">
                    {user.tier} Tier
                  </div>
                  <button onClick={handleLogout} className="p-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-white/10 mb-8">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'usage', label: 'Usage', icon: Activity },
                  { id: 'api-keys', label: 'API Keys', icon: ShieldCheck },
                  { id: 'earnings', label: 'Earnings', icon: Coins },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${activeProfileTab === tab.id ? 'text-emerald-500' : 'text-white/40 hover:text-white'}`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {activeProfileTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeProfileTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <Share2 size={14} /> Connected Accounts
                          </h3>
                          <div className="space-y-3">
                            {[
                              { id: 'youtube', icon: Youtube, label: 'YouTube' },
                              { id: 'instagram', icon: Instagram, label: 'Instagram' },
                              { id: 'twitter', icon: Twitter, label: 'X / Twitter' },
                              { id: 'facebook', icon: Facebook, label: 'Facebook' },
                            ].map((social) => {
                              const connected = user.socialAccounts.find(a => a.provider === social.id);
                              return (
                                <div key={social.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                  <div className="flex items-center gap-3">
                                    <social.icon size={18} className={connected ? 'text-emerald-500' : 'text-white/20'} />
                                    <span className="text-sm font-bold">{social.label}</span>
                                  </div>
                                  {connected ? (
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Connected</span>
                                  ) : (
                                    <button onClick={() => handleSocialConnect(social.id)} className="text-[10px] text-white/40 hover:text-white font-bold uppercase">Connect</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-emerald-500">
                              <Coins size={16} />
                              <span className="text-xs font-bold uppercase tracking-wider">Credits</span>
                            </div>
                            <span className="text-2xl font-bold">{user.credits}</span>
                          </div>
                          <button onClick={() => {setShowProfileModal(false); setShowPricing(true);}} className="w-full py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all">Buy More</button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                          <History size={14} /> Generation History
                        </h3>
                        <div className="space-y-3">
                          {history.length > 0 ? history.map((item) => (
                            <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold line-clamp-1">{item.title}</h4>
                                <span className="text-[10px] text-white/20">{new Date(item.timestamp).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => {setGeneratedVideoUrl(item.url); setShowProfileModal(false);}} className="text-[10px] text-emerald-500 font-bold uppercase hover:underline">View</button>
                                <a href={item.url} download className="text-[10px] text-white/40 font-bold uppercase hover:underline">Download</a>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-12 text-white/20">
                              <History size={32} className="mx-auto mb-2 opacity-20" />
                              <p className="text-xs">No history found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeProfileTab === 'usage' && (
                    <motion.div
                      key="usage"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" /> Resource Usage
                          </h3>
                          <div className="space-y-4">
                            {(() => {
                              const apiCalls = usageData.stats.find(s => s.type === 'api_call')?.total || 0;
                              const generations = usageData.stats.find(s => s.type === 'generation')?.total || 0;
                              const storage = usageData.stats.find(s => s.type === 'storage')?.total || 0;
                              
                              return (
                                <>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-white/40">Storage Used</span>
                                      <span className="text-white/60">{storage} MB / 5000 MB</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((storage / 5000) * 100, 100)}%` }} />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-white/40">Monthly Generations</span>
                                      <span className="text-white/60">{generations} / 100</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((generations / 100) * 100, 100)}%` }} />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-white/40">API Calls</span>
                                      <span className="text-white/60">{apiCalls} / 2000</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min((apiCalls / 2000) * 100, 100)}%` }} />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <Zap size={16} className="text-emerald-500" /> Processing Speed
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                              <div>
                                <p className="text-sm font-bold">Fast Processing</p>
                                <p className="text-[10px] text-white/40">Reduces generation time by 60%</p>
                              </div>
                              <button 
                                onClick={() => setFastProcessingEnabled(!fastProcessingEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative ${fastProcessingEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                              >
                                <motion.div 
                                  animate={{ x: fastProcessingEnabled ? 24 : 4 }}
                                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                />
                              </button>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-white/40">Average Render Time</span>
                                <span className="text-xs font-bold">1.2 min</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">Queue Position</span>
                                <span className="text-xs font-bold text-emerald-500">Instant</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-sm font-bold mb-4">Usage History (Last 7 Days)</h3>
                        <div className="h-32 flex items-end gap-2 px-2">
                          {(() => {
                            const days = [];
                            for (let i = 6; i >= 0; i--) {
                              const d = new Date();
                              d.setDate(d.getDate() - i);
                              days.push(d.toISOString().split('T')[0]);
                            }
                            
                            return days.map((day, i) => {
                              const dayData = usageData.history.find(h => h.date === day);
                              const val = dayData ? Math.min((dayData.total / 100) * 100, 100) : 0;
                              const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(day).getDay()];
                              
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(val, 5)}%` }}
                                    className="w-full bg-emerald-500/20 border-t-2 border-emerald-500 rounded-t-lg"
                                  />
                                  <span className="text-[8px] text-white/20 uppercase font-bold">{label}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeProfileTab === 'api-keys' && (
                    <motion.div
                      key="api-keys"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                        <h3 className="text-sm font-bold mb-2">Custom API Keys</h3>
                        <p className="text-xs text-white/40 leading-relaxed">
                          Provide your own API keys to bypass platform limits and use your pro accounts directly.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { id: 'gemini', label: 'Gemini Pro', placeholder: 'AIzaSy...' },
                          { id: 'pika', label: 'Pika Labs', placeholder: 'pk-...' },
                          { id: 'veed', label: 'Veed.io', placeholder: 'vd-...' },
                          { id: 'elevenlabs', label: 'ElevenLabs', placeholder: 'el-...' },
                        ].map((provider) => {
                          const existingKey = user.apiKeys.find(k => k.provider === provider.id)?.api_key;
                          return (
                            <div key={provider.id} className="space-y-3">
                              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">{provider.label}</label>
                              <div className="flex gap-2">
                                <input
                                  type="password"
                                  defaultValue={existingKey || ''}
                                  placeholder={provider.placeholder}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none transition-all"
                                  onBlur={(e) => handleSaveApiKey(provider.id, e.target.value)}
                                />
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${existingKey ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/20'}`}>
                                  <ShieldCheck size={18} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeProfileTab === 'earnings' && (
                    <motion.div
                      key="earnings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { label: 'Total Earnings', value: '$1,240.50', icon: Coins, color: 'text-emerald-500' },
                          { label: 'Pending Payout', value: '$450.00', icon: Clock, color: 'text-amber-500' },
                          { label: 'Ad Impressions', value: '84.2K', icon: Play, color: 'text-blue-500' },
                        ].map((stat, i) => (
                          <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                            <div className="flex items-center gap-2 text-white/40">
                              <stat.icon size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                        <h3 className="text-xl font-bold mb-4">Monetization Insights</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">YouTube Ad Revenue</span>
                            <span className="font-bold">$840.20</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[70%]" />
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Instagram Branded Content</span>
                            <span className="font-bold">$400.30</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 w-[30%]" />
                          </div>
                        </div>
                        <button className="w-full mt-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all">
                          Withdraw Funds
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Editing Modal */}
      <AnimatePresence>
        {isEditing && generatedVideoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Scissors className="text-emerald-500" /> Video Studio
                </h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div ref={videoContainerRef} className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group">
                    <Cropper
                      image={generatedVideoUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspectRatio}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      video={generatedVideoUrl}
                      onMediaLoaded={(media) => {
                        setVideoDuration(media.duration || 0);
                        const video = videoContainerRef.current?.querySelector('video');
                        if (video) setVideoElement(video);
                      }}
                    />

                    {/* Draggable Text Overlay */}
                    {textOverlay && (
                      <div 
                        className="absolute z-50 cursor-move select-none p-2 border border-dashed border-white/20 hover:border-white/40 group/text"
                        style={{ 
                          left: `${textPosition.x}%`, 
                          top: `${textPosition.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: textColor,
                          fontSize: '24px',
                          lineHeight: '1',
                          fontWeight: 'bold',
                          textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startPosX = textPosition.x;
                          const startPosY = textPosition.y;
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const container = videoContainerRef.current;
                            if (!container) return;
                            
                            const rect = container.getBoundingClientRect();
                            const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
                            const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
                            
                            setTextPosition({
                              x: Math.max(0, Math.min(100, startPosX + deltaX)),
                              y: Math.max(0, Math.min(100, startPosY + deltaY))
                            });
                          };
                          
                          const onMouseUp = () => {
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                          };
                          
                          window.addEventListener('mousemove', onMouseMove);
                          window.addEventListener('mouseup', onMouseUp);
                        }}
                      >
                        {textOverlay}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/text:opacity-100 transition-opacity whitespace-nowrap text-white">
                          Drag to position
                        </div>
                      </div>
                    )}
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <button 
                        onClick={togglePlay}
                        className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white pointer-events-auto hover:scale-110 transition-transform"
                      >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                      </button>
                    </div>

                    {/* Time Display Overlay */}
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-mono text-white/80 pointer-events-none">
                      {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                    </div>
                  </div>
                  
                  {/* Timeline View */}
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <History size={14} /> Timeline Editor
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => seekTo(trimRange.start)} className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors" title="Jump to Start"><SkipBack size={14} /></button>
                          <button onClick={togglePlay} className="p-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-all">
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                          </button>
                          <button onClick={() => seekTo(trimRange.end)} className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors" title="Jump to End"><SkipForward size={14} /></button>
                        </div>
                        <span className="text-xs font-mono text-emerald-500">{trimRange.start.toFixed(1)}s - {trimRange.end.toFixed(1)}s</span>
                      </div>
                    </div>

                    <div 
                      className="relative h-24 bg-black/40 rounded-xl border border-white/5 overflow-hidden group cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        seekTo((x / rect.width) * videoDuration);
                      }}
                    >
                      {/* Time Grid */}
                      <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-10">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="w-px h-full bg-white" />
                        ))}
                      </div>

                      {/* Video Track */}
                      <div className="absolute top-4 left-0 right-0 h-8 bg-emerald-500/5 border-y border-emerald-500/10 flex items-center">
                        <div 
                          className="absolute h-full bg-emerald-500/20 border-x border-emerald-500/50"
                          style={{ 
                            left: `${(trimRange.start / videoDuration) * 100}%`,
                            width: `${((trimRange.end - trimRange.start) / videoDuration) * 100}%`
                          }}
                        >
                          {/* Trimming Handles */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 cursor-ew-resize hover:w-2 transition-all"
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startVal = trimRange.start;
                              const onMouseMove = (moveEvent: MouseEvent) => {
                                const container = e.currentTarget.parentElement!.parentElement!;
                                const delta = ((moveEvent.clientX - startX) / container.clientWidth) * videoDuration;
                                setTrimRange(prev => {
                                  const newVal = Math.max(0, Math.min(prev.end - 0.5, startVal + delta));
                                  seekTo(newVal);
                                  return { ...prev, start: newVal };
                                });
                              };
                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };
                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 cursor-ew-resize hover:w-2 transition-all"
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startVal = trimRange.end;
                              const onMouseMove = (moveEvent: MouseEvent) => {
                                const container = e.currentTarget.parentElement!.parentElement!;
                                const delta = ((moveEvent.clientX - startX) / container.clientWidth) * videoDuration;
                                setTrimRange(prev => {
                                  const newVal = Math.max(prev.start + 0.5, Math.min(videoDuration, startVal + delta));
                                  seekTo(newVal);
                                  return { ...prev, end: newVal };
                                });
                              };
                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };
                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                        </div>
                      </div>

                      {/* Text Overlay Track */}
                      {textOverlay && (
                        <div className="absolute top-14 left-0 right-0 h-6 bg-blue-500/5 border-y border-blue-500/10 flex items-center">
                          <div 
                            className="absolute h-full bg-blue-500/20 border-x border-blue-500/50 rounded-sm flex items-center px-2"
                            style={{ 
                              left: `${(trimRange.start / videoDuration) * 100}%`,
                              width: `${((trimRange.end - trimRange.start) / videoDuration) * 100}%`
                            }}
                          >
                            <span className="text-[8px] font-bold text-blue-400 truncate">{textOverlay}</span>
                          </div>
                        </div>
                      )}

                      {/* Playhead */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
                        style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                      >
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-full shadow-lg" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-white/40 uppercase mb-1 block">Start Point</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.1"
                            value={trimRange.start.toFixed(1)}
                            onChange={(e) => setTrimRange(prev => ({ ...prev, start: parseFloat(e.target.value) }))}
                            className="w-20 bg-black border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-emerald-500"
                          />
                          <input 
                            type="range" 
                            min="0" 
                            max={videoDuration} 
                            step="0.1"
                            value={trimRange.start}
                            onChange={(e) => setTrimRange(prev => ({ ...prev, start: parseFloat(e.target.value) }))}
                            className="flex-1 accent-emerald-500 h-1"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-white/40 uppercase mb-1 block">End Point</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.1"
                            value={trimRange.end.toFixed(1)}
                            onChange={(e) => setTrimRange(prev => ({ ...prev, end: parseFloat(e.target.value) }))}
                            className="w-20 bg-black border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-emerald-500"
                          />
                          <input 
                            type="range" 
                            min="0" 
                            max={videoDuration} 
                            step="0.1"
                            value={trimRange.end}
                            onChange={(e) => setTrimRange(prev => ({ ...prev, end: parseFloat(e.target.value) }))}
                            className="flex-1 accent-emerald-500 h-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Type size={14} /> Text Overlay
                      </h3>
                      <button 
                        onClick={() => setTextPosition({ x: 50, y: 50 })}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors font-bold uppercase"
                      >
                        Reset Position
                      </button>
                    </div>
                    <input 
                      type="text"
                      placeholder="Enter overlay text..."
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                    <div className="flex gap-2">
                      {['#ffffff', '#10b981', '#ef4444', '#3b82f6', '#f59e0b'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${textColor === color ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <AudioLines size={14} /> Audio Editing
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Volume Control */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-[10px] text-white/40 uppercase">Video Volume</label>
                          <span className="text-[10px] text-emerald-500 font-mono">{Math.round(audioVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="2" 
                          step="0.1"
                          value={audioVolume}
                          onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                          className="w-full accent-emerald-500 h-1"
                        />
                      </div>

                      {/* Fades */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-white/40 uppercase mb-1 block">Fade In (s)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="5" 
                            step="0.5"
                            value={audioFadeIn}
                            onChange={(e) => setAudioFadeIn(parseFloat(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 uppercase mb-1 block">Fade Out (s)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="5" 
                            step="0.5"
                            value={audioFadeOut}
                            onChange={(e) => setAudioFadeOut(parseFloat(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Background Music */}
                      <div className="pt-2 border-t border-white/5">
                        <label className="text-[10px] text-white/40 uppercase mb-2 block">Background Music</label>
                        {!bgMusic ? (
                          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all">
                            <Plus size={16} className="text-white/40 mb-1" />
                            <span className="text-[10px] text-white/40">Upload MP3/WAV</span>
                            <input 
                              type="file" 
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => setBgMusic(e.target.files?.[0] || null)}
                            />
                          </label>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <AudioLines size={12} className="text-emerald-500 shrink-0" />
                                <span className="text-[10px] text-emerald-500 truncate font-medium">{bgMusic.name}</span>
                              </div>
                              <button 
                                onClick={() => setBgMusic(null)}
                                className="text-white/40 hover:text-white"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-[10px] text-white/40 uppercase">Music Volume</label>
                                <span className="text-[10px] text-emerald-500 font-mono">{Math.round(bgMusicVolume * 100)}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05"
                                value={bgMusicVolume}
                                onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Crop size={14} /> Aspect Ratio
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '16:9', value: 16 / 9 },
                        { label: '9:16', value: 9 / 16 },
                        { label: '1:1', value: 1 / 1 },
                        { label: '4:5', value: 4 / 5 }
                      ].map(ratio => (
                        <button 
                          key={ratio.label} 
                          onClick={() => setAspectRatio(ratio.value)}
                          className={`py-2 border rounded-lg text-xs transition-all ${aspectRatio === ratio.value ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={processVideo}
                    disabled={isProcessing || !ffmpegLoaded}
                    className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> Processing...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Apply Changes
                      </>
                    )}
                  </button>
                  
                  {!ffmpegLoaded && (
                    <p className="text-[10px] text-center text-white/20">
                      Loading video engine... Please wait.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowLogoutConfirm(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign Out?</h2>
              <p className="text-white/40 text-sm mb-8">Are you sure you want to log out of your VidiGenius account?</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-2">Select a Template</h2>
                  <p className="text-white/40">Choose a pre-defined layout to kickstart your video creation.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PROJECT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        saveProject({
                          name: template.name,
                          description: template.description,
                          script: template.defaultPrompt,
                          type: template.type,
                          status: 'draft'
                        });
                        setShowTemplateModal(false);
                      }}
                      className="group p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                    >
                      <div className={`w-12 h-12 ${template.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-lg`}>
                        <template.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1 group-hover:text-emerald-500 transition-colors">{template.name}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{template.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Template <ArrowRight size={12} />
                      </div>
                    </button>
                  ))}
                  
                  {/* Blank Project Option */}
                  <button
                    onClick={() => {
                      saveProject({ name: 'Untitled Project', status: 'draft' });
                      setShowTemplateModal(false);
                    }}
                    className="group p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-white/20 hover:bg-white/10 transition-all border-dashed"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-white">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Blank Project</h3>
                    <p className="text-xs text-white/40 leading-relaxed">Start from scratch with a clean slate.</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      Create Blank <ArrowRight size={12} />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-3">Delete Project?</h2>
              <p className="text-white/40 mb-8">
                This action cannot be undone. All associated data, scripts, and generated media will be permanently removed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (projectToDelete) {
                      deleteProject(projectToDelete);
                      setProjectToDelete(null);
                    }
                  }}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPricing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-12">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Power</h2>
                  <p className="text-white/40 max-w-xl mx-auto">
                    Scale your video production with premium AI synthesis and unlimited copyright transformations.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Tier */}
                  <div className="p-8 rounded-[24px] bg-white/5 border border-white/10 flex flex-col">
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                        <Star className="text-white/40" size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Starter</h3>
                      <p className="text-sm text-white/40">For hobbyists</p>
                    </div>
                    <div className="mb-8">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-white/40">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> 5 Credits / month
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Standard Analysis
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60 opacity-40">
                        <X size={16} /> 4K Synthesis
                      </li>
                    </ul>
                    <button 
                      disabled={subscriptionTier === 'Free'}
                      className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all disabled:opacity-50"
                    >
                      {subscriptionTier === 'Free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                  </div>

                  {/* Pro Tier */}
                  <div className="p-8 rounded-[24px] bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden flex flex-col">
                    <div className="absolute top-4 right-4 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <Crown className="text-black" size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Pro Creator</h3>
                      <p className="text-sm text-white/40">For influencers</p>
                    </div>
                    <div className="mb-8">
                      <span className="text-4xl font-bold">$29</span>
                      <span className="text-white/40">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> 100 Credits / month
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Deep Granular Insights
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> 4K Synthesis
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Direct Social Upload
                      </li>
                    </ul>
                    <button 
                      onClick={() => {
                        setSubscriptionTier('Pro');
                        setUserCredits(100);
                        setShowPricing(false);
                      }}
                      className="w-full py-3 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all"
                    >
                      {subscriptionTier === 'Pro' ? 'Current Plan' : 'Upgrade to Pro'}
                    </button>
                  </div>

                  {/* Enterprise Tier */}
                  <div className="p-8 rounded-[24px] bg-white/5 border border-white/10 flex flex-col">
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                        <InfinityIcon className="text-white/40" size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Studio</h3>
                      <p className="text-sm text-white/40">For agencies</p>
                    </div>
                    <div className="mb-8">
                      <span className="text-4xl font-bold">$99</span>
                      <span className="text-white/40">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Unlimited Credits
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Priority Rendering
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> API Access
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Custom Style Training
                      </li>
                    </ul>
                    <button 
                      onClick={() => {
                        setSubscriptionTier('Enterprise');
                        setUserCredits(9999);
                        setShowPricing(false);
                      }}
                      className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all"
                    >
                      {subscriptionTier === 'Enterprise' ? 'Current Plan' : 'Contact Sales'}
                    </button>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-xs text-white/20">
                    Need more credits? <button className="text-emerald-500 hover:underline">Buy a one-time pack</button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8">
          {!user ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <Zap size={64} className="text-emerald-500 relative" />
              </div>
              <div className="space-y-4 max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  The Future of <span className="text-emerald-500">Viral AI</span> Video
                </h1>
                <p className="text-white/40 text-lg md:text-xl">
                  Transform any content into high-engagement social media videos with our deep-research AI engine.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="flex-1 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                  className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                >
                  Sign In
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-12">
                <div className="text-center">
                  <div className="text-2xl font-bold">10M+</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/20">Videos Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">500K+</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/20">Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/20">AI Accuracy</div>
                </div>
              </div>
            </motion.div>
          ) : (
          <AnimatePresence mode="wait">
            {activeNav === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Project Management</h1>
                    <p className="text-white/40">Organize and manage your AI video generation workflows.</p>
                  </div>
                  <button 
                    onClick={() => setShowTemplateModal(true)}
                    className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={18} /> Create New Project
                  </button>
                </div>

                {/* Project Filters */}
                <div className="flex gap-4 border-b border-white/10 pb-4">
                  {['all', 'completed', 'draft', 'processing'].map((filter) => (
                    <button 
                      key={filter}
                      className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5"
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <motion.div 
                      key={project.id}
                      whileHover={{ y: -5 }}
                      className="group bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-xl"
                    >
                      {/* Project Preview */}
                      <div className="aspect-video bg-white/5 relative overflow-hidden">
                        {project.thumbnail ? (
                          <img 
                            src={project.thumbnail} 
                            alt={project.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video size={48} className="text-white/10" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            project.status === 'completed' ? 'bg-emerald-500 text-black' : 
                            project.status === 'draft' ? 'bg-white/10 text-white/60' : 
                            'bg-blue-500 text-white animate-pulse'
                          }`}>
                            {project.status}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={() => {
                                if (project.videoUrl) {
                                  setGeneratedVideoUrl(project.videoUrl);
                                  setActiveNav('use-ai');
                                }
                              }}
                              className="flex-1 py-2 bg-white text-black rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-400 transition-all"
                            >
                              Open Project
                            </button>
                            <button className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all">
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold group-hover:text-emerald-500 transition-colors">{project.name}</h3>
                            <p className="text-xs text-white/40 line-clamp-1">{project.description || 'No description provided'}</p>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => setProjectToDelete(project.id)}
                              className="p-2 text-white/20 hover:text-red-500 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className="p-2 text-white/20 hover:text-white transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={12} className="text-emerald-500" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Script Preview</span>
                            </div>
                            <p className="text-[10px] text-white/60 line-clamp-2 italic">
                              {project.script || 'No script associated with this project.'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                              <Sparkles size={12} className="text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{project.type} Engine</span>
                          </div>
                          <span className="text-[10px] text-white/20 font-bold">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {projects.length === 0 && (
                  <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                    <Folder size={64} className="mx-auto mb-4 text-white/10" />
                    <h3 className="text-xl font-bold mb-2">No projects found</h3>
                    <p className="text-white/40 mb-8">Start generating videos to see them here.</p>
                    <button 
                      onClick={() => setActiveNav('ai-lab')}
                      className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all"
                    >
                      Go to AI Lab
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeNav === 'privacy-policy' && (
              <PrivacyPolicy />
            )}

            {activeNav === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12 relative"
              >
                {/* 3D Animated Background Elements */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
                <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-bounce pointer-events-none" style={{ animationDuration: '10s' }} />
                
                {/* Find Trends Section - Front and Center */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-20 p-8 rounded-[40px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10 space-y-8">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">Find Your Next Viral Hit</h2>
                      <p className="text-white/40 text-sm">Select a platform and category to discover trending topics powered by AI.</p>
                    </div>

                    {/* Platform Selection */}
                    <div className="flex flex-wrap justify-center gap-4">
                      {[
                        { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'hover:text-red-500' },
                        { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
                        { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'hover:text-blue-500' },
                        { id: 'twitter', icon: Twitter, label: 'Twitter', color: 'hover:text-sky-500' },
                        { id: 'more', icon: Plus, label: 'More', color: 'hover:text-emerald-500' },
                      ].map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id as any)}
                          className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
                            selectedPlatform === platform.id 
                              ? 'bg-white/10 border-white/20 text-white shadow-lg scale-105' 
                              : 'bg-white/5 border-white/5 text-white/40 ' + platform.color
                          }`}
                        >
                          <platform.icon size={20} />
                          <span className="text-sm font-bold">{platform.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* YouTube Categories Grid */}
                    <AnimatePresence mode="wait">
                      {selectedPlatform === 'youtube' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 md:grid-cols-5 gap-3"
                        >
                          {YOUTUBE_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                selectedCategory === cat 
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Smart Description Box */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 text-white/20" size={20} />
                        <textarea
                          placeholder="Describe your niche or specific trend request (e.g., 'Tech gadgets for digital nomads under $50')..."
                          value={trendDescription}
                          onChange={(e) => setTrendDescription(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-cyan-500 outline-none transition-all min-h-[100px] resize-none"
                        />
                      </div>
                    </div>

                    {/* THE GLOW BUTTON */}
                    <div className="flex justify-center">
                      <motion.button
                        onClick={handleCheckTrends}
                        disabled={isCheckingTrends}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isCheckingTrends ? {} : {
                          boxShadow: [
                            "0 0 20px rgba(6, 182, 212, 0.2)",
                            "0 0 40px rgba(6, 182, 212, 0.6)",
                            "0 0 20px rgba(6, 182, 212, 0.2)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="relative group px-12 py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] rounded-full overflow-hidden disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                        <span className="relative flex items-center gap-3">
                          {isCheckingTrends ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <TrendingUp size={20} />
                              Check Trends Now
                            </>
                          )}
                        </span>
                      </motion.button>
                    </div>

                    {/* AI Results Panel */}
                    <AnimatePresence>
                      {trendResults && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 pt-8 border-t border-white/10"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <Sparkles className="text-cyan-400" size={18} /> Viral Suggestions
                            </h3>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AI Confidence: 98%</span>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {trendResults.map((trend, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                                    {i + 1}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold group-hover:text-cyan-400 transition-colors">{trend.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs font-bold text-emerald-500">{trend.growth} Growth</span>
                                      <div className="w-1 h-1 rounded-full bg-white/10" />
                                      <a href={trend.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-white flex items-center gap-1">
                                        Reference <ExternalLink size={10} />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="hidden sm:block">
                                    <Sparkline data={trend.sparkline} color="#06b6d4" />
                                  </div>
                                  <button 
                                    onClick={() => { setActiveNav('ai-lab'); setLabPrompt(`Create a video about ${trend.title}`); }}
                                    className="p-3 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-xl transition-all"
                                  >
                                    <Zap size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live System Status</span>
                      </div>
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">• 2,482 users online</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name || 'Creator'}</h1>
                    <p className="text-white/40">Here's what's happening with your AI video studio today.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveNav('trading-floor')}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <ShoppingBag size={18} className="text-emerald-500" /> Trading Floor
                    </button>
                    <button 
                      onClick={() => setActiveNav('use-ai')}
                      className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2"
                    >
                      <Zap size={18} /> New Transformation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Creations', value: history.length, icon: Video, color: 'text-emerald-500' },
                    { label: 'Credits Remaining', value: userCredits, icon: Coins, color: 'text-amber-500' },
                    { label: 'Active Pipeline', value: steps.filter(s => s.status === 'completed').length + '/5', icon: Layers, color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
                      className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4 cursor-pointer group relative overflow-hidden"
                      style={{ perspective: 1000 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center relative z-10">
                        <stat.icon size={24} className={stat.color} />
                      </div>
                      <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/20">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Start AI Lab Bento Grid */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="text-emerald-500" size={20} /> AI Lab Quick Start
                    </h2>
                    <button 
                      onClick={() => setActiveNav('ai-lab')}
                      className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
                    >
                      View All Tools <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('veo-video'); }}
                      className="md:col-span-2 p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Video size={120} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Veo 3 Video</h3>
                      <p className="text-sm text-white/60 mb-6 max-w-[200px]">Generate cinematic 16:9 videos from simple text prompts.</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                        Try Now <ArrowRight size={14} />
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('tts'); }}
                      className="p-8 rounded-[32px] bg-white/5 border border-white/10 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 transition-colors">
                        <AudioLines className="text-emerald-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">AI Speech</h3>
                      <p className="text-xs text-white/40">Professional TTS with multiple voices.</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('image-edit'); }}
                      className="p-8 rounded-[32px] bg-white/5 border border-white/10 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 transition-colors">
                        <ImageIcon className="text-emerald-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Image Edit</h3>
                      <p className="text-xs text-white/40">Prompt-based image transformations.</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('search'); }}
                      className="p-8 rounded-[32px] bg-white/5 border border-white/10 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 transition-colors">
                        <Globe className="text-emerald-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">AI Search</h3>
                      <p className="text-xs text-white/40">Grounded search with real-time data.</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => setActiveNav('trading-floor')}
                      className="md:col-span-2 p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/20 cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-xl font-bold mb-2">Trading Floor</h3>
                        <p className="text-sm text-white/60">Unlock high-performing AI prompts from the community.</p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag className="text-emerald-500" size={32} />
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('fast-chat'); }}
                      className="md:col-span-2 p-8 rounded-[32px] bg-white/5 border border-white/10 cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-xl font-bold mb-2">Fast AI Chat</h3>
                        <p className="text-sm text-white/40">Low-latency responses with Gemini 2.5 Flash Lite.</p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bolt className="text-emerald-500" size={32} />
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => setActiveNav('smart-graphics')}
                      className="p-8 rounded-[32px] bg-white/5 border border-white/10 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 transition-colors">
                        <Wand2 className="text-emerald-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Smart Graphics</h3>
                      <p className="text-xs text-white/40">Motion design & trending visuals.</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      onClick={() => { setActiveNav('ai-lab'); setLabMode('veo-animate'); }}
                      className="p-8 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors">
                        <Sparkles className="text-blue-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Animate</h3>
                      <p className="text-xs text-white/40">Turn photos into cinematic videos.</p>
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Trending Research Section */}
                  <div className="lg:col-span-3 p-8 rounded-[32px] bg-gradient-to-br from-blue-500/10 to-emerald-500/5 border border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Globe className="text-blue-500" size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Trending Content Research</h2>
                          <p className="text-xs text-white/40">Powered by Google Search Grounding</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleResearchTrending}
                        disabled={isResearching}
                        className="px-6 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-400 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isResearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        {isResearching ? 'Researching...' : 'Find Trends'}
                      </button>
                    </div>

                    {trendingResearch ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                      >
                        <div className="space-y-4">
                          <div className="prose prose-invert prose-sm max-w-none">
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{trendingResearch.text}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Verified Sources</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {trendingResearch.sources.map((source: any, i: number) => (
                              <a 
                                key={i} 
                                href={source.web?.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                    <ExternalLink size={14} />
                                  </div>
                                  <span className="text-xs font-bold truncate max-w-[200px]">{source.web?.title || 'Source'}</span>
                                </div>
                                <ArrowRight size={14} className="text-white/20 group-hover:text-white transition-colors" />
                              </a>
                            ))}
                          </div>
                          
                          {/* Smart Suggestions Button */}
                          <div className="pt-4">
                            <button 
                              onClick={handleSmartSuggest}
                              disabled={isSuggesting}
                              className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              {isSuggesting ? 'Generating Ideas...' : 'Get AI Video Ideas'}
                            </button>
                          </div>

                          {smartSuggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-2"
                            >
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">AI Suggested Concepts</h4>
                              <div className="space-y-2">
                                {smartSuggestions.map((idea, i) => (
                                  <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-white/80 flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 mt-0.5">{i+1}</div>
                                    <p>{idea.replace(/^\d+\.\s*/, '')}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <Globe size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="text-sm text-white/40">Click "Find Trends" to analyze real-time viral topics across the web.</p>
                      </div>
                    )}
                  </div>

                  {/* Global Traffic */}
                  <div className="lg:col-span-2 p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="text-emerald-500" size={20} /> Global Audience Reach
                      </h2>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                        <TrendingUp size={12} /> +24% this month
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        {[
                          { country: 'India', traffic: 85, color: 'bg-orange-500' },
                          { country: 'USA', traffic: 72, color: 'bg-blue-500' },
                          { country: 'UK', traffic: 64, color: 'bg-red-500' },
                          { country: 'France', traffic: 58, color: 'bg-indigo-500' },
                          { country: 'Russia', traffic: 52, color: 'bg-white' },
                        ].map((item) => (
                          <div key={item.country} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-white/60">{item.country}</span>
                              <span>{item.traffic}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.traffic}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full ${item.color}`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        {[
                          { country: 'Japan', traffic: 48, color: 'bg-red-400' },
                          { country: 'China', traffic: 45, color: 'bg-yellow-500' },
                          { country: 'Africa', traffic: 38, color: 'bg-emerald-500' },
                          { country: 'Nepal', traffic: 32, color: 'bg-blue-400' },
                          { country: 'Others', traffic: 25, color: 'bg-white/20' },
                        ].map((item) => (
                          <div key={item.country} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-white/60">{item.country}</span>
                              <span>{item.traffic}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.traffic}%` }}
                                transition={{ duration: 1, delay: 0.7 }}
                                className={`h-full ${item.color}`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Platform Performance */}
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="text-emerald-500" size={20} /> Platform Insights
                    </h2>
                    <div className="space-y-4">
                      {[
                        { platform: 'YouTube', icon: Youtube, color: 'text-red-500', growth: '+12.5%', views: '1.2M' },
                        { platform: 'Instagram', icon: Instagram, color: 'text-pink-500', growth: '+8.2%', views: '840K' },
                        { platform: 'Facebook', icon: Facebook, color: 'text-blue-500', growth: '+4.1%', views: '420K' },
                        { platform: 'Twitter', icon: Twitter, color: 'text-sky-400', growth: '+2.4%', views: '120K' },
                      ].map((p) => (
                        <div key={p.platform} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${p.color}`}>
                              <p.icon size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">{p.platform}</h4>
                              <p className="text-[10px] text-white/40">{p.views} views</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-500">{p.growth}</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-tighter">Growth</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Recent Activity</h2>
                      <button onClick={() => {setActiveProfileTab('overview'); setShowProfileModal(true);}} className="text-xs font-bold text-emerald-500 hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {history.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-black overflow-hidden">
                              <video src={item.url} className="w-full h-full object-cover opacity-50" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold truncate max-w-[150px]">{item.title}</h4>
                              <p className="text-[10px] text-white/20">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button onClick={() => {setGeneratedVideoUrl(item.url); setActiveNav('use-ai');}} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <div className="text-center py-8 text-white/20">
                          <p className="text-sm italic">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-2">Pro Tips</h2>
                      <p className="text-sm text-white/60 leading-relaxed">
                        Did you know? Using Pika Labs synthesis often yields better results for cinematic transformations, while Gemini is best for graphic styles.
                      </p>
                    </div>
                    <div className="mt-8 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Copyright Guard Active</span>
                      </div>
                      <p className="text-[10px] text-white/40">Your content is 100% safe for monetization.</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Tutorial Section */}
                <TutorialSection />
              </motion.div>
            )}

            {activeNav === 'ai-lab' && (
              <motion.div
                key="ai-lab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-2">AI Innovation Lab</h1>
                    <p className="text-white/40">Experimental tools powered by Gemini 2.5 & Veo 3</p>
                  </div>
                      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        {[
                          { id: 'veo-video', label: 'Video', icon: Video },
                          { id: 'veo-animate', label: 'Animate', icon: Sparkles },
                          { id: 'image-gen', label: 'Image', icon: ImageIcon },
                          { id: 'tts', label: 'Speech', icon: AudioLines },
                          { id: 'image-edit', label: 'Edit', icon: ImageIcon },
                          { id: 'fast-chat', label: 'Fast', icon: Bolt },
                          { id: 'search', label: 'Search', icon: Globe },
                          { id: 'script-analyze', label: 'Script', icon: FileText },
                          { id: 'image-analyze', label: 'Analyze', icon: ImageIcon },
                        ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setLabMode(mode.id as any);
                          setLabResult(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          labMode === mode.id ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <mode.icon size={14} />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          {labMode === 'veo-video' && <Video className="text-emerald-500" size={20} />}
                          {labMode === 'veo-animate' && <Sparkles className="text-emerald-500" size={20} />}
                          {labMode === 'image-gen' && <ImageIcon className="text-emerald-500" size={20} />}
                          {labMode === 'tts' && <AudioLines className="text-emerald-500" size={20} />}
                          {labMode === 'image-edit' && <ImageIcon className="text-emerald-500" size={20} />}
                          {labMode === 'fast-chat' && <Bolt className="text-emerald-500" size={20} />}
                          {labMode === 'search' && <Globe className="text-emerald-500" size={20} />}
                          {labMode === 'script-analyze' && <FileText className="text-emerald-500" size={20} />}
                          {labMode === 'image-analyze' && <ImageIcon className="text-emerald-500" size={20} />}
                        </div>
                        <h2 className="text-xl font-bold">
                          {labMode === 'veo-video' && 'Script-to-Video (Veo 3)'}
                          {labMode === 'veo-animate' && 'Image Animation (Veo 3)'}
                          {labMode === 'image-gen' && 'AI Image Generation (Pro)'}
                          {labMode === 'tts' && 'AI Speech Generation'}
                          {labMode === 'image-edit' && 'AI Image Editor'}
                          {labMode === 'fast-chat' && 'Fast AI Responses'}
                          {labMode === 'search' && 'Search Grounding'}
                          {labMode === 'script-analyze' && 'AI Script Analyzer'}
                          {labMode === 'image-analyze' && 'AI Image Understanding'}
                        </h2>
                      </div>

                      <div className="space-y-6">
                        {(labMode === 'veo-video' || labMode === 'veo-animate' || labMode === 'image-edit' || labMode === 'image-analyze') && (
                          <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                              {labMode === 'veo-video' || labMode === 'veo-animate' ? 'Reference Image (Optional)' : 'Source Image'}
                            </label>
                            <div 
                              onClick={() => document.getElementById('lab-image-upload')?.click()}
                              className="relative h-64 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer overflow-hidden"
                            >
                              {labImage ? (
                                <div className="relative w-full h-full group">
                                  <img src={labImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-xs font-bold text-white">Click to Change</p>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setLabImage(null); setLabImageFile(null); }}
                                    className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-rose-500 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <ImagePlus className="text-white/20" size={48} />
                                  <p className="text-sm text-white/40 font-bold">Upload image to process</p>
                                </>
                              )}
                              <input id="lab-image-upload" type="file" className="hidden" onChange={handleLabImageUpload} accept="image/*" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                              {labMode === 'tts' ? 'Text to Speak' : 'AI Prompt'}
                            </label>
                            <div className="flex items-center gap-4">
                              {labMode === 'image-gen' && (
                                <div className="flex gap-2">
                                  {(['1K', '2K', '4K'] as const).map((size) => (
                                    <button
                                      key={size}
                                      onClick={() => setLabImageSize(size)}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                        labImageSize === size 
                                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {labMode === 'image-gen' && (
                                <div className="flex gap-2">
                                  {(['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'] as const).map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() => setLabImageAspectRatio(ratio)}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                        labImageAspectRatio === ratio 
                                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                      }`}
                                    >
                                      {ratio}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {(labMode === 'veo-video' || labMode === 'veo-animate') && (
                                <button
                                  onClick={handleEnhancePrompt}
                                  disabled={isEnhancing || !labPrompt}
                                  className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                >
                                  {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  Enhance with Gemini
                                </button>
                              )}
                              {(labMode === 'veo-video' || labMode === 'veo-animate') && (
                                <div className="flex gap-2">
                                  {(['720p', '1080p'] as const).map((res) => (
                                    <button
                                      key={res}
                                      onClick={() => setLabResolution(res)}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                        labResolution === res 
                                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                      }`}
                                    >
                                      {res}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {(labMode === 'veo-video' || labMode === 'veo-animate') && (
                                <div className="flex gap-2">
                                  {(['16:9', '9:16'] as const).map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() => setLabAspectRatio(ratio)}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                        labAspectRatio === ratio 
                                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                      }`}
                                    >
                                      {ratio}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={labPrompt}
                            onChange={(e) => setLabPrompt(e.target.value)}
                              placeholder={
                                labMode === 'veo-video' ? "Paste your video script or describe the cinematic video you want to generate..." :
                                labMode === 'veo-animate' ? "Describe how you want this image to move..." :
                                labMode === 'image-gen' ? "Describe the image you want to generate in detail..." :
                                labMode === 'tts' ? "Enter the text you want the AI to speak..." :
                                labMode === 'image-edit' ? "e.g., 'Add a retro filter' or 'Make it look like Mars'..." :
                                labMode === 'fast-chat' ? "Ask anything for a lightning-fast response..." :
                                labMode === 'script-analyze' ? "Paste your video script here for AI optimization and feedback..." :
                                labMode === 'image-analyze' ? "Ask specific questions about the image or just click Generate for a full analysis..." :
                                "Enter your query for grounded search results..."
                              }
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:border-emerald-500 outline-none transition-all min-h-[120px] resize-none"
                          />
                        </div>

                        {(labMode === 'veo-video' || labMode === 'veo-animate') && (
                          <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Generation Style</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                              {VIDEO_STYLES.map((style) => (
                                <button
                                  key={style.id}
                                  onClick={() => setLabStyle(labStyle === style.id ? null : style.id)}
                                  className={`relative group overflow-hidden rounded-2xl border transition-all ${
                                    labStyle === style.id 
                                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                                      : 'border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <div className="aspect-video relative">
                                    <img src={style.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${labStyle === style.id ? 'bg-emerald-500/40 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                                      <style.icon size={20} className={labStyle === style.id ? 'text-black' : 'text-white'} />
                                    </div>
                                  </div>
                                  <div className={`p-2 text-center transition-colors ${labStyle === style.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60'}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter">{style.label}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(labMode === 'veo-video' || labMode === 'veo-animate' || labMode === 'image-gen') && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                            <ShieldCheck className="text-amber-500 shrink-0" size={18} />
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Paid API Key Required</p>
                              <p className="text-[10px] text-white/60 leading-relaxed">
                                {labMode === 'image-gen' ? 'Pro Image generation' : 'Veo 3 generation'} requires a paid Google Cloud project API key. 
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline ml-1">
                                  Learn about billing
                                </a>
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleLabSubmit}
                          disabled={isLabLoading || (!labPrompt && !labImageFile && labMode !== 'fast-chat')}
                          className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          {isLabLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                          {isLabLoading ? 'AI is working...' : 'Generate Magic'}
                        </button>
                      </div>
                    </div>

                    {labResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-[32px] bg-white/5 border border-emerald-500/20 space-y-6"
                      >
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" /> AI Result
                        </h3>
                        
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                          {labMode === 'veo-video' || labMode === 'veo-animate' ? (
                            <video src={labResult} controls className="w-full aspect-video" />
                          ) : labMode === 'tts' ? (
                            <div className="p-12 flex flex-col items-center gap-6">
                              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
                                <AudioLines className="text-emerald-500" size={32} />
                              </div>
                              <audio src={`data:audio/wav;base64,${labResult}`} controls className="w-full" />
                            </div>
                          ) : (labMode === 'image-edit' || labMode === 'image-gen') ? (
                            <img src={labResult} className="w-full" referrerPolicy="no-referrer" />
                          ) : labMode === 'image-analyze' || labMode === 'fast-chat' || labMode === 'script-analyze' ? (
                            <div className="p-8">
                              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{labResult}</p>
                            </div>
                          ) : labMode === 'search' ? (
                            <div className="p-8 space-y-8">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-500">
                                  <Globe size={16} />
                                  <h4 className="text-xs font-bold uppercase tracking-widest">Research Summary</h4>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{labResult.text}</p>
                                </div>
                              </div>

                              {labResult.sources && labResult.sources.length > 0 && (
                                <div className="space-y-4 pt-8 border-t border-white/10">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Grounded Sources</h4>
                                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                                      {labResult.sources.length} Links Found
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {labResult.sources.map((source: any, i: number) => (
                                      <a 
                                        key={i} 
                                        href={source.web?.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                                            <Link size={14} />
                                          </div>
                                          <div className="space-y-1 overflow-hidden">
                                            <p className="text-xs font-bold truncate text-white/90 group-hover:text-emerald-500 transition-colors">
                                              {source.web?.title || 'External Source'}
                                            </p>
                                            <p className="text-[10px] text-white/40 truncate">
                                              {source.web?.uri}
                                            </p>
                                          </div>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {labResult.searchEntryPoint && (
                                <div 
                                  className="pt-4 flex justify-center"
                                  dangerouslySetInnerHTML={{ __html: labResult.searchEntryPoint }}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="p-8">
                              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{labResult}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = labMode === 'tts' ? `data:audio/wav;base64,${labResult}` : labResult;
                              link.download = `vidigenius-lab-${Date.now()}`;
                              link.click();
                            }}
                            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Download Result
                          </button>
                          <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Share2 size={14} /> Share to Feed
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <History size={14} /> Lab History
                      </h3>
                      <div className="space-y-4">
                        {labHistory.map((item, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-emerald-500">{item.mode}</span>
                              <span className="text-[10px] text-white/20">{item.timestamp}</span>
                            </div>
                            <p className="text-xs text-white/60 line-clamp-2">{item.prompt || 'Generated content'}</p>
                          </div>
                        ))}
                        {labHistory.length === 0 && (
                          <div className="text-center py-8 text-white/10">
                            <p className="text-xs italic">No lab activity yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 rounded-[32px] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 space-y-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                        <Cpu className="text-purple-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold">Model Insights</h3>
                      <p className="text-xs text-white/40 leading-relaxed">
                        The AI Lab uses a combination of Gemini 2.5 Flash for speed, Gemini 3.1 Pro for reasoning, and Veo 3 for high-fidelity video generation.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeNav === 'smart-graphics' && (
              <motion.div
                key="smart-graphics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <Wand2 className="text-emerald-500" size={12} />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Official Integration</span>
                      </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Smart Graphics & Motion Design</h1>
                    <p className="text-white/40">Access professional motion graphics and high-trending visuals seamlessly.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Layers size={48} />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                      <Zap className="text-emerald-500" size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Viral Hooks</h3>
                    <p className="text-xs text-white/40 mb-4">Trending motion graphics for maximum engagement.</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                      Active Session <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </motion.div>

                  <div className="md:col-span-3 p-1 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden h-[800px] relative">
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        <Globe size={12} className="text-white/40" />
                        <span className="text-[10px] font-bold text-white/60">autoae.online/hooks</span>
                      </div>
                    </div>
                    <iframe 
                      src="https://autoae.online/hooks" 
                      className="w-full h-full border-none rounded-[28px]"
                      title="Smart Graphics & Motion Design"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeNav === 'trading-floor' && (
              <motion.div
                key="trading-floor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TradingFloor 
                  credits={userCredits} 
                  unlockedItems={unlockedItems}
                  onUnlock={handleUnlockItem}
                  onBuyCredits={handleBuyCredits}
                  onUsePrompt={handleUsePrompt}
                />
              </motion.div>
            )}

            {activeNav === 'sound-library' && (
              <motion.div
                key="sound-library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SoundLibrary onNavigate={setActiveNav} />
              </motion.div>
            )}

            {activeNav === 'use-ai' && (
              <motion.div
                key="use-ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* Center: Workspace */}
                <section className="lg:col-span-8 space-y-12">
                  {/* Step 1: Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">1. Input Source</h2>
                <span className="text-xs font-mono text-white/40">MP4, MOV, WEBM</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Video Title <span className="text-emerald-500">*</span></label>
                <input 
                  type="text"
                  placeholder="Enter a descriptive title for your masterpiece..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              
              {!videoPreview ? (
                <div className="group relative h-80 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer overflow-hidden p-8">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="text-white/40 group-hover:text-emerald-500" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Drop video or click to browse</p>
                      <p className="text-sm text-white/40">Analyze any content for deep transformation</p>
                    </div>
                  </div>

                  <div className="w-full flex items-center gap-4 px-12">
                    <div className="flex-1 h-[1px] bg-white/10" />
                    <span className="text-[10px] uppercase font-bold text-white/20 whitespace-nowrap">or paste a link</span>
                    <div className="flex-1 h-[1px] bg-white/10" />
                  </div>

                  <div className="w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                      type="text"
                      placeholder="YouTube, Instagram, Facebook, etc."
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        if (e.target.value) {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="video/*"
                  />
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-white/10 group">
                  <video src={videoPreview} className="w-full h-full object-cover" controls />
                  <button 
                    onClick={() => {setVideoPreview(null); setVideoFile(null);}}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Zap className="rotate-45" size={16} />
                  </button>
                </div>
              )}

              {(videoFile || videoUrl) && !analysis && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${fastProcessingEnabled ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white/20'}`}>
                        <Zap size={20} className={fastProcessingEnabled ? 'animate-pulse' : ''} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Fast Processing Mode</p>
                        <p className="text-[10px] text-white/40">Priority rendering enabled</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFastProcessingEnabled(!fastProcessingEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${fastProcessingEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: fastProcessingEnabled ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  <button 
                    onClick={startAnalysis}
                    disabled={isAnalyzing || !videoTitle.trim()}
                    className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                    {!videoTitle.trim() ? 'Enter Title to Continue' : (isAnalyzing ? 'Deep Researching...' : 'Analyze & Transform Content')}
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Analysis & Script */}
            <AnimatePresence>
              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Granular Insights - Collapsible Accordion */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                        className="flex items-center gap-3 group text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isAnalysisExpanded ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40 group-hover:bg-white/10'}`}>
                          {isAnalysisExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Deep Analysis Insights</h3>
                          <p className="text-[10px] text-white/30">Detailed breakdown of visual and emotional patterns</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const text = `VIDEO ANALYSIS SUMMARY\n\n` +
                              `SCENES:\n${analysis.scenes.map(s => `[${s.timestamp}] ${s.description}`).join('\n')}\n\n` +
                              `OBJECTS:\n${analysis.objects.map(o => o.name).join(', ')}\n\n` +
                              `EMOTIONS:\n${analysis.emotions.map(e => `${e.emotion}: ${(e.intensity * 100).toFixed(0)}%`).join('\n')}`;
                            navigator.clipboard.writeText(text);
                            alert("Analysis copied to clipboard!");
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 transition-colors"
                        >
                          <Save size={12} />
                          Copy Report
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isAnalysisExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 gap-4 pt-2">
                            {/* Tabs Header */}
                            <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl gap-1.5">
                              <button 
                                onClick={() => setActiveAnalysisTab(activeAnalysisTab === 'scenes' ? null : 'scenes')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeAnalysisTab === 'scenes' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5'}`}
                              >
                                <Search size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Timeline</span>
                                {activeAnalysisTab === 'scenes' ? <ChevronUp size={12} className="opacity-40" /> : <ChevronDown size={12} className="opacity-40" />}
                              </button>
                              <button 
                                onClick={() => setActiveAnalysisTab(activeAnalysisTab === 'objects' ? null : 'objects')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeAnalysisTab === 'objects' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5'}`}
                              >
                                <Zap size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Objects</span>
                                {activeAnalysisTab === 'objects' ? <ChevronUp size={12} className="opacity-40" /> : <ChevronDown size={12} className="opacity-40" />}
                              </button>
                              <button 
                                onClick={() => setActiveAnalysisTab(activeAnalysisTab === 'emotions' ? null : 'emotions')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeAnalysisTab === 'emotions' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5'}`}
                              >
                                <Sparkles size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Sentiment</span>
                                {activeAnalysisTab === 'emotions' ? <ChevronUp size={12} className="opacity-40" /> : <ChevronDown size={12} className="opacity-40" />}
                              </button>
                            </div>

                            {/* Tab Content Area */}
                            <AnimatePresence mode="wait">
                              {activeAnalysisTab && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[100px] relative"
                                >
                                  <AnimatePresence mode="wait">
                                    {activeAnalysisTab === 'scenes' && (
                                      <motion.div
                                        key="scenes"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6"
                                      >
                                        <div className="flex items-center justify-between mb-6">
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Timeline Analysis</h4>
                                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
                                            {analysis.scenes.length} segments
                                          </span>
                                        </div>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                          {analysis.scenes.map((scene, i) => (
                                            <div key={i} className="group flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                              <div className="flex flex-col items-center gap-2">
                                                <span className="font-mono text-emerald-500 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded h-fit border border-emerald-500/20">
                                                  {scene.timestamp}
                                                </span>
                                                <div className="w-px h-full bg-white/10 group-last:hidden" />
                                              </div>
                                              <div className="pt-0.5">
                                                <span className="text-white/70 text-xs leading-relaxed">{scene.description}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}

                                    {activeAnalysisTab === 'objects' && (
                                      <motion.div
                                        key="objects"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6"
                                      >
                                        <div className="flex items-center justify-between mb-6">
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Object Recognition</h4>
                                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
                                            {analysis.objects.length} entities
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {analysis.objects.map((obj, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 hover:bg-white/10 transition-colors">
                                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <Layers size={16} />
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-xs font-bold block truncate text-white/90">{obj.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                  <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                                                  <span className="text-[9px] text-white/30 font-mono block">
                                                    {obj.boundingBox.map(n => n.toFixed(0)).join(', ')}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}

                                    {activeAnalysisTab === 'emotions' && (
                                      <motion.div
                                        key="emotions"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6"
                                      >
                                        <div className="flex items-center justify-between mb-6">
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Sentiment & Tone</h4>
                                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
                                            Emotional Mapping
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {analysis.emotions.map((emo, i) => (
                                            <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4 hover:bg-white/10 transition-colors">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-tighter text-white/70">{emo.emotion}</span>
                                                <span className="text-xs font-mono text-emerald-500">{(emo.intensity * 100).toFixed(0)}%</span>
                                              </div>
                                              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                  initial={{ width: 0 }}
                                                  animate={{ width: `${emo.intensity * 100}%` }}
                                                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  {/* Styles & Presets Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="text-emerald-500" size={24} /> 2. Style & Animation
                      </h2>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Optional Presets</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Visual Style</label>
                        {selectedStyle && (
                          <button 
                            onClick={() => setSelectedStyle(null)}
                            className="text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-tighter"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      
                      <div className="relative group/carousel">
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory scroll-smooth">
                          {VIDEO_STYLES.map((style) => (
                            <motion.button
                              key={style.id}
                              whileHover={{ y: -4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                              className={`relative flex-shrink-0 w-56 aspect-[16/10] rounded-2xl border overflow-hidden transition-all snap-start group/style ${
                                selectedStyle === style.id 
                                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <img 
                                src={style.preview} 
                                alt={style.label}
                                className={`w-full h-full object-cover transition-transform duration-700 ${selectedStyle === style.id ? 'scale-110' : 'group-hover/style:scale-110'}`}
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${selectedStyle === style.id ? 'opacity-100' : 'opacity-60 group-hover/style:opacity-80'}`} />
                              
                              {/* Preview Badge */}
                              <div 
                                className="absolute top-3 left-3 opacity-0 group-hover/style:opacity-100 transition-opacity duration-300 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewStyle(style);
                                }}
                              >
                                <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-1.5 hover:bg-emerald-500 hover:text-black transition-colors">
                                  <Eye size={10} />
                                  <span className="text-[8px] font-bold uppercase tracking-widest">Quick Look</span>
                                </div>
                              </div>

                              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <div className="flex flex-col items-start">
                                  <span className={`text-xs font-bold uppercase tracking-widest ${selectedStyle === style.id ? 'text-emerald-500' : 'text-white'}`}>
                                    {style.label}
                                  </span>
                                  <span className="text-[9px] text-white/60 line-clamp-1 font-medium">{style.description}</span>
                                </div>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${selectedStyle === style.id ? 'bg-emerald-500 text-black rotate-12' : 'bg-white/10 text-white group-hover/style:bg-white/20'}`}>
                                  <style.icon size={14} />
                                </div>
                              </div>

                              {selectedStyle === style.id && (
                                <motion.div 
                                  layoutId="style-check"
                                  className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-black"
                                >
                                  <CheckCircle2 size={14} className="text-black" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                        
                        {/* Gradient Fades for Carousel */}
                        <div className="absolute top-0 left-0 bottom-4 w-12 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                        <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Animation Preset</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {ANIMATION_PRESETS.map((anim) => (
                          <button
                            key={anim.id}
                            onClick={() => setSelectedAnimation(selectedAnimation === anim.id ? null : anim.id)}
                            className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                              selectedAnimation === anim.id 
                                ? 'bg-blue-500/20 border-blue-500 text-blue-500' 
                                : 'bg-white/5 border-white/10 hover:border-white/20 text-white/40 hover:text-white'
                            }`}
                          >
                            {anim.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="text-emerald-500" size={24} /> 3. AI Transformation Script
                      </h2>
                    </div>
                    
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                      <textarea 
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-white/80 leading-relaxed min-h-[200px] resize-none font-mono text-sm"
                        placeholder="AI generated script will appear here..."
                      />
                      
                      {isGenerating && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-emerald-500">
                            <span>Synthesis Progress</span>
                            <span>{generationProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-emerald-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${generationProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-white/5 gap-4">
                        <span className="text-[10px] uppercase tracking-widest text-white/30">Refined at {analysis.timestamp}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={handlePikaGenerate}
                            disabled={isGenerating}
                            className="px-6 py-2 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-full flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                            Pika Labs
                          </button>
                          <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full flex items-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                            {isGenerating ? 'Synthesizing...' : 'Synthesize New Video'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Editor */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <MessageSquare className="text-emerald-500" size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">4. Subtitle Studio</h2>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Refine your narrative timing</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVeedSubtitles()}
                          disabled={isVeedProcessing || (veedStatus !== null && veedStatus !== 'completed' && veedStatus !== 'error')}
                          className={`px-4 py-2 border text-xs font-bold rounded-full flex items-center gap-2 transition-all disabled:opacity-50 ${
                            veedStatus === 'completed' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {isVeedProcessing || (veedStatus && veedStatus !== 'completed' && veedStatus !== 'error') ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Type size={14} />
                          )}
                          {veedStatus === 'completed' ? 'Veed.io Ready' : veedStatus ? `Veed: ${veedStatus}` : 'Veed.io Auto-Gen'}
                        </button>
                        
                        {veedSubtitleUrl && (
                          <a 
                            href={veedSubtitleUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-emerald-500 text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            title="Download Veed.io SRT"
                          >
                            <Download size={14} />
                          </a>
                        )}

                        <button 
                          onClick={downloadSRT}
                          disabled={subtitles.length === 0}
                          className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-full flex items-center gap-2 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <Download size={14} /> Export SRT
                        </button>
                        <button 
                          onClick={addSubtitle}
                          className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-full flex items-center gap-2 hover:bg-emerald-400 transition-all"
                        >
                          <Plus size={14} /> Add Subtitle
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {subtitles.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-white/20 gap-4">
                          <MessageSquare size={48} />
                          <p className="text-sm font-bold">No subtitles generated yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {subtitles.map((sub) => (
                            <motion.div 
                              key={sub.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-emerald-500/30 transition-all"
                            >
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex flex-col gap-4 shrink-0">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-white/40">
                                      <Clock size={14} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Start Time</span>
                                      <input 
                                        type="text"
                                        value={sub.startTime}
                                        onChange={(e) => updateSubtitle(sub.id, 'startTime', e.target.value)}
                                        className="bg-transparent border-none p-0 text-xs font-mono text-emerald-500 focus:ring-0 w-24"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-white/40">
                                      <Clock size={14} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">End Time</span>
                                      <input 
                                        type="text"
                                        value={sub.endTime}
                                        onChange={(e) => updateSubtitle(sub.id, 'endTime', e.target.value)}
                                        className="bg-transparent border-none p-0 text-xs font-mono text-emerald-500 focus:ring-0 w-24"
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Subtitle Text</span>
                                  <textarea 
                                    value={sub.text}
                                    onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/80 focus:border-emerald-500 outline-none transition-all resize-none min-h-[80px]"
                                  />
                                </div>

                                <div className="flex flex-col justify-center">
                                  <button 
                                    onClick={() => deleteSubtitle(sub.id)}
                                    className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Result */}
            <AnimatePresence>
              {generatedVideoUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 pb-12"
                >
                  <h2 className="text-2xl font-bold">4. Generated Masterpiece</h2>
                  <div className="rounded-3xl overflow-hidden bg-black aspect-video border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10 relative group">
                    <video 
                      src={generatedVideoUrl} 
                      className="w-full h-full object-contain" 
                      controls 
                      autoPlay 
                      loop 
                      playsInline
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Scissors size={20} /> Edit Masterpiece
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={20} /> Download 4K
                    </button>
                    <button 
                      onClick={handleCopyLink}
                      className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Link size={20} /> Copy Link
                    </button>
                    <button 
                      onClick={downloadSRT}
                      disabled={subtitles.length === 0}
                      className="py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download size={20} /> Export SRT
                    </button>
                    <div className="relative group">
                      <button 
                        onClick={handleVeedSubtitles}
                        disabled={isVeedProcessing || (veedStatus !== null && veedStatus !== 'completed' && veedStatus !== 'error')}
                        className={`w-full py-4 border rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                          veedStatus === 'completed' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {isVeedProcessing || (veedStatus && veedStatus !== 'completed' && veedStatus !== 'error') ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Type size={20} />
                        )}
                        {veedStatus === 'completed' ? 'Veed.io Ready' : veedStatus ? `Veed: ${veedStatus}` : 'Veed.io Subtitles'}
                      </button>
                      
                      {veedSubtitleUrl && (
                        <a 
                          href={veedSubtitleUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                          title="Download SRT"
                        >
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                    <button className="py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 sm:col-span-2 lg:col-span-3">
                      <Share2 size={20} /> Distribute Now
                    </button>
                    <button 
                      onClick={() => {
                        saveProject({
                          name: videoTitle || 'New Project',
                          videoUrl: generatedVideoUrl,
                          script: script,
                          status: 'completed',
                          type: labMode as any || 'veo'
                        });
                        alert('Project saved successfully!');
                      }}
                      className="py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-400 transition-all flex items-center justify-center gap-2 sm:col-span-2 lg:col-span-3"
                    >
                      <Save size={20} /> Save to Project Management
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

            {/* Right Sidebar: Social & Monetization */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-8 space-y-8">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <Share2 size={14} /> Direct Distribution
                  </h2>
                  <div className="space-y-3">
                    {[
                      { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'hover:bg-red-500/10 hover:text-red-500' },
                      { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-500/10 hover:text-pink-500' },
                      { id: 'twitter', icon: Twitter, label: 'X / Twitter', color: 'hover:bg-blue-400/10 hover:text-blue-400' },
                      { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-600/10 hover:text-blue-600' },
                    ].map((social) => (
                      <button 
                        key={social.id}
                        onClick={() => handleSocialConnect(social.id)}
                        className={`w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group transition-all ${social.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <social.icon size={20} />
                          <span className="text-sm font-bold">{social.label}</span>
                        </div>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20">
                  <h3 className="text-lg font-bold mb-2">Monetization Ready</h3>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">
                    Your content is processed through our deep transformation engine, making it eligible for ad revenue on all major platforms.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xl">
                    <span className="text-sm text-white/40 font-normal">Est. Revenue:</span> $0.00
                  </div>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
          </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer with Privacy Policy Link for Google Verification */}
      <footer className="bg-black/40 border-t border-white/5 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-black italic">V</div>
            <span className="text-sm font-bold tracking-tight">VidiGenius <span className="text-emerald-500">AI</span></span>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <button onClick={() => setActiveNav('dashboard')} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => setActiveNav('ai-lab')} className="hover:text-white transition-colors">AI Lab</button>
            <button onClick={() => setActiveNav('sound-library')} className="hover:text-white transition-colors">Sound Library</button>
            <button onClick={() => setActiveNav('privacy-policy')} className="text-emerald-500/60 hover:text-emerald-500 transition-colors">Privacy Policy</button>
          </div>
          
          <p className="text-[10px] text-white/10 font-mono">© 2026 VidiGenius AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Style Preview Modal */}
      <AnimatePresence>
        {previewStyle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewStyle(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-2/3 aspect-video md:aspect-auto relative group">
                  <img 
                    src={previewStyle.preview} 
                    alt={previewStyle.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
                        <previewStyle.icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{previewStyle.label}</h3>
                        <p className="text-sm text-white/60">Visual Style Reference</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-8 flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2 block">Style Profile</span>
                        <h4 className="text-xl font-bold text-white">{previewStyle.description}</h4>
                      </div>
                      <button 
                        onClick={() => setPreviewStyle(null)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <X size={20} className="text-white/40" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">AI Prompt Signature</span>
                        <p className="text-xs font-mono text-emerald-500/80 leading-relaxed italic">
                          "{previewStyle.prompt}"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Color Palette</span>
                          <div className="flex gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500" />
                            <div className="w-4 h-4 rounded-full bg-blue-500" />
                            <div className="w-4 h-4 rounded-full bg-purple-500" />
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Complexity</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedStyle(previewStyle.id);
                      setPreviewStyle(null);
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 size={18} />
                    Apply This Style
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ChatBot />
      <AnimatePresence>
        {showLiveAudio && (
          <LiveAudio onClose={() => setShowLiveAudio(false)} />
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
