import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Search, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  Eye, 
  BookOpen, 
  Smartphone,
  Accessibility,
  CheckCircle2,
  Bookmark
} from "lucide-react";
import { UserProfile } from "../types";

// Alphabet configurations with premium SVG vector representations or precise description models
interface ASLLetter {
  char: string;
  name: string;
  shape: string;
  description: string;
  fingerStates: {
    thumb: "extended" | "folded" | "crossed";
    index: "extended" | "folded" | "half";
    middle: "extended" | "folded" | "half";
    ring: "extended" | "folded" | "half";
    pinky: "extended" | "folded" | "half";
  };
}

const ASL_ALPHABET: Record<string, ASLLetter> = {
  A: {
    char: "A",
    name: "Closed Fist",
    shape: "Fist with thumb on side",
    description: "Fist closed, all four fingers curled tightly. Thumb lies straight up along the outer edge of the index finger.",
    fingerStates: { thumb: "extended", index: "folded", middle: "folded", ring: "folded", pinky: "folded" }
  },
  B: {
    char: "B",
    name: "Flat Hand",
    shape: "Open palm with thumb crossed over",
    description: "All four fingers stand straight up and touch. The thumb folds across the palm in front of the fingers.",
    fingerStates: { thumb: "crossed", index: "extended", middle: "extended", ring: "extended", pinky: "extended" }
  },
  C: {
    char: "C",
    name: "Curved C",
    shape: "Cupped hand representing letter C",
    description: "All fingers and the thumb are curved to form a cup or C-shape, as if grasping a large sphere.",
    fingerStates: { thumb: "extended", index: "half", middle: "half", ring: "half", pinky: "half" }
  },
  D: {
    char: "D",
    name: "Pointer",
    shape: "Index pointing, others in circle with thumb",
    description: "Index finger points straight up. The thumb, middle, ring, and pinky curve to touch each other at the tips.",
    fingerStates: { thumb: "crossed", index: "extended", middle: "folded", ring: "folded", pinky: "folded" }
  },
  E: {
    char: "E",
    name: "Claw Fist",
    shape: "Slightly clawed fingers with thumb horizontal",
    description: "All four fingers curl halfway down, with tips resting gently on top of the thumb folded across the front.",
    fingerStates: { thumb: "crossed", index: "half", middle: "half", ring: "half", pinky: "half" }
  },
  F: {
    char: "F",
    name: "Three-Finger Salute",
    shape: "Circle with index and thumb, others extended",
    description: "The index finger and thumb form a neat circle. The middle, ring, and pinky stand straight up, spread apart.",
    fingerStates: { thumb: "crossed", index: "folded", middle: "extended", ring: "extended", pinky: "extended" }
  },
  G: {
    char: "G",
    name: "Pinch Slide",
    shape: "Index and thumb horizontal, others curled",
    description: "Index finger and thumb extend horizontally pointing forward, separated slightly like a small gauge. Other fingers curled.",
    fingerStates: { thumb: "extended", index: "extended", middle: "folded", ring: "folded", pinky: "folded" }
  },
  H: {
    char: "H",
    name: "Double Pointer",
    shape: "Index and middle horizontal, others back",
    description: "Index and middle finger extend together horizontally to the side. The thumb folds over the curled ring and pinky.",
    fingerStates: { thumb: "folded", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  I: {
    char: "I",
    name: "Pinky Up",
    shape: "Pinky straight up, others curled",
    description: "The pinky finger stands straight up. The other three fingers curl into a fist, with the thumb laying over them.",
    fingerStates: { thumb: "folded", index: "folded", middle: "folded", ring: "folded", pinky: "extended" }
  },
  J: {
    char: "J",
    name: "Curving Pinky",
    shape: "Pinky tracing a curve in air",
    description: "Start with pinky straight up (the 'I' sign), then trace a 'J' curve downward and hook forward in the air.",
    fingerStates: { thumb: "folded", index: "folded", middle: "folded", ring: "folded", pinky: "extended" }
  },
  K: {
    char: "K",
    name: "Peace Split",
    shape: "Index/middle pointing up, thumb touching middle",
    description: "Index and middle finger stand pointing up in a split V. The thumb stands upright, touching the middle of the index finger.",
    fingerStates: { thumb: "extended", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  L: {
    char: "L",
    name: "The L-Shape",
    shape: "Index and thumb forming 90-degree angle",
    description: "Index finger points straight up. The thumb points horizontally to the side. Other fingers are curled in.",
    fingerStates: { thumb: "extended", index: "extended", middle: "folded", ring: "folded", pinky: "folded" }
  },
  M: {
    char: "M",
    name: "Triple Tuck",
    shape: "Thumb tucked under three fingers",
    description: "Fingers curled inward. The thumb is tucked underneath the index, middle, and ring fingers.",
    fingerStates: { thumb: "folded", index: "folded", middle: "folded", ring: "folded", pinky: "folded" }
  },
  N: {
    char: "N",
    name: "Double Tuck",
    shape: "Thumb tucked under two fingers",
    description: "Fingers curled inward. The thumb is tucked underneath the index and middle fingers.",
    fingerStates: { thumb: "folded", index: "folded", middle: "folded", ring: "folded", pinky: "folded" }
  },
  O: {
    char: "O",
    name: "Circle O",
    shape: "All fingers curved to touch thumb",
    description: "All five fingers bend together to touch at the tips, forming a perfect circle shape, resembling an O.",
    fingerStates: { thumb: "extended", index: "half", middle: "half", ring: "half", pinky: "half" }
  },
  P: {
    char: "P",
    name: "Downward K",
    shape: "Index and middle points down, thumb inside",
    description: "Like the K sign but pointing downward. Index horizontal, middle hanging down, thumb resting in between them.",
    fingerStates: { thumb: "extended", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  Q: {
    char: "Q",
    name: "Downward G",
    shape: "Pinch fingers pointing downward",
    description: "Like the G sign but pointing downward. The index finger and thumb extend downward like a little claw.",
    fingerStates: { thumb: "extended", index: "extended", middle: "folded", ring: "folded", pinky: "folded" }
  },
  R: {
    char: "R",
    name: "Crossed Fingers",
    shape: "Index and middle fingers twisted together",
    description: "The index and middle fingers stand straight up and cross over each other tightly. Other fingers curled.",
    fingerStates: { thumb: "folded", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  S: {
    char: "S",
    name: "Front Thumb Fist",
    shape: "Fist with thumb in front of fingers",
    description: "A tight fist wrapping all fingers down, with the thumb crossed horizontally in front of the middle knuckles.",
    fingerStates: { thumb: "crossed", index: "folded", middle: "folded", ring: "folded", pinky: "folded" }
  },
  T: {
    char: "T",
    name: "Single Tuck",
    shape: "Thumb tucked inside index finger",
    description: "A closed fist. The thumb is tucked inside underneath the curled index finger, pointing upward out of the gap.",
    fingerStates: { thumb: "extended", index: "folded", middle: "folded", ring: "folded", pinky: "folded" }
  },
  U: {
    char: "U",
    name: "Double Extended",
    shape: "Index and middle straight up together",
    description: "Index and middle fingers are straight, vertical, and touching. Ring finger and pinky are zipped down.",
    fingerStates: { thumb: "folded", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  V: {
    char: "V",
    name: "Peace Sign",
    shape: "Index and middle open, separated",
    description: "Index and middle fingers are straight up and spread apart in a split V. Pinky, ring, and thumb curled.",
    fingerStates: { thumb: "folded", index: "extended", middle: "extended", ring: "folded", pinky: "folded" }
  },
  W: {
    char: "W",
    name: "Three Up",
    shape: "Index, middle, ring straight up and spread",
    description: "Index, middle, and ring fingers stand straight up and spread out. Thumb holds the pinky finger tip down.",
    fingerStates: { thumb: "crossed", index: "extended", middle: "extended", ring: "extended", pinky: "folded" }
  },
  X: {
    char: "X",
    name: "The Hook",
    shape: "Index bent like a coat hook",
    description: "Index finger is curved at the joints like a hook. Thumb and other three fingers are curled tight.",
    fingerStates: { thumb: "folded", index: "half", middle: "folded", ring: "folded", pinky: "folded" }
  },
  Y: {
    char: "Y",
    name: "Surfer Hand",
    shape: "Pinky and thumb out, others curled",
    description: "The thumb and the pinky are extended wide apart. The index, middle, and ring fingers are curled down.",
    fingerStates: { thumb: "extended", index: "folded", middle: "folded", ring: "folded", pinky: "extended" }
  },
  Z: {
    char: "Z",
    name: "The Z-Writer",
    shape: "Index tracing a letter Z",
    description: "Extend your index finger forward in state, and trace the letter 'Z' in empty space in front of you.",
    fingerStates: { thumb: "folded", index: "extended", middle: "folded", ring: "folded", pinky: "folded" }
  }
};

interface Phrase {
  id: string;
  category: "Academic" | "Greetings" | "Help";
  title: string;
  signGloss: string;
  illustrationDesc: string;
  steps: string[];
}

const ASL_PHRASEBOOK: Phrase[] = [
  {
    id: "p1",
    category: "Academic",
    title: "Let's study together",
    signGloss: "STUDY + TOGETHER + WE",
    illustrationDesc: "Hands flat modeling study text, followed by double thumbs hooked together orbiting.",
    steps: [
      "STUDY: Place open left hand flat acting as draft paper. Tap fingers of right claw lightly on the palm repeatedly.",
      "TOGETHER: Form fists with both hands, thumbs up. Press palms together, making small circular loops horizontally.",
      "WE: Point right index finger to your chest, swing it out in a circle, and point to your opposite shoulder."
    ]
  },
  {
    id: "p2",
    category: "Greetings",
    title: "Good morning, Professor",
    signGloss: "GOOD + MORNING + TEACH-PERSON",
    illustrationDesc: "Flat hand descending from chin, followed by rising arm, and double flat folders pointing out.",
    steps: [
      "GOOD: Touch flat right hand to chin, then move it down, landing flat into flat left palm.",
      "MORNING: Place right fingertips in the crook of the left arm, swing right arm upward like the rising sun.",
      "PROFESSOR (TEACHER): Bring closed fingertips to forehead and move them forward (Teach), then flatten hands downward representing a person."
    ]
  },
  {
    id: "p3",
    category: "Help",
    title: "I need help with this problem",
    signGloss: "HELP + ME + PROBLEM",
    illustrationDesc: "Left hand flat, thumbed-up right hand resting atop raised vertically.",
    steps: [
      "HELP: Place flat left hand out. Make a fist with right hand, thumb up, set it atop left palm, and lift together.",
      "ME: Point directly at your chest with index finger.",
      "PROBLEM: Form bent V fingers with both hands. Rotate knuckles against each other in reciprocating twist motions."
    ]
  },
  {
    id: "p4",
    category: "Academic",
    title: "What is the answer?",
    signGloss: "ANSWER + WHAT",
    illustrationDesc: "Index fingers curving forward from chin, followed by open palms shaking flat.",
    steps: [
      "ANSWER: Place both index fingers straight up near face (right closer, left further). Pivot both hands downward parallel.",
      "WHAT: Open palms flat facing skies, shake them slightly side to side with quizzical dynamic expression."
    ]
  },
  {
    id: "p5",
    category: "Greetings",
    title: "Congratulations! Great job!",
    signGloss: "APPLAUSE (SILENT CLAPPING)",
    illustrationDesc: "Both hands raised waving air rapidly like flashing stars.",
    steps: [
      "SILENT CLAPPING: Lift both hands above shoulders, spread fingers wide with friendly facial expression, and twist wrists rapidly in rotating flashing orbits."
    ]
  }
];

// Interactive Quiz items
interface QuizItem {
  id: string;
  termSpelt: string;
  phraseHint: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const ACCESSIBILITY_QUIZ: QuizItem[] = [
  {
    id: "aq1",
    termSpelt: "CS",
    phraseHint: "Our primary computer engineering subject shortcut.",
    options: ["AI", "CS", "IT", "ML"],
    correctIdx: 1,
    explanation: "C is fingers curled forming a cup, S is tucked closed fist with thumb wrapped across front knuckles."
  },
  {
    id: "aq2",
    termSpelt: "MATH",
    phraseHint: "We solve limits, integrals, and Stokes' theorems here.",
    options: ["MATH", "PHYS", "NODE", "ALGO"],
    correctIdx: 0,
    explanation: "M tucks three fingers over, A is fist with side-thumb, T is thumb between index, H extends side index and middle."
  },
  {
    id: "aq3",
    termSpelt: "QUIZ",
    phraseHint: "Short assessments in academic modules.",
    options: ["EXAM", "TEST", "QUIZ", "WORK"],
    correctIdx: 2,
    explanation: "Q is downwards pinch, U is index and middle tight up, I is pinky up, Z traces a Z letter path."
  }
];

interface SignLanguageProps {
  currentUser: { name: string; email: string } | null;
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  showToast: (msg: string, type: "success" | "info") => void;
  submitLeaderboardScore: (name: string, xp: number, badge: string) => void;
}

export default function SignLanguage({
  currentUser,
  profile,
  setProfile,
  showToast,
  submitLeaderboardScore
}: SignLanguageProps) {
  // Translate Input States
  const [inputText, setInputText] = useState("");
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per letter
  const [historyQueries, setHistoryQueries] = useState<string[]>(["HELLO", "STUDY", "MATH"]);

  // Speech Helper State
  const [isListening, setIsListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [accessibilityCaptions, setAccessibilityCaptions] = useState(true);

  // Filter letter dictionary search
  const [alphabetQuery, setAlphabetQuery] = useState("");
  const [selectedChar, setSelectedChar] = useState<ASLLetter>(ASL_ALPHABET["A"]);

  // Phrasebook Controller
  const [activePhraseTab, setActivePhraseTab] = useState<"All" | "Academic" | "Greetings" | "Help">("All");
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase>(ASL_PHRASEBOOK[0]);

  // Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizScoresLog, setQuizScoresLog] = useState<boolean[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const words = inputText.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechAvailable(true);
      }
    }
  }, []);

  // Fingerspelling animation loop
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      intervalRef.current = setInterval(() => {
        const currentWord = words[activeWordIdx];
        if (!currentWord) {
          // Finished entire text
          setIsPlaying(false);
          setActiveWordIdx(0);
          setActiveCharIdx(0);
          showToast("✨ Finished fingerspelling translation visualization!", "success");
          return;
        }

        if (activeCharIdx < currentWord.length - 1) {
          // Next character in current word
          setActiveCharIdx(c => c + 1);
        } else {
          // Next word
          if (activeWordIdx < words.length - 1) {
            setActiveWordIdx(w => w + 1);
            setActiveCharIdx(0);
          } else {
            // End of message
            setIsPlaying(false);
            setActiveWordIdx(0);
            setActiveCharIdx(0);
            showToast("✨ Finished fingerspelling translation visualization!", "success");
          }
        }
      }, playbackSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, activeWordIdx, activeCharIdx, words, playbackSpeed]);

  const handleTranslateSubmit = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z\s]/g, "");
    if (!sanitized.trim()) {
      showToast("Please enter standard academic alphabetic text.", "info");
      return;
    }
    setInputText(sanitized);
    setActiveWordIdx(0);
    setActiveCharIdx(0);
    setIsPlaying(true);
    
    // Add to history
    const upper = sanitized.trim().toUpperCase();
    if (!historyQueries.includes(upper)) {
      setHistoryQueries(prev => [upper, ...prev.slice(0, 5)]);
    }
  };

  // Simulated Voice Recognition fallback & Real API
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast("Speech recognition not supported in this nested frame. Simulating spoken input...", "info");
      const simulationPhrases = ["LEARN MATH", "NEED HELP", "COMPUTER SCIENCE", "STUDY TIME"];
      const rand = simulationPhrases[Math.floor(Math.random() * simulationPhrases.length)];
      setIsListening(true);
      setTimeout(() => {
        setInputText(rand);
        handleTranslateSubmit(rand);
        setIsListening(false);
        showToast(`🎙️ Simulated Speech: "${rand}" translated to ASL!`, "success");
      }, 1500);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      showToast("🎙️ Listening... speak clearly into your mic.", "info");
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputText(resultText);
      handleTranslateSubmit(resultText);
      showToast(`🎙️ Captured spoken input: "${resultText}"`, "success");
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      showToast("⚠️ Could not capture audio. Please type manually inside input field.", "info");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const currentLetterToken = words[activeWordIdx]?.[activeCharIdx] || null;
  const currentLetterDetails = currentLetterToken ? ASL_ALPHABET[currentLetterToken] : null;

  // Render SVG Hand schema representation dynamically
  const renderVectorHandRig = (letter: string) => {
    const item = ASL_ALPHABET[letter.toUpperCase()];
    if (!item) return null;

    // We draw dynamic SVG vector pathways representing five fingers with stylish color attributes
    const { thumb, index, middle, ring, pinky } = item.fingerStates;

    // Define coordinates based on finger positions
    const thumbX = thumb === "extended" ? 45 : thumb === "crossed" ? 65 : 55;
    const thumbY = thumb === "extended" ? 55 : 75;

    const indexY = index === "extended" ? 20 : index === "half" ? 45 : 70;
    const middleY = middle === "extended" ? 15 : middle === "half" ? 40 : 72;
    const ringY = ring === "extended" ? 18 : ring === "half" ? 42 : 74;
    const pinkyY = pinky === "extended" ? 25 : pinky === "half" ? 48 : 76;

    return (
      <svg className="w-48 h-48 mx-auto text-indigo-400 drop-shadow-xl" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="fingerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Hand wrist sleeve */}
        <path d="M40 100 Q 60 115 80 100 L 75 118 L 45 118 Z" fill="#1e1b4b" stroke="#312e81" strokeWidth="2" />
        
        {/* Palm base plate */}
        <path d="M35 70 Q 30 95 45 100 L 75 100 Q 90 95 85 70 Z" fill="url(#handGrad)" stroke="#4f46e5" strokeWidth="3" />

        {/* Pinky Finger */}
        <rect x="75" y={pinkyY} width="8" height={80 - pinkyY} rx="4" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        
        {/* Ring Finger */}
        <rect x="65" y={ringY} width="9" height={80 - ringY} rx="4.5" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        
        {/* Middle Finger */}
        <rect x="54" y={middleY} width="10" height={80 - middleY} rx="5" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        
        {/* Index Finger */}
        <rect x="43" y={indexY} width="10" height={80 - indexY} rx="5" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />

        {/* Thumb */}
        {thumb === "extended" && (
          <path d="M35 85 Q 15 75 20 60 Q 30 55 42 75 Z" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        )}
        {thumb === "crossed" && (
          <path d="M30 85 Q 55 85 62 78 Q 62 68 40 75 Z" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        )}
        {thumb === "folded" && (
          <path d="M35 85 Q 40 95 48 90 Q 52 80 40 75 Z" fill="url(#fingerGrad)" stroke="#312e81" strokeWidth="1.5" />
        )}

        {/* Dynamic Joint Circle accents */}
        <circle cx="48" cy="74" r="2.5" fill="#e0e7ff" opacity="0.6" />
        <circle cx="59" cy="73" r="2.5" fill="#e0e7ff" opacity="0.6" />
        <circle cx="70" cy="75" r="2.5" fill="#e0e7ff" opacity="0.6" />
        <circle cx="79" cy="77" r="2" fill="#e0e7ff" opacity="0.6" />

        {/* Real-time sign indicators */}
        <text x="60" y="93" textAnchor="middle" fill="#ffffff" fontWeight="black" fontSize="12" fontFamily="monospace">
          {letter}
        </text>
      </svg>
    );
  };

  const handlePhraseTabChange = (cat: "All" | "Academic" | "Greetings" | "Help") => {
    setActivePhraseTab(cat);
    const filtered = cat === "All" ? ASL_PHRASEBOOK : ASL_PHRASEBOOK.filter(p => p.category === cat);
    if (filtered.length > 0) {
      setSelectedPhrase(filtered[0]);
    }
  };

  const handleQuizAnswerSelect = (optIdx: number) => {
    if (quizChecked) return;
    setSelectedQuizOpt(optIdx);
  };

  const handleQuizCheck = () => {
    if (selectedQuizOpt === null || quizChecked) return;
    const currentQ = ACCESSIBILITY_QUIZ[currentQuizIdx];
    const isCorrect = selectedQuizOpt === currentQ.correctIdx;
    
    setQuizScoresLog(prev => [...prev, isCorrect]);
    setQuizChecked(true);

    if (isCorrect) {
      showToast("🎉 Correct! Outstanding sign decoding!", "success");
    } else {
      showToast("💡 Keep learning! Check the explanation below.", "info");
    }
  };

  const handleQuizNext = () => {
    if (currentQuizIdx < ACCESSIBILITY_QUIZ.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedQuizOpt(null);
      setQuizChecked(false);
    } else {
      // Finished entire quiz
      setQuizFinished(true);
      const correctsCount = quizScoresLog.filter(Boolean).length;
      const finalXpGain = correctsCount * 40; // 40 XP per score!

      setProfile(p => {
        const newXp = p.xp + finalXpGain;
        if (currentUser?.name) {
          submitLeaderboardScore(currentUser.name, newXp, `Compassionate Advocate 🌟`);
        }
        return {
          ...p,
          xp: newXp
        };
      });

      showToast(`🏆 Score: ${correctsCount}/${ACCESSIBILITY_QUIZ.length}! Earned +${finalXpGain} XP database sync!`, "success");
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedQuizOpt(null);
    setQuizChecked(false);
    setQuizScoresLog([]);
    setQuizFinished(false);
  };

  const filteredAlphabetList = Object.keys(ASL_ALPHABET).filter(char => 
    char.includes(alphabetQuery.toUpperCase()) || 
    ASL_ALPHABET[char].name.toLowerCase().includes(alphabetQuery.toLowerCase())
  );

  return (
    <div id="asl-accessibility-section" className="space-y-8 animate-fade-in">
      
      {/* Title Header Block */}
      <div className="bg-slate-900/40 rounded-3xl p-6 border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-505/10 bg-indigo-900/30 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">
            <Accessibility size={12} className="text-indigo-400 rotate-12" />
            <span>Inclusive Learning Nodes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Sign Language & Accessibility Companion
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Enhancing classroom accessibility for deaf and disabled students. Translate curriculum topics to American Sign Language, practice letters, and master peer communication effortlessly.
          </p>
        </div>

        {/* Global XP summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 text-center md:text-left min-w-[200px] justify-center md:justify-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            🤝
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Impact Score</span>
            <span className="text-lg font-black text-slate-200 block">{profile.xp} XP</span>
            <span className="text-[10px] text-indigo-400 font-mono">ASL Helper Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT - TRANSLATOR / DYNAMIC ANIMATOR (width 7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                  ASL
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-200">Interactive Fingerspelling Visualizer</h2>
                  <span className="text-[10px] text-slate-500 font-bold">Text-to-Sign translation service</span>
                </div>
              </div>

              {/* Caption setting indicators */}
              <button
                onClick={() => setAccessibilityCaptions(!accessibilityCaptions)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  accessibilityCaptions 
                    ? "bg-slate-950 text-indigo-400 border-indigo-500/20" 
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
                title="Toggle clear visual layout annotations"
              >
                {accessibilityCaptions ? "✓ Captions Active" : "No captions"}
              </button>
            </div>

            {/* Input submission workspace */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Speak or Enter custom academic vocabulary words
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CELL, MATH, ATOM, CS..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleTranslateSubmit(inputText)}
                  className="w-full bg-slate-950 rounded-xl pl-4 pr-32 py-3 text-xs border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-upper"
                />

                {/* Speech mic action trigger */}
                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                  <button
                    onClick={startSpeechRecognition}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      isListening
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                    title="Translate spoke audio to ASL signs"
                  >
                    {isListening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                  </button>

                  <button
                    onClick={() => handleTranslateSubmit(inputText)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Translate
                  </button>
                </div>
              </div>

              {/* Display history nodes query */}
              {historyQueries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Quick Presets:</span>
                  {historyQueries.map((hist, i) => (
                    <button
                      key={i}
                      onClick={() => handleTranslateSubmit(hist)}
                      className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-[10px] font-mono text-slate-400 hover:text-indigo-300"
                    >
                      {hist}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Display Stage Render */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
              {words.length === 0 ? (
                <div className="text-center space-y-3 p-4">
                  <Accessibility size={40} className="mx-auto text-slate-700 animate-pulse" />
                  <p className="text-xs text-slate-500 max-w-sm">
                    Enter academic study terms or speak above. The tool maps each letter sequence into a precise, responsive ASL fingerspelled tutorial.
                  </p>
                </div>
              ) : (
                <div className="w-full text-center space-y-6">
                  
                  {/* Realtime Active Character rendering */}
                  <div className="relative inline-block">
                    {currentLetterToken ? (
                      <div className="space-y-4">
                        {/* Dynamic custom vector rig */}
                        <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/40 relative">
                          {renderVectorHandRig(currentLetterToken)}
                        </div>

                        {/* Text descriptions overlay */}
                        {accessibilityCaptions && currentLetterDetails && (
                          <div className="space-y-1 mx-auto max-w-md bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xl font-bold font-mono text-indigo-300">{currentLetterDetails.char}</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">— {currentLetterDetails.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{currentLetterDetails.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-indigo-400 py-10 font-black tracking-widest uppercase">
                        Preparing sign frames...
                      </div>
                    )}
                  </div>

                  {/* Highlight current character spelling timeline */}
                  <div className="max-w-md mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-sm font-black font-mono">
                      {words.map((w, wIdx) => {
                        const isCurrentWord = wIdx === activeWordIdx;
                        return (
                          <span 
                            key={wIdx} 
                            className={`px-2 py-1 rounded-lg flex gap-0.5 ${
                              isCurrentWord ? "bg-indigo-950/50 border border-indigo-800/40 text-indigo-200" : "text-slate-600"
                            }`}
                          >
                            {w.split("").map((c, cIdx) => {
                              const isCurrentChar = isCurrentWord && cIdx === activeCharIdx;
                              return (
                                <span
                                  key={cIdx}
                                  className={`px-0.5 rounded transition-all ${
                                    isCurrentChar 
                                      ? "text-indigo-400 bg-indigo-500/10 text-lg scale-125 border-b-2 border-indigo-400 animate-pulse font-extrabold" 
                                      : "opacity-60"
                                  }`}
                                >
                                  {c}
                                </span>
                              );
                            })}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Playbacks and Speed Controls */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-900/80 max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveWordIdx(0);
                          setActiveCharIdx(0);
                          setIsPlaying(false);
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Rewrite / Reset playback speed time"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${
                          isPlaying 
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                            : "bg-slate-900 hover:bg-slate-800 text-slate-200"
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Pause size={12} fill="currentColor" /> Pause
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" /> Play Timeline
                          </>
                        )}
                      </button>
                    </div>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span>Speed:</span>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                        className="bg-slate-900 text-slate-200 text-[10px] font-mono border border-slate-800 rounded px-2 py-1 cursor-pointer focus:outline-none"
                      >
                        <option value={1500}>0.7x (Slow)</option>
                        <option value={1000}>1.0x (Normal)</option>
                        <option value={600}>1.5x (Fast)</option>
                        <option value={400}>2.0x (Turbo)</option>
                      </select>
                    </div>

                  </div>

                </div>
              )}
            </div>

          </div>

          {/* ACADEMIC PHRASEBOOK SECTIONS */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                <div>
                  <h2 className="text-sm font-black text-slate-200">Deaf Culture Academic Phrasebook</h2>
                  <span className="text-[10px] text-slate-500 font-bold">Essential communication helpers for classroom peer study</span>
                </div>
              </div>
            </div>

            {/* Sub navigation categories */}
            <div className="flex gap-1">
              {(["All", "Academic", "Greetings", "Help"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handlePhraseTabChange(cat)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activePhraseTab === cat
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-700/30"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Double grid list and display summary details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-900">
              
              <div className="md:col-span-5 h-[200px] overflow-y-auto space-y-1.5 pr-2 border-r border-slate-900/80">
                {ASL_PHRASEBOOK.filter(p => activePhraseTab === "All" || p.category === activePhraseTab).map((phr) => (
                  <button
                    key={phr.id}
                    onClick={() => setSelectedPhrase(phr)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs leading-tight transition-all cursor-pointer ${
                      selectedPhrase.id === phr.id 
                        ? "bg-slate-900 text-slate-150 border-l-2 border-indigo-500 font-semibold" 
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{phr.title}</div>
                    <div className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{phr.signGloss}</div>
                  </button>
                ))}
              </div>

              <div className="md:col-span-7 flex flex-col justify-between h-[200px] space-y-3 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-300 font-mono font-black uppercase px-2 py-0.5 rounded">
                      {selectedPhrase.category}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-200">{selectedPhrase.title}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Gloss: <strong className="font-mono text-cyan-300 uppercase select-all">{selectedPhrase.signGloss}</strong>
                  </p>

                  <div className="space-y-1 bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/50 max-h-[110px] overflow-y-auto">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Step-By-Step Mechanics</span>
                    <ul className="text-[10px] leading-relaxed text-slate-300 list-disc list-inside space-y-1">
                      {selectedPhrase.steps.map((st, sidx) => (
                        <li key={sidx}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handleTranslateSubmit(selectedPhrase.signGloss.replace(/\+/g, " "))}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowRight size={10} /> Watch letters on Fingerspelling Visualizer
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT - ALPHABET DICTIONARY & COMPREHENSION QUIZ (width 5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* INTERACTIVE ALPHABET DICTIONARY DIALOG SELECTOR */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-indigo-400" />
              <div>
                <h2 className="text-sm font-black text-slate-200">ASL Vector Dictionary</h2>
                <span className="text-[10px] text-slate-500 font-bold">Search and learn hand configurations instantly</span>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search letter (A-Z)..."
                value={alphabetQuery}
                onChange={(e) => setAlphabetQuery(e.target.value.slice(0, 10))}
                className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 uppercase font-mono"
              />
            </div>

            {/* Alphabet Grid Container */}
            <div className="grid grid-cols-6 gap-1 bg-slate-950 p-2.5 rounded-2xl border border-slate-900/60">
              {Object.keys(ASL_ALPHABET).map((char) => {
                const item = ASL_ALPHABET[char];
                const isSelected = selectedChar.char === char;
                const matchesSearch = filteredAlphabetList.includes(char);

                return (
                  <button
                    key={char}
                    onClick={() => setSelectedChar(item)}
                    className={`p-2 rounded-lg text-center transition-all cursor-pointer font-black font-mono relative flex flex-col justify-between ${
                      isSelected 
                        ? "bg-indigo-600 text-white scale-105 shadow shadow-indigo-600/35" 
                        : matchesSearch 
                          ? "bg-slate-905 hover:bg-slate-900 text-slate-300" 
                          : "opacity-25 bg-transparent text-slate-600 cursor-not-allowed"
                    }`}
                    disabled={!matchesSearch}
                  >
                    <span className="text-sm">{char}</span>
                    <span className="text-[7px] text-slate-500 opacity-80 mt-1 block leading-none truncate">
                      {item.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Letter specifics details card */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-900 flex gap-4 text-left">
              <div className="w-24 h-24 bg-slate-900/60 rounded-xl border border-slate-800/40 flex items-center justify-center p-1 flex-shrink-0">
                {renderVectorHandRig(selectedChar.char)}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black font-mono text-indigo-300">{selectedChar.char}</span>
                  <span className="text-[9px] bg-indigo-900/40 text-indigo-300 border border-indigo-700/20 px-1.5 py-0.5 rounded font-mono">
                    {selectedChar.name}
                  </span>
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                  Posture: <span className="text-slate-300 font-mono font-normal normal-case">{selectedChar.shape}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">
                  {selectedChar.description}
                </p>
                <button
                  onClick={() => handleTranslateSubmit(selectedChar.char)}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold pt-1"
                >
                  <Eye size={10} /> View in translator stage
                </button>
              </div>
            </div>

          </div>

          {/* INCLUSIVE STUDY REWARDS - DECODING PRACTICE QUIZ */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 space-y-6 relative overflow-hidden">
            
            {/* Background absolute decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                <div>
                  <h2 className="text-sm font-black text-slate-200">ASL Comprehension Quiz</h2>
                  <span className="text-[10px] text-slate-500 font-bold">Decode spelling and earn +40 XP per score!</span>
                </div>
              </div>
            </div>

            {!quizFinished ? (
              <div className="space-y-4">
                
                {/* Progress bar info */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
                  <span>Question {currentQuizIdx + 1} of {ACCESSIBILITY_QUIZ.length}</span>
                  <span className="text-indigo-400">XP Reward active</span>
                </div>

                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${((currentQuizIdx) / ACCESSIBILITY_QUIZ.length) * 100}%` }}
                  />
                </div>

                {/* Simulated visual fingerspelled word */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-4 text-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Decode this spelling:</span>
                  
                  {/* Row of vector hand poses */}
                  <div className="flex items-center justify-center gap-1 py-2">
                    {ACCESSIBILITY_QUIZ[currentQuizIdx].termSpelt.split("").map((c, i) => (
                      <div key={i} className="w-10 h-10 bg-slate-900 rounded-lg border border-slate-800 cursor-help" title={`ASL Sign Letter: ${c}`}>
                        {renderVectorHandRig(c)}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Hint: &ldquo;{ACCESSIBILITY_QUIZ[currentQuizIdx].phraseHint}&rdquo;
                  </p>
                </div>

                {/* Multiple choice options */}
                <div className="space-y-2">
                  {ACCESSIBILITY_QUIZ[currentQuizIdx].options.map((opt, oIdx) => {
                    const isSelected = selectedQuizOpt === oIdx;
                    const isCorrect = oIdx === ACCESSIBILITY_QUIZ[currentQuizIdx].correctIdx;
                    
                    let btnClass = "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300";
                    if (isSelected) {
                      btnClass = "bg-indigo-950/20 border-indigo-500/80 text-indigo-200 font-bold";
                    }
                    if (quizChecked) {
                      if (isCorrect) {
                        btnClass = "bg-green-950/20 border-green-500 text-green-300 font-bold";
                      } else if (isSelected) {
                        btnClass = "bg-red-950/20 border-red-500 text-red-300";
                      } else {
                        btnClass = "bg-slate-950/40 border-slate-900 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleQuizAnswerSelect(oIdx)}
                        disabled={quizChecked}
                        className={`w-full text-left p-3 rounded-xl text-xs border transition-all cursor-pointer flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {quizChecked && isCorrect && <CheckCircle2 size={12} className="text-green-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="pt-2">
                  {!quizChecked ? (
                    <button
                      onClick={handleQuizCheck}
                      disabled={selectedQuizOpt === null}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[10px] text-slate-400 italic leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                        <strong className="text-indigo-400 font-bold">Explanation:</strong> {ACCESSIBILITY_QUIZ[currentQuizIdx].explanation}
                      </div>

                      <button
                        onClick={handleQuizNext}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>{currentQuizIdx < ACCESSIBILITY_QUIZ.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner border border-indigo-500/20">
                  🏆
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-100">Decoding Assessment Complete!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Outstanding competence! You decoded standard peer communications signs. Active sync awarded you points.
                  </p>
                </div>

                <div className="inline-block bg-slate-950 border border-slate-900 rounded-xl px-4 py-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Reward Score</span>
                  <span className="text-lg font-black text-amber-400">
                    +{quizScoresLog.filter(Boolean).length * 40} XP Granted
                  </span>
                </div>

                <button
                  onClick={resetQuiz}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Retake Comprehension Assessment
                </button>
              </div>
            )}

          </div>

          {/* ACCESSIBILITY COMPANION TIPS */}
          <div className="bg-slate-900/40 border border-slate-900/60 rounded-3xl p-6 text-left space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase">
              <Bookmark size={12} />
              <span>Inclusive Guidelines</span>
            </div>
            
            <h3 className="text-xs font-black text-slate-200">Tips for communicating with Deaf Students</h3>
            <ul className="text-[11px] leading-relaxed text-slate-400 list-decimal list-inside space-y-1">
              <li>Maintain direct eye contact; do not look away mid-signing.</li>
              <li>Always speak directly to the student rather than addressing an interpreter first.</li>
              <li>Ensure clear face lighting, avoid shadow voids obscuring facial expressions or lips.</li>
              <li>Fingerspelling serves as a direct system helper bridge when standard vocabulary signs are unknown.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
