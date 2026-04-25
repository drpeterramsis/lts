import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { getTeamColor } from '../components/SearchEngine';
import { sk } from '../utils/safeKey';
import { WAVE_1, WAVE_2, TEAM_ORDER, WAVE_LABELS, matchWave } from '../constants/waves';
import { parseWave } from '../utils/wave';
import { sortMembersAZ } from '../utils/dataUtils';

interface WaveStatsProps {
  employees: Employee[];
  userRole?: string;
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
  onTransfer?: (member: Employee) => void;
  onUpdateEmployees?: (updatedList: Employee[]) => void;
}

export const WaveStats: React.FC<WaveStatsProps> = ({ employees, userRole, onEdit, onDelete, onTransfer, onUpdateEmployees }) => {
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
      return (a as string).localeCompare(b as string);
    });
  }, [employees]);

  // ROW 1: Summary Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const wave1 = employees.filter(e => matchWave(e.wave, WAVE_1)).length;
    const wave2 = employees.filter(e => matchWave(e.wave, WAVE_2)).length;
    const activeClusters = uniqueClusters.length;
    return { total, wave1, wave2, activeClusters };
  }, [employees, uniqueClusters]);

  // Row 2 Data: Wave Grid
  const buildWaveGrid = (allEmps: Employee[], targetWave: string) => {
    const waveEmps = allEmps.filter(e => matchWave(e.wave, targetWave));
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
          { wave: WAVE_1, grid: wave1Grid },
          { wave: WAVE_2, grid: wave2Grid }
        ].map((waveSection, wi) => {
          const { date, time } = parseWave(waveSection.wave);

          return (
            <div key={sk("wvsec", wi)} className="statsWaveCard bg-white border border-[#E0E0E0] rounded-[16px] p-6 shadow-sm overflow-hidden">
              <div className="statsWaveCardHeader flex items-center justify-between mb-6">
                <h3 className="statsWaveTitle font-bold text-[15px] flex items-center gap-2">
                   🟣 {date} {time}
                </h3>
              </div>
              <div className="waveGridScroll overflow-x-auto -webkit-overflow-scrolling-touch pb-2">
                <div className="min-w-[520px] space-y-4">
              {uniqueClusters.map(cluster => {
                const clusterTeams = waveSection.grid[cluster] || {};
                let clusterTotal = 0;
                Object.values(clusterTeams).forEach((arr: any) => clusterTotal += arr.length);

                return (
                    <div key={sk("wvcl", wi, cluster)} className="statsClusterRow flex items-center gap-4 group hover:bg-gray-50/50 p-2 rounded-xl transition-all">
                      <span className="statsClusterLabel w-24 shrink-0 text-[13px] font-bold text-[#7A3A94] whitespace-nowrap">Cluster {cluster}</span>
                    <div className="statsChipsRow flex-1 flex gap-2">
                       {TEAM_ORDER.map(team => {
                         const members = clusterTeams[team] || [];
                         const teamColors: Record<string, any> = {
                           A: { bg: 'rgba(12,72,138,0.12)', border: 'rgba(12,72,138,0.35)', text: '#0C488A', emoji: '🔵' },
                           B: { bg: 'rgba(69,78,150,0.12)', border: 'rgba(69,78,150,0.35)', text: '#454E96', emoji: '🟣' },
                           C: { bg: 'rgba(122,58,148,0.12)', border: 'rgba(122,58,148,0.35)', text: '#7A3A94', emoji: '🟪' },
                           D: { bg: 'rgba(213,121,164,0.12)', border: 'rgba(213,121,164,0.35)', text: '#D579A4', emoji: '🌸' },
                         };
                         const tc = teamColors[team] || teamColors.A;

                         return (
                           <button 
                             key={sk("wvclt", wi, cluster, team)}
                             onClick={() => setSelectedTeam({ cluster, team, wave: waveSection.wave, members })}
                             className={`statsTeamChip flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-[10px] text-[13px] font-extrabold border transition-all min-w-[72px] ${members.length > 0 ? '' : 'bg-gray-50 border-gray-100 text-gray-300 opacity-40 pointer-events-none'}`}
                             style={members.length > 0 ? { backgroundColor: tc.bg, borderColor: tc.border, color: tc.text } : {}}
                           >
                             {tc.emoji} {team} {members.length}
                           </button>
                         );
                       })}
                    </div>
                    <span className="statsClusterTotal w-20 shrink-0 text-right text-[12px] font-bold text-gray-400">Total: {clusterTotal}</span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Member Modal (Clicking table cell) */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
           <div className="bg-white rounded-[20px] p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="mb-6">
                <h4 className="text-xl font-black text-[#454E96]">Cluster {selectedTeam.cluster} • Team {selectedTeam.team}</h4>
                <p className="text-[12px] text-gray-500 font-bold uppercase mt-1">Wave: {parseWave(selectedTeam.wave).date} {parseWave(selectedTeam.wave).time}</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 max-h-[400px]">
                {sortMembersAZ(selectedTeam.members).map(emp => {
                  const isFacilitator = userRole === 'facilitator' || userRole === 'superuser';
                  return (
                    <div key={sk("stats-mb", emp.id || emp.email)} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between group">
                      <div className="flex-1 truncate pr-4">
                        <p className="font-bold text-[14px] text-gray-900 truncate">{emp.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {emp.id ? `ID: ${emp.id}` : (emp.email ? emp.email : "ID: —")}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isFacilitator && (
                          <>
                            <button 
                              onClick={() => {
                                onEdit?.(emp);
                              }}
                              className="p-2.5 bg-white border border-gray-100 text-[#454E96] rounded-xl hover:bg-[#454E96] hover:text-white transition-all shadow-sm"
                              title="Edit Member"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (onTransfer) {
                                  onTransfer(emp);
                                } else {
                                  setTransferTarget({ ...emp });
                                }
                              }}
                              className="p-2.5 bg-white border border-gray-100 text-[#454E96] rounded-xl hover:bg-[#454E96] hover:text-white transition-all shadow-sm"
                              title="Transfer Member"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                onDelete?.(emp);
                              }}
                              className="p-2.5 bg-white border border-gray-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!isFacilitator && (
                          <div className="text-[10px] font-black text-gray-300 uppercase">View Only</div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                      {TEAM_ORDER.map(t => <option key={sk("movetm", t)} value={t}>{t}</option>)}
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
