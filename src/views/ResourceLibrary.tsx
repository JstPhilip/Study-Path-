import { useState, useMemo, FormEvent } from "react";
import { 
  Link as LinkIcon, 
  Plus, 
  Search, 
  Trash2, 
  Heart, 
  ExternalLink, 
  Filter, 
  Layers, 
  Video, 
  FileText, 
  BookOpen, 
  FileCode, 
  Share2, 
  Copy, 
  Sparkles, 
  Bookmark, 
  Tag, 
  Check,
  Globe,
  PlusCircle,
  FolderOpen
} from "lucide-react";
import { ResourceLink, UserProfile } from "../types";

interface ResourceLibraryProps {
  currentUser: { name: string; email: string } | null;
  profile: UserProfile;
  resources: ResourceLink[];
  onAddResource: (title: string, url: string, courseSubject: string, category: ResourceLink["category"], notes?: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
  showToast: (msg: string, type?: "success" | "info") => void;
  COURSE_PRESETS: { subject: string; topic: string; level: string; icon: string }[];
}

export default function ResourceLibrary({
  currentUser,
  profile,
  resources,
  onAddResource,
  onToggleFavorite,
  onDeleteResource,
  showToast,
  COURSE_PRESETS
}: ResourceLibraryProps) {
  // Form input states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [courseSubject, setCourseSubject] = useState("Computer Science");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourse, setCustomCourse] = useState("");
  const [category, setCategory] = useState<ResourceLink["category"]>("Textbook");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique subjects across current resources & course presets
  const uniqueSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    // Add preset subjects
    COURSE_PRESETS.forEach(p => subjectsSet.add(p.subject));
    // Add custom subjects already stored
    resources.forEach(r => subjectsSet.add(r.courseSubject));
    return Array.from(subjectsSet).sort();
  }, [resources, COURSE_PRESETS]);

  const categories: ResourceLink["category"][] = [
    "YouTube", 
    "PDF", 
    "Research Paper", 
    "Textbook", 
    "Documentation", 
    "Cheat Sheet", 
    "Other"
  ];

  // Pick suitable Tailwind style classes depending on Category type
  const getCategoryTheme = (cat: ResourceLink["category"]) => {
    switch(cat) {
      case "YouTube":
        return { bg: "bg-red-950/40 text-red-400 border-red-900/50", icon: Video };
      case "PDF":
        return { bg: "bg-amber-950/40 text-amber-400 border-amber-900/50", icon: FileText };
      case "Research Paper":
        return { bg: "bg-teal-950/40 text-teal-300 border-teal-900/50", icon: FileCode };
      case "Textbook":
        return { bg: "bg-indigo-950/40 text-indigo-300 border-indigo-900/50", icon: BookOpen };
      case "Documentation":
        return { bg: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50", icon: Globe };
      case "Cheat Sheet":
        return { bg: "bg-purple-950/40 text-purple-400 border-purple-900/50", icon: Bookmark };
      default:
        return { bg: "bg-slate-950/40 text-slate-400 border-slate-800", icon: Tag };
    }
  };

  const getSubjectColor = (subj: string) => {
    const colors: Record<string, string> = {
      "Computer Science": "border-indigo-800/40 text-indigo-400 bg-indigo-950/20",
      "Calculus": "border-emerald-800/40 text-emerald-400 bg-emerald-950/20",
      "Physics": "border-pink-800/40 text-pink-400 bg-pink-950/20",
      "Quantum Physics": "border-cyan-800/40 text-cyan-400 bg-cyan-950/20",
      "Machine Learning": "border-purple-800/40 text-purple-400 bg-purple-950/20",
      "Distributed Systems": "border-amber-800/40 text-amber-400 bg-amber-950/20",
    };
    return colors[subj] || "border-slate-800 text-slate-300 bg-slate-950/30";
  };

  // Handle saving new academic resource
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalSubject = isCustomCourse ? customCourse.trim() : courseSubject;
    
    if (!title.trim()) {
      showToast("Please enter a descriptive title for this scientific resource.", "info");
      return;
    }
    if (!url.trim()) {
      showToast("An external URL reference is required.", "info");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showToast("URL must start with http:// or https://", "info");
      return;
    }
    if (!finalSubject) {
      showToast("Please choose or specify a valid Course Subject.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddResource(title.trim(), url.trim(), finalSubject, category, notes.trim());
      // Reset form variables
      setTitle("");
      setUrl("");
      setNotes("");
      setIsCustomCourse(false);
      setCustomCourse("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.notes && res.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject = selectedSubject === "All Subjects" || res.courseSubject === selectedSubject;
      const matchesCategory = selectedCategory === "All Categories" || res.category === selectedCategory;
      const matchesFavorite = !showFavoritesOnly || res.isFavorite;

      return matchesSearch && matchesSubject && matchesCategory && matchesFavorite;
    });
  }, [resources, searchQuery, selectedSubject, selectedCategory, showFavoritesOnly]);

  // Copy link helper
  const handleCopyLink = (urlStr: string, resId: string) => {
    navigator.clipboard.writeText(urlStr);
    setCopiedId(resId);
    showToast("📋 URL link copied to scholar clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BookOpen size={240} className="text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/15 rounded-lg border border-indigo-500/30 text-indigo-400">
              <FolderOpen size={20} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">
              Academic Safe repository
            </span>
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-100">
            Academic Resource Library
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Durable repository to bookmark, categorize, and organize external documentation, YouTube tutorials, PDF research drafts, lecture files, and textbook chapters. Linked perfectly to specific interactive subjects!
          </p>
        </div>
      </div>

      {/* Main Grid Layout: Form on left, Explorer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form component */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <PlusCircle size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Save New Resource
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
              
              {/* Resource Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Paul's Notes on Integrals"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600"
                />
              </div>

              {/* Reference URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono animate-fade">
                  External URL Link *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-600">
                    <LinkIcon size={12} />
                  </span>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tutorial.math.lamar.edu/..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Course Subject Association */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                    Course Subject *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(!isCustomCourse)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    {isCustomCourse ? "Select preset course" : "Create custom subject"}
                  </button>
                </div>

                {isCustomCourse ? (
                  <input
                    type="text"
                    required
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    placeholder="Type name (e.g. Cognitive Psychology)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
                  />
                ) : (
                  <select
                    value={courseSubject}
                    onChange={(e) => setCourseSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-2 text-slate-200 cursor-pointer"
                  >
                    {uniqueSubjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                  Resource Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResourceLink["category"])}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-2 text-slate-200 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description/Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                  Private Scholar Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key takeaways, formula insights, or password reminders for files..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/40 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Plus size={14} />
                )}
                <span>{isSubmitting ? "Syncing to back-end..." : "Save Academic Link"}</span>
              </button>
            </form>
          </div>

          {/* Quick Stats Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Academic Library Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sans">
              <div className="bg-slate-950/65 border border-slate-800/80 p-3 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Total Files</span>
                <span className="text-xl font-bold text-slate-200">{resources.length}</span>
              </div>
              <div className="bg-slate-950/65 border border-slate-800/80 p-3 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Favorites</span>
                <span className="text-xl font-bold text-pink-400 flex items-center justify-center gap-1">
                  <Heart size={14} className="fill-pink-500 text-pink-500" />
                  {resources.filter(r => r.isFavorite).length}
                </span>
              </div>
            </div>
            
            {/* Displaying Categories Breakdown */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono block">Folder Count</span>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {categories.map(cat => {
                  const num = resources.filter(r => r.category === cat).length;
                  if (num === 0) return null;
                  const Theme = getCategoryTheme(cat);
                  const Icon = Theme.icon;
                  return (
                    <div key={cat} className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-slate-500" />
                        <span>{cat}</span>
                      </div>
                      <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                        {num}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search filters and interactive Explorer */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-sans text-xs">
            
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query saved resources, tags, URLs, or custom descriptions..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-slate-300 placeholder-slate-600"
                />
              </div>

              {/* Favorites toggle action button */}
              <button
                type="button"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold ${
                  showFavoritesOnly 
                    ? "bg-pink-950/40 text-pink-400 border-pink-900/60" 
                    : "bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                <Heart size={14} className={showFavoritesOnly ? "fill-pink-500 text-pink-500" : "text-slate-400"} />
                <span>Favorites</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              
              {/* Course Subject Quick Filters dropdown/row */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">
                <Filter size={10} />
                <span>Subject:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedSubject("All Subjects")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    selectedSubject === "All Subjects" 
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/50" 
                      : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80"
                  }`}
                >
                  All
                </button>
                {uniqueSubjects.map(subj => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer truncate max-w-[120px] ${
                      selectedSubject === subj 
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/50" 
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              
              {/* Category Quick Filters */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">
                <Layers size={10} />
                <span>Category:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All Categories")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    selectedCategory === "All Categories" 
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/50" 
                      : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80"
                  }`}
                >
                  All Types
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/50" 
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Academic Resource Cards Explorer */}
          {filteredResources.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No matching resources resolved</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                No saved academic materials match your query of subject, category filters, or search terms. Save a new link above to expand your reference study grid.
              </p>
              {(searchQuery || selectedSubject !== "All Subjects" || selectedCategory !== "All Categories" || showFavoritesOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("All Subjects");
                    setSelectedCategory("All Categories");
                    setShowFavoritesOnly(false);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold mt-2"
                >
                  Reset all query filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map(res => {
                const CatTheme = getCategoryTheme(res.category);
                const CatIcon = CatTheme.icon;
                const SubjectClass = getSubjectColor(res.courseSubject);
                const isCustomSubj = !COURSE_PRESETS.some(p => p.subject === res.courseSubject);

                return (
                  <div 
                    key={res.id} 
                    className="bg-slate-900 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 hover:shadow-lg transition-all group duration-200"
                  >
                    <div className="space-y-2.5">
                      {/* Top labels */}
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        
                        {/* Course subject category badge */}
                        <span className={`px-2 py-0.5 rounded font-mono font-bold tracking-wide uppercase border truncate max-w-[150px] ${SubjectClass}`}>
                          {res.courseSubject}
                        </span>

                        {/* Category type icon and text */}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${CatTheme.bg}`}>
                          <CatIcon size={10} className="shrink-0" />
                          <span className="font-semibold">{res.category}</span>
                        </span>
                      </div>

                      {/* Title & Clickable URL */}
                      <div className="space-y-1">
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-slate-100 hover:text-indigo-400 flex items-start gap-1 justify-between transition-colors leading-snug group/title"
                          title="Open link in another window/tab"
                        >
                          <span className="line-clamp-2">{res.title}</span>
                          <ExternalLink size={12} className="text-slate-500 group-hover/title:text-indigo-400 shrink-0 mt-0.5" />
                        </a>
                        
                        <span className="text-[10px] text-slate-500 font-mono block truncate" title={res.url}>
                          {res.url}
                        </span>
                      </div>

                      {/* Private notes */}
                      {res.notes && (
                        <div className="bg-slate-950/60 p-2 border border-slate-850/70 rounded-lg text-slate-400 text-[11px] leading-relaxed italic">
                          {res.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Toolbar actions */}
                    <div className="border-t border-slate-850 pt-3 mt-3.5 flex items-center justify-between text-slate-500 font-mono text-[9px]">
                      
                      <span>
                        Added {new Date(res.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy URL */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(res.url, res.id)}
                          className="p-1 px-2 hover:bg-slate-950 hover:text-slate-200 rounded border border-transparent hover:border-slate-800 transition-all cursor-pointer flex items-center gap-1"
                          title="Copy reference URL"
                        >
                          {copiedId === res.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(res.id)}
                          className={`p-1 px-2 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                            res.isFavorite 
                              ? "bg-pink-950/35 text-pink-400 border-pink-900/60 hover:bg-pink-900/20" 
                              : "hover:bg-slate-950 hover:text-pink-400 border-transparent hover:border-slate-800"
                          }`}
                          title={res.isFavorite ? "Remove from favorites" : "Save as favorite resource"}
                        >
                          <Heart size={11} className={res.isFavorite ? "fill-pink-500 text-pink-500" : ""} />
                          <span>{res.isFavorite ? "Pinned" : "Pin"}</span>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${res.title}"?`)) {
                              onDeleteResource(res.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-950/45 text-slate-600 hover:text-red-400 rounded border border-transparent hover:border-red-900/50 transition-all cursor-pointer"
                          title="Delete link"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-Help Tip */}
          <div className="bg-slate-900/50 border border-indigo-950/40 rounded-xl p-4 flex gap-3 text-sans text-[11px] leading-relaxed text-slate-400 max-w-full">
            <span className="text-indigo-400 shrink-0 mt-0.5">
              <Sparkles size={14} className="animate-bounce" />
            </span>
            <div className="space-y-1">
              <span className="font-bold text-slate-200">Pro Tip for Scholars:</span>
              <p>
                Link documents directly while taking interactive study courses. When studying complex topics (like Paxos, backpropagation, or mathematical integrals), bookmarking direct reference articles helps you bypass hurdles during problem-solving sessions!
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
