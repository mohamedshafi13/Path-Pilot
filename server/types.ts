import type { 
  User, SkillMetric, HistoricalScore, ProjectSubmission, 
  RoadmapMilestone, ExpenseItem, DetailedSkill, LearningGoal, 
  LearningRoadmapMilestone, LearningStreakData, LearningActivitySession, 
  CareerAlignmentData, AILearningInsights, PlacementProject, 
  StudentResume, ResumeATSAnalysis, InternshipOpportunity, 
  InterviewQuestion, InterviewAttempt, InterviewPerformanceStats, 
  PlacementReadinessData, SmartNotification, CopilotMessage, WeeklyStudentReport,
  ResumeVersion
} from '../src/types.ts';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  department: string;
  year: string;
  interest: string;
  targetRole: string;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface StudentUserData {
  userId: string;
  skills: SkillMetric[];
  detailedSkills: DetailedSkill[];
  historicalScores: HistoricalScore[];
  submissions: ProjectSubmission[];
  roadmapMilestones: RoadmapMilestone[];
  learningRoadmap: LearningRoadmapMilestone[];
  learningGoals: LearningGoal[];
  streakData: LearningStreakData;
  activitySessions: LearningActivitySession[];
  monthlyBudget: number;
  expenses: ExpenseItem[];
  placementProjects: PlacementProject[];
  studentResume: StudentResume;
  resumeAnalysis: ResumeATSAnalysis;
  resumeVersions: ResumeVersion[];
  internships: InternshipOpportunity[];
  interviewQuestions: InterviewQuestion[];
  interviewAttempts: InterviewAttempt[];
  interviewStats: InterviewPerformanceStats;
  placementReadiness: PlacementReadinessData;
  careerAlignment: CareerAlignmentData;
  learningInsights: AILearningInsights;
  notifications: SmartNotification[];
  copilotChatHistory: CopilotMessage[];
  weeklyReports: WeeklyStudentReport[];
}

export interface DBSchema {
  users: Record<string, DBUser>; // userId -> DBUser
  studentsData: Record<string, StudentUserData>; // userId -> StudentUserData
}
