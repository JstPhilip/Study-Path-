import { FormEvent, useState, Dispatch, SetStateAction } from "react";
import { 
  Database, 
  RefreshCw, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  FileText, 
  Save, 
  Award, 
  TrendingUp, 
  BookOpen, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  Image
} from "lucide-react";
import { UserProfile, Deadline } from "../types";

interface DashboardProps {
  currentUser: { name: string; email: string } | null;
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  serverDeadlines: Deadline[];
  serverStudyLogs: any[];
  serverLeaderboard: any[];
  scratchNotesInput: string;
  setScratchNotesInput: (val: string) => void;
  notesSaving: boolean;
  leaderboardSubmitting: boolean;
  dbResetting: boolean;
  newDlTitle: string;
  setNewDlTitle: (val: string) => void;
  newDlSubject: string;
  setNewDlSubject: (val: string) => void;
  newDlDate: string;
  setNewDlDate: (val: string) => void;
  submitDeadlineToServer: (title: string, subj: string, date: string) => void;
  toggleDeadlineOnServer: (id: string) => void;
  deleteDeadlineFromServer: (id: string) => void;
  saveScratchNotesToServer: () => void;
  submitLeaderboardScore: (name: string, currentXp: number, currentBadge: string) => void;
  resetFullstackDatabaseInstance: () => void;
  setActiveTab: (tab: 'dashboard' | 'courses' | 'problems') => void;
  showToast: (msg: string, type?: "success" | "info") => void;
}

