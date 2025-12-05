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
  LayoutDashboard,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Calendar,
  Briefcase,
  Music,
  Camera,
  GraduationCap
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut
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
    console.warn("No data to export");
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

// *** NEW: Background Video Component ***
const BackgroundVideo = () => {
    // NOTE: Replace the src below with "/background.mp4" when you add your local file.
    // I am using a placeholder URL so you can see the effect in the preview.
    const videoSrc = "background.mp4";
    // Or if you upload your own: "/background.mp4"

    return (
        <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden">
             {/* The Video Element */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
                src={videoSrc}
            />
            {/* Dark Overlay to make text readable */}
            <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
            {/* Grain Overlay for texture (kept from previous design) */}
            <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>
    );
};


interface NavigationProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isAdminMode: boolean;
  setAdminMode: (isMode: boolean) => void;
  user: FirebaseUser | null;
  setView: (view: string) => void;
}

const Navigation = ({ isMobileMenuOpen, setIsMobileMenuOpen, isAdminMode, setAdminMode, user, setView }: NavigationProps) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* LOGO SECTION */}
          <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('hero')}>
            {!logoError ? (
                <img
                    src="/logo.png"
                    alt="Directed By AZW"
                    className="h-16 w-auto object-contain hover:opacity-90 transition-opacity"
                    onError={() => setLogoError(true)}
                />
            ) : (
                <span className="text-xl font-bold text-white tracking-tighter italic" style={{fontFamily: 'serif'}}>
                    DIRECTED BY <span className="text-[#00D2BE]">AZW</span>
                </span>
            )}
          </div>

          {/* Desktop Menu */}
          {!isAdminMode && (
            <div className="hidden md:flex items-center space-x-8 font-mono">
              <button onClick={() => scrollToSection('hero')} className="text-sm font-medium text-zinc-300 hover:text-[#00D2BE] transition-colors uppercase tracking-widest">Home</button>
              <button onClick={() => scrollToSection('portfolio')} className="text-sm font-medium text-zinc-300 hover:text-[#00D2BE] transition-colors uppercase tracking-widest">Work</button>
              <button onClick={() => scrollToSection('packages')} className="text-sm font-medium text-zinc-300 hover:text-[#00D2BE] transition-colors uppercase tracking-widest">Packages</button>
              <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="px-6 py-2 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-bold text-xs uppercase tracking-widest rounded-none transition-all">
                Book Now
              </a>

              {/* Dashboard Link */}
              {user && (
                  <button onClick={() => setView('admin')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 transition-all">
                      <LayoutDashboard size={14}/> Dashboard
                  </button>
              )}
            </div>
          )}

          {/* Admin Logout */}
          {isAdminMode && (
             <button onClick={() => setAdminMode(false)} className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-zinc-900 text-red-500 border border-red-500/30 hover:bg-zinc-800 transition-all flex items-center gap-2">
                <LogOut size={14} /> Exit Admin
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
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-b border-zinc-800 font-mono">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => { scrollToSection('hero'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-sm font-bold uppercase text-white border-b border-zinc-900">Home</button>
            <button onClick={() => { scrollToSection('portfolio'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-sm font-bold uppercase text-white border-b border-zinc-900">Work</button>
            <button onClick={() => { scrollToSection('packages'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-sm font-bold uppercase text-white">Packages</button>
            {user && (
               <button onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-sm font-bold uppercase text-[#00D2BE]">Dashboard</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => (
  <div id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
    {/* No Background color here to let video show through */}
    
    <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto text-center h-full">

      {/* 1. Small Cyan Text */}
      <p className="text-[#00D2BE] font-sans text-sm md:text-base mb-6 tracking-wide lowercase opacity-90 drop-shadow-md">
        art in motion
      </p>

      {/* 2. Main Block Text */}
      <h1 className="text-white font-mono font-bold text-sm md:text-lg leading-relaxed tracking-widest uppercase max-w-xl mx-auto mb-16 drop-shadow-lg">
        Professional media production with a focus on technical quality, organized workflow, and impactful results
      </h1>

      {/* 3. Subtle Call to Actions */}
      <div className="flex flex-col md:flex-row gap-6 justify-center font-mono opacity-80 hover:opacity-100 transition-opacity">
        <button onClick={() => scrollToSection('portfolio')} className="px-8 py-3 bg-transparent border border-white/30 hover:border-[#00D2BE] text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all">
          Explore Work
        </button>
      </div>

    </div>
    
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-zinc-500/50">
      <ArrowDown size={24} />
    </div>
  </div>
);

const Marquee = () => (
  <div className="bg-[#00D2BE]/90 backdrop-blur-sm overflow-hidden py-3 border-y border-black/10">
    {/* Boxy Font Marquee */}
    <div className="whitespace-nowrap animate-marquee flex gap-12 text-black font-mono font-bold uppercase tracking-widest text-lg">
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
  const [activeTab, setActiveTab] = useState<'video' | 'photo' | 'design'>('video');
  const [photoSubTab, setPhotoSubTab] = useState<'portraits' | 'headshots' | 'events'>('portraits');
  const [currentSlide, setCurrentSlide] = useState(0);

  const videos = [
    { type: 'video', title: "Another Love Song", artist: "Wilmo", img: "https://img.youtube.com/vi/OVSVo2zTMM0/maxresdefault.jpg", link: "https://youtu.be/OVSVo2zTMM0" },
    { type: 'video', title: "HAHA!", artist: "Pa$ty", img: "https://img.youtube.com/vi/y9krRRjjLEA/maxresdefault.jpg", link: "https://youtu.be/y9krRRjjLEA" },
    { type: 'video', title: "Back Again", artist: "Zayyfrm050", img: "https://img.youtube.com/vi/oTqo4FKAEcc/maxresdefault.jpg", link: "https://youtu.be/oTqo4FKAEcc" },
    { type: 'video', title: "Everyday", artist: "Pa$ty", img: "https://img.youtube.com/vi/581MvmIE9to/maxresdefault.jpg", link: "https://youtu.be/581MvmIE9to" },
    { type: 'video', title: "Stay", artist: "Nyce Widdit", img: "https://img.youtube.com/vi/NOTk0b_ieNU/maxresdefault.jpg", link: "https://youtu.be/NOTk0b_ieNU" },
    { type: 'video', title: "Feel Less Wrong Than Right", artist: "Cash$tarr", img: "https://img.youtube.com/vi/Xpbu7kPphdw/maxresdefault.jpg", link: "https://youtu.be/Xpbu7kPphdw" }
  ];

  // Images for each photo section
  const photoImages = {
    portraits: [
        "/image 1.jpg",
        "/image 2.jpg",
        "/image 3.jpg",
        "/image 6.jpg",
        "/image 7.jpg",
        "/image 8.jpg",
        "/image 9.jpg",
        "/image 10.jpg",
        "/image 11.jpg"
    ],
    headshots: [
        // Placeholder for now, replace with local files if available
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80"
    ],
    events: [
        "/image 4.jpg",
        "/image 5.jpg"
    ]
  };

  const currentPhotoSet = photoImages[photoSubTab];

  const designs = [
    { id: 1, src: 'https://i.scdn.co/image/ab67616d00001e02df20ad5e0c7a56739dd4572c', title: 'Album Cover Art' },
    { id: 2, src: 'https://source.boomplaymusic.com/group10/M00/03/24/d0693f5d471f4105a8018df36c5e302cH3000W3000_464_464.webp', title: 'Event Flyer' },
    { id: 3, src: 'https://source.boomplaymusic.com/group10/M00/04/09/b7df39f73c2f4b10a51e557f32238e4b_464_464.webp', title: 'Logo Design' },
    { id: 4, src: 'https://images.unsplash.com/photo-1626785774573-4b7993143a2d?w=800&q=80', title: 'Merch Design' },
    { id: 5, src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', title: 'Social Asset' },
    { id: 6, src: 'https://images.unsplash.com/photo-1558655146-d09347e0b7a8?w=800&q=80', title: 'Branding Kit' },
  ];

  const playlistUrl = "https://www.youtube.com/playlist?list=PLN86zTGXdQcoO-nbBlx3mSgAUTzYbFdqW";

  const nextSlide = () => setCurrentSlide((prev) => (prev === currentPhotoSet.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? currentPhotoSet.length - 1 : prev - 1));

  // Reset slide when switching sub-tabs
  useEffect(() => {
    setCurrentSlide(0);
  }, [photoSubTab]);

  return (
    <div id="portfolio" className="bg-black/80 backdrop-blur-sm py-32 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-black italic text-white mb-12 border-l-4 border-[#00D2BE] pl-6 uppercase drop-shadow-lg">Selected Works</h2>

        {/* TABS NAVIGATION - Boxy Font */}
        <div className="flex flex-wrap gap-4 mb-12 font-mono">
            <button onClick={() => setActiveTab('video')} className={`px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all border ${activeTab === 'video' ? 'bg-[#00D2BE] text-black border-[#00D2BE]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-white'}`}>
                <div className="flex items-center gap-2"><Video size={14}/> Videos</div>
            </button>
            <button onClick={() => setActiveTab('photo')} className={`px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all border ${activeTab === 'photo' ? 'bg-[#00D2BE] text-black border-[#00D2BE]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-white'}`}>
                <div className="flex items-center gap-2"><ImageIcon size={14}/> Photography</div>
            </button>
            <button onClick={() => setActiveTab('design')} className={`px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all border ${activeTab === 'design' ? 'bg-[#00D2BE] text-black border-[#00D2BE]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-white'}`}>
                <div className="flex items-center gap-2"><Palette size={14}/> Design</div>
            </button>
        </div>

        {/* --- VIDEO SECTION --- */}
        {activeTab === 'video' && (
            <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {videos.map((item, idx) => (
                    <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="group relative aspect-video bg-black/50 border border-zinc-800 overflow-hidden cursor-pointer block hover:border-[#00D2BE] transition-colors">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-60 transition-all group-hover:opacity-40 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:text-[#00D2BE] transition-all transform group-hover:scale-110" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <h3 className="text-white font-serif font-bold text-lg italic leading-tight mb-1 group-hover:text-[#00D2BE] transition-colors">{item.title}</h3>
                        <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest">{item.artist}</p>
                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={16} className="text-white"/>
                        </div>
                    </div>
                    </a>
                ))}
                </div>
                <div className="flex justify-center font-mono">
                    <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-black/60 hover:bg-black/80 text-white font-bold text-xs uppercase tracking-widest border border-zinc-800 hover:border-[#00D2BE] transition-all">
                        <List size={18} className="text-[#00D2BE]"/> View Full Playlist
                    </a>
                </div>
            </>
        )}

        {/* --- PHOTOGRAPHY SECTION --- */}
        {activeTab === 'photo' && (
            <div className="space-y-8">
                {/* Photo Sub-Tabs */}
                <div className="flex justify-center gap-6 font-mono border-b border-zinc-800 pb-4">
                     <button
                        onClick={() => setPhotoSubTab('portraits')}
                        className={`text-xs uppercase tracking-widest font-bold transition-colors ${photoSubTab === 'portraits' ? 'text-[#00D2BE]' : 'text-zinc-500 hover:text-white'}`}
                     >
                        Artist Portraits
                     </button>
                     <span className="text-zinc-800">|</span>
                     <button
                        onClick={() => setPhotoSubTab('headshots')}
                        className={`text-xs uppercase tracking-widest font-bold transition-colors ${photoSubTab === 'headshots' ? 'text-[#00D2BE]' : 'text-zinc-500 hover:text-white'}`}
                     >
                        Headshots
                     </button>
                     <span className="text-zinc-800">|</span>
                     <button
                        onClick={() => setPhotoSubTab('events')}
                        className={`text-xs uppercase tracking-widest font-bold transition-colors ${photoSubTab === 'events' ? 'text-[#00D2BE]' : 'text-zinc-500 hover:text-white'}`}
                     >
                        Special Events
                     </button>
                </div>

                <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black/50 border border-zinc-800 overflow-hidden group">
                    <img
                        src={currentPhotoSet[currentSlide]}
                        alt={`Slide ${currentSlide + 1}`}
                        className="w-full h-full object-contain transition-opacity duration-500"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            if ((e.target as HTMLElement).nextSibling) ((e.target as HTMLElement).nextSibling as HTMLElement).style.display = 'flex';
                        }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center text-zinc-500 flex-col font-mono">
                        <ImageIcon size={48} className="mb-4"/>
                        <p>Image not found</p>
                    </div>

                    {/* Navigation Arrows */}
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#00D2BE] text-white hover:text-black p-3 transition-all backdrop-blur-sm z-10">
                        <ArrowLeft size={24} />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#00D2BE] text-white hover:text-black p-3 transition-all backdrop-blur-sm z-10">
                        <ArrowRight size={24} />
                    </button>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {currentPhotoSet.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 transition-all ${currentSlide === idx ? 'bg-[#00D2BE] w-8' : 'bg-white/30 w-4 hover:bg-white/50'}`} />
                        ))}
                    </div>

                    {/* Sub-section Label */}
                    <div className="absolute top-6 left-6 bg-black/70 px-4 py-2 text-[#00D2BE] font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                        {photoSubTab === 'portraits' && 'Artist Portraits'}
                        {photoSubTab === 'headshots' && 'Professional Headshots'}
                        {photoSubTab === 'events' && 'Special Events'}
                    </div>
                </div>
            </div>
        )}

        {/* --- DESIGN SECTION --- */}
        {activeTab === 'design' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((design) => (
                    <div key={design.id} className="group relative aspect-square bg-black/50 overflow-hidden border border-zinc-800">
                        <img src={design.src} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <h3 className="text-white font-serif text-2xl font-bold italic uppercase tracking-widest px-4 text-center">{design.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const Packages = () => {
    const [pricingCategory, setPricingCategory] = useState<'music' | 'corporate' | 'events'>('music');

    return (
      <div id="packages" className="bg-black/90 backdrop-blur-md py-32 px-4 relative overflow-hidden border-t border-white/5">
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[500px] h-[500px] bg-[#00D2BE]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* CURVY TITLE */}
            <h2 className="text-3xl md:text-4xl font-serif font-black text-white uppercase italic mb-6">2026 Season <span className="text-zinc-700 line-through decoration-[#00D2BE]">Pricing</span><br/> Offers</h2>
            {/* BOXY SUBTITLE */}
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest max-w-2xl mx-auto">Lock in your visual strategy for the year.</p>
          </div>

          {/* Pricing Category Switcher */}
          <div className="flex justify-center mb-16">
             <div className="inline-flex bg-black p-1 border border-zinc-800 rounded-none">
                <button
                    onClick={() => setPricingCategory('music')}
                    className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all ${pricingCategory === 'music' ? 'bg-[#00D2BE] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2"><Music size={14}/> Music Video</div>
                </button>
                <button
                    onClick={() => setPricingCategory('corporate')}
                    className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all ${pricingCategory === 'corporate' ? 'bg-[#00D2BE] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2"><Briefcase size={14}/> Corporate</div>
                </button>
                <button
                    onClick={() => setPricingCategory('events')}
                    className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all ${pricingCategory === 'events' ? 'bg-[#00D2BE] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2"><Calendar size={14}/> Special Events</div>
                </button>
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* --- MUSIC VIDEO PRICING --- */}
            {pricingCategory === 'music' && (
                <>
                    {/* THE ROLLOUT CARD */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-10 hover:border-[#00D2BE] transition-all duration-300 flex flex-col group relative animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 bg-[#00D2BE] text-black text-xs font-mono font-bold px-4 py-2 uppercase tracking-widest">Recommended</div>
                    <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">The Rollout</h3>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">Full monthly dominance.</p>
                    <div className="text-5xl font-serif font-black text-white mb-2">$850<span className="text-xl text-zinc-600 font-mono font-normal">/mo</span></div>
                    <div className="h-px w-full bg-zinc-800 my-8"></div>
                    <div className="space-y-4 mb-10 flex-grow font-mono">
                        {['3 Music Videos / Month', '2 Photoshoots', '2 Content Days', 'Strategy & Scheduling', 'RMRP Show Access'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-zinc-300">
                            <CheckCircle size={16} className="text-[#00D2BE]" />
                            <span className="uppercase tracking-widest text-xs font-bold">{item}</span>
                        </div>
                        ))}
                    </div>
                    <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-mono font-bold text-sm uppercase tracking-widest text-center transition-all">Secure Your Slot</a>
                    </div>

                    {/* THE SINGLE CARD */}
                    <div className="bg-black/40 border border-zinc-900 p-10 hover:border-zinc-700 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
                    <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">The Single</h3>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">One-off visual execution.</p>
                    <div className="text-5xl font-serif font-black text-white mb-2">$450<span className="text-xl text-zinc-600 font-mono font-normal">/vid</span></div>
                    <div className="h-px w-full bg-zinc-900 my-8"></div>
                    <div className="space-y-4 mb-10 flex-grow font-mono">
                        {['1 High Quality Video', 'Professional Editing', 'Color Grading', 'Standard Turnaround'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-zinc-400">
                            <div className="w-4 h-4 rounded-full border border-zinc-700"></div>
                            <span className="uppercase tracking-widest text-xs font-medium">{item}</span>
                        </div>
                        ))}
                    </div>
                    <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-800 text-white font-mono font-bold text-sm uppercase tracking-widest text-center transition-all border border-zinc-800">Book Single</a>
                    </div>
                </>
            )}

            {/* --- CORPORATE PRICING --- */}
            {pricingCategory === 'corporate' && (
                <>
                    {/* SMALL TEAM CARD */}
                    <div className="bg-black/40 border border-zinc-900 p-10 hover:border-zinc-700 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2 text-[#00D2BE]"><User size={20}/></div>
                        <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">Small Team</h3>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">Professional Headshots & Group.</p>
                        <div className="text-5xl font-serif font-black text-white mb-2"><span className="text-2xl align-top text-zinc-500">$</span>350<span className="text-xl text-zinc-600 font-mono font-normal">+</span></div>
                        <div className="h-px w-full bg-zinc-900 my-8"></div>
                        <div className="space-y-4 mb-10 flex-grow font-mono">
                            {['1-5 Team Members', 'LinkedIn Ready Images', '4-10 Photos Per Person', '1 Group Photo', 'Basic Retouching'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-zinc-400">
                                <CheckCircle size={16} className="text-zinc-600" />
                                <span className="uppercase tracking-widest text-xs font-medium">{item}</span>
                            </div>
                            ))}
                        </div>
                        <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-800 text-white font-mono font-bold text-sm uppercase tracking-widest text-center transition-all border border-zinc-800">Book Small Team</a>
                    </div>

                    {/* LARGE GROUP CARD */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-10 hover:border-[#00D2BE] transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2 text-[#00D2BE]"><Users size={20}/></div>
                        <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">Studio / Large</h3>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">High-End External Studio Setup.</p>
                        <div className="text-5xl font-serif font-black text-white mb-2"><span className="text-2xl align-top text-zinc-500">$</span>750<span className="text-xl text-zinc-600 font-mono font-normal">+</span></div>
                        <div className="h-px w-full bg-zinc-800 my-8"></div>
                        <div className="space-y-4 mb-10 flex-grow font-mono">
                            {['Any Group Size', 'External Location', 'Professional Studio Lighting', 'Backdrop Setup Included', 'Advanced Retouching'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-zinc-300">
                                <CheckCircle size={16} className="text-[#00D2BE]" />
                                <span className="uppercase tracking-widest text-xs font-bold">{item}</span>
                            </div>
                            ))}
                        </div>
                        <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-mono font-bold text-sm uppercase tracking-widest text-center transition-all">Get Quote</a>
                    </div>
                </>
            )}

            {/* --- SPECIAL EVENTS PRICING --- */}
            {pricingCategory === 'events' && (
                <>
                    {/* STUDENT BUNDLE CARD */}
                    <div className="bg-black/40 border border-zinc-900 p-10 hover:border-zinc-700 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-sm">
                         <div className="flex items-center gap-2 mb-2 text-[#00D2BE]"><GraduationCap size={20}/></div>
                        <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">Student Bundle</h3>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">Prom, Grad, Athletics, Homecoming.</p>
                        <div className="text-5xl font-serif font-black text-white mb-2"><span className="text-2xl align-top text-zinc-500">$</span>250<span className="text-xl text-zinc-600 font-mono font-normal">+</span></div>
                        <div className="h-px w-full bg-zinc-900 my-8"></div>
                        <div className="space-y-4 mb-10 flex-grow font-mono">
                            {['Assorted Portrait Styles', 'Unlimited Outfit Changes', 'Digital Delivery', 'Video Add-on Available', 'Fast Turnaround'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-zinc-400">
                                <CheckCircle size={16} className="text-zinc-600" />
                                <span className="uppercase tracking-widest text-xs font-medium">{item}</span>
                            </div>
                            ))}
                        </div>
                        <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-800 text-white font-mono font-bold text-sm uppercase tracking-widest text-center transition-all border border-zinc-800">Book Student</a>
                    </div>

                    {/* MAJOR EVENTS CARD */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-10 hover:border-[#00D2BE] transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2 text-[#00D2BE]"><Camera size={20}/></div>
                        <h3 className="text-3xl font-serif font-black text-white italic uppercase mb-2">Major Events</h3>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-8">Weddings, Concerts, Reunions.</p>
                        <div className="text-5xl font-serif font-black text-white mb-2"><span className="text-2xl align-top text-zinc-500">$</span>400<span className="text-zinc-600 font-mono text-2xl"> - </span><span className="text-2xl align-top text-zinc-500">$</span>600<span className="text-xl text-zinc-600 font-mono font-normal">+</span></div>
                        <div className="h-px w-full bg-zinc-800 my-8"></div>
                        <div className="space-y-4 mb-10 flex-grow font-mono">
                            <div className="flex items-start gap-3 text-zinc-300">
                                <CheckCircle size={16} className="text-[#00D2BE] mt-1 shrink-0" />
                                <div>
                                    <span className="uppercase tracking-widest text-xs font-bold block">Option A: $400+</span>
                                    <span className="text-xs text-zinc-500">Full Day Photos + Short Clips</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-zinc-300">
                                <CheckCircle size={16} className="text-[#00D2BE] mt-1 shrink-0" />
                                <div>
                                    <span className="uppercase tracking-widest text-xs font-bold block">Option B: $600+</span>
                                    <span className="text-xs text-zinc-500">Full Day Dedicated Video Coverage</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <CheckCircle size={16} className="text-[#00D2BE]" />
                                <span className="uppercase tracking-widest text-xs font-bold">Recap Edit Included</span>
                            </div>
                        </div>
                        <a href="https://linktr.ee/azwclothing" target="_blank" rel="noreferrer" className="w-full py-4 bg-[#00D2BE] hover:bg-[#00b0a0] text-black font-mono font-bold text-sm uppercase tracking-widest text-center transition-all">Check Availability</a>
                    </div>
                </>
            )}

          </div>
        </div>
      </div>
    );
};

// --- Admin Components ---

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
    <div className="min-h-screen bg-black flex items-center justify-center relative">
        <BackgroundVideo />
      <div className="w-full max-w-md p-8 bg-black/80 border border-zinc-800 backdrop-blur-md">
        <h2 className="text-3xl font-serif font-black text-white uppercase italic mb-8">Staff Access</h2>
        {error && <div className="text-red-500 text-sm mb-4 font-mono">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4 font-mono">
          <input type="email" placeholder="Email" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white focus:border-[#00D2BE] outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white focus:border-[#00D2BE] outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-[#00D2BE] text-black font-bold py-4 uppercase tracking-widest">Enter</button>
        </form>
        <button onClick={() => setView('home')} className="mt-6 text-zinc-600 text-xs font-mono uppercase tracking-widest hover:text-white">Back to Site</button>
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const confirmDelete = (id: string) => {
    if (deleteId === id) {
        deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id));
        setDeleteId(null);
    } else {
        setDeleteId(id);
        // Auto reset after 3 seconds
        setTimeout(() => setDeleteId(null), 3000);
    }
  };

  const totals = projects.reduce((acc, curr) => ({
    income: acc.income + (curr.income || 0),
    expense: acc.expense + (curr.expense || 0),
    net: acc.net + ((curr.income || 0) - (curr.expense || 0))
  }), { income: 0, expense: 0, net: 0 });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
           <h1 className="text-4xl font-serif font-black italic uppercase">Dashboard</h1>
           <div className="flex items-center gap-4">
               <button onClick={() => setView('home')} className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-2 uppercase tracking-widest"><Home size={14}/> Back to Site</button>
               <button onClick={() => { signOut(auth); setView('login'); }} className="text-xs font-mono text-zinc-400 hover:text-red-500 flex items-center gap-2 uppercase tracking-widest"><LogOut size={14}/> Logout</button>
           </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-mono">
            <div className="bg-zinc-900 p-6 border-l-4 border-[#00D2BE]">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-white">${totals.income.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-red-900">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Expenses</div>
                <div className="text-3xl font-bold text-red-500">${totals.expense.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-emerald-500">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Net Profit</div>
                <div className={`text-3xl font-bold ${totals.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>${totals.net.toLocaleString()}</div>
            </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12 bg-zinc-900 p-6 font-mono text-sm">
          <input placeholder="Client" className="bg-black p-2 text-white border border-zinc-800 focus:border-[#00D2BE] outline-none" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} />
          <input placeholder="Project" className="bg-black p-2 text-white border border-zinc-800 focus:border-[#00D2BE] outline-none" value={newProject.projectName} onChange={e => setNewProject({...newProject, projectName: e.target.value})} />
          <input type="date" className="bg-black p-2 text-white border border-zinc-800 focus:border-[#00D2BE] outline-none" value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})} />
          <input type="number" placeholder="Income" className="bg-black p-2 text-white border border-zinc-800 focus:border-[#00D2BE] outline-none" value={newProject.income} onChange={e => setNewProject({...newProject, income: e.target.value})} />
          <input type="number" placeholder="Expense" className="bg-black p-2 text-white border border-zinc-800 focus:border-[#00D2BE] outline-none" value={newProject.expense} onChange={e => setNewProject({...newProject, expense: e.target.value})} />
          <button className="bg-[#00D2BE] text-black font-bold uppercase tracking-widest">Add</button>
        </form>

        <div className="space-y-2 font-mono text-sm">
          {projects.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-zinc-900 p-4 border border-zinc-800">
              <div>
                <div className="font-bold text-white">{p.clientName}</div>
                <div className="text-zinc-500 text-xs uppercase tracking-widest">{p.projectName}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[#00D2BE]">${p.income - p.expense}</div>
                <button
                    onClick={() => confirmDelete(p.id)}
                    className={`flex items-center gap-2 transition-all ${deleteId === p.id ? 'text-white bg-red-600 px-3 py-1 rounded' : 'text-red-500 hover:text-red-400'}`}
                >
                    {deleteId === p.id ? 'Confirm?' : <Trash2 size={14}/>}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => exportToCSV(projects, 'finances.csv')} className="mt-8 text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest">Download CSV</button>
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
    // Auth Init Logic for this Environment
    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            }
        } catch (e) {
            console.warn("Auth init warning:", e);
        }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u && view === 'admin') setView('login');
    });

    return () => unsubscribe();
  }, [view]);

  // If viewing admin or login, show that full screen
  if (view === 'login') return (
    <div className="font-sans">
        <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        `}} />
        <AdminLogin setView={setView} setAdminMode={setAdminMode} />
    </div>
  );

  if (view === 'admin' && user) return (
    <div className="font-sans">
        <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        `}} />
        <AdminDashboard user={user} setView={setView} />
    </div>
  );

  // Otherwise show the landing page
  return (
    <div className="font-sans min-h-screen text-zinc-200 selection:bg-[#00D2BE] selection:text-black">
      {/* Inject Fonts via Style Tag for Single File Portability */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: blob 7s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 20s linear infinite;
        }
        .bg-grain {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
        }
      `}} />

      <BackgroundVideo />

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

      <footer className="bg-black/90 backdrop-blur-xl border-t border-zinc-900 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-zinc-600 text-sm font-mono">
          <div className="flex items-center mb-4 md:mb-0">
             <span className="font-bold uppercase tracking-widest">© 2026 AZW</span>
          </div>
          <div className="flex space-x-6 items-center">
            <a href="https://www.instagram.com/azw.one/" className="hover:text-[#00D2BE] transition-colors uppercase tracking-widest text-xs font-bold">Instagram</a>
            <a href="https://linktr.ee/azwclothing" className="hover:text-[#00D2BE] transition-colors uppercase tracking-widest text-xs font-bold">Contact</a>
            {/* Secret Admin Button */}
            <button onClick={() => setView('login')} className="opacity-0 hover:opacity-100 transition-opacity ml-4"><Lock size={12}/></button>
          </div>
        </div>
      </footer>
    </div>
  );
}