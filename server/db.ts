import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { DBSchema, DBUser, StudentUserData } from './types.ts';
import type { StudentResume, ResumeATSAnalysis, ResumeVersion } from '../src/types.ts';
import { 
  INITIAL_SKILLS, DEFAULT_ROADMAP_MILESTONES, INITIAL_DETAILED_SKILLS, 
  INITIAL_LEARNING_GOALS, INITIAL_STREAK_DATA, INITIAL_ACTIVITY_SESSIONS, 
  INITIAL_CAREER_ALIGNMENT, INITIAL_LEARNING_INSIGHTS, INITIAL_LEARNING_ROADMAP,
  INITIAL_EXPENSES, DEFAULT_MONTHLY_BUDGET, SEED_SUBMISSIONS, HISTORICAL_PERFORMANCE
} from '../src/data/departmentData.ts';
import { 
  INITIAL_PLACEMENT_PROJECTS, INITIAL_STUDENT_RESUME, INITIAL_RESUME_ANALYSIS, 
  INITIAL_INTERNSHIPS, INITIAL_INTERVIEW_QUESTIONS, INITIAL_INTERVIEW_ATTEMPTS, 
  INITIAL_INTERVIEW_STATS, INITIAL_PLACEMENT_READINESS 
} from '../src/data/placementData.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

