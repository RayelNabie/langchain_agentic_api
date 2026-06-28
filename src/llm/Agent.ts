import { randomUUID } from 'crypto';

import type { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type AIMessageChunk,
  type BaseMessage,
} from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import type { StructuredToolInterface } from '@langchain/core/tools';

import { getHistory, logToolCall } from '#data/chatHistory.js';
import type { StorySettings } from '#http/chat/types.js';
import AgentTools from '#llm/tools.js';
import buildSystemPrompt from '#llm/systemPrompt.js';
import {
  ToolCallStatus,
  type AgentResponse,
  type AgentStreamEvent,
  type Source,
  type ToolCallLog,
} from '#llm/types.js';

type JsonToolSchema = { required?: string[] };

export default class Agent {
  private model: BaseChatModel | null = null;

  constructor(private readonly createModel: () => BaseChatModel) {}

  async chat(
    prompt: string,
    sessionId: string = randomUUID(),
    boardId?: string,
    listId?: string,
    settings: Partial<StorySettings> = {},
  ): Promise<AgentResponse> {
    const { history, modelWithTools, sessionTools, messages, toolCalls, sources } =
      await this.initSession(prompt, sessionId, boardId, listId, settings);

    while (true) {
      const response: AIMessageChunk = await modelWithTools.invoke(messages);
      messages.push(response);

      if (!response.tool_calls?.length) {
        const output: string = String(response.content);
        await history.addUserMessage(prompt);
        await history.addAIMessage(output);
        await Promise.all(
          toolCalls.map(
            (toolCallLog: ToolCallLog): Promise<void> =>
              logToolCall(
                sessionId,
                toolCallLog.tool,
                toolCallLog.input,
                toolCallLog.output,
                toolCallLog.status,
              ),
          ),
        );
        return { message: output, toolCalls, sources };
      }

      for (const toolCall of response.tool_calls) {
        const { output, status } = await Agent.useTool(toolCall, sessionTools, sources);

        toolCalls.push({ tool: toolCall.name, input: toolCall.args, output, status });
        messages.push(new ToolMessage({ content: output, tool_call_id: toolCall.id ?? '' }));
      }
    }
  }

  private async initSession(
    prompt: string,
    sessionId: string,
    boardId?: string,
    listId?: string,
    settings: Partial<StorySettings> = {},
  ) {
    const history: PostgresChatMessageHistory = await getHistory(sessionId);
    const pastMessages: BaseMessage[] = await history.getMessages();
    const model: BaseChatModel = this.getModel();
    if (!model.bindTools) throw new Error('Het geconfigureerde model ondersteunt geen tools');
    const sessionTools = new AgentTools(boardId, listId, settings.autoAssign ?? false).all();
    return {
      history,
      modelWithTools: model.bindTools(sessionTools),
      sessionTools,
      messages: [
        new SystemMessage(buildSystemPrompt(settings)),
        ...pastMessages,
        new HumanMessage(prompt),
      ],
      toolCalls: new Array<ToolCallLog>(),
      sources: new Array<Source>(),
    };
  }

  streamEvents(
    prompt: string,
    sessionId: string = randomUUID(),
    boardId?: string,
    listId?: string,
    settings: Partial<StorySettings> = {},
  ): AsyncIterable<AgentStreamEvent> {
    return this.runStreamLoop(prompt, sessionId, boardId, listId, settings);
  }

  private async *runStreamLoop(
    prompt: string,
    sessionId: string,
    boardId?: string,
    listId?: string,
    settings: Partial<StorySettings> = {},
  ): AsyncIterable<AgentStreamEvent> {
    const { history, modelWithTools, sessionTools, messages, toolCalls, sources } =
      await this.initSession(prompt, sessionId, boardId, listId, settings);

    while (true) {
      let accumulated: AIMessageChunk | null = null;

      for await (const chunk of await modelWithTools.stream(messages)) {
        const aiChunk: AIMessageChunk = chunk;
        accumulated = accumulated ? accumulated.concat(aiChunk) : aiChunk;
        if (typeof aiChunk.content === 'string' && aiChunk.content) {
          yield { type: 'token', content: aiChunk.content };
        }
      }

      if (!accumulated) break;
      messages.push(accumulated);

      if (!accumulated.tool_calls?.length) {
        const output: string = String(accumulated.content);
        await history.addUserMessage(prompt);
        await history.addAIMessage(output);
        break;
      }

      for (const toolCall of accumulated.tool_calls) {
        yield { type: 'tool_start', tool: toolCall.name };
        const { output, status } = await Agent.useTool(toolCall, sessionTools, sources);
        yield { type: 'tool_end', tool: toolCall.name };
        toolCalls.push({ tool: toolCall.name, input: toolCall.args, output, status });
        messages.push(new ToolMessage({ content: output, tool_call_id: toolCall.id ?? '' }));
      }
    }

    await Promise.all(
      toolCalls.map(
        (toolCallLog: ToolCallLog): Promise<void> =>
          logToolCall(
            sessionId,
            toolCallLog.tool,
            toolCallLog.input,
            toolCallLog.output,
            toolCallLog.status,
          ),
      ),
    );
    yield { type: 'done', toolCalls, sources };
  }

  private static async useTool(
    toolCall: ToolCall,
    sessionTools: StructuredToolInterface[],
    sources: Source[],
  ): Promise<{ output: string; status: ToolCallStatus }> {
    const tool: StructuredToolInterface | undefined = sessionTools.find(
      (candidate: StructuredToolInterface): boolean => candidate.name === toolCall.name,
    );

    if (!tool) {
      return { output: `Tool "${toolCall.name}" niet gevonden`, status: ToolCallStatus.Invalid };
    }

    const schema = (tool.schema ?? {}) as unknown as JsonToolSchema;
    const args: Record<string, unknown> = toolCall.args;
    const missing: string[] = (schema.required ?? []).filter(
      (field: string): boolean => !(field in args) || args[field] == null,
    );
    if (missing.length > 0) {
      return {
        output: `Ontbrekende verplichte velden voor ${toolCall.name}: ${missing.join(', ')}`,
        status: ToolCallStatus.Invalid,
      };
    }

    try {
      const output: string = String(await tool.invoke(args));
      if (toolCall.name === 'search_product_docs') {
        try {
          sources.push(...JSON.parse(output).results);
        } catch {
          /* not JSON, MAYBE IT CRASHES BECAUSE ITS JASON :0 sorry */
        }
      }
      return { output, status: ToolCallStatus.Success };
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : String(error);
      return { output: message, status: ToolCallStatus.Error };
    }
  }

  private getModel(): BaseChatModel {
    if (!this.model) this.model = this.createModel();
    return this.model;
  }
}
