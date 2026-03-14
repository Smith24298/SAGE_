/**
 * Fetches employee data from Firestore (profile + photo + insights).
 * Falls back to local mock data when Firestore is not configured or has no data.
 */

import { useEffect, useState } from 'react';
import type { Employee } from '@/app/data/employees';
import { getEmployeeById, employees } from '@/app/data/employees';
import {
  getEmployeeProfile,
  getEmployeePhoto,
  getEmployeeInsights,
  type EmployeeProfileDoc,
  type EmployeeInsightsDoc,
  type EngagementMetric,
  type MeetingItem,
  type RiskIndicator,
} from '@/lib/employeeFirestore';
import { isFirebaseConfigured } from '@/lib/firebase';

export interface SalaryHistoryPoint {
  year: string;
  salary: number;
}

export interface BehavioralData {
  communicationStyle: string;
  personalityTraits: string;
  motivationDrivers: string;
  feedbackPreference: string;
  collaborationStyle: string;
}

export interface CommunicationData {
  topTopics: string[];
  concernsRaised: string[];
  careerInterests: string[];
  recentTopics: string[];
}

const DEFAULT_SENTIMENT_TREND = [
  { month: 'Oct', score: 78 },
  { month: 'Nov', score: 75 },
  { month: 'Dec', score: 80 },
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 68 },
  { month: 'Mar', score: 70 },
];

const DEFAULT_ENGAGEMENT: EngagementMetric[] = [
  { metric: 'Engagement', score: 75, fill: '#e1634a' },
  { metric: 'Participation', score: 82, fill: '#6b9080' },
  { metric: 'Responsiveness', score: 88, fill: '#a4b8c4' },
  { metric: 'Initiative', score: 70, fill: '#f4a261' },
];

const DEFAULT_MEETINGS: MeetingItem[] = [
  { date: 'March 2026', topic: 'Workload discussion', sentiment: 'Neutral', color: 'bg-yellow-500' },
  { date: 'February 2026', topic: 'Career growth planning', sentiment: 'Positive', color: 'bg-green-500' },
  { date: 'January 2026', topic: 'Project completion review', sentiment: 'Positive', color: 'bg-green-500' },
  { date: 'December 2025', topic: 'Q4 Performance review', sentiment: 'Positive', color: 'bg-green-500' },
  { date: 'November 2025', topic: 'Team restructuring', sentiment: 'Concerned', color: 'bg-orange-500' },
];

const DEFAULT_BEHAVIORAL: BehavioralData = {
  communicationStyle: 'Direct and collaborative',
  personalityTraits: 'Analytical, detail-oriented, team player',
  motivationDrivers: 'Technical challenges, career growth',
  feedbackPreference: 'Regular, constructive, data-driven',
  collaborationStyle: 'Proactive, mentorship-oriented',
};

const DEFAULT_COMMUNICATION: CommunicationData = {
  topTopics: ['Technical Architecture', 'Team Leadership', 'Code Reviews'],
  concernsRaised: ['Workload Balance', 'Project Deadlines'],
  careerInterests: ['Technical Lead Role', 'System Design', 'Mentoring'],
  recentTopics: ['Q1 Goals', 'Team Expansion', 'New Tech Stack'],
};

const SALARY_HISTORY_BY_ID: Record<number, SalaryHistoryPoint[]> = {
  1: [{ year: '2022', salary: 75000 }, { year: '2023', salary: 82000 }, { year: '2024', salary: 90000 }, { year: '2025', salary: 98000 }, { year: '2026', salary: 105000 }],
  2: [{ year: '2020', salary: 115000 }, { year: '2021', salary: 122000 }, { year: '2022', salary: 130000 }, { year: '2025', salary: 138000 }, { year: '2026', salary: 145000 }],
  3: [{ year: '2021', salary: 78000 }, { year: '2022', salary: 84000 }, { year: '2023', salary: 90000 }, { year: '2024', salary: 95000 }, { year: '2026', salary: 98000 }],
  4: [{ year: '2019', salary: 100000 }, { year: '2021', salary: 112000 }, { year: '2022', salary: 120000 }, { year: '2024', salary: 128000 }, { year: '2026', salary: 135000 }],
  5: [{ year: '2021', salary: 88000 }, { year: '2022', salary: 95000 }, { year: '2023', salary: 100000 }, { year: '2024', salary: 106000 }, { year: '2026', salary: 110000 }],
  6: [{ year: '2023', salary: 78000 }, { year: '2024', salary: 83000 }, { year: '2025', salary: 86000 }, { year: '2026', salary: 88000 }],
  7: [{ year: '2020', salary: 72000 }, { year: '2021', salary: 80000 }, { year: '2022', salary: 86000 }, { year: '2024', salary: 91000 }, { year: '2026', salary: 95000 }],
  8: [{ year: '2022', salary: 76000 }, { year: '2023', salary: 82000 }, { year: '2024', salary: 87000 }, { year: '2025', salary: 90000 }, { year: '2026', salary: 92000 }],
};

