/**
 * Firestore collections for employee data (split as requested):
 * 1. employee_profiles – profile, compensation, salary history, documents
 * 2. employee_photos – photo URL per employee
 * 3. employee_insights – behavior, personality, sentiment, engagement, meetings, risk indicators
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

export const COLLECTIONS = {
  PROFILES: 'employee_profiles',
  PHOTOS: 'employee_photos',
  INSIGHTS: 'employee_insights',
} as const;

export type RiskLevel = 'Low' | 'Medium' | 'High';

/** Salary history point */
export interface SalaryHistoryPoint {
  year: string;
  salary: number;
}

/** employee_profiles – one doc per employee (id = numeric string "1", "2", ... or employeeId) */
export interface EmployeeProfileDoc {
  id: string;
  name: string;
  role: string;
  department: string;
  manager: string;
  dateOfJoining: string;
  employmentType: string;
  location: string;
  employeeId: string;
  baseSalary: string;
  bonus: string;
  stockOptions: string;
  totalCompensation: string;
  lastRevision: string;
  nextReview: string;
  salaryHistory?: SalaryHistoryPoint[];
  documents?: { name: string }[];
  avatarIndex?: number;
}

/** employee_photos – photo URL per employee */
export interface EmployeePhotoDoc {
  employeeId: string;
  url: string;
  updatedAt?: string;
}

/** employee_insights – behavior, personality, sentiment, meetings, risks */
export interface EngagementMetric {
  metric: string;
  score: number;
  fill: string;
}

export interface MeetingItem {
  date: string;
  topic: string;
  sentiment: string;
  color: string;
}

export interface RiskIndicator {
  label: string;
  level: RiskLevel;
  color: string;
}

export interface EmployeeInsightsDoc {
  employeeId: string;
  sentiment: number;
  sentimentTrend?: { month: string; score: number }[];
  positiveNegative?: string;
  behavioral?: {
    communicationStyle?: string;
    personalityTraits?: string;
    motivationDrivers?: string;
    feedbackPreference?: string;
    collaborationStyle?: string;
  };
  engagementMetrics?: EngagementMetric[];
  communication?: {
    topTopics?: string[];
    concernsRaised?: string[];
    careerInterests?: string[];
    recentTopics?: string[];
  };
  meetings?: MeetingItem[];
  riskIndicators?: RiskIndicator[];
  risk?: RiskLevel;
}

/** Normalized employee for UI (profile + insights.risk + insights.sentiment + photo) */
export interface EmployeeFromFirestore {
  id: number;
  name: string;
  role: string;
  department: string;
  sentiment: number;
  risk: RiskLevel;
  manager: string;
  dateOfJoining: string;
  employmentType: string;
  location: string;
  employeeId: string;
  baseSalary: string;
  bonus: string;
  stockOptions: string;
  totalCompensation: string;
  lastRevision: string;
  nextReview: string;
  avatarIndex: number;
  photoUrl?: string | null;
}

/** For list view: Employee shape + optional photoUrl */
export type EmployeeListItem = EmployeeFromFirestore;

function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  return getFirebaseDb();
}

function docIdFromRoute(id: string | number): string {
  return String(id);
}

/** Fetch a single employee profile by id (numeric or employeeId) */
export async function getEmployeeProfile(
  id: string | number
): Promise<EmployeeProfileDoc | null> {
  const db = getDb();
  if (!db) return null;
  const docId = docIdFromRoute(id);
  const snap = await getDoc(doc(db, COLLECTIONS.PROFILES, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EmployeeProfileDoc;
}

/** Fetch all employee profiles (for list view) */
export async function getEmployeeProfiles(): Promise<EmployeeProfileDoc[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.PROFILES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmployeeProfileDoc));
}

/** Fetch employee photo by id */
export async function getEmployeePhoto(
  id: string | number
): Promise<EmployeePhotoDoc | null> {
  const db = getDb();
  if (!db) return null;
  const docId = docIdFromRoute(id);
  const snap = await getDoc(doc(db, COLLECTIONS.PHOTOS, docId));
  if (!snap.exists()) return null;
  return { ...snap.data(), employeeId: snap.id } as EmployeePhotoDoc;
}

/** Fetch employee insights (behavior, sentiment, meetings, risks) by id */
export async function getEmployeeInsights(
  id: string | number
): Promise<EmployeeInsightsDoc | null> {
  const db = getDb();
  if (!db) return null;
  const docId = docIdFromRoute(id);
  const snap = await getDoc(doc(db, COLLECTIONS.INSIGHTS, docId));
  if (!snap.exists()) return null;
  return { employeeId: snap.id, ...snap.data() } as EmployeeInsightsDoc;
}

/** Build full employee for list: profile + photo + insights (sentiment, risk) */
export async function getEmployeeForList(
  profile: EmployeeProfileDoc
): Promise<EmployeeFromFirestore> {
  const docId = profile.id;
  const [photo, insights] = await Promise.all([
    getEmployeePhoto(docId),
    getEmployeeInsights(docId),
  ]);

  return {
    id: parseInt(docId, 10) || 0,
    name: profile.name,
    role: profile.role,
    department: profile.department,
    sentiment: insights?.sentiment ?? 0,
    risk: insights?.risk ?? 'Low',
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
    photoUrl: photo?.url ?? null,
  };
}

/** List all employees from Firestore (profiles + photo + insights merged) */
export async function listEmployeesFromFirestore(): Promise<
  EmployeeFromFirestore[]
> {
  const profiles = await getEmployeeProfiles();
  if (profiles.length === 0) return [];
  const db = getDb();
  if (!db) return [];
  const result: EmployeeFromFirestore[] = [];
  for (const profile of profiles) {
    result.push(await getEmployeeForList(profile));
  }
  result.sort((a, b) => a.id - b.id);
  return result;
}
