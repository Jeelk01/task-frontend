import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Zap, ArrowRight, Hash, MessageSquare, Settings, User } from 'lucide-react';
import { shortcutDefinitions } from '@/config/shortcuts';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useNavigate } from 'react-router-dom';
import { scaleIn, fadeIn } from '@/styles/animations';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredShortcuts = useMemo(() => {
    if (!query) return shortcutDefinitions.slice(0, 6);
    return shortcutDefinitions.filter(s => 
      s.description.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  // Use ESC to close (already handled by useShortcuts in AppLayout, but good for local modal)
  useShortcuts([
    { key: 'Escape', action: onClose, description: 'Close Palette', category: 'Global' }
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bark/40 backdrop-blur-md"
      />
      
      <motion.div 
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-sand overflow-hidden relative z-10"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sand bg-cream/20">
          <Search className="h-5 w-5 text-tan" />
          <input 
            autoFocus
            placeholder="Search shortcuts, commands, or workspaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-bark font-bold placeholder:text-tan/60"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-sand/40 rounded-lg border border-sand">
            <Command className="h-3 w-3 text-tan" />
            <span className="text-[10px] font-black text-tan">K</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredShortcuts.length > 0 ? (
            filteredShortcuts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const action = s.action;
                  if (action === 'HELP') navigate('/shortcuts');
                  else if (action === 'GOTO_DASHBOARD') navigate('/dashboard');
                  else if (action === 'GOTO_WORKSPACES') navigate('/workspaces');
                  else if (action === 'GOTO_PROJECTS') navigate('/projects');
                  else if (action === 'GOTO_TASKS') navigate('/tasks');
                  else if (action === 'OPEN_SETTINGS') navigate('/settings');
                  else if (action === 'NEW_TASK') navigate('/tasks');
                  else if (action === 'NEW_PROJECT') navigate('/projects');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-cream group transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-sand/30 flex items-center justify-center text-tan group-hover:bg-sage group-hover:text-white transition-colors">
                    {s.category === 'Chat' ? <MessageSquare className="h-5 w-5" /> : 
                     s.category === 'Navigation' ? <ArrowRight className="h-5 w-5" /> :
                     s.category === 'Workspace' ? <Hash className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-bark">{s.description}</p>
                    <p className="text-[10px] text-tan font-black uppercase tracking-widest opacity-60">{s.category}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {s.ctrl && <span className="px-1.5 py-0.5 bg-bark text-white rounded text-[10px] font-black">Ctrl</span>}
                  <span className="px-1.5 py-0.5 bg-white border border-sand rounded text-[10px] font-black uppercase">{s.key}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="h-16 w-16 bg-sand/20 rounded-[2rem] flex items-center justify-center text-tan mx-auto">
                <Search className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-xs font-bold text-tan uppercase tracking-widest">No results found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream/30 border-t border-sand flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-black text-tan uppercase tracking-widest">
            <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Select</span>
            <span className="flex items-center gap-1"><Command className="h-3 w-3" /> Navigate</span>
          </div>
          <span className="text-[9px] font-black text-tan/40 uppercase tracking-widest italic">structo.io/hq</span>
        </div>
      </motion.div>
    </div>
  );
};
