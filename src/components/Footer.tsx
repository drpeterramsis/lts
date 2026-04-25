import { LogOut } from 'lucide-react';

interface FooterProps {
  onLogout?: () => void;
  showLogout?: boolean;
}

export const Footer = ({ onLogout, showLogout }: FooterProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-14 bg-[#6E6E6E] flex items-center justify-between px-6 z-[999]" style={{ borderTop: '3px solid transparent', borderImage: 'var(--gradient-brand) 1' }}>
      <div className="text-[13px] text-white font-medium opacity-90 leading-tight">
        Developed by - <strong>Dr. Peter Ramsis</strong><br /><small>Under Supervision of Training Department</small>
      </div>

      <div className="text-[13px] text-white font-bold opacity-90">
        v2.0.006
      </div>

      <div className="flex items-center">
        {showLogout && onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white text-white font-medium text-[12px] rounded-full hover:bg-white hover:text-[#6E6E6E] hover:opacity-100 opacity-90 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        )}
      </div>
    </footer>
  );
};
