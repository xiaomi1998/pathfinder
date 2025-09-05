import { AiSession, AiMessage, SessionContext, MessageRole } from '@prisma/client';

// AI 会话创建输入类型
export interface CreateAiSessionInput {
  funnelId?: string;
  sessionContext?: SessionContext;
}

// AI 消息创建输入类型
export interface CreateAiMessageInput {
  sessionId: string;
  role: MessageRole;
  content: string;
}

// AI 会话响应类型（包含消息）
export interface AiSessionResponse extends AiSession {
  messages?: AiMessage[];
  messageCount?: number;
  lastMessage?: AiMessage;
}

// AI 会话详情类型
export interface AiSessionDetails extends AiSession {
  messages: AiMessage[];
  funnel?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    username: string;
  };
}

// AI 聊天请求类型
export interface ChatRequest {
  message: string;
  sessionId?: string;
  funnelId?: string;
  context?: SessionContext;
}

// AI 聊天响应类型
export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
  actions?: AiAction[];
}

// AI 动作类型
export interface AiAction {
  type: 'create_node' | 'update_funnel' | 'analyze_data' | 'generate_report';
  description: string;
  payload: any;
}

// AI 分析请求类型
export interface AnalysisRequest {
  funnelId: string;
  analysisType: 'performance' | 'bottlenecks' | 'recommendations' | 'trends';
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// AI 分析响应类型
export interface AnalysisResponse {
  analysisType: string;
  summary: string;
  insights: AiInsight[];
  recommendations: AiRecommendation[];
  data?: any;
}

// AI 洞察类型
export interface AiInsight {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'performance' | 'user_experience' | 'conversion' | 'data_quality';
  affectedNodes?: string[];
  metrics?: {
    name: string;
    value: number;
    unit?: string;
    change?: number;
  }[];
}

// AI 推荐类型
export interface AiRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'optimization' | 'content' | 'design' | 'targeting';
  expectedImpact: string;
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    steps: string[];
  };
  affectedNodes?: string[];
}

// 会话上下文配置类型
export interface SessionContextConfig {
  context: SessionContext;
  systemPrompt: string;
  maxMessages: number;
  allowedActions: string[];
  requiresFunnel: boolean;
}