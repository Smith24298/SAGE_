export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  engagementScore: number;
  attritionRisk: RiskLevel;
  subteamAnalytics: { team: string; engagement: number; stress: number }[];
  aiInsight: string;
  aiRecommendation: string;
}

export const departments: Department[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    head: 'Michael Chen',
    employeeCount: 120,
    engagementScore: 71,
    attritionRisk: 'High',
    subteamAnalytics: [
      { team: 'Frontend', engagement: 65, stress: 80 },
      { team: 'Backend', engagement: 70, stress: 75 },
      { team: 'Platform', engagement: 85, stress: 60 },
      { team: 'QA', engagement: 72, stress: 65 },
    ],
    aiInsight: 'Engineering engagement has declined by 12% this quarter, primarily driven by the Frontend and Backend sub-teams.',
    aiRecommendation: 'Increase hiring and leadership support. Prioritize immediate workload redistribution and 1:1 check-ins focused on career growth and capacity planning.',
  },
  {
    id: 'sales',
    name: 'Sales',
    head: 'David Kim',
    employeeCount: 45,
    engagementScore: 82,
    attritionRisk: 'Medium',
    subteamAnalytics: [
      { team: 'Enterprise Teams', engagement: 88, stress: 70 },
      { team: 'Mid-Market', engagement: 76, stress: 82 },
      { team: 'SMB', engagement: 72, stress: 88 },
    ],
    aiInsight: 'SMB Sales reps show a high stress index (88%) likely due to the aggressive Q3 quota. There is a risk of mid-level attrition if pipeline unblocking isn\'t prioritized.',
    aiRecommendation: 'Implement a targeted peer-mentorship program and review commission structures for the lower-tier accounts to alleviate competitive friction.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    head: 'Lisa Wang',
    employeeCount: 30,
    engagementScore: 88,
    attritionRisk: 'Low',
    subteamAnalytics: [
      { team: 'Brand', engagement: 92, stress: 40 },
      { team: 'Demand Gen', engagement: 80, stress: 62 },
      { team: 'Content', engagement: 88, stress: 50 },
    ],
    aiInsight: 'Marketing sentiment remains strong across the board, with Brand team engagement peeking at 92%. Output is extremely healthy.',
    aiRecommendation: 'Continuously acknowledge high performance during weekly all-hands. Explore cross-training initiatives to expand Demand Gen skills.',
  },
  {
    id: 'design',
    name: 'Design',
    head: 'Emily Rodriguez',
    employeeCount: 25,
    engagementScore: 92,
    attritionRisk: 'Low',
    subteamAnalytics: [
      { team: 'Product Design', engagement: 94, stress: 45 },
      { team: 'UX Research', engagement: 88, stress: 55 },
      { team: 'Marketing Design', engagement: 90, stress: 50 },
    ],
    aiInsight: 'The design org is operating perfectly with a record 92% overall engagement. Tool adoption and project visibility metrics are exceptional.',
    aiRecommendation: 'Maintain current cadence. Schedule skip-level meetings to surface bottom-up innovations that could be converted to patents.',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    head: 'Jennifer Lee',
    employeeCount: 15,
    engagementScore: 85,
    attritionRisk: 'Low',
    subteamAnalytics: [
      { team: 'Recruiting', engagement: 80, stress: 78 },
      { team: 'People Ops', engagement: 88, stress: 52 },
      { team: 'Learning & Dev', engagement: 90, stress: 45 },
    ],
    aiInsight: 'Recruiting is experiencing friction (stress at 78%) primarily from an intense Q1 hiring sprint and misaligned onboarding targets.',
    aiRecommendation: 'Redistribute hiring intakes across the People Ops unit to de-bottleneck and provide recruiters more administrative support.',
  },
  {
    id: 'finance',
    name: 'Finance',
    head: 'Robert Taylor',
    employeeCount: 18,
    engagementScore: 74,
    attritionRisk: 'Medium',
    subteamAnalytics: [
      { team: 'Accounting', engagement: 72, stress: 65 },
      { team: 'FP&A', engagement: 78, stress: 60 },
      { team: 'Procurement', engagement: 68, stress: 75 },
    ],
    aiInsight: 'Procurement engagement is sagging (68%), highlighting friction points with the new vendor management software rollout.',
    aiRecommendation: 'Host a structured open-feedback session to identify software blockers. Consider hiring an external consultant to expedite the tool integration.',
  },
];

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}
