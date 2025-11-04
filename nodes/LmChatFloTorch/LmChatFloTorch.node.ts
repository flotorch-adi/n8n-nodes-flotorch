import { 
    ISupplyDataFunctions,
    NodeConnectionTypes,
    type INodeType,
    type INodeTypeDescription,
    type SupplyData,
} from 'n8n-workflow'
import { FloTorchLangChainLLM } from './utils/FloTorchLangChainLLM'

export class LmChatFloTorch implements INodeType {
    description: INodeTypeDescription = {
		displayName: 'FlTorch Chat Model',

		name: 'lmChatFloTorch',
		icon: 'file:../../icons/flotorch.svg',
		group: ['transform'],
        version: [1],
		defaultVersion: 1,
		description: 'Language Model FloTorch',
		defaults: {
			name: 'FloTorch Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://flotorch.ai',
					},
				],
			},
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
				type: 'string',
				default: '',
				placeholder: 'Your FloTorch model',
				description: 'FloTorch Model',
			},
		],
    }

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const credentials = await this.getCredentials('flotorchApi');
        const apiKey = credentials.apiKey as string;
		const modelName = this.getNodeParameter('model', 0) as string;

        const model = new FloTorchLangChainLLM(modelName, apiKey, );

        return {
            response: model
        }
    }
}