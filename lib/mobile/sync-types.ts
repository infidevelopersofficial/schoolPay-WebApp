export interface OfflineMutation {
  id: string; // Client-side UUID for idempotency
  type: string; // e.g., "MARK_ATTENDANCE", "MARK_NOTIFICATION_READ"
  payload: any;
  actionAt: string; // ISO timestamp of when it happened offline
}

export interface SyncMutationsRequest {
  mutations: OfflineMutation[];
}

export interface SyncMutationsResponse {
  processed: number;
  failed: Array<{ id: string; error: string }>;
}
