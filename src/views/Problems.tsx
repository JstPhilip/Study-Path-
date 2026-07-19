import { FormEvent, Dispatch, SetStateAction } from "react";
import { 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle, 
  RefreshCw, 
  MessageSquare, 
  XCircle,
  TrendingUp,
  Info,
  Sliders,
  Award
} from "lucide-react";
import { ProblemSolution, UserProfile } from "../types";

interface ProblemsProps {
  currentUser: { name: string; email: string } | null;
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  problemSubject: string;
  setProblemSubject: (val: string) => void;
  problemText: string;
  setProblemText: (val: string) => void;
  explainingProblem: boolean;
  setExplainingProblem: (val: boolean) => void;
  explainedProblem: ProblemSolution | null;
  setExplainedProblem: (val: ProblemSolution | null) => void;
  PROBLEM_PRESETS: any[];
  currentProblemStep: number;
  setCurrentProblemStep: Dispatch<SetStateAction<number>>;
  stepQuizAnswer: number | null;
  setStepQuizAnswer: (val: number | null) => void;
  quizChecked: boolean;
  setQuizChecked: (val: boolean) => void;
  quizSuccess: boolean | null;
  setQuizSuccess: (val: boolean | null) => void;
  showToast: (msg: string, type?: "success" | "info") => void;
  submitLeaderboardScore: (name: string, xp: number, badge: string) => void;
}

