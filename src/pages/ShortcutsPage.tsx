import React from 'react';
import { motion } from 'framer-motion';
import { shortcutDefinitions } from '@/config/shortcuts';
import { fadeInUp, staggerContainer } from '@/styles/animations';
import { Keyboard, MousePointer, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ShortcutsPage = () => {
  const categories = Array.from(new Set(shortcutDefinitions.map(s => s.category)));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <motion.div 
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage/10 text-sage-dark rounded-full text-xs font-black uppercase tracking-widest border border-sage/20">
          <Zap className="h-3 w-3" />
          <span>Productivity Hub</span>
        </div>
        <h1 className="text-4xl font-black text-bark tracking-tight">Keyboard Shortcuts</h1>
        <p className="text-tan/70 font-medium max-w-xl mx-auto">
          Maximize your efficiency with project-wide hotkeys. Designed for professionals who move as fast as they think.
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {categories.map((category) => (
          <motion.div 
            key={category}
            variants={fadeInUp}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-sage" />
              <h2 className="text-sm font-black text-bark uppercase tracking-widest">{category}</h2>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-sand rounded-[2rem] overflow-hidden shadow-sm">
              <div className="divide-y divide-sand/50">
                {shortcutDefinitions
                  .filter(s => s.category === category)
                  .map((shortcut, idx) => (
                    <div 
                      key={idx}
                      className="group flex items-center justify-between p-5 hover:bg-cream transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-bark group-hover:text-sage-dark transition-colors">{shortcut.description}</p>
                        <p className="text-[10px] text-tan font-medium uppercase tracking-tighter opacity-60">Action: {shortcut.action}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {shortcut.ctrl && (
                          <span className="min-w-[32px] h-8 flex items-center justify-center px-2 bg-bark text-white rounded-lg text-xs font-black shadow-sm">Ctrl</span>
                        )}
                        {shortcut.shift && (
                          <span className="min-w-[32px] h-8 flex items-center justify-center px-2 bg-bark text-white rounded-lg text-xs font-black shadow-sm">Shift</span>
                        )}
                        {shortcut.alt && (
                          <span className="min-w-[32px] h-8 flex items-center justify-center px-2 bg-bark text-white rounded-lg text-xs font-black shadow-sm">Alt</span>
                        )}
                        <span className="min-w-[32px] h-8 flex items-center justify-center px-2 bg-white border-2 border-sand text-bark rounded-lg text-xs font-black shadow-sm uppercase">
                          {shortcut.key === ' ' ? 'Space' : shortcut.key}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pro Tip */}
      <motion.div 
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-bark text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <Keyboard className="h-32 w-32" />
        </div>
        <div className="h-16 w-16 shrink-0 bg-sage-light/20 rounded-2xl flex items-center justify-center">
          <Info className="h-8 w-8 text-sage-light" />
        </div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-black tracking-tight">Pro Tip: Global Command Palette</h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
            Press <code className="px-1.5 py-0.5 bg-white/10 rounded text-sage-light font-mono">Ctrl + K</code> anywhere to open the command palette. 
            It's the fastest way to jump between workspaces, projects, and users without touching your mouse.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ShortcutsPage;
