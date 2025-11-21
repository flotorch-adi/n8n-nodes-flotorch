import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { flotorchModelList, flotorchModelSearch } from '../common/flotorchModelList';
import { flotorchNodeCredentials, flotorchNodeIcon, flotorchNodeRequestDefaults } from '../common/flotorchNodeDescription';

export class FloTorchLlm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch LLM',
		name: 'flotorchLlm',
		icon: flotorchNodeIcon,
		group: ['input'],
		version: 1,
		description: 'Language models provided by FloTorch',
		defaults: {
			name: 'FloTorch LLM',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [flotorchNodeCredentials],
		requestDefaults: flotorchNodeRequestDefaults,
		properties: [
			flotorchModelList
		],
	};

	methods = {
		listSearch: {
			flotorchModelSearch
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const model = this.getNodeParameter('model.value', 0) as string;
		const credentials = await this.getCredentials('flotorchApi');
		const baseUrl = credentials.baseUrl;
		const url = baseUrl + "/openai/v1/chat/completions";
		const workspaceId = credentials.workspaceId;

		const output: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const item = items[itemIndex];
				const input_role = 'user';
				const input_content = item.json['chatInput'];

				if (!input_content) {
					throw new NodeOperationError(this.getNode(), 'chatInput not found', {
						description: 'Input from Chat Trigger not found',
						itemIndex: itemIndex
					});
				}

				const input_messages = [];

				input_messages.push({
					role: input_role,
					content: input_content,
				});

				let options: IHttpRequestOptions = {
					url: url,
					method: 'POST',
					body: {
						model: model,
						messages: input_messages,
					},
					json: true
				}

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'flotorchApi', options);

				const output_content = response.choices[0].message.content;
				const output_usage = response.usage;
				const output_model = response.model;
				const requestUid = response.metadata.requestUid;
				const consoleLogLink = `https://console.flotorch.cloud/workspaces/${workspaceId}/logs?requestId=${requestUid}`;
				const html = `<a href="${consoleLogLink}" target="_blank">Open FloTorch logs</a>`;

				// if (workspaceId) {
				// 	const result = this.helpers.constructExecutionMetaData(
				// 		this.helpers.returnJsonArray({ html }),
				// 		{
				// 			itemData: { item: itemIndex },
				// 		},
				// 	);

				// 	output.push(...result);
				// } else {
				// 	const binaryData = await this.helpers.prepareBinaryData(
				// 		Buffer.from(html, 'utf-8'),
				// 		'output.html',
				// 		'text/html'
				// 	);

				// 	output.push({
				// 		json: {
				// 			output: output_content, // this field is what the chat inferface looks for
				// 			model: output_model,
				// 			usage: output_usage,
				// 			requestID: requestUid,
				// 			trace: consoleLogLink,
				// 			html: workspaceId ? html : 'Please fill workspace ID in FloTorch credentials'
				// 		},
				// 		binary: {
				// 			data: binaryData,
				// 		}
				// 	});
				// }

				const binaryData = await this.helpers.prepareBinaryData(
					Buffer.from(html, 'utf-8'),
					'output.html',
					'text/html'
				);

				output.push({
					json: {
						output: output_content, // this field is what the chat inferface looks for
						model: output_model,
						usage: output_usage,
						requestID: requestUid,
						trace: consoleLogLink,
						html: workspaceId ? html : 'Please fill workspace ID in FloTorch credentials'
					},
					binary: {
						data: binaryData,
					},
					html: html
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