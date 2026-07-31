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
            /*
             * The audience screen lays out on the SAME 1920x1080 design stage
             * as <SlideCanvas /> in the app, using the same design-pixel
             * constants and the same auto-fit search, then scales the whole
             * stage to the window. Anything the operator sees in a preview
             * thumbnail is therefore exactly what lands here.
             */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background: #000;
              color: #fff;
              font-family: ui-sans-serif, system-ui, sans-serif;
              /* Matches Tailwind's preflight so header/watermark rows are the
                 same height here as on the canvas, leaving the body the same
                 box to fit into. */
              line-height: 1.5;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
            }
            .stage-frame {
              position: relative;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              background: #000;
            }
            .stage-container {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 1920px;
              height: 1080px;
              padding: 72px;
              display: flex;
              flex-direction: column;
              transform-origin: center center;
              background: #000;
            }
            .header-row {
              flex: 0 0 auto;
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 32px;
              font-size: 48px;
              font-weight: 700;
              color: #fcd34d;
            }
            .header-text {
              text-transform: uppercase;
              letter-spacing: 0.1em;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-shadow: 0 4px 20px rgba(0,0,0,0.8);
            }
            .ref-text {
              flex: 0 0 auto;
              font-size: 40px;
              font-weight: 600;
              color: #f1f5f9;
              background: rgba(0,0,0,0.6);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 12px;
              padding: 10px 24px;
            }
            .body-fit {
              position: relative;
              z-index: 10;
              flex: 1 1 auto;
              min-height: 0;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              overflow: hidden;
              padding: 28px 0;
            }
            .body-text {
              flex: 0 0 auto;
              width: 100%;
              font-size: 170px;
              font-weight: 800;
              line-height: 1.375;
              color: #f1f5f9;
              white-space: pre-line;
              overflow-wrap: break-word;
              text-shadow: 0 4px 20px rgba(0,0,0,0.8);
            }
            .scripture-font {
              font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif !important;
              font-style: italic !important;
              font-weight: 600 !important;
              color: #fef3c7 !important;
              line-height: 1.625 !important;
              letter-spacing: 0.025em !important;
            }
            .watermark {
              flex: 0 0 auto;
              font-size: 26px;
              font-weight: 600;
              text-align: right;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: rgba(255,255,255,0.5);
            }
            .alert-banner {
              position: absolute;
              left: 40px;
              right: 40px;
              bottom: 40px;
              background: #e11d48;
              border: 1px solid #fb7185;
              color: #ffffff;
              padding: 24px 44px;
              font-size: 44px;
              font-weight: 800;
              text-align: center;
              border-radius: 28px;
            }
            .blackout .header-row, .blackout .body-fit, .blackout .watermark { visibility: hidden; }
            .clear-text .header-row, .clear-text .body-fit { visibility: hidden; }
            .clear-bg { background: #020617 !important; }
            .logo-screen { background: radial-gradient(circle at center, #1e1b4b 0%, #020617 100%) !important; }
          </style>
        </head>
        <body>
          <div id="frame" class="stage-frame">
            <div id="content" class="stage-container">
              <div class="header-row">
                <div id="header" class="header-text">WorshiPal.com Live Output</div>
                <div id="ref" class="ref-text"></div>
              </div>
              <div id="body-fit" class="body-fit">
                <div id="body" class="body-text">Waiting for Live Slide...</div>
              </div>
              <div class="watermark">LOGOS AI Live</div>
              <div id="alert" class="alert-banner" style="display:none;"></div>
            </div>
          </div>
          <script>
            var channel = new BroadcastChannel('worshipal_live_channel');
            var content = document.getElementById('content');
            var header = document.getElementById('header');
            var bodyFit = document.getElementById('body-fit');
            var body = document.getElementById('body');
            var ref = document.getElementById('ref');
            var alertBanner = document.getElementById('alert');

            // ---- Design stage (mirrors SlideCanvas.tsx) ----
            var DESIGN_WIDTH = 1920;
            var DESIGN_HEIGHT = 1080;
            var BODY_MIN_FONT_SIZE = 40;
            var BODY_MAX_FONT_SIZE = 170;
            var FIT_TOLERANCE_PX = 1;
            var FIT_MAX_ITERATIONS = 10;

            // Letterbox the 16:9 stage into whatever window shape we get.
            function applyStageScale() {
              var scale = Math.min(
                window.innerWidth / DESIGN_WIDTH,
                window.innerHeight / DESIGN_HEIGHT
              );
              content.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
            }

            // ---- Auto-fit: vanilla twin of the useAutoFitText hook ----
            // Runs in design pixels, so it produces the identical font size and
            // identical line breaks to every preview in the operator console.
            var lastFitWidth = 0;
            var lastFitHeight = 0;
            var fitFrame = 0;

            function fitBodyText() {
              var availableWidth = bodyFit.clientWidth;
              var availableHeight = bodyFit.clientHeight;
              lastFitWidth = availableWidth;
              lastFitHeight = availableHeight;

              // Window not laid out yet (or minimised): nothing to fit against.
              if (availableWidth <= 0 || availableHeight <= 0) return;

              // Blank slides need no shrinking.
              if (!body.textContent || !body.textContent.trim()) {
                body.style.fontSize = BODY_MAX_FONT_SIZE + 'px';
                return;
              }

              var fitsAt = function (size) {
                body.style.fontSize = size + 'px';
                return body.scrollHeight <= availableHeight + FIT_TOLERANCE_PX &&
                       body.scrollWidth <= availableWidth + FIT_TOLERANCE_PX;
              };

              if (fitsAt(BODY_MAX_FONT_SIZE)) return;

              var low = BODY_MIN_FONT_SIZE;
              var high = BODY_MAX_FONT_SIZE;
              var best = BODY_MIN_FONT_SIZE;

              for (var i = 0; i < FIT_MAX_ITERATIONS && high - low > 0.5; i++) {
                var mid = (low + high) / 2;
                if (fitsAt(mid)) {
                  best = mid;
                  low = mid;
                } else {
                  high = mid;
                }
              }

              body.style.fontSize = best + 'px';
            }

            function scheduleFit() {
              cancelAnimationFrame(fitFrame);
              fitFrame = requestAnimationFrame(fitBodyText);
            }

            if (typeof ResizeObserver !== 'undefined') {
              var fitObserver = new ResizeObserver(function () {
                // Ignore the reflow our own font-size write causes.
                if (bodyFit.clientWidth === lastFitWidth && bodyFit.clientHeight === lastFitHeight) return;
                scheduleFit();
              });
              fitObserver.observe(bodyFit);
            }

            window.addEventListener('resize', function () {
              applyStageScale();
              scheduleFit();
            });

            applyStageScale();
            scheduleFit();

            channel.onmessage = function (event) {
              var data = event.data;
              if (!data) return;

              if (data.quickState === 'black') {
                content.className = 'stage-container blackout';
                body.textContent = '';
                header.textContent = '';
                ref.textContent = '';
                fitBodyText();
                return;
              }

              if (data.quickState === 'logo') {
                content.className = 'stage-container logo-screen';
                header.textContent = 'WORSHIPAL.COM';
                body.textContent = 'Welcome to Worship';
                ref.textContent = 'Live Display';
                body.classList.remove('scripture-font');
                fitBodyText();
                return;
              }

              content.className = 'stage-container' +
                (data.quickState === 'clearText' ? ' clear-text' : '') +
                (data.quickState === 'clearBg' ? ' clear-bg' : '');

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

              // Re-fit for the new passage (serif scripture measures differently).
              fitBodyText();

              if (data.alertOverlay) {
                alertBanner.style.display = 'block';
                alertBanner.textContent = data.alertOverlay;
              } else {
                alertBanner.style.display = 'none';
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
