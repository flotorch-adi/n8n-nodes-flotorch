import { 
    ISupplyDataFunctions,
    NodeConnectionTypes,
    type INodeType,
    type INodeTypeDescription,
    type SupplyData,
} from 'n8n-workflow'
import { FloTorchLangChainLLM, FloTorchLangChainLLMParams } from '../../flotorch/langchain/llm'

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
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Claude Sonnet 4.5', value: 'flotorch/flotorch-claude-sonnet-4-5' },
					{ name: 'Claude Haiku 4.5', value: 'flotorch/flotorch-claude-haiku-4-5' },
					{ name: 'Amazon Nova Pro', value: 'flotorch/flotorch-aws-nova-pro' },
					{ name: 'Amazon Nova Lite', value: 'flotorch/flotorch-aws-nova-lite' },
					{ name: 'Amazon Nova Micro', value: 'flotorch/flotorch-aws-nova-micro' },
				],
				default: 'flotorch/flotorch-aws-nova-micro',
				description: 'FloTorch Model',
				hint: 'Select one of the options or enter a custom model ID like so: {{ flotorch/modelId }}.'
			},
		],
    }

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const modelName = this.getNodeParameter('model', 0) as string;
        const credentials = await this.getCredentials('flotorchApi');
        const apiKey = credentials.apiKey as string;
		const baseUrl = credentials.baseUrl as string;

		const fields: FloTorchLangChainLLMParams = {
			model: modelName,
			apiKey: apiKey,
			baseUrl: baseUrl,
		}

        const model = new FloTorchLangChainLLM(fields);

        return {
            response: model
        }
    }
}