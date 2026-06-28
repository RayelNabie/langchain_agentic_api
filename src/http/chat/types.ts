import type { ToolCallLog, Source } from '#llm/types.js';

export type ChatResponse =
  | { answer: string; toolCalls: ToolCallLog[]; sources: Source[] }
  | { error: string; details?: string };

export type StorySettings = {
  requireAcceptanceCriteria: boolean;
  requireDescription: boolean;
  requireDueDate: boolean;
  autoAssign: boolean;
};

export interface ChatRequest {
  prompt?: string;
  stream?: boolean;
  sessionId?: string;
  boardId?: string;
  listId?: string;
  settings?: Partial<StorySettings>;
}
