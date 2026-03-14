/**
 * API client for backend communication with proper error handling and validation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Validate API URL on initialization
if (!API_BASE_URL) {
  console.warn('API_BASE_URL is not set. Using default: http://localhost:8000');
}

interface ApiResponse<T> {
  status: string;
  [key: string]: any;
}

export async function fetchChat(question: string): Promise<string> {
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

    const data: ApiResponse<string> = await response.json();
    
    if (!data.response) {
      console.warn('Chat response missing response field:', data);
      return 'I could not generate a response. Please try again.';
    }

    console.log('Chat response received:', data.response.substring(0, 100) + '...');
    return data.response;
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
