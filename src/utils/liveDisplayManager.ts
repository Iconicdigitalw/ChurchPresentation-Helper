import { Slide, QuickState } from '../types';
import { UserProfileSettings, getUserProfileSettings } from '../data/settingsAndTemplates';

let liveWindowRef: Window | null = null;
let broadcastChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel !== 'undefined') {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel('worshipal_live_channel');
    }
    return broadcastChannel;
  }
  return null;
}

export function openLiveProjectorWindow(config?: Partial<UserProfileSettings>): Window | null {
  const settings = { ...getUserProfileSettings(), ...config };
  
  let left = 0;
  let top = 0;
  let width = 1920;
  let height = 1080;

  if (settings.selectedMonitor === 'secondary') {
    left = window.screen.width || 1920;
    top = 0;
    width = window.screen.width || 1920;
    height = window.screen.height || 1080;
  } else if (settings.selectedMonitor === 'stage') {
    left = (window.screen.width || 1920) * 2;
    top = 0;
    width = 1280;
    height = 720;
  } else if (settings.selectedMonitor === 'custom') {
    left = settings.monitorX || 0;
    top = settings.monitorY || 0;
    width = settings.monitorWidth || 1920;
    height = settings.monitorHeight || 1080;
  } else {
    // Primary / popup mode
    left = 100;
    top = 100;
    width = 1280;
    height = 720;
  }

  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`;

  if (liveWindowRef && !liveWindowRef.closed) {
    liveWindowRef.focus();
    return liveWindowRef;
  }

  // Open popout projector window
  const popup = window.open('about:blank', 'WorshiPal_Live_Projector', windowFeatures);

  if (popup) {
    liveWindowRef = popup;
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WorshiPal.com - Live Audience Display</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              background: #000; 
              color: #fff; 
              font-family: system-ui, -apple-system, sans-serif; 
              width: 100vw; 
              height: 100vh; 
              overflow: hidden; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              text-align: center; 
            }
            .stage-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 5vw;
              transition: all 0.3s ease;
            }
            .header-text {
              font-size: 2vw;
              color: #fbbf24;
              font-weight: 800;
              margin-bottom: 2vh;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            .body-text {
              font-size: 3.8vw;
              font-weight: 700;
              line-height: 1.35;
              max-width: 90%;
              color: #ffffff;
              text-shadow: 0 4px 20px rgba(0,0,0,0.8);
            }
            .scripture-font {
              font-family: 'Georgia', 'Merriweather', 'Palatino', serif !important;
              font-style: italic !important;
              font-weight: 600 !important;
              color: #fef3c7 !important;
              line-height: 1.45 !important;
            }
            .ref-text {
              font-size: 2vw;
              color: #94a3b8;
              font-weight: 600;
              margin-top: 3vh;
            }
            .alert-banner {
              position: absolute;
              bottom: 4vh;
              left: 5%;
              right: 5%;
              background: rgba(225, 29, 72, 0.95);
              color: white;
              padding: 1.5vh 3vw;
              font-size: 2vw;
              font-weight: 800;
              border-radius: 1vw;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .blackout { background: #000000 !important; }
            .clear-text .body-text, .clear-text .header-text, .clear-text .ref-text { opacity: 0 !important; }
            .clear-bg { background: transparent !important; }
            .logo-screen { background: radial-gradient(circle at center, #1e1b4b 0%, #020617 100%) !important; }
          </style>
        </head>
        <body>
          <div id="content" class="stage-container">
            <div id="header" class="header-text">WorshiPal.com Live Output</div>
            <div id="body" class="body-text">Waiting for Live Slide...</div>
            <div id="ref" class="ref-text"></div>
            <div id="alert" class="alert-banner" style="display:none;"></div>
          </div>
          <script>
            const channel = new BroadcastChannel('worshipal_live_channel');
            const content = document.getElementById('content');
            const header = document.getElementById('header');
            const body = document.getElementById('body');
            const ref = document.getElementById('ref');
            const alert = document.getElementById('alert');

            channel.onmessage = (event) => {
              const data = event.data;
              if (!data) return;

              if (data.quickState === 'black') {
                content.className = 'stage-container blackout';
                body.textContent = '';
                header.textContent = '';
                ref.textContent = '';
                return;
              }

              if (data.quickState === 'logo') {
                content.className = 'stage-container logo-screen';
                header.textContent = 'WORSHIPAL.COM';
                body.textContent = 'Welcome to Worship';
                ref.textContent = 'Live Display';
                return;
              }

              content.className = 'stage-container ' + (data.quickState === 'clearText' ? 'clear-text' : '');

              if (data.liveSlide) {
                header.textContent = data.liveSlide.header || '';
                body.textContent = data.liveSlide.body || '';
                ref.textContent = data.liveSlide.reference || data.liveSlide.subtitle || '';
                if (data.liveSlide.type === 'scripture') {
                  body.classList.add('scripture-font');
                } else {
                  body.classList.remove('scripture-font');
                }
              } else {
                header.textContent = '';
                body.textContent = '';
                ref.textContent = '';
                body.classList.remove('scripture-font');
              }

              if (data.alertOverlay) {
                alert.style.display = 'block';
                alert.textContent = '⚠️ ' + data.alertOverlay;
              } else {
                alert.style.display = 'none';
              }
            };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  return popup;
}

export function broadcastLiveSlideState(
  liveSlide: Slide | null, 
  quickState: QuickState = 'normal', 
  alertOverlay: string | null = null
) {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({
      type: 'LIVE_UPDATE',
      liveSlide,
      quickState,
      alertOverlay,
      timestamp: Date.now()
    });
  }
}
