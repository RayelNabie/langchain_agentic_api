import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from '@langchain/openai';

export const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env['AZURE_OPENAI_API_KEY'],
  azureOpenAIApiInstanceName: process.env['AZURE_OPENAI_API_INSTANCE_NAME'],
  azureOpenAIApiDeploymentName: process.env['AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME'],
  azureOpenAIApiVersion: process.env['AZURE_OPENAI_API_VERSION'],
});

export function createAzureModel(): BaseChatModel {
  const apiKey: string = process.env['AZURE_OPENAI_API_KEY'] ?? '';
  const instanceName: string = process.env['AZURE_OPENAI_API_INSTANCE_NAME'] ?? '';
  const deploymentName: string = process.env['AZURE_OPENAI_API_DEPLOYMENT_NAME'] ?? '';

  if (!apiKey || !instanceName || !deploymentName) {
    throw new Error('Azure OpenAI configuratie ontbreekt. Controleer je .env bestand.');
  }

  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIApiInstanceName: instanceName,
    azureOpenAIApiDeploymentName: deploymentName,
    azureOpenAIApiVersion: process.env['AZURE_OPENAI_API_VERSION'] ?? '2025-03-01-preview',
    temperature: 0.7,
    maxRetries: 3,
    streaming: true,
  });
}
