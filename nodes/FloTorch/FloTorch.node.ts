import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class FloTorch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch',
		name: 'example',
		icon: { light: 'file:../../icons/flotorch.svg', dark: 'file:../../icons/flotorch.svg' },
		group: ['input'],
		version: 1,
		description: 'Use this node to chat with AI models. It expects a chatInput field in your json output. Send your question in the chatInput field.',
		defaults: {
			name: 'FloTorch',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'flotorchApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL:
				'={{ $credentials.url?.split("/").slice(0,-1).join("/") ?? "https://gateway.flotorch.cloud" }}',
		},
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
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let model: string = "";
		try {
			model = this.getNodeParameter('model', 0) as string;
		} catch (error) {
			throw new NodeOperationError(this.getNode(), 'Failed to retrieve "model" parameter.', {
				description: error instanceof Error ? error.message : String(error),
			});
		}

		const credentials = await this.getCredentials('flotorchApi');
		const baseUrl = credentials.url;
		const url = baseUrl + "/openai/v1/chat/completions";

		let output: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const item = items[itemIndex];
				const input_role = 'user';
				const input_content = item.json['chatInput'] ?? 'chatInput not found';

				let options: IHttpRequestOptions = {
					url: url,
					method: 'POST',
					body: {
						model: model,
						messages: [
							{
								role: input_role,
								content: input_content
							}
						]
					},
					json: true
				}

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'flotorchApi', options);

				const output_role = response.choices[0].message.role;
				const output_content = response.choices[0].message.content;

				output.push({
					json: {
						role: output_role,
						content: output_content,
						output: output_content // this field is what Chat Trigger looks for
					}
				});
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Failed to process input item.', {
					description: error instanceof Error ? error.message : String(error),
					itemIndex: itemIndex
				});
			}
		}

		return [output];
	}
}
