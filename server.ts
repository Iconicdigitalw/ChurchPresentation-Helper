import express from "express";
import type { NextFunction, Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Every /api route carries text only, so a tight body cap is plenty and keeps
// oversized payloads from ever reaching the JSON parser.
app.use(express.json({ limit: "1mb" }));

// ===============================================
// Shared response shapes
// ===============================================
type GeneratedSlideType = "title" | "scripture" | "point" | "quote" | "cta" | "outline";

interface GeneratedSlide {
  type: GeneratedSlideType;
  header: string;
  body: string;
  reference?: string;
  bulletPoints?: string[];
  themeStyle: string;
  speakerNotes?: string;
}

interface GeneratedDeck {
  title: string;
  subtitle: string;
  themeStyle: string;
  slides: GeneratedSlide[];
  isFallback?: boolean;
}

interface LiveListenerResult {
  hasScripture: boolean;
  scriptureReference: string;
  scriptureText: string;
  translation: string;
  hasKeyQuote: boolean;
  keyQuote: string;
  topicSummary: string;
  suggestedSlideHeader: string;
  suggestedSlideBody: string;
  isFallback?: boolean;
}

interface BibleChapterVerse {
  verseNumber: number;
  text: string;
}

interface BibleCrossReference {
  reference: string;
  snippet: string;
}

interface BibleLookupResult {
  reference: string;
  book: string;
  chapter: number;
  targetVerse: number;
  translation: string;
  text: string;
  chapterVerses: BibleChapterVerse[];
  crossReferences: BibleCrossReference[];
  isFallback?: boolean;
}

interface SongSlide {
  lines: string[];
}

interface SongSection {
  label: string;
  slides: SongSlide[];
}

interface FormattedSong {
  title: string;
  artist: string;
  ccliNumber: string;
  key: string;
  sections: SongSection[];
  isFallback?: boolean;
}

interface OnlineSongResult {
  id: string;
  title: string;
  artist: string;
  key?: string;
  ccli?: string;
  sections: SongSection[];
  isOnlineResult: true;
}

// ===============================================
// Shared scripture reference matcher
// ===============================================
const SCRIPTURE_BOOK_PATTERN =
  "(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)";

const SCRIPTURE_REFERENCE_SOURCE = `${SCRIPTURE_BOOK_PATTERN}\\s+\\d+:\\d+(-\\d+)?`;

// Regex objects carry lastIndex state when global, so build a fresh one per use.
function scriptureReferenceRegex(flags = "i"): RegExp {
  return new RegExp(SCRIPTURE_REFERENCE_SOURCE, flags);
}

// ===============================================
// Rate limiting (in-memory, per client address)
// ===============================================
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

// Drop expired buckets so the map cannot grow without bound.
const rateLimitSweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
rateLimitSweeper.unref?.();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: `Too many AI requests. Please wait ${retryAfterSeconds}s and try again.`,
      retryAfter: retryAfterSeconds,
    });
  }

  bucket.count += 1;
  return next();
}

// ===============================================
// Request field validation
// ===============================================
class ValidationError extends Error {}

