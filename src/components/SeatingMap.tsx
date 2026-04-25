import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Pencil, ArrowRightLeft, Trash2, UserPlus } from 'lucide-react';
import { Employee } from '../types';
import { getTeamColor } from './SearchEngine';
import { sk } from '../utils/safeKey';
import { WAVE_1, WAVE_2, TEAM_ORDER, WAVE_LABELS, matchWave } from '../constants/waves';
import { sortMembersAZ } from '../utils/dataUtils';
import { parseWave } from '../utils/wave';

interface SeatingMapProps {
  employees: Employee[];
  loggedInEmployee: Employee | null;
  userRole: string;
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
  onTransfer?: (member: Employee) => void;
  onAddMember?: (wave: string, cluster: string, team: string) => void;
}

export const SeatingMap: React.FC<SeatingMapProps> = ({ 
  employees, 
  loggedInEmployee, 
  userRole,
  onEdit,
  onDelete,
  onTransfer,
  onAddMember
}) => {
  const isFacilitator = userRole === 'facilitator' || userRole === 'superuser';
  
  // Derive unique clusters from the current employee list
  const uniqueClusters = employees?.length
    ? Array.from(
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
      })
    : [];

  const defaultWave = isFacilitator ? WAVE_1 : (loggedInEmployee?.wave || WAVE_1);
  const [selectedWave, setSelectedWave] = useState(defaultWave);
  const [selectedTeam, setSelectedTeam] = useState<{cluster: string, team: string, members: Employee[]} | null>(null);

  const waveEmployees = useMemo(() => 
    employees.filter(e => matchWave(e.wave, selectedWave)), 
    [employees, selectedWave]
  );

  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    waveEmployees.forEach(e => {
      const c = String(e.cluster ?? "0").trim();
      if (!c) return;
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [waveEmployees]);

  const { clusterGroups, sortedClusters } = useMemo(() => {
    const tableGroups: Record<string, { cluster: string, team: string, groupKey: string, members: Employee[] }> = {};

    waveEmployees.forEach((emp) => {
        if (!emp) return;

        const cluster = String(emp.cluster ?? "0").trim();
        const team = String(emp.team ?? "X").trim().toUpperCase();

        const groupKey = sk("tg", cluster, team);

        if (!tableGroups[groupKey]) {
            tableGroups[groupKey] = {
                groupKey,
                cluster,
                team,
                members: [],
            };
        }
        tableGroups[groupKey].members.push(emp);
    });

    const tableArray = Object.values(tableGroups);

    const clusterGroups: Record<string, typeof tableArray> = {};
    tableArray.forEach(table => {
        const cluster = String(table.cluster ?? "0").trim();
        if (!clusterGroups[cluster]) {
            clusterGroups[cluster] = [];
        }
        clusterGroups[cluster].push(table);
    });

    const sortedClusters = Object.keys(clusterGroups).sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return (a as string).localeCompare(b as string);
    });

    // MOD 10: Ensure teams are A, B, C, D within each cluster header
    // We'll transform clusterGroups here if needed, or do it in the render.
    // Actually, it's better to ensure clusterGroups[cluster] is always A, B, C, D.

    sortedClusters.forEach(cluster => {
      const existingTables = clusterGroups[cluster];
      const orderedTables: typeof existingTables = [];
      
      TEAM_ORDER.forEach(team => {
        const found = existingTables.find(t => t.team === team);
        if (found) {
          orderedTables.push(found);
        } else {
          // If a team is empty, we still might want it there? 
          // The UI says "skip empty teams only if the UI already does".
          // Currently SeatingMap only renders what's in clusterGroups.
          // Let's keep it as is (filtering out empty teams) but ensure the order is A, B, C, D.
        }
      });
      clusterGroups[cluster] = orderedTables;
    });

    return { clusterGroups, sortedClusters };
  }, [waveEmployees, selectedWave]);
  
  const showToast = (message: string) => {
    alert(message);
  };

  const isUserTable = (table: any) => {
    if (!loggedInEmployee?.cluster || !loggedInEmployee?.team) return false;
    return (
      table.cluster === loggedInEmployee.cluster &&
      table.team === loggedInEmployee.team
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-[var(--accent-color)] font-display">🗺️ {parseWave(selectedWave).date} {parseWave(selectedWave).time} — Seating Map</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6">Your table is highlighted</p>
      </div>

      {/* Facilitator Wave Selector */}
      {isFacilitator ? (
        <div 
          className="flex gap-2 p-[6px] bg-[#1F2937] rounded-[16px] w-full sm:w-fit mb-6"
        >
          {[WAVE_1, WAVE_2].map((waveVal, waveIndex) => (
            <button
              key={sk("wavetab", waveIndex)}
              onClick={() => setSelectedWave(waveVal)}
              className={`flex-1 sm:w-44 min-h-[58px] rounded-[10px] px-3 py-2 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                selectedWave === waveVal
                  ? 'bg-gradient-to-br from-[#0C488A] via-[#454E96] to-[#7A3A94] text-white shadow-lg active:scale-95'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[14px] font-bold block leading-tight">{parseWave(waveVal).date}</span>
              <span className="text-[11px] opacity-80 mt-0.5 leading-tight">{parseWave(waveVal).time}</span>
            </button>
          ))}
        </div>
      ) : null}

      {waveEmployees.length === 0 ? (
        <div 
          key={sk("empty", selectedWave)}
          className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl"
        >
          <MapPin className="w-12 h-12 mb-4 opacity-50" />
          <p>No seating data available</p>
        </div>
      ) : (
        sortedClusters.map(cluster => (
          <div key={sk("cl", cluster)} className="w-full">
            <h3 className="inline-block bg-[#7A3A94] text-white rounded-[20px] px-4 py-1 font-bold text-[13px] mb-4 whitespace-nowrap">
              {isFacilitator ? `Cluster ${cluster} • 👥 ${clusterCounts[cluster] || 0}` : `Cluster ${cluster}`}
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 24
            }}>
              {clusterGroups[cluster].map((table) => {
                const teamMembers = table.members;
                const isUserAtTable = isUserTable(table);
                const canOpen = isUserAtTable || isFacilitator;
                const teamColor = getTeamColor(table.team);
                
                return (
                  <div
                    key={sk("tb", table.cluster, table.team)}
                    onClick={() => {
                        if (canOpen) {
                            setSelectedTeam({ cluster: table.cluster, team: table.team, members: teamMembers });
                        }
                    }}
                    className={`bg-white border rounded-[10px] p-2 relative transition-all ${canOpen ? 'cursor-pointer hover:border-[#454E96]' : 'border-[#D0D0D0]'}`}
                    style={isUserAtTable ? { 
                      border: '2px solid transparent', 
                      backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #0C488A, #454E96, #7A3A94, #D579A4)', 
                      backgroundClip: 'padding-box, border-box', 
                      backgroundOrigin: 'border-box', 
                      boxShadow: '0 0 12px rgba(68, 78, 150, 0.25)' 
                    } : {}}
                  >
                    <div className="flex flex-col items-center">
                      {isUserAtTable && <div className="absolute top-1 right-1 text-[12px]">⭐</div>}
                      <h4 className="font-extrabold text-[18px] leading-tight" style={{ color: teamColor }}>{table.team}</h4>
                      <p className="text-[11px] text-[#6B7280] mt-1 text-center font-medium leading-none">{teamMembers.length} members</p>
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
            key={sk("popup", selectedTeam.team)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedTeam(null)}
          >
            <div className="bg-[var(--bg-card)] border rounded-[14px] p-4 w-full max-w-[360px] shadow-2xl overflow-hidden flex flex-col" style={{ borderColor: getTeamColor(selectedTeam.team) }} onClick={e => e.stopPropagation()}>
              <div className="mb-3 pb-2 border-b border-[var(--border-color)]">
                <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: getTeamColor(selectedTeam.team) }}>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: getTeamColor(selectedTeam.team) }}></span>
                  Team {selectedTeam.team}
                </h4>
                <p className="text-[var(--text-secondary)] text-[12px]">Cluster {selectedTeam.cluster} • {parseWave(selectedWave).date} {parseWave(selectedWave).time}</p>
              </div>

              {isFacilitator && (
                <div className="mb-4">
                  <button 
                    onClick={() => {
                        // Pass current table as defaults
                        // We need a way to communicate this to App.tsx
                        // I'll add an onAddMember prop
                        onAddMember?.(selectedWave, selectedTeam.cluster, selectedTeam.team);
                    }}
                    className="w-full py-2 bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/30 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-[var(--accent-color)]/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Add Member to Table
                  </button>
                </div>
              )}

              <div className="space-y-2 mb-6 mt-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {sortMembersAZ(selectedTeam.members).map((m) => {
                  const isCurrentUser = loggedInEmployee && String(m.id).trim() === String(loggedInEmployee.id).trim();
                  return (
                    <div key={sk("mb", m.id || m.email)} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isCurrentUser ? '' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`} style={isCurrentUser ? { backgroundColor: `${getTeamColor(selectedTeam.team)}15`, borderColor: `${getTeamColor(selectedTeam.team)}50` } : {}}>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 font-bold text-[13px] truncate ${isCurrentUser ? '' : 'text-[var(--text-primary)]'}`} style={isCurrentUser ? { color: getTeamColor(selectedTeam.team) } : {}}>
                          👤 {isCurrentUser && '★ '}{m.name}
                        </div>
                        <div className="text-[11px] font-medium opacity-60 ml-6 text-[var(--text-secondary)] truncate">
                          {m.id ? `ID: ${m.id}` : (m.email ? m.email : "ID: —")}
                        </div>
                      </div>
                      
                      {isFacilitator && (
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button 
                            onClick={() => onEdit?.(m)}
                            className="p-1.5 hover:bg-black/5 rounded-lg text-[var(--accent-color)] transition-colors"
                            title="Edit Member"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onTransfer?.(m)}
                            className="p-1.5 hover:bg-black/5 rounded-lg text-[var(--accent-color)] transition-colors"
                            title="Transfer Member"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDelete?.(m)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => setSelectedTeam(null)} 
                className="w-full text-white rounded-xl py-2.5 font-bold transition-all hover:opacity-90 text-[14px]" 
                style={{ backgroundColor: getTeamColor(selectedTeam.team) }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
