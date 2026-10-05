import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { ai } from './ai.ts';
import { authMiddleware, generateToken, sanitizeUser, type AuthenticatedRequest } from './auth.ts';
import type { 
  DetailedSkill, LearningGoal, LearningActivitySession, ExpenseItem, 
  PlacementProject, StudentResume, ResumeATSAnalysis, InternshipOpportunity, 
  InterviewAttempt, InterviewPerformanceStats, PlacementReadinessData, 
  ProjectSubmission, HistoricalScore, SmartNotification, SkillMetric,
  RoadmapMilestone, CopilotMessage, WeeklyStudentReport,
  ResumeVersion, ResumeMissingField, ResumeGenerationResponse
} from '../src/types.ts';

export const apiRouter = Router();

// ==========================================
// Authentication Routes
// ==========================================

// Register
apiRouter.post('/auth/register', (req, res) => {
  const { name, email, password, confirmPassword, department, year } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full student name is required.' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (!department || !year) {
    return res.status(400).json({ error: 'Department and academic year are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
  }

  const { user, studentData } = db.createUser({
    name,
    email,
    password,
    department,
    year,
  });

  const token = generateToken(user);

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
    isNewUser: true,
    studentData,
  });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  const studentData = db.getStudentData(user.id);

  return res.json({
    token,
    user: sanitizeUser(user),
    isNewUser: !user.interest,
    studentData,
  });
});

// Forgot / Reset Password
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.updateUser(user.id, { passwordHash });

  return res.json({
    message: 'Password reset successfully. You can now sign in with your new password.',
  });
});

// Get Current User Profile
apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    user: sanitizeUser(req.user!),
  });
});

// Logout
apiRouter.post('/auth/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully.' });
});

// ==========================================
// Student Data & Persistence Routes
// ==========================================

// Get All Student Data (Single Source of Truth)
apiRouter.get('/student/data', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const data = db.getStudentData(userId);

  if (!data) {
    return res.status(404).json({ error: 'Student records not found.' });
  }

  return res.json({
    user: sanitizeUser(req.user!),
    studentData: data,
  });
});

// Update Onboarding Interest & Target Role
apiRouter.put('/student/onboarding', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { interest, targetRole } = req.body;

  if (!interest) {
    return res.status(400).json({ error: 'Interest / specialization is required.' });
  }

  const updatedUser = db.updateUser(userId, {
    interest,
    targetRole: targetRole || req.user!.targetRole || 'Software Engineer',
  });

  const studentData = db.getStudentData(userId);
  if (studentData) {
    studentData.careerAlignment.targetRole = targetRole || req.user!.targetRole || 'Software Engineer';
    studentData.studentResume.targetRole = targetRole || req.user!.targetRole || 'Software Engineer';
    db.updateStudentData(userId, studentData);
  }

  return res.json({
    user: sanitizeUser(updatedUser!),
    studentData,
  });
});

// Update Profile
apiRouter.put('/student/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, department, year, interest, targetRole } = req.body;

  const updatedUser = db.updateUser(userId, {
    ...(name ? { name: name.trim() } : {}),
    ...(department ? { department } : {}),
    ...(year ? { year } : {}),
    ...(interest ? { interest } : {}),
    ...(targetRole ? { targetRole } : {}),
  });

  return res.json({
    user: sanitizeUser(updatedUser!),
  });
});

