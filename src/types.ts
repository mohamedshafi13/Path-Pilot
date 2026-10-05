export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  interest: string;
  targetRole?: string;
  joinedDate: string;
  bio?: string;
}

export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Education'
  | 'Projects'
  | 'Entertainment'
  | 'Shopping'
  | 'Other';

export interface ExpenseItem {
  id: string;
  amount: number;
  reason: string;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  isAcademic?: boolean;
}

export type BudgetAlertLevel = 'Normal' | 'Warning' | 'Critical';

export interface SpendingPattern {
  category: ExpenseCategory;
  total: number;
  percentageOfSpent: number;
  count: number;
  observation?: string;
}

export interface SpendingAnalysisResponse {
  budgetStatus: BudgetAlertLevel;
  budgetAlertMessage: string;
  totalSpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  percentageUsed: number;
  academicInvestmentTotal: number;
  academicInvestmentPercentage: number;
  lifestyleTotal: number;
  spendingPatterns: SpendingPattern[];
  aiInsights: string[];
  respectfulWarnings: string[];
  actionableSuggestions: string[];
  academicCareerNote: string;
}

export interface ScoreBreakdown {
  technicalComplexity: number;
  industryRelevance: number;
  codeArchitectureQuality: number;
  innovationAndImpact: number;
}

export interface ActionableStep {
  step: number;
  task: string;
  detail: string;
}

export interface ProjectEvaluation {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  evaluationSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  actionableRoadmap: ActionableStep[];
  recommendedSkillsToAcquire: string[];
  suggestedNextProject?: {
    title: string;
    concept: string;
  };
}

export interface ProjectSubmission {
  id: string;
  title: string;
  domain: string;
  department: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  architectureDetails?: string;
  challengesFaced?: string;
  submittedAt: string;
  evaluation?: ProjectEvaluation;
}

export interface ProjectIdea {
  id: string;
  title: string;
  domain: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  estimatedWeeks: number;
  description: string;
  technologies: string[];
  learningOutcomes: string[];
  industryRelevance: string;
  milestones: string[];
}

export interface ResourceItem {
  id: string;
  category: string;
  title: string;
  type: 'Documentation' | 'Textbook / Reference' | 'Open Source Codebase' | 'Career Guide & Milestone' | string;
  level: 'Essential' | 'Intermediate' | 'Advanced' | 'Career Track';
  description: string;
  url: string;
  estimatedHours: number;
  completed?: boolean;
}

export interface SkillMetric {
  name: string;
  level: number; // 0 - 100
  category: 'System Design' | 'Architecture' | 'Algorithms' | 'Domain Tooling' | 'Security & Testing';
  growth: number; // positive delta %
}

export interface HistoricalScore {
  date: string;
  projectTitle: string;
  score: number;
  technicalComplexity: number;
  industryRelevance: number;
  codeArchitectureQuality: number;
  innovationAndImpact: number;
}

export interface RoadmapMilestone {
  id: string;
  phase: string;
  title: string;
  timeframe: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  skills: string[];
  tasks: { id: string; label: string; done: boolean }[];
}

// ==========================================
// Phase 3: AI Learning & Skill Development Types
// ==========================================

export type SkillType = 'Technical' | 'Soft';
export type SkillStatus = 'Completed' | 'Learning' | 'Planned';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DetailedSkill {
  id: string;
  name: string;
  type: SkillType;
  category: 
    | 'Programming'
    | 'DSA'
    | 'Web Development'
    | 'AI/ML'
    | 'Database'
    | 'Cloud'
    | 'Cybersecurity'
    | 'System Design'
    | 'Communication'
    | 'Teamwork'
    | 'Leadership'
    | 'Problem Solving'
    | 'Time Management';
  level: SkillLevel;
  status: SkillStatus;
  progress: number; // 0 - 100
  hoursSpent: number;
  lastPracticed: string; // YYYY-MM-DD
  history?: { date: string; progress: number; note?: string }[];
}

export interface LearningGoal {
  id: string;
  title: string;
  timeframe: 'Daily' | 'Weekly' | 'Monthly';
  skillCategory: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface LearningRoadmapTopic {
  id: string;
  title: string;
  completed: boolean;
  estimatedHours: number;
  resourceLink?: string;
}

export interface LearningRoadmapMilestone {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  progress: number; // 0 - 100
  topics: LearningRoadmapTopic[];
  resources: {
    title: string;
    type: 'Course' | 'Documentation' | 'Tutorial' | 'Practice Platform' | 'YouTube';
    url: string;
    platform: string;
    isFree?: boolean;
  }[];
}

export interface LearningActivitySession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  topicsCovered: string;
  skillName: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  unlockedAt?: string;
}

export interface LearningStreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  totalHours: number;
  lastActiveDate: string;
  badges: AchievementBadge[];
}

export interface SkillGapItem {
  skill: string;
  importance: 'High' | 'Medium' | 'Foundational';
  currentLevel: 'Beginner' | 'Intermediate' | 'Not Started';
  requiredLevel: 'Intermediate' | 'Advanced';
  recommendation: string;
}

