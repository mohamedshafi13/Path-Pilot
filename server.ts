import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { GoogleGenAI, Type } from '@google/genai';
import { apiRouter } from './server/routes.ts';
import { db } from './server/db.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pathpilot_production_secret_key_2026_xyz';

app.use(express.json());

// Mount production database & authentication API routes
app.use('/api', apiRouter);

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint: AI Project Suggestions based on Department, Year, and Interest
app.post('/api/suggest-projects', async (req: Request, res: Response) => {
  const { department, year, interest, currentSkills = [] } = req.body;

  if (!department || !interest) {
    return res.status(400).json({ error: 'Department and interest are required.' });
  }

  // Fallback template library in case AI service is unavailable or key not configured
  const getFallbackProjects = () => [
    {
      id: `proj-${Date.now()}-1`,
      title: `Intelligent ${interest} Analytics & Prediction Engine`,
      domain: interest,
      difficulty: 'Intermediate',
      estimatedWeeks: 4,
      description: `Build a real-world pipeline that gathers domain data, applies machine intelligence or rigorous analytical models, and outputs interactive visual dashboards with decision support.`,
      technologies: ['TypeScript', 'Python', 'FastAPI', 'TailwindCSS', 'PostgreSQL'],
      learningOutcomes: [
        'End-to-end data pipeline architecture',
        'Model inference optimization and metric tracking',
        'Production REST API design and security',
      ],
      industryRelevance: `Directly aligns with software engineer and domain specialist roles requiring production pipeline experience and verifiable portfolio artifacts.`,
      milestones: [
        'Week 1: Problem scoping, dataset acquisition, and schema design',
        'Week 2: Core processing algorithm / machine learning model baseline',
        'Week 3: Interactive client dashboard and metrics visualization',
        'Week 4: Automated unit testing, CI/CD, and portfolio documentation',
      ],
    },
    {
      id: `proj-${Date.now()}-2`,
      title: `Decentralized / Resilient ${interest} Microservice`,
      domain: interest,
      difficulty: 'Advanced',
      estimatedWeeks: 6,
      description: `Architect a fault-tolerant distributed system specifically targeted at modern ${department} challenges, complete with caching, worker queues, and real-time event streaming.`,
      technologies: ['Node.js/Go', 'Docker', 'Redis', 'WebSockets', 'Prometheus'],
      learningOutcomes: [
        'Microservice decoupling & event-driven patterns',
        'Concurrent throughput handling and low-latency caching',
        'Observability, telemetry, and rate limiting',
      ],
      industryRelevance: `Demonstrates high-scale backend thinking demanded by top tier engineering firms and infrastructure teams.`,
      milestones: [
        'Week 1: Architecture diagram and protocol specification',
        'Week 2: Core service implementation and state store',
        'Week 3: Asynchronous job queue and distributed caching',
        'Week 4: Benchmark stress testing under heavy load',
      ],
    },
    {
      id: `proj-${Date.now()}-3`,
      title: `${interest} Automated Workflow & Quality Auditor`,
      domain: interest,
      difficulty: 'Beginner to Intermediate',
      estimatedWeeks: 3,
      description: `Develop a developer or researcher productivity utility that checks compliance, runs verification heuristics, and generates actionable diagnostic reports for ${department} workflows.`,
      technologies: ['TypeScript', 'React', 'Node.js', 'CLI Tools'],
      learningOutcomes: [
        'AST / Static analysis or heuristic scoring logic',
        'Clean modular software design',
        'Documentation and open-source contribution readiness',
      ],
      industryRelevance: `Shows mastery of developer ergonomics, code quality standards, and automated verification tools.`,
      milestones: [
        'Week 1: CLI and parsing specification',
        'Week 2: Rule engine and report generation',
        'Week 3: Web UI wrapper and distribution package',
      ],
    },
  ];

  if (!ai) {
    return res.json({ projects: getFallbackProjects(), source: 'curated-fallback' });
  }

  try {
    const prompt = `You are a distinguished university engineering faculty mentor and industry tech lead.
A student in ${department} (${year}) with special interest in "${interest}" wants project ideas.
Their current listed skills are: ${currentSkills.length ? currentSkills.join(', ') : 'Foundational coursework'}.

Generate 3 diverse, highly realistic, industry-relevant project ideas tailored specifically to their academic stage and domain.
Each project must challenge the student constructively and build genuine portfolio readiness.

Return ONLY a JSON array of 3 objects with this exact structure:
[
  {
    "id": "proj-1",
    "title": "Title of project",
    "domain": "${interest}",
    "difficulty": "Beginner | Intermediate | Advanced",
    "estimatedWeeks": 4,
    "description": "Comprehensive 2-sentence description of what they build and the core problem it solves.",
    "technologies": ["tech1", "tech2", "tech3", "tech4"],
    "learningOutcomes": ["outcome 1", "outcome 2", "outcome 3"],
    "industryRelevance": "Why employers and research labs value this specific project artifact.",
    "milestones": ["Week 1: ...", "Week 2: ...", "Week 3: ...", "Week 4: ..."]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return res.json({ projects: Array.isArray(parsed) ? parsed : getFallbackProjects(), source: 'gemini' });
  } catch (err: any) {
    console.error('Error generating project suggestions:', err);
    return res.json({ projects: getFallbackProjects(), source: 'curated-fallback', note: err.message });
  }
});

// Endpoint: AI Project Evaluation for Student Improvement
app.post('/api/evaluate-project', async (req: Request, res: Response) => {
  const {
    projectTitle,
    department,
    interest,
    year,
    description,
    githubUrl,
    architectureDetails,
    challengesFaced,
    techStack = [],
  } = req.body;

  if (!projectTitle || !description) {
    return res.status(400).json({ error: 'Project title and description are required.' });
  }

  const getFallbackEvaluation = () => {
    const techCount = Array.isArray(techStack) ? techStack.length : 2;
    const descLength = description.length;
    const baseScore = Math.min(88, Math.max(72, 70 + Math.floor(techCount * 2.5) + (descLength > 120 ? 5 : 0)));
    
    return {
      overallScore: baseScore,
      scoreBreakdown: {
        technicalComplexity: Math.min(25, Math.floor(baseScore * 0.26)),
        industryRelevance: Math.min(25, Math.floor(baseScore * 0.27)),
        codeArchitectureQuality: Math.min(25, Math.floor(baseScore * 0.24)),
        innovationAndImpact: Math.min(25, Math.floor(baseScore * 0.23)),
      },
      evaluationSummary: `Solid project foundation demonstrating applied domain competence in ${interest}. The approach addresses practical problem solving within ${department}, with substantial room to elevate technical rigor and production readiness.`,
      strengths: [
        `Clear domain grounding aligned with ${interest} industry expectations.`,
        `Appropriate choice of modern tooling: ${Array.isArray(techStack) && techStack.length ? techStack.join(', ') : 'structured stack'}.`,
        `Addresses a tangible user or computational problem rather than trivial template work.`,
      ],
      areasForImprovement: [
        'Add comprehensive automated integration and unit test coverage (>80% line coverage).',
        'Implement structured logging, health checks, and performance benchmark metrics.',
        'Refine the system architecture documentation with explicit data flow diagrams and threat modeling.',
        'Package into containerized deployments (Docker / GitHub Actions CI) for seamless evaluator reproducibility.',
      ],
      actionableRoadmap: [
        {
          step: 1,
          task: 'Benchmark Latency & Bottlenecks',
          detail: 'Profile database queries and endpoint response times under simulated concurrent requests.',
        },
        {
          step: 2,
          task: 'Harden Error Handling & Edge Cases',
          detail: 'Replace generic try/catch blocks with typed domain exceptions and client-safe validation errors.',
        },
        {
          step: 3,
          task: 'Publish Interactive Demonstration & Documentation',
          detail: 'Create a live demo URL and write an architectural case study in the repository README with benchmark graphs.',
        },
      ],
      recommendedSkillsToAcquire: [
        'Automated CI/CD & GitHub Actions',
        'Distributed Caching (Redis)',
        'API Contract Testing (OpenAPI / Swagger)',
        'Production Telemetry & Metrics Monitoring',
      ],
      suggestedNextProject: {
        title: `High-Throughput Distributed ${interest} Engine`,
        concept: `Evolve this solution into a multi-tenant or asynchronous worker architecture that handles 10x higher load.`,
      },
    };
  };

  if (!ai) {
    return res.json({ evaluation: getFallbackEvaluation(), source: 'curated-evaluator' });
  }

  try {
    const prompt = `You are a senior engineering evaluator and academic career mentor reviewing a student project submission.
Student Profile:
- Department: ${department || 'Engineering'}
- Year of Study: ${year || 'Undergraduate'}
- Domain / Interest: ${interest || 'Technology'}

Submitted Project Details:
- Title: ${projectTitle}
- Core Description: ${description}
- Technologies Used: ${Array.isArray(techStack) ? techStack.join(', ') : 'Not specified'}
- Architecture / Implementation Details: ${architectureDetails || 'Standard client-server architecture'}
- Key Challenges Encountered: ${challengesFaced || 'State management, performance tuning, and integration'}
- Repository / Demo: ${githubUrl || 'Local submission'}

Conduct a thorough, realistic, and highly actionable evaluation to help this student gain industry-relevant experience and improve their academic career.
Assign an overall score (0 to 100) and scores for 4 categories (each 0 to 25):
- technicalComplexity (0-25)
- industryRelevance (0-25)
- codeArchitectureQuality (0-25)
- innovationAndImpact (0-25)
(The 4 category scores should sum to the overall score).

Return ONLY valid JSON with this exact schema:
{
  "overallScore": 84,
  "scoreBreakdown": {
    "technicalComplexity": 21,
    "industryRelevance": 22,
    "codeArchitectureQuality": 20,
    "innovationAndImpact": 21
  },
  "evaluationSummary": "Concise 2-sentence executive summary of the project's maturity.",
  "strengths": ["Clear strength 1", "Clear strength 2", "Clear strength 3"],
  "areasForImprovement": ["Actionable improvement 1", "Actionable improvement 2", "Actionable improvement 3", "Actionable improvement 4"],
  "actionableRoadmap": [
    { "step": 1, "task": "Task title", "detail": "Detailed instruction" },
    { "step": 2, "task": "Task title", "detail": "Detailed instruction" },
    { "step": 3, "task": "Task title", "detail": "Detailed instruction" }
  ],
  "recommendedSkillsToAcquire": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "suggestedNextProject": {
    "title": "Title for next project",
    "concept": "1-sentence concept that builds directly upon what was learned"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return res.json({ evaluation: parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Error evaluating project with Gemini:', err);
    return res.json({ evaluation: getFallbackEvaluation(), source: 'curated-evaluator', note: err.message });
  }
});

// Endpoint: Curated Resource Recommendations
app.post('/api/resources', (req: Request, res: Response) => {
  const { department, interest, year } = req.body;
  
  // Return curated resources tailored to the domain
  const resources = [
    {
      id: 'res-srv-1',
      category: 'Official Docs & Standards',
      title: `${interest} Core Architecture & Specification`,
      type: 'Documentation',
      level: 'Essential',
      description: `Official foundational specifications, syntax guidelines, and official developer manuals.`,
      url: 'https://developer.mozilla.org',
      estimatedHours: 8,
    },
    {
      id: 'res-srv-2',
      category: 'Recommended Books & Deep Dives',
      title: `Designing Data-Intensive & High-Reliability Systems in ${department}`,
      type: 'Textbook / Reference',
      level: 'Intermediate',
      description: `Industry gold standard literature on scalability, distributed concurrency, and fault tolerance.`,
      url: '#',
      estimatedHours: 24,
    },
    {
      id: 'res-srv-3',
      category: 'Hands-On Labs & Repositories',
      title: `Production-Grade ${interest} Reference Implementation`,
      type: 'Open Source Codebase',
      level: 'Advanced',
      description: `Dissect real-world repositories featuring continuous integration, test fixtures, and modular micro-packages.`,
      url: 'https://github.com',
      estimatedHours: 12,
    },
    {
      id: 'res-srv-4',
      category: 'Industry Benchmarks & Certifications',
      title: `Cloud & Systems Professional Roadmap for ${year}`,
      type: 'Career Guide & Milestone',
      level: 'Career Track',
      description: `Curated checklist of credentials and portfolio checkpoints hiring managers prioritize.`,
      url: '#',
      estimatedHours: 15,
    },
  ];

  return res.json({ resources });
});

// Endpoint: Phase 2 AI-Powered Spending Analysis & Budget Alerts
app.post('/api/analyze-expenses', async (req: Request, res: Response) => {
  const { monthlyBudget = 10000, expenses = [], currency = '₹' } = req.body;

  const validExpenses = Array.isArray(expenses) ? expenses : [];
  const totalSpent = validExpenses.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const percentageUsed = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;

  // Determine alert level
  let budgetStatus: 'Normal' | 'Warning' | 'Critical' = 'Normal';
  let budgetAlertMessage = `Budget is on track with ${percentageUsed}% used. You have ${currency}${remainingBudget.toLocaleString()} remaining.`;

  if (percentageUsed >= 90) {
    budgetStatus = 'Critical';
    budgetAlertMessage = `Critical budget alert: You have utilized ${percentageUsed}% of your ${currency}${monthlyBudget.toLocaleString()} monthly budget! Only ${currency}${remainingBudget.toLocaleString()} remaining.`;
  } else if (percentageUsed >= 70) {
    budgetStatus = 'Warning';
    budgetAlertMessage = `Budget warning: You have used ${percentageUsed}% of your ${currency}${monthlyBudget.toLocaleString()} monthly budget. Monitor non-essential spending.`;
  }

  // Calculate Academic & Project vs Lifestyle
  const academicItems = validExpenses.filter((e: any) => e.category === 'Education' || e.category === 'Projects');
  const academicInvestmentTotal = academicItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  const academicInvestmentPercentage = totalSpent > 0 ? Math.round((academicInvestmentTotal / totalSpent) * 100) : 0;
  const lifestyleTotal = totalSpent - academicInvestmentTotal;

  // Group by category
  const categories = ['Food', 'Travel', 'Education', 'Projects', 'Entertainment', 'Shopping', 'Other'];
  const spendingPatterns = categories.map((cat) => {
    const items = validExpenses.filter((e: any) => e.category === cat);
    const catTotal = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    return {
      category: cat,
      total: catTotal,
      count: items.length,
      percentageOfSpent: totalSpent > 0 ? Math.round((catTotal / totalSpent) * 100) : 0,
    };
  }).filter((c) => c.count > 0 || c.total > 0);

  // Check for restaurant food or frequent dining
  const restaurantKeywords = ['restaurant', 'dining', 'dinner out', 'bistro', 'cafe', 'takeout', 'zomato', 'swiggy', 'uber eats', 'fast food', 'starbucks', 'domino'];
  const restaurantItems = validExpenses.filter((e: any) => {
    const r = (e.reason || '').toLowerCase();
    return e.category === 'Food' && restaurantKeywords.some((k) => r.includes(k));
  });
  const restaurantTotal = restaurantItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

  // Fallback response generator
  const getFallbackAnalysis = () => {
    const respectfulWarnings: string[] = [];
    const actionableSuggestions: string[] = [];

    // Respectful warning for restaurant / non-essential food spending
    if (restaurantTotal > 0 && restaurantItems.length >= 2) {
      respectfulWarnings.push(
        `You have spent ${currency}${restaurantTotal.toLocaleString()} on restaurant food this month across ${restaurantItems.length} visits. Consider reducing non-essential food spending to stay within your budget.`
      );
      actionableSuggestions.push(
        'Explore campus meal subscriptions or batch meal-prep during weekdays to save on frequent dining out.'
      );
    } else if (restaurantTotal > 1500) {
      respectfulWarnings.push(
        `You have spent ${currency}${restaurantTotal.toLocaleString()} on dining out this month. Allocating a dedicated weekend dining budget can help maintain peace of mind.`
      );
    }

    const entertainmentTotal = validExpenses.filter((e: any) => e.category === 'Entertainment').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    if (entertainmentTotal > monthlyBudget * 0.25) {
      respectfulWarnings.push(
        `Entertainment expenditures account for ${currency}${entertainmentTotal.toLocaleString()} (${Math.round((entertainmentTotal / totalSpent) * 100)}% of expenses). Look for student discount passes for films and campus activities.`
      );
    }

    // Default suggestions
    if (actionableSuggestions.length === 0) {
      actionableSuggestions.push('Use student IDs for campus bookstore and software tool discounts.');
      actionableSuggestions.push('Prioritize project components through academic group-buying with lab peers.');
    }

    return {
      budgetStatus,
      budgetAlertMessage,
      totalSpent,
      monthlyBudget,
      remainingBudget,
      percentageUsed,
      academicInvestmentTotal,
      academicInvestmentPercentage,
      lifestyleTotal,
      spendingPatterns,
      aiInsights: [
        `${academicInvestmentPercentage}% (${currency}${academicInvestmentTotal.toLocaleString()}) of your spending directly supports your academic and engineering project goals.`,
        `Your primary expenditure category is ${spendingPatterns.sort((a, b) => b.total - a.total)[0]?.category || 'General'} (${currency}${(spendingPatterns.sort((a, b) => b.total - a.total)[0]?.total || 0).toLocaleString()}).`,
        percentageUsed < 70
          ? `You have healthy budget headroom (${currency}${remainingBudget.toLocaleString()} available) for unexpected academic hardware or course supplies.`
          : `Spending is approaching high utilization; defer non-essential shopping until next month.`,
      ],
      respectfulWarnings,
      actionableSuggestions,
      academicCareerNote: academicInvestmentTotal > 0
        ? `Your spending of ${currency}${academicInvestmentTotal.toLocaleString()} on Education & Projects directly builds tangible portfolio artifacts and technical skills valued by employers.`
        : `Consider budgeting a portion of your funds toward learning resources, cloud credits, or prototype components for your domain roadmap.`,
    };
  };

  if (!ai) {
    return res.json({ analysis: getFallbackAnalysis(), source: 'curated-rule-evaluator' });
  }

  try {
    const prompt = `You are a financial advisor and student mentor on PathPilot, an academic development platform.
Analyze this student's monthly expense ledger:
- Monthly Budget: ${currency}${monthlyBudget}
- Total Spent So Far: ${currency}${totalSpent}
- Percentage Used: ${percentageUsed}%
- Expenses List:
${JSON.stringify(validExpenses, null, 2)}

Key Guidelines:
1. Budget status must be:
   - "Normal" if percentageUsed < 70%
   - "Warning" if 70% <= percentageUsed < 90%
   - "Critical" if percentageUsed >= 90%
2. Identify spending patterns across categories. Note that "Education" and "Projects" are investments supporting their academic/career goals.
3. Crucial rule: If the student repeatedly spends excessively on non-essential activities, such as frequent restaurant meals, shopping, or entertainment, provide a respectful warning and actionable suggestion instead of calling the expense "invalid".
   Example format: "You have spent ${currency}2,500 on restaurant food this month. Consider reducing non-essential food spending to stay within your budget."
4. Provide positive reinforcement for their academic and project investments.

Return ONLY a valid JSON object matching this schema:
{
  "budgetStatus": "${budgetStatus}",
  "budgetAlertMessage": "1-sentence status message",
  "totalSpent": ${totalSpent},
  "monthlyBudget": ${monthlyBudget},
  "remainingBudget": ${remainingBudget},
  "percentageUsed": ${percentageUsed},
  "academicInvestmentTotal": ${academicInvestmentTotal},
  "academicInvestmentPercentage": ${academicInvestmentPercentage},
  "lifestyleTotal": ${lifestyleTotal},
  "spendingPatterns": [
    { "category": "Food", "total": 1200, "count": 3, "percentageOfSpent": 35, "observation": "brief note" }
  ],
  "aiInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "respectfulWarnings": ["Respectful warning about excessive non-essentials if detected, e.g. restaurant food"],
  "actionableSuggestions": ["Actionable tip 1", "Actionable tip 2"],
  "academicCareerNote": "Encouraging remark on how their education/project expenses support their career development."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return res.json({ analysis: parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Error analyzing expenses with Gemini:', err);
    return res.json({ analysis: getFallbackAnalysis(), source: 'curated-rule-evaluator', note: err.message });
  }
});

// Endpoint: Phase 3 AI Learning Insights & Career Alignment Score
app.post('/api/learning-insights', async (req: Request, res: Response) => {
  const {
    department = 'Computer Science & Engineering',
    year = '3rd Year',
    interest = 'Distributed Systems & Cloud Infrastructure',
    targetRole = 'Cloud & Infrastructure Engineer',
    skills = [],
    goals = [],
    streakData = { currentStreak: 5, totalDays: 18 },
    projectsCount = 2,
    roadmapProgress = 65,
  } = req.body;

  // Algorithmic fallback calculator
  const getFallbackInsights = () => {
    const technicalSkills = skills.filter((s: any) => s.type === 'Technical');
    const softSkills = skills.filter((s: any) => s.type === 'Soft');
    const avgTech = technicalSkills.length > 0
      ? technicalSkills.reduce((acc: number, s: any) => acc + (s.progress || 0), 0) / technicalSkills.length
      : 75;
    const avgSoft = softSkills.length > 0
      ? softSkills.reduce((acc: number, s: any) => acc + (s.progress || 0), 0) / softSkills.length
      : 80;

    // Career alignment calculation: weighted formula
    const projectFactor = Math.min(100, projectsCount * 30);
    const calculatedScore = Math.min(
      95,
      Math.max(55, Math.round(avgTech * 0.45 + avgSoft * 0.15 + projectFactor * 0.2 + roadmapProgress * 0.2))
    );

    return {
      insights: {
        fastestImprovingSkills: [
          { name: 'Distributed Consensus & Raft', growth: '+24% this month' },
          { name: 'Docker & Containerization', growth: '+18% this month' },
        ],
        skillsNeedingAttention: [
          { name: 'Kubernetes Cluster Orchestration', reason: 'Critical requirement for target role; currently at planned stage' },
          { name: 'Technical System Writing & RFCs', reason: 'Essential soft skill for infrastructure teams to document design trade-offs' },
        ],
        nextRecommendedSkill: {
          name: 'OpenTelemetry Distributed Tracing',
          category: 'Cloud & Observability',
          reason: `High priority for ${targetRole} positions to diagnose microservice latency bottlenecks in production.`,
          targetMilestone: 'Milestone 4: High-Scale Infrastructure & Observability',
        },
        consistencyScore: Math.min(96, Math.max(60, 68 + (streakData.currentStreak || 0) * 4)),
        actionableSuggestions: [
          'Spend 25 minutes daily solving concurrent programming problems to reinforce memory model understanding.',
          'Document your Raft consensus design decisions as an architectural case study on GitHub to prove written technical communication.',
          'Schedule a weekend deep dive into Kubernetes Pod lifecycle and manifest debugging before starting Milestone 4.',
        ],
        learningSummary: `Strong upward momentum in systems engineering fundamentals with 82% verified core proficiency. Prioritizing observability and container orchestration will elevate your profile directly to top-tier ${targetRole} requirements.`,
      },
      careerAlignment: {
        score: calculatedScore,
        targetRole,
        targetRoleBenchmark: 85,
        strengths: [
          'Applied proficiency in distributed state replication and low-level protocol design.',
          'Strong problem-solving rigor demonstrated through evaluated hands-on project artifacts.',
          'Consistent daily learning habit with active weekly practice on system architecture.',
        ],
        skillGaps: [
          {
            skill: 'Kubernetes & Helm Deployment',
            importance: 'High',
            currentLevel: 'Beginner',
            requiredLevel: 'Intermediate',
            recommendation: 'Complete practical labs deploying multi-container services with health checks and rolling upgrades.',
          },
          {
            skill: 'Distributed Tracing & Metrics (Prometheus)',
            importance: 'High',
            currentLevel: 'Beginner',
            requiredLevel: 'Intermediate',
            recommendation: 'Instrument OpenTelemetry spans into your existing rate limiter and consensus engine.',
          },
          {
            skill: 'System Design Interview Synthesis',
            importance: 'Medium',
            currentLevel: 'Intermediate',
            requiredLevel: 'Advanced',
            recommendation: 'Practice structured 45-minute whiteboarding mock sessions covering back-of-the-envelope capacity planning.',
          },
        ],
        actionsToImprove: [
          'Complete the Kubernetes microservice cluster deployment topic in Milestone 4.',
          'Add automated stress testing and Prometheus metrics scraping to your capstone project.',
          'Dedicate 2 hours weekly to peer technical reviews and soft skill mock defense.',
        ],
        roleComparison: [
          { metric: 'Systems Programming & Algorithms', studentScore: 88, industryBaseline: 82 },
          { metric: 'Cloud Infrastructure & Containers', studentScore: 78, industryBaseline: 85 },
          { metric: 'System Architecture & Scalability', studentScore: 84, industryBaseline: 80 },
          { metric: 'Observability & Telemetry', studentScore: 68, industryBaseline: 80 },
          { metric: 'Technical Communication & Leadership', studentScore: 80, industryBaseline: 75 },
        ],
      },
      source: 'curated-rule-engine',
    };
  };

  if (!ai) {
    return res.json(getFallbackInsights());
  }

  try {
    const prompt = `You are a distinguished university engineering advisor and staff engineering leader.
Evaluate this student's learning and skill acquisition profile:
- Department: ${department}
- Year of Study: ${year}
- Domain Focus: ${interest}
- Target Career Role: ${targetRole}
- Active Skills: ${JSON.stringify(skills.map((s: any) => ({ name: s.name, type: s.type, level: s.level, progress: s.progress, category: s.category })), null, 2)}
- Learning Streak: ${streakData.currentStreak} days (Total active days: ${streakData.totalDays})
- Evaluated Projects Count: ${projectsCount}
- Learning Roadmap Progress: ${roadmapProgress}%

Perform a deep, actionable AI Learning & Skill Development evaluation:
1. Identify fastest-improving skills and skills needing attention for the target role.
2. Determine the single most impactful NEXT skill to learn with domain justification.
3. Calculate a dynamic Career Alignment Score (0-100) reflecting how ready they are for ${targetRole}, identifying specific strengths, skill gaps (with importance and recommendation), actions to improve, and a 5-dimension industry role comparison (studentScore vs industryBaseline).

Return ONLY valid JSON with this exact schema:
{
  "insights": {
    "fastestImprovingSkills": [
      { "name": "Skill Name", "growth": "+20% this month" }
    ],
    "skillsNeedingAttention": [
      { "name": "Skill Name", "reason": "Why it needs attention for target role" }
    ],
    "nextRecommendedSkill": {
      "name": "Skill Name",
      "category": "Category",
      "reason": "Clear justification",
      "targetMilestone": "Relevant milestone"
    },
    "consistencyScore": 86,
    "actionableSuggestions": [
      "Suggestion 1",
      "Suggestion 2",
      "Suggestion 3"
    ],
    "learningSummary": "2-sentence encouraging executive assessment"
  },
  "careerAlignment": {
    "score": 82,
    "targetRole": "${targetRole}",
    "targetRoleBenchmark": 85,
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "skillGaps": [
      {
        "skill": "Missing Skill",
        "importance": "High",
        "currentLevel": "Beginner",
        "requiredLevel": "Intermediate",
        "recommendation": "Concrete task"
      }
    ],
    "actionsToImprove": ["Action 1", "Action 2", "Action 3"],
    "roleComparison": [
      { "metric": "Core Programming & Algorithms", "studentScore": 86, "industryBaseline": 80 },
      { "metric": "Domain Infrastructure & Tooling", "studentScore": 76, "industryBaseline": 84 },
      { "metric": "System Architecture & Scalability", "studentScore": 82, "industryBaseline": 80 },
      { "metric": "Testing, CI/CD & Observability", "studentScore": 70, "industryBaseline": 78 },
      { "metric": "Communication & Collaboration", "studentScore": 80, "industryBaseline": 75 }
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Error generating AI learning insights with Gemini:', err);
    return res.json(getFallbackInsights());
  }
});

// Endpoint: Phase 3 Personalized Learning Roadmap Generator
app.post('/api/learning-roadmap', async (req: Request, res: Response) => {
  const {
    department = 'Computer Science & Engineering',
    year = '3rd Year',
    interest = 'Distributed Systems & Cloud Infrastructure',
    targetRole = 'Cloud & Infrastructure Engineer',
  } = req.body;

  const fallbackRoadmap = [
    {
      id: 'l-mile-1',
      title: 'Foundations of Systems Programming & Memory Models',
      description: 'Master low-level OS primitives, POSIX sockets, thread concurrency, and virtual memory allocation.',
      difficulty: 'Beginner',
      estimatedTime: '4 Weeks (25 hrs)',
      status: 'Completed',
      progress: 100,
      topics: [
        { id: 't-1-1', title: 'Pointers, manual heap allocation, and cache locality', completed: true, estimatedHours: 6 },
        { id: 't-1-2', title: 'Multithreading, race conditions, and mutex synchronization', completed: true, estimatedHours: 7 },
        { id: 't-1-3', title: 'Non-blocking I/O and event loop architectures', completed: true, estimatedHours: 6 },
        { id: 't-1-4', title: 'Socket programming with TCP three-way handshake', completed: true, estimatedHours: 6 },
      ],
      resources: [
        { title: 'Computer Systems: A Programmer’s Perspective (CS:APP)', type: 'Course', platform: 'CMU OpenCourseWare', url: 'https://csapp.cs.cmu.edu', isFree: true },
        { title: 'Beej’s Guide to Network Programming', type: 'Documentation', platform: 'Beej Guides', url: 'https://beej.us/guide/bgnet/', isFree: true },
        { title: 'OS & Concurrency Lab Exercises', type: 'Practice Platform', platform: 'Exercism', url: 'https://exercism.org', isFree: true },
        { title: 'Operating Systems Virtualization & Concurrency Lectures', type: 'YouTube', platform: 'YouTube', url: 'https://youtube.com', isFree: true },
      ],
    },
    {
      id: 'l-mile-2',
      title: 'Resilient API Protocols & Data Storage Engines',
      description: 'Design robust client-server contracts, binary serializations, relational transactions, and indexing.',
      difficulty: 'Intermediate',
      estimatedTime: '5 Weeks (32 hrs)',
      status: 'Completed',
      progress: 100,
      topics: [
        { id: 't-2-1', title: 'Protocol Buffers & gRPC streaming RPC mechanisms', completed: true, estimatedHours: 8 },
        { id: 't-2-2', title: 'PostgreSQL ACID transactions and B-Tree indexing profiling', completed: true, estimatedHours: 8 },
        { id: 't-2-3', title: 'Distributed in-memory caching with Redis data structures', completed: true, estimatedHours: 8 },
        { id: 't-2-4', title: 'Integration testing with Testcontainers and mock fixtures', completed: true, estimatedHours: 8 },
      ],
      resources: [
        { title: 'Designing Data-Intensive Applications', type: 'Course', platform: 'O’Reilly Literature', url: 'https://dataintensive.net', isFree: false },
        { title: 'Official gRPC TypeScript & Go Guides', type: 'Documentation', platform: 'gRPC.io', url: 'https://grpc.io', isFree: true },
        { title: 'SQL & Database Indexing Tuning Challenges', type: 'Practice Platform', platform: 'LeetCode / Hackerrank', url: 'https://leetcode.com', isFree: true },
        { title: 'Hussein Nasser Backend Engineering Masterclass', type: 'YouTube', platform: 'YouTube', url: 'https://youtube.com', isFree: true },
      ],
    },
    {
      id: 'l-mile-3',
      title: 'Consensus Protocols & Fault-Tolerant Distributed State',
      description: 'Implement distributed consensus algorithms (Raft), handle network splits, and write-ahead logging.',
      difficulty: 'Intermediate',
      estimatedTime: '6 Weeks (38 hrs)',
      status: 'In Progress',
      progress: 68,
      topics: [
        { id: 't-3-1', title: 'Raft consensus leader election and term transitions', completed: true, estimatedHours: 10 },
        { id: 't-3-2', title: 'Replicated write-ahead logs and commit index synchronization', completed: true, estimatedHours: 10 },
        { id: 't-3-3', title: 'Fault injection chaos testing under network partitions', completed: true, estimatedHours: 9 },
        { id: 't-3-4', title: 'Log snapshotting, memory compaction, and state recovery', completed: false, estimatedHours: 9 },
      ],
      resources: [
        { title: 'MIT 6.824: Distributed Systems Labs', type: 'Course', platform: 'MIT OpenCourseWare', url: 'https://pdos.csail.mit.edu/6.824/', isFree: true },
        { title: 'The Raft Consensus Paper & Interactive Visualization', type: 'Documentation', platform: 'Raft.github.io', url: 'https://raft.github.io', isFree: true },
        { title: 'Distributed Systems Concurrency Challenges', type: 'Practice Platform', platform: 'Fly.io Gossip Labs', url: 'https://fly.io/dist-sys/', isFree: true },
        { title: 'Martin Kleppmann Distributed Systems Video Series', type: 'YouTube', platform: 'YouTube (Cambridge)', url: 'https://youtube.com', isFree: true },
      ],
    },
    {
      id: 'l-mile-4',
      title: 'Cloud Orchestration, Kubernetes & Distributed Observability',
      description: 'Deploy containerized services on Kubernetes, configure ingress rate limits, and instrument OpenTelemetry.',
      difficulty: 'Advanced',
      estimatedTime: '5 Weeks (30 hrs)',
      status: 'Planned',
      progress: 0,
      topics: [
        { id: 't-4-1', title: 'Kubernetes Pods, Services, Deployments, and ConfigMaps', completed: false, estimatedHours: 8 },
        { id: 't-4-2', title: 'Prometheus metrics scrapers and Grafana dashboard visualization', completed: false, estimatedHours: 8 },
        { id: 't-4-3', title: 'OpenTelemetry context propagation and distributed span tracing', completed: false, estimatedHours: 7 },
        { id: 't-4-4', title: 'High-throughput stress testing with k6 and p99 profiling', completed: false, estimatedHours: 7 },
      ],
      resources: [
        { title: 'Kubernetes The Hard Way (Kelsey Hightower)', type: 'Tutorial', platform: 'GitHub', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way', isFree: true },
        { title: 'OpenTelemetry Official Specification & Instrumentation Guide', type: 'Documentation', platform: 'OpenTelemetry.io', url: 'https://opentelemetry.io', isFree: true },
        { title: 'KillerCoda Interactive Kubernetes Playground', type: 'Practice Platform', platform: 'Killercoda', url: 'https://killercoda.com', isFree: true },
        { title: 'TechWorld with Nana: Complete DevOps & Kubernetes Roadmap', type: 'YouTube', platform: 'YouTube', url: 'https://youtube.com', isFree: true },
      ],
    },
    {
      id: 'l-mile-5',
      title: 'Capstone Defense, System Architecture Synthesis & Leadership',
      description: 'Synthesize production case studies, lead technical design reviews, and master system design whiteboarding.',
      difficulty: 'Advanced',
      estimatedTime: '4 Weeks (24 hrs)',
      status: 'Planned',
      progress: 0,
      topics: [
        { id: 't-5-1', title: 'Architectural RFC writing with trade-off matrices', completed: false, estimatedHours: 6 },
        { id: 't-5-2', title: 'High-scale mock system design whiteboarding (100k+ QPS)', completed: false, estimatedHours: 6 },
        { id: 't-5-3', title: 'Cross-functional engineering communication and peer code review', completed: false, estimatedHours: 6 },
        { id: 't-5-4', title: 'Technical portfolio publication and open-source contribution', completed: false, estimatedHours: 6 },
      ],
      resources: [
        { title: 'System Design Interview Primer (Donne Martin)', type: 'Practice Platform', platform: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer', isFree: true },
        { title: 'Google Engineering Practices Guide on Code Reviews', type: 'Documentation', platform: 'Google GitHub', url: 'https://google.github.io/eng-practices/', isFree: true },
        { title: 'Interviewing.io Mock Architecture Sessions', type: 'Course', platform: 'Interviewing.io', url: 'https://interviewing.io', isFree: false },
        { title: 'Gaurav Sen System Design Fundamentals', type: 'YouTube', platform: 'YouTube', url: 'https://youtube.com', isFree: true },
      ],
    },
  ];

  return res.json({ roadmap: fallbackRoadmap, source: 'domain-curated' });
});

// ==========================================
// Phase 4: AI Projects, Resume & Placement Endpoints
// ==========================================

// Endpoint: Phase 4 ATS Resume Analysis
app.post('/api/analyze-resume', async (req: Request, res: Response) => {
  const { resume, targetRole = 'Cloud & Infrastructure Engineer' } = req.body;

  const getFallbackAnalysis = () => {
    return {
      overallScore: 86,
      roleMatchScore: 84,
      matchedKeywords: [
        'Distributed Systems',
        'Raft Consensus',
        'gRPC',
        'Protocol Buffers',
        'Docker',
        'Redis',
        'Concurrency & Goroutines',
        'Linux / POSIX',
        'Stress Testing (k6)',
        'Write-Ahead Logging (WAL)',
      ],
      missingKeywords: [
        'Kubernetes Pod Manifests',
        'CI/CD Pipelines (GitHub Actions)',
        'Prometheus / Grafana Monitoring',
        'OpenTelemetry Distributed Tracing',
        'Cloud Platforms (AWS / GCP / Azure)',
        'Terraform / Infrastructure as Code',
      ],
      weakSections: [
        {
          section: 'Work Experience / Industry Proof',
          feedback: 'Experience section currently only lists campus societies without an external commercial internship artifact.',
          recommendation: 'Highlight practical deliverables and student team leadership metrics, or target early summer internship applications.',
        },
        {
          section: 'Cloud & CI/CD Tooling',
          feedback: 'Kubernetes and OpenTelemetry are marked as Basics / Learning without hands-on deployment bullets.',
          recommendation: 'Complete Project 3 (Kubernetes Operator) to add a concrete production orchestration bullet.',
        },
      ],
      projectImprovements: [
        {
          projectTitle: 'Distributed Log Replicator with Raft Consensus Engine',
          originalBullet: 'Built automated chaos test harness simulating network latency and dropped RPC packets with 100% linearizable commit verification.',
          improvedBullet: 'Engineered an automated network partition test suite simulating 200ms latency spikes and dropped RPC packets, validating linearizability with 0% data loss under cluster split-brain conditions.',
          reason: 'Quantifies the exact stress threshold and explicit resilience outcome for technical recruiters.',
        },
        {
          projectTitle: 'Sliding-Window API Rate Limiter & Token Gateway',
          originalBullet: 'High-throughput reverse proxy enforcing tiered client quotas and burst mitigation using atomic Redis Lua scripts.',
          improvedBullet: 'Architected a reverse proxy gateway processing 5,000+ RPS under sub-1.2ms latency overhead using atomic Redis Lua scripts to eliminate state race conditions.',
          reason: 'Leads with strong action verbs and specific throughput and latency benchmarks.',
        },
      ],
      actionableFixes: [
        'Add a dedicated CI/CD bullet under the Raft project detailing automated GitHub Actions running unit and chaos tests.',
        'Incorporate the upcoming Kubernetes operator project once milestone 2 is reached to boost Cloud keyword match.',
        'Specify cloud infrastructure hosting details (e.g. deployed on Docker Compose or local Minikube cluster).',
      ],
      analyzedAt: new Date().toISOString().split('T')[0],
    };
  };

  if (!ai) {
    return res.json({ analysis: getFallbackAnalysis(), source: 'curated-ats-engine' });
  }

  try {
    const prompt = `You are a Principal Technical Recruiter and Staff Engineering Hiring Manager evaluating an ATS-formatted student resume.
Target Role: ${targetRole}
Resume Data:
${JSON.stringify(resume, null, 2)}

Perform a rigorous, ATS-grade evaluation:
1. Calculate overallScore (0-100) and roleMatchScore (0-100).
2. Extract matched technical/domain keywords and list critical missing industry keywords for ${targetRole}.
3. Identify weak sections with actionable recommendations. Never invent fake experience.
4. Improve project bullet points using Google's X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z]).
5. Provide top 3 actionable fixes.

Return ONLY valid JSON matching this schema:
{
  "overallScore": 86,
  "roleMatchScore": 84,
  "matchedKeywords": ["Keyword1", "Keyword2"],
  "missingKeywords": ["Keyword1", "Keyword2"],
  "weakSections": [
    { "section": "Section Name", "feedback": "Why it's weak", "recommendation": "How to improve" }
  ],
  "projectImprovements": [
    { "projectTitle": "Title", "originalBullet": "Original", "improvedBullet": "Improved with metrics", "reason": "Explanation" }
  ],
  "actionableFixes": ["Fix 1", "Fix 2", "Fix 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      analysis: { ...parsed, analyzedAt: new Date().toISOString().split('T')[0] },
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Error analyzing resume with Gemini:', err);
    return res.json({ analysis: getFallbackAnalysis(), source: 'curated-ats-engine' });
  }
});

// Endpoint: Phase 4 Project Quality & Placement Rubric Evaluation
app.post('/api/evaluate-placement-project', async (req: Request, res: Response) => {
  const { project, targetRole = 'Cloud & Infrastructure Engineer' } = req.body;

  const getFallbackProjectEval = () => {
    return {
      qualityScore: 89,
      rubric: {
        functionality: 18,
        technicalDepth: 23,
        relevance: 19,
        completeness: 18,
        careerAlignment: 11,
      },
      evaluationSummary: `Exceptional engineering artifact for ${targetRole}. The project shows practical mastery of state machine correctness, resilience against network splits, and thorough chaos test coverage.`,
      strengths: [
        'Modular, maintainable architecture separating network RPC layer from core state transitions.',
        'High-coverage automated test suites verifying correctness under boundary conditions.',
        'Solves an authentic computational challenge rather than relying on trivial boilerplate.',
      ],
      gaps: [
        'Telemetry monitoring (OpenTelemetry / Prometheus metrics) is omitted.',
        'Documentation lacks step-by-step benchmark replication scripts in the repository README.',
      ],
      improvementActions: [
        'Instrument trace spans to capture RPC roundtrip durations under concurrent load.',
        'Add a Makefile or Docker Compose file for one-command test harness reproduction.',
      ],
      evaluatedAt: new Date().toISOString().split('T')[0],
    };
  };

  if (!ai) {
    return res.json({ evaluation: getFallbackProjectEval(), source: 'curated-project-engine' });
  }

  try {
    const prompt = `You are a Senior Technical Lead evaluating a student portfolio project for entry into placement interviews for ${targetRole}.
Project:
- Title: ${project.title}
- Domain: ${project.domain}
- Objective: ${project.objective}
- Tech Stack: ${Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack}
- Expected Outcome: ${project.expectedOutcome}
- Progress: ${project.progress}%
- GitHub: ${project.githubUrl || 'Local project'}

Evaluate against these 5 placement criteria:
- functionality (0-20)
- technicalDepth (0-25)
- relevance (0-20)
- completeness (0-20)
- careerAlignment (0-15)
The sum equals qualityScore (0-100).
Provide evaluationSummary, strengths, gaps, and improvementActions.

Return ONLY valid JSON:
{
  "qualityScore": 89,
  "rubric": {
    "functionality": 18,
    "technicalDepth": 23,
    "relevance": 19,
    "completeness": 18,
    "careerAlignment": 11
  },
  "evaluationSummary": "Summary...",
  "strengths": ["Strength 1", "Strength 2"],
  "gaps": ["Gap 1", "Gap 2"],
  "improvementActions": ["Action 1", "Action 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      evaluation: { ...parsed, evaluatedAt: new Date().toISOString().split('T')[0] },
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Error evaluating placement project with Gemini:', err);
    return res.json({ evaluation: getFallbackProjectEval(), source: 'curated-project-engine' });
  }
});

// Endpoint: Phase 4 Interview Response Evaluation
app.post('/api/evaluate-interview-response', async (req: Request, res: Response) => {
  const { question, studentResponse, category = 'Technical', targetRole = 'Cloud & Infrastructure Engineer' } = req.body;

  const getFallbackEval = () => {
    const length = (studentResponse || '').length;
    const baseScore = length > 120 ? 88 : length > 60 ? 78 : 65;
    return {
      score: baseScore,
      feedback: {
        strengths: [
          'Directly addresses the fundamental question without unnecessary filler.',
          'Demonstrates familiarity with domain concepts and correct technical vocabulary.',
        ],
        improvements: [
          'Include explicit real-world failure mode trade-offs to demonstrate senior-level depth.',
          'Structure response with clear problem definition followed by concrete resolution steps.',
        ],
        modelAnswerSnippet: question.sampleAnswerOutline || 'State the core principle, quantify the trade-offs, and cite an architectural example.',
      },
      attemptedAt: new Date().toISOString().split('T')[0],
    };
  };

  if (!ai || !studentResponse || studentResponse.trim().length < 10) {
    return res.json({ evaluation: getFallbackEval(), source: 'curated-interview-engine' });
  }

  try {
    const prompt = `You are a Technical Interviewer conducting a mock interview for the role of ${targetRole}.
Category: ${category}
Question: ${question.question}
Key Concepts to Cover: ${Array.isArray(question.keyConceptsToCover) ? question.keyConceptsToCover.join('; ') : ''}
Student's Response:
"${studentResponse}"

Evaluate the student's answer:
- Assign an accurate score from 0 to 100 based on technical depth, clarity, and precision.
- Provide 2-3 specific strengths.
- Provide 2-3 actionable improvement suggestions.
- Provide a concise model answer snippet illustrating the ideal interview response.

Return ONLY valid JSON:
{
  "score": 88,
  "feedback": {
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"],
    "modelAnswerSnippet": "Model answer..."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      evaluation: { ...parsed, attemptedAt: new Date().toISOString().split('T')[0] },
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Error evaluating interview response with Gemini:', err);
    return res.json({ evaluation: getFallbackEval(), source: 'curated-interview-engine' });
  }
});

// Endpoint: Phase 4 Generate Personalized Placement Projects
app.post('/api/generate-placement-projects', async (req: Request, res: Response) => {
  const { targetRole = 'Cloud & Infrastructure Engineer', department = 'Computer Science & Engineering', year = '3rd Year' } = req.body;

  const fallbackProjects = [
    {
      id: `gen-p-${Date.now()}-1`,
      title: 'High-Throughput Raft Distributed Consensus Engine',
      difficulty: 'Advanced',
      domain: 'Distributed Systems & Cloud Infrastructure',
      objective: 'Implement fault-tolerant leader election, replicated write-ahead logging, and snapshotting state compaction.',
      techStack: ['Go', 'gRPC', 'Protobuf', 'Docker'],
      expectedOutcome: 'Multi-node cluster surviving simulated partitions without state inconsistency.',
      timelineWeeks: 6,
      progress: 0,
      status: 'Not Started',
      milestones: [
        { id: 'm1', title: 'Leader Election & Timers', tasks: ['Randomized election timers', 'RequestVote RPC'], completed: false },
        { id: 'm2', title: 'Replicated Logging', tasks: ['AppendEntries RPC', 'Commit index advancement'], completed: false },
        { id: 'm3', title: 'Chaos Partition Testing', tasks: ['Simulate network partitions', 'Deterministic verification'], completed: false },
      ],
    },
    {
      id: `gen-p-${Date.now()}-2`,
      title: 'Sliding-Window API Rate Limiter & Token Gateway',
      difficulty: 'Intermediate',
      domain: 'Cloud Networking & Infrastructure',
      objective: 'Build a reverse proxy gateway enforcing sliding-window rate limits per IP and API key using atomic Redis Lua scripts.',
      techStack: ['Node.js', 'Express', 'Redis', 'Docker'],
      expectedOutcome: 'Sub-millisecond proxy gateway protecting upstream services from burst traffic.',
      timelineWeeks: 4,
      progress: 0,
      status: 'Not Started',
      milestones: [
        { id: 'm1', title: 'Reverse Proxy Routing', tasks: ['Target origin proxying', 'Header sanitization'], completed: false },
        { id: 'm2', title: 'Redis Lua Pipeline', tasks: ['Atomic sliding timestamp sorted set', 'TTL eviction'], completed: false },
        { id: 'm3', title: 'k6 Load Testing', tasks: ['5,000 RPS burst benchmark', 'Latency profiling'], completed: false },
      ],
    },
    {
      id: `gen-p-${Date.now()}-3`,
      title: 'Concurrent HTTP Reverse Proxy with Round-Robin Balancing',
      difficulty: 'Beginner',
      domain: 'Systems Programming & Networking',
      objective: 'Implement a multithreaded TCP reverse proxy that distributes client traffic across upstream worker backends.',
      techStack: ['Go', 'TCP Sockets', 'Goroutines'],
      expectedOutcome: 'Command-line proxy distributing HTTP traffic with active health pings and zero external framework dependencies.',
      timelineWeeks: 3,
      progress: 0,
      status: 'Not Started',
      milestones: [
        { id: 'm1', title: 'Socket Listener', tasks: ['TCP socket binding', 'HTTP header stream parsing'], completed: false },
        { id: 'm2', title: 'Upstream Pool', tasks: ['Round-robin server pool', 'Proxy stream forwarding'], completed: false },
        { id: 'm3', title: 'Health Checks', tasks: ['Periodic background health ping', 'Remove unhealthy servers'], completed: false },
      ],
    },
  ];

  return res.json({ projects: fallbackProjects, source: 'domain-generator' });
});

// ==========================================
// Phase 5: AI Career Copilot & Student Intelligence Endpoints
// ==========================================

// Endpoint: AI Career Copilot Chat grounded in UnifiedStudentContext
app.post('/api/copilot/chat', async (req: Request, res: Response) => {
  const { message, context, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message query is required' });
  }

  let authenticatedUserId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
      authenticatedUserId = decoded.userId;
    } catch {}
  }

  const studentName = context?.student?.name || 'Student';
  const targetRole = context?.placement?.targetRole || 'Cloud & Infrastructure Engineer';

  const saveToUserHistory = (replyObj: any) => {
    if (authenticatedUserId) {
      const studentData = db.getStudentData(authenticatedUserId);
      if (studentData) {
        studentData.copilotChatHistory.push(
          {
            id: `usr-${Date.now()}`,
            sender: 'user',
            text: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: replyObj.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            structuredEvidence: replyObj.structuredEvidence,
            suggestedActions: replyObj.suggestedActions,
          }
        );
        db.updateStudentData(authenticatedUserId, { copilotChatHistory: studentData.copilotChatHistory });
      }
    }
  };

  // Rule-based fallback generator grounded in real context
  const getFallbackResponse = () => {
    const q = message.toLowerCase();

    if (q.includes('next') || q.includes('priority') || q.includes('what should i do') || q.includes('action')) {
      const inProgressProj = context?.projects?.placementProjects?.find((p: any) => p.status === 'In Progress');
      const uncompletedMilestone = inProgressProj?.milestones?.find((m: any) => !m.completed);
      const title = inProgressProj ? `Finish Milestone 3 of ${inProgressProj.title}` : 'Complete Daily Practice Session';
      const what = uncompletedMilestone ? `Implement the ${uncompletedMilestone.title} tasks: ${uncompletedMilestone.tasks?.[0] || 'Verification'}` : 'Solve 2 concurrency problems.';
      const why = `Your resume currently lacks Kubernetes proof, which is the #1 missing keyword for ${targetRole} positions.`;
      const benefit = 'Closes 2 critical ATS gaps, completes the project for your portfolio, and raises Placement Readiness to 88%.';

      return {
        text: `Your single highest-priority action right now is to **${title}**.\n\n**What:** ${what}\n\n**Why:** ${why}\n\n**Expected Benefit:** ${benefit}`,
        structuredEvidence: {
          dataPoint: `${inProgressProj?.title || 'Kubernetes Operator'} is at ${inProgressProj?.progress || 60}% completion`,
          reason: why,
          expectedBenefit: benefit,
        },
        suggestedActions: [
          { label: 'Go to Placement Hub', actionTab: 'placement' },
          { label: 'Check ATS Resume Gaps', queryPrompt: 'What keywords are missing on my resume?' },
          { label: 'View Matched Internships', actionTab: 'placement' },
        ],
      };
    }

    if (q.includes('resume') || q.includes('ats') || q.includes('keyword')) {
      const atsScore = context?.resume?.atsScore || 86;
      const missing = context?.resume?.analysis?.missingKeywords?.slice(0, 4)?.join(', ') || 'Kubernetes, OpenTelemetry';
      return {
        text: `Your ATS Resume Score is **${atsScore}/100** with an **${context?.resume?.analysis?.roleMatchScore || 84}%** role match for *${targetRole}*.\n\n**Top Missing Keywords:** ${missing}.\n\n**Recommendation:** Use the Google X-Y-Z bullet upgrades in the Placement Hub to add explicit metrics to your Raft and rate limiter projects.`,
        structuredEvidence: {
          dataPoint: `ATS Score: ${atsScore}/100`,
          reason: 'Recruiter ATS scanners require explicit cloud orchestration and telemetry keywords for infrastructure positions.',
          expectedBenefit: 'Increases role match score to >92% and improves recruiter callback rates.',
        },
        suggestedActions: [
          { label: 'Open ATS Resume Scanner', actionTab: 'placement' },
          { label: 'What is my highest-priority action?', queryPrompt: 'What should I work on next?' },
        ],
      };
    }

    if (q.includes('intern') || q.includes('job') || q.includes('company') || q.includes('apply')) {
      const topIntern = context?.placement?.matchedInternships?.[0] || {
        companyName: 'Google',
        roleTitle: 'Software Engineering Intern (Cloud Systems)',
        matchScore: 92,
        applicationDeadline: 'Oct 30, 2026',
        stipend: '₹1,25,000 / month',
      };
      return {
        text: `You have **${context?.placement?.matchedInternships?.length || 4} matched internship openings**, led by **${topIntern.companyName} (${topIntern.roleTitle})** with a **${topIntern.matchScore}% Match**.\n\n**Why You Match:** Your evaluated Raft consensus engine and Go concurrency skills directly align with ${topIntern.companyName}'s core infrastructure bar.\n\n**Urgency:** The application deadline is **${topIntern.applicationDeadline}** with a monthly stipend of **${topIntern.stipend}**.`,
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

    if (q.includes('budget') || q.includes('finance') || q.includes('spend') || q.includes('expense')) {
      const fin = context?.finances || { monthlyBudget: 8000, totalSpent: 3850, percentageUsed: 48, budgetStatus: 'Normal', academicInvestmentTotal: 1850 };
      return {
        text: `Your current budget status is **${fin.budgetStatus}**.\n\n- **Monthly Budget:** ₹${Number(fin.monthlyBudget).toLocaleString()}\n- **Total Spent:** ₹${Number(fin.totalSpent).toLocaleString()} (${fin.percentageUsed}% used)\n- **Academic & Project Investment:** ₹${Number(fin.academicInvestmentTotal).toLocaleString()}\n\n**Verdict:** Your spending is disciplined, with healthy investments in developer tools and learning materials supporting your coursework.`,
        structuredEvidence: {
          dataPoint: `₹${Number(fin.academicInvestmentTotal).toLocaleString()} invested in career development`,
          reason: 'Maintaining non-essential spending below budget thresholds preserves funds for cloud credits and lab resources.',
          expectedBenefit: 'Preserves a 92% Financial Discipline rating without compromising academic growth.',
        },
        suggestedActions: [
          { label: 'View My Expenses', actionTab: 'expenses' },
          { label: 'Review Learning Goals', actionTab: 'learning' },
        ],
      };
    }

    // Default grounded overview
    const readiness = context?.placement?.readiness?.overallScore || 85;
    return {
      text: `Hello ${studentName}! Based on your unified PathPilot profile as a ${context?.academic?.year || '3rd Year'} student in ${context?.academic?.department || 'Computer Science'} targeting **${targetRole}**:\n\n- **Placement Readiness:** ${readiness}% (${context?.placement?.readiness?.status || 'Ready for Top Tech'})\n- **Evaluated Proof of Work:** ${context?.projects?.placementProjects?.filter((p: any) => p.status === 'Completed')?.length || 1} completed projects (${context?.projects?.avgQualityScore || 91}/100 quality score)\n- **ATS Resume Score:** ${context?.resume?.atsScore || 86}/100\n- **Active Streak:** ${context?.learning?.streak?.currentStreak || 5} days (${context?.learning?.streak?.totalHours || 54} verified study hours)\n\nAsk me anything about what to work on next, your missing resume keywords, interview practice, or upcoming internship deadlines.`,
      structuredEvidence: {
        dataPoint: `Placement Readiness: ${readiness}%`,
        reason: 'Connects academic scores, evaluated code, ATS resume metrics, and mock interviews into one unified intelligence profile.',
        expectedBenefit: 'Keeps you focused on the single most impactful task for career placement.',
      },
      suggestedActions: [
        { label: 'What is my Next Best Action?', queryPrompt: 'What should I work on next?' },
        { label: 'How is my Resume ATS score?', queryPrompt: 'How is my resume ATS score?' },
        { label: 'Check Internship Matches', actionTab: 'placement' },
      ],
    };
  };

  if (!ai) {
    return res.json({
      reply: getFallbackResponse(),
      source: 'offline-copilot-engine',
    });
  }

  try {
    const summaryContext = JSON.stringify({
      student: {
        name: context?.student?.name,
        department: context?.academic?.department,
        year: context?.academic?.year,
        targetRole,
        avgScore: context?.academic?.avgScore,
      },
      skills: {
        techCount: context?.skills?.technical?.length,
        avgProficiency: context?.skills?.avgProficiency,
        gaps: context?.skills?.topSkillGaps?.map((g: any) => `${g.skill} (${g.importance})`),
      },
      learning: {
        streakDays: context?.learning?.streak?.currentStreak,
        totalHours: context?.learning?.streak?.totalHours,
        roadmapProgress: context?.learning?.roadmapProgress,
        pendingDailyGoals: context?.learning?.goals?.filter((g: any) => !g.completed && g.timeframe === 'Daily')?.map((g: any) => g.title),
      },
      projects: {
        completed: context?.projects?.placementProjects?.filter((p: any) => p.status === 'Completed')?.map((p: any) => ({ title: p.title, quality: p.evaluation?.qualityScore })),
        inProgress: context?.projects?.placementProjects?.filter((p: any) => p.status === 'In Progress')?.map((p: any) => ({ title: p.title, progress: p.progress })),
      },
      resume: {
        atsScore: context?.resume?.atsScore,
        roleMatchScore: context?.resume?.analysis?.roleMatchScore,
        missingKeywords: context?.resume?.analysis?.missingKeywords?.slice(0, 5),
      },
      placement: {
        readinessScore: context?.placement?.readiness?.overallScore,
        readinessStatus: context?.placement?.readiness?.status,
        matchedInternships: context?.placement?.matchedInternships?.map((i: any) => ({ company: i.companyName, role: i.roleTitle, match: i.matchScore, deadline: i.applicationDeadline })),
        interviewAttempts: context?.placement?.interviewAttemptsCount,
      },
      finances: {
        monthlyBudget: context?.finances?.monthlyBudget,
        totalSpent: context?.finances?.totalSpent,
        status: context?.finances?.budgetStatus,
        academicInvestment: context?.finances?.academicInvestmentTotal,
      },
    });

    const recentHistoryText = Array.isArray(history)
      ? history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'Student' : 'Copilot'}: ${h.text}`).join('\n')
      : '';

    const prompt = `You are the AI Career Copilot for PathPilot, an intelligent student career and placement preparation platform.
You are talking to ${studentName}.
Ground your answers STRICTLY in the student's actual PathPilot data below. NEVER fabricate qualifications, grades, missing skills, scores, or companies. If data is missing or incomplete, explicitly state that.

STUDENT UNIFIED CONTEXT:
${summaryContext}

RECENT CHAT HISTORY:
${recentHistoryText}

STUDENT QUESTION:
"${message}"

INSTRUCTIONS:
1. Provide a concise, highly personalized, actionable response.
2. Directly answer their question, citing their real data points (e.g. project title, ATS score, missing keywords, streak days).
3. If they ask what to do next or for a recommendation, explain the reason/evidence and the expected quantifiable benefit.
4. If they ask about resumes, reference their actual ATS score and missing keywords.
5. If they ask about internships, cite their actual matches and deadlines.
6. If they ask about finances, cite their budget and academic investments.
7. Return ONLY valid JSON with this schema:
{
  "text": "Your markdown formatted response...",
  "structuredEvidence": {
    "dataPoint": "key data point cited",
    "reason": "why this recommendation applies",
    "expectedBenefit": "tangible benefit to readiness or placement"
  },
  "suggestedActions": [
    { "label": "Button Label", "actionTab": "placement | learning | expenses | projects | evaluator", "queryPrompt": "Optional followup query" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (!parsed.text) {
      const fb = getFallbackResponse();
      saveToUserHistory(fb);
      return res.json({ reply: fb, source: 'curated-copilot-engine' });
    }

    saveToUserHistory(parsed);
    return res.json({
      reply: parsed,
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Error in AI Career Copilot chat:', err);
    const fb = getFallbackResponse();
    saveToUserHistory(fb);
    return res.json({
      reply: fb,
      source: 'offline-copilot-engine',
    });
  }
});

// Endpoint: Phase 5 Generate Grounded Weekly Student Report
app.post('/api/weekly-report', async (req: Request, res: Response) => {
  const { context, scores, nba } = req.body;
  const weekDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fallbackReport = {
    id: `rep-${Date.now()}`,
    weekOf: `Week of ${weekDate}`,
    executiveSummary: `Solid upward trajectory across systems engineering and placement preparation. Overall student growth stands at ${scores?.overallGrowth || 83}%, with verifiable proof-of-work in distributed consensus and an ${context?.resume?.atsScore || 86}/100 ATS resume score. Prioritizing the completion of Kubernetes custom operator milestones will cement peak placement readiness.`,
    keyAchievements: [
      `Evaluated ${context?.projects?.placementProjects?.filter((p: any) => p.status === 'Completed')?.length || 1} industry-grade artifacts with average quality score of ${context?.projects?.avgQualityScore || 91}/100.`,
      `Maintained a consecutive ${context?.learning?.streak?.currentStreak || 5}-day learning habit streak with ${context?.learning?.streak?.totalHours || 54} verified study hours.`,
      `Achieved ${context?.resume?.atsScore || 86}/100 ATS resume score with ${context?.resume?.analysis?.matchedKeywords?.length || 10} matched infrastructure keywords.`,
      `Maintained strong budget control with ${context?.finances?.percentageUsed || 48}% utilization and ₹${Number(context?.finances?.academicInvestmentTotal || 1850).toLocaleString()} invested in career development.`,
    ],
    learningAndSkillsSummary: {
      hoursStudied: context?.learning?.streak?.totalHours || 54,
      streakDays: context?.learning?.streak?.currentStreak || 5,
      skillsAdvanced: [
        'Distributed Consensus & Raft (92% Advanced)',
        'PostgreSQL & Index Optimization (85% Intermediate)',
        'Redis Distributed Caching & Rate Limiting (84% Intermediate)',
      ],
    },
    projectsAndPlacementSummary: {
      projectsProgressed: context?.projects?.placementProjects?.map((p: any) => `${p.title} (${p.progress}%)`) || ['High-Throughput Raft Distributed Consensus Engine (100%)'],
      resumeScore: context?.resume?.atsScore || 86,
      interviewsAttempted: context?.placement?.interviewAttemptsCount || 3,
    },
    financialDisciplineSummary: {
      spent: context?.finances?.totalSpent || 3850,
      budget: context?.finances?.monthlyBudget || 8000,
      status: `${context?.finances?.budgetStatus || 'Normal'} (${context?.finances?.percentageUsed || 48}% used)`,
      academicInvestment: context?.finances?.academicInvestmentTotal || 1850,
    },
    criticalWeaknessesAndRisks: [
      'Kubernetes operator project currently at 60% completion; unfinished CRD controller delays cloud proof.',
      'Timed Quantitative Aptitude speed requires 2 additional mock sessions.',
    ],
    nextWeekPriorities: [
      `Complete Milestone 3 of ${nba?.title || 'Kubernetes Operator'}`,
      `Submit internship applications to Google and Razorpay`,
      `Practice 1 timed Aptitude round on system throughput calculations`,
    ],
    generatedAt: new Date().toISOString(),
  };

  return res.json({ report: fallbackReport, source: 'intelligence-engine' });
});

// Serve frontend in development via Vite middleware, or dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PathPilot server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