export default function Problems({
  currentUser,
  profile,
  setProfile,
  problemSubject,
  setProblemSubject,
  problemText,
  setProblemText,
  explainingProblem,
  setExplainingProblem,
  explainedProblem,
  setExplainedProblem,
  PROBLEM_PRESETS,
  currentProblemStep,
  setCurrentProblemStep,
  stepQuizAnswer,
  setStepQuizAnswer,
  quizChecked,
  setQuizChecked,
  quizSuccess,
  setQuizSuccess,
  showToast,
  submitLeaderboardScore
}: ProblemsProps) {

  const handleDeconstructProblem = async (e: FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;

    setExplainingProblem(true);
    setExplainedProblem(null);
    setCurrentProblemStep(0);
    setStepQuizAnswer(null);
    setQuizChecked(false);
    setQuizSuccess(null);

    try {
      const res = await fetch("/api/problems/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: problemSubject,
          problemStatement: problemText
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setExplainedProblem(data);
      showToast("🧠 Analytical deconstruction complete!", "success");
    } catch (err) {
      console.error("Failed deconstructing roadblocks:", err);
      showToast("Problem contacting the Gemini instance. Running backup solver.", "info");
    } finally {
      setExplainingProblem(false);
    }
  };

  const handleLoadProblemPreset = (subj: string, text: string) => {
    setProblemSubject(subj);
    setProblemText(text);

    const runProblemSolve = async () => {
      setExplainingProblem(true);
      setExplainedProblem(null);
      setCurrentProblemStep(0);
      setStepQuizAnswer(null);
      setQuizChecked(false);
      setQuizSuccess(null);
      try {
        const res = await fetch("/api/problems/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: subj, problemStatement: text })
        });
        if (res.ok) {
          const data = await res.json();
          setExplainedProblem(data);
          showToast(`Deconstructed preset roadmap on ${subj}!`, "success");
        }
      } catch (err) {
        showToast("Error retrieving roadblock solution.", "info");
      } finally {
        setExplainingProblem(false);
      }
    };
    runProblemSolve();
  };

  // Diagnostic step-by-step review checkers
  const activeStep = explainedProblem?.analyticalSteps?.[currentProblemStep];

  const handleVerifyStepCheckpoint = () => {
    if (!activeStep || stepQuizAnswer === null) return;
    
    setQuizChecked(true);
    const correct = stepQuizAnswer === activeStep.correctOptionIndex;
    setQuizSuccess(correct);

    if (correct) {
      showToast("🎉 Excellent checkpoint clearance! +30 XP.", "success");
      setProfile(p => {
        const nextXp = p.xp + 30;
        const nextCount = p.solvedProblemsCount + 1;
        if (currentUser?.name) {
          submitLeaderboardScore(currentUser.name, nextXp, `Diagnostic level ${Math.floor(nextXp / 100) + 1} Mind 🌟`);
        }
        return {
          ...p,
          xp: nextXp,
          solvedProblemsCount: nextCount
        };
      });
    } else {
      showToast("Incorrect choice. Review advice and critical equations and try again!", "info");
    }
  };

  const handleProgressToNextStep = () => {
    if (!explainedProblem || !explainedProblem.analyticalSteps) return;
    const totalSteps = explainedProblem.analyticalSteps.length;
    
    if (currentProblemStep < totalSteps - 1) {
      setCurrentProblemStep(prev => prev + 1);
      setStepQuizAnswer(null);
      setQuizChecked(false);
      setQuizSuccess(null);
    } else {
      showToast("🏆 All checkpoints answered! Roadblock cleared successfully.", "success");
      setProfile(p => ({ ...p, xp: p.xp + 50 }));
    }
  };

  return (
    <div id="view-problems" className="space-y-6 animate-fade-in font-sans">
      
      {/* Subject and outline editor header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-amber-400" size={18} />
            <span className="text-sm font-semibold text-slate-100 font-sans">Roadblock Concept Solver</span>
          </div>
          <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Concept Desk</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Do not blindly copy answers! Paste the full assignment text or coding roadblock below. Our educator breaks it into governance steps, mathematical models, and intermediate conceptual checkpoints allowing you to solve it logically.
        </p>

        <form onSubmit={handleDeconstructProblem} className="space-y-3 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] text-slate-500 font-mono block uppercase tracking-wide">Course Subject</label>
              <select
                value={problemSubject}
                onChange={(e) => setProblemSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="Computer Science">💻 Computer Science</option>
                <option value="Calculus">📐 Calculus (Math)</option>
                <option value="Physics">🚀 Physics (Forces)</option>
                <option value="Quantum Physics">⚛️ Quantum Physics</option>
                <option value="Machine Learning">🧠 Machine Learning</option>
                <option value="Distributed Systems">🌐 Distributed Systems</option>
                <option value="General Studies">🧠 General Studies</option>
              </select>
            </div>

            <div className="md:col-span-9 space-y-1">
              <label className="text-[10px] text-slate-500 font-mono block uppercase tracking-wide font-bold">Paste Assignment Problem Statement</label>
              <textarea
                required
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Paste the triciest portion of your worksheet or logic error..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 h-16 resize-none font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 font-sans">
            <span className="text-[10px] text-slate-500 font-mono">*All calculations follow rigorous cognitive educational guidelines.</span>
            <button
              type="submit"
              disabled={explainingProblem || !problemText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 font-sans"
            >
              {explainingProblem ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
              <span>{explainingProblem ? "Deconstructing..." : "Deconstruct Roadblock"}</span>
            </button>
          </div>
        </form>

        {/* Popular homework assignments quick buttons */}
        <div className="pt-2.5 border-t border-slate-800/60 font-sans">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Instant solver demos:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {PROBLEM_PRESETS.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/85 hover:border-indigo-500/20 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[9px] bg-indigo-950 text-indigo-300 font-mono px-1.5 py-0.5 rounded font-bold uppercase">{p.subject}</span>
                  <p className="text-slate-400 text-[10px] line-clamp-2 mt-1.5 italic">"{p.statement}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadProblemPreset(p.subject, p.statement)}
                  className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 cursor-pointer text-left font-sans"
                >
                  Solve Step-by-Step <ArrowRight size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {explainingProblem && (
        <div id="problems-fetching" className="p-12 text-center bg-slate-905 border border-slate-800 rounded-xl space-y-4 font-sans">
          <RefreshCw className="animate-spin text-indigo-500 mx-auto" size={32} />
          <div>
            <h4 className="text-sm font-bold text-white">Deconstructing problem coordinates...</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
              Gemini model is scanning underlying governing systems, writing diagnostic quizzes, compiling equations, and writing teacher feedback advice!
            </p>
          </div>
        </div>
      )}

      {explainedProblem && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in font-sans">
          
          {/* Main deconstructed content steps */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Concept header banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded font-mono uppercase font-black">Identified Core Concept</span>
              <h3 className="text-md font-black text-slate-100">{explainedProblem.identifiedConcept}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{explainedProblem.conceptGuide}</p>
            </div>

            {/* Diagnostic Steps timeline */}
            {activeStep && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">
                      {activeStep.stepNum}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                      Phase {activeStep.stepNum}: {activeStep.title}
                    </h3>
                  </div>

                  {/* Steps navigation bar indicators */}
                  <span className="text-[10px] font-mono text-slate-500">
                    Step {currentProblemStep + 1} of {explainedProblem.analyticalSteps.length}
                  </span>
                </div>

                {/* Coach guidance advice banner */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2.5">
                  <p className="text-slate-300 leading-relaxed italic">
                    "Advice: {activeStep.coachAdvice}"
                  </p>
                  
                  {activeStep.criticalFormula && (
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 text-center font-mono text-amber-400/90 text-[11px] select-all">
                      {activeStep.criticalFormula}
                    </div>
                  )}
                </div>

                {/* Sub-Quiz review cards */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/20 space-y-3.5">
                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 uppercase tracking-wider font-extrabold font-mono">
                    <Sliders size={12} />
                    <span>Conceptual Checkpoint</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200">
                    {activeStep.checkQuestion}
                  </h4>

                  <div className="space-y-2">
                    {activeStep.checkOptions.map((opt, oIdx) => {
                      const isChosen = stepQuizAnswer === oIdx;
                      let btnStyle = "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700";
                      
                      if (quizChecked) {
                        if (oIdx === activeStep.correctOptionIndex) {
                          btnStyle = "bg-emerald-600/15 border-emerald-500 text-emerald-300";
                        } else if (isChosen) {
                          btnStyle = "bg-red-600/15 border-red-500 text-red-300";
                        }
                      } else if (isChosen) {
                        btnStyle = "bg-indigo-600/15 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20";
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={quizChecked}
                          onClick={() => setStepQuizAnswer(oIdx)}
                          className={`w-full p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback read panel */}
                  {quizChecked && (
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 text-xs space-y-1">
                      {quizSuccess ? (
                        <span className="text-emerald-400 font-bold uppercase font-mono block">✓ Correct! checkpoint cleared</span>
                      ) : (
                        <span className="text-red-400 font-bold uppercase font-mono block">✗ Incorrect choice</span>
                      )}
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        {activeStep.checkExplanation}
                      </p>
                    </div>
                  )}

                  {/* Step Action buttons */}
                  <div className="flex justify-between items-center pt-2.5">
                    {!quizChecked ? (
                      <button
                        type="button"
                        onClick={handleVerifyStepCheckpoint}
                        disabled={stepQuizAnswer === null}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.8 rounded shadow cursor-pointer disabled:opacity-50"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleProgressToNextStep}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 md:px-5 py-2 rounded shadow transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>
                          {currentProblemStep === explainedProblem.analyticalSteps.length - 1 
                            ? "Complete & Finish Solution" 
                            : "Progress to Next Phase"
                          }
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Motivational Final Solver Conclusion banner */}
            {currentProblemStep === explainedProblem.analyticalSteps.length - 1 && quizChecked && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 leading-relaxed space-y-2.5 animate-bounce font-sans">
                <h4 className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <Award size={16} /> Solution Compiled Successfully!
                </h4>
                <p className="font-sans">
                  {explainedProblem.finalSummary}
                </p>
                <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase pt-1">
                  ★ Earned extra +50 XP total completion study reward!
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Diagnostic steps logs sidebar list */}
          <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 pb-2.5 border-b border-slate-800 font-mono flex items-center gap-1.5">
              <Info size={13} /> Solver Roadmap
            </h4>

            <div className="space-y-2.5 font-sans">
              {explainedProblem.analyticalSteps.map((st, idx) => {
                const isCurrent = currentProblemStep === idx;
                const isPast = currentProblemStep > idx;
                
                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex gap-2.5 transition-all ${
                      isCurrent 
                        ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-200" 
                        : isPast 
                          ? "bg-slate-950/20 border-slate-900 text-slate-500" 
                          : "bg-slate-955 border-slate-850/50 text-slate-600"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                          isCurrent ? "border-indigo-400 text-indigo-300 bg-indigo-950" : "border-slate-700"
                        }`}>
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold block text-[11px]">Phase 0{idx + 1}</span>
                      <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">{st.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
