export const enUS = {
  // Common
  common: {
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    submit: "Submit",
    credits: "credits",
    credit: "credit",
    // i18n fix: Added missing common keys
    saving: "Saving...",
    deleting: "Deleting...",
    ptBR: "Português (Brasil)",
    enUS: "English (US)",
    notAvailable: "N/A",
  },

  // Navigation
  nav: {
    home: "Home",
    history: "History",
    credits: "Credits",
    profile: "Profile",
    login: "Log In",
    signup: "Sign Up",
    logout: "Log Out",
    buyCredits: "Buy Credits",
  },

  // Auth
  auth: {
    loginTitle: "Log In",
    loginSubtitle: "Sign in to access your account",
    signupTitle: "Sign Up",
    signupSubtitle: "Create your account and get {credits} free credits",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Name",
    nameOptional: "Name (optional)",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    loginButton: "Log In",
    signupButton: "Sign Up",
    loginWithGoogle: "Log in with Google",
    signupWithGoogle: "Sign up with Google",
    orContinueWith: "or continue with",
    minPassword: "Minimum 8 characters",
    termsAgree: "By creating an account, you agree to our",
    terms: "Terms of Service",
    termsAnd: "and",
    privacy: "Privacy Policy",
  },

  // Profile
  profile: {
    title: "My Profile",
    personalInfo: "Personal Information",
    updateProfile: "Update Profile",
    language: "Language",
    memberSince: "Member since",
    // i18n fix: Added missing profile keys
    editProfile: "Edit Profile",
    updateInfo: "Update your personal information",
    updateSuccess: "Profile updated successfully!",
    namePlaceholder: "Your name",
    selectLanguage: "Select language",
    saveChanges: "Save Changes",
    user: "User",
    admin: "Admin",
  },

  // Reading
  reading: {
    newReading: "New Reading",
    question: "Your Question",
    questionPlaceholder: "Enter your question for the cards... (e.g., What do I need to know about my career right now?)",
    spreadType: "Reading Type",
    oneCard: "One Card",
    oneCardDesc: "Quick insight about the present",
    threeCards: "Three Cards",
    threeCardsDesc: "Past, present, and future",
    fiveCards: "Five Cards",
    fiveCardsDesc: "Deep situation analysis",
    startReading: "Start Reading",
    consulting: "Consulting the cards...",
    theCards: "The Cards",
    interpretation: "Interpretation",
    summary: "Reading Summary",
    overallMessage: "Card Message",
    cardInterpretations: "Card Interpretations",
    reminder: "Reminder",
    keywords: "Keywords",
    meaning: "Meaning",
    upright: "Upright",
    reversed: "Reversed",
    past: "Past",
    present: "Present",
    future: "Future",
    situation: "Situation",
    challenge: "Challenge",
    advice: "Advice",
    formTitle: "Tarot Consultation",
    formHint: "Ask an open question for reflection",
    minChars: "Question must have at least {min} characters",
    maxChars: "Question must have at most {max} characters",
    model: "Model",
    latency: "Response time",
  },

  // Demo Page
  demo: {
    badge: "Demo",
    title: "Welcome to AI Mystic Tarot",
    subtitle: "A self-discovery experience guided by the symbolic wisdom of tarot. Ask your question and let the cards offer a perspective for reflection.",
    disclaimer: "Tarot is a tool for symbolic reflection, entertainment, and self-discovery. It does not replace professional medical, legal, financial, or psychological advice.",
    errorPrefix: "Error",
    errorCode: "Code",
    yourQuestion: "Your question",
    footer: "AI Mystic Tarot - Demo Version",
  },

  // History
  history: {
    title: "Reading History",
    noReadings: "No readings yet",
    noReadingsDescription: "Make your first tarot reading to get started",
    readingsCount: "{count} reading total",
    readingsCountPlural: "{count} readings total",
    loadMore: "Load More",
    viewReading: "View Reading",
    backToHistory: "Back to history",
  },

  // Journal
  journal: {
    title: "Your Notes",
    description: "Add personal reflections about this reading",
    addNote: "Add Note",
    placeholder: "Write your reflections about this reading...",
    savedAt: "Saved at",
    saving: "Saving...",
    deleting: "Deleting...",
    characters: "characters",
    emptyError: "Note cannot be empty",
    // i18n fix: Added missing journal keys
    loadError: "Error loading note",
    saveError: "Error saving note",
    deleteError: "Error deleting note",
    characterCount: "{current} / {max} characters",
  },

  // Credits
  credits: {
    title: "My Credits",
    balance: "Current Balance",
    transactionHistory: "Transaction History",
    noTransactions: "No transactions",
    buyMore: "Buy More",
    purchase: "Purchase",
    bonus: "Bonus",
    reading: "Reading",
    refund: "Refund",
    adjustment: "Adjustment",
    welcome: "Welcome",
    // i18n fix: Added missing credits keys
    lowBalance: "You're running low on credits!",
    totalSpent: "Total Spent",
    onReadings: "On tarot readings",
    totalPurchased: "Total Purchased",
    includingBonus: "Including bonuses",
    transactionDescription: "Your credit transactions will appear here",
    types: {
      reading: "Tarot Reading",
      purchase: "Credit Purchase",
      bonus: "Bonus",
      welcome: "Welcome Credits",
      refund: "Refund",
      adjustment: "Adjustment",
      default: "Transaction",
    },
  },

  // Payment
  payment: {
    buyCreditsTitle: "Buy Credits",
    buyCreditsSubtitle: "Choose the package that suits you",
    popular: "Most Popular",
    bestValue: "Best Value",
    perCredit: "per credit",
    buy: "Buy",
    simpleReadings: "{count} simple readings",
    fiveCardReadings: "{count} five-card readings",
    noExpiry: "Credits never expire",
    successTitle: "Payment Confirmed!",
    successSubtitle: "Your credits are now available",
    creditsAdded: "Credits added",
    amountPaid: "Amount paid",
    currentBalance: "Current balance",
    makeReading: "Make a Reading",
    viewHistory: "View Credit History",
    receiptSent: "A receipt has been sent to your email",
    // i18n fix: Added missing payment keys
    creditsCount: "{count} Credits",
    mostPopular: "Most Popular",
    noExpiration: "Credits never expire",
  },

  // Errors
  errors: {
    generic: "Something went wrong. Please try again.",
    invalidCredentials: "Invalid email or password",
    emailInUse: "This email is already in use",
    weakPassword: "Password must be at least 6 characters",
    passwordMismatch: "Passwords do not match",
    insufficientCredits: "Insufficient credits",
    readingNotFound: "Reading not found",
    unauthorized: "Unauthorized",
    networkError: "Connection error. Please check your internet.",
  },

  // Metadata
  meta: {
    appName: "AI Mystic Tarot",
    tagline: "Your digital spiritual guide",
  },

  // Landing Page (Hormozi Direct Response Style)
  landing: {
    nav: {
      tryFree: "Try Free",
      login: "Log In",
      settings: "Settings",
    },
    hero: {
      headline: "Get Crystal-Clear Guidance in 60 Seconds",
      subheadline:
        "AI-powered tarot readings that actually make sense. No fluff. No confusion. Just actionable clarity when you need it most.",
      cta: "Get Your Free Reading",
      ctaSubtext: "No credit card required",
      scrollHint: "See how it works",
    },
    problem: {
      title: "Sound Familiar?",
      subtitle: "You're not alone. These problems cost you time, energy, and peace of mind.",
      points: [
        {
          title: "Analysis Paralysis",
          description:
            "You've spent hours overthinking decisions that should take minutes. The mental energy drain is real—and it's costing you.",
        },
        {
          title: "Generic Advice Everywhere",
          description:
            "Every 'guidance' app gives the same cookie-cutter responses. Nothing actually applies to YOUR specific situation.",
        },
        {
          title: "Spiritual Skepticism",
          description:
            "Traditional readings feel vague and mystical. You want actionable insights, not cryptic riddles.",
        },
      ],
    },
    solution: {
      title: "There's a Better Way",
      subtitle: "What if you could get personalized guidance in under a minute?",
      description:
        "AI Mystic Tarot combines ancient symbolic wisdom with cutting-edge AI to give you readings that actually resonate. No generic fortunes. Just meaningful reflection tailored to your question.",
      features: [
        "Personalized interpretations for YOUR question",
        "Clear, actionable insights (no mystical jargon)",
        "Available 24/7 whenever you need clarity",
      ],
    },
    features: {
      title: "Why AI Mystic Tarot Works",
      subtitle: "Built different. Here's the proof.",
      items: [
        {
          title: "Personalized AI Analysis",
          description:
            "Our AI doesn't give generic readings. It analyzes your specific question and context to deliver insights that actually matter to you.",
          icon: "sparkles",
        },
        {
          title: "Symbolic Reflection",
          description:
            "Access thousands of years of symbolic wisdom, translated into modern language you can actually use for self-reflection.",
          icon: "layers",
        },
        {
          title: "Complete Privacy",
          description:
            "Your readings are yours alone. We never share your data, and you can use your own API keys for maximum control.",
          icon: "shield",
        },
      ],
    },
    social: {
      title: "Trusted by Thousands",
      stats: {
        readings: "50,000+",
        readingsLabel: "Readings delivered",
        users: "10,000+",
        usersLabel: "Happy users",
        rating: "4.9/5",
        ratingLabel: "Average rating",
      },
    },
    cta: {
      title: "Ready for Clarity?",
      subtitle:
        "Your first reading is completely free. No credit card. No commitment. Just the answers you've been looking for.",
      button: "Get Your Free Reading Now",
      guarantee: "100% private. Your data is never shared.",
      footer: "Join 10,000+ people who found clarity",
    },
    footer: {
      copyright: "AI Mystic Tarot. All rights reserved.",
      privacy: "Privacy",
      terms: "Terms",
    },
  },

  // Settings Page
  settings: {
    title: "Settings",
    subtitle: "Customize your AI Mystic Tarot experience",
    language: {
      title: "Language",
      description: "Choose your preferred language",
    },
    apiKeys: {
      title: "API Keys (BYOK)",
      description:
        "Use your own API keys to get 50% off all readings. Your keys are stored locally and never sent to our servers.",
      discount: "50% credit discount active",
      openai: {
        title: "OpenAI API Key",
        placeholder: "sk-...",
        helpText: "Get your API key from OpenAI",
        helpUrl: "https://platform.openai.com/api-keys",
      },
      gemini: {
        title: "Google Gemini API Key",
        placeholder: "AIza...",
        helpText: "Get your API key from Google AI Studio",
        helpUrl: "https://aistudio.google.com/apikey",
      },
      preferredProvider: "Preferred Provider",
      auto: "Auto (Gemini first, then OpenAI)",
      validate: "Test Key",
      validating: "Testing...",
      valid: "Key is valid",
      invalid: "Invalid key",
      save: "Save",
      remove: "Remove",
      saved: "Key saved successfully",
      removed: "Key removed",
    },
    saved: "Settings saved",
  },
} as const;
