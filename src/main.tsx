import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyPreset } from '@/config/presets'
import { resolveActivePreset } from '@/lib/themeSettingsStore'

// Applies the active template preset (config/presets/index.ts), layered
// with any admin-saved Theme Editor override (Phase 17, resolveActivePreset()),
// as CSS custom property overrides + layout-style data attributes before
// the app renders - so a saved preset/theme choice survives a refresh with
// no flash of the wrong style.
applyPreset(resolveActivePreset())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
