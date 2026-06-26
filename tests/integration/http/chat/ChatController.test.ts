import { describe, it, expect, vi, beforeEach } from 'vitest';
import request, { type Response } from 'supertest';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import app from '#app.js';
import ChatService from '#services/ChatService.js';

vi.mock('#services/ChatService.js', () => ({
  default: {
    chat: vi.fn(),
    stream: vi.fn(),
  },
}));

describe('ChatController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /chat', () => {
    it('should return 200 and AI response for a valid prompt (happy flow)', async () => {
      const mockResponse = new AIMessage({
        content: 'Hello, I am an AI!',
        usage_metadata: {
          input_tokens: 10,
          output_tokens: 10,
          total_tokens: 20,
        },
        response_metadata: {
          modelName: 'gpt-4',
        },
      });

      vi.mocked(ChatService.chat).mockResolvedValue(mockResponse);

      const response: Response = await request(app).post('/chat').send({ prompt: 'Hello' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        answer: 'Hello, I am an AI!',
        usage: {
          input_tokens: 10,
          output_tokens: 10,
          total_tokens: 20,
        },
        metadata: {
          modelName: 'gpt-4',
        },
      });
      expect(ChatService.chat).toHaveBeenCalledWith('Hello', undefined);
    });

    it('should return SSE stream if stream is true', async () => {
      const mockStream = IterableReadableStream.fromAsyncGenerator(
        (async function* () {
          yield new AIMessageChunk({ content: 'Chunk 1', response_metadata: {} });
          yield new AIMessageChunk({ content: 'Chunk 2', response_metadata: {} });
        })(),
      );

      vi.mocked(ChatService.stream).mockResolvedValue(mockStream);

      const response: Response = await request(app)
        .post('/chat')
        .send({ prompt: 'Hello', stream: true });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/event-stream');
      expect(response.text).toContain('data: {"content":"Chunk 1","metadata":{}}');
      expect(response.text).toContain('data: {"content":"Chunk 2","metadata":{}}');
      expect(response.text).toContain('event: end');
      expect(ChatService.stream).toHaveBeenCalledWith('Hello', undefined);
    });

    it('should return 400 if prompt is missing (unhappy flow)', async () => {
      const response: Response = await request(app).post('/chat').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'prompt cannot be empty' });
      expect(ChatService.chat).not.toHaveBeenCalled();
    });

    it('should return 500 if AI model throws an error (unhappy flow)', async () => {
      const errorMessage = 'AI Service Unavailable';
      vi.mocked(ChatService.chat).mockRejectedValue(new Error(errorMessage));

      const response: Response = await request(app).post('/chat').send({ prompt: 'Hello' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'AI Error',
        details: errorMessage,
      });
    });
  });
});
