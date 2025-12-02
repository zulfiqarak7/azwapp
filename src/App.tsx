import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Briefcase, 
  Plus, 
  Trash2, 
  Lock, 
  LogOut, 
  Menu, 
  X,
  CheckCircle,
  Users,
  Video,
  Star,
  Home,
  PlayCircle,
  ExternalLink,
  List
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously
} from "firebase/auth";
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

// --- Firebase Configuration ---
const localConfig = {
  apiKey: "AIzaSyCM2J8JaRTJyXqqCqh1JM8tL_PqpQOPcAo",
  authDomain: "azw-landing.firebaseapp.com",
  projectId: "azw-landing",
  storageBucket: "azw-landing.firebasestorage.app",
  messagingSenderId: "896631813746",
  appId: "1:896631813746:web:e520e8c0d87d9200fbf4eb",
  measurementId: "G-E2ZG8V5H72"
};

// Check for environment/sandbox config, fallback to local
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : localConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'azw-landing';

// --- Utility: Export to CSV ---
const exportToCSV = (data, fileName) => {
  if (!data || !data.length) {
    alert("No data to export");
    return;
  }
  const headers = ["Client Name", "Project Name", "Date", "Status", "Income ($)", "Expenses ($)", "Net ($)"];
  const csvRows = [
    headers.join(','), 
    ...data.map(row => {
      const dateStr = row.date ? new Date(row.date).toLocaleDateString() : '';
      const net = (parseFloat(row.income) || 0) - (parseFloat(row.expense) || 0);
      const escape = (text) => `"${(text || '').toString().replace(/"/g, '""')}"`;
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

// --- Components ---

const Navigation = ({ setView, user, currentView, isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <nav className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        {/* LOGO SECTION */}
        <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
          {/* Logo with text fallback for preview */}
          <img 
            src="/logo.png" 
            alt="Directed By AZW" 
            className="h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }}
          />
          <span className="hidden ml-2 text-xl font-bold text-white tracking-tighter italic" style={{fontFamily: 'serif'}}>
            DIRECTED BY <span className="text-red-600">AZW</span>
          </span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => setView('home')} className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-red-600' : 'text-zinc-400 hover:text-white'}`}>Home</button>
          <button onClick={() => setView('packages')} className={`text-sm font-medium transition-colors ${currentView === 'packages' ? 'text-red-600' : 'text-zinc-400 hover:text-white'}`}>2026 Offers</button>
          <button onClick={() => setView('portfolio')} className={`text-sm font-medium transition-colors ${currentView === 'portfolio' ? 'text-red-600' : 'text-zinc-400 hover:text-white'}`}>Portfolio</button>
          
          {user ? (
             <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-red-500 border border-red-900/30 hover:bg-zinc-800 transition-all flex items-center gap-2`}>
                <Briefcase size={16} /> Zak's Dashboard
             </button>
          ) : (
             <button onClick={() => setView('login')} className="text-sm font-medium text-zinc-500 hover:text-white flex items-center gap-1">
               <Lock size={14} /> Admin
             </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400 hover:text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Menu */}
    {isMobileMenuOpen && (
      <div className="md:hidden bg-zinc-950 border-b border-zinc-900">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md">Home</button>
          <button onClick={() => { setView('packages'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md">2026 Offers</button>
          <button onClick={() => { setView('portfolio'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md">Portfolio</button>
          <button onClick={() => { setView(user ? 'admin' : 'login'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-500 hover:bg-zinc-900 rounded-md">
            {user ? 'Dashboard' : 'Admin Login'}
          </button>
        </div>
      </div>
    )}
  </nav>
);

const Hero = ({ setView }) => (
  <div className="relative overflow-hidden bg-zinc-950 min-h-[calc(100vh-80px)] flex items-center justify-center">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-red-900/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-full h-full bg-zinc-800/10 rounded-full blur-3xl opacity-20"></div>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 uppercase italic">
        VISION & SOUND<br/>
        <span className="text-red-600">AZW</span>
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-zinc-400 mb-10 font-light">
        Strategy, Content, and Cinema for 2026.
      </p>
      <div className="flex justify-center gap-4">
        <button onClick={() => setView('packages')} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-none transition-all transform hover:scale-105 shadow-lg shadow-red-900/20 uppercase tracking-widest">
          View 2026 Offers
        </button>
      </div>
    </div>
  </div>
);

const Packages = () => {
  return (
    <div className="bg-zinc-950 min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black italic text-white mb-4 uppercase">2026 Visual Offerings</h2>
          <p className="text-zinc-500">Flexible plans to dominate the season.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* THE ROLLOUT */}
          <div className="relative bg-zinc-900 border-2 border-red-600/50 p-8 rounded-xl shadow-2xl shadow-red-900/10">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-1 font-bold tracking-widest uppercase text-sm">
              Best Value • 3 Month Plan
            </div>
            
            <h3 className="text-3xl font-black text-white italic mb-2 uppercase text-center mt-4">The Rollout</h3>
            <p className="text-zinc-400 text-center text-sm mb-6">Complete visual dominance for the 2026 season.</p>
            
            <div className="text-5xl font-black text-center text-white mb-2">$850<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
            <p className="text-center text-zinc-500 text-xs mb-8 italic">Split payments available • Pause anytime</p>

            <div className="space-y-6 mb-8 border-t border-zinc-800 pt-6">
              <div className="flex gap-4">
                <Video className="text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">3 Music Videos Per Month</h4>
                  <p className="text-zinc-400 text-sm">1 Full Production (w/ Studio Access) + 2 Run & Gun style videos.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Camera className="text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">2 Photoshoots</h4>
                  <p className="text-zinc-400 text-sm">Cover art, Spotify/Apple profiles, and high-res thumbnails.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Users className="text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">2 Content Days</h4>
                  <p className="text-zinc-400 text-sm">Dedicated sessions for Reels/TikTok clips.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Briefcase className="text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Strategy & Backend</h4>
                  <p className="text-zinc-400 text-sm">Shared notes for ideas, post scheduling, and I handle all backend scheduling so you don't stress.</p>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex gap-3">
                <Star className="text-yellow-500 shrink-0" />
                <div>
                    <h4 className="font-bold text-white text-sm">RMRP Bonus</h4>
                    <p className="text-zinc-400 text-xs">Free/discounted opener slots + Free entry for RMRP shows in Chi/Aurora for 2026.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/20 to-zinc-900 border border-red-900/30 p-4 rounded mb-8">
                <p className="text-white text-sm font-bold flex items-center gap-2">
                    <Users size={16} className="text-red-500"/> THE REFERRAL DEAL:
                </p>
                <p className="text-zinc-400 text-xs mt-1">Lock in w/ a friend and I knock <span className="text-white font-bold">$100 off</span> the first month for BOTH of you.</p>
            </div>

            <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest transition-colors">
              Start Your Rollout
            </button>
          </div>

          {/* THE SINGLE */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl opacity-90 hover:opacity-100 transition-opacity">
            <h3 className="text-2xl font-black text-white italic mb-2 uppercase text-center">The Single</h3>
            <p className="text-zinc-400 text-center text-sm mb-6">One-off visual execution.</p>
            
            <div className="text-4xl font-black text-center text-white mb-8">$450 <span className="text-lg text-zinc-500 font-normal">/video</span></div>

            <ul className="space-y-4 mb-8 border-t border-zinc-800 pt-6">
              <li className="flex items-center text-zinc-300 text-sm">
                <CheckCircle className="text-zinc-600 w-4 h-4 mr-3" />
                1 High Quality Music Video
              </li>
              <li className="flex items-center text-zinc-300 text-sm">
                <CheckCircle className="text-zinc-600 w-4 h-4 mr-3" />
                Professional Editing & Color
              </li>
              <li className="flex items-center text-zinc-300 text-sm">
                <CheckCircle className="text-zinc-600 w-4 h-4 mr-3" />
                Standard Turnaround
              </li>
            </ul>

            <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest transition-colors border border-zinc-700">
              Book Single Video
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const projects = [
    { 
      title: "Another Love Song", 
      artist: "Wilmo",
      img: "https://img.youtube.com/vi/OVSVo2zTMM0/maxresdefault.jpg",
      link: "https://youtu.be/OVSVo2zTMM0"
    },
    { 
      title: "HAHA! (Official Music Video)", 
      artist: "Pa$ty",
      img: "https://img.youtube.com/vi/y9krRRjjLEA/maxresdefault.jpg",
      link: "https://youtu.be/y9krRRjjLEA"
    },
    { 
      title: "Back Again (Music Video)", 
      artist: "Zayyfrm050",
      img: "https://img.youtube.com/vi/oTqo4FKAEcc/maxresdefault.jpg",
      link: "https://youtu.be/oTqo4FKAEcc"
    },
    { 
      title: "FEEL LESS RIGHT THAN WRONG", 
      artist: "Cash$tarr",
      img: "https://img.youtube.com/vi/Xpbu7kPphdw/maxresdefault.jpg",
      link: "https://youtu.be/Xpbu7kPphdw"
    },
    { 
      title: "Everyday (Official Music Video)", 
      artist: "Pa$ty",
      img: "https://img.youtube.com/vi/581MvmIE9to/maxresdefault.jpg",
      link: "https://youtu.be/581MvmIE9to"
    },
    { 
      title: "Stay (Official Music Video)", 
      artist: "Nyce Widdit",
      img: "https://img.youtube.com/vi/NOTk0b_ieNU/maxresdefault.jpg",
      link: "https://youtu.be/NOTk0b_ieNU"
    }
  ];

  const playlistUrl = "https://www.youtube.com/playlist?list=PLN86zTGXdQcoO-nbBlx3mSgAUTzYbFdqW";

  return (
    <div className="bg-zinc-950 min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-black italic text-white mb-10 border-l-4 border-red-600 pl-4 uppercase">Selected Works</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {projects.map((proj, idx) => (
            <a 
              key={idx} 
              href={proj.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer block hover:border-red-600 transition-colors"
            >
              <img 
                src={proj.img} 
                alt={proj.title}
                className="w-full h-full object-cover opacity-60 transition-all group-hover:opacity-40 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:text-red-500 transition-all transform group-hover:scale-110" />
              </div>
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-red-500 transition-colors">{proj.title}</h3>
                <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold">{proj.artist}</p>
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
                className="flex items-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest border border-zinc-800 hover:border-red-600 transition-all"
            >
                <List size={20} className="text-red-600"/> View Full Playlist on YouTube
            </a>
        </div>

      </div>
    </div>
  );
};

// --- Admin Section ---

const Login = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setView('admin');
    } catch (err) {
      setError("Failed to login.");
      console.error(err);
    }
  };

  const handleDemoLogin = async () => {
    // Allows preview users to see the dashboard without credentials
    try {
        await signInAnonymously(auth);
        setView('admin');
    } catch(err) {
        setError("Demo login failed.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-black italic text-white mb-8 uppercase tracking-widest animate-pulse">
        Welcome back Zak
      </h1>
      
      <div className="max-w-md w-full bg-zinc-900 p-8 rounded-none border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <Lock className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Admin Portal</h2>
        </div>
        
        {error && <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 mb-4 text-xs">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors"
              placeholder="admin@azw.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 uppercase tracking-widest transition-colors">
            Enter
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
            <button onClick={handleDemoLogin} className="text-xs text-zinc-500 underline hover:text-white">
                View Demo Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ user, setView }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    clientName: '',
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    income: '',
    expense: '',
    status: 'In Progress'
  });

  const collectionName = 'projects';
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, collectionName), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projData);
      setLoading(false);
    }, (error) => { console.error(error); setLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, collectionName), {
        ...newProject,
        income: parseFloat(newProject.income) || 0,
        expense: parseFloat(newProject.expense) || 0,
        createdAt: serverTimestamp()
      });
      setNewProject({ clientName: '', projectName: '', date: new Date().toISOString().split('T')[0], income: '', expense: '', status: 'In Progress' });
    } catch (err) { alert("Failed to add project"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, collectionName, id)); } 
    catch (err) { console.error(err); }
  };

  const totals = useMemo(() => {
    return projects.reduce((acc, curr) => ({
      income: acc.income + (curr.income || 0),
      expense: acc.expense + (curr.expense || 0),
      net: acc.net + ((curr.income || 0) - (curr.expense || 0))
    }), { income: 0, expense: 0, net: 0 });
  }, [projects]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-black italic uppercase text-white">Welcome back Zak</h1>
              <p className="text-zinc-500 text-sm">Financial Tracking & Project Management</p>
          </div>
          <div className="flex items-center gap-4">
              <button 
                  onClick={() => setView('home')} 
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded transition-all flex items-center gap-2"
              >
                  <Home size={14} /> Back to Site
              </button>
              <button onClick={() => { signOut(auth); setView('login'); }} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 p-6 border-l-4 border-zinc-700">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Revenue</div>
                <div className="text-3xl font-black text-white">${totals.income.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-red-900">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Expenses</div>
                <div className="text-3xl font-black text-red-500">${totals.expense.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 p-6 border-l-4 border-green-900">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Net Profit</div>
                <div className={`text-3xl font-black ${totals.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>${totals.net.toLocaleString()}</div>
            </div>
        </div>

        <div className="bg-zinc-900 p-6 mb-8 border border-zinc-800">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wider"><Plus size={18} className="text-red-500"/> Log New Project</h3>
            <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Client</label>
                    <input required type="text" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm focus:border-red-600 focus:outline-none text-white" 
                        value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Project</label>
                    <input required type="text" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm focus:border-red-600 focus:outline-none text-white" 
                        value={newProject.projectName} onChange={e => setNewProject({...newProject, projectName: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Date</label>
                    <input required type="date" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm text-zinc-300 focus:border-red-600 focus:outline-none" 
                        value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})} />
                </div>
                 <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Status</label>
                    <select className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm text-zinc-300 focus:border-red-600 focus:outline-none"
                        value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Invoiced</option>
                        <option>Paid</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Income</label>
                    <input required type="number" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm focus:border-red-600 focus:outline-none text-white" 
                        value={newProject.income} onChange={e => setNewProject({...newProject, income: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Expense</label>
                    <input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm focus:border-red-600 focus:outline-none text-white" 
                        value={newProject.expense} onChange={e => setNewProject({...newProject, expense: e.target.value})} />
                </div>
                <div className="lg:col-span-4 flex items-end">
                    <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6 text-sm transition-colors w-full md:w-auto uppercase tracking-wide">
                        Add Record
                    </button>
                </div>
            </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold uppercase tracking-wider">Recent Projects</h3>
                <button onClick={() => exportToCSV(projects, `AZW_Finances_${new Date().toISOString().slice(0,10)}.csv`)} className="text-green-500 text-xs font-bold uppercase hover:underline">
                     Export CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 uppercase font-medium text-xs text-zinc-500">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Net</th>
                            <th className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr> : 
                         projects.map((proj) => (
                            <tr key={proj.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">{proj.date}</td>
                                <td className="px-6 py-4 font-bold text-white">{proj.clientName}</td>
                                <td className="px-6 py-4">{proj.projectName}</td>
                                <td className="px-6 py-4"><span className="bg-zinc-800 text-zinc-300 px-2 py-1 text-xs uppercase">{proj.status}</span></td>
                                <td className="px-6 py-4 text-right font-bold text-white">${(proj.income - proj.expense).toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDelete(proj.id)} className="text-zinc-600 hover:text-red-600"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
};

// --- Main App Controller ---

export default function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Check if we're in the weird sandbox mode (local env check)
    // @ts-ignore
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // @ts-ignore
        signInWithCustomToken(auth, __initial_auth_token).catch(e => console.warn(e));
    }

    // 2. Standard Firebase listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && view === 'admin') setView('login');
    });
    return () => unsubscribe();
  }, [view]);

  return (
    <div className="font-sans bg-zinc-950 min-h-screen text-zinc-200 selection:bg-red-600 selection:text-white">
      {view !== 'admin' && view !== 'login' && (
        <Navigation 
            setView={setView} 
            user={user} 
            currentView={view} 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      )}
      
      {view === 'home' && <Hero setView={setView} />}
      {view === 'packages' && <Packages />}
      {view === 'portfolio' && <Portfolio />}
      {view === 'login' && <Login setView={setView} />}
      {view === 'admin' && user && <AdminDashboard user={user} setView={setView} />}
      
      {view !== 'admin' && view !== 'login' && (
        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-zinc-600 text-sm">
            <div className="flex items-center mb-4 md:mb-0">
               {/* Logo Fallback Logic */}
               <img src="/logo.png" alt="Directed By AZW" className="h-6 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" 
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
               <span className="hidden ml-3 text-xs font-bold uppercase tracking-wider text-zinc-600">2026 Season</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-red-600 transition-colors">Instagram</a>
              <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}