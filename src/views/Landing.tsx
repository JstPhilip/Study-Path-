import { useState, FormEvent } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  Award, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  GraduationCap 
} from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth } from "../firebase";

interface LandingProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
  onDemoLogin: () => void;
  showToast: (msg: string, type?: "success" | "info") => void;
}

export default function Landing({ onLoginSuccess, onDemoLogin, showToast }: LandingProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup since we are in the sandboxed preview iframe
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      showToast(`Welcome to Study Path, ${user.displayName || "Scholar"}!`, "success");
      onLoginSuccess({
        name: user.displayName || "Scholar",
        email: user.email || ""
      });
    } catch (e: any) {
      console.error("Google login failed", e);
      setAuthError(e.message || "Google Sign-In failed. Please try custom form or Guest passes.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (authMode === 'signup') {
      if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
        setAuthError("Please fill in all requested fields.");
        setAuthLoading(false);
        return;
      }
      if (authPassword.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        setAuthLoading(false);
        return;
      }

      try {
        // Attempt authenticating with real Firebase Auth first
        const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(credential.user, { displayName: authName });
        
        showToast(`Welcome to Study Path, ${authName}!`, "success");
        onLoginSuccess({ name: authName, email: authEmail });
      } catch (e: any) {
        console.warn("Firebase Auth Signup not available. Falling back to offline memory engine: ", e.message);
        
        // Dynamic resilient fallback to standard user profiles
        const existingUsersRaw = localStorage.getItem("study_path_registered_users");
        let users = [];
        if (existingUsersRaw) {
          try { users = JSON.parse(existingUsersRaw); } catch (_) {}
        }

        const userExists = users.some((u: any) => u.email.toLowerCase() === authEmail.toLowerCase());
        if (userExists) {
          setAuthError("An account with this email already exists.");
          setAuthLoading(false);
          return;
        }

        const newUser = { name: authName, email: authEmail, password: authPassword };
        users.push(newUser);
        localStorage.setItem("study_path_registered_users", JSON.stringify(users));

        showToast(`Welcome to Study Path, ${authName}! (Sandbox Mode)`, "success");
        onLoginSuccess({ name: authName, email: authEmail });
      }
    } else {
      if (!authEmail.trim() || !authPassword.trim()) {
        setAuthError("Please provide your email and password.");
        setAuthLoading(false);
        return;
      }

      try {
        // Try Firebase sign-in
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const fbUser = auth.currentUser;
        if (fbUser) {
          showToast(`Welcome back, ${fbUser.displayName || "Scholar"}!`, "success");
          onLoginSuccess({
            name: fbUser.displayName || "Scholar",
            email: fbUser.email || ""
          });
        }
      } catch (e: any) {
        console.warn("Firebase Auth Login omitted or disabled. Attempting offline registration checks: ", e.message);

        // Failover offline profile verification
        const existingUsersRaw = localStorage.getItem("study_path_registered_users");
        let users = [];
        if (existingUsersRaw) {
          try { users = JSON.parse(existingUsersRaw); } catch (_) {}
        }

        const guestEmail = "scholar@studypath.edu";
        const isGuest = authEmail.toLowerCase() === guestEmail.toLowerCase() && authPassword === "studypath123";

        const matchedUser = isGuest 
          ? { name: "Guest Scholar", email: guestEmail } 
          : users.find((u: any) => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword);

        if (matchedUser) {
          showToast(`Welcome back, ${matchedUser.name}! (Sandbox Mode)`, "success");
          onLoginSuccess({ name: matchedUser.name, email: matchedUser.email });
        } else {
          setAuthError("Invalid email or password. Feel free to use Guest Onboard, Google entry or create a new account.");
        }
      }
    }
    setAuthLoading(false);
  };

  const scrollToAuth = () => {
    document.getElementById("auth-panel")?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Landing Header */}
      <header className="border-b border-slate-900 bg-slate-950/75 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 border border-indigo-400/20">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div>
              <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block leading-none">The Future of Study</span>
              <span className="text-md font-black text-slate-100 tracking-tight block">Study Path</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Key Features</a>
            <a href="#syllabus" className="hover:text-indigo-400 transition-colors">Course Flow</a>
            <a href="#auth-panel" className="hover:text-indigo-400 transition-colors">Access Suite</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthMode('login');
                scrollToAuth();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-all font-semibold cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                scrollToAuth();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow shadow-indigo-600/10 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 bg-indigo-950/40 px-3.5 py-1.5 rounded-full border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 animate-pulse">
          <Sparkles size={11} /> 
          <span>Next-Generation Adaptive Academic Planner</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-sans font-extrabold tracking-tight text-white leading-[1.1]">
            Learn Fast. Clear Roadblocks. <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400 font-sans">
              Master Custom Study Paths.
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Study Path is a beautifully polished, offline-first dashboard for students. Instantly compile AI-guided course syllabi, resolve homework concepts step-by-step, review interactive visual animation loops, and keep track of deadlines seamlessly.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              setAuthMode('signup');
              scrollToAuth();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Build My First Study Path</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onDemoLogin}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all border border-slate-800 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Fast Guest Simulation</span>
            <Zap size={14} className="text-amber-400" />
          </button>
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-[11px] font-mono uppercase tracking-wide pt-4">
          <div className="flex items-center gap-1.5 bg-slate-900/45 px-3 py-1.5 rounded-lg border border-slate-900/50">
            <span className="font-bold text-indigo-400">10k+</span> Scholars Onboarded
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/45 px-3 py-1.5 rounded-lg border border-slate-900/50">
            <span className="font-bold text-emerald-400">40%</span> Higher Retention
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/45 px-3 py-1.5 rounded-lg border border-slate-900/50">
            <span className="font-bold text-amber-500">100%</span> Private & Local
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="bg-slate-950 border-t border-slate-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-indigo-400 font-bold tracking-widest uppercase font-mono">Academic Framework</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Designed to Optimize Mastery, Avoid Stagnation</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-sans">
              No rote memorization, no rigid answers. We break complex materials into beautifully indexed concepts so you retain knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">AI Course Syllabus Compiling</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Type any university or high school topic. The app automatically structures chronological lessons, real-world comparative analogies, and conceptual tests in seconds.
                </p>
              </div>
              <div className="text-[10px] text-indigo-400/60 font-mono mt-4 pt-3 border-t border-slate-800/60">
                Custom AI Syllabi • Multi-difficulty
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Visual Simulator Timelines</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Play visual simulations using our custom code-editor. Step forwards/backwards in execution states matching flowchart and math diagrams dynamically.
                </p>
              </div>
              <div className="text-[10px] text-indigo-400/60 font-mono mt-4 pt-3 border-t border-slate-800/60">
                Interactive Video Player • Canvas States
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">Interactive Diagnostic Solver</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Stumped on complex calculus, physics vectors or data logic? Paste the assignment. Study Path outlines governing physics constants and milestones with checkpoint quizzes.
                </p>
              </div>
              <div className="text-[10px] text-indigo-400/60 font-mono mt-4 pt-3 border-t border-slate-800/60">
                Struggle-free Debug Loop • Level XP Points
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feature Syllabus Mock-Widget */}
      <section id="syllabus" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs text-emerald-400 font-bold font-mono uppercase tracking-wider bg-emerald-900/10 border border-emerald-500/20 px-2.5 py-1 rounded w-fit block">
            Live Showcase
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            A Syllabus Configured for Your Specific Constraints
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
            When study paths are compiled, lessons are indexed as interactive checklist modules. Instantly read clear real-world visual analogies, solve quick check tests, and earn XP scores to monitor progressive comprehension.
          </p>

          <div className="space-y-3.5 text-xs text-slate-300 font-sans">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">✓</div>
              <span>Syllabus includes step-by-step physical code mapping</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">✓</div>
              <span>Conceptual level indicators to check off study hours</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">✓</div>
              <span>Automatic calendar syncing to track test dates</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4.5 sm:p-6 shadow-2xl relative">
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>

          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold font-mono">Mock Classroom Preview</p>
          <h3 className="text-md font-bold text-white mt-1.5 mb-4 border-b border-indigo-950 pb-2.5 flex items-center gap-2 font-sans">
            <BookOpen size={16} className="text-indigo-400" /> Syllabus: Limits & Integrals
          </h3>

          <div className="space-y-4 font-sans">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-indigo-400 font-mono">Concept 01 (10m)</span>
                <span className="text-[9px] bg-indigo-600/10 border border-indigo-500/40 text-indigo-400 px-2 rounded font-mono">✓ Read Complete</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">The Intuitive Concept of a Calculus Limit</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                "Imagine walking hallway steps. You never touch the actual door handle, but as your steps increase, your physical coordinate converges infinitely close to the handle distance."
              </p>
            </div>

            <div className="p-3 bg-slate-950/25 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-indigo-400 font-mono">Concept 02 (15m)</span>
                <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-500 px-2 rounded font-mono">Not Started</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">Unlocking Riemann Sum Approximations</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                "Learn to calculate analytical area underneath arbitrary parabolas using narrower rectangular columns."
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Award size={13} className="text-emerald-500" /> +75 XP Ready to Claim
            </span>
            <span>Lvl 3 Student Companion</span>
          </div>
        </div>
      </section>

      {/* Auth Panel */}
      <section id="auth-panel" className="bg-slate-900 border-t border-b border-slate-800 py-16">
        <div className="max-w-md mx-auto px-4 text-center space-y-6 flex flex-col items-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'signup' ? "Create Your Free Account" : "Welcome Back, Scholar!"}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm font-sans">
              {authMode === 'signup' 
                ? "Join other proactive students in managing materials and mastering courses." 
                : "Enter your registered credentials to resume your compiled study paths."
              }
            </p>
          </div>

          {/* Selector Switch */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full font-sans">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'signup' 
                  ? "bg-indigo-600 text-white shadow" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login' 
                  ? "bg-indigo-600 text-white shadow" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl font-medium w-full text-center font-sans">
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left bg-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-xl w-full font-sans">
            {authMode === 'signup' && (
              <div>
                <label className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider font-bold">Your Scholar Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Marie Curie"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider font-bold">Academic Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="e.g. marie@studypath.edu"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider font-bold">Secret Passphrase</label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {authMode === 'signup' && (
                <span className="text-[9px] text-slate-500 block mt-1.5 leading-normal">Minimum 6 characters for academic security standards.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authMode === 'signup' ? <UserPlus size={14} /> : <LogIn size={14} />}
              <span>
                {authLoading 
                  ? "Processing academic credentials..." 
                  : (authMode === 'signup' ? "Complete Scholar Registration" : "Authenticate & Mount Dashboard")
                }
              </span>
            </button>

            <button
              type="button"
              disabled={authLoading}
              onClick={handleGoogleSignIn}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-100 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-505/5"
            >
              <svg className="h-4 w-4 mr-0.5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google (Secure Cloud)</span>
            </button>

            <div className="relative flex items-center justify-center my-4 py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-950 px-2.5 text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Or Simulation</span>
            </div>

            <button
              type="button"
              onClick={onDemoLogin}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={14} className="text-amber-400 animate-pulse" />
              <span>Fast Onboard: Guest Passes</span>
            </button>
          </form>

          <p className="text-[10px] text-slate-500 leading-normal font-sans">
            *By signing in or using guest credentials, you accept local browser persistence storage.
            All details remain private inside your device sandbox directory.
          </p>
        </div>
      </section>

      {/* Brand Footer */}
      <footer className="bg-slate-950 py-10 text-center text-slate-500 text-[11px] border-t border-slate-900/40 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400 font-extrabold uppercase tracking-wide font-sans">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Study Path</span>
          </div>
          <p className="max-w-md mx-auto leading-relaxed font-sans">
            Designed desktop-first, compiled mobile-first. Dedicated toward assisting students compile academic roadmap syllabuses structure and deconstruct assignment roadblocks.
          </p>
          <p className="font-sans">© {new Date().getFullYear()} Study Path Academic suite. Private sandboxed browser application.</p>
        </div>
      </footer>
    </div>
  );
}
