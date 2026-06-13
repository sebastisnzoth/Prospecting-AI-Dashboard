export interface Service {
  id: string;
  name: string;
  category: string;
  avatar: string;
  calendarLink: string;
  aiPrompt: string;
  color: string;
  createdAt: string;
}

export interface IGAccount {
  id: string;
  handle: string;
  followers: number;
  status: 'active' | 'limited' | 'banned';
  sentToday: number;
  limit: number;
}

export interface Campaign {
  id: string;
  name: string;
  serviceId: string;
  status: 'running' | 'paused' | 'stopped';
  accounts: string[]; // references representing IGAccount IDs
  messagesSent: number;
  replies: number;
  qualified: number;
  scheduled: number;
  initialMessage: string;
  startDate: string;
  lastActive: string;
  follow_up_enabled?: boolean;
  follow_up_delay_hours?: number;
  follow_up_max_count?: number;
  aiModel?: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
}

export interface Message {
  id: string;
  sender: 'ai' | 'prospect';
  content: string;
  timestamp: string;
}

export interface Contact {
  id: string;
  handle: string;
  name: string;
  businessType: string;
  campaignId: string;
  serviceId: string;
  status: 'new' | 'contacted' | 'qualified' | 'scheduled' | 'closed' | 'lost';
  conv_stage?: 'intro' | 'q1' | 'q2' | 'q3' | 'closing' | 'done' | 'lost';
  conv_answers?: Record<string, string>;
  conv_summary?: string;
  objections?: string[];
  notes?: string;
  createdAt: string;
  lastContact: string;
  appointmentDate?: string;
  messages: Message[];
}

export interface DailyStat {
  date: string;
  sent: number;
  replies: number;
  qualified: number;
  scheduled: number;
}

export interface WebhookEvent {
  id: string;
  ig_handle: string;
  message: string;
  accountId: string;
  campaignId: string;
  timestamp: string;
  status: 'processed' | 'failed' | 'ignored';
  error?: string;
  apiResponse?: any;
}

