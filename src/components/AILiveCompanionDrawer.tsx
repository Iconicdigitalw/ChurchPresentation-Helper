import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Tv, 
  Play, 
  Volume2, 
  Check, 
  Loader2, 
  BookOpen, 
  Quote, 
  AlertCircle,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { AIScriptureSuggestion, Slide } from '../types';
import {
  FALLBACK_CONTENT_WARNING,
  describeRequestFailure,
  readApiErrorMessage
} from '../utils/apiErrors';

interface AILiveCompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPushSlideToLive: (slide: Slide) => void;
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;
}

export const AILiveCompanionDrawer: React.FC<AILiveCompanionDrawerProps> = ({
  isOpen,
  onClose,
  onPushSlideToLive,
  isMicActive,
  setIsMicActive
}) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AIScriptureSuggestion[]>([]);
  const [manualSnippet, setManualSnippet] = useState('');
  // Visible failure text for the live listener call and the browser mic
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // True when the most recent analysis came back as canned sample scripture
  const [isFallbackResult, setIsFallbackResult] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check web speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        // Auto process snippet if enough words
        if (currentTranscript.length > 30) {
          analyzeSnippet(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setErrorMessage(`Microphone listener error: ${event.error || 'unknown speech recognition failure'}.`);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setErrorMessage(
        'Speech Recognition is not supported in this browser. Use the Live Speech Simulator or the manual snippet box below.'
      );
      setIsMicActive(true);
      return;
    }

    if (isMicActive) {
      recognitionRef.current.stop();
      setIsMicActive(false);
    } else {
      try {
        setErrorMessage(null);
        recognitionRef.current.start();
        setIsMicActive(true);
      } catch (err) {
        setIsMicActive(false);
        setErrorMessage(
          describeRequestFailure(err, 'Could not start the microphone listener. Check browser mic permissions.')
        );
      }
    }
  };

  const analyzeSnippet = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/live-listener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptSnippet: textToAnalyze })
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Live listener analysis failed.'));
      }

      const data = await res.json();
      // Server marks canned sample scripture when Gemini is unavailable or errored
      const isFallback = !!data.isFallback;
      setIsFallbackResult(isFallback);

      if (data.hasScripture && data.scriptureReference && data.scriptureText) {
        const newSuggestion: AIScriptureSuggestion = {
          id: `sug-${Date.now()}`,
          reference: data.scriptureReference,
          text: data.scriptureText,
          translation: data.translation || 'NIV/KJV',
          sourceSnippet: textToAnalyze,
          keyQuote: data.keyQuote,
          isFallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        setSuggestions((prev) => [newSuggestion, ...prev]);
      } else if (data.hasKeyQuote && data.keyQuote) {
        const quoteSuggestion: AIScriptureSuggestion = {
          id: `sug-quote-${Date.now()}`,
          reference: 'Pastor Live Statement',
          text: `“${data.keyQuote}”`,
          translation: 'Sermon Quote',
          sourceSnippet: textToAnalyze,
          keyQuote: data.keyQuote,
          isFallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setSuggestions((prev) => [quoteSuggestion, ...prev]);
      }
    } catch (err) {
      setErrorMessage(describeRequestFailure(err, 'Error analyzing live speech.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePreacherSpeech = (text: string) => {
    setManualSnippet(text);
    setTranscript(text);
    analyzeSnippet(text);
  };

  const handlePushToLive = (sug: AIScriptureSuggestion) => {
    const slideToPush: Slide = {
      id: `live-ai-${Date.now()}`,
      type: sug.translation === 'Sermon Quote' ? 'quote' : 'scripture',
      header: sug.reference,
      body: sug.text,
      reference: sug.reference,
      themeStyle: 'gold-divine'
    };

    onPushSlideToLive(slideToPush);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Radio className="w-4 h-4 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">AI Live Sermon Companion</h3>
            <p className="text-[10px] text-slate-400">Listens to pastor & suggests scriptures</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isFallbackResult && (
          <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <span className="font-extrabold">{FALLBACK_CONTENT_WARNING}</span>{' '}
              Verse text below may be a placeholder — verify it before pushing to the live output.
            </span>
          </div>
        )}

        {/* Mic Control Box */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Mic className={`w-4 h-4 ${isMicActive ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Microphone Listener</span>
            </div>
            <button
              onClick={toggleMic}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                isMicActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isMicActive ? 'STOP LISTENING' : 'START MIC'}
            </button>
          </div>

          {transcript && (
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 italic">
              "{transcript}"
            </div>
          )}
        </div>

        {/* Quick Preacher Speech Simulators for Instant Testing */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Preacher Speech Simulator (Test 1-Click AI Trigger)
          </label>
          <div className="space-y-1">
            <button
              onClick={() =>
                handleSimulatePreacherSpeech(
                  "Turn with me to Romans chapter 8 verse 28 where Paul writes about how God works all things together for good."
                )
              }
              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-300 transition-colors flex items-center justify-between"
            >
              <span>"Turn to Romans 8:28..."</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={() =>
                handleSimulatePreacherSpeech(
                  "Let's read John 3:16 together: For God so loved the world that he gave his only Son."
                )
              }
              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-300 transition-colors flex items-center justify-between"
            >
              <span>"Let's read John 3:16..."</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={() =>
                handleSimulatePreacherSpeech(
                  "Isaiah 40 verse 31 says those who wait upon the Lord shall renew their strength!"
                )
              }
              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-300 transition-colors flex items-center justify-between"
            >
              <span>"Isaiah 40:31 says..."</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Manual Text Snippet Form */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Type Pastor's Mentioned Passage / Statement
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualSnippet}
              onChange={(e) => setManualSnippet(e.target.value)}
              placeholder="e.g. Psalm 91 or Philippians 4:13"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && analyzeSnippet(manualSnippet)}
            />
            <button
              onClick={() => analyzeSnippet(manualSnippet)}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
            </button>
          </div>
        </div>

        {/* Live Detected AI Suggestions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live AI Suggested Slides
            </h4>
            <span className="text-[10px] text-amber-400 font-semibold">
              {suggestions.length} Detected
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              No live scriptures detected yet. Speak into mic or click a test prompt above!
            </div>
          ) : (
            suggestions.map((sug) => (
              <div
                key={sug.id}
                className={`p-3 bg-slate-900 border rounded-xl space-y-2 shadow-lg ${
                  sug.isFallback ? 'border-amber-500/40' : 'border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-300">
                    {sug.reference}
                  </span>
                  <span className="text-[9px] text-slate-500">{sug.timestamp}</span>
                </div>

                {sug.isFallback && (
                  <div className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>SAMPLE — NOT A REAL AI RESULT</span>
                  </div>
                )}

                <p className="text-xs text-slate-200 italic leading-snug">
                  {sug.text}
                </p>

                <button
                  onClick={() => handlePushToLive(sug)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Tv className="w-3.5 h-3.5 fill-slate-950" />
                  <span>1-CLICK PUSH TO LIVE OUTPUT</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
