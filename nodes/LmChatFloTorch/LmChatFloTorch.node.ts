import {
	ILoadOptionsFunctions,
	ISupplyDataFunctions,
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow'
import { FloTorchLangChainLLM, FloTorchLangChainLLMParams } from '../../flotorch/langchain/llm'
import { FloTorchLlmTracing } from './handler';

export class LmChatFloTorch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch Chat Model',
		name: 'lmChatFloTorch',
		icon: 'file:../../icons/flotorch.svg',
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
		credentials: [
			{
				name: 'flotorchApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'defaultModel',
				type: 'options',
				options: [
					{ name: 'Claude Sonnet 4.5', value: 'flotorch/flotorch-claude-sonnet-4-5' },
					{ name: 'Claude Haiku 4.5', value: 'flotorch/flotorch-claude-haiku-4-5' },
					{ name: 'Amazon Nova Pro', value: 'flotorch/flotorch-aws-nova-pro' },
					{ name: 'Amazon Nova Lite', value: 'flotorch/flotorch-aws-nova-lite' },
					{ name: 'Amazon Nova Micro', value: 'flotorch/flotorch-aws-nova-micro' },
				],
				default: 'flotorch/flotorch-aws-nova-micro',
				displayOptions: {
					show: {
						toggleCustomModel: [false] // Shows when the boolean is true
					}
				},
				description: 'FloTorch model',
				hint: 'Select one of the default FloTorch models'
			},
			{
				displayName: 'Model',
				name: 'customModel',
				type: 'string',
				default: 'flotorch/model',
				displayOptions: {
					show: {
						toggleCustomModel: [true] // Shows when the boolean is true
					}
				},
				description: 'FloTorch model',
				hint: 'Enter the model ID (e.g., flotorch/model)'
			},
			{
				displayName: 'Use Custom Model',
				name: 'toggleCustomModel',
				type: 'boolean',
				default: false, // Initial state of the toggle
				description: 'Use a custom configured FloTorch model',
			},
			{
				displayName: 'Test Model',
				name: 'testmodel',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'flotorch/flotorch-aws-nova-micro' , cachedResultName: 'Amazon Nova Micro'},
				required: true,
				description:
					'The model which will generate the completion. <a href="https:flotorch.ai">Learn more</a>.',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'flotorchModelSearch',
							searchable: true,
						},
					},
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'model',
						value: '={{$parameter.model.value}}',
					},
				},
			},
		],
	}

	methods = {
		listSearch: {
			async flotorchModelSearch(this: ILoadOptionsFunctions) {
				// const results = [];

				// const credentials = await this.getCredentials('flotorchApi');
				// const apiKey = credentials.apiKey as string;
				// const baseUrl = credentials.baseUrl as string;

				// let uri = 'https://api.openai.com/v1/models';

				// if (baseUrl) {
				// 	uri = `${baseUrl}/models`;
				// }

				// const { data } = (await this.helpers.requestWithAuthentication.call(this, 'flotorchApi', {
				// 	method: 'GET',
				// 	uri,
				// 	json: true,
				// })) as { data: Array<{ owned_by: string; id: string }> };

				// for (const model of data) {
				// 	if (!baseUrl && !model.owned_by?.startsWith('system')) continue;
				// 	results.push({
				// 		name: model.id,
				// 		value: model.id,
				// 	});
				// }

				const results = [
					{ name: 'Claude Sonnet 4.5', value: 'flotorch/flotorch-claude-sonnet-4-5' },
					{ name: 'Claude Haiku 4.5', value: 'flotorch/flotorch-claude-haiku-4-5' },
					{ name: 'Amazon Nova Pro', value: 'flotorch/flotorch-aws-nova-pro' },
					{ name: 'Amazon Nova Lite', value: 'flotorch/flotorch-aws-nova-lite' },
					{ name: 'Amazon Nova Micro', value: 'flotorch/flotorch-aws-nova-micro' },
				]

				return { results };
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const useCustomModel = this.getNodeParameter('toggleCustomModel', 0) as boolean;
		const modelName = useCustomModel ? this.getNodeParameter('customModel', 0) as string : this.getNodeParameter('defaultModel', 0) as string;
		const credentials = await this.getCredentials('flotorchApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = credentials.baseUrl as string;

		const fields: FloTorchLangChainLLMParams = {
			model: modelName,
			apiKey: apiKey,
			baseUrl: baseUrl,
			callbacks: [new FloTorchLlmTracing(this)],
		}

		const model = new FloTorchLangChainLLM(fields);

		return {
			response: model
		}
	}
}