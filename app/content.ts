/**
 * ============================================================================
 *  THE THINKING ROOM — SITE CONTENT
 * ============================================================================
 *  This is the ONLY file you need to edit to change the words, dates, links,
 *  and event details on the site. Everything below flows into the page layout
 *  automatically. No need to touch any of the design/component files.
 *
 *  Tip: keep the shape (the keys like `title`, `label`) the same — just change
 *  the text inside the quotes.
 * ============================================================================
 */

export const site = {
  brand: {
    name: "The Thinking Room",
    tagline: "Conversations That Create Clarity",
    initials: "TR",
  },

  // Top navigation links. Hrefs starting with "/#" scroll to a homepage
  // section (the leading "/" matters — this Nav also renders on /founder and
  // /tadcircle, so a bare "#about" would try to scroll within whatever page
  // it's on instead of jumping back to the homepage section).
  nav: [
    { label: "About", href: "/#about" },
    { label: "Conversations", href: "/#explore" },
    { label: "Journal", href: "/#journal" },
    { label: "TADCircle", href: "/tadcircle" },
    { label: "Founder", href: "/founder" },
  ],

  // -------------------------------------------------------------------------
  // HERO — the first thing visitors see
  // -------------------------------------------------------------------------
  hero: {
    eyebrow: "Current Conversation",
    edition: "Episode 3",
    // The headline is split so the second half can be highlighted.
    titleTop: "Living Your Life",
    titleBottom: "By Design.",
    description:
      "A live conversation with The Austin Adetunji on refusing to drift — designing your life on purpose instead of living by default. Come ready to rethink how you choose, commit, and build a life that's truly yours.",
    primaryCta: "Reserve Your Seat",
    secondaryCta: "Learn More",
  },

  // -------------------------------------------------------------------------
  // ABOUT — "What is The Thinking Room?"
  // -------------------------------------------------------------------------
  about: {
    heading: "What is The Thinking Room?",
    paragraphs: [
      "The Thinking Room is a modern intellectual platform where observations become meaningful conversations. We explore the overlooked patterns, ideas, and questions that shape how people think, lead, work, create, and live.",
      "Our conversations are designed to help thoughtful people see more clearly, think more deeply, and live more intentionally — around leadership, decision-making, human behaviour, work, purpose, and authentic living.",
    ],
  },

  // -------------------------------------------------------------------------
  // STATEMENT BANDS — big full-width "one line at a time" moments.
  // These are the cinematic beats between sections. `highlight` renders in
  // amber. Edit freely — or delete an entry to remove that band.
  // -------------------------------------------------------------------------
  statements: [
    {
      kicker: "The Real Problem",
      line1: "It was never about",
      highlight: "too few options.",
      line2: "It was about too little clarity.",
    },
    {
      kicker: "Why We Gather",
      line1: "Not to give you more",
      highlight: "to think about.",
      line2: "But to help you finally move.",
    },
  ],

  // -------------------------------------------------------------------------
  // WHAT WE EXPLORE — the five cards
  // -------------------------------------------------------------------------
  explore: {
    heading: "What We Explore",
    items: [
      { icon: "brain", label: "Why intelligent people remain stuck." },
      { icon: "signpost", label: "The hidden cost of endless possibilities." },
      { icon: "psychology", label: "The psychology of decision-making." },
      { icon: "hourglass", label: "Why readiness is an illusion." },
      { icon: "target", label: "A framework for moving from confusion to commitment." },
    ],
  },

  // -------------------------------------------------------------------------
  // WHO THIS IS FOR
  // -------------------------------------------------------------------------
  audience: {
    heading: "Who This Is For",
    // `label` (plural) is shown on the "Who This Is For" cards.
    // `singular` is used in the registration form's "You are a…" dropdown.
    // `blurb` is the one-line descriptor under each persona card.
    items: [
      { icon: "leaders", label: "Leaders", singular: "Leader", blurb: "Guiding others through uncertainty." },
      { icon: "entrepreneurs", label: "Entrepreneurs", singular: "Entrepreneur", blurb: "Building something in a noisy world." },
      { icon: "professionals", label: "Professionals", singular: "Professional", blurb: "Reaching for the next level." },
      { icon: "founders", label: "Founders", singular: "Founder", blurb: "Betting on a bigger vision." },
      { icon: "creators", label: "Creators", singular: "Creator", blurb: "Turning ideas into work that matters." },
      { icon: "students", label: "Students of Life", singular: "Student of Life", blurb: "Always learning, never settling." },
      { icon: "decision", label: "Decision-Makers", singular: "Decision-Maker", blurb: "Owning the hard calls." },
    ],
  },

  // -------------------------------------------------------------------------
  // EVENT DETAILS BAR  ← change the date / time / platform here
  // -------------------------------------------------------------------------
  details: [
    { icon: "calendar", label: "Date", value: "Friday, August 21, 2026" },
    { icon: "clock", label: "Time", value: "8:00 PM (WAT)" },
    { icon: "monitor", label: "Platform", value: "Virtual (Zoom)" },
   // { icon: "timer", label: "Duration", value: "2 Hours" },
    { icon: "ticket", label: "Investment", value: "Free (Registration Required)" },
  ],

  // -------------------------------------------------------------------------
  // EVENT SCHEDULE (machine-readable) — powers the calendar invite in the
  // confirmation email. Keep `startISO` in sync with the Date/Time above
  // whenever you change them. Format: "YYYY-MM-DDTHH:MM:SS+01:00" (WAT is
  // UTC+1 — adjust the offset if you ever move the event to another zone).
  // -------------------------------------------------------------------------
  event: {
    startISO: "2026-08-21T20:00:00+01:00",
    durationMinutes: 120,
  },

  // -------------------------------------------------------------------------
  // REGISTRATION FORM
  // -------------------------------------------------------------------------
  register: {
    eyebrow: "Reserve Your Seat",
    heading: "Join the Conversation",
    description:
      "Seats are limited. Register below and we'll send you the Zoom link and a reminder before the session begins.",
    successMessage:
      "You're in. Check your inbox for confirmation and the session link.",
    // After registering, people are shown this and redirected to the WhatsApp
    // group. Change the link here when the group changes.
    whatsappUrl: "https://chat.whatsapp.com/Csgf4kCe35RBkSPssCnP5v?mode=gi_t",
    whatsappMessage:
      "Registration successful! You'll now be redirected to join our WhatsApp group…",
  },

  // -------------------------------------------------------------------------
  // JOURNAL (newsletter) SIGNUP
  // -------------------------------------------------------------------------
  journal: {
    heading: "Join The Thinking Room Journal",
    description:
      "Receive weekly observations, ideas, and frameworks that help you think more clearly and live more intentionally.",
    successMessage: "Subscribed. Welcome to the Journal.",
  },

  // -------------------------------------------------------------------------
  // FOUNDER PAGE  (/founder)
  // -------------------------------------------------------------------------
  founder: {
    eyebrow: "The Founder",
    name: "Austin Adetunji",
    title: "Thinker. Coach. Founder of The Thinking Room.",
    photo: "/founder-portrait.webp",
    paragraphs: [
      "Austin Adetunji is a thinker, coach, and founder of The Thinking Room. Austin helps people see what they couldn't previously see. His thoughts reveal the hidden patterns that shape leadership, human behaviour, decision-making, work, and purposeful living.",
      "With years of experience in data analytics, Austin developed a disciplined way of observing patterns and systems. Over time, that analytical foundation expanded into a lifelong study of psychology, philosophy, behavioural science, leadership, organizational thinking, and theology. Today, he is recognized for synthesizing ideas across disciplines into practical mental models that help people understand themselves and the world more deeply.",
    ],
    // The disciplines named in the second paragraph above, pulled out as a
    // standalone list for the "Where His Thinking Draws From" grid.
    disciplines: {
      heading: "Where His Thinking Draws From",
      intro:
        "A disciplined way of observing patterns and systems, expanded into a lifelong study across disciplines:",
      origin: "Data Analytics",
      items: [
        "Psychology",
        "Philosophy",
        "Behavioural Science",
        "Leadership",
        "Organizational Thinking",
        "Theology",
      ],
    },
    quote: {
      kicker: "The Work",
      line1: "Austin helps people see",
      highlight: "what they couldn't previously see.",
      line2: " His thoughts reveal the patterns that shape how we lead, decide, and live.",
    },
    cta: {
      heading: "Join The Conversation",
      description:
        "Austin hosts The Thinking Room's live conversations and leads TADCircle, his private learning community for professionals, entrepreneurs, and emerging leaders.",
      primaryLabel: "Reserve Your Seat",
      primaryHref: "/#register",
      secondaryLabel: "Explore TADCircle",
      secondaryHref: "/tadcircle",
    },
  },

  // -------------------------------------------------------------------------
  // TADCIRCLE PAGE  (/tadcircle)
  // -------------------------------------------------------------------------
  tadcircle: {
    eyebrow: "The Circle",
    title: "TADCircle",
    subtitle: "The Austin Adetunji Circle",
    intro:
      "TADCircle (The Austin Adetunji Circle) is a private learning community where professionals, entrepreneurs, and emerging leaders engage with Austin's ongoing study, observations, and frameworks for personal and professional growth.",
    // The three ways Austin shows up, named directly in the intro copy.
    engagement: {
      heading: "How Austin Engages",
      items: [
        {
          icon: "mic",
          label: "Speaking",
          blurb: "To organizations navigating change and complexity.",
        },
        {
          icon: "handshake",
          label: "Coaching",
          blurb: "Individuals, building the judgment to make hard calls.",
        },
        {
          icon: "pen",
          label: "Writing",
          blurb: "For a global audience, in essays and mental models.",
        },
      ],
    },
    quote: {
      kicker: "The Conviction",
      line1: "Better thinking leads to",
      highlight: "better decisions.",
      line2: " Better decisions lead to a better life.",
    },
    audienceHeading: "Who TADCircle Is For",
    mission: {
      kicker: "The Mission",
      text: "His mission is not merely to provide answers, but to help people develop the judgment, perspective, and clarity required to flourish in every area of life.",
    },
    cta: {
      heading: "Join The Conversation",
      description:
        "TADCircle grows out of the same conversations The Thinking Room hosts publicly. Reserve your seat at the current one.",
      primaryLabel: "Reserve Your Seat",
      primaryHref: "/#register",
      secondaryLabel: "Meet The Founder",
      secondaryHref: "/founder",
    },
  },

  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  footer: {
    quickLinks: [
      { label: "About", href: "/#about" },
      { label: "Conversations", href: "/#explore" },
      { label: "Journal", href: "/#journal" },
      { label: "Founder", href: "/founder" },
      { label: "TADCircle", href: "/tadcircle" },
    ],
    email: "hello@thethinkingroom.co",
    handle: "@thethinkingroom.co",
    // Set these to your real social URLs (or leave "#" to disable).
    socials: [
      { label: "LinkedIn", href: "#", icon: "linkedin" },
      { label: "X / Twitter", href: "#", icon: "twitter" },
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "YouTube", href: "#", icon: "youtube" },
    ],
    copyright: "© 2026 The Thinking Room. All rights reserved.",
  },
} as const;

export type Site = typeof site;
