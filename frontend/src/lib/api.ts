/**
 * API client for backend communication with proper error handling and validation
 */

function normalizeApiBaseUrl(raw: string | undefined): string {
  const trimmed = String(raw ?? '').trim();
  const fallback = 'http://localhost:8000';

  if (!trimmed) {
    return fallback;
  }

  // If user provided e.g. "localhost:8000" without scheme, browser fetch will fail.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withScheme.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

interface ApiResponse<T> {
  status: string;
  [key: string]: any;
}

export interface ChatRoutingDecision {
  mode: string;
  confidence: number;
  reason: string;
  source: string;
}

export interface ChatNavigationEntity {
  type?: string;
  id?: string;
  name?: string;
  [key: string]: any;
}

export interface ChatNavigationPayload {
  should_navigate: boolean;
  path: string;
  label: string;
  confidence: number;
  reason: string;
  entity?: ChatNavigationEntity;
  fallback_path?: string;
}

export interface ChatResponsePayload {
  response: string;
  mode?: string;
  routing?: ChatRoutingDecision;
  navigation?: ChatNavigationPayload | null;
}

export async function fetchChat(question: string): Promise<ChatResponsePayload> {
  if (!question || !question.trim()) {
    throw new Error('Question cannot be empty');
  }

  try {
    const url = `${API_BASE_URL}/chat`;
    console.log(`Sending chat to: ${url}`);

    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question.trim() }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse<ChatResponsePayload> = await response.json();
    
    if (typeof data.response !== 'string' || !data.response.trim()) {
      console.warn('Chat response missing response field:', data);
      return {
        response: 'I could not generate a response. Please try again.',
        mode: typeof data.mode === 'string' ? data.mode : undefined,
        routing: data.routing,
        navigation: data.navigation ?? null,
      };
    }

    console.log('Chat response received:', data.response.substring(0, 100) + '...');
    return {
      response: data.response,
      mode: typeof data.mode === 'string' ? data.mode : undefined,
      routing: data.routing,
      navigation: data.navigation ?? null,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

export async function analyzeIntelligence(
  employeeName: string,
  personalityData: Record<string, any>,
  transcript: string,
  storeInDb: boolean = true,
  updateTwin: boolean = true
) {
  try {
    const response: Response = await fetch(`${API_BASE_URL}/api/analyze/intelligence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_name: employeeName,
        personality_data: personalityData,
        transcript,
        store_in_db: storeInDb,
        update_twin: updateTwin,
      }),
    });

    if (!response.ok) {
      throw new Error(`Intelligence API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.report;
  } catch (error) {
    console.error('Intelligence API error:', error);
    throw error;
  }
}

export async function getEmployeeSummary(employeeName: string) {
  if (!employeeName || !employeeName.trim()) {
    console.warn('getEmployeeSummary: employeeName is empty');
    return null;
  }

  try {
    const encodedName = encodeURIComponent(employeeName.trim());
    const url = `${API_BASE_URL}/api/intelligence/summary/${encodedName}`;
    
    console.log(`Fetching employee summary from: ${url}`);

    const response: Response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`API response not ok: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        console.log(`Employee not found: ${employeeName}`);
        return null;
      }
      throw new Error(`Summary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.summary) {
      console.warn('Response missing summary field:', data);
      // Check if the response structure is from a different endpoint
      if (data.status === 'success' && !data.summary) {
        console.warn('API returned success but no summary data');
        return null;
      }
      return null;
    }

    console.log(`Successfully fetched summary for ${employeeName}:`, data.summary);
    return data.summary;
  } catch (error) {
    console.error('Summary API error:', error);
    // Return null on error so chat can fall back gracefully
    return null;
  }
}

export async function getIntelligenceHistory(employeeName: string, limit: number = 5) {
  try {
    const encodedName = encodeURIComponent(employeeName.trim());
    const url = `${API_BASE_URL}/api/intelligence/history/${encodedName}?limit=${limit}`;
    
    console.log(`Fetching intelligence history from: ${url}`);

    const response: Response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`History API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.reports) {
      console.warn('Response missing reports field:', data);
      return [];
    }

    console.log(`Retrieved ${data.reports.length} reports for ${employeeName}`);
    return data.reports;
  } catch (error) {
    console.error('History API error:', error);
    return [];
  }
}

export async function uploadTranscript(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload_transcript`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload API error:', error);
    throw error;
  }
}

export async function getMeetingSummaries(limit: number = 5) {
  try {
    const url = `${API_BASE_URL}/api/meeting_summaries?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.summaries || [];
  } catch (error) {
    console.error('getMeetingSummaries error:', error);
    return [];
  }
}

export async function getMeetingSummary(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/meeting_summaries/${id}`);
    if (!response.ok) {
      console.warn(`Meeting summary not found: ${id}`);
      return null;
    }
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('getMeetingSummary error:', error);
    return null;
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/health`;
    console.log(`Checking API health: ${url}`);

    const response: Response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error(`API health check failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log('API health check passed:', data);
    return true;
  } catch (error) {
    console.error('API health check error:', error);
    return false;
  }
}

export async function debugEmployeeSummary(employeeName: string): Promise<void> {
  console.group(`Debug: getEmployeeSummary("${employeeName}")`);
  console.log(`API_BASE_URL: ${API_BASE_URL}`);
  console.log(`Employee name: "${employeeName}"`);
  console.log(`Encoded name: "${encodeURIComponent(employeeName)}"`);
  
  // Check API health first
  const isHealthy = await checkApiHealth();
  console.log(`API Health: ${isHealthy ? '✓' : '✗'}`);
  
  // Try to fetch summary
  try {
    const result = await getEmployeeSummary(employeeName);
    console.log(`Result:`, result);
  } catch (error) {
    console.error(`Error:`, error);
  }
  console.groupEnd();
}

export type DashboardEventStatus = 'upcoming' | 'past';

export interface CalendarEventRecord {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendee_email?: string | null;
  attendees: number;
  type: string;
  session_id: string;
  status: DashboardEventStatus;
  event_link?: string | null;
  google_sync_error?: string | null;
  created_at?: string;
}

export interface CreateCalendarEventInput {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendee_email?: string | null;
  attendees?: number;
  type?: string;
  session_id?: string;
  sync_to_google?: boolean;
  duration_minutes?: number;
}

function toCalendarEventRecord(raw: Record<string, any>): CalendarEventRecord {
  const parsedAttendees = Number(raw?.attendees ?? 0);
  const fallbackId = `${Date.now()}`;

  return {
    id: String(raw?.id ?? raw?._id ?? fallbackId),
    title: String(raw?.title ?? ''),
    date: String(raw?.date ?? ''),
    time: String(raw?.time ?? ''),
    location: String(raw?.location ?? ''),
    description: String(raw?.description ?? ''),
    attendee_email: raw?.attendee_email ?? null,
    attendees: Number.isFinite(parsedAttendees) ? Math.max(0, parsedAttendees) : 0,
    type: String(raw?.type ?? 'Fun'),
    session_id: String(raw?.session_id ?? 'default'),
    status: raw?.status === 'past' ? 'past' : 'upcoming',
    event_link: raw?.event_link ?? null,
    google_sync_error: raw?.google_sync_error ?? null,
    created_at: raw?.created_at,
  };
}

export function getCurrentSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  const key = 'sage_dashboard_session_id';
  const existing = window.sessionStorage.getItem(key);
  if (existing && existing.trim()) {
    return existing;
  }

  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, created);
  return created;
}

