import {
	ISupplyDataFunctions,
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow'
import { FloTorchLangChainLLM, FloTorchLangChainLLMParams } from '../../flotorch/langchain/llm'
import { FloTorchLlmTracing } from './handler';
import { flotorchNodeCredentials, flotorchNodeIcon } from '../common/flotorchNodeDescription';
import { flotorchModelProperty } from '../common/flotorchModelProperty';
import { flotorchModelSearch } from '../common/flotorchModelSearch';

export class LmChatFloTorch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch Chat Model',
		name: 'lmChatFloTorch',
		icon: flotorchNodeIcon,
		group: ['transform'],
		version: [1],
		defaultVersion: 1,
		description: 'Language Model FloTorch',
		defaults: {
			name: 'FloTorch Chat Model',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [flotorchNodeCredentials],
		properties: [
			flotorchModelProperty
		],
	}

	methods = {
		listSearch: {
			flotorchModelSearch
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const model = this.getNodeParameter('model.value', 0) as string;
		const credentials = await this.getCredentials('flotorchApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = credentials.baseUrl as string;

		const fields: FloTorchLangChainLLMParams = {
			model: model,
			apiKey: apiKey,
			baseUrl: baseUrl,
			callbacks: [new FloTorchLlmTracing(this)],
		}

		const chatModel = new FloTorchLangChainLLM(fields);

		return {
			response: chatModel
		}
	}
}