// Reads a string body field, enforcing presence and an upper length bound so a
// single request cannot burn an unbounded amount of the Gemini quota.
function readStringField(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; maxLength: number },
): string {
  const { required = false, maxLength } = options;

  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return "";
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }

  if (value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} is too long (${value.length} characters, maximum ${maxLength}).`,
    );
  }

  return value;
}

// Initialize GenAI safely on server
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// SVG Background Generator Fallback
function generateFallbackBackground(stylePrompt?: string, themeName?: string): string {
  const theme = (stylePrompt || themeName || "").toLowerCase();
  let bgFill = "#020617";
  let accentColor = "#f59e0b";
  let secondaryColor = "#b45309";
  let stopOpacity = "0.35";

  if (theme.includes("nature") || theme.includes("serene") || theme.includes("emerald")) {
    bgFill = "#022c22";
    accentColor = "#10b981";
    secondaryColor = "#059669";
  } else if (theme.includes("blue") || theme.includes("ocean") || theme.includes("deep")) {
    bgFill = "#082f49";
    accentColor = "#0284c7";
    secondaryColor = "#38bdf8";
  } else if (theme.includes("purple") || theme.includes("majesty")) {
    bgFill = "#2e1065";
    accentColor = "#a855f7";
    secondaryColor = "#c084fc";
  } else if (theme.includes("glass") || theme.includes("stained")) {
    bgFill = "#0f172a";
    accentColor = "#8b5cf6";
    secondaryColor = "#ec4899";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <rect width="100%" height="100%" fill="${bgFill}"/>
    <radialGradient id="worshipGlow" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="${stopOpacity}"/>
      <stop offset="50%" stop-color="${secondaryColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${bgFill}" stop-opacity="0.95"/>
    </radialGradient>
    <rect width="100%" height="100%" fill="url(#worshipGlow)"/>
    <circle cx="960" cy="420" r="480" fill="${accentColor}" opacity="0.1" filter="blur(70px)"/>
    <path d="M960 220 L960 580 M840 340 L1080 340" stroke="${accentColor}" stroke-width="5" stroke-linecap="round" opacity="0.18"/>
  </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// Heuristic Fallback Sermon Parser
function fallbackSermonParser(sermonText: string, themeStyle?: string): GeneratedDeck {
  const lines = sermonText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const title = lines[0] || "Preaching & Sermon Deck";
  const subtitle = lines[1] && lines[1].length < 80 ? lines[1] : "Sunday Worship Presentation";
  const theme = themeStyle || "gold-divine";

  const slides: GeneratedSlide[] = [
    {
      type: "title",
      header: title,
      body: subtitle,
      themeStyle: theme,
      speakerNotes: "Welcome congregation and open with prayer.",
    },
  ];

  const scriptureRegex = scriptureReferenceRegex("gi");

  const points: string[] = [];
  lines.forEach((line) => {
    if (line.length > 5 && line.length < 120 && (line.match(/^\d+[\.\)]/) || line.match(/^(Point|Key|Main|I|II|III|IV|V)/i))) {
      points.push(line);
    }
  });

  if (points.length > 0) {
    slides.push({
      type: "outline",
      header: "Sermon Outline & Key Points",
      body: points.join("\n"),
      bulletPoints: points,
      themeStyle: theme,
      speakerNotes: "Introduce main sermon points.",
    });
  }

  // Add individual point / content slides
  let currentHeader = "Key Message";
  let bodyBuffer: string[] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    const matchRef = line.match(scriptureRegex);

    if (matchRef) {
      slides.push({
        type: "scripture",
        header: `Scripture: ${matchRef[0]}`,
        body: line,
        reference: matchRef[0],
        themeStyle: theme,
        speakerNotes: `Read ${matchRef[0]} with emphasis.`,
      });
    } else if (line.match(/^\d+[\.\)]/) || line.length < 50 && line.endsWith(":")) {
      if (bodyBuffer.length > 0) {
        slides.push({
          type: "point",
          header: currentHeader,
          body: bodyBuffer.join(" "),
          themeStyle: theme,
          speakerNotes: `Elaborate on ${currentHeader}.`,
        });
        bodyBuffer = [];
      }
      currentHeader = line.replace(/^\d+[\.\)]\s*/, "");
    } else {
      bodyBuffer.push(line);
      if (bodyBuffer.join(" ").length > 180) {
        slides.push({
          type: "point",
          header: currentHeader,
          body: bodyBuffer.join(" "),
          themeStyle: theme,
          speakerNotes: "Pause for reflection.",
        });
        bodyBuffer = [];
      }
    }
  }

  if (bodyBuffer.length > 0) {
    slides.push({
      type: "point",
      header: currentHeader,
      body: bodyBuffer.join(" "),
      themeStyle: theme,
      speakerNotes: "Conclude point.",
    });
  }

  // Always end with a Call to Action slide
  slides.push({
    type: "cta",
    header: "Reflection & Altar Call",
    body: "Let us pray and reflect on today's word. Open your heart to God's presence.",
    themeStyle: theme,
    speakerNotes: "Invite congregation to pray.",
  });

  return {
    title,
    subtitle,
    themeStyle: theme,
    slides,
    isFallback: true,
  };
}

// Fallback Live Listener
function fallbackLiveListener(transcriptSnippet: string): LiveListenerResult {
  const text = transcriptSnippet || "";
  const scriptureRegex = scriptureReferenceRegex("i");

  const match = text.match(scriptureRegex);
  const hasScripture = !!match;
  const ref = match ? match[0] : "";

  // Common scripture lookup fallback
  let scriptureText = "";
  if (ref.toLowerCase().includes("john 3:16")) {
    scriptureText = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
  } else if (ref.toLowerCase().includes("psalm 23")) {
    scriptureText = "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures.";
  } else if (ref.toLowerCase().includes("romans 8:28")) {
    scriptureText = "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.";
  } else if (hasScripture) {
    scriptureText = `Live Scripture reference detected: ${ref}. "Thy word is a lamp unto my feet, and a light unto my path."`;
  }

  const quotes = text.split(/[\.\!\?]/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 100);
  const keyQuote = quotes[0] || text.slice(0, 90);

  return {
    hasScripture,
    scriptureReference: ref,
    scriptureText: scriptureText || (hasScripture ? "Scripture verse displayed on stage." : ""),
    translation: "NIV",
    hasKeyQuote: true,
    keyQuote,
    topicSummary: "Live Sermon Speech Detected",
    suggestedSlideHeader: hasScripture ? `Scripture: ${ref}` : "Live Preaching Highlight",
    suggestedSlideBody: hasScripture ? scriptureText : keyQuote,
    isFallback: true,
  };
}

// Fallback Bible Search
function fallbackBibleSearch(query: string, version?: string): BibleLookupResult {
  const q = (query || "").toLowerCase().trim();
  const v = version || "NIV";

  // Only a handful of well-known passages are bundled here; anything else falls
  // through to the default sample below, which is why callers must surface
  // `isFallback` rather than presenting these as a real lookup.
  if (q.includes("psalm 23") || q.includes("shepherd")) {
    const psalmVerses: BibleChapterVerse[] = [
      { verseNumber: 1, text: "The LORD is my shepherd; I shall not want." },
      { verseNumber: 2, text: "He makes me lie down in green pastures, he leads me beside quiet waters," },
      { verseNumber: 3, text: "he refreshes my soul. He guides me along the right paths for his name's sake." },
      { verseNumber: 4, text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
      { verseNumber: 5, text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows." },
      { verseNumber: 6, text: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever." }
    ];
    return {
      reference: "Psalm 23:1-6",
      book: "Psalms",
      chapter: 23,
      targetVerse: 1,
      translation: v,
      text: psalmVerses[0].text,
      chapterVerses: psalmVerses,
      crossReferences: [
        { reference: "John 10:11", snippet: "I am the good shepherd..." },
        { reference: "Isaiah 40:11", snippet: "He tends his flock like a shepherd..." },
      ],
      isFallback: true,
    };
  }

  if (q.includes("romans 8") || q.includes("work for good")) {
    const romVerses: BibleChapterVerse[] = [
      { verseNumber: 26, text: "In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us through wordless groans." },
      { verseNumber: 27, text: "And he who searches our hearts knows the mind of the Spirit, because the Spirit intercedes for God's people in accordance with the will of God." },
      { verseNumber: 28, text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
      { verseNumber: 29, text: "For those God foreknew he also predestined to be conformed to the image of his Son, that he might be the firstborn among many brothers and sisters." },
      { verseNumber: 31, text: "What, then, shall we say in response to these things? If God is for us, who can be against us?" },
      { verseNumber: 37, text: "No, in all these things we are more than conquerors through him who loved us." },
      { verseNumber: 38, text: "For I am convinced that neither death nor life, neither angels nor demons... shall separate us from the love of God." }
    ];
    return {
      reference: "Romans 8:28",
      book: "Romans",
      chapter: 8,
      targetVerse: 28,
      translation: v,
      text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      chapterVerses: romVerses,
      crossReferences: [
        { reference: "Jeremiah 29:11", snippet: "For I know the plans I have for you..." },
        { reference: "Ephesians 1:11", snippet: "In him we were also chosen..." },
      ],
      isFallback: true,
    };
  }

  // Default / John 3:16 and general matcher
  const john3Verses: BibleChapterVerse[] = [
    { verseNumber: 14, text: "Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up," },
    { verseNumber: 15, text: "that everyone who believes may have eternal life in him." },
    { verseNumber: 16, text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
    { verseNumber: 17, text: "For God did not send his Son into the world to condemn the world, but to save the world through him." },
    { verseNumber: 18, text: "Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God's one and only Son." },
    { verseNumber: 19, text: "This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil." },
    { verseNumber: 20, text: "Everyone who does evil hates the light, and will not come into the light for fear that their deeds will be exposed." },
    { verseNumber: 21, text: "But whoever lives by the truth comes into the light, so that it may be seen plainly that what they have done has been done in the sight of God." }
  ];

  return {
    reference: query ? query.toUpperCase() : "John 3:16",
    book: "John",
    chapter: 3,
    targetVerse: 16,
    translation: v,
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    chapterVerses: john3Verses,
    crossReferences: [
      { reference: "Romans 5:8", snippet: "But God demonstrates his own love for us in this..." },
      { reference: "1 John 4:9", snippet: "This is how God showed his love among us..." },
    ],
    isFallback: true,
  };
}

// Fallback Song Formatter
function fallbackSongFormatter(rawLyrics: string, title?: string, artist?: string): FormattedSong {
  const stanzas = rawLyrics.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const sections: SongSection[] = [];

  stanzas.forEach((stanza, idx) => {
    const lines = stanza.split("\n").map(l => l.trim()).filter(Boolean);
    let label = `Verse ${idx + 1}`;
    if (idx === 1 || stanza.toLowerCase().includes("chorus")) label = "Chorus";
    if (stanza.toLowerCase().includes("bridge")) label = "Bridge";

    const slideChunks: SongSlide[] = [];
    for (let i = 0; i < lines.length; i += 3) {
      slideChunks.push({
        lines: lines.slice(i, i + 3),
      });
    }

    sections.push({
      label,
      slides: slideChunks,
    });
  });

  return {
    title: title || "Worship Song",
    artist: artist || "Praise Team",
    ccliNumber: "1234567",
    key: "G Major",
    sections,
    isFallback: true,
  };
}

// 1. Convert Sermon Notes to Presentation Deck
app.post("/api/gemini/convert-sermon", rateLimit, async (req, res) => {
  let sermonText: string;
  let themeStyle: string;
  let targetSlideCount: string;

  try {
    sermonText = readStringField(req.body?.sermonText, "Sermon text", {
      required: true,
      maxLength: 20_000,
    });
    themeStyle = readStringField(req.body?.themeStyle, "Theme style", { maxLength: 100 });
    targetSlideCount = readStringField(req.body?.targetSlideCount, "Target slide count", {
      maxLength: 60,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json(fallbackSermonParser(sermonText, themeStyle));
    }

    const prompt = `You are an expert Church Media Director and Theologian. Analyze the following preaching notes / sermon document and generate a complete, beautifully structured church presentation slide deck.