class Database {
  private schema: DBSchema = {
    users: {},
    studentsData: {},
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(raw);
        this.isLoaded = true;
      } catch (err) {
        console.error('Failed to parse database.json, initializing fresh store:', err);
        this.schema = { users: {}, studentsData: {} };
      }
    }

    // Seed default demo user if no users exist
    this.ensureDemoUser();
    this.save();
  }

  private ensureDemoUser() {
    const demoEmail = 'student.demo@university.edu';
    const existingDemo = Object.values(this.schema.users).find(
      (u) => u.email.toLowerCase() === demoEmail.toLowerCase()
    );

    if (!existingDemo) {
      const demoId = 'user-demo-alex-chen';
      const passwordHash = bcrypt.hashSync('demo1234', 10);
      const now = new Date().toISOString();

      const demoUser: DBUser = {
        id: demoId,
        name: 'Alex Chen',
        email: demoEmail,
        passwordHash,
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        interest: 'Distributed Systems & Cloud Infrastructure',
        targetRole: 'Cloud & Infrastructure Engineer',
        joinedDate: 'October 2026',
        createdAt: now,
        updatedAt: now,
      };

      this.schema.users[demoId] = demoUser;

      // Seed student data for demo user
      this.schema.studentsData[demoId] = {
        userId: demoId,
        skills: INITIAL_SKILLS,
        detailedSkills: INITIAL_DETAILED_SKILLS,
        historicalScores: HISTORICAL_PERFORMANCE,
        submissions: SEED_SUBMISSIONS,
        roadmapMilestones: DEFAULT_ROADMAP_MILESTONES,
        learningRoadmap: INITIAL_LEARNING_ROADMAP,
        learningGoals: INITIAL_LEARNING_GOALS,
        streakData: INITIAL_STREAK_DATA,
        activitySessions: INITIAL_ACTIVITY_SESSIONS,
        monthlyBudget: DEFAULT_MONTHLY_BUDGET,
        expenses: INITIAL_EXPENSES,
        placementProjects: INITIAL_PLACEMENT_PROJECTS,
        studentResume: INITIAL_STUDENT_RESUME,
        resumeAnalysis: INITIAL_RESUME_ANALYSIS,
        resumeVersions: [
          {
            id: 'ver-demo-v1',
            versionNumber: 1,
            title: 'v1 - Cloud & Infrastructure Engineer (Verified Baseline)',
            targetRole: 'Cloud & Infrastructure Engineer',
            resume: INITIAL_STUDENT_RESUME,
            analysis: INITIAL_RESUME_ANALYSIS,
            createdAt: '2026-09-28T10:00:00.000Z',
            source: 'ai_generated',
            notes: 'Initial ATS baseline compiled from verified distributed systems and proxy projects.',
          },
        ],
        internships: INITIAL_INTERNSHIPS,
        interviewQuestions: INITIAL_INTERVIEW_QUESTIONS,
        interviewAttempts: INITIAL_INTERVIEW_ATTEMPTS,
        interviewStats: INITIAL_INTERVIEW_STATS,
        placementReadiness: INITIAL_PLACEMENT_READINESS,
        careerAlignment: INITIAL_CAREER_ALIGNMENT,
        learningInsights: INITIAL_LEARNING_INSIGHTS,
        notifications: [
          {
            id: 'notif-welcome',
            type: 'copilot_recommendation',
            title: 'Welcome to PathPilot Production',
            message: 'Your persistent student data and credentials are securely connected to the backend database.',
            timestamp: 'Just now',
            read: false,
            priority: 'low',
            targetTab: 'dashboard',
          },
        ],
        copilotChatHistory: [],
        weeklyReports: [],
      };
    }
  }

  public save() {
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.schema, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getUserByEmail(email: string): DBUser | null {
    const normalized = email.trim().toLowerCase();
    for (const u of Object.values(this.schema.users)) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return null;
  }

  public getUserById(id: string): DBUser | null {
    return this.schema.users[id] || null;
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    department: string;
    year: string;
  }): { user: DBUser; studentData: StudentUserData } {
    const id = `student-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(userData.password, 10);
    const now = new Date().toISOString();

    const user: DBUser = {
      id,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash,
      department: userData.department,
      year: userData.year,
      interest: '', // triggers onboarding
      targetRole: 'Software Engineer',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      createdAt: now,
      updatedAt: now,
    };

    this.schema.users[id] = user;

    // Clean initial student data for new user (isolated from other users)
    const cleanStudentData: StudentUserData = {
      userId: id,
      skills: [],
      detailedSkills: [],
      historicalScores: [],
      submissions: [],
      roadmapMilestones: [],
      learningRoadmap: [],
      learningGoals: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        totalHours: 0,
        lastActiveDate: '',
        badges: [
          {
            id: 'badge-1',
            title: '5-Day Focus Streak',
            description: 'Maintain study consistency across 5 consecutive active days.',
            icon: 'Flame',
            achieved: false,
          },
          {
            id: 'badge-2',
            title: 'First Milestone Mastered',
            description: 'Complete all topics within any learning roadmap milestone.',
            icon: 'CheckCircle',
            achieved: false,
          },
        ],
      },
      activitySessions: [],
      monthlyBudget: 8000,
      expenses: [],
      placementProjects: [],
      studentResume: {
        id: `resume-${id}`,
        fullName: user.name,
        email: user.email,
        phone: '',
        location: '',
        targetRole: 'Software Engineer',
        summary: `Undergraduate student in ${user.department} (${user.year}) pursuing technical depth and real-world project mastery.`,
        education: [
          {
            institution: 'Institute of Engineering & Technology',
            degree: `Bachelor of Technology in ${user.department}`,
            year: `${user.year}`,
          },
        ],
        experience: [],
        projects: [],
        skills: {
          programming: [],
          frameworksAndTools: [],
          cloudAndDevOps: [],
          softSkills: [],
        },
        certifications: [],
        lastUpdated: now,
      },
      resumeAnalysis: {
        overallScore: 50,
        roleMatchScore: 45,
        matchedKeywords: [],
        missingKeywords: ['Version Control', 'Data Structures', 'REST APIs'],
        weakSections: [
          {
            section: 'Technical Skills & Projects',
            feedback: 'No verified projects or skills logged yet.',
            recommendation: 'Add your active programming languages in Learning Hub and evaluate your first project.',
          },
        ],
        projectImprovements: [],
        actionableFixes: [
          'Complete domain onboarding',
          'Add your acquired skills in the Learning Hub',
          'Add a verified project artifact to boost ATS score',
        ],
        analyzedAt: now,
      },
      resumeVersions: [],
      internships: [],
      interviewQuestions: INITIAL_INTERVIEW_QUESTIONS.slice(0, 3),
      interviewAttempts: [],
      interviewStats: {
        totalAttempts: 0,
        averageScore: 0,
        technicalScore: 0,
        hrScore: 0,
        aptitudeScore: 0,
        accuracy: 0,
        topicMastery: [],
      },
      placementReadiness: {
        overallScore: 55,
        breakdown: {
          skillProficiency: 50,
          projectQuality: 50,
          resumeStrength: 65,
          learningProgress: 40,
          interviewPerformance: 50,
          aptitudePerformance: 60,
          careerAlignment: 50,
        },
        status: 'Needs Targeted Practice',
        strengths: ['Early enrollment and active roadmap initialization'],
        criticalGaps: ['Complete first practical project artifact', 'Define domain specialization'],
        highestImpactNextActions: ['Select your domain interest in Onboarding to calibrate your roadmap'],
        estimatedTimeframeToReady: '6 - 8 Weeks',
      },
      careerAlignment: {
        score: 55,
        targetRole: 'Software Engineer',
        targetRoleBenchmark: 85,
        strengths: [],
        skillGaps: [],
        actionsToImprove: ['Complete domain focus selection', 'Add first verified skill'],
        roleComparison: [],
      },
      learningInsights: {
        fastestImprovingSkills: [],
        skillsNeedingAttention: [],
        nextRecommendedSkill: {
          name: 'Core Algorithms & Data Structures',
          category: 'DSA',
          reason: 'Foundation requirement for placement readiness',
          targetMilestone: 'Milestone 1',
        },
        consistencyScore: 50,
        actionableSuggestions: ['Log your first 25-minute practice session today.'],
        learningSummary: 'Welcome to PathPilot! Start by selecting your domain interest in onboarding.',
      },
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: 'copilot_recommendation',
          title: 'Welcome to PathPilot!',
          message: 'Complete your domain onboarding to unlock personalized roadmap milestones, AI project recommendations, and ATS resume scanning.',
          timestamp: 'Just now',
          read: false,
          priority: 'high',
          targetTab: 'dashboard',
        },
      ],
      copilotChatHistory: [],
      weeklyReports: [],
    };

    this.schema.studentsData[id] = cleanStudentData;
    this.save();

    return { user, studentData: cleanStudentData };
  }

  public updateUser(id: string, updates: Partial<DBUser>): DBUser | null {
    const user = this.schema.users[id];
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  public getStudentData(userId: string): StudentUserData | null {
    return this.schema.studentsData[userId] || null;
  }

  public updateStudentData(userId: string, updates: Partial<StudentUserData>): StudentUserData {
    let data = this.schema.studentsData[userId];
    if (!data) {
      data = {
        userId,
        skills: [],
        detailedSkills: [],
        historicalScores: [],
        submissions: [],
        roadmapMilestones: [],
        learningRoadmap: [],
        learningGoals: [],
        streakData: { currentStreak: 0, longestStreak: 0, totalDays: 0, totalHours: 0, lastActiveDate: '', badges: [] },
        activitySessions: [],
        monthlyBudget: 8000,
        expenses: [],
        placementProjects: [],
        studentResume: {} as any,
        resumeAnalysis: {} as any,
        internships: [],
        interviewQuestions: [],
        interviewAttempts: [],
        interviewStats: {} as any,
        placementReadiness: {} as any,
        careerAlignment: {} as any,
        learningInsights: {} as any,
        notifications: [],
        copilotChatHistory: [],
        weeklyReports: [],
        resumeVersions: [],
      };
      this.schema.studentsData[userId] = data;
    }

    if (!data.resumeVersions) {
      data.resumeVersions = [];
    }

    Object.assign(data, updates);
    this.save();
    return data;
  }

  public addResumeVersion(userId: string, version: ResumeVersion): ResumeVersion[] {
    const data = this.getStudentData(userId);
    if (!data) return [];
    if (!data.resumeVersions) data.resumeVersions = [];
    data.resumeVersions.unshift(version);
    this.save();
    return data.resumeVersions;
  }

  public getResumeVersions(userId: string): ResumeVersion[] {
    const data = this.getStudentData(userId);
    return data?.resumeVersions || [];
  }

  public restoreResumeVersion(userId: string, versionId: string): { studentResume: StudentResume; resumeAnalysis?: ResumeATSAnalysis } | null {
    const data = this.getStudentData(userId);
    if (!data || !data.resumeVersions) return null;
    const target = data.resumeVersions.find((v) => v.id === versionId);
    if (!target) return null;

    data.studentResume = { ...target.resume, lastUpdated: new Date().toISOString() };
    if (target.analysis) {
      data.resumeAnalysis = target.analysis;
    }
    this.save();
    return { studentResume: data.studentResume, resumeAnalysis: data.resumeAnalysis };
  }
}

export const db = new Database();
