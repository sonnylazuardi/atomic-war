import { createRoot } from 'react-dom/client';
import { App } from './ui/App.tsx';
import { initPwa } from './ui/pwa.ts';

initPwa();

const el = document.getElementById('root')!;
// Reuse the root across Bun HMR updates (Bun requires direct `import.meta.hot.data` access).
const root = import.meta.hot ? (import.meta.hot.data.root ??= createRoot(el)) : createRoot(el);
root.render(<App />);
