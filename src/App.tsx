import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, SkillMetric, HistoricalScore, ProjectSubmission, 
  ProjectIdea, ResourceItem, RoadmapMilestone, ExpenseItem,
  DetailedSkill, LearningGoal, LearningRoadmapMilestone, 
  LearningStreakData, LearningActivitySession, CareerAlignmentData, AILearningInsights,
  PlacementProject, StudentResume, ResumeATSAnalysis, InternshipOpportunity, 
  InterviewQuestion, InterviewAttempt, InterviewPerformanceStats, PlacementReadinessData,
  UnifiedStudentContext, StudentIntelligenceScores, StudentIntelligenceInsight,
  NextBestAction, WeeklyStudentReport, SmartNotification, CopilotMessage, ResumeVersion
} from './types';
import { 
  DEFAULT_DEMO_USER, SEED_SUBMISSIONS, INITIAL_SKILLS, 
  HISTORICAL_PERFORMANCE, SEED_PROJECT_IDEAS, DEFAULT_ROADMAP_MILESTONES, 
  CURATED_RESOURCES, DEPARTMENT_INTERESTS, INITIAL_EXPENSES, DEFAULT_MONTHLY_BUDGET,
  INITIAL_DETAILED_SKILLS, INITIAL_LEARNING_GOALS, INITIAL_STREAK_DATA,
  INITIAL_ACTIVITY_SESSIONS, INITIAL_CAREER_ALIGNMENT, INITIAL_LEARNING_INSIGHTS, INITIAL_LEARNING_ROADMAP 
} from './data/departmentData';
import { 
  INITIAL_PLACEMENT_PROJECTS, INITIAL_STUDENT_RESUME, INITIAL_RESUME_ANALYSIS, 
  INITIAL_INTERNSHIPS, INITIAL_INTERVIEW_QUESTIONS, INITIAL_INTERVIEW_ATTEMPTS, 
  INITIAL_INTERVIEW_STATS, INITIAL_PLACEMENT_READINESS 
} from './data/placementData';
import { 
  requestProjectSuggestions, requestPersonalizedResources, requestLearningInsights,
  getAuthToken, clearAuthToken, fetchStudentData, logoutUser,
  updateStudentOnboarding, updateStudentProfile, addBasicSkillDB, addHistoricalScoreDB,
  saveDetailedSkill, deleteDetailedSkill, saveLearningGoal, deleteLearningGoal,
  logStudyActivity, toggleRoadmapTopicDB, addExpenseDB, deleteExpenseDB,
  updateMonthlyBudgetDB, saveEvaluatedProjectDB, updatePlacementProjectsDB,
  updateStudentResumeDB, updateInternshipsDB, submitInterviewAttemptDB,
  updatePlacementReadinessDB, updateNotificationsDB, updateCareerRoadmapDB,
  saveResumeVersion, restoreResumeVersion
} from './services/api';
import { 
  buildUnifiedStudentContext, calculateIntelligenceScores, 
  detectIntelligenceInsights, computeNextBestAction, 
  generateWeeklyReport, generateSmartNotifications, 
  generateAchievementBadges 
} from './services/intelligenceService';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { OnboardingInterest } from './components/OnboardingInterest';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectEvaluator } from './components/ProjectEvaluator';
import { ProjectIdeasView } from './components/ProjectIdeasView';
import { ResourcesView } from './components/ResourcesView';
import { CareerRoadmapView } from './components/CareerRoadmapView';
import { ExpensesTrackerView } from './components/ExpensesTrackerView';
import { AILearningHubView } from './components/AILearningHubView';
import { AICareerPlacementHubView } from './components/AICareerPlacementHubView';
import { StudentIntelligenceView } from './components/StudentIntelligenceView';
import { AICopilotChatDrawer } from './components/AICopilotChatDrawer';
import { DataEntryModal } from './components/DataEntryModal';
import { Bot } from 'lucide-react';