function profileToEmployee(profile: EmployeeProfileDoc, insights: EmployeeInsightsDoc | null): Employee {
  return {
    id: parseInt(profile.id, 10) || 0,
    name: profile.name,
    role: profile.role,
    department: profile.department,
    sentiment: insights?.sentiment ?? 70,
    risk: insights?.risk ?? 'Medium',
    manager: profile.manager,
    dateOfJoining: profile.dateOfJoining,
    employmentType: profile.employmentType,
    location: profile.location,
    employeeId: profile.employeeId,
    baseSalary: profile.baseSalary,
    bonus: profile.bonus,
    stockOptions: profile.stockOptions,
    totalCompensation: profile.totalCompensation,
    lastRevision: profile.lastRevision,
    nextReview: profile.nextReview,
    avatarIndex: profile.avatarIndex ?? 0,
  };
}

export interface UseEmployeeDataResult {
  employee: Employee;
  photoUrl: string | null;
  salaryHistory: SalaryHistoryPoint[];
  sentimentTrend: { month: string; score: number }[];
  engagementMetrics: EngagementMetric[];
  meetings: MeetingItem[];
  behavioral: BehavioralData;
  communication: CommunicationData;
  riskIndicators: RiskIndicator[] | null;
  loading: boolean;
  error: Error | null;
  fromFirestore: boolean;
}

export function useEmployeeData(employeeId: number | string): UseEmployeeDataResult {
  const id = typeof employeeId === 'string' ? employeeId : String(employeeId);
  const numericId = typeof employeeId === 'number' ? employeeId : parseInt(id, 10) || 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromFirestore, setFromFirestore] = useState(false);
  const [employee, setEmployee] = useState<Employee>(() => getEmployeeById(numericId) ?? employees[0]!);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryPoint[]>(() => SALARY_HISTORY_BY_ID[numericId] ?? SALARY_HISTORY_BY_ID[1]!);
  const [sentimentTrend, setSentimentTrend] = useState(DEFAULT_SENTIMENT_TREND);
  const [engagementMetrics, setEngagementMetrics] = useState(DEFAULT_ENGAGEMENT);
  const [meetings, setMeetings] = useState(DEFAULT_MEETINGS);
  const [behavioral, setBehavioral] = useState(DEFAULT_BEHAVIORAL);
  const [communication, setCommunication] = useState(DEFAULT_COMMUNICATION);
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const fallback = getEmployeeById(numericId) ?? employees[0]!;
      setEmployee(fallback);
      setSalaryHistory(SALARY_HISTORY_BY_ID[numericId] ?? SALARY_HISTORY_BY_ID[1]!);
      setSentimentTrend(DEFAULT_SENTIMENT_TREND);
      setEngagementMetrics(DEFAULT_ENGAGEMENT);
      setMeetings(DEFAULT_MEETINGS);
      setBehavioral(DEFAULT_BEHAVIORAL);
      setCommunication(DEFAULT_COMMUNICATION);
      setRiskIndicators(null);
      setPhotoUrl(null);
      setFromFirestore(false);

      if (!isFirebaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const [profile, photo, insights] = await Promise.all([
          getEmployeeProfile(id),
          getEmployeePhoto(id),
          getEmployeeInsights(id),
        ]);

        if (cancelled) return;
        if (profile) {
          setEmployee(profileToEmployee(profile, insights));
          setFromFirestore(true);
          if (profile.salaryHistory?.length) setSalaryHistory(profile.salaryHistory);
          if (photo?.url) setPhotoUrl(photo.url);
        }
        if (insights) {
          if (insights.sentimentTrend?.length) setSentimentTrend(insights.sentimentTrend);
          if (insights.engagementMetrics?.length) setEngagementMetrics(insights.engagementMetrics);
          if (insights.meetings?.length) setMeetings(insights.meetings);
          if (insights.riskIndicators?.length) setRiskIndicators(insights.riskIndicators);
          if (insights.behavioral) {
            setBehavioral({
              communicationStyle: insights.behavioral.communicationStyle ?? DEFAULT_BEHAVIORAL.communicationStyle,
              personalityTraits: insights.behavioral.personalityTraits ?? DEFAULT_BEHAVIORAL.personalityTraits,
              motivationDrivers: insights.behavioral.motivationDrivers ?? DEFAULT_BEHAVIORAL.motivationDrivers,
              feedbackPreference: insights.behavioral.feedbackPreference ?? DEFAULT_BEHAVIORAL.feedbackPreference,
              collaborationStyle: insights.behavioral.collaborationStyle ?? DEFAULT_BEHAVIORAL.collaborationStyle,
            });
          }
          if (insights.communication) {
            setCommunication({
              topTopics: insights.communication.topTopics ?? DEFAULT_COMMUNICATION.topTopics,
              concernsRaised: insights.communication.concernsRaised ?? DEFAULT_COMMUNICATION.concernsRaised,
              careerInterests: insights.communication.careerInterests ?? DEFAULT_COMMUNICATION.careerInterests,
              recentTopics: insights.communication.recentTopics ?? DEFAULT_COMMUNICATION.recentTopics,
            });
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    setError(null);
    load();
    return () => { cancelled = true; };
  }, [id, numericId]);

  return {
    employee,
    photoUrl,
    salaryHistory,
    sentimentTrend,
    engagementMetrics,
    meetings,
    behavioral,
    communication,
    riskIndicators,
    loading,
    error,
    fromFirestore,
  };
}
