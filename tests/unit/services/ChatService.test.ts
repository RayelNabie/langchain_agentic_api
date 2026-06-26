import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIMessage, AIMessageChunk, type BaseMessage } from '@langchain/core/messages';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import ChatService from '#services/ChatService.js';

const mockAdapter = vi.hoisted(() => ({
  chat: vi.fn(),
  stream: vi.fn(),
}));

vi.mock('#llm/LangChainAdapter.js', () => ({
  default: vi.fn().mockImplementation(function () {
    return mockAdapter;
  }),
}));

describe('ChatService (Facade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates chat() to the active adapter', async () => {
    const mockResponse = new AIMessage({ content: 'Hello from adapter' });
    mockAdapter.chat.mockResolvedValue(mockResponse);

    const result: BaseMessage = await ChatService.chat('Hi', 'session-1');

    expect(mockAdapter.chat).toHaveBeenCalledWith('Hi', 'session-1');
    expect(result.content).toBe('Hello from adapter');
  });

  it('delegates stream() to the active adapter', async () => {
    const mockStream = IterableReadableStream.fromAsyncGenerator(
      (async function* () {
        yield new AIMessageChunk({ content: 'chunk' });
      })(),
    );
    mockAdapter.stream.mockResolvedValue(mockStream);

    const result = await ChatService.stream('Hi', 'session-1');

    expect(mockAdapter.stream).toHaveBeenCalledWith('Hi', 'session-1');
    expect(result).toBe(mockStream);
  });
});
