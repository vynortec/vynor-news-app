
export enum NewsImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  impact: NewsImpact;
  category: string;
  timestamp: string; // Friendly label like "Há 2 horas"
  publishedAt: string; // ISO date for sorting
  imageUrl?: string;
  isSaved?: boolean;
}

export interface UserPreferences {
  interests: string[];
  alertLevel: 'low' | 'medium' | 'high';
  companyTypes: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
  company?: string;
  avatar?: string;
  isLoggedIn: boolean;
  preferences: UserPreferences;
}

export type AppView = 'auth' | 'home' | 'alerts' | 'profile' | 'detail' | 'image-editor' | 'onboarding';
