/**
 * Deep Link Utilities for Mobile Apps
 * Maps web routes and entity IDs to mobile deep links.
 */

export const DEEP_LINK_SCHEME = "schoolpay://";

export const DeepLinks = {
  attendance: () => `${DEEP_LINK_SCHEME}attendance`,
  attendanceDetail: (date: string) => `${DEEP_LINK_SCHEME}attendance/${date}`,
  
  results: (examId?: string) => 
    examId ? `${DEEP_LINK_SCHEME}results?examId=${examId}` : `${DEEP_LINK_SCHEME}results`,
    
  fees: () => `${DEEP_LINK_SCHEME}fees`,
  feeDetail: (feeId: string) => `${DEEP_LINK_SCHEME}fees/${feeId}`,
  
  announcements: () => `${DEEP_LINK_SCHEME}announcements`,
  announcementDetail: (announcementId: string) => `${DEEP_LINK_SCHEME}announcements/${announcementId}`,
  
  surveys: (surveyId?: string) => 
    surveyId ? `${DEEP_LINK_SCHEME}surveys/${surveyId}` : `${DEEP_LINK_SCHEME}surveys`,
    
  assignments: () => `${DEEP_LINK_SCHEME}assignments`,
  assignmentDetail: (assignmentId: string) => `${DEEP_LINK_SCHEME}assignments/${assignmentId}`,
  
  dashboard: () => `${DEEP_LINK_SCHEME}dashboard`,
};

/**
 * Given a generic entity type and ID, attempts to resolve a deep link.
 */
export function resolveDeepLink(entityType: string, entityId?: string | null): string | undefined {
  switch (entityType) {
    case "FEE":
      return entityId ? DeepLinks.feeDetail(entityId) : DeepLinks.fees();
    case "EXAM":
    case "RESULT":
      return DeepLinks.results(entityId || undefined);
    case "ANNOUNCEMENT":
      return entityId ? DeepLinks.announcementDetail(entityId) : DeepLinks.announcements();
    case "HOMEWORK":
      return entityId ? DeepLinks.assignmentDetail(entityId) : DeepLinks.assignments();
    case "SURVEY":
      return DeepLinks.surveys(entityId || undefined);
    case "ATTENDANCE":
      return entityId ? DeepLinks.attendanceDetail(entityId) : DeepLinks.attendance();
    default:
      return DeepLinks.dashboard();
  }
}
