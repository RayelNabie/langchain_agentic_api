export enum ToolCallStatus {
  Success = 'success',
  Invalid = 'invalid',
  Error = 'error',
}
export type ToolCallLog = { tool: string; input: unknown; output: string; status: ToolCallStatus };
export type Source = { content: string; source: string };
export type AgentResponse = { message: string; toolCalls: ToolCallLog[]; sources: Source[] };

export type AgentStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_start'; tool: string; input: unknown }
  | { type: 'tool_end'; tool: string; output: string }
  | { type: 'done'; toolCalls: ToolCallLog[]; sources: Source[] };

export type CreateTaskInput = {
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  dueDate?: string;
  assigneeName?: string;
};
