/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  User as UserIcon, 
  Building2, 
  Building,
  Briefcase, 
  Waves, 
  Users, 
  LayoutDashboard,
  Search as SearchIcon,
  BarChart3,
  CheckCircle2,
  XCircle,
  Shield,
  ArrowRight,
  Hash,
  UserPlus,
  Save,
  Pencil,
  Trash2,
  Map as MapIcon,
  MapPin
} from 'lucide-react';
import { SeatingMap } from './components/SeatingMap';
import { WaveStats } from './pages/WaveStats';
import { sortWaves } from './utils/waveUtils';

// Data and Types
import employeeData from './data/employees_lts.json';
import type { Employee, ThemeMode } from './types';
import { saveToGitHub, fetchFromGitHub } from './utils/githubSync';

// ⭐ SUPERUSER IDs — add or remove Employee Numbers here
const SUPERUSER_IDS = [
  "4639",
  // add more IDs here easily
];

const getRole = (employeeNumber: string): string => {
  if (employeeNumber === "000000") return "facilitator";
  if (SUPERUSER_IDS.includes(employeeNumber)) return "superuser";
  return "employee";
};

// Components
import { ThemeToggle } from './components/ThemeToggle';
import { Footer } from './components/Footer';
import { SearchEngine } from './components/SearchEngine';
import { DrillDown } from './components/DrillDown';

