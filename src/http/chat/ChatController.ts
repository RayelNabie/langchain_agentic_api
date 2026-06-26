/**
 * @file HTTP controller for the /chat endpoint. Validates the request and
 *       delegates to ChatService, supporting both a plain JSON response
 *       and a Server-Sent Events stream.
 *
 * @module http/chat/ChatController
 * @author RayelNabie
 */

import { Request, Response } from 'express';
import { AIMessage, type BaseMessage, type BaseMessageChunk } from '@langchain/core/messages';
import ChatService from '#services/ChatService.js';
import type { ChatRequest, ChatResponse } from '#http/chat/types.js';

export class ChatController {
  public static async chat(
    req: Request<Record<string, string>, ChatResponse, ChatRequest>,
    res: Response<ChatResponse>,
  ): Promise<void> {
    try {
      const { prompt, stream, sessionId } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'prompt cannot be empty' });
        return;
      }

      if (stream) {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const streamResponse: AsyncIterable<BaseMessageChunk> = await ChatService.stream(
          prompt,
          sessionId,
        );

        for await (const chunk of streamResponse) {
          const data: string = JSON.stringify({
            content: chunk.content,
            metadata: chunk.response_metadata,
          });
          res.write(`data: ${data}\n\n`);
        }

        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      }

      const result: BaseMessage = await ChatService.chat(prompt, sessionId);

      res.json({
        answer: result.content,
        metadata: result.response_metadata,
        usage: AIMessage.isInstance(result) ? result.usage_metadata : undefined,
      });
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : String(error);

      // If headers are already sent, we can't send a JSON error response
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
        return;
      }

      res.status(500).json({ error: 'AI Error', details: message });
    }
  }
}
