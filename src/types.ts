export interface Milestone {
  stepId: string;
  title: string;
  readingContent: string;
  durationMinutes: number;
}

export interface VisualizationState {
  type: 'code' | 'flowchart' | 'math' | 'diagram';
  payload: string;
}

export interface TutorialStep {
  time: number; // simulated timing in seconds
  stepTitle: string;
  explanation: string;
  visualizationState: VisualizationState;
}

export interface ProjectWork {
  projectTitle: string;
  projectDescription: string;
  timingOutline: string;
  tutorialSteps: TutorialStep[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  hint: string;
}

export interface CourseModule {
  title: string;
  overview: string;
  durationTotal: string;
  milestones: Milestone[];
  projectWork: ProjectWork;
  reviewQuiz: QuizQuestion[];
}

export interface AnalyticalStep {
  stepNum: number;
  title: string;
  coachAdvice: string;
  criticalFormula: string;
  checkQuestion: string;
  checkOptions: string[];
  correctOptionIndex: number;
  checkExplanation: string;
}

export interface ProblemSolution {
  identifiedConcept: string;
  conceptGuide: string;
  analyticalSteps: AnalyticalStep[];
  finalSummary: string;
}

export interface Deadline {
  id: string;
  title: string;
  subject: string;
  date: string;
  completed: boolean;
}

export interface UserProfile {
  xp: number;
  studyMinutes: number;
  completedMilestones: string[]; // stepId list
  solvedProblemsCount: number;
  deadlines: Deadline[];
  quizScores: Record<string, number>; // quiz question string indexes or module names -> score
  avatarUrl?: string; // custom generated avatar URL
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  courseSubject: string; // associate to "specific courses"
  category: "YouTube" | "PDF" | "Research Paper" | "Textbook" | "Documentation" | "Cheat Sheet" | "Other";
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}
