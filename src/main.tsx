import { createRoot } from "react-dom/client";
// WebRTC Polyfills
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    nextTick: (cb: any) => setTimeout(cb, 0), 
    env: { NODE_ENV: 'development' },
    browser: true,
    version: '',
    argv: []
  };
}
(window as any).globalThis = window;
// Some libraries expect 'global' as a variable
(window as any).global = window;
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