Sermon Notes/Document:
"""
${sermonText.slice(0, 15000)}
"""

Theme Preference: ${themeStyle || "Majestic Gold / Modern Dark Worship"}
Target Slide Count: ${targetSlideCount || "auto (around 8-15 slides)"}

Requirements:
1. Create a logical sequence of presentation slides:
   - Title Slide (Sermon Title, Subtitle/Topic, Speaker, Key Scripture)
   - Outline / Points Slides (Key points 1, 2, 3...)
   - Scripture Slides (Full scripture text formatted cleanly with book, chapter, verse reference)
   - Quote / Deep Thought Slides (Impactful quotes from the sermon)
   - Call to Action / Altar Call / Response Slide
2. For each slide, select the best visual theme style: "gold-divine", "nature-serene", "modern-dark", "stained-glass", "deep-blue", "purple-majesty".
3. Provide presenter/speaker notes for the pastor or operator.

Return strict JSON format adhering to schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Sermon title" },
            subtitle: { type: Type.STRING, description: "Sermon series or subtitle" },
            speaker: { type: Type.STRING, description: "Speaker name if mentioned" },
            mainScripture: { type: Type.STRING, description: "Primary scripture reference" },
            themeStyle: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "title | scripture | point | quote | cta | outline",
                  },
                  header: { type: Type.STRING, description: "Main slide header/title" },
                  body: { type: Type.STRING, description: "Main slide body content or verse text" },
                  reference: {
                    type: Type.STRING,
                    description: "Scripture reference or quote attribution if applicable",
                  },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  themeStyle: { type: Type.STRING },
                  speakerNotes: { type: Type.STRING },
                },
                required: ["type", "header", "body"],
              },
            },
          },
          required: ["title", "slides"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: any) {
    console.warn("Using fallback for convert-sermon due to API limit/error:", error?.message || error);
    res.json(fallbackSermonParser(sermonText, themeStyle));
  }
});

