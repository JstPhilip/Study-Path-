import { useState, useEffect, useRef, ChangeEvent } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Monitor, 
  FileCode, 
  FolderOpen, 
  Volume2, 
  CheckCircle,
  Clock,
  ExternalLink,
  Info
} from "lucide-react";
import { ProjectWork, TutorialStep } from "../types";

interface InteractiveVideoPlayerProps {
  projectWork: ProjectWork;
  onStepComplete?: (stepIdx: number) => void;
  onProjectDone?: () => void;
}

export default function InteractiveVideoPlayer({ 
  projectWork, 
  onStepComplete, 
  onProjectDone 
}: InteractiveVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 80 seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 1.5x, 2x
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [narratorEnabled, setNarratorEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = projectWork.tutorialSteps || [];
  const maxTime = 80;

  // Find active step based on current simulation time
  const getActiveStepIndex = (): number => {
    let activeIdx = 0;
    for (let i = 0; i < steps.length; i++) {
      if (currentTime >= steps[i].time) {
        activeIdx = i;
      }
    }
    return activeIdx;
  };

  const activeStepIdx = getActiveStepIndex();
  const activeStep: TutorialStep | undefined = steps[activeStepIdx];

  // Handle timer ticker for "video" simulations
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= maxTime) {
            setIsPlaying(false);
            if (onProjectDone) onProjectDone();
            return maxTime;
          }
          return next;
        });
      }, 250); // Updates every 250ms for realistic pacing
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, onProjectDone]);

  // Track step completion triggers as time crosses step thresholds
  useEffect(() => {
    if (activeStepIdx !== -1 && !completedSteps.includes(activeStepIdx)) {
      setCompletedSteps((prev) => {
        const updated = [...prev, activeStepIdx];
        if (onStepComplete) onStepComplete(activeStepIdx);
        return updated;
      });
    }
  }, [activeStepIdx, completedSteps, onStepComplete]);

  const handleTogglePlay = () => {
    if (currentTime >= maxTime) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleManualStepJump = (index: number) => {
    const targetStep = steps[index];
    if (targetStep) {
      setCurrentTime(targetStep.time);
      setIsPlaying(true);
    }
  };

  // Helper to format simulated timer display
  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Render the dynamic visual simulation panel inside our video player view
  const renderSimulationCanvas = () => {
    if (!activeStep) {
      return (
        <div id="simulation-empty" className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          <p className="font-sans text-sm">Please press play or select a project milestone to start.</p>
        </div>
      );
    }

    const { type, payload } = activeStep.visualizationState;

    switch (type) {
      case "code":
        return (
          <div id="simulation-code" className="flex flex-col h-72 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden font-mono shadow-inner text-xs">
            {/* Mock IDE Headers */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span className="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1">
                  <FileCode size={10} className="text-emerald-400" />
                  main.ts
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Node JS IDE • Ready</span>
            </div>
            
            {/* Terminal contents with lines */}
            <div className="flex-1 p-4 overflow-y-auto text-emerald-400 leading-relaxed text-[11px] select-none scrollbar-thin">
              {payload.split("\n").map((line, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-slate-600 text-right w-4 select-none">{idx + 1}</span>
                  <span className="text-emerald-300 whitespace-pre">
                    {/* Simulated live-typing blinking effect for latest content */}
                    {line}
                    {idx === payload.split("\n").length - 1 && isPlaying && (
                      <span className="animate-pulse bg-emerald-400 text-emerald-400 px-0.5">|</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Console output bar */}
            <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-sans text-slate-300">Console: Simulating compiling outputs... Done with 0 errors.</span>
            </div>
          </div>
        );

      case "flowchart":
        return (
          <div id="simulation-flowchart" className="flex flex-col items-center justify-center h-72 bg-gradient-to-b from-slate-950 to-slate-900 rounded-lg border border-slate-800 p-4 shadow-inner">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-mono font-bold flex items-center gap-1.5">
              <span>Logical Roadmap</span>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping"></span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full max-w-md">
              {payload.split("->").map((node, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`p-2.5 px-3.5 rounded-md border text-xs font-medium font-sans transition-all duration-300 ${
                    idx === Math.floor(currentTime / 20) % (payload.split("->").length)
                    ? "bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-500/35 scale-105 shadow-md shadow-sky-500/10"
                    : "bg-slate-900/90 border-slate-800 text-slate-400"
                  }`}>
                    {node.trim()}
                  </div>
                  {idx < payload.split("->").length - 1 && (
                    <span className="text-sky-500/60 font-mono text-xs font-bold animate-pulse">➡</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "math":
        return (
          <div id="simulation-math" className="flex flex-col justify-center h-72 bg-slate-950 rounded-lg border border-slate-800 p-6 font-mono text-slate-300 shadow-inner overflow-hidden">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Info size={12} /> Analytical Calculations Sheet
              </span>
              <span className="text-[10px] text-slate-500">Formula Checkpoints</span>
            </div>
            
            <div className="space-y-3 text-xs md:text-sm">
              {payload.split("\\n").map((formula, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-md hover:border-amber-500/30 transition-colors">
                  <p className="text-amber-300 text-center font-bold">{formula}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "diagram":
      default:
        return (
          <div id="simulation-diagram" className="flex flex-col items-center justify-center h-72 bg-slate-950 rounded-lg border border-slate-800 p-4 text-center font-sans">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-mono">
              System Connections Link Diagram
            </div>
            
            <div className="flex items-center justify-around w-full max-w-sm">
              {payload.split("===>").map((element, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`p-3 rounded-lg border font-mono text-center text-xs shadow-md transition-all duration-300 ${
                    idx === 1 
                      ? "bg-indigo-600/20 border-indigo-400 text-indigo-200 ring-2 ring-indigo-500/40" 
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}>
                    {element.trim()}
                  </div>
                  {idx < payload.split("===>").length - 1 && (
                    <div className="relative flex items-center justify-center">
                      <span className="text-indigo-400 font-bold animate-pulse text-lg">➔</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-500 max-w-xs">Interactive arrows pulse at runtime to visualize live data flows through intermediate layers.</p>
          </div>
        );
    }
  };

  return (
    <div id="project-video-player" className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col lg:flex-row">
      
      {/* 1. Main Video Container View */}
      <div className="flex-1 p-4 md:p-6 flex flex-col justify-between bg-slate-950/40">
        
        {/* Video Header info */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse inline-flex items-center gap-1 mr-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> Live Playback
            </span>
            <span className="text-xs text-slate-400 font-medium">Demonstration Project</span>
            <h3 className="text-sm font-semibold text-slate-100 mt-1">{projectWork.projectTitle}</h3>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
            <Clock size={12} className="text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Target Timing: {projectWork.timingOutline}</span>
          </div>
        </div>

        {/* Dynamic Display Screens */}
        <div className="my-2 select-none relative group">
          {renderSimulationCanvas()}
          
          {/* Active Overlay notification prompt inside Mock Player */}
          {!isPlaying && currentTime === 0 && (
            <div className="absolute inset-0 bg-slate-950/80 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm gap-2 transition-all p-4 text-center">
              <button 
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Play size={28} className="fill-current ml-1" />
              </button>
              <p className="text-xs text-slate-200 font-medium mt-2">Click to Play Project Video Simulation</p>
              <p className="text-[11px] text-slate-400 max-w-xs">{projectWork.projectDescription}</p>
            </div>
          )}
        </div>

        {/* Video Bar Seeker & Controller controls */}
        <div className="mt-4 space-y-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg">
          {/* Scrubber timeline */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-indigo-400 font-mono">{formatTime(currentTime)}</span>
            <input 
              type="range"
              min={0}
              max={maxTime}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 font-mono">{formatTime(maxTime)}</span>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              </button>
              
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Restart"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => {
                  const nextIdx = Math.min(steps.length - 1, activeStepIdx + 1);
                  setCurrentTime(steps[nextIdx].time);
                }}
                disabled={activeStepIdx === steps.length - 1}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition-colors"
                title="Next Segment"
              >
                <SkipForward size={14} />
              </button>
            </div>

            {/* Subtitles Narrator readback simulator */}
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setNarratorEnabled(!narratorEnabled)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 border transition-all ${
                  narratorEnabled 
                    ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-slate-800/50 border-slate-800 text-slate-500"
                }`}
              >
                <Volume2 size={12} />
                <span className="text-[10px] font-mono">Narrator Guide</span>
              </button>

              <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                {([1, 1.5, 2] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      playbackSpeed === spd 
                        ? "bg-indigo-600 text-white" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Video Transcript and Step Navigator Sidebar */}
      <div className="w-full lg:w-72 bg-slate-900/60 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 font-mono flex items-center gap-1.5">
            <Monitor size={12} /> Step Roadblocks
          </h4>
          
          <div className="space-y-2.5">
            {steps.map((st, idx) => {
              const isActive = activeStepIdx === idx;
              const isCompleted = completedSteps.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleManualStepJump(idx)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex gap-2.5 ${
                    isActive 
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-200 font-medium scale-[1.01] shadow-sm shadow-indigo-500/5" 
                      : isCompleted 
                        ? "bg-slate-900/90 border-slate-800 text-slate-300" 
                        : "bg-slate-900/40 border-slate-900/80 text-slate-500"
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle size={14} className="text-emerald-500 shrink-0 fill-emerald-500/10" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] shrink-0">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isActive ? "text-slate-200" : ""}`}>{st.stepTitle}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Timestamp: {formatTime(st.time)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current subtitles transcript stream box on sidebar output */}
        {narratorEnabled && activeStep && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-pulse"></span>
              Audio Transcript
            </p>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-md text-[11px] leading-relaxed text-slate-300 italic">
              "{activeStep.explanation}"
            </div>
            <p className="mt-1 text-[9px] text-indigo-400 text-right">★ Read step details above before editing problems.</p>
          </div>
        )}
      </div>

    </div>
  );
}
