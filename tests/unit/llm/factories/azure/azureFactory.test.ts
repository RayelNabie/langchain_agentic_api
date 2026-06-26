import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AzureChatOpenAI } from '@langchain/openai';
import { createAzureModel } from '#llm/factories/azure/azureFactory.js';

vi.mock('@langchain/openai', () => ({
  AzureChatOpenAI: vi.fn().mockImplementation(function () {
    return { invoke: vi.fn(), stream: vi.fn() };
  }),
}));

describe('createAzureModel', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZURE_OPENAI_API_KEY = 'fake-key';
    process.env.AZURE_OPENAI_API_INSTANCE_NAME = 'fake-instance';
    process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME = 'fake-deployment';
    process.env.AZURE_OPENAI_API_VERSION = '2025-01-01';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should throw an error if configuration is missing', () => {
    process.env.AZURE_OPENAI_API_KEY = '';

    expect(() => createAzureModel()).toThrow(
      '[createAzureModel] Missing Azure OpenAI configuration',
    );
  });

  it('should construct an AzureChatOpenAI client with the configured values', () => {
    createAzureModel();

    expect(AzureChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        azureOpenAIApiKey: 'fake-key',
        azureOpenAIApiInstanceName: 'fake-instance',
        azureOpenAIApiDeploymentName: 'fake-deployment',
        azureOpenAIApiVersion: '2025-01-01',
      }),
    );
  });
});
