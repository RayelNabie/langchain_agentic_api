/**
 * @file Facade for all chat interactions with the LLM. Delegates everything
 *       to the active LlmAdapter, so callers never depend on a specific
 *       provider.
 *
 * @module services/ChatService
 * @author RayelNabie
 */

import type { BaseMessage, BaseMessageChunk } from '@langchain/core/messages';
import type { IterableReadableStream } from '@langchain/core/utils/stream';
import LangChainAdapter from '#llm/LangChainAdapter.js';
import { createAzureModel } from '#llm/factories/azure/azureFactory.js';
import type { LlmAdapter } from '#llm/types.js';

export default class ChatService {
  private static readonly adapter: LlmAdapter = new LangChainAdapter(createAzureModel);

  public static async chat(prompt: string, sessionId?: string): Promise<BaseMessage> {
    return this.adapter.chat(prompt, sessionId);
  }

  public static async stream(
    prompt: string,
    sessionId?: string,
  ): Promise<IterableReadableStream<BaseMessageChunk>> {
    return this.adapter.stream(prompt, sessionId);
  }
}
