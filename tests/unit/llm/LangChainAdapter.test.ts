import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  SystemMessage,
  HumanMessage,
  type BaseMessage,
  type BaseMessageChunk,
} from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import LangChainAdapter from '#llm/LangChainAdapter.js';

vi.mock('#data/chatHistory.js', () => ({
  getHistory: vi.fn(),
}));

vi.mock('@langchain/core/runnables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@langchain/core/runnables')>();
  return {
    ...actual,
    RunnableWithMessageHistory: vi.fn().mockImplementation(function () {
      return {
        invoke: vi.fn().mockResolvedValue(
          new AIMessage({
            content: 'Response with history',
            response_metadata: {},
          }),
        ),
        stream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield { content: 'Chunk 1', response_metadata: {} };
          },
        }),
      };
    }),
  };
});

describe('LangChainAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only call the injected model factory once per adapter instance', async () => {
    const createModel = vi.fn().mockReturnValue({ invoke: vi.fn(), stream: vi.fn() } as never);
    const adapter = new LangChainAdapter(createModel);

    await adapter.chat('Hello AI');
    await adapter.chat('Hello again');

    expect(createModel).toHaveBeenCalledTimes(1);
  });

  it('should call invoke and return formatted response (happy flow)', async () => {
    const mockInvoke = vi.fn().mockResolvedValue(
      new AIMessage({
        content: 'AI Response',
        usage_metadata: {
          input_tokens: 5,
          output_tokens: 5,
          total_tokens: 10,
        },
        response_metadata: { model: 'gpt-4' },
      }),
    );
    const createModel = vi.fn().mockReturnValue({ invoke: mockInvoke } as unknown as BaseChatModel);
    const adapter = new LangChainAdapter(createModel);

    const result: BaseMessage = await adapter.chat('Hello AI');

    expect(result.content).toBe('AI Response');
    if (AIMessage.isInstance(result)) {
      expect(result.usage_metadata).toEqual({
        input_tokens: 5,
        output_tokens: 5,
        total_tokens: 10,
      });
    }
    expect(mockInvoke).toHaveBeenCalledWith([
      expect.any(SystemMessage),
      new HumanMessage('Hello AI'),
    ]);

    const messages = mockInvoke.mock.calls[0][0];
    if (Array.isArray(messages) && messages[0] instanceof SystemMessage) {
      const systemMessage = messages[0];
      expect(systemMessage.content).toContain('AI Coach');
      expect(systemMessage.content).toContain('voetbal-app');
    }
  });

  it('should call stream and return an async iterable', async () => {
    const mockStream = vi.fn().mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { content: 'Chunk 1', response_metadata: {} };
        yield { content: 'Chunk 2', response_metadata: {} };
      },
    });
    const createModel = vi.fn().mockReturnValue({ stream: mockStream } as unknown as BaseChatModel);
    const adapter = new LangChainAdapter(createModel);

    const stream: AsyncIterable<BaseMessageChunk> = await adapter.stream('Hello AI');
    const chunks: BaseMessageChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('Chunk 1');
    expect(mockStream).toHaveBeenCalledWith([
      expect.any(SystemMessage),
      new HumanMessage('Hello AI'),
    ]);
  });

  it('should use RunnableWithMessageHistory when sessionId is provided', async () => {
    const createModel = vi.fn().mockReturnValue({} as BaseChatModel);
    const adapter = new LangChainAdapter(createModel);

    const result: BaseMessage = await adapter.chat('Hello AI', 'session-123');

    expect(RunnableWithMessageHistory).toHaveBeenCalled();
    expect(result.content).toBe('Response with history');
  });

  it('should use RunnableWithMessageHistory for streaming when sessionId is provided', async () => {
    const createModel = vi.fn().mockReturnValue({} as BaseChatModel);
    const adapter = new LangChainAdapter(createModel);

    const stream: AsyncIterable<BaseMessageChunk> = await adapter.stream('Hello AI', 'session-123');
    const chunks: BaseMessageChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(RunnableWithMessageHistory).toHaveBeenCalled();
    expect(chunks[0].content).toBe('Chunk 1');
  });
});
