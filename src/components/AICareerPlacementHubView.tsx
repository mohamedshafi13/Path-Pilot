import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, PlacementProject, StudentResume, ResumeATSAnalysis, 
  InternshipOpportunity, InterviewQuestion, InterviewAttempt, 
  InterviewPerformanceStats, PlacementReadinessData, DetailedSkill, 
  CareerAlignmentData, LearningStreakData, InterviewCategory,
  ResumeVersion, ResumeMissingField, ResumeGenerationResponse, ProjectSubmission
} from '../types';
import { 
  Briefcase, Award, CheckCircle2, Circle, Clock, ExternalLink, 
  Sparkles, FileText, Send, AlertTriangle, CheckSquare, Plus, 
  Search, Filter, ChevronRight, ChevronDown, X, Github, 
  Eye, TrendingUp, Target, Building2, MapPin, Zap, RefreshCw, 
  HelpCircle, MessageSquare, BookOpen, Layers, ArrowUpRight,
  History, Download, Copy, Printer, Check, ShieldAlert, Edit3, Save, RotateCcw
} from 'lucide-react';
import { 
  requestResumeATSAnalysis, requestPlacementProjectEvaluation, 
  requestInterviewResponseEvaluation, requestPlacementProjectSuggestions,
  generateAIResume, saveResumeVersion, restoreResumeVersion
} from '../services/api';

interface AICareerPlacementHubViewProps {
  user: User;
  placementProjects: PlacementProject[];
  studentResume: StudentResume;
  resumeAnalysis: ResumeATSAnalysis;
  resumeVersions?: ResumeVersion[];
  submissions?: ProjectSubmission[];
  internships: InternshipOpportunity[];
  interviewQuestions: InterviewQuestion[];
  interviewAttempts: InterviewAttempt[];
  interviewStats: InterviewPerformanceStats;
  placementReadiness: PlacementReadinessData;
  detailedSkills: DetailedSkill[];
  careerAlignment: CareerAlignmentData;
  streakData: LearningStreakData;
  onUpdateProjects: (projects: PlacementProject[]) => void;
  onUpdateResume: (resume: StudentResume) => void;
  onUpdateResumeAnalysis: (analysis: ResumeATSAnalysis) => void;
  onSaveResumeVersion?: (payload: { resume: StudentResume; analysis?: ResumeATSAnalysis; notes?: string; title?: string; source?: string }) => Promise<void>;
  onRestoreResumeVersion?: (versionId: string) => Promise<void>;
  onUpdateInternships: (internships: InternshipOpportunity[]) => void;
  onAddInterviewAttempt: (attempt: InterviewAttempt) => void;
  onUpdatePlacementReadiness: (readiness: PlacementReadinessData) => void;
  onRefreshAllReadiness: () => void;
}

