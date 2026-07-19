import { useState, useRef, FormEvent, Dispatch, SetStateAction } from "react";
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Sliders, 
  Clock, 
  Award, 
  CheckCircle, 
  ChevronRight, 
  MessageSquare, 
  Play, 
  RefreshCw,
  XCircle,
  Lightbulb,
  Check
} from "lucide-react";
import InteractiveVideoPlayer from "../components/InteractiveVideoPlayer";
import { CourseModule, Milestone, UserProfile } from "../types";

interface CoursesProps {
  currentUser: { name: string; email: string } | null;
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  targetSubject: string;
  setTargetSubject: (val: string) => void;
  targetTopic: string;
  setTargetTopic: (val: string) => void;
  targetLevel: string;
  setTargetLevel: (val: string) => void;
  generatingCourse: boolean;
  setGeneratingCourse: (val: boolean) => void;
  generatedCourse: CourseModule | null;
  setGeneratedCourse: (val: CourseModule | null) => void;
  COURSE_PRESETS: any[];
  timerIsRunning: boolean;
  setTimerIsRunning: (val: boolean) => void;
  timerSecondsLeft: number;
  setTimerSecondsLeft: Dispatch<SetStateAction<number>>;
  timerInitial: number;
  setTimerInitial: (val: number) => void;
  courseQuizAnswers: Record<number, number>;
  setCourseQuizAnswers: Dispatch<SetStateAction<Record<number, number>>>;
  courseQuizChecked: boolean;
  setCourseQuizChecked: (val: boolean) => void;
  courseQuizScore: number | null;
  setCourseQuizScore: Dispatch<SetStateAction<number | null>>;
  showToast: (msg: string, type?: "success" | "info") => void;
  submitLeaderboardScore: (name: string, xp: number, badge: string) => void;
}

