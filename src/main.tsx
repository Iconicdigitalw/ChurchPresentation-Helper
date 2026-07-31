import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {applyTheme, getUiTheme, getUiThemePreset} from './data/settingsAndTemplates';

// Applied before the first render so the operator never sees the wrong theme flash.
applyTheme(getUiThemePreset(), getUiTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
