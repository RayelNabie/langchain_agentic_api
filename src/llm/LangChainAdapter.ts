/**
 * @file Adapts any LangChain BaseChatModel to the app's LlmAdapter
 *       interface, implementing chat and stream with session history
 *       support via Postgres. Which provider it talks to is determined by
 *       the model factory injected into the constructor.
 *
 * @module llm/LangChainAdapter
 * @author RayelNabie
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  BaseMessage,
  type BaseMessageChunk,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { type RunnableConfig, RunnableWithMessageHistory } from '@langchain/core/runnables';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { getHistory } from '#data/chatHistory.js';
import type { LlmAdapter } from '#llm/types.js';

export default class LangChainAdapter implements LlmAdapter {
  constructor(private readonly createModel: () => BaseChatModel) {}

  private static readonly SYSTEM_PROMPT: string =
    'Je bent de AI Coach van een voetbal-app die spelers helpt bij het tracken en loggen van hun voetbal-drills, vergelijkbaar met de Hevy-app. ' +
    'Je bent een expert in jeugdvoetbal en baseert je advies op de methodiek van jeugdvoetbalcoach.nl. ' +
    'Je doel is om spelers te helpen hun techniek, tactiek en conditie te verbeteren door middel van positie-specifiek advies. ' +
    'Als een speler moeite heeft met een oefening, geef dan directe feedback, praktische tips (zoals standbeen-positie) en stel eventueel een alternatieve basis-oefening voor. ' +
    'Je toon is motiverend, duidelijk en deskundig.';

  private model: BaseChatModel | null = null;

  private getModel(): BaseChatModel {
    if (!this.model) {
      this.model = this.createModel();
    }

    return this.model;
  }

  private getChainWithHistory(): RunnableWithMessageHistory<{ input: string }, BaseMessageChunk> {
    const model: BaseChatModel = this.getModel();

    const prompt: ChatPromptTemplate = ChatPromptTemplate.fromMessages([
      ['system', LangChainAdapter.SYSTEM_PROMPT],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    const chain = prompt.pipe(model);

    return new RunnableWithMessageHistory<{ input: string }, BaseMessageChunk>({
      runnable: chain,
      getMessageHistory: (sessionId: string) => getHistory(sessionId),
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });
  }

  public async chat(prompt: string, sessionId?: string): Promise<BaseMessage> {
    if (!sessionId) {
      // Fallback to simple invocation without history if no sessionId is provided
      const model: BaseChatModel = this.getModel();
      const messages: BaseMessage[] = [
        new SystemMessage(LangChainAdapter.SYSTEM_PROMPT),
        new HumanMessage(prompt),
      ];
      return await model.invoke(messages);
    }

    const chain: RunnableWithMessageHistory<{ input: string }, BaseMessageChunk> =
      this.getChainWithHistory();
    const config: RunnableConfig = { configurable: { sessionId } };

    return await chain.invoke({ input: prompt }, config);
  }

  public async stream(
    prompt: string,
    sessionId?: string,
  ): Promise<IterableReadableStream<BaseMessageChunk>> {
    if (!sessionId) {
      const model: BaseChatModel = this.getModel();
      const messages: BaseMessage[] = [
        new SystemMessage(LangChainAdapter.SYSTEM_PROMPT),
        new HumanMessage(prompt),
      ];
      return model.stream(messages);
    }

    const chain: RunnableWithMessageHistory<{ input: string }, BaseMessageChunk> =
      this.getChainWithHistory();
    const config: RunnableConfig = { configurable: { sessionId } };

    return chain.stream({ input: prompt }, config);
  }
}
