import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight, Waves, Crown, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Employee } from '../types';
import { sortWaves } from '../utils/waveUtils';
import { getTeamColor } from './SearchEngine';

interface DrillDownProps {
  data: Employee[];
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
  userRole?: string;
}

export const DrillDown = ({ data, onEdit, onDelete, userRole }: DrillDownProps) => {
  const [wave, setWave] = useState<string | null>(null);
  const [cluster, setCluster] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const SWIPE_THRESHOLD = 80; // px
  const VERTICAL_LIMIT = 50; // px

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = Math.abs(
      touchStartY.current - touchEndY.current
    );

    // diffX POSITIVE = finger moved LEFT = GO BACK
    if (diffX > SWIPE_THRESHOLD && diffY < VERTICAL_LIMIT) {
      handleSwipeBack();
    }
  };

  const handleSwipeBack = () => {
    if (team) {
      setTeam(null);        // Members → Teams
    } else if (cluster) {
      setCluster(null);     // Teams → Clusters
    } else if (wave) {
      setWave(null);        // Clusters → Waves
    }
  };

  const uniqueWaves = useMemo(() => sortWaves(Array.from(new Set(data.map(e => e.Wave)))), [data]);
  
  const filteredClusters = useMemo(() => {
    if (!wave) return [];
    return Array.from(new Set(data.filter(e => e.Wave === wave).map(e => String(e.Cluster))))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [wave, data]);

  const filteredTeams = useMemo(() => {
    if (!wave || !cluster) return [];
    return Array.from(new Set(data.filter(e => e.Wave === wave && String(e.Cluster) === cluster).map(e => e.Team)));
  }, [wave, cluster, data]);

  const filteredMembers = useMemo(() => {
    if (!wave || !cluster || !team) return [];
    return data.filter(e => e.Wave === wave && String(e.Cluster) === cluster && e.Team === team);
  }, [wave, cluster, team, data]);

  React.useEffect(() => {
    if (team && filteredMembers.length === 0) {
      setTeam(null);
    } else if (cluster && !team && filteredTeams.length === 0) {
      setCluster(null);
    } else if (wave && !cluster && filteredClusters.length === 0) {
      setWave(null);
    }
  }, [team, cluster, wave, filteredMembers.length, filteredTeams.length, filteredClusters.length]);

  const resetFromWave = () => { setWave(null); setCluster(null); setTeam(null); };
  const resetFromCluster = () => { setCluster(null); setTeam(null); };

  const getWaveCount = (w: string) => data.filter(e => e.Wave === w).length;
  const getClusterCount = (c: string) => data.filter(e => e.Wave === wave && String(e.Cluster) === c).length;
  const getTeamCount = (t: string) => data.filter(e => e.Wave === wave && String(e.Cluster) === cluster && e.Team === t).length;

  const Badge = ({ count }: { count: number }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--accent-purple)]/10 border border-[var(--border-color)] rounded-full text-[var(--accent-purple)] text-[11px] font-semibold">
      {count}
    </span>
  );

  const BackButton = ({ onClick, label }: { onClick: () => void, label: string }) => (
    <div className="flex flex-col gap-2">
      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-full font-bold text-xs hover:bg-[var(--accent-purple)] hover:text-white hover:border-[var(--accent-purple)] transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {label}
      </motion.button>
      
      {/* Visual Swipe Hint */}
      <div className="hidden sm:hidden md:hidden lg:hidden" style={{ display: 'contents' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media (hover: none) and (pointer: coarse) {
            .swipe-hint { display: block !important; }
          }
        ` }} />
        <p className="swipe-hint hidden text-[11px] text-[var(--text-secondary)] text-center font-medium">
          ← Swipe left to go back
        </p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 0.4, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="hidden md:flex items-center gap-1 text-[10px] text-[var(--text-secondary)] pointer-events-none"
      >
        <ArrowLeft className="w-3 h-3" /> swipe hint text omitted for desktop
      </motion.div>
    </div>
  );

  return (
    <div 
      className="space-y-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Non-clickable Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-80">
        <span className="flex items-center gap-1.5">🌊 Waves</span>
        {wave && (
          <>
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
            <span className="flex items-center gap-1.5">{wave}</span>
          </>
        )}
        {cluster && (
          <>
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
            <span className="flex items-center gap-1.5">🏰 {cluster}</span>
          </>
        )}
        {team && (
          <>
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getTeamColor(team) }}>{team}</span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!wave ? (
          <motion.div 
            key="waves" 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {uniqueWaves.map((w, idx) => (
              <motion.button 
                key={w} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setWave(w)} 
                className="group p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl text-left hover:border-[var(--accent-color)] hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 z-10">
                  <Badge count={getWaveCount(w)} />
                </div>
                <Waves className="absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 text-[var(--accent-color)] transition-opacity" />
                <p className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-tighter mb-1">Select Wave</p>
                <h4 className="font-display font-bold text-lg leading-tight text-[var(--text-primary)]">{w}</h4>
              </motion.button>
            ))}
          </motion.div>
        ) : !cluster ? (
          <motion.div key="clusters" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <BackButton onClick={resetFromWave} label="Back to Waves" />
            </div>
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Clusters in {wave}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredClusters.map((c, idx) => (
                <motion.button 
                  key={c} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCluster(c)} 
                  className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col items-center gap-3 hover:border-[var(--accent-color)] transition-all relative"
                >
                  <div className="absolute top-2 right-2">
                    <Badge count={getClusterCount(c)} />
                  </div>
                  <div className="p-3 bg-[var(--accent-color)]/10 rounded-xl text-[var(--accent-color)]"><Crown className="w-6 h-6" /></div>
                  <span className="font-bold text-[var(--text-primary)]">{c}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : !team ? (
          <motion.div key="teams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <BackButton onClick={resetFromWave} label="Back to Waves" />
              <BackButton onClick={resetFromCluster} label="Back to Clusters" />
            </div>
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Teams in Cluster {cluster}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredTeams.map((t, idx) => (
                <motion.button 
                  key={t} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTeam(t)} 
                  className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col items-center gap-3 hover:border-[var(--accent-color)] transition-all relative"
                  style={{ borderBottomWidth: '4px', borderBottomColor: getTeamColor(t) }}
                >
                  <div className="absolute top-2 right-2">
                    <Badge count={getTeamCount(t)} />
                  </div>
                  <div className="p-3 bg-[var(--accent-color)]/10 rounded-xl" style={{ color: getTeamColor(t) }}>
                    <div className="w-6 h-6 rounded-full bg-current"></div>
                  </div>
                  <span className="font-bold text-center leading-tight text-[var(--text-primary)]">{t}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
             <div className="flex flex-wrap gap-2 mb-4">
                <BackButton onClick={resetFromWave} label="Back to Waves" />
                <BackButton onClick={resetFromCluster} label="Back to Clusters" />
                <BackButton onClick={() => setTeam(null)} label="Back to Teams" />
             </div>
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: getTeamColor(team) }}></span>
                  {team} Members
                </h3>
                <span className="bg-[var(--accent-purple)] text-white text-[10px] font-black px-3 py-1 rounded-full">{filteredMembers.length} Members</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {[...filteredMembers].sort((a, b) => a.Name.localeCompare(b.Name)).map((m, idx) => (
                 <motion.div 
                   key={m["Employee ID"]} 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.03 }}
                   className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl flex flex-col gap-3"
                 >
                   <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-3 relative">
                     <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--accent-color)] font-black border border-[var(--border-color)]">
                       {m.Name.charAt(0)}
                     </div>
                     <h4 className="font-black text-lg leading-tight text-[var(--text-primary)] pr-[70px]">{m.Name}</h4>
                     {(userRole === 'facilitator' || userRole === 'superuser') && onEdit && onDelete && (
                       <div className="absolute top-0 right-0 flex gap-1">
                         <button
                           onClick={() => onEdit(m)}
                           title="Edit member"
                           className="w-[30px] h-[30px] bg-transparent border border-[var(--border-color)] rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:text-[var(--accent-purple)] transition-all duration-200"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => onDelete(m)}
                           title="Delete member"
                           className="w-[30px] h-[30px] bg-transparent border border-[rgba(239,68,68,0.3)] rounded-md flex items-center justify-center text-[#ef4444] hover:border-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     )}
                   </div>
                   <div className="space-y-1 text-xs font-bold leading-relaxed">
                     <p><span className="text-[var(--text-secondary)]">Email:</span> <span className="text-[var(--text-primary)]">{m.Email}</span></p>
                     <p><span className="text-[var(--text-secondary)]">ID:</span> <span className="text-[var(--text-primary)]">{m["Employee ID"]}</span></p>
                   </div>
                 </motion.div>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
