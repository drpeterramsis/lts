import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { sortWaves } from '../utils/waveUtils';
import { Pencil, Trash2 } from 'lucide-react';
import { getTeamColor } from '../components/SearchEngine';

interface WaveStatsProps {
  employees: Employee[];
  userRole?: string;
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
}

export const WaveStats: React.FC<WaveStatsProps> = ({ employees, userRole, onEdit, onDelete }) => {
  const allWaves = useMemo(() => 
    sortWaves(Array.from(new Set(employees.map(e => String(e.Wave))))),
    [employees]
  );
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(allWaves[0] || null);
  const [selectedTeam, setSelectedTeam] = useState<{cluster: string, team: string, members: Employee[]} | null>(null);

  // Section A: Waves Summary
  const waveSummary = useMemo(() => {
    return allWaves.map(wave => {
      const wEmployees = employees.filter(e => String(e.Wave) === wave);
      const clusters = new Set(wEmployees.map(e => String(e.Cluster)));
      const teams = new Set(wEmployees.map(e => `${e.Cluster}-${e.Team}`));
      return { wave, members: wEmployees.length, clusters: clusters.size, teams: teams.size };
    });
  }, [employees, allWaves]);

  // Section B: Breakdown Analysis
  const breakdownData = useMemo(() => {
    if (!selectedWaveId) return null;
    const wEmployees = employees.filter(e => String(e.Wave) === selectedWaveId);
    
    const table: Record<string, Record<string, Employee[]>> = {};
    wEmployees.forEach(e => {
      const k = String(e.Cluster || 'Unknown');
      const t = String(e.Team || 'Unassigned');
      if (!table[k]) table[k] = {};
      if (!table[k][t]) table[k][t] = [];
      table[k][t].push(e);
    });

    return table;
  }, [employees, selectedWaveId]);

  return (
    <div className="p-4 space-y-8">
      <h2 className="text-2xl font-bold text-[var(--accent-color)]">📊 Wave Statistics</h2>
      
      {/* TOTAL EMPLOYEES CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group transition-all hover:border-[var(--accent-color)]">
          <div className="absolute top-0 right-0 p-8 bg-[var(--accent-color)]/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125" />
          <p className="text-[var(--text-secondary)] text-[9px] uppercase tracking-[0.3em] font-black mb-1">System Records</p>
          <p className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">
            {employees.length}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[var(--accent-color)]">
            <span className="text-[9px] font-bold uppercase tracking-widest">Registered Employees</span>
          </div>
        </div>
      </div>

      {/* SECTION A */}
      <div>
        <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Summary by Wave</h3>
        <table className="w-full text-left border border-[var(--border-color)] rounded-lg overflow-hidden">
          <thead className="bg-[var(--border-color)] text-[var(--accent-color)]">
            <tr><th className="p-2">Wave</th><th className="p-2">Members</th><th className="p-2">Clusters</th><th className="p-2">Teams</th></tr>
          </thead>
          <tbody className="bg-[var(--bg-main)]">
            {waveSummary.map(w => (
              <tr key={w.wave} onClick={() => setSelectedWaveId(w.wave)} className={`border-b border-[var(--border-color)] cursor-pointer ${selectedWaveId === w.wave ? 'bg-[var(--accent-purple)]/10 font-black text-[var(--accent-purple)]' : 'hover:bg-[var(--border-color)]/30'}`}>
                <td className="p-2 font-bold text-[var(--text-primary)]">{w.wave}</td>
                <td className="p-2 text-[var(--text-secondary)]">{w.members}</td>
                <td className="p-2 text-[var(--text-secondary)]">{w.clusters}</td>
                <td className="p-2 text-[var(--text-secondary)]">{w.teams}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION B */}
      {selectedWaveId && breakdownData && (
        <div className="pt-4 border-t border-[var(--border-color)] space-y-6">
          <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Breakdown: Wave {selectedWaveId}</h3>
          {Object.entries(breakdownData).sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true})).map(([k, teams]) => (
            <div key={k} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
               <div className="bg-[var(--border-color)] p-2 font-bold text-[var(--accent-color)] border-b border-[var(--border-color)]">Cluster {k}</div>
               <table className="w-full text-left bg-[var(--bg-card)]">
                  <thead className="text-[var(--accent-color)] border-b border-[var(--border-color)] bg-[var(--border-color)] text-xs uppercase">
                    <tr><th className="p-2">Team</th><th className="p-2">Members</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(teams).sort((a, b) => a[0].localeCompare(b[0])).map(([t, members]) => (
                      <tr key={`${k}-${t}`} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)] cursor-pointer transition-colors" onClick={() => setSelectedTeam({cluster: k, team: t, members})}>
                        <td className="p-2 font-medium flex items-center gap-2 text-[var(--text-primary)]">
                           <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamColor(t) }}></span>
                           {t}
                        </td>
                        <td className="p-2 text-[var(--text-secondary)]">{members.length}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Enhanced with Subtitles (Synced with SeatingMap) */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 w-full max-w-[360px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-lg mb-1 flex items-center justify-between" style={{ color: getTeamColor(selectedTeam.team) }}>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamColor(selectedTeam.team) }}></span>
                {selectedTeam.team}
              </span>
              <span className="text-white text-[10px] px-2 py-0.5 rounded-full font-black min-w-[70px] text-center" style={{ backgroundColor: getTeamColor(selectedTeam.team) }}>
                {selectedTeam.members.length} MEMBERS
              </span>
            </h4>
            <div className="text-[var(--text-secondary)] text-[11px] mb-4 flex items-center gap-2">
              <span className="px-1.5 rounded" style={{ backgroundColor: `${getTeamColor(selectedTeam.team)}20`, color: getTeamColor(selectedTeam.team) }}>Cluster {selectedTeam.cluster}</span>
              <span>•</span>
              <span>Wave {(selectedWaveId || '')}</span>
            </div>
            
            <div className="space-y-3 mb-6 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {[...selectedTeam.members].sort((a, b) => a.Name.localeCompare(b.Name)).map((m, i) => {
                return (
                  <div key={i} className={`flex flex-col py-3 px-3 rounded-xl border border-[var(--border-color)] transition-all bg-[var(--bg-main)] relative group/member`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-[14px] text-[var(--text-primary)]">
                        👤 {m.Name}
                      </div>
                      
                      {/* Facilitator actions */}
                      {(userRole === 'facilitator' || userRole === 'superuser') && onEdit && onDelete && (
                        <div className="flex gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                            className="p-1 hover:bg-[var(--accent-color)]/10 rounded text-[var(--accent-color)] transition-colors"
                            title="Edit Member"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(m); }}
                            className="p-1 hover:bg-red-500/10 rounded text-red-500 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`text-[11px] font-medium opacity-60 ml-5 text-[var(--text-secondary)] mt-0.5 leading-tight`}>
                      {m.Email}
                    </div>
                    <div className={`text-[9px] font-medium opacity-40 ml-5 text-[var(--text-secondary)] mt-0.5 leading-tight`}>
                      ID: {m["Employee ID"]}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setSelectedTeam(null)} 
              className="w-full py-3 text-white font-black text-sm rounded-xl active:scale-95 transition-transform"
              style={{ backgroundColor: getTeamColor(selectedTeam.team) }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
