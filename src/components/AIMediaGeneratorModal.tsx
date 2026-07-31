import React, { useState } from 'react';
import { 
  Palette, 
  X, 
  Sparkles, 
  Loader2, 
  Check, 
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import {
  FALLBACK_CONTENT_WARNING,
  describeRequestFailure,
  readApiErrorMessage
} from '../utils/apiErrors';

interface AIMediaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackgroundImage: (imageUrl: string) => void;
  initialQuery?: string;
}

export const AIMediaGeneratorModal: React.FC<AIMediaGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyBackgroundImage,
  initialQuery = ''
}) => {
  const [stylePrompt, setStylePrompt] = useState(
    initialQuery || 'Majestic gold and deep navy blue light rays behind subtle cross accent, atmospheric particle glow, widescreen 16:9'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // True when the server answered with canned sample media instead of a real generation
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialQuery) setStylePrompt(initialQuery);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(initialQuery.length, initialQuery.length);
        }
      }, 50);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const PRESET_PROMPTS = [
    {
      title: 'Divine Gold Rays',
      prompt: 'Majestic gold divine light beams descending through dark ambient sanctuary clouds, subtle cross highlight, soft particle glow, widescreen'
    },
    {
      title: 'Atmospheric Cloud Mesh',
      prompt: 'Serene emerald green and deep cyan atmospheric mountain clouds background texture for worship presentation, minimalist cross accent'
    },
    {
      title: 'Stained Glass Cross',
      prompt: 'Abstract vibrant stained glass window reflection with gold light leaks, dark blue background, elegant church aesthetic'
    },
    {
      title: 'Deep Ocean Blue Motion',
      prompt: 'Deep indigo and cyan ocean wave light refraction, subtle geometric lines, high contrast worship background graphic'
    }
  ];

  const handleGenerate = async () => {
    if (!stylePrompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsFallbackResult(false);

    try {
      const res = await fetch('/api/gemini/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylePrompt })
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Failed to generate background image.'));
      }

      const data = await res.json();
      if (!data.imageUrl) {
        throw new Error('The AI returned no image. Please adjust the prompt and try again.');
      }

      setGeneratedImageUrl(data.imageUrl);
      // Server marks placeholder media when Gemini is unavailable or errored
      setIsFallbackResult(!!data.isFallback);
    } catch (err) {
      setGeneratedImageUrl(null);
      setErrorMessage(describeRequestFailure(err, 'Image generation failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedImageUrl) return;
    onApplyBackgroundImage(generatedImageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">AI Worship Background Generator</h2>
              <p className="text-xs text-slate-400">Create custom 16:9 widescreen presentation media with Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {isFallbackResult && (
            <div className="p-3 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <span className="font-extrabold">{FALLBACK_CONTENT_WARNING}</span>{' '}
                This graphic is a generic placeholder, not a render of your prompt.
              </span>
            </div>
          )}

          {/* Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Preset Worship Aesthetics
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setStylePrompt(preset.prompt)}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all"
                >
                  <span className="text-xs font-bold text-amber-300 block">{preset.title}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{preset.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Custom Visual Prompt
            </label>
            <textarea
              ref={textareaRef}
              rows={3}
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed shadow-inner"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !stylePrompt.trim()}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-950/50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generating Widescreen Graphic...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Generate Widescreen Worship Media</span>
              </>
            )}
          </button>

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-amber-300">Generated Widescreen Media</label>
                {isFallbackResult && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>SAMPLE — NOT A REAL AI RESULT</span>
                  </span>
                )}
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-amber-500/60 shadow-2xl relative">
                <img
                  src={generatedImageUrl}
                  alt="Generated Worship Background"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={handleApply}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                <Check className="w-4 h-4" />
                <span>Apply as Slide Background Image</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