export default function App() {
  const [user, setUser] = useState<Employee | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [empNumber, setEmpNumber] = useState('');
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drill' | 'search' | 'map' | 'stats'>('map');
  
  // New States
  const [employees, setEmployees] = useState<Employee[]>(employeeData as Employee[]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Employee | null>(null);
  
  // Deduplication States
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<[string, Employee[]][]>([]);
  const [duplicateSelections, setDuplicateSelections] = useState<Record<string, number>>({});

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', email: '', wave: '', cluster: '', team: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialization: Theme and Session
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    // Session
    const savedSession = localStorage.getItem('evaSession');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('evaSession');
      }
    }
    
    // Sync latest data from GitHub if available
    const syncData = async () => {
      const { data, error } = await fetchFromGitHub();
      if (data) {
        setEmployees(data);
        if (data.length === 0) {
          showToast('No employees found in data/employees_lts.json', 'error');
        }
      } else if (error) {
        showToast(error, 'error');
      }
      setIsLoading(false);
    };
    syncData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('themeMode', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Auth Handlers
  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedId = empNumber.trim();

    if (trimmedId === "000000") {
      setFoundEmployee({
        "Employee ID": "000000",
        "Name": "Facilitator Access",
        "Email": "admin@eva.com",
        "Wave": "27 April ⏰ 09:30 AM - 11:30 AM",
        "Cluster": "ALL",
        "Team": "ALL",
        "role": "facilitator"
      } as Employee);
      setLoginStep(2);
      return;
    }

    const found = employees.find(emp => emp["Employee ID"] === trimmedId);
    if (found) {
      setFoundEmployee(found as Employee);
      setLoginStep(2);
    } else {
      setError('Invalid Employee ID, please try again');
    }
  };

  const confirmLogin = () => {
    if (foundEmployee) {
      const role = getRole(foundEmployee["Employee ID"]);
      const userWithRole = { ...foundEmployee, role };
      setUser(userWithRole);
      localStorage.setItem('evaSession', JSON.stringify(userWithRole));
    }
  };

  const cancelLogin = () => {
    setLoginStep(1);
    setFoundEmployee(null);
    setEmpNumber('');
  };

  const handleLogout = () => {
    localStorage.removeItem('evaSession');
    setUser(null);
    setLoginStep(1);
    setEmpNumber('');
    setFoundEmployee(null);
  };

  // Toast
  useEffect(() => {
    if (toast && toast.type !== 'loading') {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  };

  // Extract unique values
  const uniqueWaves = useMemo(() => sortWaves(Array.from(new Set(employees.map(e => e.Wave)))), [employees]);
  const uniqueClusters = useMemo(() => Array.from(new Set(employees.map(e => String(e.Cluster)))).sort((a: string, b: string) => a.localeCompare(b, undefined, {numeric: true})), [employees]);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ id: '', name: '', email: '', wave: '', cluster: '', team: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (member: Employee) => {
    setEditingMember(member);
    
    setFormData({
      id: member["Employee ID"],
      name: member.Name,
      email: member.Email,
      wave: member.Wave,
      cluster: member.Cluster,
      team: member.Team
    });
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteModal = (member: Employee) => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingMember(null);
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;
    
    setIsSaving(true);
    showToast('Saving to GitHub...', 'loading');
    
    const updatedList = employees.filter(e => e["Employee ID"] !== deletingMember["Employee ID"]);
    setEmployees(updatedList);
    
    const result = await saveToGitHub(updatedList);
    setIsSaving(false);
    
    if (result.success) {
      showToast('Member deleted successfully ✅', 'success');
      closeDeleteModal();
    } else {
      showToast('Delete failed. Please try again ❌', 'error');
      // Revert if failed
      setEmployees(employees);
      closeDeleteModal();
    }
  };

  const handleCleanDuplicates = () => {
    const groups: Map<string, Employee[]> = new Map();
    employees.forEach(emp => {
      const id = emp["Employee ID"];
      if (!groups.has(id)) {
         groups.set(id, []);
      }
      groups.get(id)!.push(emp);
    });

    const dupes = Array.from(groups.entries()).filter(([id, arr]) => arr.length > 1);
    
    if (dupes.length === 0) {
      showToast("✅ No duplicates found. Data is clean!", "success");
      return;
    }
    
    setDuplicateGroups(dupes);
    
    const initialKeep: Record<string, number> = {};
    dupes.forEach(([id]) => {
      initialKeep[id] = 0;
    });
    setDuplicateSelections(initialKeep);
    
    setIsDuplicateModalOpen(true);
  };

  const confirmCleanDuplicates = async () => {
    setIsSaving(true);
    showToast('Saving to GitHub...', 'loading');
    
    const duplicateIds = new Set(duplicateGroups.map(g => g[0]));
    
    const cleanedEmployees = employees.filter(emp => {
      const id = emp["Employee ID"];
      if (duplicateIds.has(id)) {
        const group = duplicateGroups.find(g => g[0] === id)![1];
        const selectedIndex = duplicateSelections[id];
        return emp === group[selectedIndex];
      }
      return true;
    });
    
    setEmployees(cleanedEmployees);
    const result = await saveToGitHub(cleanedEmployees);
    setIsSaving(false);
    
    if (result.success) {
      showToast(`✅ Duplicates removed. Data cleaned!`, "success");
      setIsDuplicateModalOpen(false);
    } else {
      showToast("❌ Failed to save. Please try again.", "error");
      setEmployees(employees); // Revert
      setIsDuplicateModalOpen(false);
    }
  };

  const handleSaveMember = async () => {
    const errors: Record<string, string> = {};
    if (!formData.id) errors.id = 'ID is required';
    else if (!/^\d+$/.test(formData.id)) errors.id = 'ID must be numeric only';
    else if (!editingMember && employees.some(e => e["Employee ID"] === formData.id)) errors.id = '⚠️ This ID already exists';
    
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.wave) errors.wave = 'Wave is required';
    if (!formData.cluster) errors.cluster = 'Cluster is required';
    if (!formData.team) errors.team = 'Team is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    showToast('Saving to GitHub...', 'loading');

    const newEmp: Employee = {
      "Employee ID": formData.id,
      "Name": formData.name,
      "Email": formData.email,
      Wave: formData.wave,
      Cluster: formData.cluster,
      Team: formData.team
    };
    
    let updatedList;
    if (editingMember) {
      updatedList = employees.map(e => e["Employee ID"] === editingMember["Employee ID"] ? newEmp : e);
    } else {
      updatedList = [...employees, newEmp];
    }
    
    setEmployees(updatedList);
    
    const result = await saveToGitHub(updatedList);
    setIsSaving(false);
    
    if (result.success) {
      showToast('Member saved to GitHub successfully!', 'success');
      setIsModalOpen(false);
    } else {
      // Revert if failed, but prompt says "Saved locally only", let's keep local state.
      showToast('GitHub sync failed. Saved locally only.', 'error');
      setIsModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen login-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#D579A4] rounded-full animate-spin shadow-lg"></div>
        <p className="text-white font-bold tracking-widest text-sm animate-pulse">LOADING PROFILE DATA...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${!user ? 'login-bg' : ''}`}>
      {/* Universal Theme Toggle Moved logic - actually the MOD 3 and 4 refine this */}
      
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-sm space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                  <Shield className="w-8 h-8 text-[var(--color-indigo)]" />
                </div>
                <h1 className="text-3xl font-display font-black tracking-tight mt-6 gradient-text bg-white">Limitless Training</h1>
                <p className="text-white/80 font-medium">Simulation Management Portal</p>
              </div>

              <div className="card-surface p-8 pb-10 relative overflow-hidden group border border-[var(--border-color)]">
                <div className="absolute top-0 left-0 w-2 h-full header-brand" />
                
                <AnimatePresence mode="wait">
                  {loginStep === 1 ? (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <form onSubmit={handleStep1} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-dim-gray)] ml-1">Employee Number</label>
                          <input
                            type="text"
                            required
                            value={empNumber}
                            onChange={(e) => setEmpNumber(e.target.value)}
                            placeholder="Enter Employee ID"
                            autoFocus
                            className="w-full px-5 py-4 bg-white border border-[var(--border-color)] rounded-2xl input-ring transition-all outline-none font-bold text-lg text-[var(--text-primary)]"
                          />
                        </div>
                        {error && (
                          <motion.p 
                            animate={{ x: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                            className="text-red-500 text-xs font-bold transition-all"
                          >
                            {error}
                          </motion.p>
                        )}
                        <button type="submit" className="w-full py-4 btn-primary flex items-center justify-center gap-2">
                          CONTINUE <ArrowRight className="w-5 h-5" />
                        </button>
                        <a 
                          href="https://wa.me/201069996672?text=Hello%2C%20I'm%20contacting%20from%20Limitless%20SIM%20%F0%9F%91%8B%0AI%20cannot%20find%20my%20Employee%20ID.%0ACould%20you%20please%20help%20me%3F"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center mt-4 text-[12px] text-[var(--color-indigo)] underline decoration-dotted hover:opacity-80 hover:decoration-solid transition-all duration-200 cursor-pointer font-semibold"
                        >
                          💬 Can't find your ID? Click here
                        </a>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center space-y-8">
                       <div className="space-y-4">
                          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-[var(--color-indigo)] border-4 border-[var(--border-color)]">
                             <UserIcon className="w-10 h-10" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-dim-gray)]">Identity Confirmation</p>
                             <h2 className="text-2xl font-black leading-tight text-[var(--text-primary)]">{foundEmployee?.["Employee Name"]}</h2>
                             <span className="inline-block px-3 py-1 bg-[var(--color-indigo)]/10 text-[var(--color-indigo)] rounded-lg text-[10px] font-black uppercase">{foundEmployee?.Unit}</span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] font-medium">Is this you? Please confirm to continue.</p>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={confirmLogin} className="py-4 btn-primary flex items-center justify-center gap-2 text-xs">
                             <CheckCircle2 className="w-4 h-4" /> YES, IT'S ME
                          </button>
                          <button onClick={cancelLogin} className="py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black flex items-center justify-center gap-2 text-xs hover:bg-red-500/20">
                             <XCircle className="w-4 h-4" /> NO, WRONG ID
                          </button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <Footer onLogout={handleLogout} showLogout={!!user} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Header / Nav */}
            <header className="sticky top-0 z-[100] header-brand shadow-md">
               <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between">
                  <div className="flex items-center gap-6 h-full">
                     <h1 className="font-display font-bold text-white text-lg sm:text-xl whitespace-nowrap pt-1">
                        <span className="hidden sm:inline">Limitless Training Simulation</span>
                        <span className="sm:hidden">LTS 2026</span>
                     </h1>
                     
                     {/* Nav Items */}
                     <nav className="hidden sm:flex items-center h-full ml-4 space-x-2 pt-1">
                       <button 
                         onClick={() => setActiveTab('map')}
                         className={`h-full px-4 text-sm font-bold flex items-center transition-all ${activeTab === 'map' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                       >
                         Map
                       </button>
                       {(user.role === 'facilitator' || user.role === 'superuser') && (
                         <>
                           <button 
                             onClick={() => setActiveTab('drill')}
                             className={`h-full px-4 text-sm font-bold flex items-center transition-all ${activeTab === 'drill' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                           >
                             Drill-Down
                           </button>
                           <button 
                             onClick={() => setActiveTab('search')}
                             className={`h-full px-4 text-sm font-bold flex items-center transition-all ${activeTab === 'search' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                           >
                             Search
                           </button>
                           <button 
                             onClick={() => setActiveTab('stats')}
                             className={`h-full px-4 text-sm font-bold flex items-center transition-all ${activeTab === 'stats' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                           >
                             Stats
                           </button>
                         </>
                       )}
                     </nav>
                  </div>

                  <div className="flex items-center gap-2">
                     <ThemeToggle theme={theme} onToggle={toggleTheme} />
                  </div>
               </div>
               
               {/* Mobile Nav */}
               <nav className="sm:hidden flex items-center overflow-x-auto h-12 px-2 bg-black/10">
                 <button 
                   onClick={() => setActiveTab('map')}
                   className={`h-full px-4 text-xs font-bold whitespace-nowrap flex items-center transition-all ${activeTab === 'map' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                 >
                   Map
                 </button>
                 {(user.role === 'facilitator' || user.role === 'superuser') && (
                   <>
                     <button 
                       onClick={() => setActiveTab('drill')}
                       className={`h-full px-4 text-xs font-bold whitespace-nowrap flex items-center transition-all ${activeTab === 'drill' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                     >
                       Drill-Down
                     </button>
                     <button 
                       onClick={() => setActiveTab('search')}
                       className={`h-full px-4 text-xs font-bold whitespace-nowrap flex items-center transition-all ${activeTab === 'search' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                     >
                       Search
                     </button>
                     <button 
                       onClick={() => setActiveTab('stats')}
                       className={`h-full px-4 text-xs font-bold whitespace-nowrap flex items-center transition-all ${activeTab === 'stats' ? 'text-white border-b-[3px] border-[#D579A4]' : 'text-white/75 hover:text-white border-b-[3px] border-transparent'}`}
                     >
                       Stats
                     </button>
                   </>
                 )}
               </nav>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8 pb-14">
               {/* Welcome Header */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <h2 className="text-3xl sm:text-4xl font-display font-black">
                           Welcome, {user.role === 'facilitator' ? 'Facilitator' : user.Name.split(' ')[0]}! {user.role === 'superuser' ? '⭐' : '👋'}
                        </h2>
                        {user.role === 'superuser' && (
                           <span className="px-2 py-0.5 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase rounded-full shadow-sm">
                              ⭐ Super User
                           </span>
                        )}
                     </div>
                     <p className="text-[var(--text-secondary)] font-medium">Access your team simulations and training tracking.</p>
                  </div>
                  
                  {(user.role === 'superuser' || user.role === 'facilitator') && (
                  <div className="flex items-center gap-2">
                     {/* Drill-down and Search removed from here since they are in the header nav now */}
                  </div>
                  )}
               </div>

               {/* Profile Card */}
               {(user.role === 'employee' || user.role === 'superuser') && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 sm:px-6 sm:py-5 flex flex-col gap-4 shadow-xl"
                 >
                     {/* ROW 1 — IDENTITY */}
                     <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                        <div className="w-16 h-16 bg-transparent border-2 border-[var(--accent-color)] rounded-xl flex items-center justify-center text-[var(--accent-color)] shrink-0">
                           <UserIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-1 min-w-[320px] text-center md:text-left space-y-1">
                           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--accent-color)]/10 border border-[var(--accent-color)] rounded-full mb-1">
                              <Hash className="w-3 h-3 text-[var(--accent-color)]" />
                              <p className="font-mono text-[var(--accent-color)] text-[12px] font-bold leading-none uppercase">ID: {user["Employee ID"]}</p>
                           </div>
                           <h3 className="text-[20px] sm:text-[22px] font-display font-bold text-[var(--accent-color)] uppercase leading-tight md:whitespace-nowrap">
                             {user.Name}
                           </h3>
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                                 <Building className="w-3.5 h-3.5" /> Email: {user.Email}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* ROW 2 — INFO CARDS */}
                     <div className="flex flex-col md:flex-row gap-2.5 md:gap-3 w-full">
                        {/* CLUSTER */}
                        <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center h-full sm:py-3.5">
                            <div className="flex items-center justify-center gap-1 text-[var(--accent-color)] text-[10px] font-semibold uppercase tracking-[0.12em] mb-1">
                                <span>🏰</span> CLUSTER
                            </div>
                            <p className="text-[22px] font-display font-bold text-[var(--accent-color)] leading-none">{user.Cluster}</p>
                        </div>

                        {/* WAVE DATE */}
                        <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center h-full sm:py-3.5">
                            <div className="flex items-center justify-center gap-1 text-[var(--accent-color)] text-[10px] font-semibold uppercase tracking-[0.12em] mb-1">
                                <span>📅</span> WAVE DATE
                            </div>
                            <p className="text-[22px] font-display font-bold text-[var(--accent-color)] leading-none">
                              {/* Assume exact string split just like before on ' ⏰ ' to keep the format */}
                              {user.Wave.split(' ⏰ ')[0]?.trim()}
                            </p>
                        </div>

                        {/* WAVE TIME */}
                        <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center h-full sm:py-3.5">
                            <div className="flex items-center justify-center gap-1 text-[var(--accent-color)] text-[10px] font-semibold uppercase tracking-[0.12em] mb-1">
                                <span>⏰</span> WAVE TIME
                            </div>
                            <p className="text-[22px] font-display font-bold text-[var(--accent-color)] leading-none">
                              {user.Wave.split(' ⏰ ')[1]?.trim()}
                            </p>
                        </div>

                        {/* TACTICAL TEAM */}
                        <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center h-full sm:py-3.5">
                            <div className="flex items-center justify-center gap-1 text-[var(--accent-color)] text-[10px] font-semibold uppercase tracking-[0.12em] mb-1">
                                <span>👥</span> TACTICAL TEAM
                            </div>
                            <p className="text-[22px] font-display font-bold text-[var(--accent-color)] leading-none whitespace-nowrap">
                              {user.Team}
                            </p>
                        </div>
                     </div>
                 </motion.div>
               )}

               {/* Feature Tabs */}
               {true && (
                   <div className="min-h-[400px]">
                    <div className="mb-4 flex gap-3 flex-wrap justify-end">
                      
                      {(user.role === 'facilitator' || user.role === 'superuser') && (
                          <div className="flex gap-2">
                             <button 
                               onClick={openAddModal}
                               className="flex items-center gap-2 px-[22px] py-[10px] bg-transparent border border-[var(--color-indigo)] rounded-full text-[var(--color-indigo)] font-display font-semibold text-[14px] hover:bg-[var(--color-indigo)]/10 transition-all cursor-pointer"
                             >
                               <UserPlus className="w-4 h-4" /> + Add New Member
                             </button>
                             <button 
                               onClick={handleCleanDuplicates}
                               className="flex items-center gap-2 px-[22px] py-[10px] bg-transparent border border-[rgba(239,68,68,0.4)] rounded-full text-[#ef4444] font-display font-semibold text-[14px] hover:bg-[rgba(239,68,68,0.08)] hover:border-[#ef4444] transition-all cursor-pointer"
                             >
                               🧹 Clean Duplicates
                             </button>
                          </div>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {activeTab === 'map' ? (
                       <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <SeatingMap employees={employees} loggedInEmployee={user} userRole={user.role} />
                       </motion.div>
                      ) : activeTab === 'drill' ? (
                       <motion.div key="drill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="space-y-6">
                             <div className="pl-2">
                                <h3 className="text-xl font-display font-black tracking-tight">Wave Drill-Down</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Browse institutional structure from Wave to individual Teams.</p>
                             </div>
                             <DrillDown data={employees} onEdit={openEditModal} onDelete={openDeleteModal} userRole={user.role} />
                          </div>
                       </motion.div>
                      ) : activeTab === 'stats' ? (
                        <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <WaveStats employees={employees} userRole={user.role} onEdit={openEditModal} onDelete={openDeleteModal} />
                        </motion.div>
                    ) : (
                      <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="space-y-6">
                             <div className="pl-2">
                                <h3 className="text-xl font-display font-black tracking-tight">Database Search</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Search across all employee records with specific filters.</p>
                             </div>
                             <SearchEngine data={employees} onEdit={openEditModal} onDelete={openDeleteModal} userRole={user.role} />
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
               )}
            </main>
            <Footer onLogout={handleLogout} showLogout={!!user} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast-notification"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed top-6 left-1/2 z-[99999] bg-[var(--bg-card)] rounded-[12px] px-[22px] py-[14px] font-display text-[13px] text-[var(--text-primary)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[280px] text-center border ${
              toast.type === 'success' ? 'border-[#22c55e]' : toast.type === 'error' ? 'border-[#ef4444]' : 'border-[var(--accent-color)]'
            }`}
          >
            {toast.type === 'success' && '✅ '}
            {toast.type === 'error' && '❌ '}
            {toast.type === 'loading' && <div className="inline-block align-middle mr-2 mt-[-2px] w-3 h-3 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin"></div>}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 w-full min-w-[300px] max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar relative">
            <h2 className="text-[var(--accent-color)] font-display text-[20px] font-bold mb-6 flex items-center gap-2">
              {editingMember ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>
            
            <div className="space-y-4">
               <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Employee ID{editingMember && ' (Read Only)'}
                </label>
                <input 
                  type="text" 
                  value={formData.id}
                  disabled={!!editingMember}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  placeholder="e.g. 12345"
                  className={`w-full text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10 ${editingMember ? 'bg-[var(--bg-main)] opacity-70 cursor-not-allowed' : 'bg-[var(--input-bg)]'}`}
                />
                {editingMember && <p className="text-[10px] text-[var(--text-secondary)] mt-1">ID cannot be changed</p>}
                {formErrors.id && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.id}</p>}
              </div>

              {/* Field 2 - Name */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Employee full name"
                  className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10"
                />
                {formErrors.name && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              {/* Field 3 - Email */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com"
                  className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10"
                />
                {formErrors.email && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.email}</p>}
              </div>

              {/* Field 4 - Wave */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Wave
                </label>
                <select 
                  value={formData.wave}
                  onChange={(e) => setFormData({...formData, wave: e.target.value})}
                  className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10"
                >
                  <option value="">Select Wave...</option>
                  {uniqueWaves.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {formErrors.wave && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.wave}</p>}
              </div>

              {/* Field 5 - Cluster */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Cluster
                </label>
                <select 
                  value={formData.cluster}
                  onChange={(e) => setFormData({...formData, cluster: e.target.value})}
                  className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10"
                >
                  <option value="">Select Cluster...</option>
                  {uniqueClusters.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                {formErrors.cluster && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.cluster}</p>}
              </div>

              {/* Field 6 - Team */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-color)] mb-[6px]">
                  Team
                </label>
                <select 
                  value={formData.team}
                  onChange={(e) => setFormData({...formData, team: e.target.value})}
                  className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 font-display text-[14px] focus:border-[var(--accent-color)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-color)]/10"
                >
                  <option value="">Select Team...</option>
                  <option value="Team A">Team A</option>
                  <option value="Team B">Team B</option>
                  <option value="Team C">Team C</option>
                  <option value="Team D">Team D</option>
                </select>
                {formErrors.team && <p className="text-[#ef4444] text-[11px] mt-1">{formErrors.team}</p>}
              </div>
            </div>

            <div className="flex flex-row justify-between mt-7">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[var(--border-color)] border border-[var(--accent-color)] text-[var(--accent-color)] rounded-lg px-6 py-2.5 hover:opacity-80 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMember}
                className="flex items-center gap-2 bg-[var(--accent-color)] text-white font-bold rounded-lg px-6 py-2.5 hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : editingMember ? 'Save Changes' : 'Save Member'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingMember && (
        <div className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[#ef4444] rounded-2xl p-8 w-full min-w-[300px] max-w-[420px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <Trash2 className="w-12 h-12 text-[#ef4444] mx-auto" />
            <h2 className="text-[var(--text-primary)] font-display text-[20px] font-bold mt-4">
              Delete Member?
            </h2>
            <div className="my-3">
              <span className="font-bold text-[var(--accent-color)]">{deletingMember.Name}</span><br />
              <span className="text-[13px] text-[var(--text-secondary)]">(ID: {deletingMember["Employee ID"]})</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-6 whitespace-pre-line">
              This action cannot be undone.{"\n"}The member will be permanently removed from the system.
            </p>
            <div className="flex flex-row justify-center gap-3">
              <button 
                onClick={closeDeleteModal}
                className="bg-[var(--border-color)] border border-[var(--accent-color)] text-[var(--accent-color)] rounded-lg px-7 py-2.5 hover:opacity-80 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteMember}
                className="flex items-center justify-center gap-2 bg-[#ef4444] text-[#ffffff] font-bold rounded-lg px-7 py-2.5 hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4" />
                {isSaving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Review Modal */}
      {isDuplicateModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4"
          onClick={() => setIsDuplicateModalOpen(false)}
        >
          <div 
            className="bg-[var(--bg-card)] border border-[var(--accent-color)] rounded-2xl p-8 w-full max-w-[620px] max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5)] custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex items-center gap-2 mb-2">
                 <span className="text-2xl">🧹</span>
                 <h2 className="text-[var(--accent-color)] font-display text-[20px] font-bold">Duplicate Records Found</h2>
             </div>
             <p className="text-[13px] text-[var(--text-secondary)] mb-6">
                {duplicateGroups.length} duplicate IDs detected. Choose which record to KEEP for each.
             </p>
             
             <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => {
                    const allSelected: Record<string, number> = {};
                    duplicateGroups.forEach(([id]) => { allSelected[id] = 0; });
                    setDuplicateSelections(allSelected);
                  }}
                  className="text-[11px] font-bold text-[var(--accent-color)] underline hover:opacity-80"
                >
                  Select First of All
                </button>
                <button 
                  onClick={() => {
                    const noneSelected: Record<string, number> = {};
                    duplicateGroups.forEach(([id]) => { noneSelected[id] = -1; });
                    setDuplicateSelections(noneSelected);
                  }}
                  className="text-[11px] font-bold text-[var(--accent-color)] underline hover:opacity-80"
                >
                  Unselect All
                </button>
             </div>
             
             <div className="space-y-4">
               {duplicateGroups.map(([id, group]) => (
                  <div key={id} className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-main)]">
                     <h3 className="text-[12px] font-bold text-[var(--accent-color)] mb-3">ID: {id} — {group.length} copies found</h3>
                     <div className="space-y-2">
                        {group.map((emp, idx) => {
                           const isSelected = duplicateSelections[id] === idx;
                           return (
                             <div 
                               key={idx}
                               onClick={() => setDuplicateSelections({ ...duplicateSelections, [id]: isSelected ? -1 : idx })}
                               className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'border-transparent bg-transparent'}`}
                             >
                               <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' : 'border-[var(--text-secondary)]'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                               </div>
                               <div className="flex-1">
                                  <div className="font-bold text-[14px] text-[var(--text-primary)]">
                                    {emp.Name}
                                  </div>
                                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                    {emp.Email}
                                  </div>
                                  <div className="text-[11px] text-[var(--text-secondary)]">
                                    {emp.Wave} • 🏰 {emp.Cluster} • {emp.Team}
                                  </div>
                               </div>
                               <div className="text-[10px] text-[var(--text-secondary)] bg-[var(--input-bg)] rounded px-2 py-0.5 flex-shrink-0">
                                 {isSelected ? '✓ Selected to Keep' : `Record ${idx + 1}`}
                               </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
               ))}
             </div>
             
             <div className="flex flex-row justify-between mt-6">
                <button 
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="bg-[var(--border-color)] border border-[var(--accent-color)] text-[var(--accent-color)] rounded-lg px-6 py-2.5 hover:opacity-80 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCleanDuplicates}
                  className="flex items-center gap-2 bg-[var(--accent-color)] text-white font-bold rounded-lg px-6 py-2.5 hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  <Trash2 className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Keep Selected & Remove Duplicates'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// v2.0.000