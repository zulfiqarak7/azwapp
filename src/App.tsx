import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Lock, 
  LogOut, 
  Menu, 
  X,
  CheckCircle,
  Video,
  Home,
  PlayCircle,
  ExternalLink,
  List,
  Image as ImageIcon,
  Palette,
  ArrowDown,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

// --- 0. Global Variable Declarations ---
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

// --- 1. Strict Type Definitions ---
interface Project {
  id: string;
  clientName: string;
  projectName: string;
  date: string;
  status: string;
  income: number;
  expense: number;
}

interface NewProjectState {
  clientName: string;
  projectName: string;
  date: string;
  income: string;
  expense: string;
  status: string;
}

// --- 2. Firebase Configuration ---
const localConfig = {
  apiKey: "AIzaSyCM2J8JaRTJyXqqCqh1JM8tL_PqpQOPcAo",
  authDomain: "azw-landing.firebaseapp.com",
  projectId: "azw-landing",
  storageBucket: "azw-landing.firebasestorage.app",
  messagingSenderId: "896631813746",
  appId: "1:896631813746:web:e520e8c0d87d9200fbf4eb",
  measurementId: "G-E2ZG8V5H72"
};

const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config)
  ? JSON.parse(__firebase_config)
  : localConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = (typeof __app_id !== 'undefined' && __app_id) ? __app_id : 'azw-landing';

