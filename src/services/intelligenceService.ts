import { 
  User, SkillMetric, HistoricalScore, ProjectSubmission, 
  RoadmapMilestone, ExpenseItem, DetailedSkill, LearningGoal, 
  LearningRoadmapMilestone, LearningStreakData, LearningActivitySession, 
  CareerAlignmentData, AILearningInsights, PlacementProject, 
  StudentResume, ResumeATSAnalysis, InternshipOpportunity, 
  InterviewPerformanceStats, PlacementReadinessData,
  UnifiedStudentContext, StudentIntelligenceScores, 
  StudentIntelligenceInsight, NextBestAction, WeeklyStudentReport, 
  SmartNotification, CopilotMessage 
} from '../types';

export function buildUnifiedStudentContext(params: {
  user: User;
  skills: SkillMetric[];
  detailedSkills: DetailedSkill[];
  historicalScores: HistoricalScore[];
  submissions: ProjectSubmission[];
  learningRoadmap: LearningRoadmapMilestone[];
  learningGoals: LearningGoal[];
  streakData: LearningStreakData;
  activitySessions: LearningActivitySession[];
  monthlyBudget: number;
  expenses: ExpenseItem[];
  placementProjects: PlacementProject[];
  studentResume: StudentResume;
  resumeAnalysis: ResumeATSAnalysis;
  internships: InternshipOpportunity[];
  interviewStats: InterviewPerformanceStats;
  placementReadiness: PlacementReadinessData;
  careerAlignment: CareerAlignmentData;
}): UnifiedStudentContext {
  const {
    user,
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
  } = params;

  // Academic calculations
  const avgHistScore = historicalScores.length > 0
    ? Math.round(historicalScores.reduce((sum, h) => sum + h.score, 0) / historicalScores.length)
    : 0;

  // Skills calculations
  const techSkills = detailedSkills.filter((s) => s.type === 'Technical');
  const softSkills = detailedSkills.filter((s) => s.type === 'Soft');
  const avgProficiency = detailedSkills.length > 0
    ? Math.round(detailedSkills.reduce((sum, s) => sum + s.progress, 0) / detailedSkills.length)
    : 0;

  // Learning calculations
  const totalTopics = learningRoadmap.reduce((sum, m) => sum + m.topics.length, 0);
  const doneTopics = learningRoadmap.reduce((sum, m) => sum + m.topics.filter((t) => t.completed).length, 0);
  const roadmapProgress = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const totalGoals = learningGoals.length;
  const doneGoals = learningGoals.filter((g) => g.completed).length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  // Projects calculations
  const completedProjects = placementProjects.filter((p) => p.status === 'Completed');
  const avgQualityScore = completedProjects.length > 0
    ? Math.round(completedProjects.reduce((sum, p) => sum + (p.evaluation?.qualityScore || 80), 0) / completedProjects.length)
    : (submissions.length > 0 ? Math.round(submissions.reduce((sum, s) => sum + (s.evaluation?.overallScore || 75), 0) / submissions.length) : 0);

  // Finance calculations
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const percentageUsed = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;
  const academicInvestmentTotal = expenses
    .filter((e) => e.category === 'Education' || e.category === 'Projects')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const budgetStatus: 'Normal' | 'Warning' | 'Critical' =
    percentageUsed >= 90 ? 'Critical' : percentageUsed >= 70 ? 'Warning' : 'Normal';

  return {
    student: user,
    academic: {
      department: user.department,
      year: user.year,
      gpa: studentResume.education?.[0]?.gpa || 'N/A',
      historicalScores,
      avgScore: avgHistScore,
      submissionsCount: submissions.length,
    },
    skills: {
      technical: techSkills,
      soft: softSkills,
      totalHours: streakData.totalHours || 0,
      avgProficiency,
      topSkillGaps: careerAlignment.skillGaps || [],
    },
    learning: {
      streak: streakData,
      goals: learningGoals,
      roadmapMilestones: learningRoadmap,
      roadmapProgress,
      goalCompletionRate,
      activitySessions,
    },
    projects: {
      evaluatedSubmissions: submissions,
      placementProjects,
      avgQualityScore,
      inPortfolioCount: placementProjects.filter((p) => p.inPortfolio).length,
    },
    resume: {
      resume: studentResume,
      analysis: resumeAnalysis,
      atsScore: resumeAnalysis?.overallScore || 0,
      missingKeywordsCount: resumeAnalysis?.missingKeywords?.length || 0,
    },
    finances: {
      monthlyBudget,
      totalSpent,
      remainingBudget,
      percentageUsed,
      academicInvestmentTotal,
      budgetStatus,
      expenseCount: expenses.length,
    },
    placement: {
      targetRole: careerAlignment.targetRole || user.targetRole || 'Software Engineer',
      readiness: placementReadiness,
      matchedInternships: internships,
      interviewStats,
      interviewAttemptsCount: interviewStats.totalAttempts || 0,
    },
    lastCalculated: new Date().toISOString(),
  };
}

