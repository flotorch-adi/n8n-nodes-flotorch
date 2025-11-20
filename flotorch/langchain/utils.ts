import {
    AIMessage,
    BaseMessage,
    ToolCall,
    ToolMessage,
    SystemMessage,
    HumanMessage,
    AIMessageFields,
    BaseMessageFields,
    FunctionMessage,
    FunctionMessageFields,
    ToolMessageFields
} from "@langchain/core/messages";
import { ChatGeneration, ChatResult } from "@langchain/core/outputs";
import { FloTorchMessage, FloTorchToolCall, FloTorchToolDefinition } from "../sdk/llm/utils";
import { ToolDefinition } from "@langchain/core/language_models/base";


export function convertToFloTorchMessages(messages: BaseMessage[]): FloTorchMessage[] {
    console.log('INPUT MESSAGES:', messages.map(m => ({
        type: m.constructor.name,
        _getType: m._getType(),
        content: m.content,
        tool_calls: m._getType() == 'ai' ? (m as AIMessage).tool_calls : undefined
    })));

    return messages.map(msg => {
        let role: string;
        let tool_calls: FloTorchToolCall[] | undefined;
        let tool_call_id: string | undefined;

        const messageType = msg._getType()

        switch (messageType) {
            case 'system': {
                role = 'system';
                break;
            } case 'human': {
                role = 'user';
                break;
            } case 'ai': {
                role = 'assistant';
                tool_calls = convertToFloTorchToolCalls((msg as AIMessage).tool_calls || []);
                break;
            } case 'tool': {
                role = 'tool';
                tool_call_id = (msg as ToolMessage).tool_call_id;
                break;
            } case 'function': {
                role = 'function';
                break;
            } default: {
                role = 'user';
                break;
            }
        }

        const message: FloTorchMessage = {
            role: role,
            content: typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
            tool_calls: tool_calls,
            tool_call_id: tool_call_id,
        };

        return message;
    });
}

export function convertToLangChainMessages(messages: FloTorchMessage[]): BaseMessage[] {
    return messages.map(msg => {
        const content = msg.content;
        let output: BaseMessage = new AIMessage({ content: content });

        switch (msg.role) {
            case 'system': {
                const fields: BaseMessageFields = {
                    content: content,
                };
                output = new SystemMessage(fields);
                break;
            } case 'user': {
                const fields: BaseMessageFields = {
                    content: content,
                };
                output = new HumanMessage(fields);
                break;
            } case 'assistant': {
                const fields: AIMessageFields = {
                    content: content,
                    tool_calls: convertToLangChainToolCalls(msg.tool_calls || []),
                };
                output = new AIMessage(fields);
                break;
            } case 'tool': {
                const fields: ToolMessageFields = {
                    content: content,
                    tool_call_id: msg.tool_call_id || "",
                };
                output = new ToolMessage(fields);
                break;
            } case 'function': {
                const fields: FunctionMessageFields = {
                    content: content,
                    name: 'function name',
                };
                output = new FunctionMessage(fields);
                break;
            } default: {
                const fields: BaseMessageFields = {
                    content: content,
                };
                output = new AIMessage(fields);
                break;
            }
        }

        return output;
    });
}

export function convertToChatResult(messages: BaseMessage[]): ChatResult {
    const generations: ChatGeneration[] = messages.map(msg => {
        const generation: ChatGeneration = {
            text: '',
            message: msg
        }
        return generation;
    });
    const result: ChatResult = {
        generations: generations
    };
    return result;
}

export function convertToFloTorchToolCalls(tool_calls: ToolCall[]): FloTorchToolCall[] {
    const formattedToolCalls: FloTorchToolCall[] = tool_calls.map((tool_call) => {
        const formattedToolCall: FloTorchToolCall = {
            type: 'function',
            function: {
                name: tool_call.name,
                arguments: JSON.stringify(tool_call.args),
            },
            id: tool_call.id || "",
        }

        return formattedToolCall;
    });
    return formattedToolCalls;
}

export function convertToLangChainToolCalls(tool_calls: FloTorchToolCall[]): ToolCall[] {
    const formattedToolCalls: ToolCall[] = tool_calls.map((tool_call) => {
        const formattedToolCall: ToolCall = {
            name: tool_call.function.name,
            args: typeof tool_call.function.arguments === 'string' ? JSON.parse(tool_call.function.arguments) : tool_call.function.arguments,
            id: tool_call.id,
        }
        return formattedToolCall;
    });
    return formattedToolCalls;
}

export function convertToFloTorchToolDefinitions(tool_definitions: ToolDefinition[]): FloTorchToolDefinition[] {
    const formattedToolDefinitions: FloTorchToolDefinition[] = tool_definitions.map((tool_definition) => {
        const formattedToolDefinition: FloTorchToolDefinition = {
            type: 'function',
            function: {
                name: tool_definition.function.name,
                parameters: tool_definition.function.parameters,
                description: tool_definition.function.description,
            }
        }
        return formattedToolDefinition;
    })

    return formattedToolDefinitions;
}