// Skills CRUD
apiRouter.post('/student/skills', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { skill } = req.body as { skill: DetailedSkill };

  if (!skill || !skill.name) {
    return res.status(400).json({ error: 'Skill details are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  const existingIdx = data.detailedSkills.findIndex((s) => s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase());
  if (existingIdx >= 0) {
    data.detailedSkills[existingIdx] = { ...data.detailedSkills[existingIdx], ...skill };
  } else {
    data.detailedSkills.unshift(skill);
  }

  db.updateStudentData(userId, { detailedSkills: data.detailedSkills });
  return res.json({ detailedSkills: data.detailedSkills });
});

apiRouter.delete('/student/skills/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.detailedSkills = data.detailedSkills.filter((s) => s.id !== id);
  db.updateStudentData(userId, { detailedSkills: data.detailedSkills });

  return res.json({ detailedSkills: data.detailedSkills });
});

// Learning Goals CRUD
apiRouter.post('/student/goals', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { goal } = req.body as { goal: LearningGoal };

  if (!goal || !goal.title) {
    return res.status(400).json({ error: 'Goal data is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  const existingIdx = data.learningGoals.findIndex((g) => g.id === goal.id);
  if (existingIdx >= 0) {
    data.learningGoals[existingIdx] = { ...data.learningGoals[existingIdx], ...goal };
  } else {
    data.learningGoals.unshift(goal);
  }

  db.updateStudentData(userId, { learningGoals: data.learningGoals });
  return res.json({ learningGoals: data.learningGoals });
});

apiRouter.delete('/student/goals/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.learningGoals = data.learningGoals.filter((g) => g.id !== id);
  db.updateStudentData(userId, { learningGoals: data.learningGoals });

  return res.json({ learningGoals: data.learningGoals });
});

// Learning Activity Sessions & Streak
apiRouter.post('/student/activity', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { minutes, topicsCovered, skillName } = req.body;

  if (!minutes || !skillName) {
    return res.status(400).json({ error: 'Session minutes and skillName are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  const today = new Date().toISOString().split('T')[0];
  const newSession: LearningActivitySession = {
    id: `act-${Date.now()}`,
    date: today,
    minutes: Number(minutes),
    topicsCovered: topicsCovered || `Practice on ${skillName}`,
    skillName,
  };

  data.activitySessions.unshift(newSession);

  // Update streak
  const isConsecutive = data.streakData.lastActiveDate !== today;
  const newStreak = isConsecutive ? data.streakData.currentStreak + 1 : data.streakData.currentStreak;
  data.streakData.currentStreak = newStreak;
  data.streakData.longestStreak = Math.max(data.streakData.longestStreak, newStreak);
  data.streakData.totalDays = isConsecutive ? data.streakData.totalDays + 1 : data.streakData.totalDays;
  data.streakData.totalHours = Math.round((data.streakData.totalHours + Number(minutes) / 60) * 10) / 10;
  data.streakData.lastActiveDate = today;

  // Update skill progress
  const targetSkill = data.detailedSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
  if (targetSkill) {
    targetSkill.hoursSpent = Math.round((targetSkill.hoursSpent + Number(minutes) / 60) * 10) / 10;
    targetSkill.progress = Math.min(100, targetSkill.progress + 2);
    targetSkill.lastPracticed = today;
  }

  db.updateStudentData(userId, {
    activitySessions: data.activitySessions,
    streakData: data.streakData,
    detailedSkills: data.detailedSkills,
  });

  return res.json({
    activitySessions: data.activitySessions,
    streakData: data.streakData,
    detailedSkills: data.detailedSkills,
  });
});

// Roadmap Topic Toggle
apiRouter.put('/student/roadmap/topic', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { milestoneId, topicId } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.learningRoadmap = data.learningRoadmap.map((m) => {
    if (m.id !== milestoneId) return m;
    const newTopics = m.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t));
    const done = newTopics.filter((t) => t.completed).length;
    const newProgress = newTopics.length > 0 ? Math.round((done / newTopics.length) * 100) : 0;
    const newStatus = newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : 'Planned';
    return {
      ...m,
      topics: newTopics,
      progress: newProgress,
      status: newStatus as any,
    };
  });

  db.updateStudentData(userId, { learningRoadmap: data.learningRoadmap });
  return res.json({ learningRoadmap: data.learningRoadmap });
});

// Expenses CRUD & Budget
apiRouter.post('/student/expenses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { expense } = req.body as { expense: ExpenseItem };

  if (!expense || (!expense.reason && !(expense as any).title) || !expense.amount) {
    return res.status(400).json({ error: 'Expense description/reason and amount are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.expenses.unshift(expense);
  db.updateStudentData(userId, { expenses: data.expenses });

  return res.json({ expenses: data.expenses });
});

apiRouter.delete('/student/expenses/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.expenses = data.expenses.filter((e) => e.id !== id);
  db.updateStudentData(userId, { expenses: data.expenses });

  return res.json({ expenses: data.expenses });
});

apiRouter.put('/student/budget', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { monthlyBudget } = req.body;

  if (!monthlyBudget || monthlyBudget < 0) {
    return res.status(400).json({ error: 'Valid monthly budget is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.monthlyBudget = Number(monthlyBudget);
  db.updateStudentData(userId, { monthlyBudget: data.monthlyBudget });

  return res.json({ monthlyBudget: data.monthlyBudget });
});

// Evaluated Projects & Submissions
apiRouter.post('/student/projects/save-eval', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { submission } = req.body as { submission: ProjectSubmission };

  if (!submission || !submission.title) {
    return res.status(400).json({ error: 'Submission details are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.submissions.unshift(submission);

  if (submission.evaluation) {
    const newScore: HistoricalScore = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      projectTitle: submission.title,
      score: submission.evaluation.overallScore,
      technicalComplexity: submission.evaluation.scoreBreakdown.technicalComplexity,
      industryRelevance: submission.evaluation.scoreBreakdown.industryRelevance,
      codeArchitectureQuality: submission.evaluation.scoreBreakdown.codeArchitectureQuality,
      innovationAndImpact: submission.evaluation.scoreBreakdown.innovationAndImpact,
    };
    data.historicalScores.push(newScore);
  }

  db.updateStudentData(userId, {
    submissions: data.submissions,
    historicalScores: data.historicalScores,
  });

  return res.json({
    submissions: data.submissions,
    historicalScores: data.historicalScores,
  });
});

// Placement Projects Update
apiRouter.put('/student/placement-projects', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { placementProjects } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.placementProjects = placementProjects;
  db.updateStudentData(userId, { placementProjects });

  return res.json({ placementProjects });
});

// ==========================================
// Phase 4: Resume & AI Resume Generator
// ==========================================

// Get All Saved Resume Versions
apiRouter.get('/student/resume/versions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const versions = db.getResumeVersions(userId);
  return res.json({ resumeVersions: versions });
});

// Save New Resume Version & Persist Active Resume
apiRouter.post('/student/resume/save-version', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { resume, analysis, notes, title, source } = req.body;

  if (!resume || !resume.fullName) {
    return res.status(400).json({ error: 'Valid resume data is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  const existingVersions = data.resumeVersions || [];
  const versionNumber = existingVersions.length + 1;
  const finalTitle = title || `v${versionNumber} - ${resume.targetRole || 'Software Engineer'} (${source === 'ai_generated' ? 'AI Generated' : 'Saved'})`;

  const newVersion: ResumeVersion = {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    versionNumber,
    title: finalTitle,
    targetRole: resume.targetRole || 'Software Engineer',
    resume: {
      ...resume,
      lastUpdated: new Date().toISOString(),
    },
    analysis,
    createdAt: new Date().toISOString(),
    source: source || 'manual_edit',
    notes: notes || `Saved on ${new Date().toLocaleDateString()}`,
  };

  db.addResumeVersion(userId, newVersion);
  data.studentResume = newVersion.resume;
  if (analysis) {
    data.resumeAnalysis = analysis;
  }

  // Update placement readiness based on new resume strength
  if (data.placementReadiness) {
    const resumeScore = analysis?.overallScore || 75;
    data.placementReadiness.breakdown.resumeStrength = resumeScore;
    const b = data.placementReadiness.breakdown;
    data.placementReadiness.overallScore = Math.round(
      b.skillProficiency * 0.25 +
      b.projectQuality * 0.25 +
      b.resumeStrength * 0.20 +
      b.interviewPerformance * 0.15 +
      b.careerAlignment * 0.15
    );
  }

  db.updateStudentData(userId, {
    studentResume: data.studentResume,
    resumeAnalysis: data.resumeAnalysis,
    placementReadiness: data.placementReadiness,
  });

  return res.json({
    resumeVersions: db.getResumeVersions(userId),
    studentResume: data.studentResume,
    resumeAnalysis: data.resumeAnalysis,
    placementReadiness: data.placementReadiness,
  });
});

// Restore Previous Resume Version
apiRouter.post('/student/resume/restore-version/:versionId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { versionId } = req.params;

  const result = db.restoreResumeVersion(userId, versionId);
  if (!result) {
    return res.status(404).json({ error: 'Resume version not found.' });
  }

  const data = db.getStudentData(userId);
  if (data && data.placementReadiness && result.resumeAnalysis) {
    data.placementReadiness.breakdown.resumeStrength = result.resumeAnalysis.overallScore;
    const b = data.placementReadiness.breakdown;
    data.placementReadiness.overallScore = Math.round(
      b.skillProficiency * 0.25 +
      b.projectQuality * 0.25 +
      b.resumeStrength * 0.20 +
      b.interviewPerformance * 0.15 +
      b.careerAlignment * 0.15
    );
    db.updateStudentData(userId, { placementReadiness: data.placementReadiness });
  }

  return res.json({
    studentResume: result.studentResume,
    resumeAnalysis: result.resumeAnalysis,
    resumeVersions: db.getResumeVersions(userId),
    placementReadiness: data?.placementReadiness,
  });
});

// Automatic AI Resume Generator from Verified User Data
apiRouter.post('/student/resume/generate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.getUserById(userId);
  const data = db.getStudentData(userId);

  if (!user || !data) {
    return res.status(404).json({ error: 'Student records not found.' });
  }

  const requestedRole = req.body.targetRole?.trim() || user.targetRole || user.interest || 'Software Engineer';

  // Verified Data Aggregation
  const verifiedContact = {
    fullName: user.name,
    email: user.email,
    phone: data.studentResume?.phone || '',
    location: data.studentResume?.location || '',
    githubUrl: data.studentResume?.githubUrl || '',
    linkedinUrl: data.studentResume?.linkedinUrl || '',
    portfolioUrl: data.studentResume?.portfolioUrl || '',
  };

  const verifiedEducation = (data.studentResume?.education && data.studentResume.education.length > 0)
    ? data.studentResume.education
    : [
        {
          institution: 'Institute of Engineering & Technology',
          degree: `Bachelor of Technology in ${user.department}`,
          year: `${user.year}`,
        },
      ];

  // Verified Skills Aggregation
  const allVerifiedSkills = [
    ...data.detailedSkills.map((s) => ({
      name: s.name,
      type: s.type,
      category: s.category,
      level: s.level,
      progress: s.progress,
      hours: s.hoursSpent,
    })),
    ...data.skills.map((s) => ({
      name: s.name,
      type: 'Technical' as const,
      category: s.category,
      level: s.level >= 75 ? 'Advanced' as const : 'Intermediate' as const,
      progress: s.level,
      hours: 0,
    })),
  ];

  // Deduplicate skills by lowercase name
  const uniqueSkillMap = new Map<string, typeof allVerifiedSkills[0]>();
  for (const s of allVerifiedSkills) {
    const key = s.name.toLowerCase().trim();
    if (!uniqueSkillMap.has(key)) {
      uniqueSkillMap.set(key, s);
    }
  }
  const uniqueSkills = Array.from(uniqueSkillMap.values());

  // Verified Projects Aggregation
  const verifiedProjects = [
    ...data.placementProjects.map((p) => ({
      id: p.id,
      title: p.title,
      domain: p.domain,
      techStack: p.techStack,
      objective: p.objective,
      expectedOutcome: p.expectedOutcome,
      status: p.status,
      githubUrl: p.githubUrl,
      evaluation: p.evaluation ? {
        score: p.evaluation.qualityScore,
        strengths: p.evaluation.strengths,
        summary: p.evaluation.evaluationSummary,
      } : undefined,
    })),
    ...data.submissions.map((s) => ({
      id: s.id,
      title: s.title,
      domain: s.domain,
      techStack: s.techStack,
      objective: s.description,
      expectedOutcome: s.architectureDetails || s.description,
      status: 'Completed',
      githubUrl: s.githubUrl,
      evaluation: s.evaluation ? {
        score: s.evaluation.overallScore,
        strengths: s.evaluation.strengths,
        summary: s.evaluation.evaluationSummary,
      } : undefined,
    })),
  ];

  // Deduplicate projects
  const uniqueProjectMap = new Map<string, typeof verifiedProjects[0]>();
  for (const p of verifiedProjects) {
    const key = p.title.toLowerCase().trim();
    if (!uniqueProjectMap.has(key)) {
      uniqueProjectMap.set(key, p);
    }
  }
  const uniqueProjectsList = Array.from(uniqueProjectMap.values());

  // Verified Experience & Certifications
  const verifiedExperience = data.studentResume?.experience || [];
  const verifiedCertifications = [
    ...(data.studentResume?.certifications || []),
    ...data.streakData.badges.filter((b) => b.achieved).map((b) => ({
      name: b.title,
      issuer: 'PathPilot Academic Verification',
      year: new Date().getFullYear().toString(),
    })),
  ];

  // Check for Missing Data Checklist
  const missingFields: ResumeMissingField[] = [];
  if (!verifiedContact.phone.trim()) {
    missingFields.push({
      field: 'phone',
      label: 'Phone Number',
      tip: 'Direct telephone contact is an essential ATS parsing field for recruiter screening.',
    });
  }
  if (!verifiedContact.location.trim()) {
    missingFields.push({
      field: 'location',
      label: 'Location / City',
      tip: 'Helps regional recruiter filters categorize on-site, hybrid, or remote eligibility.',
    });
  }
  if (!verifiedContact.githubUrl.trim()) {
    missingFields.push({
      field: 'githubUrl',
      label: 'GitHub Profile Link',
      tip: 'Technical engineering screeners prioritize candidates with public repository proof.',
    });
  }
  if (!verifiedContact.linkedinUrl.trim()) {
    missingFields.push({
      field: 'linkedinUrl',
      label: 'LinkedIn Profile URL',
      tip: 'Industry standard for candidate identity and professional verification.',
    });
  }
  if (uniqueProjectsList.length === 0) {
    missingFields.push({
      field: 'projects',
      label: 'Verified Projects',
      tip: 'Add a project in Project Evaluator or Placement Hub to prove hands-on code capability.',
    });
  }
  if (uniqueSkills.length < 3) {
    missingFields.push({
      field: 'skills',
      label: 'Technical Skills',
      tip: 'Log your active programming languages and tools in Learning Hub to expand ATS keywords.',
    });
  }

  // Deterministic Keyword Mapping
  const roleKeywords: Record<string, string[]> = {
    'Cloud & Infrastructure Engineer': ['Docker', 'Kubernetes', 'Linux', 'Go', 'Python', 'Redis', 'CI/CD', 'Git', 'Distributed Systems', 'gRPC', 'PostgreSQL', 'Microservices', 'System Design'],
    'Software Engineer': ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Express', 'SQL', 'PostgreSQL', 'Git', 'REST APIs', 'Data Structures', 'Algorithms', 'Docker', 'Testing'],
    'Frontend Developer': ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'TailwindCSS', 'Next.js', 'REST APIs', 'Git', 'Responsive Design', 'Web Performance'],
    'Backend Engineer': ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'TypeScript', 'Python', 'REST APIs', 'Microservices', 'Git', 'System Design'],
    'AI / Machine Learning Engineer': ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Data Science', 'FastAPI', 'Docker', 'Git', 'SQL', 'Deep Learning'],
    'Cybersecurity Analyst': ['Networking', 'Linux', 'Python', 'Cryptography', 'Penetration Testing', 'Security Auditing', 'SIEM', 'Firewalls', 'OWASP'],
  };

  const expectedKeywords = roleKeywords[requestedRole] || roleKeywords['Software Engineer'];
  const allVerifiedSkillNames = uniqueSkills.map((s) => s.name);
  const matchedKeywords = expectedKeywords.filter((kw) =>
    allVerifiedSkillNames.some((sn) => sn.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(sn.toLowerCase())) ||
    uniqueProjectsList.some((p) => p.techStack.some((ts) => ts.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(ts.toLowerCase())))
  );
  const missingKeywords = expectedKeywords.filter((kw) => !matchedKeywords.includes(kw));

  // Deterministic Fallback Generator Function
  const generateDeterministicResume = (): StudentResume => {
    // Categorize verified skills
    const progLangs: string[] = [];
    const frameworks: string[] = [];
    const cloudTools: string[] = [];
    const soft: string[] = [];

    const progList = ['typescript', 'javascript', 'python', 'go', 'java', 'c++', 'c', 'sql', 'rust', 'c#', 'ruby', 'php'];
    const cloudList = ['docker', 'kubernetes', 'linux', 'redis', 'aws', 'gcp', 'azure', 'posix', 'opentelemetry', 'nginx', 'terraform'];

    uniqueSkills.forEach((s) => {
      const lower = s.name.toLowerCase();
      if (s.type === 'Soft' || ['communication', 'teamwork', 'leadership', 'problem solving', 'system design'].some((k) => lower.includes(k))) {
        soft.push(s.name);
      } else if (cloudList.some((k) => lower.includes(k))) {
        cloudTools.push(s.name);
      } else if (progList.some((k) => lower.includes(k))) {
        progLangs.push(s.name);
      } else {
        frameworks.push(s.name);
      }
    });

    if (soft.length === 0) {
      soft.push('Problem Solving', 'Technical Documentation', 'System Design Whiteboarding');
    }

    // Generate Google X-Y-Z bullet points from real project evaluations and architectures
    const formattedProjects = uniqueProjectsList.map((p, idx) => {
      const bullets: string[] = [];
      if (p.evaluation?.strengths && p.evaluation.strengths.length > 0) {
        bullets.push(...p.evaluation.strengths.slice(0, 2));
      }
      if (p.objective) {
        bullets.push(`Engineered ${p.title} using ${p.techStack.join(', ')} to achieve verifiable proof-of-work benchmarks.`);
      }
      if (bullets.length === 0) {
        bullets.push(`Designed and deployed ${p.title} leveraging ${p.techStack.join(', ')}.`);
      }

      return {
        id: p.id || `proj-${idx + 1}`,
        title: p.title,
        techStack: p.techStack,
        summary: p.objective || `Applied domain project for ${p.domain || user.department}.`,
        githubUrl: p.githubUrl,
        highlights: bullets.slice(0, 3),
      };
    });

    const summary = `Dedicated undergraduate student in ${user.department} (${user.year}) pursuing ${requestedRole} opportunities. Hands-on experience building ${uniqueProjectsList.length > 0 ? uniqueProjectsList.slice(0, 2).map((p) => p.title).join(' and ') : 'scalable applications'} with proven focus on ${allVerifiedSkillNames.slice(0, 3).join(', ') || 'software engineering principles'}.`;

    return {
      id: `resume-${userId}-${Date.now()}`,
      fullName: user.name,
      email: user.email,
      phone: verifiedContact.phone,
      location: verifiedContact.location,
      githubUrl: verifiedContact.githubUrl || undefined,
      linkedinUrl: verifiedContact.linkedinUrl || undefined,
      portfolioUrl: verifiedContact.portfolioUrl || undefined,
      targetRole: requestedRole,
      summary,
      education: verifiedEducation,
      skills: {
        programming: progLangs,
        frameworksAndTools: frameworks,
        cloudAndDevOps: cloudTools,
        softSkills: soft,
      },
      projects: formattedProjects,
      experience: verifiedExperience,
      certifications: verifiedCertifications,
      lastUpdated: new Date().toISOString(),
    };
  };

  // Attempt Gemini Generation
  let generatedResume: StudentResume | null = null;
  let generationNotes = `Tailored for ${requestedRole} using ${uniqueSkills.length} verified skills and ${uniqueProjectsList.length} verified project artifacts.`;
  let source: 'gemini' | 'verified-deterministic' = 'verified-deterministic';

  if (ai) {
    try {
      const prompt = `You are an expert technical resume architect and university career advisor.
Generate an ATS-friendly, personalized technical resume automatically from ONLY the student's verified records provided below.

CRITICAL RULES:
1. STRICT TRUTHFULNESS: NEVER fabricate any company names, universities, degrees, phone numbers, email addresses, project titles, tech stacks, or metrics that are NOT provided in the input.
2. MISSING DATA HANDLING: If a field (phone, location, githubUrl, linkedinUrl) is empty, keep it empty string. DO NOT invent fake contact info.
3. GOOGLE X-Y-Z BULLETS: For each verified project, formulate 2 to 3 bullet points using Google's metric formula: "Accomplished [X] as measured by [Y] by doing [Z]". Derive metrics solely from the verified evaluation strengths, benchmarks, and objectives.
4. ATS CATEGORIZATION: Group verified skills into four standard ATS categories:
   - "programming" (languages)
   - "frameworksAndTools" (frameworks, dev tools, libraries)
   - "cloudAndDevOps" (cloud, containers, databases, systems)
   - "softSkills" (problem solving, system design, collaboration)
5. PROFESSIONAL SUMMARY: Craft a strong 2-3 sentence technical summary tailored specifically for "${requestedRole}".

Target Role: ${requestedRole}
Verified Student Data:
${JSON.stringify({
  studentName: user.name,
  department: user.department,
  year: user.year,
  contact: verifiedContact,
  education: verifiedEducation,
  skills: uniqueSkills,
  projects: uniqueProjectsList,
  experience: verifiedExperience,
  certifications: verifiedCertifications,
}, null, 2)}

Return ONLY valid JSON with this exact structure:
{
  "summary": "Tailored 2-3 sentence professional summary",
  "skills": {
    "programming": ["string"],
    "frameworksAndTools": ["string"],
    "cloudAndDevOps": ["string"],
    "softSkills": ["string"]
  },
  "projects": [
    {
      "id": "string",
      "title": "string",
      "techStack": ["string"],
      "summary": "string",
      "githubUrl": "string or undefined",
      "highlights": ["Accomplished [X] as measured by [Y] by doing [Z]"]
    }
  ],
  "experience": [
    {
      "id": "string",
      "role": "string",
      "company": "string",
      "duration": "string",
      "highlights": ["string"]
    }
  ],
  "generationNotes": "Brief 1-2 sentence explanation of how the resume was optimized for ${requestedRole} from verified records."
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = aiResponse.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.summary && parsed.skills) {
          generatedResume = {
            id: `resume-${userId}-${Date.now()}`,
            fullName: user.name,
            email: user.email,
            phone: verifiedContact.phone,
            location: verifiedContact.location,
            githubUrl: verifiedContact.githubUrl || undefined,
            linkedinUrl: verifiedContact.linkedinUrl || undefined,
            portfolioUrl: verifiedContact.portfolioUrl || undefined,
            targetRole: requestedRole,
            summary: parsed.summary,
            education: verifiedEducation,
            skills: {
              programming: Array.isArray(parsed.skills?.programming) ? parsed.skills.programming : [],
              frameworksAndTools: Array.isArray(parsed.skills?.frameworksAndTools) ? parsed.skills.frameworksAndTools : [],
              cloudAndDevOps: Array.isArray(parsed.skills?.cloudAndDevOps) ? parsed.skills.cloudAndDevOps : [],
              softSkills: Array.isArray(parsed.skills?.softSkills) ? parsed.skills.softSkills : [],
            },
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            experience: Array.isArray(parsed.experience) ? parsed.experience : verifiedExperience,
            certifications: verifiedCertifications,
            lastUpdated: new Date().toISOString(),
          };
          generationNotes = parsed.generationNotes || generationNotes;
          source = 'gemini';
        }
      }
    } catch (aiErr) {
      console.warn('Gemini resume generation error, falling back to deterministic assembly:', aiErr);
    }
  }

  if (!generatedResume) {
    generatedResume = generateDeterministicResume();
  }

  // Calculate ATS Score & Analysis
  const keywordRatio = expectedKeywords.length > 0 ? (matchedKeywords.length / expectedKeywords.length) : 0.8;
  const projectQualityBonus = uniqueProjectsList.length >= 2 ? 15 : uniqueProjectsList.length === 1 ? 8 : 0;
  const contactCompleteness = (verifiedContact.phone ? 5 : 0) + (verifiedContact.location ? 5 : 0) + (verifiedContact.githubUrl ? 5 : 0);
  const baseAts = Math.round(keywordRatio * 65 + projectQualityBonus + contactCompleteness);
  const overallScore = Math.min(96, Math.max(45, baseAts));
  const roleMatchScore = Math.min(95, Math.max(40, Math.round(keywordRatio * 100)));

  const weakSections: { section: string; feedback: string; recommendation: string }[] = [];
  if (!verifiedContact.phone || !verifiedContact.githubUrl) {
    weakSections.push({
      section: 'Header & Contact Info',
      feedback: 'Contact information is missing phone number or GitHub profile link.',
      recommendation: 'Complete your direct phone and code repository links for hiring managers.',
    });
  }
  if (uniqueProjectsList.length < 2) {
    weakSections.push({
      section: 'Verified Technical Projects',
      feedback: 'Having fewer than two verified projects limits ATS keyword density and proof-of-work.',
      recommendation: 'Evaluate or complete an additional technical project in PathPilot.',
    });
  }
  if (missingKeywords.length > 3) {
    weakSections.push({
      section: 'Target Role Alignment',
      feedback: `Missing ${missingKeywords.length} core keywords typical for ${requestedRole} job descriptions.`,
      recommendation: `Target ${missingKeywords.slice(0, 3).join(', ')} in your next study blocks.`,
    });
  }

  const projectImprovements = generatedResume.projects.slice(0, 2).map((p) => ({
    projectTitle: p.title,
    originalBullet: `Built ${p.title} using ${p.techStack.join(', ')}.`,
    improvedBullet: p.highlights[0] || `Engineered ${p.title} achieving verified functional benchmarks and automated test coverage with ${p.techStack.join(', ')}.`,
    reason: 'Upgrades generic task descriptions to quantified outcomes and verifiable deliverables.',
  }));

  const actionableFixes: string[] = [];
  if (missingKeywords.length > 0) {
    actionableFixes.push(`Add ${missingKeywords.slice(0, 2).join(' and ')} to your learning roadmap.`);
  }
  if (!verifiedContact.phone) {
    actionableFixes.push('Add your direct contact phone number.');
  }
  if (!verifiedContact.githubUrl) {
    actionableFixes.push('Connect your public GitHub repository link.');
  }
  if (uniqueProjectsList.length < 2) {
    actionableFixes.push('Complete your second placement project milestone.');
  }

  const analysis: ResumeATSAnalysis = {
    overallScore,
    roleMatchScore,
    matchedKeywords,
    missingKeywords,
    weakSections,
    projectImprovements,
    actionableFixes,
    analyzedAt: new Date().toISOString(),
  };

  return res.json({
    resume: generatedResume,
    analysis,
    missingFields,
    generationNotes,
    source,
    targetRole: requestedRole,
  });
});

// Resume Update (standard)
apiRouter.put('/student/resume', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { studentResume, resumeAnalysis } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  if (studentResume) data.studentResume = studentResume;
  if (resumeAnalysis) data.resumeAnalysis = resumeAnalysis;

  db.updateStudentData(userId, {
    studentResume: data.studentResume,
    resumeAnalysis: data.resumeAnalysis,
  });

  return res.json({
    studentResume: data.studentResume,
    resumeAnalysis: data.resumeAnalysis,
  });
});

// Internships Update
apiRouter.put('/student/internships', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { internships } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.internships = internships;
  db.updateStudentData(userId, { internships });

  return res.json({ internships });
});

// Interview Attempt
apiRouter.post('/student/interviews/attempt', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { attempt } = req.body as { attempt: InterviewAttempt };

  if (!attempt) {
    return res.status(400).json({ error: 'Attempt data is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.interviewAttempts.unshift(attempt);

  const attempts = data.interviewAttempts;
  const avg = Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  const techAttempts = attempts.filter((a) => a.category === 'Technical');
  const hrAttempts = attempts.filter((a) => a.category === 'HR/Communication');
  const aptAttempts = attempts.filter((a) => a.category === 'Aptitude');

  data.interviewStats = {
    totalAttempts: attempts.length,
    averageScore: avg,
    technicalScore: techAttempts.length > 0 ? Math.round(techAttempts.reduce((s, a) => s + a.score, 0) / techAttempts.length) : 80,
    hrScore: hrAttempts.length > 0 ? Math.round(hrAttempts.reduce((s, a) => s + a.score, 0) / hrAttempts.length) : 80,
    aptitudeScore: aptAttempts.length > 0 ? Math.round(aptAttempts.reduce((s, a) => s + a.score, 0) / aptAttempts.length) : 80,
    accuracy: avg,
    topicMastery: [
      { topic: 'Core Technical Concepts', attempts: techAttempts.length, avgScore: techAttempts.length > 0 ? Math.round(techAttempts.reduce((s, a) => s + a.score, 0) / techAttempts.length) : 80 },
      { topic: 'Behavioral & Leadership', attempts: hrAttempts.length, avgScore: hrAttempts.length > 0 ? Math.round(hrAttempts.reduce((s, a) => s + a.score, 0) / hrAttempts.length) : 80 },
    ],
  };

  db.updateStudentData(userId, {
    interviewAttempts: data.interviewAttempts,
    interviewStats: data.interviewStats,
  });

  return res.json({
    interviewAttempts: data.interviewAttempts,
    interviewStats: data.interviewStats,
  });
});

// Placement Readiness Update
apiRouter.put('/student/placement-readiness', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { placementReadiness } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.placementReadiness = placementReadiness;
  db.updateStudentData(userId, { placementReadiness });

  return res.json({ placementReadiness });
});

// Notifications Read Status
apiRouter.put('/student/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId, markAllRead } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  if (markAllRead) {
    data.notifications = data.notifications.map((n) => ({ ...n, read: true }));
  } else if (notificationId) {
    data.notifications = data.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  }

  db.updateStudentData(userId, { notifications: data.notifications });
  return res.json({ notifications: data.notifications });
});

// Basic Skills CRUD (Phase 1 / Data Entry Modal)
apiRouter.post('/student/basic-skills', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { skill } = req.body as { skill: SkillMetric };

  if (!skill || !skill.name) {
    return res.status(400).json({ error: 'Skill metric details are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  const existingIdx = data.skills.findIndex((s) => s.name.toLowerCase() === skill.name.toLowerCase());
  if (existingIdx >= 0) {
    data.skills[existingIdx] = { ...data.skills[existingIdx], ...skill };
  } else {
    data.skills.unshift(skill);
  }

  db.updateStudentData(userId, { skills: data.skills });
  return res.json({ skills: data.skills });
});

// Historical Scores (Phase 1 / Data Entry Modal)
apiRouter.post('/student/historical-scores', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { score } = req.body as { score: HistoricalScore };

  if (!score || !score.projectTitle) {
    return res.status(400).json({ error: 'Historical score details are required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.historicalScores.push(score);
  db.updateStudentData(userId, { historicalScores: data.historicalScores });

  return res.json({ historicalScores: data.historicalScores });
});

// Career Roadmap Milestones & Tasks (Phase 1)
apiRouter.put('/student/career-roadmap', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { milestones, milestoneId, taskId } = req.body;

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  if (Array.isArray(milestones)) {
    data.roadmapMilestones = milestones;
  } else if (milestoneId && taskId) {
    data.roadmapMilestones = data.roadmapMilestones.map((m) => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      };
    });
  }

  db.updateStudentData(userId, { roadmapMilestones: data.roadmapMilestones });
  return res.json({ roadmapMilestones: data.roadmapMilestones });
});

// Copilot Chat History Persistence (Phase 5)
apiRouter.get('/student/copilot-history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  return res.json({ copilotChatHistory: data.copilotChatHistory || [] });
});

apiRouter.post('/student/copilot-history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { message } = req.body as { message: CopilotMessage };

  if (!message || !message.text) {
    return res.status(400).json({ error: 'Copilot message is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  if (!data.copilotChatHistory) data.copilotChatHistory = [];
  data.copilotChatHistory.push(message);

  db.updateStudentData(userId, { copilotChatHistory: data.copilotChatHistory });
  return res.json({ copilotChatHistory: data.copilotChatHistory });
});

apiRouter.delete('/student/copilot-history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  data.copilotChatHistory = [];
  db.updateStudentData(userId, { copilotChatHistory: [] });
  return res.json({ copilotChatHistory: [] });
});

// Weekly Reports Persistence (Phase 5)
apiRouter.get('/student/reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  return res.json({ weeklyReports: data.weeklyReports || [] });
});

apiRouter.post('/student/reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { report } = req.body as { report: WeeklyStudentReport };

  if (!report || !report.id) {
    return res.status(400).json({ error: 'Weekly report is required.' });
  }

  const data = db.getStudentData(userId);
  if (!data) return res.status(404).json({ error: 'User data not found.' });

  if (!data.weeklyReports) data.weeklyReports = [];
  data.weeklyReports.unshift(report);

  db.updateStudentData(userId, { weeklyReports: data.weeklyReports });
  return res.json({ weeklyReports: data.weeklyReports });
});
