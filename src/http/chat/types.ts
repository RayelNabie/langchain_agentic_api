/**
 * @file Body shape for the /chat endpoint.
 *
 * @module http/chat/types
 * @author RayelNabie
 */

import type { BaseMessage, ResponseMetadata, UsageMetadata } from '@langchain/core/messages';

export type ChatResponse =
  | {
      answer: BaseMessage['content'];
      metadata: ResponseMetadata;
      usage?: UsageMetadata;
    }
  | { error: string; details?: string };

export interface ChatRequest {
  prompt?: string;
  stream?: boolean;
  sessionId?: string;
}
