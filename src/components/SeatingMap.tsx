import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import { Employee } from '../types';
import { getTeamColor } from './SearchEngine';

interface SeatingMapProps {
  employees: Employee[];
  loggedInEmployee: Employee | null;
  userRole: string;
}

export const SeatingMap: React.FC<SeatingMapProps> = ({ employees, loggedInEmployee, userRole }) => {
  const allWaves = useMemo(() => Array.from(new Set(employees.map(e => e.Wave))), [employees]);
  const defaultWave = loggedInEmployee ? loggedInEmployee.Wave : (allWaves[0] || '');
  const [selectedWave, setSelectedWave] = useState(defaultWave);
  const [selectedTeam, setSelectedTeam] = useState<{cluster: string, team: string, members: Employee[]} | null>(null);

  const waveEmployees = useMemo(() => 
    employees.filter(e => e.Wave === selectedWave), 
    [employees, selectedWave]
  );

  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, Employee[]>> = {};
    waveEmployees.forEach(emp => {
      const cluster = String(emp.Cluster);
      if (!groups[cluster]) groups[cluster] = {};
      if (!groups[cluster][emp.Team]) groups[cluster][emp.Team] = [];
      groups[cluster][emp.Team].push(emp);
    });
    return groups;
  }, [waveEmployees]);

  const clusterNames = Object.keys(groupedData).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-[var(--accent-color)] font-display">🗺️ Wave {selectedWave} — Seating Map</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6">Your table is highlighted</p>
      </div>

      {/* Facilitator Wave Selector */}
      {(userRole === 'facilitator' || userRole === 'superuser') && (
        <div className="flex gap-2 mb-4">
          {allWaves.map(wave => (
            <button
              key={wave}
              onClick={() => setSelectedWave(wave)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedWave === wave ? 'bg-[var(--accent-color)] text-white' : 'bg-transparent border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)] hover:text-[var(--text-primary)]'}`}
            >
              Wave {wave}
            </button>
          ))}
        </div>
      )}

      {waveEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl">
          <MapPin className="w-12 h-12 mb-4 opacity-50" />
          <p>No seating data available</p>
        </div>
      ) : (
        clusterNames.map(cluster => (
          <div key={cluster} className="w-full">
            <h3 className="text-[var(--accent-color)] font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">Cluster {cluster}</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(groupedData[cluster] as Record<string, Employee[]>).sort((a,b) => a[0].localeCompare(b[0])).map(([team, members]) => {
                const teamMembers = members as Employee[];
                const isUserTable = loggedInEmployee && teamMembers.some(m => m["Employee ID"] === loggedInEmployee["Employee ID"]);
                const isClickable = (userRole === 'facilitator' || userRole === 'superuser' || isUserTable);
                const teamColor = getTeamColor(team);
                
                return (
                  <div
                    key={team}
                    onClick={() => isClickable && setSelectedTeam({ cluster, team, members: teamMembers })}
                    className={`min-w-[220px] bg-[var(--bg-card)] border rounded-xl relative overflow-hidden transition-all ${isUserTable ? 'shadow-[0_0_20px_rgba(var(--accent-color-rgb),0.15)] cursor-pointer' : 'border-[var(--border-color)] hover:border-[var(--accent-color)]'}`}
                    style={isUserTable ? { borderColor: teamColor } : {}}
                  >
                    <div className="h-2 w-full" style={{ backgroundColor: teamColor }}></div>
                    <div className="p-4">
                      {isUserTable && <div className="absolute top-2 right-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-l-lg" style={{ backgroundColor: teamColor }}>Your Table</div>}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }}></span>
                          {team}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {teamMembers.length}
                        </span>
                      </div>
                      <div className="border-t border-[var(--border-color)] my-2" />
                      <div className="space-y-1.5 pt-1">
                        {teamMembers.map((m, i) => {
                          const isCurrentUser = loggedInEmployee && m["Employee ID"] === loggedInEmployee["Employee ID"];
                          return (
                            <div key={i} className={`flex flex-col mb-1 ${isCurrentUser ? 'text-[var(--accent-color)]' : ''}`}>
                              <div className={`flex items-center gap-1.5 font-bold text-[13px] ${isCurrentUser ? '' : 'text-[var(--text-primary)]'}`} style={isCurrentUser ? { color: teamColor } : {}}>
                                {isCurrentUser && '★ '}
                                {m.Name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Popup */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div 
            key="team-popup"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedTeam(null)}
          >
            <div className="bg-[var(--bg-card)] border rounded-2xl p-7 w-full max-w-[360px] shadow-2xl" style={{ borderColor: getTeamColor(selectedTeam.team) }} onClick={e => e.stopPropagation()}>
              <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: getTeamColor(selectedTeam.team) }}>
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: getTeamColor(selectedTeam.team) }}></span>
                {selectedTeam.team}
              </h4>
              <p className="text-[var(--text-secondary)] text-[12px] mb-4">Cluster {selectedTeam.cluster} • Wave {selectedWave}</p>
              <div className="space-y-3 mb-6 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {selectedTeam.members.map((m, i) => {
                  const isCurrentUser = loggedInEmployee && m["Employee ID"] === loggedInEmployee["Employee ID"];
                  return (
                    <div key={i} className={`flex flex-col py-3 px-3 rounded-xl border transition-all ${isCurrentUser ? '' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`} style={isCurrentUser ? { backgroundColor: `${getTeamColor(selectedTeam.team)}15`, borderColor: `${getTeamColor(selectedTeam.team)}50` } : {}}>
                      <div className={`flex items-center gap-2 font-bold text-[15px] ${isCurrentUser ? '' : 'text-[var(--text-primary)]'}`} style={isCurrentUser ? { color: getTeamColor(selectedTeam.team) } : {}}>
                        👤 {isCurrentUser && '★ '}{m.Name}
                      </div>
                      <div className="text-[12px] font-medium opacity-60 ml-7 text-[var(--text-secondary)] mt-0.5">
                        {m.Email}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setSelectedTeam(null)} className="w-full text-white rounded-xl py-3 font-bold transition-all hover:opacity-90" style={{ backgroundColor: getTeamColor(selectedTeam.team) }}>Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