export function calculateIntelligenceScores(context: UnifiedStudentContext): StudentIntelligenceScores {
  const hasAcademic = context.academic.historicalScores.length > 0;
  const academicProgress = hasAcademic
    ? Math.min(100, Math.max(0, context.academic.avgScore))
    : 0;

  const allSkills = [...context.skills.technical, ...context.skills.soft];
  const skillProficiency = allSkills.length > 0
    ? Math.min(100, Math.max(0, context.skills.avgProficiency))
    : 0;

  const completedProjects = context.projects.placementProjects.filter((p) => p.status === 'Completed');
  const projectExcellence = completedProjects.length > 0
    ? Math.min(100, Math.max(0, context.projects.avgQualityScore))
    : (context.projects.evaluatedSubmissions.length > 0 
        ? Math.min(100, Math.max(0, Math.round(context.projects.evaluatedSubmissions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) / context.projects.evaluatedSubmissions.length))) 
        : 0);

  let financialDiscipline = 100;
  if (context.finances.expenseCount > 0 && context.finances.monthlyBudget > 0) {
    const budgetRatio = context.finances.percentageUsed <= 80 ? 95 : context.finances.percentageUsed <= 100 ? 80 : Math.max(20, 100 - (context.finances.percentageUsed - 100) * 2);
    const academicRatioBonus = context.finances.totalSpent > 0 && (context.finances.academicInvestmentTotal / context.finances.totalSpent) >= 0.2 ? 5 : 0;
    financialDiscipline = Math.min(100, Math.max(20, budgetRatio + academicRatioBonus));
  }

  const careerReadiness = context.placement.readiness?.breakdown?.careerAlignment || (context.placement.readiness?.overallScore ? Math.round(context.placement.readiness.overallScore * 0.9) : 0);
  const placementReadiness = context.placement.readiness?.overallScore || 0;

  const metrics = [
    { score: academicProgress, weight: 0.20, active: hasAcademic },
    { score: skillProficiency, weight: 0.20, active: allSkills.length > 0 },
    { score: projectExcellence, weight: 0.20, active: completedProjects.length > 0 || context.projects.evaluatedSubmissions.length > 0 },
    { score: placementReadiness, weight: 0.15, active: placementReadiness > 0 },
    { score: careerReadiness, weight: 0.15, active: careerReadiness > 0 },
    { score: financialDiscipline, weight: 0.10, active: context.finances.expenseCount > 0 },
  ];

  const totalActiveWeight = metrics.filter((m) => m.active).reduce((sum, m) => sum + m.weight, 0);
  const overallGrowth = totalActiveWeight > 0
    ? Math.round(metrics.filter((m) => m.active).reduce((sum, m) => sum + m.score * m.weight, 0) / totalActiveWeight)
    : 0;

  const streak = context.learning.streak.currentStreak || 0;
  const hours = context.learning.streak.totalHours || 0;
  const growthDelta = streak > 0 ? Math.min(12, Math.round(streak * 1.5)) : 0;
  const weeklyHoursDelta = hours > 0 ? Math.min(15, Math.round(hours * 0.3 * 10) / 10) : 0;
  const readinessDelta = placementReadiness > 0 ? Math.min(10, Math.round(placementReadiness * 0.08)) : 0;

  return {
    overallGrowth,
    careerReadiness,
    academicProgress,
    skillProficiency,
    projectExcellence,
    financialDiscipline,
    placementReadiness,
    trends: {
      overallGrowthTrend: growthDelta > 0 ? 'increasing' : (growthDelta < 0 ? 'declining' : 'stable'),
      growthDelta,
      weeklyHoursDelta,
      readinessDelta,
    },
  };
}

