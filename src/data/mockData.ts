import { ScheduleItem, SongItem, BibleVerse, Slide } from '../types';

export const DEFAULT_BIBLE_VERSES: BibleVerse[] = [
  {
    book: "John",
    chapter: 3,
    verse: 16,
    reference: "John 3:16",
    translation: "NIV",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
  },
  {
    book: "Psalms",
    chapter: 23,
    verse: 1,
    reference: "Psalm 23:1-3",
    translation: "KJV",
    text: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul."
  },
  {
    book: "Romans",
    chapter: 8,
    verse: 28,
    reference: "Romans 8:28",
    translation: "NIV",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
  },
  {
    book: "Philippians",
    chapter: 4,
    verse: 13,
    reference: "Philippians 4:13",
    translation: "NKJV",
    text: "I can do all things through Christ who strengthens me."
  },
  {
    book: "Isaiah",
    chapter: 40,
    verse: 31,
    reference: "Isaiah 40:31",
    translation: "ESV",
    text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."
  },
  {
    book: "Proverbs",
    chapter: 3,
    verse: 5,
    reference: "Proverbs 3:5-6",
    translation: "NIV",
    text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."
  },
  {
    book: "Jeremiah",
    chapter: 29,
    verse: 11,
    reference: "Jeremiah 29:11",
    translation: "NIV",
    text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future."
  },
  {
    book: "Hebrews",
    chapter: 11,
    verse: 1,
    reference: "Hebrews 11:1",
    translation: "KJV",
    text: "Now faith is the substance of things hoped for, the evidence of things not seen."
  }
];