export interface RoleComparisonMetric {
  metric: string;
  studentScore: number;
  industryBaseline: number;
}

export interface CareerAlignmentData {
  score: number; // 0 - 100
  targetRole: string;
  targetRoleBenchmark: number;
  strengths: string[];
  skillGaps: SkillGapItem[];
  actionsToImprove: string[];
  roleComparison: RoleComparisonMetric[];
}

export interface AILearningInsights {
  fastestImprovingSkills: { name: string; growth: string }[];
  skillsNeedingAttention: { name: string; reason: string }[];
  nextRecommendedSkill: {
    name: string;
    category: string;
    reason: string;
    targetMilestone: string;
  };
  consistencyScore: number; // 0 - 100
  actionableSuggestions: string[];
  learningSummary: string;
}

// ==========================================
// Phase 4: AI Projects, Resume & Placement Preparation Types
// ==========================================

export interface ProjectQualityEvaluation {
  qualityScore: number; // 0 - 100
  rubric: {
    functionality: number; // 0 - 20
    technicalDepth: number; // 0 - 25
    relevance: number; // 0 - 20
    completeness: number; // 0 - 20
    careerAlignment: number; // 0 - 15
  };
  evaluationSummary: string;
  strengths: string[];
  gaps: string[];
  improvementActions: string[];
  evaluatedAt: string;
}

export interface PlacementProjectMilestone {
  id: string;
  title: string;
  tasks: string[];
  completed: boolean;
}

export interface PlacementProject {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
  objective: string;
  techStack: string[];
  expectedOutcome: string;
  timelineWeeks: number;
  milestones: PlacementProjectMilestone[];
  progress: number; // 0 - 100
  status: 'Not Started' | 'In Progress' | 'Completed';
  githubUrl?: string;
  demoUrl?: string;
  screenshotUrl?: string;
  evaluation?: ProjectQualityEvaluation;
  inPortfolio?: boolean;
}