export async function getCalendarEvents(
  sessionId?: string,
  limit: number = 100,
): Promise<CalendarEventRecord[]> {
  try {
    const params = new URLSearchParams();
    params.set('limit', String(Math.max(1, limit)));
    if (sessionId && sessionId.trim()) {
      params.set('session_id', sessionId.trim());
    }

    const response = await fetch(`${API_BASE_URL}/api/calendar/events?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Calendar events API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.events) ? data.events : [];
    return items.map((item: Record<string, any>) => toCalendarEventRecord(item));
  } catch (error) {
    console.error('getCalendarEvents error:', error);
    return [];
  }
}

export async function createCalendarEvent(
  payload: CreateCalendarEventInput,
): Promise<CalendarEventRecord> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.detail || errorData?.message || `Calendar create API error: ${response.statusText}`,
    );
  }

  const data = await response.json();
  const rawEvent = data?.event ?? data;

  return toCalendarEventRecord({
    ...rawEvent,
    event_link: rawEvent?.event_link ?? data?.event_link,
    google_sync_error: rawEvent?.google_sync_error ?? data?.google_sync_error,
  });
}

export interface EngagementAnalyticsKpis {
  overallEngagementPct: number;
  highlyEngagedPct: number;
  atRiskPct: number;
}

export interface EngagementAnalyticsPoint {
  month: string;
  score: number;
}

export interface EngagementAnalyticsFactor {
  factor: string;
  score: number;
}

export interface EngagementAnalyticsPayload {
  kpis: EngagementAnalyticsKpis;
  engagementTrend: EngagementAnalyticsPoint[];
  engagementFactors: EngagementAnalyticsFactor[];
  totalEmployees: number;
}

export async function getEngagementAnalytics(): Promise<EngagementAnalyticsPayload | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/engagement/analytics`);

    if (!response.ok) {
      throw new Error(`Engagement analytics API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analytics = data?.analytics ?? data;
    if (!analytics || typeof analytics !== 'object') {
      return null;
    }

    const kpis = analytics?.kpis ?? {};
    const toNumber = (v: unknown, fallback: number = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    return {
      kpis: {
        overallEngagementPct: toNumber(kpis?.overallEngagementPct, 0),
        highlyEngagedPct: toNumber(kpis?.highlyEngagedPct, 0),
        atRiskPct: toNumber(kpis?.atRiskPct, 0),
      },
      engagementTrend: Array.isArray(analytics?.engagementTrend)
        ? analytics.engagementTrend.map((p: Record<string, any>) => ({
            month: String(p?.month ?? ''),
            score: toNumber(p?.score, 0),
          }))
        : [],
      engagementFactors: Array.isArray(analytics?.engagementFactors)
        ? analytics.engagementFactors.map((p: Record<string, any>) => ({
            factor: String(p?.factor ?? ''),
            score: toNumber(p?.score, 0),
          }))
        : [],
      totalEmployees: toNumber(analytics?.totalEmployees, 0),
    };
  } catch (error) {
    console.error('getEngagementAnalytics error:', error);
    return null;
  }
}

export interface WorkforceDepartmentGrowth {
  department: string;
  headcount: number;
  growth: number;
}

export interface WorkforceDiversitySlice {
  category: string;
  value: number;
}

export interface WorkforceInsightsMetrics {
  totalEmployees: number;
  newHiresQ1: number;
  turnoverRatePct: number;
  avgTenureYears: number;
}

export interface WorkforceInsightsPayload {
  departmentGrowth: WorkforceDepartmentGrowth[];
  diversityData: WorkforceDiversitySlice[];
  metrics: WorkforceInsightsMetrics;
}

export async function getWorkforceInsights(windowDays: number = 90): Promise<WorkforceInsightsPayload | null> {
  try {
    const params = new URLSearchParams();
    params.set('window_days', String(Math.max(1, windowDays)));

    const response = await fetch(`${API_BASE_URL}/api/workforce/insights?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Workforce insights API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const insights = data?.insights ?? data;
    if (!insights || typeof insights !== 'object') {
      return null;
    }

    const toNumber = (v: unknown, fallback: number = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    return {
      departmentGrowth: Array.isArray(insights?.departmentGrowth)
        ? insights.departmentGrowth.map((row: Record<string, any>) => ({
            department: String(row?.department ?? 'Unknown'),
            headcount: toNumber(row?.headcount, 0),
            growth: toNumber(row?.growth, 0),
          }))
        : [],
      diversityData: Array.isArray(insights?.diversityData)
        ? insights.diversityData.map((row: Record<string, any>) => ({
            category: String(row?.category ?? 'Unknown'),
            value: toNumber(row?.value, 0),
          }))
        : [],
      metrics: {
        totalEmployees: toNumber(insights?.metrics?.totalEmployees, 0),
        newHiresQ1: toNumber(insights?.metrics?.newHiresQ1, 0),
        turnoverRatePct: toNumber(insights?.metrics?.turnoverRatePct, 0),
        avgTenureYears: toNumber(insights?.metrics?.avgTenureYears, 0),
      },
    };
  } catch (error) {
    console.error('getWorkforceInsights error:', error);
    return null;
  }
}

export interface DashboardMetrics {
  totalEmployees: number;
  companyEngagement: number;
  attritionRisk: number;
  workforceGrowth: number;
}

export interface DashboardSentimentPoint {
  month: string;
  score: number;
}

export interface DashboardDepartmentPoint {
  department: string;
  stress: number;
  engagement: number;
}

export interface DashboardAttritionSlice {
  name: string;
  value: number;
}

export interface DashboardStrategicInsight {
  latestInsight: string;
  recommendation: string;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  sentimentTrend: DashboardSentimentPoint[];
  departmentStressEngagement: DashboardDepartmentPoint[];
  attritionPrediction: DashboardAttritionSlice[];
  strategicInsight: DashboardStrategicInsight;
}

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function normalizeDashboardOverview(raw: Record<string, any>): DashboardOverview {
  const metricsRaw = raw?.metrics ?? {};
  const strategicRaw = raw?.strategicInsight ?? {};

  const sentimentTrend = Array.isArray(raw?.sentimentTrend)
    ? raw.sentimentTrend.map((point: Record<string, any>) => ({
        month: String(point?.month ?? ""),
        score: toNumber(point?.score, 0),
      }))
    : [];

  const departmentStressEngagement = Array.isArray(raw?.departmentStressEngagement)
    ? raw.departmentStressEngagement.map((point: Record<string, any>) => ({
        department: String(point?.department ?? "Unknown"),
        stress: toNumber(point?.stress, 0),
        engagement: toNumber(point?.engagement, 0),
      }))
    : [];

  const attritionPrediction = Array.isArray(raw?.attritionPrediction)
    ? raw.attritionPrediction.map((slice: Record<string, any>) => ({
        name: String(slice?.name ?? "Unknown"),
        value: toNumber(slice?.value, 0),
      }))
    : [];

  return {
    metrics: {
      totalEmployees: toNumber(metricsRaw?.totalEmployees, 0),
      companyEngagement: toNumber(metricsRaw?.companyEngagement, 0),
      attritionRisk: toNumber(metricsRaw?.attritionRisk, 0),
      workforceGrowth: toNumber(metricsRaw?.workforceGrowth, 0),
    },
    sentimentTrend,
    departmentStressEngagement,
    attritionPrediction,
    strategicInsight: {
      latestInsight: String(strategicRaw?.latestInsight ?? ""),
      recommendation: String(strategicRaw?.recommendation ?? ""),
    },
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const overview = data?.overview ?? data;
    if (!overview || typeof overview !== "object") {
      return null;
    }

    return normalizeDashboardOverview(overview);
  } catch (error) {
    console.error("getDashboardOverview error:", error);
    return null;
  }
}
