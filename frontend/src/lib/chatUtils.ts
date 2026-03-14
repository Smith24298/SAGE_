/**
 * Utility functions for chat personalization based on behavioral intelligence
 */

interface BehavioralProfile {
  communication_style?: string;
  personality_summary?: string;
  motivation_drivers?: string[];
  feedback_preference?: string;
  collaboration_style?: string;
}

interface EngagementProfile {
  engagement_level?: number;
  participation?: number;
  responsiveness?: number;
  initiative?: number;
}

interface EmployeeSummary {
  employee: string;
  behavioral_profile?: BehavioralProfile;
  engagement_profile?: EngagementProfile;
}

/**
 * Format a long response into concise bullet points (max 100 chars per line)
 */
export function conciseFormat(text: string, maxLines: number = 3): string {
  const lines = text.split('\n').filter((line) => line.trim());
  const formatted = lines.slice(0, maxLines).map((line) => {
    // Truncate line if too long
    if (line.length > 100) {
      return line.substring(0, 97) + '...';
    }
    return line;
  });

  return formatted.join('\n');
}

/**
 * Personalize a response based on employee behavioral data
 */
export function personalizeResponse(
  baseResponse: string,
  employeeName: string | null,
  behavioralData?: EmployeeSummary
): string {
  if (!employeeName) {
    return conciseFormat(baseResponse);
  }

  let personalized = baseResponse;

  if (behavioralData?.behavioral_profile) {
    const profile = behavioralData.behavioral_profile;

    // If they prefer direct feedback, make response more direct
    if (profile.feedback_preference?.toLowerCase().includes('direct')) {
      personalized = personalized.replace(/^Here's what I think/, 'Key takeaway');
    }

    // Adjust communication style based on their preference
    if (profile.communication_style?.toLowerCase().includes('brief')) {
      personalized = conciseFormat(personalized, 2);
    }

    // If they're motivated by specific drivers, highlight relevant aspects
    if (profile.motivation_drivers) {
      for (const driver of profile.motivation_drivers) {
        if (driver.toLowerCase().includes('recognition')) {
          personalized = personalized.replace(
            /your work/gi,
            'your excellent work'
          );
        }
        if (driver.toLowerCase().includes('growth') || driver.toLowerCase().includes('learning')) {
          personalized = personalized.replace(
            /consider/gi,
            'consider learning from'
          );
        }
      }
    }
  }

  return conciseFormat(personalized);
}

/**
 * Generate personalized meeting prep response
 */
export function generateMeetingPrepResponse(
  withEmployee: string,
  behavioralData?: EmployeeSummary
): string {
  if (!behavioralData) {
    return `Meeting with ${withEmployee}:\n• Review recent updates\n• Discuss upcoming priorities\n• Check alignment`;
  }

  const profile = behavioralData.behavioral_profile;
  const engagement = behavioralData.engagement_profile;

  let response = `**Meeting Prep: ${withEmployee}**\n`;

  // Personalization based on communication style
  if (profile?.communication_style) {
    response += `Their style: ${profile.communication_style.split('\n')[0]}\n`;
  }

  // Suggest talking points based on motivation drivers
  if (profile?.motivation_drivers && profile.motivation_drivers.length > 0) {
    response += `• Highlight: ${profile.motivation_drivers[0]}\n`;
  }

  // Engagement-based recommendations
  if (engagement?.engagement_level) {
    if (engagement.engagement_level > 0.7) {
      response += `• They're engaged—bring challenging topics\n`;
    } else {
      response += `• Focus on clarity and action items\n`;
    }
  }

  if (engagement?.participation && engagement.participation < 0.5) {
    response += `• Create space for their input\n`;
  }

  // Collaboration style tips
  if (profile?.collaboration_style) {
    response += `• Work style: ${profile.collaboration_style.split('\n')[0]}`;
  }

  return response;
}

/**
 * Extract employee names from a question (for "prepare me a meet with X")
 */
export function extractEmployeeName(question: string): string | null {
  const withPattern = /(?:meet|meeting|talk|discussion|speak|call)(?:\s+with\s+|\s+)(\w+(?:\s+\w+)?)/i;
  const match = question.match(withPattern);
  return match ? match[1].trim() : null;
}

/**
 * Check if question is about meeting preparation
 */
export function isMeetingPrepQuestion(question: string): boolean {
  return /(?:prepare|ready|brief|help|tips).*(?:meet|meeting|talk|discussion|speak|interview)/i.test(
    question
  );
}