// --- 3. Utilities ---
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const exportToCSV = (data: Project[], fileName: string) => {
  if (!data || !data.length) {
    alert("No data to export");
    return;
  }
  const headers = ["Client Name", "Project Name", "Date", "Status", "Income ($)", "Expenses ($)", "Net ($)"];
  const csvRows = [
    headers.join(','), 
    ...data.map(row => {
      const dateStr = row.date ? new Date(row.date).toLocaleDateString() : '';
      const net = (row.income || 0) - (row.expense || 0);
      const escape = (text: string | number) => `"${(text || '').toString().replace(/"/g, '""')}"`;
      return [
        escape(row.clientName),
        escape(row.projectName),
        escape(dateStr),
        escape(row.status),
        row.income || 0,
        row.expense || 0,
        net
      ].join(',');
    })
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName || 'project_data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 4. Sub-Components ---

interface NavigationProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isAdminMode: boolean;
  setAdminMode: (isMode: boolean) => void;
  user: FirebaseUser | null;
  setView: (view: string) => void;
}

const Navigation = ({ isMobileMenuOpen, setIsMobileMenuOpen, isAdminMode, setAdminMode, user, setView }: NavigationProps) => (
  <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        {/* LOGO */}
        <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('hero')}>
          <img 
            src="/logo.png" 
            alt="Directed By AZW" 
            className="h-16 w-auto object-contain hover:opacity-90 transition-opacity"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none'; 
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = 'block';
              }
            }}
          />
          <span className="hidden ml-2 text-xl font-bold text-white tracking-tighter italic" style={{fontFamily: 'serif'}}>
            DIRECTED BY <span className="text-[#00D2BE]">AZW</span>
          </span>
        </div>
        
        {/* Desktop Menu */}
        {!isAdminMode && (
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('hero')} className="text-sm font-medium text-zinc-400 hover:text-[#00D2BE] transition-colors">Home</button>
            <button onClick={() => scrollToSection('portfolio')} className="text-sm font-medium text-zinc-400 hover:text-[#00D2BE] transition-colors">Work</button>
            <button onClick={() => scrollToSection('packages')} className="text-sm font-medium text-zinc-400 hover:text-[#00D2BE] transition-colors">Packages</button>
            <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="px-6 py-2 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-bold text-sm rounded-full transition-all">
              Book Now
            </a>
            
            {/* Dashboard Link (Visible only if logged in) */}
            {user && (
                <button onClick={() => setView('admin')} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-full transition-all">
                    <LayoutDashboard size={16}/> Dashboard
                </button>
            )}
          </div>
        )}

        {/* Admin Logout */}
        {isAdminMode && (
           <button onClick={() => setAdminMode(false)} className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-red-500 border border-red-500/30 hover:bg-zinc-800 transition-all flex items-center gap-2">
              <LogOut size={16} /> Exit Admin
           </button>
        )}

        {/* Mobile menu button */}
        {!isAdminMode && (
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400 hover:text-white">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Mobile Menu Dropdown */}
    {isMobileMenuOpen && !isAdminMode && (
      <div className="md:hidden bg-zinc-950 border-b border-zinc-900">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button onClick={() => { scrollToSection('hero'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-lg font-medium text-white border-b border-zinc-900">Home</button>
          <button onClick={() => { scrollToSection('portfolio'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-lg font-medium text-white border-b border-zinc-900">Work</button>
          <button onClick={() => { scrollToSection('packages'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-lg font-medium text-white">Packages</button>
          {user && (
             <button onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-lg font-medium text-[#00D2BE]">Dashboard</button>
          )}
        </div>
      </div>
    )}
  </nav>
);

const Hero = () => (
  <div id="hero" className="relative h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay z-[1] pointer-events-none"></div>
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D2BE]/20 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
       <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>
    </div>

    <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
      <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-6">
         art<br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2BE] to-emerald-600">in motion</span>
      </h1>
      <div className="w-24 h-1 bg-[#00D2BE] mx-auto mb-8"></div>
      <p className="text-xl md:text-2xl text-zinc-400 font-light tracking-widest uppercase mb-12">
        professional media production with a focus on technical quality, organized workflow, and impactful results.
      </p>
      
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <button onClick={() => scrollToSection('portfolio')} className="px-10 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-bold text-lg uppercase tracking-widest transition-all">
          Explore Work
        </button>
        <button onClick={() => scrollToSection('packages')} className="px-10 py-4 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-bold text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,210,190,0.3)]">
          2026 Season
        </button>
      </div>
    </div>

    {/* Scroll Indicator */}
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-zinc-500">
      <ArrowDown size={32} />
    </div>
  </div>
);

const Marquee = () => (
  <div className="bg-[#00D2BE] overflow-hidden py-4">
    <div className="whitespace-nowrap animate-marquee flex gap-12 text-black font-black italic uppercase tracking-widest text-2xl">
      <span>Music Videos</span> <span>•</span>
      <span>Creative Direction</span> <span>•</span>
      <span>Photography</span> <span>•</span>
      <span>Album Art</span> <span>•</span>
      <span>Brand Strategy</span> <span>•</span>
      <span>Social Content</span> <span>•</span>
      <span>Music Videos</span> <span>•</span>
      <span>Creative Direction</span> <span>•</span>
      <span>Photography</span> <span>•</span>
      <span>Album Art</span> <span>•</span>
    </div>
  </div>
);

const Portfolio = () => {
  // State for tabs
  const [activeTab, setActiveTab] = useState<'video' | 'photo' | 'design'>('video');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Video Data
  const videos = [
    { type: 'video', title: "Another Love Song", artist: "Wilmo", img: "https://img.youtube.com/vi/OVSVo2zTMM0/maxresdefault.jpg", link: "https://youtu.be/OVSVo2zTMM0" },
    { type: 'video', title: "HAHA!", artist: "Pa$ty", img: "https://img.youtube.com/vi/y9krRRjjLEA/maxresdefault.jpg", link: "https://youtu.be/y9krRRjjLEA" },
    { type: 'video', title: "Back Again", artist: "Zayyfrm050", img: "https://img.youtube.com/vi/oTqo4FKAEcc/maxresdefault.jpg", link: "https://youtu.be/oTqo4FKAEcc" },
    { type: 'video', title: "Everyday", artist: "Pa$ty", img: "https://img.youtube.com/vi/581MvmIE9to/maxresdefault.jpg", link: "https://youtu.be/581MvmIE9to" },
    { type: 'video', title: "Stay", artist: "Nyce Widdit", img: "https://img.youtube.com/vi/NOTk0b_ieNU/maxresdefault.jpg", link: "https://youtu.be/NOTk0b_ieNU" },
    { type: 'video', title: "Feel Less Wrong Than Right", artist: "Cash$tar", img: "https://i.ytimg.com/vi/Xpbu7kPphdw/hqdefault.jpg?sqp=-oaymwFACKgBEF5IWvKriqkDMwgBFQAAiEIYAdgBAeIBCggYEAIYBjgBQAHwAQH4Af4JgALQBYoCDAgAEAEYZSBkKFIwDw==&rs=AOn4CLBtZ7o1hkIP3x2C_wcICYgvWIJDrg", link: "https://youtu.be/Xpbu7kPphdw?si=6oxweIJewTtaCYpo" },
  ];

  // Define the list of images for the slideshow
  // Add more paths here if you upload more images (e.g., "/image 6.jpg")
  const slideImages = [
    "/image 1.jpg",
    "/image 2.jpg",
    "/image 3.jpg",
    "/image 4.jpg",
    "/image 5.jpg"
    "/image 6.jpg"
  "/image 7.jpg"
  "/image 8.jpg"
  "/image 9.jpg"
  "/image 10.jpg"
  "/image 11.jpg"
  ];

  // Placeholder Design Data
  const designs = [
    { id: 1, src: 'https://i.scdn.co/image/ab67616d00001e02df20ad5e0c7a56739dd4572c', title: 'Album Cover Art' },
    { id: 2, src: 'https://source.boomplaymusic.com/group10/M00/03/24/d0693f5d471f4105a8018df36c5e302cH3000W3000_464_464.webp', title: 'Event Flyer' },
    { id: 3, src: 'https://source.boomplaymusic.com/group10/M00/04/09/b7df39f73c2f4b10a51e557f32238e4b_464_464.webp', title: 'Logo Design' },
  ];

  const playlistUrl = "https://www.youtube.com/playlist?list=PLN86zTGXdQcoO-nbBlx3mSgAUTzYbFdqW";

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slideImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slideImages.length - 1 : prev - 1));
  };

  return (
    <div id="portfolio" className="bg-zinc-900 py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-black italic text-white mb-10 border-l-4 border-[#00D2BE] pl-4 uppercase">Selected Works</h2>
        
        {/* TABS NAVIGATION */}
        <div className="flex flex-wrap gap-4 mb-8">
            <button 
                onClick={() => setActiveTab('video')}
                className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'video' ? 'bg-[#00D2BE] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
                <div className="flex items-center gap-2"><Video size={16}/> Videos</div>
            </button>
            <button 
                onClick={() => setActiveTab('photo')}
                className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'photo' ? 'bg-[#00D2BE] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
                <div className="flex items-center gap-2"><ImageIcon size={16}/> Photography</div>
            </button>
            <button 
                onClick={() => setActiveTab('design')}
                className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'design' ? 'bg-[#00D2BE] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
                <div className="flex items-center gap-2"><Palette size={16}/> Design</div>
            </button>
        </div>

        {/* --- VIDEO SECTION --- */}
        {activeTab === 'video' && (
            <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {videos.map((item, idx) => (
                    <a 
                    key={idx} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer block hover:border-[#00D2BE] transition-colors"
                    >
                    <img 
                        src={item.img} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-60 transition-all group-hover:opacity-40 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:text-[#00D2BE] transition-all transform group-hover:scale-110" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <h3 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-[#00D2BE] transition-colors">{item.title}</h3>
                        <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold">{item.artist}</p>
                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={16} className="text-white"/>
                        </div>
                    </div>
                    </a>
                ))}
                </div>
                <div className="flex justify-center">
                    <a 
                        href={playlistUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest border border-zinc-800 hover:border-[#00D2BE] transition-all"
                    >
                        <List size={20} className="text-[#00D2BE]"/> View Full Playlist on YouTube
                    </a>
                </div>
            </>
        )}

        {/* --- PHOTOGRAPHY SECTION (SLIDESHOW) --- */}
        {activeTab === 'photo' && (
            <div className="relative w-full max-w-5xl mx-auto aspect-video bg-zinc-950 border border-zinc-800 overflow-hidden group">
                <img 
                    src={slideImages[currentSlide]} 
                    alt={`Slide ${currentSlide + 1}`} 
                    className="w-full h-full object-contain transition-opacity duration-500"
                    onError={(e) => {
                        // Fallback if image not found
                        (e.target as HTMLElement).style.display = 'none'; 
                        ((e.target as HTMLElement).nextSibling as HTMLElement).style.display = 'flex'; 
                    }}
                />
                <div className="hidden absolute inset-0 items-center justify-center text-zinc-500 flex-col">
                    <ImageIcon size={48} className="mb-2"/>
                    <p>Image not found: {slideImages[currentSlide]}</p>
                    <p className="text-xs">Make sure 'image {currentSlide + 1}.jpg' is in your public folder.</p>
                </div>

                {/* Navigation Buttons */}
                <button 
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#00D2BE] text-white hover:text-black p-3 rounded-full transition-all backdrop-blur-sm"
                >
                    <ArrowLeft size={24} />
                </button>
                <button 
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#00D2BE] text-white hover:text-black p-3 rounded-full transition-all backdrop-blur-sm"
                >
                    <ArrowRight size={24} />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {slideImages.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'bg-[#00D2BE] w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        )}

        {/* --- DESIGN SECTION --- */}
        {activeTab === 'design' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((design) => (
                    <div key={design.id} className="group relative aspect-square bg-zinc-900 overflow-hidden border border-zinc-800">
                        <img src={design.src} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <h3 className="text-white text-xl font-bold uppercase tracking-widest">{design.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

const Packages = () => (
  <div id="packages" className="bg-zinc-950 py-32 px-4 relative overflow-hidden">
    {/* Background Blob */}
    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[500px] h-[500px] bg-[#00D2BE]/5 rounded-full blur-[120px] pointer-events-none"></div>

    <div className="max-w-6xl mx-auto relative z-10">
      <div className="text-center mb-20">
        <h2 className="text-5xl md:text-6xl font-black text-white uppercase italic mb-6">2026 Season <span className="text-zinc-700 line-through decoration-[#00D2BE]">Pricing</span><br/> Offers</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">Lock in your visual strategy for the year. Limited slots available per month.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        
        {/* THE ROLLOUT CARD */}
        <div className="bg-zinc-900 border border-zinc-800 p-10 hover:border-[#00D2BE] transition-all duration-300 flex flex-col group relative">
          <div className="absolute top-0 right-0 bg-[#00D2BE] text-black text-xs font-bold px-4 py-2 uppercase tracking-widest">
            Recommended
          </div>
          
          <h3 className="text-4xl font-black text-white italic uppercase mb-2">The Rollout</h3>
          <p className="text-zinc-500 mb-8">Full monthly dominance.</p>
          
          <div className="text-6xl font-black text-white mb-2">$850<span className="text-xl text-zinc-600 font-normal">/mo</span></div>
          
          <div className="h-px w-full bg-zinc-800 my-8"></div>

          <div className="space-y-4 mb-10 flex-grow">
            {['3 Music Videos / Month', '2 Photoshoots', '2 Content Days', 'Strategy & Scheduling', 'RMRP Show Access'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <CheckCircle size={18} className="text-[#00D2BE]" />
                <span className="uppercase tracking-wide text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>

          <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-5 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-black uppercase tracking-widest text-center transition-all">
            Secure Your Slot
          </a>
        </div>

        {/* THE SINGLE CARD */}
        <div className="bg-zinc-950 border border-zinc-900 p-10 hover:border-zinc-700 transition-all duration-300 flex flex-col">
          <h3 className="text-4xl font-black text-white italic uppercase mb-2">The Single</h3>
          <p className="text-zinc-500 mb-8">One-off visual execution.</p>
          
          <div className="text-6xl font-black text-white mb-2">$450<span className="text-xl text-zinc-600 font-normal">/vid</span></div>
          
          <div className="h-px w-full bg-zinc-900 my-8"></div>

          <div className="space-y-4 mb-10 flex-grow">
            {['1 High Quality Video', 'Professional Editing', 'Color Grading', 'Standard Turnaround'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <div className="w-4 h-4 rounded-full border border-zinc-700"></div>
                <span className="uppercase tracking-wide text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-5 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-center transition-all border border-zinc-800">
            Book Single
          </a>
        </div>

      </div>
    </div>
  </div>
);

// --- Admin Components (Hidden by default) ---

interface AdminLoginProps {
  setView: (view: string) => void;
  setAdminMode: (mode: boolean) => void;
}

const AdminLogin = ({ setView, setAdminMode }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setView('admin');
      setAdminMode(true);
    } catch (err) {
      setError("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h2 className="text-3xl font-black text-white uppercase italic mb-8">Staff Access</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white focus:border-[#00D2BE] outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white focus:border-[#00D2BE] outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-[#00D2BE] text-black font-bold py-4 uppercase tracking-widest">Enter</button>
        </form>
        <button onClick={() => setView('home')} className="mt-6 text-zinc-600 text-sm hover:text-white uppercase tracking-widest">Back to Site</button>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  user: FirebaseUser;
  setView: (view: string) => void;
}

const AdminDashboard = ({ user, setView }: AdminDashboardProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<NewProjectState>({ clientName: '', projectName: '', date: '', income: '', expense: '', status: 'In Progress' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), {
      ...newProject,
      income: parseFloat(newProject.income.toString()) || 0,
      expense: parseFloat(newProject.expense.toString()) || 0,
      createdAt: serverTimestamp()
    });
    setNewProject({ clientName: '', projectName: '', date: '', income: '', expense: '', status: 'In Progress' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete?")) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id));
  };

  // Use a derived variable instead of useMemo for simplicity in this small scope
  const totals = projects.reduce((acc, curr) => ({
    income: acc.income + (curr.income || 0),
    expense: acc.expense + (curr.expense || 0),
    net: acc.net + ((curr.income || 0) - (curr.expense || 0))
  }), { income: 0, expense: 0, net: 0 });

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
           <h1 className="text-4xl font-black italic uppercase">Dashboard</h1>
           <button onClick={() => setView('home')} className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"><Home size={16}/> Back to Site</button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900 p-6 border-l-4 border-[#00D2BE]">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Revenue</div>
                <div className="text-3xl font-black text-white">${totals.income.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-red-900">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Expenses</div>
                <div className="text-3xl font-black text-red-500">${totals.expense.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-emerald-500">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Net Profit</div>
                <div className={`text-3xl font-black ${totals.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>${totals.net.toLocaleString()}</div>
            </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12 bg-zinc-900 p-6">
          <input placeholder="Client" className="bg-black p-2 text-white border border-zinc-800" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} />
          <input placeholder="Project" className="bg-black p-2 text-white border border-zinc-800" value={newProject.projectName} onChange={e => setNewProject({...newProject, projectName: e.target.value})} />
          <input type="date" className="bg-black p-2 text-white border border-zinc-800" value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})} />
          <input type="number" placeholder="Income" className="bg-black p-2 text-white border border-zinc-800" value={newProject.income} onChange={e => setNewProject({...newProject, income: e.target.value})} />
          <input type="number" placeholder="Expense" className="bg-black p-2 text-white border border-zinc-800" value={newProject.expense} onChange={e => setNewProject({...newProject, expense: e.target.value})} />
          <button className="bg-[#00D2BE] text-black font-bold uppercase">Add</button>
        </form>

        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-zinc-900 p-4 border border-zinc-800">
              <div>
                <div className="font-bold">{p.clientName}</div>
                <div className="text-zinc-500 text-sm">{p.projectName}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[#00D2BE] font-mono">${p.income - p.expense}</div>
                <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={() => exportToCSV(projects, 'finances.csv')} className="mt-8 text-zinc-500 hover:text-white text-sm uppercase tracking-widest">Download CSV</button>
      </div>
    </div>
  );
};

// --- Main App Controller ---

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'login' | 'admin'
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMode, setAdminMode] = useState(false);

  useEffect(() => {
    // @ts-ignore
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) signInWithCustomToken(auth, __initial_auth_token).catch(console.warn);
    onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u && view === 'admin') setView('login');
    });
  }, [view]);

  // If viewing admin or login, show that full screen
  if (view === 'login') return <AdminLogin setView={setView} setAdminMode={setAdminMode} />;
  if (view === 'admin' && user) return <AdminDashboard user={user} setView={setView} />;

  // Otherwise show the landing page
  return (
    <div className="font-sans bg-zinc-950 min-h-screen text-zinc-200 selection:bg-[#00D2BE] selection:text-black">
      <Navigation 
          isAdminMode={isAdminMode}
          setAdminMode={setAdminMode}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          setView={setView}
      />
      
      <Hero />
      <Marquee />
      <Portfolio />
      <Packages />
      
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-zinc-600 text-sm">
          <div className="flex items-center mb-4 md:mb-0">
             <span className="font-bold uppercase tracking-widest">© 2026 AZW</span>
          </div>
          <div className="flex space-x-6 items-center">
            <a href="https://www.instagram.com/azw.one/" className="hover:text-[#00D2BE] transition-colors">Instagram</a>
            <a href="https://linktr.ee/azwclothing" className="hover:text-[#00D2BE] transition-colors">Contact</a>
            {/* Secret Admin Button */}
            <button onClick={() => setView('login')} className="opacity-0 hover:opacity-100 transition-opacity ml-4"><Lock size={12}/></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
