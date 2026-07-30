export type ShortcutAction = 
  | 'SEARCH' 
  | 'HELP' 
  | 'TOGGLE_SIDEBAR' 
  | 'TOGGLE_CHAT' 
  | 'NEW_TASK' 
  | 'NEW_PROJECT' 
  | 'NEW_WORKSPACE' 
  | 'GOTO_DASHBOARD' 
  | 'OPEN_SETTINGS' 
  | 'OPEN_PROFILE' 
  | 'CLOSE_ALL'
  | 'TOGGLE_ZEN'
  | 'GOTO_TASKS'
  | 'GOTO_PROJECTS'
  | 'GOTO_WORKSPACES'
  | 'SWITCH_WORKSPACE_1'
  | 'SWITCH_WORKSPACE_2'
  | 'SWITCH_WORKSPACE_3'
  | 'SWITCH_WORKSPACE_4'
  | 'SWITCH_WORKSPACE_5'
  | 'SWITCH_WORKSPACE_6'
  | 'SWITCH_WORKSPACE_7'
  | 'SWITCH_WORKSPACE_8'
  | 'SWITCH_WORKSPACE_9';

export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: ShortcutAction;
  description: string;
  category: 'Global' | 'Chat' | 'Workspace' | 'Navigation';
}

export const shortcutDefinitions: ShortcutDefinition[] = [
  // Global
  { key: 'k', ctrl: true, action: 'SEARCH', description: 'Global Search / Command Palette', category: 'Global' },
  { key: '/', ctrl: true, action: 'HELP', description: 'View Shortcuts Guide', category: 'Global' },
  { key: 'Escape', action: 'CLOSE_ALL', description: 'Close Modals, Chat, or Overlays', category: 'Global' },
  
  // Navigation
  { key: 'b', ctrl: true, action: 'TOGGLE_SIDEBAR', description: 'Toggle Sidebar Navigation', category: 'Navigation' },
  { key: 'z', alt: true, action: 'TOGGLE_ZEN', description: 'Zen Mode (Hide All Sidebars)', category: 'Navigation' },
  { key: 'h', ctrl: true, action: 'GOTO_DASHBOARD', description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'w', alt: true, action: 'GOTO_WORKSPACES', description: 'Go to Workspaces', category: 'Navigation' },
  { key: 'p', alt: true, action: 'GOTO_PROJECTS', description: 'Go to Projects', category: 'Navigation' },
  { key: 't', alt: true, action: 'GOTO_TASKS', description: 'Go to Tasks', category: 'Navigation' },
  { key: ',', ctrl: true, action: 'OPEN_SETTINGS', description: 'Open Settings', category: 'Navigation' },
  
  // Workspace & Projects
  { key: 'n', alt: true, action: 'NEW_TASK', description: 'Quick New Task', category: 'Workspace' },
  { key: 'p', alt: true, shift: true, action: 'NEW_PROJECT', description: 'Quick New Project', category: 'Workspace' },
  
  // Chat
  { key: 'j', ctrl: true, action: 'TOGGLE_CHAT', description: 'Toggle Chat Sidebar', category: 'Chat' },
  { key: 'Enter', alt: true, action: 'TOGGLE_CHAT', description: 'Quick Chat Focus', category: 'Chat' },

  // Command Palette Extra
  { key: ' ', alt: true, action: 'SEARCH', description: 'Quick Command Palette', category: 'Global' },
];