export default function Courses({
  currentUser,
  profile,
  setProfile,
  targetSubject,
  setTargetSubject,
  targetTopic,
  setTargetTopic,
  targetLevel,
  setTargetLevel,
  generatingCourse,
  setGeneratingCourse,
  generatedCourse,
  setGeneratedCourse,
  COURSE_PRESETS,
  timerIsRunning,
  setTimerIsRunning,
  timerSecondsLeft,
  setTimerSecondsLeft,
  timerInitial,
  setTimerInitial,
  courseQuizAnswers,
  setCourseQuizAnswers,
  courseQuizChecked,
  setCourseQuizChecked,
  courseQuizScore,
  setCourseQuizScore,
  showToast,
  submitLeaderboardScore
}: CoursesProps) {

  // Generate course fetch
  const handleCompileSyllabus = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetTopic.trim()) return;

    setGeneratingCourse(true);
    setGeneratedCourse(null);
    setCourseQuizAnswers({});
    setCourseQuizChecked(false);
    setCourseQuizScore(null);

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: targetSubject,
          topic: targetTopic,
          level: targetLevel
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setGeneratedCourse(data);
      showToast("🎓 Dynamic curriculum compiled successfully!", "success");
    } catch (err) {
      console.error("Failed compiling course syllabus:", err);
      showToast("Problem communicating with the Gemini instance. Running backup compiler.", "info");
    } finally {
      setGeneratingCourse(false);
    }
  };

  const handleQuickLoadPreset = (subj: string, top: string, lvl: string) => {
    setTargetSubject(subj);
    setTargetTopic(top);
    setTargetLevel(lvl);
    
    // Simulate compilation
    const runFastCompile = async () => {
      setGeneratingCourse(true);
      setGeneratedCourse(null);
      setCourseQuizAnswers({});
      setCourseQuizChecked(false);
      setCourseQuizScore(null);
      try {
        const res = await fetch("/api/courses/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: subj, topic: top, level: lvl })
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCourse(data);
          showToast(`Loaded pre-tested course syllabus on ${top}!`, "success");
        }
      } catch (err) {
        showToast("Error loading course parameters.", "info");
      } finally {
        setGeneratingCourse(false);
      }
    };
    runFastCompile();
  };

  // Milestone completion checkoff
  const handleToggleMilestoneCheckoff = (stepId: string) => {
    const alreadyDone = profile.completedMilestones.includes(stepId);
    
    setProfile(p => {
      let updatedMilestones: string[];
      let addedXP = 0;
      
      if (alreadyDone) {
        updatedMilestones = p.completedMilestones.filter(id => id !== stepId);
        addedXP = -35;
      } else {
        updatedMilestones = [...p.completedMilestones, stepId];
        addedXP = 45;
        showToast("✓ Checkpoint cleared! +45 XP earned.", "success");
      }
      
      const nextXp = Math.max(0, p.xp + addedXP);
      if (currentUser?.name && !alreadyDone) {
        submitLeaderboardScore(currentUser.name, nextXp, `Elite Level ${Math.floor(nextXp / 100) + 1} Mind 🌟`);
      }
      
      return {
        ...p,
        completedMilestones: updatedMilestones,
        xp: nextXp
      };
    });
  };

  // Stopwatch controls
  const handleSetTimerPreset = (minutes: number) => {
    setTimerIsRunning(false);
    setTimerSecondsLeft(minutes * 60);
    setTimerInitial(minutes * 60);
    showToast(`Timer reconfigured to ${minutes}-minute segment!`, "info");
  };

  const formatTimerDigits = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Course review quiz score
  const handleQuizOptionClick = (questionIdx: number, optionIdx: number) => {
    if (courseQuizChecked) return;
    setCourseQuizAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const checkCourseReviewAnswers = () => {
    if (!generatedCourse || !generatedCourse.reviewQuiz) return;
    const questions = generatedCourse.reviewQuiz;
    let correctCount = 0;

    questions.forEach((q, idx) => {
      if (courseQuizAnswers[idx] === q.correctIdx) {
        correctCount++;
      }
    });

    setCourseQuizScore(correctCount);
    setCourseQuizChecked(true);

    const bonusXP = correctCount * 30;
    setProfile(p => {
      const nextXp = p.xp + bonusXP;
      if (currentUser?.name) {
        submitLeaderboardScore(currentUser.name, nextXp, `Quiz Level ${Math.floor(nextXp / 100) + 1} Master 🎓`);
      }
      return {
        ...p,
        xp: nextXp
      };
    });

    showToast(`Quiz completed! You scored ${correctCount}/${questions.length} and earned +${bonusXP} XP!`, "success");
  };

  return (
    <div id="view-courses" className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header & Quick presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={18} />
            <span className="text-sm font-semibold text-slate-100">AI Core Academic Planner</span>
          </div>
          <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold">Instant Syllabi</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Build structured coursework out of arbitrary study topics. Our helper models construct chronological reading segments, video outlines, and test modules to facilitate deep comprehension.
        </p>

        {/* Input Form with presets */}
        <form onSubmit={handleCompileSyllabus} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1.5 font-sans">
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] text-slate-500 font-mono block uppercase tracking-wide">Academic Subject</label>
            <select
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="Computer Science">💻 Computer Science</option>
              <option value="Calculus">📐 Calculus (Math)</option>
              <option value="Physics">🚀 Physics (Forces)</option>
              <option value="Quantum Physics">⚛️ Quantum Physics</option>
              <option value="Machine Learning">🧠 Machine Learning</option>
              <option value="Distributed Systems">🌐 Distributed Systems</option>
              <option value="General Engineering">⚙️ General Engineering</option>
            </select>
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-[10px] text-slate-500 font-mono block uppercase tracking-wide font-bold">Research Topic & Milestone Target</label>
            <input
              type="text"
              required
              value={targetTopic}
              onChange={(e) => setTargetTopic(e.target.value)}
              placeholder="e.g. Recursion & Binary Trees, Riemann Integrals..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-sans"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] text-slate-500 font-mono block uppercase tracking-wide">Target Difficulty</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner level</option>
              <option value="Intermediate">Intermediate level</option>
              <option value="Advanced">Advanced master</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={generatingCourse}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow disabled:opacity-50"
            >
              {generatingCourse ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
              <span>{generatingCourse ? "Compiling..." : "Compile Syllabus"}</span>
            </button>
          </div>
        </form>

        {/* Quick Launch Preset Shortcuts */}
        <div className="pt-2 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Fast Launch Course Presets:</p>
          <div className="flex flex-wrap gap-2 font-sans">
            {COURSE_PRESETS.map((cr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickLoadPreset(cr.subject, cr.topic, cr.level)}
                className="text-slate-400 bg-slate-950 hover:bg-slate-850 hover:text-slate-200 border border-slate-800 text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{cr.icon}</span>
                <span className="font-semibold text-slate-300">{cr.topic}</span>
                <span className="text-[9px] text-slate-600 font-mono">({cr.level})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {generatingCourse && (
        <div id="course-fetching" className="p-12 text-center bg-slate-905 border border-slate-800 rounded-xl space-y-4">
          <RefreshCw className="animate-spin text-indigo-500 mx-auto" size={32} />
          <div>
            <h4 className="text-sm font-bold text-white">Structuring Course & Project timelines...</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
              Gemini model is organizing milestones, writing instructional analogies, writing interactive flowchart coordinates and loading visual playback segments!
            </p>
          </div>
        </div>
      )}

      {/* Main Course Content */}
      {generatedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Details, Milestones, Interactive Video Player */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Overview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded font-mono uppercase font-bold mr-2">Target Study Path</span>
                  <span className="text-xs text-slate-500 font-mono">Time allocated: {generatedCourse.durationTotal || "1.5h"}</span>
                </div>
                <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Active Course
                </span>
              </div>

              <h2 className="text-lg font-black text-white">{generatedCourse.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{generatedCourse.overview}</p>
            </div>

            {/* Curriculum Checkpoints Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Syllabus Curriculum Milestones</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Clearing checkpoints awards immediate student XP to your profile container.</p>
              </div>

              <div className="space-y-3.5 font-sans">
                {generatedCourse.milestones?.map((ms, idx) => {
                  const isChecked = profile.completedMilestones.includes(ms.stepId);
                  return (
                    <div 
                      key={ms.stepId} 
                      className={`p-4 rounded-xl border transition-all ${
                        isChecked 
                          ? "bg-slate-950/20 border-slate-900 text-slate-500" 
                          : "bg-slate-950/40 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleMilestoneCheckoff(ms.stepId)}
                          className="mt-0.5 focus:outline-none cursor-pointer"
                          title="Toggle complete"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isChecked 
                              ? "bg-indigo-600 border-indigo-500 text-white" 
                              : "border-slate-700 hover:border-slate-500 bg-slate-900"
                          }`}>
                            {isChecked && <span className="text-[10px]">✓</span>}
                          </div>
                        </button>

                        <div className="space-y-1.5 flex-1 select-none">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider font-bold">Milestone 0{idx + 1} ({ms.durationMinutes}m)</span>
                            {isChecked && (
                              <span className="text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-2 rounded uppercase font-bold font-mono py-0.5">Cleared</span>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold ${isChecked ? "line-through text-slate-600" : "text-slate-100"}`}>
                            {ms.title}
                          </h4>
                          <p className={`text-[11px] leading-relaxed ${isChecked ? "text-slate-600" : "text-slate-400"}`}>
                            {ms.readingContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Visual Playback Simulator Block */}
            {generatedCourse.projectWork && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Visual demonstration outlines</h3>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This schematic timeline simulates executing project codes. Let it play to observe variable values, active nodes, or diagram matrices changes.
                  </p>
                </div>
                
                <InteractiveVideoPlayer 
                  projectWork={generatedCourse.projectWork}
                  onStepComplete={(idx) => {
                    console.log("Crossed playback milestone idx:", idx);
                  }}
                  onProjectDone={() => {
                    showToast("🎬 Simulation playback complete! XP updated.", "success");
                    setProfile(p => ({ ...p, xp: p.xp + 40 }));
                  }}
                />
              </div>
            )}

            {/* AI Review Quiz Card */}
            {generatedCourse.reviewQuiz && generatedCourse.reviewQuiz.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Academic Verification Quiz</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Test your comprehension on milestones materials.</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-semibold">Bonus: +30 XP per Correct Answer</span>
                </div>

                <div className="space-y-6 font-sans">
                  {generatedCourse.reviewQuiz.map((q, qIdx) => {
                    const selectedIdx = courseQuizAnswers[qIdx] ?? null;
                    return (
                      <div key={qIdx} className="space-y-2.5">
                        <h4 className="text-xs font-bold text-slate-200">
                          {qIdx + 1}. {q.question}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((option, oIdx) => {
                            const isChosen = selectedIdx === oIdx;
                            const isCorrect = q.correctIdx === oIdx;
                            let btnStyle = "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400";
                            
                            if (courseQuizChecked) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-600/10 border-emerald-500 text-emerald-300";
                              } else if (isChosen && !isCorrect) {
                                btnStyle = "bg-red-600/10 border-red-500 text-red-300";
                              }
                            } else if (isChosen) {
                              btnStyle = "bg-indigo-600/15 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/25";
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleQuizOptionClick(qIdx, oIdx)}
                                className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${btnStyle}`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {courseQuizChecked && selectedIdx !== null && (
                          <div className="text-[10px] p-2 rounded-lg bg-slate-950 border border-slate-900 space-y-1">
                            {selectedIdx === q.correctIdx ? (
                              <span className="text-emerald-400 font-semibold uppercase font-mono block">✓ Correct!</span>
                            ) : (
                              <span className="text-red-400 font-semibold uppercase font-mono block">✗ Incorrect choice</span>
                            )}
                            <p className="text-slate-400 italic">"Hint explanation: {q.hint}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  {courseQuizChecked ? (
                    <div className="text-xs font-mono">
                      Your Score: <span className="text-indigo-400 font-extrabold">{courseQuizScore}/{generatedCourse.reviewQuiz.length}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">*All options must be selected before compiling scores.</span>
                  )}

                  <button
                    type="button"
                    onClick={checkCourseReviewAnswers}
                    disabled={courseQuizChecked || Object.keys(courseQuizAnswers).length < generatedCourse.reviewQuiz.length}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Submit Answers
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Focus stopwatch container */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Countdown study stopwatch widget card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 font-mono">Focus Chronometer</h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 font-mono animate-pulse">Pomodoro</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                Ready to commit focus hours? Run this stopwatch while analyzing milestones. Completing a segment automatically gains XP and writes synced chronological logs!
              </p>

              {/* Ticking Digital Digits */}
              <div className="py-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-4xl font-mono text-slate-100 font-bold block leading-none tracking-tight">
                  {formatTimerDigits(timerSecondsLeft)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono uppercase">
                  {timerIsRunning ? "Active countdown" : "Timer Paused"}
                </span>
              </div>

              {/* Configuration presets quick buttons */}
              <div className="grid grid-cols-3 gap-1.5 font-sans">
                {([5, 15, 25] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetTimerPreset(mins)}
                    className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 tracking-tight transition-colors cursor-pointer text-center"
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Master timer controllers */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimerIsRunning(!timerIsRunning)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timerIsRunning 
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow shadow-amber-600/10" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-600/10"
                  }`}
                >
                  {timerIsRunning ? "Pause timer" : "Start Focus"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setTimerIsRunning(false);
                    setTimerSecondsLeft(timerInitial);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg px-3 transition-colors cursor-pointer text-xs font-mono font-bold"
                  title="Reset countdown"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Quick reminders card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="text-indigo-400" size={14} />
                <span className="text-xs font-bold text-slate-200">Study Tips & Tricks</span>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-400 list-disc list-inside font-sans">
                <li>Read the descriptive paragraphs to solve corresponding review quizzes correctly.</li>
                <li>Complete focus stopwatch segments fully to write study history data to the database.</li>
                <li>Click visual roadmap coordinates on sidebar to skip the player to target segments directly.</li>
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
