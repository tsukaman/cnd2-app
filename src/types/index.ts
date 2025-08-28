export interface PrairieProfile {
  basic: {
    name: string;
    title: string;
    company: string;
    bio: string;
    avatar?: string;
  };
  details: {
    tags: string[];
    skills: string[];
    interests: string[];
    certifications: string[];
    communities: string[];
    motto?: string;
  };
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    blog?: string;
    qiita?: string;
    zenn?: string;
  };
  custom: Record<string, unknown>;
  meta: {
    createdAt?: string;
    updatedAt?: string;
    connectedBy?: string;
    hashtag?: string;
    isPartialData?: boolean;
    sourceUrl?: string;
  };
}

export interface DiagnosisResult {
  id: string;
  mode: 'duo' | 'group';
  type: string;
  compatibility: number;
  summary: string;
  strengths: string[];
  opportunities: string[];
  advice: string;
  participants: PrairieProfile[];
  createdAt: string;
  aiPowered?: boolean;
  // Legacy fields for backward compatibility
  score?: number;
  message?: string;
  conversationStarters?: string[];
  hiddenGems?: string;
  shareTag?: string;
  // V3 engine metadata
  metadata?: {
    engine?: string;
    model?: string;
    analysis?: any;
  };
}

export interface CND2State {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  result: DiagnosisResult | null;
}

export interface Participant {
  id: string;
  url: string;
  profile: PrairieProfile | null;
  status: 'empty' | 'loading' | 'loaded' | 'error';
}

export interface DiagnosisMode {
  type: 'duo' | 'group';
  title: string;
  description: string;
  icon: string;
  minParticipants: number;
  maxParticipants: number;
}

export interface AnimationConfig {
  duration: number;
  delay?: number;
  repeat?: number | 'infinite';
  ease?: string;
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
  hashtags: string[];
}