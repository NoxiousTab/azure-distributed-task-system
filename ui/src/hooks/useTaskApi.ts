import axios from 'axios';
import { useCallback } from 'react';
import { getApiBaseUrl } from '../utils/api';
import type {
  SubmitTaskRequestDto,
  SubmitTaskResponseDto,
  TaskStatusResponseDto,
  TaskResultDto,
} from '../types/task';

// Simple API hook centralizing calls to the backend.
export const useTaskApi = () => {
  const baseUrl = getApiBaseUrl();

  const submitTask = useCallback(
    async (payload: SubmitTaskRequestDto): Promise<SubmitTaskResponseDto> => {
      // NOTE: current backend only supports text-based tasks.
      if (payload.type === 'compress-image') {
        throw new Error('Compress Image is not yet supported by the backend.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await axios.post<SubmitTaskResponseDto>(
          `${baseUrl}/submit-task`,
          payload,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        return response.data;
      } catch (err: any) {
        if (axios.isCancel(err)) {
          throw new Error('Request timed out while submitting task');
        }
        const message = err?.response?.data ?? err?.message ?? 'Failed to submit task';
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [baseUrl],
  );

  const submitImageTask = useCallback(
    async (formData: FormData): Promise<SubmitTaskResponseDto> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await axios.post<SubmitTaskResponseDto>(`${baseUrl}/submit-image-task`, formData, {
          signal: controller.signal,
          // Let the browser set the multipart boundary.
          headers: {
            Accept: 'application/json',
          },
        });
        return response.data;
      } catch (err: any) {
        if (axios.isCancel(err)) {
          throw new Error('Request timed out while submitting image task');
        }
        const message = err?.response?.data ?? err?.message ?? 'Failed to submit image task';
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [baseUrl],
  );

  const getStatus = useCallback(
    async (taskId: string): Promise<TaskStatusResponseDto> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await axios.get<TaskStatusResponseDto>(`${baseUrl}/status/${encodeURIComponent(taskId)}`);
        return response.data;
      } catch (err: any) {
        if (axios.isCancel(err)) {
          throw new Error('Request timed out while fetching status');
        }
        const message = err?.response?.data ?? err?.message ?? 'Failed to fetch status';
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [baseUrl],
  );

  const getResult = useCallback(
    async (taskId: string): Promise<TaskResultDto> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await axios.get<TaskResultDto>(`${baseUrl}/result/${encodeURIComponent(taskId)}`);
        return response.data;
      } catch (err: any) {
        if (axios.isCancel(err)) {
          throw new Error('Request timed out while fetching result');
        }
        const message = err?.response?.data ?? err?.message ?? 'Failed to fetch result';
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [baseUrl],
  );

  return { submitTask, submitImageTask, getStatus, getResult, baseUrl };
};