export default function Dashboard({
  currentUser,
  profile,
  setProfile,
  serverDeadlines,
  serverStudyLogs,
  serverLeaderboard,
  scratchNotesInput,
  setScratchNotesInput,
  notesSaving,
  leaderboardSubmitting,
  dbResetting,
  newDlTitle,
  setNewDlTitle,
  newDlSubject,
  setNewDlSubject,
  newDlDate,
  setNewDlDate,
  submitDeadlineToServer,
  toggleDeadlineOnServer,
  deleteDeadlineFromServer,
  saveScratchNotesToServer,
  submitLeaderboardScore,
  resetFullstackDatabaseInstance,
  setActiveTab,
  showToast
}: DashboardProps) {

  // Custom Avatar Builder states
  const [avatarPrompt, setAvatarPrompt] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>("");

  const presetAvatarPrompts = [
    "Futuristic cyberpunk scholar student with virtual reality glasses, 3D icon",
    "Cute smart owl wearing tiny reading glasses as digital art badge",
    "Sleek glowing minimalist neon brain vector design",
    "Abstract geometric origami style key concept graphic"
  ];

  const handleGenerateCustomAvatar = async (forcedPrompt?: string) => {
    const activePrompt = forcedPrompt || avatarPrompt;
    if (!activePrompt.trim()) {
      showToast("Please type a clear avatar prompt first!", "info");
      return;
    }
    
    setIsGeneratingAvatar(true);
    try {
      const res = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: activePrompt })
      });
      if (!res.ok) throw new Error("Image Generation failed");
      const data = await res.json();
      setPreviewAvatarUrl(data.imageUrl);
      showToast("🎨 Designed custom profile avatar!", "success");
    } catch (err: any) {
      console.error("Custom avatar generation error:", err);
      showToast("Simulated a high-fidelity preset sketch illustration fallback.", "info");
      setPreviewAvatarUrl(`https://picsum.photos/seed/${encodeURIComponent(activePrompt)}/300/300`);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSaveAvatarToProfile = () => {
    if (!previewAvatarUrl) return;
    setProfile(prev => ({
      ...prev,
      avatarUrl: previewAvatarUrl
    }));
    setPreviewAvatarUrl("");
    setAvatarPrompt("");
    showToast("✨ Applied custom avatar to your professional scholar profile header!", "success");
  };

  const handleAddNewDeadlineSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newDlTitle.trim() || !newDlDate) return;
    submitDeadlineToServer(newDlTitle, newDlSubject, newDlDate);
    setNewDlTitle("");
    setNewDlDate("");
  };

  const calculatedLevel = Math.floor(profile.xp / 100) + 1;

  return (
    <div id="view-dashboard" className="space-y-6 animate-fade-in font-sans">
      
      {/* Dynamic Header Box */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-bold font-mono flex items-center gap-1.5">
              <Database size={12} className="text-indigo-400" />
              <span>Full-stack Companion Node</span>
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-2">Welcome Back, {currentUser?.name || "Scholar"}!</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              All your academic deadlines, focused study times, and drafts are fully synced with our Node.js backend. Use presets below to generate dynamic guides.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            {/* Live Server Status light */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 uppercase font-black">Online Sync Ready</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Node REST</span>
            </div>

            <button
              onClick={resetFullstackDatabaseInstance}
              disabled={dbResetting}
              className="text-[10px] bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl font-mono transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              title="Reset database to school presets"
            >
              {dbResetting ? <RefreshCw className="animate-spin" size={10} /> : "🧹 Reset Server"}
            </button>
          </div>
        </div>

        {/* Major Stats Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-indigo-400 block uppercase">Scholar Level</span>
            <span className="text-lg font-bold text-slate-200">Level {calculatedLevel}</span>
            <span className="text-[10px] text-slate-500 block">Class Rank: Scholar Mind</span>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 block uppercase">Active Score</span>
            <span className="text-lg font-bold text-slate-200">{profile.xp} XP</span>
            <span className="text-[10px] text-slate-500 block">Server achievement points</span>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-amber-500 block uppercase">Timer Record</span>
            <span className="text-lg font-bold text-slate-200">{profile.studyMinutes} mins</span>
            <span className="text-[10px] text-slate-500 block">Stopwatch focus hours</span>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-pink-400 block uppercase">Server Milestones</span>
            <span className="text-lg font-bold text-slate-200">{serverDeadlines.length} Live Items</span>
            <span className="text-[10px] text-slate-500 block">Pending checklists</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: Synced Deadline Checklist + Focus stopwatch history */}
        <div className="md:col-span-7 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-400" size={18} />
                <h3 className="text-sm font-semibold text-slate-100">Server–Synced Deadline Checklist</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Express DB</span>
            </div>

            {/* Quick Scheduler Form */}
            <form onSubmit={handleAddNewDeadlineSubmit} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <p className="text-[10px] text-slate-400 font-mono">Quick-schedule homework event:</p>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newDlTitle}
                  onChange={(e) => setNewDlTitle(e.target.value)}
                  placeholder="e.g. Solve recursion exercises..."
                  className="flex-1 bg-slate-900 text-xs px-3 py-1.5 rounded border border-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                  required
                />
                <select 
                  value={newDlSubject}
                  onChange={(e) => setNewDlSubject(e.target.value)}
                  className="bg-slate-900 text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none"
                >
                  <option value="Computer Science">Comp Sci</option>
                  <option value="Calculus">Calculus</option>
                  <option value="Physics">Physics</option>
                  <option value="General Studies">General</option>
                </select>
              </div>

              <div className="flex gap-2 justify-between items-center pt-1.5">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-slate-500">Due Date:</span>
                  <input 
                    type="date"
                    value={newDlDate}
                    onChange={(e) => setNewDlDate(e.target.value)}
                    className="bg-slate-900 text-xs text-slate-300 px-2 py-0.5 rounded border border-slate-800 focus:outline-none flex-1 max-w-[150px]"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} /> Schedule Note
                </button>
              </div>
            </form>

            {/* Deadline list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {serverDeadlines.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No pending homework deadlines. Schedule one above to write to db.json!
                </div>
              ) : (
                serverDeadlines.map((dl) => (
                  <div 
                    key={dl.id}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                      dl.completed 
                        ? "bg-slate-950/20 border-slate-900/60 text-slate-500" 
                        : "bg-slate-950/40 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 mr-2">
                      <button 
                        type="button"
                        onClick={() => toggleDeadlineOnServer(dl.id)}
                        className="mt-0.5 focus:outline-none cursor-pointer"
                        title="Toggle complete"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          dl.completed 
                            ? "bg-emerald-600 border-emerald-500 text-white" 
                            : "border-slate-700 hover:border-slate-500 bg-slate-900"
                        }`}>
                          {dl.completed && <span className="text-[10px]">✓</span>}
                        </div>
                      </button>

                      <div className="min-w-0">
                        <span className="text-[9px] bg-slate-800 border border-slate-700 font-mono text-indigo-400 px-1.5 py-0.5 rounded mr-1.5 inline-block">
                          {dl.subject}
                        </span>
                        <span className={`text-xs font-semibold ${dl.completed ? "line-through text-slate-600" : ""}`}>{dl.title}</span>
                        <p className="text-[10px] text-slate-500 mt-1">Due: {dl.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!dl.completed && (
                        <span className="text-[9px] text-amber-500/80 font-mono font-bold uppercase">Pending</span>
                      )}
                      {dl.completed && (
                        <span className="text-[9px] text-emerald-500/80 font-mono font-bold uppercase">Done</span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteDeadlineFromServer(dl.id)}
                        className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete task permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stopwatch Logs Chronology */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 font-mono">
                  Recent Focus Chrono-Logs
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Synced database</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Completing target study timers increments academic score and yields persistent session documentation entries:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {serverStudyLogs.length === 0 ? (
                <div className="text-center py-4 text-slate-600 text-xs font-mono">
                  No study session entries yet. Start focus timers on courses page!
                </div>
              ) : (
                serverStudyLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200">{log.topic}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold">+{log.xpGained} XP</span>
                    </div>
                    <p className="text-[10px] text-slate-300 italic">"{log.comments}"</p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-800/30 text-[9px] text-slate-500 font-mono">
                      <span>Duration: {log.duration} minutes</span>
                      <span>Date: {log.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right column: Notes Workspace + Scholars Leaderboard Room */}
        <div className="md:col-span-5 space-y-5">
          
          {/* AI Avatar Creator Studio Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 font-mono">
                  AI Avatar Creator Studio
                </h4>
              </div>
              <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900/65 px-2 py-0.5 rounded font-mono">
                Gemini 2.5
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Utilize the official Image Generation model to design a custom scholar identity avatar for your profile!
            </p>

            <div className="space-y-3 font-sans">
              
              {/* Display Current or Previewed Avatar */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/85">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 bg-slate-900 flex items-center justify-center">
                  <img
                    src={previewAvatarUrl || profile.avatarUrl || "https://picsum.photos/seed/defaultscholar/150/150"}
                    alt="Current scholar avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isGeneratingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <RefreshCw className="animate-spin text-indigo-400" size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Active Avatar Status</span>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {previewAvatarUrl ? "✨ Previewing Newly Illustrated" : profile.avatarUrl ? "Custom active scholar portrait" : "Default system portrait"}
                  </span>
                  
                  {previewAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleSaveAvatarToProfile}
                      className="mt-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] px-2.5 py-1 rounded shadow transition-all cursor-pointer flex items-center gap-1"
                    >
                      Apply to Header
                    </button>
                  )}
                </div>
              </div>

              {/* TextInput tool */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                  Illustration Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    placeholder="Describe your design (e.g. 'smart tech raccoon')..."
                    className="flex-1 bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-600 text-slate-200"
                    disabled={isGeneratingAvatar}
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateCustomAvatar()}
                    disabled={isGeneratingAvatar || !avatarPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAvatar ? <RefreshCw className="animate-spin" size={12} /> : <Image size={12} />}
                    <span>{isGeneratingAvatar ? "Drawing..." : "Illustrate"}</span>
                  </button>
                </div>
              </div>

              {/* Preset Quick-Clicks */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">
                  Quick preset templates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetAvatarPrompts.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setAvatarPrompt(preset);
                        handleGenerateCustomAvatar(preset);
                      }}
                      disabled={isGeneratingAvatar}
                      className="text-[10px] bg-slate-950/80 hover:bg-slate-800 text-slate-300 px-2 py-1.5 rounded-lg border border-slate-800/80 transition-colors truncate max-w-full text-left cursor-pointer"
                      title={preset}
                    >
                      {preset.split(" ").slice(0, 3).join(" ")}...
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Research Draft workspace */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-indigo-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 font-mono">Research Draft Pad</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Server Sync</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Draft syllabus steps, math models or pseudocode on this sandbox pad. It persists on the server database.
            </p>

            <textarea
              value={scratchNotesInput}
              onChange={(e) => setScratchNotesInput(e.target.value)}
              placeholder="Brainstorm your academic equations or milestone breakdowns..."
              className="w-full h-44 bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono text-slate-300 resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between gap-2.5 font-sans">
              <span className="text-[9px] text-slate-500 font-mono">
                {scratchNotesInput.length} characters
              </span>
              
              <button
                type="button"
                onClick={saveScratchNotesToServer}
                disabled={notesSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded shadow transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 font-sans"
              >
                {notesSaving ? (
                  <RefreshCw className="animate-spin text-white" size={12} />
                ) : (
                  <Save size={12} />
                )}
                <span>{notesSaving ? "Saving..." : "Save Note Draft"}</span>
              </button>
            </div>
          </div>

          {/* Scholars Leaderboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Award size={16} className="text-amber-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 font-mono">
                  Scholars Leaderboard
                </h4>
              </div>
              <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900/60 px-1.5 py-0.5 rounded font-mono">Global</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Compete against historical student peers in XP. Submit your current score to show on the physical leaderboard!
            </p>

            <div className="space-y-1.5 font-sans">
              {serverLeaderboard.slice(0, 5).map((item, idx) => {
                const isMe = currentUser?.name && item.name.toLowerCase() === currentUser.name.toLowerCase();
                return (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                      isMe 
                        ? "bg-indigo-900/30 border-indigo-500/40 text-slate-200" 
                        : "bg-slate-950/40 border-slate-800/50 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-500 w-4">#{idx + 1}</span>
                      <div className="truncate">
                        <span className={`font-semibold ${isMe ? "text-indigo-200" : "text-slate-300"}`}>
                          {item.name}
                        </span>
                        <span className="block text-[9px] text-slate-500 truncate">{item.badge}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-indigo-400 shrink-0">{item.xp} XP</span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => currentUser?.name && submitLeaderboardScore(currentUser.name, profile.xp, `Elite Level ${calculatedLevel} Mind 🌟`)}
              disabled={leaderboardSubmitting || !currentUser?.name}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer font-sans"
            >
              <Award size={14} className="text-amber-400 shrink-0" />
              <span>{leaderboardSubmitting ? "Syncing..." : "Submit My Highscore to Board"}</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">Quick Academic Links</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              <button
                onClick={() => setActiveTab('courses')}
                className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <BookOpen size={16} className="text-indigo-400 mb-1" />
                <span className="font-semibold block text-slate-200 group-hover:text-indigo-300">Course Maker</span>
                <span className="text-[10px] text-slate-500">Generate learning roadmap</span>
              </button>
              <button
                onClick={() => setActiveTab('problems')}
                className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <HelpCircle size={16} className="text-amber-400 mb-1" />
                <span className="font-semibold block text-slate-200 group-hover:text-amber-300">Solver Desk</span>
                <span className="text-[10px] text-slate-500">Settle homework issues</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