export const PRESET_SONGS: SongItem[] = [
  {
    id: "song-1",
    title: "Way Maker",
    artist: "Sinach / Leeland",
    key: "G",
    ccli: "7115744",
    rawLyrics: `[Verse 1]
You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

[Chorus]
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are

[Verse 2]
You are here, touching every heart
I worship You, I worship You
You are here, healing every heart
I worship You, I worship You

[Bridge]
Even when I don't see it, You're working
Even when I don't feel it, You're working
You never stop, You never stop working
You never stop, You never stop working`,
    slides: [
      {
        id: "wm-v1-1",
        type: "song",
        header: "Verse 1",
        body: "You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You",
        themeStyle: "purple-majesty",
        reference: "Way Maker • Sinach"
      },
      {
        id: "wm-c-1",
        type: "song",
        header: "Chorus",
        body: "Way Maker, Miracle Worker, Promise Keeper\nLight in the darkness, my God, that is who You are",
        themeStyle: "purple-majesty",
        reference: "Way Maker • Sinach"
      },
      {
        id: "wm-v2-1",
        type: "song",
        header: "Verse 2",
        body: "You are here, touching every heart\nI worship You, I worship You\nYou are here, healing every heart\nI worship You, I worship You",
        themeStyle: "purple-majesty",
        reference: "Way Maker • Sinach"
      },
      {
        id: "wm-b-1",
        type: "song",
        header: "Bridge",
        body: "Even when I don't see it, You're working\nEven when I don't feel it, You're working\nYou never stop, You never stop working",
        themeStyle: "purple-majesty",
        reference: "Way Maker • Sinach"
      }
    ]
  },
  {
    id: "song-2",
    title: "Goodness of God",
    artist: "Bethel Music / Jenn Johnson",
    key: "A",
    ccli: "7117726",
    rawLyrics: `[Verse 1]
I love You Lord, Oh Your mercy never fails me
All my days, I've been held in Your hands
From the moment that I wake up, until I lay my head
Oh, I will sing of the goodness of God

[Chorus]
All my life You have been faithful
All my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God

[Verse 2]
I love Your voice, You have led me through the fire
In darkest night, You are close like no other
I've known You as a father, I've known You as a friend
I have lived in the goodness of God`,
    slides: [
      {
        id: "gog-v1",
        type: "song",
        header: "Verse 1",
        body: "I love You Lord, Oh Your mercy never fails me\nAll my days, I've been held in Your hands\nFrom the moment that I wake up, until I lay my head\nOh, I will sing of the goodness of God",
        themeStyle: "gold-divine",
        reference: "Goodness of God"
      },
      {
        id: "gog-c",
        type: "song",
        header: "Chorus",
        body: "All my life You have been faithful\nAll my life You have been so, so good\nWith every breath that I am able\nOh, I will sing of the goodness of God",
        themeStyle: "gold-divine",
        reference: "Goodness of God"
      }
    ]
  },
  {
    id: "song-3",
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    key: "C",
    ccli: "4348399",
    rawLyrics: `[Verse 1]
The splendor of a King, clothed in majesty
Let all the earth rejoice, all the earth rejoice
He wraps Himself in light, and darkness tries to hide
And trembles at His voice, and trembles at His voice

[Chorus]
How great is our God, sing with me
How great is our God, and all will see
How great, how great is our God`,
    slides: [
      {
        id: "hgiog-v1",
        type: "song",
        header: "Verse 1",
        body: "The splendor of a King, clothed in majesty\nLet all the earth rejoice, all the earth rejoice\nHe wraps Himself in light, and darkness tries to hide\nAnd trembles at His voice, and trembles at His voice",
        themeStyle: "deep-blue",
        reference: "How Great Is Our God"
      },
      {
        id: "hgiog-c",
        type: "song",
        header: "Chorus",
        body: "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God",
        themeStyle: "deep-blue",
        reference: "How Great Is Our God"
      }
    ]
  }
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: "item-countdown",
    title: "Service Opening & Welcome",
    subtitle: "5 Min Countdown & Announcements",
    type: "announcement",
    activeSlideIndex: 0,
    slides: [
      {
        id: "slide-welcome",
        type: "title",
        header: "WELCOME TO SUNDAY WORSHIP",
        body: "We are glad you joined us today!\nService starts in a few moments.",
        themeStyle: "gold-divine",
        speakerNotes: "Keep welcome background active while congregation settles in."
      },
      {
        id: "slide-ann-1",
        type: "cta",
        header: "KINGDOM FELLOWSHIP & PRAYER",
        body: "Join us every Wednesday at 7:00 PM for Midweek Prayer & Bible Study.",
        themeStyle: "gold-divine",
        bulletPoints: [
          "Wednesday Bible Study - 7:00 PM",
          "Youth Gathering - Friday 6:30 PM",
          "Online Giving: text GIVE to 555-777"
        ]
      }
    ]
  },
  {
    id: "item-worship",
    title: "Worship - Way Maker",
    subtitle: "Opening Worship Praise",
    type: "song",
    key: "G",
    ccli: "7115744",
    activeSlideIndex: 0,
    slides: PRESET_SONGS[0].slides
  },
  {
    id: "item-scripture",
    title: "Scripture Reading - Isaiah 40:28-31",
    subtitle: "Congregational Reading",
    type: "scripture",
    activeSlideIndex: 0,
    slides: [
      {
        id: "slide-scrip-1",
        type: "scripture",
        header: "Isaiah 40:28-29",
        body: "Do you not know? Have you not heard? The LORD is the everlasting God, the Creator of the ends of the earth. He will not grow tired or weary, and his understanding no one can fathom.",
        reference: "Isaiah 40:28-29 (NIV)",
        themeStyle: "nature-serene",
        speakerNotes: "Reader 1 leads verse 28-29."
      },
      {
        id: "slide-scrip-2",
        type: "scripture",
        header: "Isaiah 40:30-31",
        body: "Even youths grow tired and weary, and young men stumble and fall; but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
        reference: "Isaiah 40:30-31 (NIV)",
        themeStyle: "nature-serene",
        speakerNotes: "Congregation reads verse 31 aloud together."
      }
    ]
  },
  {
    id: "item-sermon",
    title: "Sermon: Unshakeable Faith in Uncertain Times",
    subtitle: "Pastor David Miller",
    type: "sermon",
    activeSlideIndex: 0,
    slides: [
      {
        id: "sermon-s1",
        type: "title",
        header: "UNSHAKEABLE FAITH IN UNCERTAIN TIMES",
        body: "Walking with Confidence in God's Promises",
        reference: "Key Passage: Hebrews 11:1-6 & Romans 8:28",
        themeStyle: "gold-divine",
        speakerNotes: "Introduce the title and series theme."
      },
      {
        id: "sermon-s2",
        type: "point",
        header: "1. FAITH LOOKS BEYOND THE SEEN",
        body: "Faith is not the absence of difficulty, but the presence of unshakeable trust in God's eternal character.",
        bulletPoints: [
          "Focus on God's sovereignty over earthly circumstances",
          "Remember past victories and answered prayers",
          "Hold fast to the promises of Scripture"
        ],
        themeStyle: "gold-divine",
        speakerNotes: "Point 1: Emphasize Hebrew 11 definition of faith."
      },
      {
        id: "sermon-s3",
        type: "scripture",
        header: "Hebrews 11:1",
        body: "Now faith is confidence in what we hope for and assurance about what we do not see.",
        reference: "Hebrews 11:1 (NIV)",
        themeStyle: "gold-divine"
      },
      {
        id: "sermon-s4",
        type: "quote",
        header: "SERMON QUOTE",
        body: "“When you cannot trace God's hand, you can always trust His heart.”",
        reference: "— Pastor David Miller",
        themeStyle: "gold-divine",
        speakerNotes: "Pause here for reflection."
      },
      {
        id: "sermon-s5",
        type: "cta",
        header: "RESPONSE & ALTAR CALL",
        body: "Step Forward in Faith Today",
        bulletPoints: [
          "Surrender your worries at the altar",
          "Prayer team is available at the front",
          "Receive God's renewal and peace"
        ],
        themeStyle: "purple-majesty",
        speakerNotes: "Soft instrumental music begins as prayer team moves forward."
      }
    ]
  }
];

export const THEME_PRESETS = [
  {
    id: 'gold-divine',
    name: 'Divine Gold',
    bgClass: 'bg-gradient-to-br from-amber-950 via-neutral-900 to-amber-900',
    textColor: 'text-amber-100',
    headerColor: 'text-amber-300',
    accentBorder: 'border-amber-500/40',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    id: 'nature-serene',
    name: 'Serene Nature',
    bgClass: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950',
    textColor: 'text-emerald-100',
    headerColor: 'text-emerald-300',
    accentBorder: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark Tech',
    bgClass: 'bg-gradient-to-br from-zinc-950 via-stone-900 to-neutral-950',
    textColor: 'text-zinc-100',
    headerColor: 'text-sky-300',
    accentBorder: 'border-sky-500/40',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  },
  {
    id: 'deep-blue',
    name: 'Ocean Deep Blue',
    bgClass: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950',
    textColor: 'text-blue-100',
    headerColor: 'text-cyan-300',
    accentBorder: 'border-cyan-500/40',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  },
  {
    id: 'purple-majesty',
    name: 'Royal Purple',
    bgClass: 'bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950',
    textColor: 'text-purple-100',
    headerColor: 'text-purple-300',
    accentBorder: 'border-purple-500/40',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    bgClass: 'bg-gradient-to-br from-rose-950 via-indigo-950 to-amber-950',
    textColor: 'text-rose-100',
    headerColor: 'text-amber-200',
    accentBorder: 'border-rose-500/40',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  }
];