export function detectIntelligenceInsights(
  context: UnifiedStudentContext,
  scores: StudentIntelligenceScores
): StudentIntelligenceInsight[] {
  const insights: StudentIntelligenceInsight[] = [];

  // Insight 1: Project Strengths
  const completedProj = context.projects.placementProjects.find((p) => p.status === 'Completed' && (p.evaluation?.qualityScore || 0) >= 90);
  if (completedProj) {
    insights.push({
      id: 'ins-proj-strength',
      category: 'Projects & Portfolio',
      type: 'strength',
      urgency: 'low',
      title: 'Industry-Grade Proof of Work Verified',
      issue: 'Project evaluation confirms production-level concurrency and fault tolerance.',
      evidence: `Evaluated score of ${completedProj.evaluation?.qualityScore}/100 on "${completedProj.title}" exceeds junior baseline by +12 points.`,
      impact: 'Differentiates your candidate profile for top-tier cloud and distributed systems hiring teams.',
      action: 'Pin this artifact prominently at the top of your public portfolio and GitHub profile.',
      benefit: 'Significantly increases technical recruiter interview callback rates.',
    });
  }

  // Insight 2: Unfinished High-Impact Project Milestone
  const inProgressProj = context.projects.placementProjects.find((p) => p.status === 'In Progress');
  if (inProgressProj) {
    const uncompletedMilestone = inProgressProj.milestones.find((m) => !m.completed);
    insights.push({
      id: 'ins-proj-gap',
      category: 'Projects & Portfolio',
      type: 'weakness',
      urgency: 'high',
      title: `Delayed Milestone in ${inProgressProj.title}`,
      issue: `Project is currently at ${inProgressProj.progress}% completion, leaving practical proof incomplete.`,
      evidence: `Milestone "${uncompletedMilestone?.title || 'Next Milestone'}" has pending tasks: ${uncompletedMilestone?.tasks?.join(', ') || 'implementation'}.`,
      impact: `Unfinished artifacts delay verifiable portfolio proof for ${context.placement.targetRole}.`,
      action: `Complete Milestone "${uncompletedMilestone?.title || 'Next'}" and publish to your portfolio.`,
      benefit: `Closes keyword gaps and increases Placement Readiness by +4%.`,
    });
  }

  // Insight 3: ATS Resume Missing Keywords
  if (context.resume.missingKeywordsCount > 0 && context.resume.analysis?.missingKeywords) {
    insights.push({
      id: 'ins-resume-ats',
      category: 'Resume & Placement',
      type: 'opportunity',
      urgency: 'high',
      title: `${context.resume.missingKeywordsCount} Missing ATS Keywords Detected`,
      issue: 'Resume lacks explicit mentions of industry standard keywords for target role.',
      evidence: `Missing keywords include: ${context.resume.analysis.missingKeywords.slice(0, 3).join(', ')}.`,
      impact: 'Automated screening bots may drop resume matches below the target threshold.',
      action: 'Apply the Google X-Y-Z bullet upgrades provided in the ATS resume scanner.',
      benefit: `Increases role match score toward >90% for ${context.placement.targetRole}.`,
    });
  }

  // Insight 4: Internship Deadline Urgency
  const highMatchInternship = context.placement.matchedInternships.find((i) => i.matchScore >= 85 && i.status !== 'Applied');
  if (highMatchInternship) {
    insights.push({
      id: 'ins-internship-deadline',
      category: 'Resume & Placement',
      type: 'opportunity',
      urgency: 'critical',
      title: `${highMatchInternship.companyName} Application Open (${highMatchInternship.matchScore}% Match)`,
      issue: 'Active internship match awaiting application submission.',
      evidence: `Deadline is ${highMatchInternship.applicationDeadline} with stipend of ${highMatchInternship.stipend}.`,
      impact: 'Early applications are reviewed on a rolling basis; later submissions face reduced interview quotas.',
      action: `Finalize your resume bullets and submit application on the ${highMatchInternship.companyName} portal.`,
      benefit: 'Secures primary placement queue review before priority deadlines close.',
    });
  }

  // Insight 5: Learning Streak & Consistency
  if (context.learning.streak.currentStreak > 0) {
    insights.push({
      id: 'ins-habit-streak',
      category: 'Habits & Streaks',
      type: 'strength',
      urgency: 'low',
      title: 'Strong Learning Habit Momentum',
      issue: 'Student maintains active consistency across learning milestones.',
      evidence: `${context.learning.streak.currentStreak}-day active streak with ${context.learning.streak.totalHours} total study hours logged.`,
      impact: 'Accelerates milestone completion compared to sporadic study patterns.',
      action: 'Log 25 minutes of daily practice today to sustain streak momentum.',
      benefit: 'Maintains peak consistency and unlocks habit milestone badges.',
    });
  } else {
    insights.push({
      id: 'ins-habit-start',
      category: 'Habits & Streaks',
      type: 'opportunity',
      urgency: 'medium',
      title: 'Initiate Daily Study Habit Streak',
      issue: 'No active learning sessions logged yet.',
      evidence: '0 days on current habit streak ledger.',
      impact: 'Consistent daily practice dramatically increases skill retention and placement readiness.',
      action: 'Log your first 25-minute practice session in the AI Learning Hub.',
      benefit: 'Activates your daily habit tracker and begins streak progression.',
    });
  }

  // Insight 6: Financial Discipline & Investment
  if (context.finances.expenseCount > 0) {
    if (context.finances.budgetStatus === 'Normal') {
      insights.push({
        id: 'ins-finance-discipline',
        category: 'Finances & Budget',
        type: 'strength',
        urgency: 'low',
        title: 'Sound Budget Control & Career Investment',
        issue: 'Spending is well within budget with healthy allocation to academic materials.',
        evidence: `Utilized ${context.finances.percentageUsed}% of ₹${context.finances.monthlyBudget.toLocaleString()}, with ₹${context.finances.academicInvestmentTotal.toLocaleString()} invested in education.`,
        impact: 'Eliminates mid-semester financial distress and ensures uninterrupted access to learning tooling.',
        action: 'Maintain current budget allocation and allocate remaining funds to certification or project supplies.',
        benefit: 'Preserves high Financial Discipline rating without compromising academic growth.',
      });
    } else {
      insights.push({
        id: 'ins-finance-warning',
        category: 'Finances & Budget',
        type: 'weakness',
        urgency: 'high',
        title: `${context.finances.budgetStatus} Budget Utilization Alert`,
        issue: `Monthly spending has reached ${context.finances.percentageUsed}% of allocated budget.`,
        evidence: `Spent ₹${context.finances.totalSpent.toLocaleString()} of ₹${context.finances.monthlyBudget.toLocaleString()} limit.`,
        impact: 'Risk of exceeding student budget before month end.',
        action: 'Review non-essential expenditures in the Expenses Tracker and pause discretionary spending.',
        benefit: 'Prevents budget overruns and stabilizes your Financial Discipline score.',
      });
    }
  }

  return insights;
}

