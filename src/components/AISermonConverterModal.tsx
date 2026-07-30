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
  HelpCircle
} from 'lucide-react';
import { ScheduleItem, Slide, ThemeStyle } from '../types';

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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to convert sermon notes.');
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

      setPreviewData({
        title: data.title || 'Sermon Presentation',
        subtitle: data.subtitle || data.mainScripture || 'Preaching Deck',
        speaker: data.speaker || '',
        slides: generatedSlides
      });
    } catch (err: any) {
      console.error('Sermon conversion error:', err);
      setErrorMessage(err.message || 'Error converting sermon document. Check Gemini API key.');
    } finally {
      setIsLoading(false);
    }
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Sermon to Presentation Deck</h2>
              <p className="text-xs text-slate-500">
                Transform preaching notes, manuscripts, or Word outlines into slides instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/50">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!previewData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Input Area */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Sermon Notes / Manuscript Text
                  </label>
                  <button
                    onClick={handleLoadSampleNotes}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Load Sample Notes
                  </button>
                </div>

                <textarea
                  rows={11}
                  value={sermonText}
                  onChange={(e) => setSermonText(e.target.value)}
                  placeholder="Paste preaching outline, pastor notes, or manuscript here..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-2xs"
                />

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-lg border border-slate-300 transition-colors shadow-2xs font-semibold">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
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
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                  Presentation Settings
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Visual Theme Style
                  </label>
                  <select
                    value={themeStyle}
                    onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Target Slide Count
                  </label>
                  <select
                    value={targetSlideCount}
                    onChange={(e) => setTargetSlideCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="auto (around 8-12 slides)">Auto AI Choice (8-12 slides)</option>
                    <option value="compact (5-7 slides)">Compact Deck (5-7 slides)</option>
                    <option value="comprehensive (12-20 slides)">Detailed Deck (12-20 slides)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-slate-600 leading-relaxed">
                  <p className="font-bold text-indigo-900 mb-1">✨ What AI will generate:</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-700 font-medium">
                    <li>Main sermon title slide</li>
                    <li>Sermon outline & key point slides</li>
                    <li>Exact Bible scripture lookup slides</li>
                    <li>Impactful quote lower-third slides</li>
                    <li>Altar call / response slide</li>
                    <li>Presenter/Pastor notes for each slide</li>
                  </ul>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !sermonText.trim()}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Gemini AI Analyzing Sermon...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Generate Presentation Deck</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Generated Deck Preview */
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <h3 className="text-base font-bold text-indigo-900">{previewData.title}</h3>
                  <p className="text-xs text-slate-500">
                    {previewData.subtitle} • {previewData.slides.length} slides generated
                  </p>
                </div>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  ← Re-generate
                </button>
              </div>

              {/* Slides Grid Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewData.slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-indigo-600 font-bold uppercase mb-1">
                        <span>Slide #{idx + 1} ({slide.type})</span>
                        {slide.reference && <span className="text-slate-500">{slide.reference}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{slide.header}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{slide.body}</p>
                    </div>
                    {slide.speakerNotes && (
                      <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 mt-2">
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
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Ready to push to Sunday Service Schedule
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmInsert}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
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