export const AICareerPlacementHubView: React.FC<AICareerPlacementHubViewProps> = ({
  user,
  placementProjects,
  studentResume,
  resumeAnalysis,
  resumeVersions = [],
  submissions = [],
  internships,
  interviewQuestions,
  interviewAttempts,
  interviewStats,
  placementReadiness,
  detailedSkills,
  careerAlignment,
  streakData,
  onUpdateProjects,
  onUpdateResume,
  onUpdateResumeAnalysis,
  onSaveResumeVersion,
  onRestoreResumeVersion,
  onUpdateInternships,
  onAddInterviewAttempt,
  onUpdatePlacementReadiness,
  onRefreshAllReadiness,
}) => {
  // Hub Navigation
  const [activeTab, setActiveTab] = useState<'readiness' | 'projects' | 'portfolio' | 'resume' | 'internships' | 'interviews'>('readiness');

  // Loading states
  const [isScanningResume, setIsScanningResume] = useState(false);
  const [evaluatingProjectId, setEvaluatingProjectId] = useState<string | null>(null);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false);

  // Projects filter
  const [projectDifficultyFilter, setProjectDifficultyFilter] = useState<string>('All');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('All');

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditPortfolioModal, setShowEditPortfolioModal] = useState<PlacementProject | null>(null);

  // New Project Form
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDifficulty, setNewProjDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newProjDomain, setNewProjDomain] = useState(user.interest || 'Distributed Systems & Cloud Infrastructure');
  const [newProjObjective, setNewProjObjective] = useState('');
  const [newProjTechStack, setNewProjTechStack] = useState('');
  const [newProjOutcome, setNewProjOutcome] = useState('');
  const [newProjTimeline, setNewProjTimeline] = useState(4);

  // Resume Edit Mode
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [editableResume, setEditableResume] = useState<StudentResume>(studentResume);

  // AI Resume Generator & Versioning State
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generationDraft, setGenerationDraft] = useState<ResumeGenerationResponse | null>(null);
  const [isReviewingGeneration, setIsReviewingGeneration] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedAtsText, setCopiedAtsText] = useState(false);
  const [showQuickFillModal, setShowQuickFillModal] = useState<ResumeMissingField | null>(null);
  const [quickFillValue, setQuickFillValue] = useState('');

  useEffect(() => {
    setEditableResume(studentResume);
  }, [studentResume]);

  const computedMissingFields = useMemo<ResumeMissingField[]>(() => {
    const list: ResumeMissingField[] = [];
    if (!studentResume.phone?.trim()) {
      list.push({
        field: 'phone',
        label: 'Phone Number',
        tip: 'Direct telephone contact is an essential ATS parsing field for recruiter screening.',
      });
    }
    if (!studentResume.location?.trim()) {
      list.push({
        field: 'location',
        label: 'Location / City',
        tip: 'Helps regional recruiter filters categorize on-site, hybrid, or remote eligibility.',
      });
    }
    if (!studentResume.githubUrl?.trim()) {
      list.push({
        field: 'githubUrl',
        label: 'GitHub Profile Link',
        tip: 'Technical engineering screeners prioritize candidates with public repository proof.',
      });
    }
    if (!studentResume.linkedinUrl?.trim()) {
      list.push({
        field: 'linkedinUrl',
        label: 'LinkedIn Profile URL',
        tip: 'Industry standard for candidate identity and professional verification.',
      });
    }
    if (studentResume.projects.length === 0) {
      list.push({
        field: 'projects',
        label: 'Verified Project Artifacts',
        tip: 'Add a project in Project Evaluator or Placement Hub to prove hands-on code capability.',
      });
    }
    const skillCount = (studentResume.skills?.programming?.length || 0) + (studentResume.skills?.frameworksAndTools?.length || 0);
    if (skillCount < 4) {
      list.push({
        field: 'skills',
        label: 'Technical Skills',
        tip: 'Log your active programming languages and tools in Learning Hub to expand ATS keywords.',
      });
    }
    return list;
  }, [studentResume]);

  // Internships filter
  const [internshipModeFilter, setInternshipModeFilter] = useState<string>('All');
  const [internshipSearch, setInternshipSearch] = useState('');

  // Interview state
  const [interviewCatFilter, setInterviewCatFilter] = useState<string>('All');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(interviewQuestions[0]);
  const [interviewResponseInput, setInterviewResponseInput] = useState('');
  const [latestInterviewEval, setLatestInterviewEval] = useState<any>(null);

  // Handlers for Projects
  const handleToggleProjectMilestone = (projectId: string, milestoneId: string) => {
    const updated = placementProjects.map((proj) => {
      if (proj.id !== projectId) return proj;
      const updatedMilestones = proj.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;
      const status: PlacementProject['status'] = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
      return {
        ...proj,
        milestones: updatedMilestones,
        progress,
        status,
        inPortfolio: progress === 100 ? true : proj.inPortfolio,
      };
    });

    onUpdateProjects(updated);
    recalculateReadiness(updated, studentResume, resumeAnalysis, interviewAttempts);
  };

  const handleEvaluateProject = async (project: PlacementProject) => {
    setEvaluatingProjectId(project.id);
    try {
      const res = await requestPlacementProjectEvaluation({
        project,
        targetRole: careerAlignment.targetRole || user.targetRole || 'Cloud & Infrastructure Engineer',
      });

      const updated = placementProjects.map((p) =>
        p.id === project.id ? { ...p, evaluation: res.evaluation } : p
      );
      onUpdateProjects(updated);
      recalculateReadiness(updated, studentResume, resumeAnalysis, interviewAttempts);
    } catch (err) {
      console.error('Project evaluation failed:', err);
    } finally {
      setEvaluatingProjectId(null);
    }
  };

  const handleTogglePortfolio = (projectId: string) => {
    const updated = placementProjects.map((p) =>
      p.id === projectId ? { ...p, inPortfolio: !p.inPortfolio } : p
    );
    onUpdateProjects(updated);
  };

  const handleSavePortfolioLinks = (projectId: string, githubUrl: string, demoUrl: string) => {
    const updated = placementProjects.map((p) =>
      p.id === projectId ? { ...p, githubUrl: githubUrl.trim(), demoUrl: demoUrl.trim() } : p
    );
    onUpdateProjects(updated);
    setShowEditPortfolioModal(null);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newProject: PlacementProject = {
      id: `proj-custom-${Date.now()}`,
      title: newProjTitle.trim(),
      difficulty: newProjDifficulty,
      domain: newProjDomain,
      objective: newProjObjective.trim(),
      techStack: newProjTechStack.split(',').map((s) => s.trim()).filter(Boolean),
      expectedOutcome: newProjOutcome.trim(),
      timelineWeeks: Number(newProjTimeline) || 4,
      progress: 0,
      status: 'Not Started',
      milestones: [
        { id: 'm1', title: 'System Architecture & Scaffolding', tasks: ['Design API contract', 'Scaffold repo and Dockerfile'], completed: false },
        { id: 'm2', title: 'Core Implementation', tasks: ['Implement business logic and data model'], completed: false },
        { id: 'm3', title: 'Testing & Documentation', tasks: ['Write test suite', 'Publish README benchmark'], completed: false },
      ],
      inPortfolio: false,
    };

    const updated = [newProject, ...placementProjects];
    onUpdateProjects(updated);
    setShowNewProjectModal(false);
    setNewProjTitle('');
    setNewProjObjective('');
    setNewProjTechStack('');
    setNewProjOutcome('');
  };

  const handleGenerateAIProjects = async () => {
    setIsGeneratingProjects(true);
    try {
      const res = await requestPlacementProjectSuggestions({
        targetRole: careerAlignment.targetRole || user.targetRole || 'Cloud & Infrastructure Engineer',
        department: user.department,
        year: user.year,
      });

      if (res.projects && res.projects.length > 0) {
        onUpdateProjects([...res.projects, ...placementProjects]);
      }
    } catch (err) {
      console.error('Failed generating projects:', err);
    } finally {
      setIsGeneratingProjects(false);
    }
  };

  // Handlers for Resume
  const handleTriggerGenerateAIResume = async () => {
    setIsGeneratingResume(true);
    setGenerationError(null);
    try {
      const res = await generateAIResume(careerAlignment.targetRole || user.targetRole);
      setGenerationDraft(res);
      setEditableResume(res.resume);
      setIsReviewingGeneration(true);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate AI resume');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleSaveGeneratedResume = async () => {
    if (!generationDraft) return;
    try {
      if (onSaveResumeVersion) {
        await onSaveResumeVersion({
          resume: editableResume,
          analysis: generationDraft.analysis,
          source: 'ai_generated',
          notes: generationDraft.generationNotes || `Auto-generated ATS resume for ${editableResume.targetRole}`,
        });
      } else {
        onUpdateResume(editableResume);
        if (generationDraft.analysis) onUpdateResumeAnalysis(generationDraft.analysis);
      }
      setIsReviewingGeneration(false);
      setGenerationDraft(null);
      setIsEditingResume(false);
    } catch (err) {
      console.error('Failed to save generated resume version:', err);
    }
  };

  const handleDiscardGeneratedResume = () => {
    setEditableResume(studentResume);
    setIsReviewingGeneration(false);
    setGenerationDraft(null);
  };

  const handleScanResume = async () => {
    setIsScanningResume(true);
    try {
      const targetResume = isReviewingGeneration ? editableResume : studentResume;
      const res = await requestResumeATSAnalysis({
        resume: targetResume,
        targetRole: careerAlignment.targetRole || user.targetRole || 'Cloud & Infrastructure Engineer',
      });

      if (res.analysis) {
        onUpdateResumeAnalysis(res.analysis);
        recalculateReadiness(placementProjects, targetResume, res.analysis, interviewAttempts);
      }
    } catch (err) {
      console.error('ATS scan failed:', err);
    } finally {
      setIsScanningResume(false);
    }
  };

  const handleSaveResumeEdit = async () => {
    try {
      if (onSaveResumeVersion) {
        await onSaveResumeVersion({
          resume: editableResume,
          analysis: resumeAnalysis,
          source: 'manual_edit',
          notes: 'User updated resume details',
        });
      } else {
        onUpdateResume(editableResume);
      }
      setIsEditingResume(false);
    } catch (err) {
      console.error('Failed to save resume edit:', err);
    }
  };

  const handleRestoreVersionClick = async (versionId: string) => {
    if (onRestoreResumeVersion) {
      await onRestoreResumeVersion(versionId);
      setShowVersionHistoryModal(false);
    }
  };

  const handleCopyAtsText = () => {
    const r = isReviewingGeneration ? editableResume : studentResume;
    const lines = [
      `${r.fullName.toUpperCase()}`,
      `Target Role: ${r.targetRole}`,
      `Email: ${r.email} | Phone: ${r.phone || '[Phone Not Provided]'} | Location: ${r.location || '[Location Not Provided]'}`,
      r.githubUrl ? `GitHub: ${r.githubUrl}` : '',
      r.linkedinUrl ? `LinkedIn: ${r.linkedinUrl}` : '',
      r.portfolioUrl ? `Portfolio: ${r.portfolioUrl}` : '',
      '',
      'PROFESSIONAL SUMMARY',
      '----------------------------------------',
      r.summary,
      '',
      'EDUCATION',
      '----------------------------------------',
      ...r.education.map((e) => `${e.degree} - ${e.institution} (${e.year})${e.gpa ? ` | GPA: ${e.gpa}` : ''}`),
      '',
      'TECHNICAL COMPETENCIES',
      '----------------------------------------',
      `Programming Languages: ${r.skills.programming.join(', ')}`,
      `Frameworks & Tooling: ${r.skills.frameworksAndTools.join(', ')}`,
      `Cloud & Infrastructure: ${r.skills.cloudAndDevOps.join(', ')}`,
      `Soft Skills & Methodologies: ${r.skills.softSkills.join(', ')}`,
      '',
      'VERIFIED PROJECTS',
      '----------------------------------------',
      ...r.projects.map((p) => [
        `* ${p.title} (${p.techStack.join(', ')})`,
        p.githubUrl ? `  Repo: ${p.githubUrl}` : '',
        ...p.highlights.map((h) => `  - ${h}`),
        '',
      ].filter(Boolean).join('\n')),
      r.certifications && r.certifications.length > 0 ? [
        'CERTIFICATIONS & ACHIEVEMENTS',
        '----------------------------------------',
        ...r.certifications.map((c) => `* ${c.name} - ${c.issuer} (${c.year})`),
      ].join('\n') : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopiedAtsText(true);
      setTimeout(() => setCopiedAtsText(false), 2500);
    });
  };

  const handlePrintResume = () => {
    window.print();
  };

  const handleQuickFillSubmit = async () => {
    if (!showQuickFillModal) return;
    const field = showQuickFillModal.field;
    const updated = { ...studentResume, [field]: quickFillValue.trim() };
    if (onSaveResumeVersion) {
      await onSaveResumeVersion({
        resume: updated,
        analysis: resumeAnalysis,
        source: 'manual_edit',
        notes: `Added verified ${showQuickFillModal.label}`,
      });
    } else {
      onUpdateResume(updated);
    }
    setShowQuickFillModal(null);
    setQuickFillValue('');
  };

  const handleApplyBulletImprovement = (projectTitle: string, improvedBullet: string) => {
    const base = isReviewingGeneration ? editableResume : studentResume;
    const updatedProjects = base.projects.map((p) => {
      if (p.title.toLowerCase().includes(projectTitle.toLowerCase())) {
        return {
          ...p,
          highlights: [improvedBullet, ...p.highlights.slice(1)],
        };
      }
      return p;
    });

    const updatedResume: StudentResume = {
      ...base,
      projects: updatedProjects,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (isReviewingGeneration) {
      setEditableResume(updatedResume);
    } else {
      onUpdateResume(updatedResume);
      setEditableResume(updatedResume);
    }
  };

  // Handlers for Interviews
  const handleSubmitInterviewResponse = async () => {
    if (!interviewResponseInput.trim()) return;
    setIsEvaluatingInterview(true);
    try {
      const res = await requestInterviewResponseEvaluation({
        question: selectedQuestion,
        studentResponse: interviewResponseInput.trim(),
        category: selectedQuestion.category,
        targetRole: careerAlignment.targetRole || user.targetRole || 'Cloud & Infrastructure Engineer',
      });

      const newAttempt: InterviewAttempt = {
        id: `att-${Date.now()}`,
        questionId: selectedQuestion.id,
        category: selectedQuestion.category,
        topic: selectedQuestion.topic,
        questionText: selectedQuestion.question,
        studentResponse: interviewResponseInput.trim(),
        score: res.evaluation.score,
        feedback: res.evaluation.feedback,
        attemptedAt: new Date().toISOString().split('T')[0],
      };

      setLatestInterviewEval(res.evaluation);
      onAddInterviewAttempt(newAttempt);
      recalculateReadiness(placementProjects, studentResume, resumeAnalysis, [newAttempt, ...interviewAttempts]);
    } catch (err) {
      console.error('Interview evaluation error:', err);
    } finally {
      setIsEvaluatingInterview(false);
    }
  };

  // Handlers for Internships
  const handleToggleInternshipStatus = (id: string, newStatus: 'Not Applied' | 'Saved' | 'Applied') => {
    const updated = internships.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
    onUpdateInternships(updated);
  };

  // Dynamic Placement Readiness Recalculation
  const recalculateReadiness = (
    currentProjects: PlacementProject[],
    currentResume: StudentResume,
    currentResumeAnalysis: ResumeATSAnalysis,
    currentAttempts: InterviewAttempt[]
  ) => {
    const completedProjects = currentProjects.filter((p) => p.status === 'Completed');
    const avgProjQuality = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => sum + (p.evaluation?.qualityScore || 80), 0) / completedProjects.length
      : 70;

    const resumeScore = currentResumeAnalysis.overallScore || 80;

    const techAttempts = currentAttempts.filter((a) => a.category === 'Technical');
    const hrAttempts = currentAttempts.filter((a) => a.category === 'HR/Communication');
    const aptAttempts = currentAttempts.filter((a) => a.category === 'Aptitude');

    const avgInterview = currentAttempts.length > 0
      ? currentAttempts.reduce((sum, a) => sum + a.score, 0) / currentAttempts.length
      : 80;

    const aptScore = aptAttempts.length > 0
      ? aptAttempts.reduce((sum, a) => sum + a.score, 0) / aptAttempts.length
      : 84;

    const rawReadiness = Math.round(
      avgProjQuality * 0.25 +
      resumeScore * 0.20 +
      avgInterview * 0.20 +
      aptScore * 0.10 +
      careerAlignment.score * 0.25
    );

    const overallScore = Math.min(98, Math.max(55, rawReadiness));
    const status: PlacementReadinessData['status'] =
      overallScore >= 88 ? 'Ready for Top Tech' :
      overallScore >= 78 ? 'Well Prepared' :
      overallScore >= 68 ? 'Moderate Readiness' : 'Needs Targeted Practice';

    onUpdatePlacementReadiness({
      ...placementReadiness,
      overallScore,
      status,
      breakdown: {
        skillProficiency: Math.round(careerAlignment.score * 0.95),
        projectQuality: Math.round(avgProjQuality),
        resumeStrength: resumeScore,
        learningProgress: Math.min(100, streakData.totalDays * 3.5),
        interviewPerformance: Math.round(avgInterview),
        aptitudePerformance: Math.round(aptScore),
        careerAlignment: careerAlignment.score,
      },
    });
  };

  // Filtered lists
  const filteredProjects = placementProjects.filter((p) => {
    if (projectDifficultyFilter !== 'All' && p.difficulty !== projectDifficultyFilter) return false;
    if (projectStatusFilter !== 'All' && p.status !== projectStatusFilter) return false;
    return true;
  });

  const portfolioProjects = placementProjects.filter((p) => p.inPortfolio || p.status === 'Completed');

  const filteredInternships = internships.filter((item) => {
    if (internshipModeFilter !== 'All' && item.mode !== internshipModeFilter) return false;
    if (internshipSearch.trim()) {
      const q = internshipSearch.toLowerCase();
      return (
        item.roleTitle.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredQuestions = interviewQuestions.filter((q) => {
    if (interviewCatFilter !== 'All' && q.category !== interviewCatFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: AI Career & Placement Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Briefcase className="w-3.5 h-3.5" />
                Phase 4: AI Career & Placement Hub
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-normal">{user.department}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-normal">{user.year}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Placement & Industry Readiness
              </h1>
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white shadow-xs">
                {careerAlignment.targetRole || user.targetRole || 'Cloud & Infrastructure Engineer'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
              Transform your domain learning and evaluated code into tangible placement readiness: build production portfolio artifacts, scan your resume with an ATS engine, match real internships, and practice mock technical rounds.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={() => setActiveTab('interviews')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Practice Mock Interview</span>
            </button>

            <button
              onClick={() => handleScanResume()}
              disabled={isScanningResume}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningResume ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              <span>{isScanningResume ? 'Scanning...' : 'Scan ATS Resume'}</span>
            </button>
          </div>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Tile 1: Placement Readiness */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Placement Readiness</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {placementReadiness.overallScore}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${
                placementReadiness.overallScore >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {placementReadiness.status}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${placementReadiness.overallScore}%` }} 
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>{placementReadiness.strengths.length} Key Strengths</span>
              <span className="font-semibold text-slate-700">{placementReadiness.criticalGaps.length} Gaps</span>
            </div>
          </div>

          {/* Tile 2: Project Quality */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Evaluated Projects</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {placementProjects.filter((p) => p.status === 'Completed').length}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ {placementProjects.length} Done</span>
              <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded ml-auto">
                Avg: {Math.round(placementProjects.filter((p) => p.evaluation).reduce((s, p) => s + (p.evaluation?.qualityScore || 80), 0) / Math.max(1, placementProjects.filter((p) => p.evaluation).length))}% Score
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>{portfolioProjects.length} in Public Portfolio</span>
              <span className="font-semibold text-slate-700 font-mono">100% Truthful</span>
            </div>
          </div>

          {/* Tile 3: Resume ATS Match */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Resume ATS Strength</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {resumeAnalysis.overallScore}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ 100</span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">
                Role Match: {resumeAnalysis.roleMatchScore}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>{resumeAnalysis.matchedKeywords.length} Keywords Matched</span>
              <span className="font-semibold text-rose-700">{resumeAnalysis.missingKeywords.length} Missing</span>
            </div>
          </div>

          {/* Tile 4: Interview & Internships */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Interview & Opportunities</span>
              <Building2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {interviewStats.averageScore}%
              </span>
              <span className="text-xs font-semibold text-slate-500">Mock Score</span>
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">
                {internships.length} Open Roles
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>{interviewAttempts.length} Questions Practiced</span>
              <span className="font-semibold text-slate-700">{internships.filter((i) => i.matchScore >= 88).length} Top Matches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'readiness', label: `Placement Readiness (${placementReadiness.overallScore}%)`, icon: Award },
          { id: 'projects', label: `Placement Projects (${placementProjects.length})`, icon: Layers },
          { id: 'portfolio', label: `Portfolio (${portfolioProjects.length})`, icon: Eye },
          { id: 'resume', label: `ATS Resume (${resumeAnalysis.overallScore}/100)`, icon: FileText },
          { id: 'internships', label: `Internships (${internships.length})`, icon: Building2 },
          { id: 'interviews', label: `Mock Interviews (${interviewStats.averageScore}%)`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLACEMENT READINESS */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Main Readiness Gauge & Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>Dynamic Placement Index</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Comprehensive Readiness for {careerAlignment.targetRole}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Computed from 7 distinct pillars across code quality, ATS resume readiness, mock interviews, and learning consistency.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right self-start sm:self-center">
                <div className="text-[11px] text-slate-500 font-medium">Estimated Readiness Window</div>
                <div className="text-sm font-bold text-slate-900">
                  {placementReadiness.estimatedTimeframeToReady}
                </div>
              </div>
            </div>

            {/* 7-Pillar Breakdown Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Technical Skill Proficiency', val: placementReadiness.breakdown.skillProficiency, target: 85 },
                { label: 'Project Technical Depth & Quality', val: placementReadiness.breakdown.projectQuality, target: 85 },
                { label: 'Resume ATS Keyword Match', val: placementReadiness.breakdown.resumeStrength, target: 85 },
                { label: 'Learning Consistency & Streak', val: placementReadiness.breakdown.learningProgress, target: 80 },
                { label: 'Technical Mock Interview Score', val: placementReadiness.breakdown.interviewPerformance, target: 80 },
                { label: 'Quantitative & Aptitude Accuracy', val: placementReadiness.breakdown.aptitudePerformance, target: 80 },
                { label: 'Domain Career Alignment', val: placementReadiness.breakdown.careerAlignment, target: 85 },
              ].map((pillar, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{pillar.label}</span>
                    <span className="font-mono font-bold text-slate-900">{pillar.val}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pillar.val >= pillar.target ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pillar.val}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Industry Benchmark: {pillar.target}%</span>
                    <span>{pillar.val >= pillar.target ? 'Benchmark Exceeded' : 'Needs Practice'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Gaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Competitive Strengths for Placement</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {placementReadiness.strengths.map((s, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Critical Gaps to Close</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {placementReadiness.criticalGaps.map((g, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Highest-Impact Next Actions */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Highest-Impact Next Actions for Student Success</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {placementReadiness.highestImpactNextActions.map((act, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2 flex flex-col justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-snug text-slate-200">{act}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLACEMENT PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setProjectDifficultyFilter(lvl)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      projectDifficultyFilter === lvl ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAIProjects}
                disabled={isGeneratingProjects}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingProjects ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                <span>{isGeneratingProjects ? 'Generating...' : 'AI Generate Projects'}</span>
              </button>

              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        proj.difficulty === 'Intermediate' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {proj.difficulty}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        proj.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {proj.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {proj.timelineWeeks} Weeks Timeline
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{proj.objective}</p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {proj.techStack.map((tech, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Quality Badge */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
                    {proj.evaluation ? (
                      <div className="text-right bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
                        <div className="text-[10px] text-emerald-800 font-semibold uppercase">Project Quality Score</div>
                        <div className="text-xl font-extrabold text-emerald-900 tabular-nums">
                          {proj.evaluation.qualityScore} / 100
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEvaluateProject(proj)}
                        disabled={evaluatingProjectId === proj.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{evaluatingProjectId === proj.id ? 'Evaluating...' : 'AI Quality Evaluation'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePortfolio(proj.id)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                          proj.inPortfolio ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {proj.inPortfolio ? 'In Portfolio ✓' : '+ Add to Portfolio'}
                      </button>

                      <button
                        onClick={() => setShowEditPortfolioModal(proj)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        Edit Links
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestones checklist */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span className="uppercase tracking-wider">Milestones & Technical Deliverables</span>
                    <span className="font-mono text-slate-500">{proj.progress}% Complete</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {proj.milestones.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleToggleProjectMilestone(proj.id, m.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-start gap-2 ${
                          m.completed ? 'bg-emerald-50/40 border-emerald-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className={`font-semibold ${m.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {m.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {m.tasks.join(', ')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evaluation Feedback if present */}
                {proj.evaluation && (
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-lg text-xs space-y-2">
                    <p className="text-slate-700 italic">"{proj.evaluation.evaluationSummary}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-emerald-800">Strengths:</span> {proj.evaluation.strengths.join('; ')}
                      </div>
                      <div>
                        <span className="font-bold text-amber-800">Improvement Actions:</span> {proj.evaluation.improvementActions.join('; ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Truthful Student Portfolio</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Verified Technical Proof-of-Work Showcase
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Never fabricated. Displays projects evaluated for technical depth and production readiness.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 font-mono">
                {portfolioProjects.length} Public Artifacts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolioProjects.map((p) => (
              <div 
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {p.domain}
                    </span>
                    {p.evaluation && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.evaluation.qualityScore} Quality Score
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{p.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{p.objective}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {p.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setShowEditPortfolioModal(p)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Edit URLs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ATS RESUME & AI RESUME GENERATOR */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          {/* Top Review Banner if newly generated */}
          {isReviewingGeneration && (
            <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-500/40 rounded-2xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        AI Resume Draft Generated for {editableResume.targetRole}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-100 text-emerald-800">
                        {generationDraft?.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Verified Assembly'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {generationDraft?.generationNotes || 'Crafted exclusively from your verified PathPilot records. No fabricated data.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={handleDiscardGeneratedResume}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs"
                  >
                    Discard Draft
                  </button>
                  <button
                    onClick={() => setIsEditingResume(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Draft</span>
                  </button>
                  <button
                    onClick={handleSaveGeneratedResume}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Version to Database</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Missing Verified Data Warning Banner */}
          {computedMissingFields.length > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900">
                      Incomplete ATS Data Checklist ({computedMissingFields.length} recommended field{computedMissingFields.length > 1 ? 's' : ''} missing)
                    </h4>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                      Zero-Fabrication Guarantee
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    PathPilot never invents contact info, degrees, companies, or false credentials. Providing these missing details maximizes ATS screening pass rates:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 pl-6.5">
                {computedMissingFields.map((mf, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white border border-amber-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                    <span className="font-semibold text-slate-800">{mf.label}</span>
                    {['phone', 'location', 'githubUrl', 'linkedinUrl'].includes(mf.field) && (
                      <button
                        onClick={() => {
                          setShowQuickFillModal(mf);
                          setQuickFillValue('');
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generation Error Alert */}
          {generationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{generationError}</span>
              </div>
              <button onClick={() => setGenerationError(null)} className="text-rose-500 hover:text-rose-700 font-bold">
                ✕
              </button>
            </div>
          )}

          {/* ATS Analysis Summary & Generation Control Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>ATS Keyword & Structure Analysis</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-mono">ATS Score: {resumeAnalysis.overallScore}%</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Targeted Resume for {careerAlignment.targetRole || user.targetRole || 'Software Engineer'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optimized for Applicant Tracking Systems and hiring manager technical screens.
                </p>
              </div>

              {/* Main Actions Bar */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleTriggerGenerateAIResume}
                  disabled={isGeneratingResume}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg transition-all shadow-xs disabled:opacity-50"
                  title="Generate ATS resume automatically using verified user data"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingResume ? 'animate-spin text-amber-200' : 'text-amber-300'}`} />
                  <span>{isGeneratingResume ? 'Generating ATS Resume...' : 'Generate AI Resume'}</span>
                </button>

                <button
                  onClick={() => setShowVersionHistoryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="View saved versions and restore previous drafts"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Versions ({resumeVersions?.length || 1})</span>
                </button>

                <button
                  onClick={() => setIsEditingResume(!isEditingResume)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isEditingResume ? 'Close Editor' : 'Edit Details'}</span>
                </button>

                <button
                  onClick={handleCopyAtsText}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Copy ATS plain-text representation"
                >
                  {copiedAtsText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintResume}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Print or export to ATS-clean PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={handleScanResume}
                  disabled={isScanningResume}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Re-run ATS scoring & keyword analysis"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningResume ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                  <span>{isScanningResume ? 'Scanning...' : 'Re-Scan ATS'}</span>
                </button>
              </div>
            </div>

            {/* Keyword Match Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                  <span>Matched Industry Keywords ({resumeAnalysis.matchedKeywords.length})</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.matchedKeywords.length > 0 ? (
                    resumeAnalysis.matchedKeywords.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[11px] bg-white text-emerald-800 border border-emerald-200 rounded font-medium">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No matched role keywords detected yet.</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                  <span>Missing Recommended Keywords ({resumeAnalysis.missingKeywords.length})</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.missingKeywords.length > 0 ? (
                    resumeAnalysis.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[11px] bg-white text-rose-800 border border-rose-200 rounded font-medium">
                        + {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-medium">All benchmark keywords fulfilled!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Google X-Y-Z Bullet Point Improvements */}
            {resumeAnalysis.projectImprovements.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Bullet Point Upgrades (Google X-Y-Z Metric Formula)
                </h3>
                <div className="space-y-3">
                  {resumeAnalysis.projectImprovements.map((imp, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-900">{imp.projectTitle}</div>
                      <div className="text-slate-500 line-through">"{imp.originalBullet}"</div>
                      <div className="text-emerald-900 font-medium bg-emerald-50 p-2 rounded border border-emerald-200">
                        "{imp.improvedBullet}"
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 italic">{imp.reason}</span>
                        <button
                          onClick={() => handleApplyBulletImprovement(imp.projectTitle, imp.improvedBullet)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                        >
                          Apply to Resume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form or Preview of Resume */}
          {isEditingResume ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Edit Resume Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editableResume.fullName}
                    onChange={(e) => setEditableResume({ ...editableResume, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={editableResume.targetRole}
                    onChange={(e) => setEditableResume({ ...editableResume, targetRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editableResume.phone}
                    onChange={(e) => setEditableResume({ ...editableResume, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="Bengaluru, India / Open to Remote"
                    value={editableResume.location}
                    onChange={(e) => setEditableResume({ ...editableResume, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={editableResume.githubUrl || ''}
                    onChange={(e) => setEditableResume({ ...editableResume, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={editableResume.linkedinUrl || ''}
                    onChange={(e) => setEditableResume({ ...editableResume, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  rows={3}
                  value={editableResume.summary}
                  onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsEditingResume(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResumeEdit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Version</span>
                </button>
              </div>
            </div>
          ) : (
            /* ATS Clean Resume Document Render */
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs max-w-4xl mx-auto space-y-6 text-xs text-slate-800 font-sans print:shadow-none print:border-none print:p-0">
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {(isReviewingGeneration ? editableResume : studentResume).fullName}
                </h2>
                <div className="text-slate-600 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                  <span>{(isReviewingGeneration ? editableResume : studentResume).email}</span>
                  {(isReviewingGeneration ? editableResume : studentResume).phone && (
                    <>
                      <span>·</span>
                      <span>{(isReviewingGeneration ? editableResume : studentResume).phone}</span>
                    </>
                  )}
                  {(isReviewingGeneration ? editableResume : studentResume).location && (
                    <>
                      <span>·</span>
                      <span>{(isReviewingGeneration ? editableResume : studentResume).location}</span>
                    </>
                  )}
                  {(isReviewingGeneration ? editableResume : studentResume).githubUrl && (
                    <>
                      <span>·</span>
                      <a
                        href={(isReviewingGeneration ? editableResume : studentResume).githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Github className="w-3 h-3" />
                        <span>GitHub</span>
                      </a>
                    </>
                  )}
                  {(isReviewingGeneration ? editableResume : studentResume).linkedinUrl && (
                    <>
                      <span>·</span>
                      <a
                        href={(isReviewingGeneration ? editableResume : studentResume).linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        LinkedIn
                      </a>
                    </>
                  )}
                </div>
                <div className="font-semibold text-slate-800 text-[11px] pt-0.5">
                  {(isReviewingGeneration ? editableResume : studentResume).targetRole}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                  Professional Summary
                </h3>
                <p className="leading-relaxed text-slate-700">
                  {(isReviewingGeneration ? editableResume : studentResume).summary || 'No summary configured yet.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                  Education
                </h3>
                {(isReviewingGeneration ? editableResume : studentResume).education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">{edu.institution}</div>
                      <div className="text-slate-700">{edu.degree}</div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      <div>{edu.year}</div>
                      {edu.gpa && <div className="font-bold text-slate-800">GPA: {edu.gpa}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                  Technical & Domain Competencies
                </h3>
                <div className="space-y-1 text-slate-700">
                  <div>
                    <strong>Programming Languages:</strong>{' '}
                    {(isReviewingGeneration ? editableResume : studentResume).skills?.programming?.length > 0
                      ? (isReviewingGeneration ? editableResume : studentResume).skills.programming.join(', ')
                      : 'None logged yet'}
                  </div>
                  <div>
                    <strong>Frameworks & Developer Tooling:</strong>{' '}
                    {(isReviewingGeneration ? editableResume : studentResume).skills?.frameworksAndTools?.length > 0
                      ? (isReviewingGeneration ? editableResume : studentResume).skills.frameworksAndTools.join(', ')
                      : 'None logged yet'}
                  </div>
                  <div>
                    <strong>Cloud & DevOps:</strong>{' '}
                    {(isReviewingGeneration ? editableResume : studentResume).skills?.cloudAndDevOps?.length > 0
                      ? (isReviewingGeneration ? editableResume : studentResume).skills.cloudAndDevOps.join(', ')
                      : 'None logged yet'}
                  </div>
                  <div>
                    <strong>Soft Skills & Methodologies:</strong>{' '}
                    {(isReviewingGeneration ? editableResume : studentResume).skills?.softSkills?.length > 0
                      ? (isReviewingGeneration ? editableResume : studentResume).skills.softSkills.join(', ')
                      : 'System Design, Problem Solving'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                  Key Technical Projects (Verified Proof of Work)
                </h3>
                {(isReviewingGeneration ? editableResume : studentResume).projects.length > 0 ? (
                  <div className="space-y-3">
                    {(isReviewingGeneration ? editableResume : studentResume).projects.map((proj) => (
                      <div key={proj.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{proj.title}</span>
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5 text-[10px]"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Repo</span>
                              </a>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{proj.techStack?.join(' | ')}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {proj.highlights?.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">
                    No verified projects attached yet. Complete a project milestone or submit an evaluation in Phase 1 to automatically populate verified achievements.
                  </p>
                )}
              </div>

              {/* Experience if present */}
              {(isReviewingGeneration ? editableResume : studentResume).experience && (isReviewingGeneration ? editableResume : studentResume).experience.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                    Professional & Campus Experience
                  </h3>
                  <div className="space-y-3">
                    {(isReviewingGeneration ? editableResume : studentResume).experience.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{exp.role} · {exp.company}</span>
                          <span className="font-mono text-[10px] text-slate-500">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {exp.highlights?.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications if present */}
              {(isReviewingGeneration ? editableResume : studentResume).certifications && (isReviewingGeneration ? editableResume : studentResume).certifications.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 mb-2">
                    Certifications & Verified Achievements
                  </h3>
                  <ul className="space-y-1">
                    {(isReviewingGeneration ? editableResume : studentResume).certifications.map((c, idx) => (
                      <li key={idx} className="flex justify-between text-slate-700">
                        <span><strong>{c.name}</strong> — {c.issuer}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{c.year}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: INTERNSHIPS */}
      {activeTab === 'internships' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                {['All', 'Hybrid', 'Remote', 'On-site'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setInternshipModeFilter(m)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      internshipModeFilter === m ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies, roles, skills..."
                value={internshipSearch}
                onChange={(e) => setInternshipSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredInternships.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{item.companyName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.location}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {item.mode}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                      {item.matchScore}% Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.roleTitle}</h3>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>Stipend: <strong className="text-slate-900">{item.stipend}</strong></span>
                    <span>·</span>
                    <span>Duration: {item.duration}</span>
                    <span>·</span>
                    <span>Deadline: <span className="font-mono text-slate-800">{item.applicationDeadline}</span></span>
                  </div>

                  {/* Match reasons */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-emerald-800">Why You Match:</div>
                    <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 mt-0.5">
                      {item.matchReasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
                  <a
                    href={item.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  >
                    <span>Apply on Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-1.5 text-xs">
                    {(['Saved', 'Applied', 'Not Applied'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleToggleInternshipStatus(item.id, st)}
                        className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                          item.status === st ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MOCK INTERVIEWS */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Question Selector & Category Filter */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Question Bank</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {interviewAttempts.length} Attempted
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {['All', 'Technical', 'HR/Communication', 'Aptitude'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setInterviewCatFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-colors ${
                      interviewCatFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestion(q);
                      setInterviewResponseInput('');
                      setLatestInterviewEval(null);
                    }}
                    className={`w-full p-3 rounded-lg border text-left text-xs transition-colors space-y-1 ${
                      selectedQuestion.id === q.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>{q.category}</span>
                      <span className="font-mono">{q.difficulty}</span>
                    </div>
                    <div className="font-semibold line-clamp-2 leading-snug">{q.question}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Active Question & Interactive AI Response Area */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                    {selectedQuestion.category}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{selectedQuestion.topic}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedQuestion.question}
                </h3>

                {selectedQuestion.contextOrScenario && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedQuestion.contextOrScenario}
                  </p>
                )}

                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">Key Concepts Expected by Evaluators:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedQuestion.keyConceptsToCover.map((kc, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded">
                        ✓ {kc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Response Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Your Response (Explain clearly as you would in a technical interview):
                </label>
                <textarea
                  rows={5}
                  value={interviewResponseInput}
                  onChange={(e) => setInterviewResponseInput(e.target.value)}
                  placeholder="Type your explanation or trade-off reasoning here..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {interviewResponseInput.length} characters
                  </span>
                  <button
                    onClick={handleSubmitInterviewResponse}
                    disabled={isEvaluatingInterview || interviewResponseInput.trim().length < 10}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isEvaluatingInterview ? 'Evaluating Answer...' : 'Submit to AI Evaluator'}</span>
                  </button>
                </div>
              </div>

              {/* Real-time AI Evaluation Feedback */}
              {latestInterviewEval && (
                <div className="pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">AI Evaluation Feedback</span>
                    <span className="text-sm font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-mono">
                      {latestInterviewEval.score} / 100 Score
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="font-bold text-emerald-800 mb-1">Strengths Noted:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                        {latestInterviewEval.feedback?.strengths?.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="font-bold text-amber-800 mb-1">Recommended Adjustments:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                        {latestInterviewEval.feedback?.improvements?.map((imp: string, idx: number) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {latestInterviewEval.feedback?.modelAnswerSnippet && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1 text-[11px]">Model Response Outline:</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {latestInterviewEval.feedback.modelAnswerSnippet}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PROJECT */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Industry Placement Project</h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Object Store with Ring Hashing"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={newProjDifficulty}
                    onChange={(e) => setNewProjDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Timeline (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newProjTimeline}
                    onChange={(e) => setNewProjTimeline(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tech Stack (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Go, gRPC, Docker, Redis"
                  value={newProjTechStack}
                  onChange={(e) => setNewProjTechStack(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Core Engineering Objective</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What computational or system design challenge will this project solve?"
                  value={newProjObjective}
                  onChange={(e) => setNewProjObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. Multi-node cluster surviving node termination"
                  value={newProjOutcome}
                  onChange={(e) => setNewProjOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PORTFOLIO LINKS */}
      {showEditPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Portfolio Proof Links</h3>
              <button onClick={() => setShowEditPortfolioModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide authentic repository and demonstration URLs for <strong>{showEditPortfolioModal.title}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/your-username/project-repo"
                  defaultValue={showEditPortfolioModal.githubUrl || ''}
                  id="modal-github-url"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Live Demo / Architecture URL</label>
                <input
                  type="url"
                  placeholder="https://your-demo-url.app"
                  defaultValue={showEditPortfolioModal.demoUrl || ''}
                  id="modal-demo-url"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowEditPortfolioModal(null)}
                className="px-4 py-2 text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const gh = (document.getElementById('modal-github-url') as HTMLInputElement)?.value || '';
                  const demo = (document.getElementById('modal-demo-url') as HTMLInputElement)?.value || '';
                  handleSavePortfolioLinks(showEditPortfolioModal.id, gh, demo);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
              >
                Save Links
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