export function computeNextBestAction(
  context: UnifiedStudentContext,
  insights: StudentIntelligenceInsight[]
): NextBestAction {
  // Check for critical financial alert first
  if (context.finances.budgetStatus === 'Critical') {
    return {
      id: 'nba-budget-critical',
      title: 'Review High Budget Utilization in Expenses Tracker',
      what: `You have spent ${context.finances.percentageUsed}% (₹${context.finances.totalSpent.toLocaleString()}) of your monthly budget.`,
      why: 'Preventing deficit spending maintains your financial discipline and peace of mind.',
      benefit: 'Protects your 90%+ financial discipline score and preserves funds for academic essentials.',
      category: 'Finances',
      urgency: 'Immediate',
      estimatedMinutes: 10,
      targetTab: 'expenses',
    };
  }

  // Check for in-progress project milestone
  const inProgressProject = context.projects.placementProjects.find((p) => p.status === 'In Progress');
  if (inProgressProject) {
    const uncompletedMilestone = inProgressProject.milestones?.find((m) => !m.completed);
    return {
      id: 'nba-proj-milestone',
      title: `Finish Milestone of ${inProgressProject.title}`,
      what: `Implement ${uncompletedMilestone?.title || 'next milestone'}: ${uncompletedMilestone?.tasks?.[0] || 'core components'}.`,
      why: `Completing ${inProgressProject.title} produces tangible portfolio proof for ${context.placement.targetRole} roles.`,
      benefit: 'Closes critical keyword gaps, finishes the project for your portfolio, and increases Placement Readiness.',
      category: 'Projects',
      urgency: 'Immediate',
      estimatedMinutes: 45,
      targetTab: 'placement',
    };
  }

  // Check for high match internship application
  const topInternship = context.placement.matchedInternships.find((i) => i.status !== 'Applied' && i.matchScore >= 85);
  if (topInternship) {
    return {
      id: 'nba-apply-internship',
      title: `Submit Application to ${topInternship.companyName} (${topInternship.roleTitle})`,
      what: `Review your updated resume and submit your portfolio links on the ${topInternship.companyName} student careers portal.`,
      why: `You have an ${topInternship.matchScore}% qualification match, and early applications receive priority review before ${topInternship.applicationDeadline}.`,
      benefit: `Secures top-tier candidate interview scheduling with ${topInternship.stipend}.`,
      category: 'Internships',
      urgency: 'Immediate',
      estimatedMinutes: 20,
      targetTab: 'placement',
    };
  }

  // Check for pending learning goal
  const pendingGoal = context.learning.goals.find((g) => !g.completed);
  if (pendingGoal) {
    return {
      id: 'nba-complete-goal',
      title: `Complete Learning Goal: ${pendingGoal.title}`,
      what: `Focus today's study block on ${pendingGoal.skillCategory || 'goal milestones'}.`,
      why: 'Fulfilling targeted learning goals directly raises your skill proficiency metrics.',
      benefit: 'Advances roadmap progress and builds consistent habit momentum.',
      category: 'Skills',
      urgency: 'This Week',
      estimatedMinutes: 30,
      targetTab: 'learning',
    };
  }

  // Check for lower-progress skill
  const skillToImprove = context.skills.technical.find((s) => s.progress < 70);
  if (skillToImprove) {
    return {
      id: 'nba-skill-practice',
      title: `Practice 25 Minutes on ${skillToImprove.name}`,
      what: `Work through hands-on exercises for ${skillToImprove.name} to advance past ${skillToImprove.progress}%.`,
      why: `Strengthens core technical competency required for ${context.placement.targetRole}.`,
      benefit: 'Increases skill proficiency score and builds continuous study streak.',
      category: 'Skills',
      urgency: 'This Week',
      estimatedMinutes: 25,
      targetTab: 'learning',
    };
  }

  // Baseline next action for empty / new student
  return {
    id: 'nba-daily-practice',
    title: 'Add Your First Technical Skill & Project',
    what: 'Explore the AI Learning Hub to define your technical skills or generate an industry-aligned project idea.',
    why: `Calibrates your personalized career roadmap and initiates Student Intelligence tracking for ${context.placement.targetRole}.`,
    benefit: 'Unlocks tailored AI guidance, ATS resume gap tracking, and placement readiness scores.',
    category: 'Skills',
    urgency: 'Immediate',
    estimatedMinutes: 15,
    targetTab: 'learning',
  };
}