// 2. Real-time Live Sermon Audio/Speech Transcript Companion
app.post("/api/gemini/live-listener", rateLimit, async (req, res) => {
  let transcriptSnippet: string;

  try {
    transcriptSnippet = readStringField(req.body?.transcriptSnippet, "Transcript snippet", {
      required: true,
      maxLength: 4_000,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json(fallbackLiveListener(transcriptSnippet));
    }

    const prompt = `You are a live AI media companion assistant for a church service.
Listen to this recent live audio transcript from the preacher:
"${transcriptSnippet}"

Identify:
1. Any specific Bible verse or passage mentioned or implicitly referenced (e.g., "John 3:16", "Psalm 23", "Romans 8:28").
2. Provide the full Bible verse text (preferably NIV or KJV) for the top detected scripture.
3. Extract an impactful live key quote or statement suitable for a Lower-Third overlay.

Return strict JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasScripture: { type: Type.BOOLEAN },
            scriptureReference: { type: Type.STRING },
            scriptureText: { type: Type.STRING },
            translation: { type: Type.STRING },
            hasKeyQuote: { type: Type.BOOLEAN },
            keyQuote: { type: Type.STRING },
            topicSummary: { type: Type.STRING },
            suggestedSlideHeader: { type: Type.STRING },
            suggestedSlideBody: { type: Type.STRING },
          },
          required: ["hasScripture", "hasKeyQuote"],
        },
      },
    });

    const jsonText = response.text || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn("Using fallback for live-listener due to API limit/error:", error?.message || error);
    res.json(fallbackLiveListener(transcriptSnippet));
  }
});

// 3. AI Media Generator for Church Presentation Backgrounds
app.post("/api/gemini/generate-background", rateLimit, async (req, res) => {
  let stylePrompt: string;
  let themeName: string;

  try {
    stylePrompt = readStringField(req.body?.stylePrompt, "Style prompt", { maxLength: 600 });
    themeName = readStringField(req.body?.themeName, "Theme name", { maxLength: 200 });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json({
        imageUrl: generateFallbackBackground(stylePrompt, themeName),
        prompt: stylePrompt || themeName,
        isFallback: true,
      });
    }

    const fullPrompt = `A high quality, atmospheric worship presentation background graphic for a church screen display. ${stylePrompt || themeName || "Majestic gold and deep dark blue subtle light rays, subtle cross accent, elegant particle glow, motion blur texture"}. No text on the image, clean widescreen 16:9 composition.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return res.json({
        imageUrl: generateFallbackBackground(stylePrompt, themeName),
        prompt: fullPrompt,
        isFallback: true,
      });
    }

    res.json({ imageUrl, prompt: fullPrompt });
  } catch (error: any) {
    console.warn("Using fallback background due to API limit/error:", error?.message || error);
    res.json({
      imageUrl: generateFallbackBackground(stylePrompt, themeName),
      prompt: stylePrompt || themeName || "Worship Atmosphere Background",
      isFallback: true,
    });
  }
});

