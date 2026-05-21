import { vi } from './vi';
import { en } from './en';

// Gộp chung 2 ngôn ngữ và xuất ra ngoài dưới dạng biến 'translations'
export const translations: Record<'vi' | 'en', Record<string, string>> = {
  vi,
  en
};