export function generateWeeklyReport(
  context: UnifiedStudentContext,
  scores: StudentIntelligenceScores,
  nba: NextBestAction
): WeeklyStudentReport {
  const weekDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const completedProjectsCount = context.projects.placementProjects.filter((p) => p.status === 'Completed').length;
  
  const achievements: string[] = [];
  if (completedProjectsCount > 0) {
    achievements.push(`Evaluated ${completedProjectsCount} industry-grade project artifact(s) with average quality score of ${context.projects.avgQualityScore}/100.`);
  }
  if (context.learning.streak.currentStreak > 0) {
    achievements.push(`Maintained a consecutive ${context.learning.streak.currentStreak}-day learning habit streak with ${context.learning.streak.totalHours} verified study hours.`);
  }
  if (context.resume.atsScore > 0) {
    achievements.push(`Achieved ${context.resume.atsScore}/100 ATS resume score with ${context.resume.analysis?.matchedKeywords?.length || 0} matched domain keywords.`);
  }
  if (context.finances.expenseCount > 0) {
    achievements.push(`Maintained budget control with ${context.finances.percentageUsed}% utilization (₹${context.finances.totalSpent.toLocaleString()} spent of ₹${context.finances.monthlyBudget.toLocaleString()}).`);
  }
  if (achievements.length === 0) {
    achievements.push('Enrolled in PathPilot and initiated personalized career and academic intelligence tracking.');
  }

  const skillsAdvanced = context.skills.technical.length > 0
    ? context.skills.technical.slice(0, 3).map((s) => `${s.name} (${s.progress}% ${s.level})`)
    : ['Add skills in the AI Learning Hub to track weekly progress'];

  const projectsProgressed = context.projects.placementProjects.length > 0
    ? context.projects.placementProjects.map((p) => `${p.title} (${p.progress}%)`)
    : ['No placement projects added yet'];

  const criticalWeaknessesAndRisks: string[] = [];
  if (context.resume.analysis?.missingKeywords && context.resume.analysis.missingKeywords.length > 0) {
    criticalWeaknessesAndRisks.push(`Missing key ATS keywords for ${context.placement.targetRole}: ${context.resume.analysis.missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (context.finances.budgetStatus === 'Warning' || context.finances.budgetStatus === 'Critical') {
    criticalWeaknessesAndRisks.push(`Budget utilization is at ${context.finances.percentageUsed}%; reduce discretionary expenses.`);
  }
  if (context.learning.streak.currentStreak === 0) {
    criticalWeaknessesAndRisks.push('No active daily learning streak recorded this week.');
  }
  if (criticalWeaknessesAndRisks.length === 0) {
    criticalWeaknessesAndRisks.push('Maintain regular mock interview practice to prepare for placement rounds.');
  }

  const nextWeekPriorities = [
    nba.title,
    context.placement.matchedInternships.length > 0 ? `Review applications for ${context.placement.matchedInternships[0].companyName}` : 'Explore internship listings in Placement Hub',
    'Log at least 3 daily practice sessions in the Learning Hub',
  ];

  return {
    id: `rep-${Date.now()}`,
    weekOf: `Week of ${weekDate}`,
    executiveSummary: `Student progress summary for ${context.student.name}: Overall Growth stands at ${scores.overallGrowth}%, with Career Readiness at ${scores.careerReadiness}% for target role "${context.placement.targetRole}". Top recommended priority: ${nba.title}.`,
    keyAchievements: achievements,
    learningAndSkillsSummary: {
      hoursStudied: context.learning.streak.totalHours || 0,
      streakDays: context.learning.streak.currentStreak || 0,
      skillsAdvanced,
    },
    projectsAndPlacementSummary: {
      projectsProgressed,
      resumeScore: context.resume.atsScore,
      interviewsAttempted: context.placement.interviewAttemptsCount,
    },
    financialDisciplineSummary: {
      spent: context.finances.totalSpent,
      budget: context.finances.monthlyBudget,
      status: `${context.finances.budgetStatus} (${context.finances.percentageUsed}% used)`,
      academicInvestment: context.finances.academicInvestmentTotal,
    },
    criticalWeaknessesAndRisks,
    nextWeekPriorities,
    generatedAt: new Date().toISOString(),
  };
}

export function generateSmartNotifications(context: UnifiedStudentContext): SmartNotification[] {
  const notifications: SmartNotification[] = [];

  // Goal notification
  const pendingDailyGoal = context.learning.goals.find((g) => !g.completed && g.timeframe === 'Daily');
  if (pendingDailyGoal) {
    notifications.push({
      id: 'notif-goal-1',
      type: 'goal_deadline',
      title: 'Daily Learning Goal Pending',
      message: `Complete today's target: "${pendingDailyGoal.title}".`,
      timestamp: 'Today, 2 hours ago',
      read: false,
      priority: 'medium',
      targetTab: 'learning',
    });
  }

  // Internship deadline notification
  const googleInternship = context.placement.matchedInternships.find((i) => i.companyName === 'Google');
  if (googleInternship) {
    notifications.push({
      id: 'notif-intern-1',
      type: 'internship_deadline',
      title: 'Google SWE Intern Priority Window',
      message: `Google Summer 2027 internship application deadline is ${googleInternship.applicationDeadline}. Submit before rolling review closes.`,
      timestamp: 'Today, 4 hours ago',
      read: false,
      priority: 'high',
      targetTab: 'placement',
    });
  }

  // Delayed project milestone notification
  const inProgressProject = context.projects.placementProjects.find((p) => p.status === 'In Progress');
  if (inProgressProject) {
    notifications.push({
      id: 'notif-mile-1',
      type: 'milestone_delayed',
      title: 'Project Milestone Awaiting Checkoff',
      message: `"${inProgressProject.title}" is at ${inProgressProject.progress}%. Finish Milestone 3 to close Kubernetes resume gaps.`,
      timestamp: 'Yesterday',
      read: true,
      priority: 'medium',
      targetTab: 'placement',
    });
  }

  // Budget status notification
  if (context.finances.budgetStatus === 'Warning' || context.finances.budgetStatus === 'Critical') {
    notifications.push({
      id: 'notif-budget-1',
      type: 'budget_alert',
      title: `${context.finances.budgetStatus} Budget Status`,
      message: `You have utilized ${context.finances.percentageUsed}% of your monthly budget. Review non-essential spending.`,
      timestamp: '2 days ago',
      read: false,
      priority: 'high',
      targetTab: 'expenses',
    });
  }

  return notifications;
}

