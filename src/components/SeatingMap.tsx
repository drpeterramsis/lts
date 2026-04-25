import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import { Employee } from '../types';
import { getTeamColor } from './SearchEngine';
import { sk } from '../utils/safeKey';
import { WAVE_1, WAVE_2, WAVE_LABELS } from '../constants/waves';

interface SeatingMapProps {
  employees: Employee[];
  loggedInEmployee: Employee | null;
  userRole: string;
}

export const SeatingMap: React.FC<SeatingMapProps> = ({ employees, loggedInEmployee, userRole }) => {
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
        return a.localeCompare(b);
      })
    : [];

  const defaultWave = isFacilitator ? WAVE_1 : (loggedInEmployee?.wave || WAVE_1);
  const [selectedWave, setSelectedWave] = useState(defaultWave);
  const [selectedTeam, setSelectedTeam] = useState<{cluster: string, team: string, members: Employee[]} | null>(null);

  const waveEmployees = useMemo(() => 
    employees.filter(e => e.wave === selectedWave), 
    [employees, selectedWave]
  );

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
        return a.localeCompare(b);
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
        <h2 className="text-[22px] font-bold text-[var(--accent-color)] font-display">🗺️ Wave {selectedWave} — Seating Map</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6">Your table is highlighted</p>
      </div>

      {/* Facilitator Wave Selector */}
      {isFacilitator ? (
        <div 
          className="flex gap-2 p-[6px] bg-[#1F2937] rounded-[12px] w-fit mb-6"
        >
          {[WAVE_1, WAVE_2].map((waveVal, waveIndex) => (
            <button
              key={sk("wavetab", waveIndex)}
              onClick={() => setSelectedWave(waveVal)}
              style={
                selectedWave === waveVal
                  ? {
                      background: "linear-gradient(90deg,#0C488A,#454E96,#7A3A94,#D579A4)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 28px",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(68,78,150,0.35)",
                    }
                  : {
                      background: "#4B5563",
                      color: "#D1D5DB",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 28px",
                      fontWeight: 500,
                      fontSize: "14px",
                      cursor: "pointer",
                    }
              }
            >
              {WAVE_LABELS[waveVal as keyof typeof WAVE_LABELS]}
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
            <h3 className="inline-block bg-[#7A3A94] text-white rounded-[20px] px-4 py-1 font-bold text-[13px] mb-4">Cluster {cluster}</h3>
            <div className="flex flex-wrap gap-4">
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
                        } else {
                            showToast("You can only view your own table.");
                        }
                    }}
                    className={`min-w-[220px] bg-[#F8F7F7] border border-[#D0D0D0] rounded-[10px] p-4 relative overflow-hidden transition-all ${canOpen ? 'cursor-pointer hover:border-[#454E96]' : ''}`}
                    style={isUserAtTable ? { 
                      border: '2px solid transparent', 
                      backgroundImage: 'linear-gradient(#F8F7F7, #F8F7F7), var(--gradient-brand)', 
                      backgroundClip: 'padding-box, border-box', 
                      backgroundOrigin: 'border-box', 
                      boxShadow: '0 0 16px rgba(68, 78, 150, 0.25)' 
                    } : {}}
                  >
                    <div className="relative">
                      {isUserAtTable && <div className="absolute top-0 right-0 text-[#D579A4] text-[10px] font-bold px-2 py-0.5" style={{ color: '#D579A4' }}>YOU ARE HERE</div>}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }}></span>
                        <h4 className="font-bold text-[14px]">{table.team}</h4>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)]">{teamMembers.length} members</p>
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
                {selectedTeam.members.map((m) => {
                  const isCurrentUser = loggedInEmployee && String(m.id).trim() === String(loggedInEmployee.id).trim();
                  return (
                    <div key={sk("mb", m.id || m.email)} className={`flex flex-col py-3 px-3 rounded-xl border transition-all ${isCurrentUser ? '' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`} style={isCurrentUser ? { backgroundColor: `${getTeamColor(selectedTeam.team)}15`, borderColor: `${getTeamColor(selectedTeam.team)}50` } : {}}>
                      <div className={`flex items-center gap-2 font-bold text-[15px] ${isCurrentUser ? '' : 'text-[var(--text-primary)]'}`} style={isCurrentUser ? { color: getTeamColor(selectedTeam.team) } : {}}>
                        👤 {isCurrentUser && '★ '}{m.name}
                      </div>
                      <div className="text-[12px] font-medium opacity-60 ml-7 text-[var(--text-secondary)] mt-0.5">
                        {m.email}
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