export default function App() {
  // Authentication & Session states
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showAuthView, setShowAuthView] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register'>('signin');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Phase 1 Data states
  const [skills, setSkills] = useState<SkillMetric[]>([]);
  const [historicalScores, setHistoricalScores] = useState<HistoricalScore[]>([]);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>(CURATED_RESOURCES);
  const [roadmapMilestones, setRoadmapMilestones] = useState<RoadmapMilestone[]>([]);

  // Phase 2: Expense Tracker States
  const [monthlyBudget, setMonthlyBudget] = useState<number>(8000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  // Phase 3: AI Learning Hub & Skill Development States
  const [detailedSkills, setDetailedSkills] = useState<DetailedSkill[]>([]);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [streakData, setStreakData] = useState<LearningStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    totalHours: 0,
    lastActiveDate: '',
    badges: [],
  });
  const [activitySessions, setActivitySessions] = useState<LearningActivitySession[]>([]);
  const [learningRoadmap, setLearningRoadmap] = useState<LearningRoadmapMilestone[]>([]);
  const [careerAlignment, setCareerAlignment] = useState<CareerAlignmentData>({
    score: 0,
    targetRole: 'Software Engineer',
    targetRoleBenchmark: 85,
    strengths: [],
    skillGaps: [],
    actionsToImprove: [],
    roleComparison: [],
  });
  const [learningInsights, setLearningInsights] = useState<AILearningInsights>({
    fastestImprovingSkills: [],
    skillsNeedingAttention: [],
    nextRecommendedSkill: {
      name: 'Foundations',
      category: 'General',
      reason: 'Start learning path',
      targetMilestone: 'Milestone 1',
    },
    consistencyScore: 0,
    actionableSuggestions: [],
    learningSummary: 'Welcome to PathPilot!',
  });
  const [isAnalyzingLearning, setIsAnalyzingLearning] = useState(false);

  // Phase 4: Placement Preparation States
  const [placementProjects, setPlacementProjects] = useState<PlacementProject[]>([]);
  const [studentResume, setStudentResume] = useState<StudentResume>({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    targetRole: 'Software Engineer',
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: {
      programming: [],
      frameworksAndTools: [],
      cloudAndDevOps: [],
      softSkills: [],
    },
    certifications: [],
    lastUpdated: '',
  });
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeATSAnalysis>({
    overallScore: 0,
    roleMatchScore: 0,
    matchedKeywords: [],
    missingKeywords: [],
    weakSections: [],
    projectImprovements: [],
    actionableFixes: [],
    analyzedAt: '',
  });
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [internships, setInternships] = useState<InternshipOpportunity[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>(INITIAL_INTERVIEW_QUESTIONS);
  const [interviewAttempts, setInterviewAttempts] = useState<InterviewAttempt[]>([]);
  const [interviewStats, setInterviewStats] = useState<InterviewPerformanceStats>({
    totalAttempts: 0,
    averageScore: 0,
    technicalScore: 0,
    hrScore: 0,
    aptitudeScore: 0,
    accuracy: 0,
    topicMastery: [],
  });
  const [placementReadiness, setPlacementReadiness] = useState<PlacementReadinessData>({
    overallScore: 0,
    breakdown: {
      skillProficiency: 0,
      projectQuality: 0,
      resumeStrength: 0,
      learningProgress: 0,
      interviewPerformance: 0,
      aptitudePerformance: 0,
      careerAlignment: 0,
    },
    status: 'Needs Targeted Practice',
    strengths: [],
    criticalGaps: [],
    highestImpactNextActions: [],
    estimatedTimeframeToReady: '6 - 8 Weeks',
  });
  const [selectedSubmissionForEval, setSelectedSubmissionForEval] = useState<ProjectSubmission | null>(null);
  const [dataEntryModalOpen, setDataEntryModalOpen] = useState(false);

  // Phase 5: Complete Student Intelligence Layer
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  // Database State Hydration Helpers
  const applyStudentDataToState = (data: any, currentUser?: User) => {
    if (!data) return;
    if (data.skills) setSkills(data.skills);
    if (data.detailedSkills) setDetailedSkills(data.detailedSkills);
    if (data.historicalScores) setHistoricalScores(data.historicalScores);
    if (data.submissions) setSubmissions(data.submissions);
    if (data.roadmapMilestones) setRoadmapMilestones(data.roadmapMilestones);
    if (data.learningRoadmap) setLearningRoadmap(data.learningRoadmap);
    if (data.learningGoals) setLearningGoals(data.learningGoals);
    if (data.streakData) setStreakData(data.streakData);
    if (data.activitySessions) setActivitySessions(data.activitySessions);
    if (typeof data.monthlyBudget === 'number') setMonthlyBudget(data.monthlyBudget);
    if (data.expenses) setExpenses(data.expenses);
    if (data.placementProjects) setPlacementProjects(data.placementProjects);
    if (data.studentResume) setStudentResume(data.studentResume);
    if (data.resumeAnalysis) setResumeAnalysis(data.resumeAnalysis);
    if (data.resumeVersions) setResumeVersions(data.resumeVersions);
    if (data.internships) setInternships(data.internships);
    if (data.interviewQuestions && data.interviewQuestions.length > 0) setInterviewQuestions(data.interviewQuestions);
    if (data.interviewAttempts) setInterviewAttempts(data.interviewAttempts);
    if (data.interviewStats) setInterviewStats(data.interviewStats);
    if (data.placementReadiness) setPlacementReadiness(data.placementReadiness);
    if (data.careerAlignment) setCareerAlignment(data.careerAlignment);
    if (data.learningInsights) setLearningInsights(data.learningInsights);
    if (data.notifications) setNotifications(data.notifications);

    const targetUser = currentUser || user;
    if (targetUser?.interest) {
      const ideas = SEED_PROJECT_IDEAS[targetUser.interest] || SEED_PROJECT_IDEAS['Distributed Systems & Cloud Infrastructure'] || [];
      setProjectIdeas(ideas);
    }
  };

  const clearStudentDataState = () => {
    setSkills([]);
    setDetailedSkills([]);
    setHistoricalScores([]);
    setSubmissions([]);
    setRoadmapMilestones([]);
    setLearningRoadmap([]);
    setLearningGoals([]);
    setStreakData({ currentStreak: 0, longestStreak: 0, totalDays: 0, totalHours: 0, lastActiveDate: '', badges: [] });
    setActivitySessions([]);
    setMonthlyBudget(8000);
    setExpenses([]);
    setPlacementProjects([]);
    setStudentResume({} as any);
    setResumeAnalysis({} as any);
    setResumeVersions([]);
    setInternships([]);
    setInterviewAttempts([]);
    setInterviewStats({ totalAttempts: 0, averageScore: 0, technicalScore: 0, hrScore: 0, aptitudeScore: 0, accuracy: 0, topicMastery: [] });
    setPlacementReadiness({} as any);
    setCareerAlignment({} as any);
    setLearningInsights({} as any);
    setNotifications([]);
    setProjectIdeas([]);
  };

  // Persistent session verification on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setShowAuthView(true);
      clearStudentDataState();
      setIsSessionLoading(false);
      return;
    }

    fetchStudentData()
      .then((res) => {
        setUser(res.user);
        applyStudentDataToState(res.studentData, res.user);
        setShowAuthView(false);
        if (!res.user.interest) {
          setIsOnboarding(true);
        } else {
          setIsOnboarding(false);
        }
      })
      .catch((err) => {
        console.warn('Session verification failed, requesting sign in:', err);
        clearAuthToken();
        setUser(null);
        setShowAuthView(true);
        clearStudentDataState();
      })
      .finally(() => {
        setIsSessionLoading(false);
      });
  }, []);

  const unifiedContext = useMemo(() => {
    if (!user) return null;
    return buildUnifiedStudentContext({
      user,
      skills,
      detailedSkills,
      historicalScores,
      submissions,
      learningRoadmap,
      learningGoals,
      streakData,
      activitySessions,
      monthlyBudget,
      expenses,
      placementProjects,
      studentResume,
      resumeAnalysis,
      internships,
      interviewStats,
      placementReadiness,
      careerAlignment,
    });
  }, [
    user,
    skills,
    detailedSkills,
    historicalScores,
    submissions,
    learningRoadmap,
    learningGoals,
    streakData,
    activitySessions,
    monthlyBudget,
    expenses,
    placementProjects,
    studentResume,
    resumeAnalysis,
    internships,
    interviewStats,
    placementReadiness,
    careerAlignment,
  ]);

  const intelligenceScores = useMemo(() => {
    if (!unifiedContext) {
      return {
        overallGrowth: 83,
        careerReadiness: 82,
        academicProgress: 84,
        skillProficiency: 78,
        projectExcellence: 88,
        financialDiscipline: 92,
        placementReadiness: 85,
        trends: { overallGrowthTrend: 'increasing' as const, growthDelta: 8, weeklyHoursDelta: 6.5, readinessDelta: 5 },
      };
    }
    return calculateIntelligenceScores(unifiedContext);
  }, [unifiedContext]);

  const intelligenceInsights = useMemo(() => {
    if (!unifiedContext) return [];
    return detectIntelligenceInsights(unifiedContext, intelligenceScores);
  }, [unifiedContext, intelligenceScores]);

  const nextBestAction = useMemo(() => {
    if (!unifiedContext) {
      return {
        id: 'nba-default',
        title: 'Finish Milestone 3 of Kubernetes Custom Operator',
        what: 'Implement reconciler loop tasks and verification logic.',
        why: 'Your resume lacks Kubernetes deployment proof, which is the #1 missing keyword for Cloud & Infrastructure roles.',
        benefit: 'Closes 2 critical ATS gaps and increases Placement Readiness to 88%.',
        category: 'Projects' as const,
        urgency: 'Immediate' as const,
        estimatedMinutes: 45,
        targetTab: 'placement',
      };
    }
    return computeNextBestAction(unifiedContext, intelligenceInsights);
  }, [unifiedContext, intelligenceInsights]);

  const achievements = useMemo(() => {
    if (!unifiedContext) return [];
    return generateAchievementBadges(unifiedContext);
  }, [unifiedContext]);

  const weeklyReport = useMemo(() => {
    if (!unifiedContext) {
      return {
        id: 'rep-fallback',
        weekOf: 'Current Week',
        executiveSummary: 'Positive student trajectory across systems engineering and placement preparation.',
        keyAchievements: [],
        learningAndSkillsSummary: { hoursStudied: 54, streakDays: 5, skillsAdvanced: [] },
        projectsAndPlacementSummary: { projectsProgressed: [], resumeScore: 86, interviewsAttempted: 3 },
        financialDisciplineSummary: { spent: 3850, budget: 8000, status: 'Normal', academicInvestment: 1850 },
        criticalWeaknessesAndRisks: [],
        nextWeekPriorities: [],
        generatedAt: new Date().toISOString(),
      };
    }
    return generateWeeklyReport(unifiedContext, intelligenceScores, nextBestAction);
  }, [unifiedContext, intelligenceScores, nextBestAction]);

  useEffect(() => {
    if (unifiedContext && notifications.length === 0) {
      const generated = generateSmartNotifications(unifiedContext);
      setNotifications(generated);
    }
  }, [unifiedContext]);

  useEffect(() => {
    try {
      localStorage.setItem('pathpilot_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not persist notifications:', e);
    }
  }, [notifications]);

  // Recalculate dynamic career alignment based on real data
  const recalculateAlignmentScore = (
    currentSkills: DetailedSkill[],
    currentRoadmap: LearningRoadmapMilestone[],
    currentSubmissions: ProjectSubmission[],
    currentStreak: LearningStreakData
  ) => {
    const techSkills = currentSkills.filter((s) => s.type === 'Technical');
    const softSkills = currentSkills.filter((s) => s.type === 'Soft');
    const avgTech = techSkills.length > 0
      ? techSkills.reduce((acc, s) => acc + s.progress, 0) / techSkills.length
      : 75;
    const avgSoft = softSkills.length > 0
      ? softSkills.reduce((acc, s) => acc + s.progress, 0) / softSkills.length
      : 80;

    const totalTopics = currentRoadmap.reduce((acc, m) => acc + m.topics.length, 0);
    const doneTopics = currentRoadmap.reduce((acc, m) => acc + m.topics.filter((t) => t.completed).length, 0);
    const roadmapPct = totalTopics > 0 ? (doneTopics / totalTopics) * 100 : 50;

    const projectScore = Math.min(100, currentSubmissions.length * 30);
    const consistencyBonus = Math.min(10, Math.floor(currentStreak.currentStreak / 2));

    const rawScore = Math.round(
      avgTech * 0.45 + avgSoft * 0.15 + projectScore * 0.2 + roadmapPct * 0.2 + consistencyBonus
    );
    return Math.min(98, Math.max(55, rawScore));
  };

  // Phase 2 Expense Handlers
  const handleAddExpense = async (expense: ExpenseItem) => {
    setExpenses((prev) => [expense, ...prev]);
    try {
      const res = await addExpenseDB(expense);
      setExpenses(res.expenses);
    } catch (err) {
      console.error('Failed to save expense to DB:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    try {
      const res = await deleteExpenseDB(expenseId);
      setExpenses(res.expenses);
    } catch (err) {
      console.error('Failed to delete expense from DB:', err);
    }
  };

  const handleUpdateBudget = async (budget: number) => {
    setMonthlyBudget(budget);
    try {
      const res = await updateMonthlyBudgetDB(budget);
      setMonthlyBudget(res.monthlyBudget);
    } catch (err) {
      console.error('Failed to update budget in DB:', err);
    }
  };

  // Phase 3 Learning Hub Handlers
  const handleUpdateSkill = async (skillId: string, updates: Partial<DetailedSkill>) => {
    const current = detailedSkills.find((s) => s.id === skillId);
    if (!current) return;
    const updatedSkill = { ...current, ...updates };

    setDetailedSkills((prev) => {
      const updated = prev.map((s) => (s.id === skillId ? updatedSkill : s));
      const newScore = recalculateAlignmentScore(updated, learningRoadmap, submissions, streakData);
      setCareerAlignment((c) => ({ ...c, score: newScore }));
      return updated;
    });

    try {
      const res = await saveDetailedSkill(updatedSkill);
      setDetailedSkills(res.detailedSkills);
    } catch (err) {
      console.error('Failed to update skill in DB:', err);
    }
  };

  const handleAddDetailedSkill = async (newSkill: DetailedSkill) => {
    setDetailedSkills((prev) => {
      const updated = [newSkill, ...prev];
      const newScore = recalculateAlignmentScore(updated, learningRoadmap, submissions, streakData);
      setCareerAlignment((c) => ({ ...c, score: newScore }));
      return updated;
    });

    try {
      const res = await saveDetailedSkill(newSkill);
      setDetailedSkills(res.detailedSkills);
    } catch (err) {
      console.error('Failed to save skill in DB:', err);
    }
  };

  const handleDeleteDetailedSkill = async (skillId: string) => {
    setDetailedSkills((prev) => {
      const updated = prev.filter((s) => s.id !== skillId);
      const newScore = recalculateAlignmentScore(updated, learningRoadmap, submissions, streakData);
      setCareerAlignment((c) => ({ ...c, score: newScore }));
      return updated;
    });

    try {
      const res = await deleteDetailedSkill(skillId);
      setDetailedSkills(res.detailedSkills);
    } catch (err) {
      console.error('Failed to delete skill from DB:', err);
    }
  };

  const handleToggleGoal = async (goalId: string) => {
    const current = learningGoals.find((g) => g.id === goalId);
    if (!current) return;
    const nowCompleted = !current.completed;
    const updatedGoal = {
      ...current,
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date().toISOString().split('T')[0] : undefined,
    };

    setLearningGoals((prev) => prev.map((g) => (g.id === goalId ? updatedGoal : g)));

    try {
      const res = await saveLearningGoal(updatedGoal);
      setLearningGoals(res.learningGoals);
    } catch (err) {
      console.error('Failed to toggle goal in DB:', err);
    }
  };

  const handleAddGoal = async (newGoal: LearningGoal) => {
    setLearningGoals((prev) => [newGoal, ...prev]);
    try {
      const res = await saveLearningGoal(newGoal);
      setLearningGoals(res.learningGoals);
    } catch (err) {
      console.error('Failed to save goal in DB:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setLearningGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      const res = await deleteLearningGoal(goalId);
      setLearningGoals(res.learningGoals);
    } catch (err) {
      console.error('Failed to delete goal in DB:', err);
    }
  };

  const handleToggleRoadmapTopic = async (milestoneId: string, topicId: string) => {
    try {
      const res = await toggleRoadmapTopicDB(milestoneId, topicId);
      setLearningRoadmap(res.learningRoadmap);
      const newScore = recalculateAlignmentScore(detailedSkills, res.learningRoadmap, submissions, streakData);
      setCareerAlignment((c) => ({ ...c, score: newScore }));
    } catch (err) {
      console.error('Failed to toggle roadmap topic in DB:', err);
    }
  };

  const handleLogActivity = async (minutes: number, topicsCovered: string, skillName: string) => {
    try {
      const res = await logStudyActivity({ minutes, topicsCovered, skillName });
      setActivitySessions(res.activitySessions);
      setStreakData(res.streakData);
      setDetailedSkills(res.detailedSkills);
    } catch (err) {
      console.error('Failed to record study activity in DB:', err);
    }
  };

  const handleRefreshLearningInsights = async () => {
    if (!user) return;
    setIsAnalyzingLearning(true);
    try {
      const totalTopics = learningRoadmap.reduce((acc, m) => acc + m.topics.length, 0);
      const doneTopics = learningRoadmap.reduce((acc, m) => acc + m.topics.filter((t) => t.completed).length, 0);
      const roadmapPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 65;

      const data = await requestLearningInsights({
        department: user.department,
        year: user.year,
        interest: user.interest,
        targetRole: careerAlignment.targetRole || user.targetRole || 'Software Engineer',
        skills: detailedSkills,
        goals: learningGoals,
        streakData,
        projectsCount: submissions.length,
        roadmapProgress: roadmapPct,
      });

      if (data.insights) {
        setLearningInsights(data.insights);
      }
      if (data.careerAlignment) {
        setCareerAlignment(data.careerAlignment);
      }
    } catch (e) {
      console.error('Failed to refresh learning insights:', e);
    } finally {
      setIsAnalyzingLearning(false);
    }
  };

  const handleUpdateTargetRole = async (newRole: string) => {
    if (user) {
      setUser({ ...user, targetRole: newRole });
    }
    setCareerAlignment((prev) => ({
      ...prev,
      targetRole: newRole,
    }));
    setStudentResume((prev) => ({
      ...prev,
      targetRole: newRole,
    }));

    try {
      await updateStudentProfile({ targetRole: newRole });
    } catch (e) {
      console.error('Failed to persist target role update:', e);
    }

    if (!user) return;
    setIsAnalyzingLearning(true);
    try {
      const totalTopics = learningRoadmap.reduce((acc, m) => acc + m.topics.length, 0);
      const doneTopics = learningRoadmap.reduce((acc, m) => acc + m.topics.filter((t) => t.completed).length, 0);
      const roadmapPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 65;

      const data = await requestLearningInsights({
        department: user.department,
        year: user.year,
        interest: user.interest,
        targetRole: newRole,
        skills: detailedSkills,
        goals: learningGoals,
        streakData,
        projectsCount: submissions.length,
        roadmapProgress: roadmapPct,
      });

      if (data.insights) setLearningInsights(data.insights);
      if (data.careerAlignment) setCareerAlignment(data.careerAlignment);
    } catch (e) {
      console.error('Failed to calibrate new role insights:', e);
    } finally {
      setIsAnalyzingLearning(false);
    }
  };

  // Phase 4 Placement Handlers
  const handleUpdatePlacementProjects = async (updatedProjects: PlacementProject[]) => {
    setPlacementProjects(updatedProjects);
    try {
      await updatePlacementProjectsDB(updatedProjects);
    } catch (err) {
      console.error('Failed to update placement projects in DB:', err);
    }
  };

  const handleUpdateResume = async (updatedResume: StudentResume) => {
    setStudentResume(updatedResume);
    try {
      await updateStudentResumeDB({ studentResume: updatedResume });
    } catch (err) {
      console.error('Failed to update resume in DB:', err);
    }
  };

  const handleUpdateResumeAnalysis = async (updatedAnalysis: ResumeATSAnalysis) => {
    setResumeAnalysis(updatedAnalysis);
    try {
      await updateStudentResumeDB({ resumeAnalysis: updatedAnalysis });
    } catch (err) {
      console.error('Failed to update resume analysis in DB:', err);
    }
  };

  const handleSaveResumeVersion = async (payload: {
    resume: StudentResume;
    analysis?: ResumeATSAnalysis;
    notes?: string;
    title?: string;
    source?: string;
  }) => {
    try {
      const res = await saveResumeVersion(payload);
      if (res.resumeVersions) setResumeVersions(res.resumeVersions);
      if (res.studentResume) setStudentResume(res.studentResume);
      if (res.resumeAnalysis) setResumeAnalysis(res.resumeAnalysis);
      if (res.placementReadiness) setPlacementReadiness(res.placementReadiness);
    } catch (err) {
      console.error('Failed to save resume version in DB:', err);
      throw err;
    }
  };

  const handleRestoreResumeVersion = async (versionId: string) => {
    try {
      const res = await restoreResumeVersion(versionId);
      if (res.resumeVersions) setResumeVersions(res.resumeVersions);
      if (res.studentResume) setStudentResume(res.studentResume);
      if (res.resumeAnalysis) setResumeAnalysis(res.resumeAnalysis);
      if (res.placementReadiness) setPlacementReadiness(res.placementReadiness);
    } catch (err) {
      console.error('Failed to restore resume version in DB:', err);
      throw err;
    }
  };

  const handleUpdateInternships = async (updatedInternships: InternshipOpportunity[]) => {
    setInternships(updatedInternships);
    try {
      await updateInternshipsDB(updatedInternships);
    } catch (err) {
      console.error('Failed to update internships in DB:', err);
    }
  };

  const handleAddInterviewAttempt = async (attempt: InterviewAttempt) => {
    try {
      const res = await submitInterviewAttemptDB(attempt);
      setInterviewAttempts(res.interviewAttempts);
      setInterviewStats(res.interviewStats);
    } catch (err) {
      console.error('Failed to record interview attempt in DB:', err);
    }
  };

  const handleUpdatePlacementReadiness = async (updatedReadiness: PlacementReadinessData) => {
    setPlacementReadiness(updatedReadiness);
    try {
      await updatePlacementReadinessDB(updatedReadiness);
    } catch (err) {
      console.error('Failed to update placement readiness in DB:', err);
    }
  };

  const handleRefreshAllReadiness = () => {
    const completedProjects = placementProjects.filter((p) => p.status === 'Completed');
    const avgProjQuality = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => sum + (p.evaluation?.qualityScore || 80), 0) / completedProjects.length
      : 70;

    const resumeScore = resumeAnalysis.overallScore || 75;
    const avgInterview = interviewAttempts.length > 0
      ? interviewAttempts.reduce((sum, a) => sum + a.score, 0) / interviewAttempts.length
      : 75;

    const rawReadiness = Math.round(
      avgProjQuality * 0.25 +
      resumeScore * 0.20 +
      avgInterview * 0.20 +
      80 * 0.10 +
      careerAlignment.score * 0.25
    );

    const overallScore = Math.min(98, Math.max(50, rawReadiness));
    const status: PlacementReadinessData['status'] =
      overallScore >= 88 ? 'Ready for Top Tech' :
      overallScore >= 78 ? 'Well Prepared' :
      overallScore >= 68 ? 'Moderate Readiness' : 'Needs Targeted Practice';

    const updatedReadiness: PlacementReadinessData = {
      ...placementReadiness,
      overallScore,
      status,
      breakdown: {
        skillProficiency: Math.round(careerAlignment.score * 0.95),
        projectQuality: Math.round(avgProjQuality),
        resumeStrength: resumeScore,
        learningProgress: Math.min(100, streakData.totalDays * 4),
        interviewPerformance: Math.round(avgInterview),
        aptitudePerformance: 80,
        careerAlignment: careerAlignment.score,
      },
    };

    setPlacementReadiness(updatedReadiness);
    updatePlacementReadinessDB(updatedReadiness).catch(console.error);
  };

  // Handlers for Authentication
  const handleSignInSuccess = (signedInUser: User, studentData?: any) => {
    setUser(signedInUser);
    if (studentData) {
      applyStudentDataToState(studentData, signedInUser);
    } else {
      fetchStudentData()
        .then((res) => applyStudentDataToState(res.studentData, res.user))
        .catch(console.error);
    }
    setShowAuthView(false);
    if (!signedInUser.interest) {
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
      setActiveTab('dashboard');
    }
  };

  const handleRegisterSuccess = (newUser: User, studentData?: any) => {
    setUser(newUser);
    if (studentData) {
      applyStudentDataToState(studentData, newUser);
    }
    setShowAuthView(false);
    setIsOnboarding(true);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    clearAuthToken();
    setUser(null);
    clearStudentDataState();
    setAuthInitialMode('signin');
    setShowAuthView(true);
  };

  // Handler for Onboarding Interest Selection
  const handleInterestSelected = async (interest: string, targetRole?: string) => {
    if (!user) return;

    try {
      const res = await updateStudentOnboarding({ interest, targetRole });
      setUser(res.user);
      if (res.studentData) {
        applyStudentDataToState(res.studentData, res.user);
      }
      setIsOnboarding(false);
      setActiveTab('dashboard');

      const proj = await requestProjectSuggestions(res.user.department, res.user.year, interest);
      if (proj.projects && proj.projects.length > 0) {
        setProjectIdeas(proj.projects);
      }
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
    }
  };

  // Evaluation & Data update handlers
  const handleSaveEvaluation = async (submission: ProjectSubmission) => {
    try {
      const res = await saveEvaluatedProjectDB(submission);
      setSubmissions(res.submissions);
      setHistoricalScores(res.historicalScores);

      if (submission.evaluation?.recommendedSkillsToAcquire?.[0]) {
        const recommended = submission.evaluation.recommendedSkillsToAcquire[0];
        const alreadyExists = detailedSkills.some((s) => s.name.toLowerCase() === recommended.toLowerCase());
        if (!alreadyExists) {
          const newSkill: DetailedSkill = {
            id: `skill-rec-${Date.now()}`,
            name: recommended,
            type: 'Technical',
            category: 'Programming',
            level: 'Beginner',
            status: 'Planned',
            progress: 25,
            hoursSpent: 2,
            lastPracticed: new Date().toISOString().split('T')[0],
          };
          handleAddDetailedSkill(newSkill);
        }
      }
    } catch (err) {
      console.error('Failed to record project evaluation in DB:', err);
    }
  };

  const handleSelectIdeaForEvaluation = (idea: ProjectIdea) => {
    const templateSubmission: ProjectSubmission = {
      id: `prep-${Date.now()}`,
      title: idea.title,
      domain: idea.domain,
      department: user?.department || 'Engineering',
      description: idea.description,
      techStack: idea.technologies,
      architectureDetails: `Planned implementation based on weekly milestones: ${idea.milestones.join('; ')}`,
      challengesFaced: 'System state synchronization and high-load performance optimization.',
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setSelectedSubmissionForEval(templateSubmission);
    setActiveTab('evaluator');
  };

  const handleToggleResourceComplete = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleToggleRoadmapTask = async (milestoneId: string, taskId: string) => {
    try {
      const res = await updateCareerRoadmapDB({ milestoneId, taskId });
      setRoadmapMilestones(res.roadmapMilestones);
    } catch (err) {
      console.error('Failed to toggle roadmap task in DB:', err);
    }
  };

  const handleAddSkill = async (newSkill: SkillMetric) => {
    try {
      const res = await addBasicSkillDB(newSkill);
      setSkills(res.skills);
    } catch (err) {
      console.error('Failed to add basic skill in DB:', err);
    }
  };

  const handleAddHistoricalScore = async (newScore: HistoricalScore) => {
    try {
      const res = await addHistoricalScoreDB(newScore);
      setHistoricalScores(res.historicalScores);
    } catch (err) {
      console.error('Failed to add historical score in DB:', err);
    }
  };

  const handleUpdateUserProfile = async (updated: User) => {
    setUser(updated);
    try {
      await updateStudentProfile({
        name: updated.name,
        department: updated.department,
        year: updated.year,
        interest: updated.interest,
        targetRole: updated.targetRole,
      });
    } catch (err) {
      console.error('Failed to update student profile in DB:', err);
    }
  };

  const handleToggleNotificationRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    try {
      await updateNotificationsDB({ notificationId: notifId });
    } catch (err) {
      console.error('Failed to update notification in DB:', err);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <Bot className="w-7 h-7 text-white animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight">PathPilot</span>
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Connecting to secure student database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataEntry={() => setDataEntryModalOpen(true)}
        onOpenInterestChange={() => setIsOnboarding(true)}
        onSignOut={handleSignOut}
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setShowAuthView(true);
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
      />

      {/* Main Content Flow */}
      <main className="flex-1 pb-16">
        {/* Case 1: Unauthenticated or Auth View Triggered */}
        {(!user || showAuthView) ? (
          <AuthView
            initialMode={authInitialMode}
            onSignInSuccess={handleSignInSuccess}
            onRegisterSuccess={handleRegisterSuccess}
          />
        ) : isOnboarding ? (
          /* Case 2: Onboarding Page */
          <OnboardingInterest
            user={user}
            onInterestSelected={handleInterestSelected}
          />
        ) : (
          /* Case 3: Student Dashboard Views */
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview
                user={user}
                skills={skills}
                historicalScores={historicalScores}
                submissions={submissions}
                roadmapMilestones={roadmapMilestones}
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                detailedSkills={detailedSkills}
                learningGoals={learningGoals}
                streakData={streakData}
                careerAlignment={careerAlignment}
                learningInsights={learningInsights}
                learningRoadmap={learningRoadmap}
                placementProjects={placementProjects}
                resumeAnalysis={resumeAnalysis}
                internships={internships}
                interviewStats={interviewStats}
                placementReadiness={placementReadiness}
                nba={nextBestAction}
                intelligenceScores={intelligenceScores}
                onNavigateToProjects={() => setActiveTab('projects')}
                onNavigateToEvaluator={(sub) => {
                  setSelectedSubmissionForEval(sub || null);
                  setActiveTab('evaluator');
                }}
                onNavigateToRoadmap={() => setActiveTab('roadmap')}
                onNavigateToExpenses={() => setActiveTab('expenses')}
                onNavigateToLearning={() => setActiveTab('learning')}
                onNavigateToPlacement={() => setActiveTab('placement')}
                onNavigateToIntelligence={() => setActiveTab('intelligence')}
                onOpenCopilot={() => setIsCopilotOpen(true)}
                onOpenDataEntry={() => setDataEntryModalOpen(true)}
                onChangeInterest={() => setIsOnboarding(true)}
              />
            )}

            {activeTab === 'intelligence' && unifiedContext && (
              <StudentIntelligenceView
                user={user}
                context={unifiedContext}
                scores={intelligenceScores}
                insights={intelligenceInsights}
                nba={nextBestAction}
                achievements={achievements}
                weeklyReport={weeklyReport}
                notifications={notifications}
                onOpenCopilot={() => setIsCopilotOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onRefreshIntelligence={handleRefreshLearningInsights}
                onToggleNotificationRead={handleToggleNotificationRead}
              />
            )}

            {activeTab === 'placement' && (
              <AICareerPlacementHubView
                user={user}
                placementProjects={placementProjects}
                studentResume={studentResume}
                resumeAnalysis={resumeAnalysis}
                resumeVersions={resumeVersions}
                submissions={submissions}
                internships={internships}
                interviewQuestions={interviewQuestions}
                interviewAttempts={interviewAttempts}
                interviewStats={interviewStats}
                placementReadiness={placementReadiness}
                detailedSkills={detailedSkills}
                careerAlignment={careerAlignment}
                streakData={streakData}
                onUpdateProjects={handleUpdatePlacementProjects}
                onUpdateResume={handleUpdateResume}
                onUpdateResumeAnalysis={handleUpdateResumeAnalysis}
                onSaveResumeVersion={handleSaveResumeVersion}
                onRestoreResumeVersion={handleRestoreResumeVersion}
                onUpdateInternships={handleUpdateInternships}
                onAddInterviewAttempt={handleAddInterviewAttempt}
                onUpdatePlacementReadiness={handleUpdatePlacementReadiness}
                onRefreshAllReadiness={handleRefreshAllReadiness}
              />
            )}

            {activeTab === 'learning' && (
              <AILearningHubView
                user={user}
                skills={detailedSkills}
                goals={learningGoals}
                streakData={streakData}
                learningRoadmap={learningRoadmap}
                activitySessions={activitySessions}
                careerAlignment={careerAlignment}
                learningInsights={learningInsights}
                onUpdateSkill={handleUpdateSkill}
                onAddSkill={handleAddDetailedSkill}
                onDeleteSkill={handleDeleteDetailedSkill}
                onToggleGoal={handleToggleGoal}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
                onToggleRoadmapTopic={handleToggleRoadmapTopic}
                onLogActivity={handleLogActivity}
                onRefreshInsights={handleRefreshLearningInsights}
                onUpdateTargetRole={handleUpdateTargetRole}
                isAnalyzing={isAnalyzingLearning}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesTrackerView
                user={user}
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                onUpdateBudget={handleUpdateBudget}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectIdeasView
                user={user}
                projectIdeas={projectIdeas}
                onSelectProjectForEvaluation={handleSelectIdeaForEvaluation}
                onUpdateProjectIdeas={setProjectIdeas}
              />
            )}

            {activeTab === 'evaluator' && (
              <ProjectEvaluator
                user={user}
                initialSubmission={selectedSubmissionForEval}
                onSaveEvaluation={handleSaveEvaluation}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesView
                user={user}
                resources={resources}
                onToggleResourceComplete={handleToggleResourceComplete}
              />
            )}

            {activeTab === 'roadmap' && (
              <CareerRoadmapView
                user={user}
                milestones={roadmapMilestones}
                onToggleTask={handleToggleRoadmapTask}
                onNavigateToEvaluator={() => {
                  setSelectedSubmissionForEval(null);
                  setActiveTab('evaluator');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Basic Data Entry Modal */}
      {dataEntryModalOpen && user && (
        <DataEntryModal
          user={user}
          monthlyBudget={monthlyBudget}
          onClose={() => setDataEntryModalOpen(false)}
          onUpdateUser={handleUpdateUserProfile}
          onAddSkill={handleAddSkill}
          onAddHistoricalScore={handleAddHistoricalScore}
          onUpdateBudget={handleUpdateBudget}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-900">PathPilot</span>
            <span className="mx-2">·</span>
            <span>Academic Growth, AI Learning Hub, Placement Hub, AI Career Copilot & Student Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setAuthInitialMode('register');
                setShowAuthView(true);
              }}
              className="hover:text-slate-900 transition-colors"
            >
              Test Registration Flow
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setDataEntryModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Data Entry
            </button>
          </div>
        </div>
      </footer>

      {/* Phase 5: Floating AI Career Copilot Trigger Button */}
      {user && !isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white rounded-full p-3.5 shadow-xl border border-slate-700 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95"
          title="Open AI Career Copilot"
        >
          <Bot className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold pr-1 hidden sm:inline">Ask Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Phase 5: Contextual AI Career Copilot Drawer */}
      {unifiedContext && (
        <AICopilotChatDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          context={unifiedContext}
          scores={intelligenceScores}
          nba={nextBestAction}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setIsCopilotOpen(false);
          }}
        />
      )}
    </div>
  );
}
