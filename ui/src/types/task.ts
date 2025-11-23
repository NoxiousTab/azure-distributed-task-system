export type TaskType = 'summarize' | 'markdown-to-html' | 'compress-image';

export interface SubmitTaskRequestDto {
  type: TaskType;
  text: string;
}

export interface SubmitTaskResponseDto {
  taskId: string;
}

export type TaskStatusValue = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskStatusResponseDto {
  taskId: string;
  status: TaskStatusValue;
  outputUrl?: string | null;
  errorMessage?: string | null;
}

export interface LocalTaskRecord {
  taskId: string;
  type: TaskType;
  createdAt: string;
}

export interface TaskResultDto {
  taskId: string;
  type?: TaskType | string;
  summary?: string;
  html?: string;
  // For compress-image
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
  compressionRatio?: number;
  // Allow backend to add extra fields without breaking the UI.
  [key: string]: unknown;
}
