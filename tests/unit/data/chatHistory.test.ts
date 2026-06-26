import { describe, it, expect, vi } from 'vitest';
import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { getHistory } from '#data/chatHistory.js';

vi.mock('@langchain/community/stores/message/postgres', () => ({
  PostgresChatMessageHistory: vi.fn().mockImplementation(function () {
    return {
      getMessages: vi.fn().mockResolvedValue([]),
      addMessage: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock('#data/config.js', () => ({
  databaseConfig: { url: 'postgresql://fake' },
}));

describe('getHistory', () => {
  it('builds a PostgresChatMessageHistory scoped to the given session', async () => {
    await getHistory('session-123');

    expect(PostgresChatMessageHistory).toHaveBeenCalledWith({
      poolConfig: { connectionString: 'postgresql://fake' },
      tableName: 'chat_history',
      sessionId: 'session-123',
    });
  });
});
