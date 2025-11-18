import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { BaseMessage, trimMessages } from '@langchain/core/messages';
import { BaseMemory } from '@langchain/core/memory';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { convertToFloTorchMessages } from '../../flotorch/langchain/utils';
import { FloTorchMessage } from '../../flotorch/sdk/llm/utils';

export class FloTorch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch',
		name: 'flotorch',
		icon: { light: 'file:../../icons/flotorch.svg', dark: 'file:../../icons/flotorch.svg' },
		group: ['input'],
		version: 1,
		description: 'Language models provided by FloTorch',
		defaults: {
			name: 'FloTorch',
		},
		inputs: [
			NodeConnectionTypes.Main,
			{
				type: NodeConnectionTypes.AiMemory,
				displayName: 'Memory',
				maxConnections: 1,
			},
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Tools',
			}
		],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'flotorchApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL:
				'={{ $credentials.baseUrl?.split("/").slice(0,-1).join("/") ?? "https://gateway.flotorch.cloud" }}',
		},
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const useCustomModel = this.getNodeParameter('toggleCustomModel', 0) as boolean;
		const model = useCustomModel ? this.getNodeParameter('customModel', 0) as string : this.getNodeParameter('defaultModel', 0) as string;

		const credentials = await this.getCredentials('flotorchApi');
		const baseUrl = credentials.baseUrl;
		const url = baseUrl + "/openai/v1/chat/completions";

		let output: INodeExecutionData[] = [];

		const memory = await getOptionalMemory(this);

		console.log('MEMORY', memory);

		let chatHistory: BaseMessage[] | undefined = undefined;
		if (memory) {
			chatHistory = await loadChatHistory(memory);
		}

		console.log('CHAT HISTORY', chatHistory)

		let reformattedChatHistory: FloTorchMessage[] | undefined = undefined;

		if (chatHistory) {
			reformattedChatHistory = convertToFloTorchMessages(chatHistory);
		}


		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const item = items[itemIndex];
				const input_role = 'user';
				const input_content = item.json['chatInput'] ?? 'chatInput not found';

				let input_messages: any[] = [];

				if (reformattedChatHistory) {
					input_messages = reformattedChatHistory.map((msg) => {
						return {
							role: msg.role,
							content: msg.content,
						}
					})
				}

				input_messages.push({
					role: input_role,
					content: input_content,
				});

				console.log("INPUT MESSAGES", input_messages)

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

				const output_role = response.choices[0].message.role;
				const output_content = response.choices[0].message.content;

				const output_usage = response.usage;
				const output_model = response.model;

				output.push({
					json: {
						// role: output_role,
						// content: output_content,
						output: output_content, // this field is what Chat Trigger looks for
						model: output_model,
						usage: output_usage,
					}
				});

				if (memory) {
					await memory.saveContext({ input: input_content }, { output: { role: output_role, content: output_content } });
				}

				console.log('MEMORY 2', memory)
			} catch (error) {
				console.log(error)

				throw new NodeOperationError(this.getNode(), 'Failed to process input item.', {
					description: error instanceof Error ? error.message : String(error),
					itemIndex: itemIndex
				});
			}
		}

		return [output];
	}
}

/**
 * Retrieves the memory instance from the input connection if it is connected
 *
 * @param ctx - The execution context
 * @returns The connected memory (if any)
 */
export async function getOptionalMemory(
	ctx: IExecuteFunctions | ISupplyDataFunctions,
): Promise<BaseMemory | undefined> {
	return (await ctx.getInputConnectionData(NodeConnectionTypes.AiMemory, 0)) as
		| BaseMemory
		| undefined;
}

async function loadChatHistory(
	memory: BaseMemory,
	model?: BaseChatModel,
	maxTokensFromMemory?: number,
): Promise<BaseMessage[]> {
	const memoryVariables = await memory.loadMemoryVariables({});
	let chatHistory = memoryVariables['chat_history'] as BaseMessage[];

	if (maxTokensFromMemory && model) {
		chatHistory = await trimMessages(chatHistory, {
			strategy: 'last',
			maxTokens: maxTokensFromMemory,
			tokenCounter: model,
			includeSystem: true,
			startOn: 'human',
			allowPartial: true,
		});
	}

	return chatHistory;
}