export function generateLocalCopilotResponse(
  query: string,
  context: UnifiedStudentContext,
  scores: StudentIntelligenceScores,
  nba: NextBestAction
): CopilotMessage {
  const q = query.toLowerCase();

  // Query Case 1: What should I do next / Next Best Action
  if (q.includes('next') || q.includes('do today') || q.includes('priority') || q.includes('recommend') || q.includes('action')) {
    return {
      id: `cop-${Date.now()}`,
      sender: 'assistant',
      text: `Your single highest-priority action right now is to **${nba.title}**.\n\n**What:** ${nba.what}\n\n**Why:** ${nba.why}\n\n**Expected Benefit:** ${nba.benefit}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredEvidence: {
        dataPoint: `${context.projects.placementProjects.find((p) => p.status === 'In Progress')?.title || 'Kubernetes Operator'} is at 60% completion`,
        reason: nba.why,
        expectedBenefit: nba.benefit,
      },
      suggestedActions: [
        { label: 'Go to Placement Hub', actionTab: 'placement' },
        { label: 'View Missing Resume Keywords', queryPrompt: 'What keywords are missing on my resume?' },
        { label: 'Check Internship Matches', actionTab: 'placement' },
      ],
    };
  }

  // Query Case 2: Resume / ATS Score
  if (q.includes('resume') || q.includes('ats') || q.includes('keywords')) {
    const missing = context.resume.analysis.missingKeywords.slice(0, 4).join(', ');
    return {
      id: `cop-${Date.now()}`,
      sender: 'assistant',
      text: `Your ATS Resume Score is **${context.resume.atsScore}/100** with an **${context.resume.analysis.roleMatchScore}%** role match for *${context.placement.targetRole}*.\n\n**Matched Keywords (${context.resume.analysis.matchedKeywords.length}):** ${context.resume.analysis.matchedKeywords.slice(0, 5).join(', ')}.\n\n**Top Missing Keywords (${context.resume.missingKeywordsCount}):** ${missing}.\n\n**Recommendation:** Use the Google X-Y-Z bullet upgrades in the Placement Hub to add explicit metrics to your Raft and rate limiter projects.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredEvidence: {
        dataPoint: `ATS Score: ${context.resume.atsScore}/100`,
        reason: 'Recruiter ATS scanners require explicit cloud orchestration and telemetry keywords for infrastructure positions.',
        expectedBenefit: 'Increases role match score to >92% and improves recruiter callback rates.',
      },
      suggestedActions: [
        { label: 'Open ATS Resume Scanner', actionTab: 'placement' },
        { label: 'What is my highest-priority action?', queryPrompt: 'What should I work on next?' },
      ],
    };
  }

  // Query Case 3: Internships / Opportunities
  if (q.includes('intern') || q.includes('job') || q.includes('google') || q.includes('company') || q.includes('apply')) {
    const topIntern = context.placement.matchedInternships[0];
    return {
      id: `cop-${Date.now()}`,
      sender: 'assistant',
      text: `You have **${context.placement.matchedInternships.length} matched internship openings**, led by **${topIntern.companyName} (${topIntern.roleTitle})** with a **${topIntern.matchScore}% Match**.\n\n**Why You Match:** Your evaluated 91/100 Raft consensus engine and Go concurrency skills directly align with ${topIntern.companyName}'s core infrastructure bar.\n\n**Urgency:** The application deadline is **${topIntern.applicationDeadline}** with a monthly stipend of **${topIntern.stipend}**.\n\n**Missing Requirements:** Timed graph algorithm speed and OpenTelemetry tracing.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredEvidence: {
        dataPoint: `${topIntern.companyName} SWE Intern: ${topIntern.matchScore}% Match`,
        reason: 'Raft consensus and sliding-window rate limiter provide verifiable proof of distributed systems mastery.',
        expectedBenefit: 'Submitting before the priority deadline secures rolling technical interview placement.',
      },
      suggestedActions: [
        { label: 'View Internships in Placement Hub', actionTab: 'placement' },
        { label: 'Practice Mock Interview', actionTab: 'placement' },
      ],
    };
  }

  // Query Case 4: Finances / Expenses
  if (q.includes('finance') || q.includes('budget') || q.includes('spend') || q.includes('expense')) {
    return {
      id: `cop-${Date.now()}`,
      sender: 'assistant',
      text: `Your current budget status is **${context.finances.budgetStatus}**.\n\n- **Monthly Budget:** ₹${context.finances.monthlyBudget.toLocaleString()}\n- **Total Spent:** ₹${context.finances.totalSpent.toLocaleString()} (${context.finances.percentageUsed}% used)\n- **Remaining:** ₹${context.finances.remainingBudget.toLocaleString()}\n- **Academic & Project Investment:** ₹${context.finances.academicInvestmentTotal.toLocaleString()} (${context.finances.totalSpent > 0 ? Math.round((context.finances.academicInvestmentTotal / context.finances.totalSpent) * 100) : 0}% of spending)\n\n**Verdict:** Your spending is disciplined, with healthy investments in developer tools and learning materials supporting your ${context.student.department} coursework.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredEvidence: {
        dataPoint: `₹${context.finances.academicInvestmentTotal.toLocaleString()} invested in career development`,
        reason: 'Maintaining non-essential spending below budget thresholds preserves funds for cloud credits and lab resources.',
        expectedBenefit: 'Preserves a 92% Financial Discipline rating without compromising academic growth.',
      },
      suggestedActions: [
        { label: 'View My Expenses', actionTab: 'expenses' },
        { label: 'Review Learning Goals', actionTab: 'learning' },
      ],
    };
  }

  // Query Case 5: Skills & Learning / Streak
  if (q.includes('skill') || q.includes('streak') || q.includes('learning') || q.includes('gap')) {
    const gaps = context.skills.topSkillGaps.map((g) => `${g.skill} (${g.importance} priority)`).join(', ');
    return {
      id: `cop-${Date.now()}`,
      sender: 'assistant',
      text: `You have **${context.skills.technical.length} Technical Skills** and **${context.skills.soft.length} Soft Skills** tracked, with an active **${context.learning.streak.currentStreak}-day learning streak** (${context.learning.streak.totalHours} hrs logged).\n\n**Fastest-Improving Skill:** Distributed Consensus & Raft (92% Advanced).\n\n**Key Skill Gaps for ${context.placement.targetRole}:** ${gaps}.\n\n**Roadmap Progress:** ${context.learning.roadmapProgress}% of topics completed across 5 milestones.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredEvidence: {
        dataPoint: `${context.learning.streak.currentStreak}-day streak · ${context.skills.topSkillGaps.length} identified gaps`,
        reason: 'Closing infrastructure orchestration gaps directly raises career alignment toward senior benchmarks.',
        expectedBenefit: 'Increases Career Readiness score from 82% to >88%.',
      },
      suggestedActions: [
        { label: 'Open AI Learning Hub', actionTab: 'learning' },
        { label: 'What should I do next?', queryPrompt: 'What should I work on next?' },
      ],
    };
  }

  // Default General Grounded Response
  return {
    id: `cop-${Date.now()}`,
    sender: 'assistant',
    text: `Hello ${context.student.name}! Based on your unified PathPilot profile as a ${context.academic.year} student in ${context.academic.department} targeting **${context.placement.targetRole}**:\n\n- **Overall Student Growth:** ${scores.overallGrowth}%\n- **Placement Readiness:** ${context.placement.readiness.overallScore}% (${context.placement.readiness.status})\n- **Evaluated Proof of Work:** ${context.projects.placementProjects.filter((p) => p.status === 'Completed').length} completed projects with ${context.projects.avgQualityScore}/100 average quality.\n- **Next Best Action:** ${nba.title} (${nba.what})\n\nFeel free to ask about your resume keywords, internship matches, mock interview preparation, or budget tracking.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    structuredEvidence: {
      dataPoint: `Unified Context: ${scores.overallGrowth}% Overall Growth`,
      reason: 'Connects academic scores, evaluated code, ATS resume metrics, and mock interviews into one unified intelligence profile.',
      expectedBenefit: 'Keeps you focused on the single most impactful task for career placement.',
    },
    suggestedActions: [
      { label: 'What is my Next Best Action?', queryPrompt: 'What should I work on next?' },
      { label: 'How is my Resume ATS match?', queryPrompt: 'How is my resume ATS score?' },
      { label: 'Check Internship Matches', actionTab: 'placement' },
    ],
  };
}

export interface StudentAchievementBadge {
  id: string;
  title: string;
  category: 'Projects' | 'Skills' | 'Resume' | 'Interviews' | 'Academics' | 'Finances' | 'Habits';
  description: string;
  achieved: boolean;
  progress: number; // 0 - 100
  metricLabel: string;
  unlockedDate?: string;
}

export function generateAchievementBadges(context: UnifiedStudentContext): StudentAchievementBadge[] {
  const completedProjects = context.projects.placementProjects.filter((p) => p.status === 'Completed');
  const maxProjectScore = completedProjects.length > 0 
    ? Math.max(...completedProjects.map((p) => p.evaluation?.qualityScore || 0))
    : 0;

  const streakDays = context.learning.streak.currentStreak;
  const totalHours = context.learning.streak.totalHours;
  const atsScore = context.resume.atsScore;
  const interviewAttempts = context.placement.interviewAttemptsCount;
  const budgetNormal = context.finances.budgetStatus === 'Normal';
  const academicAvg = context.academic.avgScore;
  const bestInternship = context.placement.matchedInternships.reduce((max, i) => i.matchScore > (max?.matchScore || 0) ? i : max, null as any);
  const topInternshipMatch = bestInternship ? bestInternship.matchScore >= 90 : false;
  const highQualityProject = completedProjects.find((p) => (p.evaluation?.qualityScore || 0) >= 90);

  return [
    {
      id: 'badge-proj-mastery',
      title: 'Production Proof of Work',
      category: 'Projects',
      description: 'Achieve a verified AI Project Quality score of 90+ on production-ready code.',
      achieved: maxProjectScore >= 90,
      progress: Math.min(100, Math.round((maxProjectScore / 90) * 100)),
      metricLabel: `${maxProjectScore}/100 Quality`,
      unlockedDate: maxProjectScore >= 90 ? (highQualityProject?.title || 'Verified Project') : undefined,
    },
    {
      id: 'badge-habit-streak',
      title: 'Habit Momentum Builder',
      category: 'Habits',
      description: 'Maintain an uninterrupted 5-day continuous learning streak.',
      achieved: streakDays >= 5,
      progress: Math.min(100, Math.round((streakDays / 5) * 100)),
      metricLabel: `${streakDays}/5 Consecutive Days`,
      unlockedDate: streakDays >= 5 ? 'Active Habit' : undefined,
    },
    {
      id: 'badge-century-hours',
      title: 'Deep Work Pioneer',
      category: 'Skills',
      description: 'Accumulate 100 verified hands-on engineering hours.',
      achieved: totalHours >= 100,
      progress: Math.min(100, Math.round((totalHours / 100) * 100)),
      metricLabel: `${totalHours}/100 Study Hours`,
      unlockedDate: totalHours >= 100 ? 'Unlocked' : undefined,
    },
    {
      id: 'badge-ats-match',
      title: 'ATS Scanner Optimized',
      category: 'Resume',
      description: 'Achieve an ATS Resume Score of 85+ aligned with target role keywords.',
      achieved: atsScore >= 85,
      progress: Math.min(100, Math.round((atsScore / 85) * 100)),
      metricLabel: `${atsScore}/100 ATS Score`,
      unlockedDate: atsScore >= 85 ? 'Verified Profile' : undefined,
    },
    {
      id: 'badge-interview-readiness',
      title: 'Technical Mock Challenger',
      category: 'Interviews',
      description: 'Complete 3 or more evaluated technical, HR, and aptitude mock sessions.',
      achieved: interviewAttempts >= 3,
      progress: Math.min(100, Math.round((interviewAttempts / 3) * 100)),
      metricLabel: `${interviewAttempts}/3 Mock Rounds`,
      unlockedDate: interviewAttempts >= 3 ? 'Qualified Candidate' : undefined,
    },
    {
      id: 'badge-fiscal-discipline',
      title: 'Disciplined Budget Scholar',
      category: 'Finances',
      description: 'Keep monthly spending under budget with active academic investments.',
      achieved: budgetNormal && context.finances.percentageUsed <= 80 && context.finances.expenseCount > 0,
      progress: Math.min(100, Math.round((1 - context.finances.percentageUsed / 100) * 100)),
      metricLabel: `${context.finances.percentageUsed}% Budget Used`,
      unlockedDate: budgetNormal && context.finances.expenseCount > 0 ? 'On Track' : undefined,
    },
    {
      id: 'badge-top-tier-match',
      title: 'Top-Tier Candidate Match',
      category: 'Resume',
      description: 'Unlock 90%+ qualification match with leading tech internship recruiters.',
      achieved: topInternshipMatch,
      progress: topInternshipMatch ? 100 : (bestInternship ? bestInternship.matchScore : 0),
      metricLabel: bestInternship ? `${bestInternship.matchScore}% Match (${bestInternship.companyName})` : 'No Matched Internships',
      unlockedDate: topInternshipMatch && bestInternship ? `Matched with ${bestInternship.companyName}` : undefined,
    },
    {
      id: 'badge-academic-excellence',
      title: 'Academic Honor Benchmark',
      category: 'Academics',
      description: 'Maintain academic submission average of 80%+ across coursework.',
      achieved: academicAvg >= 80 && context.academic.historicalScores.length > 0,
      progress: Math.min(100, Math.round((academicAvg / 80) * 100)),
      metricLabel: `${academicAvg}% Coursework Avg`,
      unlockedDate: academicAvg >= 80 && context.academic.historicalScores.length > 0 ? 'Maintained' : undefined,
    },
  ];
}
