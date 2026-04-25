import { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Filter, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Employee } from '../types';
import { parseWave } from '../utils/waveUtils';

interface SearchEngineProps {
  data: Employee[];
  onEdit?: (member: Employee) => void;
  onDelete?: (member: Employee) => void;
  userRole?: string;
}

export const getTeamColor = (teamName: string): string => {
  if (teamName === 'Team A') return '#0C488A'; // Royal Blue
  if (teamName === 'Team B') return '#454E96'; // Indigo
  if (teamName === 'Team C') return '#7A3A94'; // Purple
  if (teamName === 'Team D') return '#D579A4'; // Rose Pink
  return '#353335';
};

export const SearchEngine = ({ data, onEdit, onDelete, userRole }: SearchEngineProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('All Fields');

  const fields = [
    'All Fields',
    'Employee ID',
    'Name',
    'Email',
    'Wave',
    'Cluster',
    'Team'
  ];

  const minChars = useMemo(() => {
    if (filterField === 'Cluster' || filterField === 'Employee ID') return 1;
    return 2;
  }, [filterField]);

  const results = useMemo(() => {
    if (searchTerm.length < minChars) return [];
    
    const filtered = data.filter(emp => {
      const targetValue = filterField === 'All Fields' 
        ? Object.values(emp).join(' ').toLowerCase()
        : String(emp[filterField as keyof Employee] || '').toLowerCase();
        
      return targetValue.includes(searchTerm.toLowerCase());
    });

    // Sort by wave
    return filtered.sort((a, b) => {
      const wa = parseWave(a.Wave);
      const wb = parseWave(b.Wave);
      return wa.time.localeCompare(wb.time);
    });
  }, [searchTerm, filterField, data, minChars]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent-color)] group-focus-within:text-[var(--accent-color)] transition-colors" />
            <input
              type="text"
              placeholder={`Search by ${filterField} (min ${minChars} char)...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-2 focus:ring-[var(--accent-color)] transition-all outline-none font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--border-color)] rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="relative inline-flex items-center">
            <Filter className="absolute left-4 w-4 h-4 text-[var(--accent-color)]" />
            <select
              value={filterField}
              onChange={(e) => {
                setFilterField(e.target.value);
                setSearchTerm('');
              }}
              className="pl-11 pr-8 py-3.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl appearance-none focus:ring-2 focus:ring-[var(--accent-color)] font-bold outline-none cursor-pointer"
            >
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {searchTerm.length >= minChars && (
          <motion.div 
            key="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                Search Results ({results.length})
              </h3>
            </div>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((emp, idx) => (
                  <motion.div 
                    key={emp["Employee ID"] + idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl hover:border-[var(--accent-color)] hover:shadow-lg transition-all relative pr-[80px]"
                  >
                    {(userRole === 'facilitator' || userRole === 'superuser') && onEdit && onDelete && (
                       <div className="absolute top-2 right-2 flex gap-1.5">
                         <button
                           onClick={() => onEdit(emp)}
                           title="Edit member"
                           className="w-[30px] h-[30px] bg-transparent border border-[var(--accent-color)] rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-black dark:hover:text-white transition-all duration-200"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => onDelete(emp)}
                           title="Delete member"
                           className="w-[30px] h-[30px] bg-transparent border border-[#ef4444] rounded-md flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-lg leading-tight">{emp.Name}</h4>
                      <span className="text-[10px] font-black bg-[var(--accent-purple)]/10 px-2 py-1 rounded-md text-[var(--accent-purple)] border border-[var(--accent-purple)]/20 self-start mt-1">
                        {emp["Employee ID"]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div className="col-span-2"><span className="text-[var(--text-secondary)]">Email:</span> <p className="font-bold">{emp.Email}</p></div>
                      <div><span className="text-[var(--text-secondary)]">Cluster:</span> <p className="font-bold">{emp.Cluster}</p></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                       <span className="text-[9px] font-black px-2 py-1 bg-[var(--accent-purple)]/5 text-[var(--accent-purple)] rounded-full border border-[var(--accent-purple)]/20">{emp.Wave}</span>
                       <span className="text-[9px] font-black px-2 py-1 rounded-full text-white" style={{ backgroundColor: getTeamColor(emp.Team) }}>{emp.Team}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem]"
              >
                <SearchIcon className="w-12 h-12 text-[var(--accent-color)] opacity-20 mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] font-medium">No employees found matching your search</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

