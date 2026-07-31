import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {applyUiTheme, getUiTheme} from './data/settingsAndTemplates';

// Applied before the first render so a light-mode operator never sees a dark flash.
applyUiTheme(getUiTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