export interface StudentResume {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  targetRole: string;
  summary: string;
  education: {
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
  }[];
  skills: {
    programming: string[];
    frameworksAndTools: string[];
    cloudAndDevOps: string[];
    softSkills: string[];
  };
  projects: {
    id: string;
    title: string;
    techStack: string[];
    summary: string;
    githubUrl?: string;
    demoUrl?: string;
    highlights: string[];
  }[];
  experience: {
    id: string;
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  certifications: {
    name: string;
    issuer: string;
    year: string;
  }[];
  lastUpdated: string;
}

export interface ResumeATSAnalysis {
  overallScore: number; // 0 - 100
  roleMatchScore: number; // 0 - 100
  matchedKeywords: string[];
  missingKeywords: string[];
  weakSections: {
    section: string;
    feedback: string;
    recommendation: string;
  }[];
  projectImprovements: {
    projectTitle: string;
    originalBullet: string;
    improvedBullet: string;
    reason: string;
  }[];
  actionableFixes: string[];
  analyzedAt: string;
}

export interface ResumeMissingField {
  field: 'phone' | 'location' | 'githubUrl' | 'linkedinUrl' | 'portfolioUrl' | 'projects' | 'skills' | 'summary';
  label: string;
  tip: string;
}

export interface ResumeVersion {
  id: string;
  versionNumber: number;
  title: string;
  targetRole: string;
  resume: StudentResume;
  analysis?: ResumeATSAnalysis;
  createdAt: string;
  source: 'ai_generated' | 'manual_edit' | 'regenerated' | 'initial';
  notes?: string;
}

export interface ResumeGenerationResponse {
  resume: StudentResume;
  analysis: ResumeATSAnalysis;
  missingFields: ResumeMissingField[];
  generationNotes: string;
  source: 'gemini' | 'verified-deterministic';
  targetRole: string;
}

export interface InternshipOpportunity {
  id: string;
  roleTitle: string;
  companyName: string;
  location: string;
  mode: 'Remote' | 'On-site' | 'Hybrid';
  stipend: string;
  duration: string;
  applicationDeadline: string;
  applyUrl: string;
  departmentMatch: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number; // 0 - 100
  matchReasons: string[];
  missingRequirements: string[];
  isRealListing: boolean;
  status?: 'Not Applied' | 'Saved' | 'Applied';
}

export type InterviewCategory = 'Technical' | 'HR/Communication' | 'Aptitude';

export interface InterviewQuestion {
  id: string;
  category: InterviewCategory;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  contextOrScenario?: string;
  keyConceptsToCover: string[];
  sampleAnswerOutline?: string;
}

export interface InterviewAttempt {
  id: string;
  questionId: string;
  category: InterviewCategory;
  topic: string;
  questionText: string;
  studentResponse: string;
  score: number; // 0 - 100
  feedback: {
    strengths: string[];
    improvements: string[];
    modelAnswerSnippet: string;
  };
  attemptedAt: string;
}

export interface InterviewPerformanceStats {
  totalAttempts: number;
  averageScore: number;
  technicalScore: number;
  hrScore: number;
  aptitudeScore: number;
  accuracy: number;
  topicMastery: {
    topic: string;
    attempts: number;
    avgScore: number;
  }[];
}

export interface PlacementReadinessData {
  overallScore: number; // 0 - 100
  breakdown: {
    skillProficiency: number;
    projectQuality: number;
    resumeStrength: number;
    learningProgress: number;
    interviewPerformance: number;
    aptitudePerformance: number;
    careerAlignment: number;
  };
  status: 'Ready for Top Tech' | 'Well Prepared' | 'Moderate Readiness' | 'Needs Targeted Practice';
  strengths: string[];
  criticalGaps: string[];
  highestImpactNextActions: string[];
  estimatedTimeframeToReady: string;
}

// ==========================================
// Phase 5: AI Career Copilot & Complete Student Intelligence Types
// ==========================================

export interface UnifiedStudentContext {
  student: User;
  academic: {
    department: string;
    year: string;
    gpa?: string;
    historicalScores: HistoricalScore[];
    avgScore: number;
    submissionsCount: number;
  };
  skills: {
    technical: DetailedSkill[];
    soft: DetailedSkill[];
    totalHours: number;
    avgProficiency: number;
    topSkillGaps: SkillGapItem[];
  };
  learning: {
    streak: LearningStreakData;
    goals: LearningGoal[];
    roadmapMilestones: LearningRoadmapMilestone[];
    roadmapProgress: number;
    goalCompletionRate: number;
    activitySessions: LearningActivitySession[];
  };
  projects: {
    evaluatedSubmissions: ProjectSubmission[];
    placementProjects: PlacementProject[];
    avgQualityScore: number;
    inPortfolioCount: number;
  };
  resume: {
    resume: StudentResume;
    analysis: ResumeATSAnalysis;
    atsScore: number;
    missingKeywordsCount: number;
    versions?: ResumeVersion[];
  };
  finances: {
    monthlyBudget: number;
    totalSpent: number;
    remainingBudget: number;
    percentageUsed: number;
    academicInvestmentTotal: number;
    budgetStatus: BudgetAlertLevel;
    expenseCount: number;
  };
  placement: {
    targetRole: string;
    readiness: PlacementReadinessData;
    matchedInternships: InternshipOpportunity[];
    interviewStats: InterviewPerformanceStats;
    interviewAttemptsCount: number;
  };
  lastCalculated: string;
}

export interface StudentIntelligenceScores {
  overallGrowth: number; // 0 - 100
  careerReadiness: number; // 0 - 100
  academicProgress: number; // 0 - 100
  skillProficiency: number; // 0 - 100
  projectExcellence: number; // 0 - 100
  financialDiscipline: number; // 0 - 100
  placementReadiness: number; // 0 - 100
  trends: {
    overallGrowthTrend: 'increasing' | 'stable' | 'declining';
    growthDelta: number; // e.g. +8%
    weeklyHoursDelta: number;
    readinessDelta: number;
  };
}

export interface StudentIntelligenceInsight {
  id: string;
  category: 'Academics' | 'Skills & Learning' | 'Projects & Portfolio' | 'Resume & Placement' | 'Finances & Budget' | 'Habits & Streaks';
  type: 'strength' | 'weakness' | 'risk' | 'opportunity';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  issue: string;
  evidence: string;
  impact: string;
  action: string;
  benefit: string;
}

export interface NextBestAction {
  id: string;
  title: string;
  what: string;
  why: string;
  benefit: string;
  category: 'Projects' | 'Resume' | 'Interview' | 'Skills' | 'Finances' | 'Internships';
  urgency: 'Immediate' | 'This Week' | 'High Impact';
  estimatedMinutes: number;
  targetTab: string;
}

export interface WeeklyStudentReport {
  id: string;
  weekOf: string;
  executiveSummary: string;
  keyAchievements: string[];
  learningAndSkillsSummary: {
    hoursStudied: number;
    streakDays: number;
    skillsAdvanced: string[];
  };
  projectsAndPlacementSummary: {
    projectsProgressed: string[];
    resumeScore: number;
    interviewsAttempted: number;
  };
  financialDisciplineSummary: {
    spent: number;
    budget: number;
    status: string;
    academicInvestment: number;
  };
  criticalWeaknessesAndRisks: string[];
  nextWeekPriorities: string[];
  generatedAt: string;
}

export interface SmartNotification {
  id: string;
  type: 'goal_deadline' | 'milestone_delayed' | 'internship_deadline' | 'interview_reminder' | 'budget_alert' | 'copilot_recommendation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  targetTab?: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  structuredEvidence?: {
    dataPoint: string;
    reason: string;
    expectedBenefit: string;
  };
  suggestedActions?: {
    label: string;
    actionTab?: string;
    queryPrompt?: string;
  }[];
}



