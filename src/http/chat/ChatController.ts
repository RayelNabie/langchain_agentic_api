import { Request, Response } from 'express';
import Agent from '#llm/Agent.js';
import { createAzureModel } from '#llm/azure.js';
import type { ChatRequest, ChatResponse } from '#http/chat/types.js';

const agent = new Agent(createAzureModel);

export async function handleChat(
  req: Request<Record<string, string>, ChatResponse, ChatRequest>,
  res: Response<ChatResponse>,
): Promise<void> {
  try {
    const { prompt, sessionId, boardId, listId, settings } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'prompt cannot be empty' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of agent.streamEvents(prompt, sessionId, boardId, listId, settings)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('event: end\ndata: [DONE]\n\n');
    res.end();
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);

    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
      return;
    }

    res.status(500).json({ error: 'AI Error', details: message });
  }
}