// 4. AI Bible Quick Search & Explanation
app.post("/api/gemini/bible-search", rateLimit, async (req, res) => {
  let query: string;
  let version: string;

  try {
    query = readStringField(req.body?.query, "Query", { required: true, maxLength: 300 });
    version = readStringField(req.body?.version, "Version", { maxLength: 40 });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json(fallbackBibleSearch(query, version));
    }

    const prompt = `Lookup or search the Bible for: "${query}".
Version requested: ${version || "NIV/KJV"}.

Return JSON with exact book, chapter, verse numbers, full scripture text, and 2-3 cross-reference suggested verses.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reference: { type: Type.STRING },
            book: { type: Type.STRING },
            chapter: { type: Type.NUMBER },
            verses: { type: Type.STRING },
            translation: { type: Type.STRING },
            text: { type: Type.STRING },
            crossReferences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  reference: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                },
              },
            },
          },
          required: ["reference", "text"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Using fallback for bible-search due to API limit/error:", error?.message || error);
    res.json(fallbackBibleSearch(query, version));
  }
});

// 5. AI Worship Song Auto-Structure & Lyric Formatter
app.post("/api/gemini/song-formatter", rateLimit, async (req, res) => {
  let rawLyrics: string;
  let title: string;
  let artist: string;

  try {
    rawLyrics = readStringField(req.body?.rawLyrics, "Lyrics", {
      required: true,
      maxLength: 20_000,
    });
    title = readStringField(req.body?.title, "Title", { maxLength: 200 });
    artist = readStringField(req.body?.artist, "Artist", { maxLength: 200 });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json(fallbackSongFormatter(rawLyrics, title, artist));
    }

    const prompt = `Structure the following worship song lyrics into presentation slides.
Song Title: ${title || "Worship Song"}
Artist/Author: ${artist || "Traditional"}

Raw Lyrics:
"""
${rawLyrics}
"""

Group the lines into slide parts (Verse 1, Verse 2, Chorus, Chorus 2, Bridge, Tag, Outro). Each slide part should contain 2 to 4 readable lines maximum so it fits nicely on a church screen display.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            ccliNumber: { type: Type.STRING },
            key: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Verse 1 | Chorus | Bridge | etc." },
                  slides: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        lines: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: ["lines"],
                    },
                  },
                },
                required: ["label", "slides"],
              },
            },
          },
          required: ["title", "sections"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Using fallback for song-formatter due to API limit/error:", error?.message || error);
    res.json(fallbackSongFormatter(rawLyrics, title, artist));
  }
});

