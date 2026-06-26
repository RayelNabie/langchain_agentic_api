/**
 * @file Abstraction every LLM provider integration must implement. ChatService
 * only depends on this interface, so swapping providers means writing a
 * new model factory, not touching the facade or controllers.
 *
 * @module llm/LlmAdapter
 * @author RayelNabie
 */

import type { BaseMessage, BaseMessageChunk } from '@langchain/core/messages';
import type { IterableReadableStream } from '@langchain/core/utils/stream';

export interface LlmAdapter {
  chat(prompt: string, sessionId?: string): Promise<BaseMessage>;
  stream(prompt: string, sessionId?: string): Promise<IterableReadableStream<BaseMessageChunk>>;
}
