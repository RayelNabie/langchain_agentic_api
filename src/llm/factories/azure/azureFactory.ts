/**
 * @file Builds and validates the Azure OpenAI (LangChain) chat model.
 *
 * @module llm/factories/azure/azureFactory
 * @author RayelNabie
 */

import { AzureChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

interface AzureConfig {
  azureApiKey: string;
  azureInstanceName: string;
  azureDeploymentName: string;
  azureApiVersion: string;
  azureEmbeddingsDeploymentName: string;
}

const azureConfig: AzureConfig = {
  get azureApiKey(): string {
    return process.env.AZURE_OPENAI_API_KEY ?? '';
  },

  get azureInstanceName(): string {
    return process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? '';
  },

  get azureDeploymentName(): string {
    return process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? '';
  },

  get azureApiVersion(): string {
    return process.env.AZURE_OPENAI_API_VERSION ?? '2025-03-01-preview';
  },

  get azureEmbeddingsDeploymentName(): string {
    return process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME ?? '';
  },
};

export const createAzureModel = (): BaseChatModel => {
  const apiKey: string = azureConfig.azureApiKey;
  const instanceName: string = azureConfig.azureInstanceName;
  const deploymentName: string = azureConfig.azureDeploymentName;

  if (!apiKey || !instanceName || !deploymentName) {
    throw new Error(
      '[createAzureModel] Missing Azure OpenAI configuration. Please check your .env file.',
    );
  }

  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIApiInstanceName: instanceName,
    azureOpenAIApiDeploymentName: deploymentName,
    azureOpenAIApiVersion: azureConfig.azureApiVersion,
    temperature: 0.7,
    maxRetries: 3,
    streaming: true,
  });
};
