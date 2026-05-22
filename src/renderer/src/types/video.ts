/* eslint-disable */
export type Platform = 'tiktok' | 'youtube' | 'facebook';

export type TaskStatus = 'idle' | 'processing' | 'success' | 'error';

export interface VideoTask {
  id: string;
  fileName: string;
  filePath: string;
  thumbnail: string;
  metadata: {
    title: string;
    description: string;
    hashtags: string;
  };
  platforms: Record<Platform, boolean>;
  status: TaskStatus;
  logs: string[];
}