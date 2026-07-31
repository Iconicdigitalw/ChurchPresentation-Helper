import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Upload, 
  FileText, 
  Check, 
  Loader2, 
  Presentation, 
  BookOpen, 
  AlertCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { ScheduleItem, Slide, ThemeStyle } from '../types';
import {
  FALLBACK_CONTENT_WARNING,
  describeRequestFailure,
  readApiErrorMessage
} from '../utils/apiErrors';

interface AISermonConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConvertedDeck: (item: ScheduleItem) => void;
}

export const AISermonConverterModal: React.FC<AISermonConverterModalProps> = ({
  isOpen,
  onClose,
  onAddConvertedDeck
}) => {
  const [sermonText, setSermonText] = useState('');
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>('gold-divine');
  const [targetSlideCount, setTargetSlideCount] = useState('auto (around 8-12 slides)');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // True when the deck below is canned sample content rather than a real AI conversion
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    subtitle?: string;
    speaker?: string;
    slides: Slide[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setSermonText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!sermonText.trim()) {
      setErrorMessage('Please paste sermon notes or upload a document first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsFallbackResult(false);

    try {
      const res = await fetch('/api/gemini/convert-sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sermonText,
          themeStyle,
          targetSlideCount
        })
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Failed to convert sermon notes.'));
      }

      const data = await res.json();
      const generatedSlides: Slide[] = (data.slides || []).map((s: any, idx: number) => ({
        id: `gen-slide-${Date.now()}-${idx}`,
        type: s.type || 'point',
        header: s.header || 'Key Point',
        body: s.body || '',
        reference: s.reference || '',
        bulletPoints: s.bulletPoints || [],
        themeStyle: (s.themeStyle as ThemeStyle) || themeStyle,
        speakerNotes: s.speakerNotes || ''
      }));

      if (generatedSlides.length === 0) {
        throw new Error('The AI returned no slides. Please try again with more sermon detail.');
      }

      setPreviewData({
        title: data.title || 'Sermon Presentation',
        subtitle: data.subtitle || data.mainScripture || 'Preaching Deck',
        speaker: data.speaker || '',
        slides: generatedSlides
      });
      // Server marks placeholder decks when Gemini is unavailable or errored
      setIsFallbackResult(!!data.isFallback);
    } catch (err) {
      setPreviewData(null);
      setErrorMessage(
        describeRequestFailure(err, 'Error converting sermon document. Check Gemini API key.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPreview = () => {
    setPreviewData(null);
    setIsFallbackResult(false);
  };

  const handleConfirmInsert = () => {
    if (!previewData) return;

    const newItem: ScheduleItem = {
      id: `sermon-item-${Date.now()}`,
      title: `Sermon: ${previewData.title}`,
      subtitle: previewData.subtitle || previewData.speaker || 'AI Generated Deck',
      type: 'sermon',
      activeSlideIndex: 0,
      slides: previewData.slides
    };

    onAddConvertedDeck(newItem);
    onClose();
  };

  const handleLoadSampleNotes = () => {
    setSermonText(`SERMON TITLE: Overcoming the Giants in Your Life
SPEAKER: Pastor Michael Roberts
KEY SCRIPTURE: 1 Samuel 17:40-47 & 2 Corinthians 10:4

INTRODUCTION:
We all face spiritual, emotional, and relational giants. A giant is anything that threatens to keep you from walking in God's full promise. Like David facing Goliath, you don't fight giants with human strength—you fight with covenant faith in God.

POINT 1: RECOGNIZE THAT THE BATTLE BELONGS TO THE LORD
David said to Goliath in 1 Samuel 17:47, "The battle is the LORD's, and he will give all of you into our hands."
- Stop trying to fight spiritual warfare with earthly weapons.
- Trust in God's promises and previous faithfulness.
- Prayer and worship are your primary weapons.

POINT 2: REMEMBER YOUR PAST VICTORIES
Before David killed Goliath, he remembered how God helped him defeat the lion and the bear.
- Re-read your prayer journal.
- Testify of God's goodness to build your faith.
- "He who delivered you yesterday will sustain you today."

POINT 3: STEP FORWARD WITH BOLDNESS
David didn't walk slowly toward Goliath—he ran toward the battle line!
- Faith requires active steps of obedience.
- Speak God's word over your fears.

CONCLUSION / ALTAR CALL:
Are you facing a giant of anxiety, financial strain, or fear today? Step forward and surrender it to Jesus.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight">AI Document to Presentation Deck</h2>
              <p className="text-xs text-slate-400">
                Turn preaching notes, manuscripts, or Word outlines into slides instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-900/90">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isFallbackResult && (
            <div className="p-3.5 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <span className="font-extrabold">{FALLBACK_CONTENT_WARNING}</span>{' '}
                The deck below is a generic placeholder outline, not a real conversion of your notes.
              </span>
            </div>
          )}

          {!previewData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Input Area */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Sermon Notes / Manuscript Text
                  </label>
                  <button
                    onClick={handleLoadSampleNotes}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                  >
                    <span>Load Sample Notes</span>
                  </button>
                </div>

                <textarea
                  rows={11}
                  value={sermonText}
                  onChange={(e) => setSermonText(e.target.value)}
                  placeholder="Paste preaching outline, pastor notes, or manuscript here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-inner"
                />

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 transition-colors shadow-sm font-semibold">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload File (.txt, .md)</span>
                    <input
                      type="file"
                      accept=".txt,.md,.text"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span>{sermonText.length} characters</span>
                </div>
              </div>

              {/* Right Settings */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Deck Settings
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Visual Theme Style
                  </label>
                  <select
                    value={themeStyle}
                    onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="gold-divine">Divine Gold & Dark Amber</option>
                    <option value="nature-serene">Serene Nature Emerald</option>
                    <option value="modern-dark">Modern Dark Tech Sky</option>
                    <option value="deep-blue">Ocean Deep Blue</option>
                    <option value="purple-majesty">Royal Purple Majesty</option>
                    <option value="stained-glass">Stained Glass Rose</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Slide Count
                  </label>
                  <select
                    value={targetSlideCount}
                    onChange={(e) => setTargetSlideCount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="auto (around 8-12 slides)">Auto AI Choice (8-12 slides)</option>
                    <option value="compact (5-7 slides)">Compact Deck (5-7 slides)</option>
                    <option value="comprehensive (12-20 slides)">Detailed Deck (12-20 slides)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-900/50 text-[11px] text-slate-300 leading-relaxed">
                  <p className="font-extrabold text-amber-400 mb-1">✨ What AI generates:</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-300 font-medium">
                    <li>Main sermon title slide</li>
                    <li>Outline & point slides</li>
                    <li>Bible scripture slides</li>
                    <li>Quote & lower-third slides</li>
                    <li>Altar response slide</li>
                    <li>Pastor speaker notes</li>
                  </ul>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !sermonText.trim()}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 transition-all shadow-lg shadow-amber-950/50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Analyzing Notes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Generate Presentation Deck</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Generated Deck Preview */
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-amber-400">{previewData.title}</h3>
                    {isFallbackResult && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>SAMPLE — NOT A REAL AI RESULT</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {previewData.subtitle} • {previewData.slides.length} slides generated
                  </p>
                </div>
                <button
                  onClick={handleResetPreview}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  ← Re-generate
                </button>
              </div>

              {/* Slides Grid Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewData.slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-indigo-400 font-extrabold uppercase mb-1">
                        <span>Slide #{idx + 1} ({slide.type})</span>
                        {slide.reference && <span className="text-amber-300">{slide.reference}</span>}
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-100">{slide.header}</h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{slide.body}</p>
                    </div>
                    {slide.speakerNotes && (
                      <div className="text-[10px] text-slate-400 border-t border-slate-900 pt-2 mt-2">
                        Notes: {slide.speakerNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewData && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span
              className={`text-xs font-medium ${isFallbackResult ? 'text-amber-300' : 'text-slate-400'}`}
            >
              {isFallbackResult
                ? 'Sample placeholder deck — review before using in a live service'
                : 'Ready to insert into Sunday Worship Schedule'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleResetPreview}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmInsert}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Add Deck to Schedule</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