// 6. Live Online Web Search for Worship Songs & Lyrics
app.post("/api/gemini/song-search-online", rateLimit, async (req, res) => {
  let query: string;

  try {
    query = readStringField(req.body?.query, "Query", { maxLength: 300 });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof ValidationError ? error.message : "Invalid request." });
  }

  if (!query.trim()) {
    return res.json({ results: [] });
  }

  const cleanQuery = query.trim();

  try {
    const ai = getAiClient();
    if (!ai) {
      // Placeholder structure only - no real song is being reproduced here.
      const fallbackResult = {
        id: `online-song-${Date.now()}`,
        title: cleanQuery.replace(/\b\w/g, c => c.toUpperCase()),
        artist: "Worship Artist",
        key: "G Major",
        ccli: "7123456",
        isOnlineResult: true,
        sections: [
          {
            label: "Verse 1",
            slides: [{ lines: [`I sing to You, Lord, with all my heart`, `Your goodness and mercy never end`] }]
          },
          {
            label: "Chorus",
            slides: [{ lines: [`Holy, Holy, Lord God Almighty`, `Praise Your name forevermore`] }]
          },
          {
            label: "Verse 2",
            slides: [{ lines: [`Through every storm You are my anchor`, `In every season my hope is in You`] }]
          },
          {
            label: "Bridge",
            slides: [{ lines: [`Your love endures forever`, `Your grace is sufficient for me`] }]
          }
        ]
      };
      return res.json({ results: [fallbackResult], isFallback: true });
    }

    const prompt = `Perform a live web lookup for authentic, full Christian worship song lyrics for the search query: "${cleanQuery}".
Find 1 to 2 matching worship songs with exact, official lyrics, artist name, suggested song key, and CCLI number if available.

Format each song into structured presentation sections (Verse 1, Verse 2, Chorus, Chorus 2, Bridge, Tag, Outro) with 2-4 lines per slide.

Return strict JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  key: { type: Type.STRING },
                  ccli: { type: Type.STRING },
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        slides: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              lines: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                              }
                            },
                            required: ["lines"]
                          }
                        }
                      },
                      required: ["label", "slides"]
                    }
                  }
                },
                required: ["title", "artist", "sections"]
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const rawResults: Array<Partial<OnlineSongResult>> = parsed.results || [];
    const formattedResults: OnlineSongResult[] = rawResults.map((item, idx) => ({
      ...item,
      id: item.id || `online-song-${Date.now()}-${idx}`,
      title: item.title || cleanQuery,
      artist: item.artist || "Unknown",
      sections: item.sections || [],
      isOnlineResult: true,
    }));

    res.json({ results: formattedResults });
  } catch (error: any) {
    console.warn("Error searching online songs via Gemini:", error?.message || error);
    // Distinguish a failed search from a genuinely empty one so the UI can say so.
    res.json({ results: [], searchFailed: true });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

async function startServer() {
  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LOGOS AI Church Presentation Server running on http://0.0.0.0:${PORT}`);
  });
}

// On Vercel the platform owns the listener and serves the built client from its
// CDN, so this module is imported purely for its /api routes (see api/index.ts).
// Anywhere else - local dev, a plain Node host - we bind a port ourselves.
if (!process.env.VERCEL) {
  startServer();
}

export default app;

