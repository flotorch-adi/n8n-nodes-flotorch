import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMemory } from '@langchain/core/memory';
import { BaseMessage, HumanMessage, AIMessage, trimMessages, ToolCall } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { createAgent } from 'langchain';
import {
	NodeConnectionTypes,
	// nodeNameToToolName,
	NodeOperationError,
} from 'n8n-workflow';
import type {
	EngineRequest,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
} from 'n8n-workflow';
import { flotorchNodeCredentials, flotorchNodeIcon, flotorchNodeRequestDefaults } from '../common/flotorchNodeDescription';
import { flotorchModelList, flotorchModelSearch } from '../common/flotorchModelList';
import { FloTorchLangChainLLM, FloTorchLangChainLLMParams } from '../../flotorch/langchain/llm';

export class FloTorchAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FloTorch Agent',
		name: 'flotorchAgent',
		icon: flotorchNodeIcon,
		group: ['input'],
		version: 1,
		description: 'AI agent provided by FloTorch',
		defaults: {
			name: 'FloTorch Agent',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | EngineRequest> {
		return agentExecute.call(this);
	}
}

export const FloTorchNodeConnectionTypes = {
	...NodeConnectionTypes,
	FloTorchModel: "flotorch_model",
} as const;

export type FloTorchNodeConnectionTypes =
	typeof NodeConnectionTypes | "flotorch_model";

// Simple agent executor for n8n using LangChain v1.0
export async function agentExecute(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][] | EngineRequest> {

	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const model = await getChatModel(this);
	if (!model) {
		throw new NodeOperationError(this.getNode(), 'Please connect a chat model');
	}

	const memory = await getMemory(this);
	const tools = await getTools(this);
	const agent = createAgent({
		model,
		tools,
	});

	let chatHistory: BaseMessage[] | undefined = memory ? await loadChatHistory(memory) : undefined;

	// Process each input item
	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		// Get user input from the node parameter
		const item = items[itemIndex];
		const input_content = item.json['chatInput'] as string;

		if (!input_content) {
			throw new NodeOperationError(this.getNode(), 'chatInput not found', {
				description: 'Input from Chat Trigger not found',
				itemIndex: itemIndex
			});
		}

		const input_messages: BaseMessage[] = chatHistory ? [...chatHistory] : [];
		input_messages.push(new HumanMessage(input_content))

		const result = await agent.invoke({
			messages: input_messages
		});

		// Check if the agent made tool calls
		const lastMessage = result.messages[result.messages.length - 1] as AIMessage;

		if (lastMessage?.tool_calls && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
			// Agent wants to use tools - return EngineRequest
			const actions = lastMessage.tool_calls.map(
				(toolCall: ToolCall<string, Record<string, unknown>>) => ({
					actionType: 'ExecutionNodeAction' as const,
					nodeName: getToolNodeName(toolCall.name, tools),
					input: toolCall.args as IDataObject,
					type: NodeConnectionTypes.AiTool,
					id: toolCall.id ?? crypto.randomUUID(),
					metadata: { itemIndex },
				}),
			);

			return {
				actions,
				metadata: { itemIndex },
			};
		}

		// Agent finished - extract the final message content
		const output = lastMessage.content || '';

		if (memory) {
			await memory.saveContext(
				{ input: input_content },
				{ output },
			);
		}

		returnData.push({
			json: { 
				output,
				model: lastMessage.additional_kwargs.model as string,
				usage: lastMessage.usage_metadata,
			},
			pairedItem: { item: itemIndex },
		});
	}

	return [returnData];
}

// Helper to get chat model from n8n connection
async function getChatModel(ctx: IExecuteFunctions): Promise<BaseChatModel | null> {
	// n8n provides this through the AI connection system
	// const connectedModel = await ctx.getInputConnectionData(
	// 	NodeConnectionTypes.AiLanguageModel,
	// 	0,
	// );
	// return connectedModel as BaseChatModel;

	const model = ctx.getNodeParameter('model.value', 0) as string;
	const credentials = await ctx.getCredentials('flotorchApi');
	const apiKey = credentials.apiKey as string;
	const baseUrl = credentials.baseUrl as string;

	const fields: FloTorchLangChainLLMParams = {
		model: model,
		apiKey: apiKey,
		baseUrl: baseUrl,
	}

	const chatModel = new FloTorchLangChainLLM(fields);

	return chatModel
}

/**
 * Retrieves the memory instance from the input connection if it is connected
 *
 * @param ctx - The execution context
 * @returns The connected memory (if any)
 */
export async function getMemory(
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

// Helper to get tools from n8n connections
async function getTools(ctx: IExecuteFunctions): Promise<StructuredToolInterface[]> {
	const tools: StructuredToolInterface[] = [];
	const connectedTools = await ctx.getInputConnectionData(
		NodeConnectionTypes.AiTool,
		0,
	);

	if (Array.isArray(connectedTools)) {
		tools.push(...connectedTools);
	}

	return tools;
}

// Helper to find tool's source node name
function getToolNodeName(
	toolName: string,
	tools: StructuredToolInterface[],
): string {
	const tool = tools.find((t) => t.name === toolName);
	// Access metadata with type safety
	const metadata = (tool as any)?.metadata;
	return metadata?.sourceNodeName || toolName;
}