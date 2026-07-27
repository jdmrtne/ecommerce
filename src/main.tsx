import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyPreset } from '@/config/presets'
import { resolveActivePreset } from '@/lib/themeSettingsStore'
import { syncSettingsFromServer } from '@/lib/settingsSync'

// Applies the active template preset (config/presets/index.ts), layered
// with any admin-saved Theme Editor override (Phase 17, resolveActivePreset()),
// as CSS custom property overrides + layout-style data attributes before
// the app renders - so a saved preset/theme choice survives a refresh with
// no flash of the wrong style. This reads the local cache only (instant,
// synchronous, no network wait).
applyPreset(resolveActivePreset())

// Backend Integration - Settings sync. Pulls the latest theme/store/
// homepage settings from Supabase in the background so this device picks
// up changes an admin made elsewhere (see lib/settingsSync.ts) - this is
// what makes a Theme Editor save show up on other devices/browsers, not
// just the one that saved it.
syncSettingsFromServer()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
