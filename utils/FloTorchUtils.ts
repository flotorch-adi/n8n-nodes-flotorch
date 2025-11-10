import { z } from 'zod';
import {
    HumanMessage,
    AIMessage,
    SystemMessage,
    FunctionMessage,
    ToolMessage,
    BaseMessage,
    AIMessageFields,
    BaseMessageFields,
    FunctionMessageFields,
    ToolMessageFields,
    ToolCall,
} from "@langchain/core/messages";
import { ChatGeneration, ChatResult } from '@langchain/core/outputs';
import { ToolDefinition } from '@langchain/core/language_models/base';

export const FloTorchChatResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string().nullable().transform((val) => (val === null ? undefined : val)), // required but can be null / transform to undefined if null
        tool_calls: z
          .array(
            z.object({
              function: z.object({
                name: z.string(),
                arguments: z.record(z.any(), z.any()),
              }),
              type: z.string(),
              id: z.string(),
            })
            // .transform((obj) => { // transform into ToolCall format
            //     const tool_call = {
            //         id: obj.id,
            //         name: obj.function.name,
            //         args: obj.function.arguments,
            //     }
            //     return tool_call;
            // })
          )
          .optional()
          .default([]),
        annotations: z.array(z.any()).optional(),
      }),
      finish_reason: z.string().optional(),
      index: z.number().optional(),
    })
  ),
});


export const enum FloTorchBaseUrl {
    AWS = 'https://gateway.flotorch.cloud',
    AZURE = 'https://gateway-azure.flotorch.cloud',
    GCP = 'https://gateway-gcp.flotorch.cloud',
    DEFAULT = FloTorchBaseUrl.AWS,
};

export const enum FloTorchEndpoints {
    COMPLETIONS = '/api/openai/v1/chat/completions',
    SESSIONS = '/v1/sessions',
};

export const BASE_URL = FloTorchBaseUrl.DEFAULT;

export const LLM_ENDPOINT = FloTorchEndpoints.COMPLETIONS;

export interface FloTorchMessage {
    role?: string | undefined;
    content?: string | undefined;
    tool_calls?: FloTorchToolCall[];
    tool_call_id?: string | undefined;
};

export interface FloTorchToolDefinition extends ToolDefinition {};

export interface FloTorchToolCall {
    type: string,
    function: {
      name: string,
      arguments: Record<string, any> | string,
    },
    id: string,
}

export interface FloTorchParams {
    model: string;
    apiKey: string;
    baseUrl?: FloTorchBaseUrl;
}

interface InvokeParams extends FloTorchParams {
    messages: FloTorchMessage[];
    tools?: FloTorchToolDefinition[];
    response_format?: any;
    extra_body?: Record<string, any>;
    [key: string]: any;
}

export async function invoke(params: InvokeParams) {
    const { 
        model, 
        apiKey, 
        baseUrl = BASE_URL,
        messages,
        tools,
        response_format, 
        extra_body,
        ...additionalParams
    } = params;

    const url = baseUrl + LLM_ENDPOINT;

    const body = {
        model: model,
        messages: messages,
        ...(tools && { tools }),
        ...(response_format && { response_format }),
        ...(extra_body && { extra_body }),
        ...additionalParams,
    };

    console.log("FLOTORCH REQUEST BODY", JSON.stringify(body, null, 2))

    const payload = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }

    const response = await fetch(url, payload);

    // console.log("RESPONSE", response)

    return response;
}

export async function getFloTorchMessages(response: Response): Promise<FloTorchMessage[]> {
    const json = await response.json();

    console.log("RESPONSE JSON",  JSON.stringify(json, null, 2))

    const data = FloTorchChatResponseSchema.parse(json);

    console.log("EXTRACTED ZOD DATA",  JSON.stringify(data, null, 2))

    const messages = data.choices.map((choice) => {
        const message: FloTorchMessage = {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls,
        };
        return message;
    })
    
    return messages;
}

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

        switch(messageType) {
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

        switch(msg.role) {
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
        return generation
    });
    const result: ChatResult = {
        generations: generations
    };
    return result
}

export function convertToFloTorchToolCalls(tool_calls: ToolCall[]): FloTorchToolCall[] {
    const formattedToolCalls: FloTorchToolCall[] = tool_calls.map((tool_call)=>{
        const formattedToolCall: FloTorchToolCall = {
            type: 'function',
            function: {
                name: tool_call.name,
                arguments: JSON.stringify(tool_call.args),
            },
            id: tool_call.id || "",
        }

        return formattedToolCall
    });
    return formattedToolCalls
}

export function convertToLangChainToolCalls(tool_calls: FloTorchToolCall[]): ToolCall[] {
    const formattedToolCalls: ToolCall[] = tool_calls.map((tool_call)=>{
        const formattedToolCall: ToolCall = {
            name: tool_call.function.name,
            args: typeof tool_call.function.arguments === 'string' ? JSON.parse(tool_call.function.arguments) : tool_call.function.arguments,
            id: tool_call.id,
        }

        return formattedToolCall
    });
    return formattedToolCalls
}