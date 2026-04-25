import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { getTeamColor } from '../components/SearchEngine';
import { sk } from '../utils/safeKey';
import { WAVE_1, WAVE_2, UNIQUE_TEAMS } from '../constants/waves';

interface WaveStatsProps {
  employees: Employee[];
  userRole?: string;
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
  onUpdateEmployees?: (updatedList: Employee[]) => void;
}

export const WaveStats: React.FC<WaveStatsProps> = ({ employees, userRole, onEdit, onDelete, onUpdateEmployees }) => {
  const [selectedTeam, setSelectedTeam] = useState<{cluster: string, team: string, wave: string, members: Employee[]} | null>(null);
  const [transferTarget, setTransferTarget] = useState<Employee | null>(null);

  const uniqueClusters = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map(e => String(e.cluster ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [employees]);

  // ROW 1: Summary Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const wave1 = employees.filter(e => e.wave === WAVE_1).length;
    const wave2 = employees.filter(e => e.wave === WAVE_2).length;
    const activeClusters = uniqueClusters.length;
    return { total, wave1, wave2, activeClusters };
  }, [employees, uniqueClusters]);

  // Row 2 Data: Wave Grid
  const buildWaveGrid = (allEmps: Employee[], targetWave: string) => {
    const waveEmps = allEmps.filter(e => e.wave === targetWave);
    const grid: Record<string, Record<string, Employee[]>> = {};
    waveEmps.forEach(emp => {
      const c = String(emp.cluster || '0');
      const t = String(emp.team || 'X');
      if (!grid[c]) grid[c] = {};
      if (!grid[c][t]) grid[c][t] = [];
      grid[c][t].push(emp);
    });
    return grid;
  };

  const wave1Grid = useMemo(() => buildWaveGrid(employees, WAVE_1), [employees]);
  const wave2Grid = useMemo(() => buildWaveGrid(employees, WAVE_2), [employees]);

  // Row 3 Data: Cluster Breakdown
  const clusterTotals = useMemo(() => {
    const totals: Record<string, any> = {};
    employees.forEach(emp => {
      const c = String(emp.cluster || '0');
      if (!totals[c]) {
        totals[c] = { A: 0, B: 0, C: 0, D: 0, total: 0 };
      }
      const t = String(emp.team || 'X');
      if (['A', 'B', 'C', 'D'].includes(t)) {
        totals[c][t]++;
      }
      totals[c].total++;
    });
    return totals;
  }, [employees]);

  // Transfer Handler
  const handleTransfer = (emp: Employee, newWave: string, newCluster: string, newTeam: string) => {
    if (!onUpdateEmployees) return;
    const updated = employees.map(e => e.id === emp.id ? { ...e, wave: newWave, cluster: newCluster, team: newTeam } : e);
    onUpdateEmployees(updated);
    setTransferTarget(null);
    setSelectedTeam(null);
  };

  return (
    <div className="p-4 space-y-12">
      <h2 className="text-2xl font-black text-[var(--accent-color)] uppercase tracking-tight">Facilitator Stats & Analytics</h2>
      
      {/* ROW 1: Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.total },
          { label: 'Wave 1', value: stats.wave1 },
          { label: 'Wave 2', value: stats.wave2 },
          { label: 'Clusters Active', value: stats.activeClusters },
        ].map((card, i) => (
          <div key={sk("stat", i)} className="bg-white border border-[#E0E0E0] rounded-[12px] p-5 text-center shadow-sm">
            <p className="text-4xl font-extrabold text-[#454E96] mb-1">{card.value}</p>
            <p className="text-[12px] text-[#6B7280] uppercase font-bold tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ROW 2: Active Table View (Both Waves) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[
          { label: '🟣 WAVE 1 — 27 Apr 09:30 AM', wave: WAVE_1, grid: wave1Grid },
          { label: '🟣 WAVE 2 — 27 Apr 12:30 PM', wave: WAVE_2, grid: wave2Grid }
        ].map((waveSection, wi) => (
          <div key={sk("wvsec", wi)} className="bg-white border border-[#E0E0E0] rounded-[16px] p-6 shadow-sm overflow-hidden">
            <h3 className="font-bold text-[15px] mb-6 flex items-center gap-2">
               {waveSection.label}
            </h3>
            <div className="space-y-4">
              {uniqueClusters.map(cluster => {
                const clusterTeams = waveSection.grid[cluster] || {};
                let clusterTotal = 0;
                Object.values(clusterTeams).forEach(arr => clusterTotal += arr.length);

                return (
                  <div key={sk("wvcl", wi, cluster)} className="flex items-center gap-4">
                    <span className="w-20 text-[13px] font-bold text-[#7A3A94]">Cluster {cluster}</span>
                    <div className="flex-1 flex gap-2">
                       {UNIQUE_TEAMS.map(team => {
                         const members = clusterTeams[team] || [];
                         return (
                           <button 
                             key={sk("wvclt", wi, cluster, team)}
                             onClick={() => setSelectedTeam({ cluster, team, wave: waveSection.wave, members })}
                             className={`flex-1 py-1.5 px-2 rounded-lg text-[12px] font-bold border transition-all ${members.length > 0 ? 'bg-[#454E96]/5 border-[#454E96]/20 text-[#454E96] hover:bg-[#454E96]/10' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
                           >
                             [{team}: {members.length}]
                           </button>
                         );
                       })}
                    </div>
                    <span className="w-16 text-right text-[12px] font-bold text-gray-400">Total: {clusterTotal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 3: Cluster Breakdown Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-[16px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E0E0E0]">
          <h3 className="font-bold text-[15px] uppercase tracking-wider">Cluster Breakdown (All Waves)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#454E96] text-white">
                <th className="p-3 text-sm">Cluster</th>
                <th className="p-3 text-sm">Team A</th>
                <th className="p-3 text-sm">Team B</th>
                <th className="p-3 text-sm">Team C</th>
                <th className="p-3 text-sm">Team D</th>
                <th className="p-3 text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {uniqueClusters.map(cluster => (
                <tr key={sk("cbtrow", cluster)} className="border-b last:border-0 hover:bg-gray-50 text-center">
                  <td className="p-3 font-bold text-[#7A3A94]">Cluster {cluster}</td>
                  <td className="p-3 text-[14px]">{clusterTotals[cluster]?.A || 0}</td>
                  <td className="p-3 text-[14px]">{clusterTotals[cluster]?.B || 0}</td>
                  <td className="p-3 text-[14px]">{clusterTotals[cluster]?.C || 0}</td>
                  <td className="p-3 text-[14px]">{clusterTotals[cluster]?.D || 0}</td>
                  <td className="p-3 text-[14px]">{clusterTotals[cluster]?.total || 0}</td>
                </tr>
              ))}
              <tr className="bg-[#EEF2FF] font-bold text-center">
                <td className="p-3">Grand Total</td>
                <td className="p-3">{UNIQUE_TEAMS.reduce((acc, t) => acc + Object.values(clusterTotals).reduce((sum, c) => sum + (c[t] || 0), 0), 0)}</td>
                <td className="p-3">{UNIQUE_TEAMS.reduce((acc, t) => acc + Object.values(clusterTotals).reduce((sum, c) => sum + (c[t] || 0), 0), 0)}</td>
                <td className="p-3">{UNIQUE_TEAMS.reduce((acc, t) => acc + Object.values(clusterTotals).reduce((sum, c) => sum + (c[t] || 0), 0), 0)}</td>
                <td className="p-3">{UNIQUE_TEAMS.reduce((acc, t) => acc + Object.values(clusterTotals).reduce((sum, c) => sum + (c[t] || 0), 0), 0)}</td>
                <td className="p-3">{stats.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Modal (Clicking table cell) */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
           <div className="bg-white rounded-[20px] p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="mb-6">
                <h4 className="text-xl font-black text-[#454E96]">Cluster {selectedTeam.cluster} • Team {selectedTeam.team}</h4>
                <p className="text-[12px] text-gray-500 font-bold uppercase mt-1">Wave: {selectedTeam.wave}</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 max-h-[400px]">
                {selectedTeam.members.map(emp => (
                  <div key={sk("stmb", emp.id || emp.email)} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-[14px] text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-500">{emp.email}</p>
                    </div>
                    <button 
                      onClick={() => setTransferTarget({ ...emp })}
                      className="p-2 bg-white border border-gray-200 rounded-lg text-[#454E96] hover:bg-[#454E96] hover:text-white transition-all shadow-sm"
                      title="Transfer Member"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                 <span className="text-[12px] font-black text-gray-400">{selectedTeam.members.length} MEMBERS</span>
                 <button onClick={() => setSelectedTeam(null)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-all">Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Transfer Sub-Modal */}
      {transferTarget && (
        <div className="fixed inset-0 bg-black/80 z-[1100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-2xl border-t-8 border-[#454E96]">
             <h4 className="text-xl font-black mb-1">Transfer Member</h4>
             <p className="text-sm text-gray-500 mb-8 font-medium">Move <span className="text-[#454E96] font-bold">{transferTarget.name}</span> to:</p>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Target Wave</label>
                  <select 
                    value={transferTarget.wave}
                    onChange={e => setTransferTarget({...transferTarget, wave: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none"
                  >
                    <option value={WAVE_1}>Wave 1</option>
                    <option value={WAVE_2}>Wave 2</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Cluster</label>
                    <select 
                      value={transferTarget.cluster}
                      onChange={e => setTransferTarget({...transferTarget, cluster: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none"
                    >
                      {uniqueClusters.map(c => <option key={sk("movecl", c)} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Team</label>
                    <select 
                      value={transferTarget.team}
                      onChange={e => setTransferTarget({...transferTarget, team: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none"
                    >
                      {UNIQUE_TEAMS.map(t => <option key={sk("movetm", t)} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                     onClick={() => handleTransfer(transferTarget, transferTarget.wave, transferTarget.cluster, transferTarget.team)}
                     className="flex-1 py-3 bg-[#454E96] text-white rounded-xl font-black shadow-lg shadow-[#454E96]/20 active:scale-95 transition-all"
                   >
                     CONFIRM MOVE
                   </button>
                   <button onClick={() => setTransferTarget(null)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
