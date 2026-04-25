import { LogOut } from 'lucide-react';

interface FooterProps {
  onLogout?: () => void;
  showLogout?: boolean;
}

export const Footer = ({ onLogout, showLogout }: FooterProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#6E6E6E] flex items-center justify-between px-6 z-[999]">
      <div className="text-[11px] text-white font-medium opacity-90 leading-tight">
        Developed by - <strong>Dr. Peter Ramsis</strong><br /><small> Under Supervision of Training Department</small>
      </div>

      <div className="text-[11px] text-white font-medium opacity-90">
        v2.0.001
      </div>

      <div className="flex items-center">
        {showLogout && onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-white text-white font-medium text-[11px] rounded-full hover:bg-white hover:text-[#6E6E6E] hover:opacity-100 opacity-90 transition-all duration-200"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        )}
      </div>
    </footer>
  );
};
