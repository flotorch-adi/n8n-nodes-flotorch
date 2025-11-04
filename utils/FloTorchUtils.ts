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
    FunctionMessageFieldsWithName,
    ToolMessageFieldsWithToolCallId,
} from "@langchain/core/messages";
import { ChatGeneration, ChatResult } from '@langchain/core/outputs';

const FloTorchChatResponseSchema = z.object({
    choices: z.array(
        z.object({
            message: z.object({
                role: z.string(),
                content: z.string(),
            }),
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

export type FloTorchMessage = {
    role: string;
    content: string;
};

export type Tool = {

};

export interface FloTorchParams {
    model: string;
    apiKey: string;
    baseUrl?: FloTorchBaseUrl;
}

interface InvokeParams extends FloTorchParams {
    messages: FloTorchMessage[];
    tools?: Tool[];
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

    const payload = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }

    return fetch(url, payload);
}

export async function getFloTorchMessages(response: Response): Promise<FloTorchMessage[]> {
    const json = await response.json();
    const data = FloTorchChatResponseSchema.parse(json);

    const messages = data.choices.map((choice) => {
        const message: FloTorchMessage = {
            role: choice.message.role,
            content: choice.message.content,
        };
        return message;
    })

    return messages;
}

export function convertToFloTorchMessages(messages: BaseMessage[]): FloTorchMessage[] {
    return messages.map(msg => {
        let role: string;
        
        if (msg instanceof HumanMessage) {
            role = "user";
        } else if (msg instanceof AIMessage) {
            role = "assistant";
        } else if (msg instanceof SystemMessage) {
            role = "system";
        } else if (msg instanceof FunctionMessage) {
            role = "function";
        } else if (msg instanceof ToolMessage) {
            role = "tool";
        } else {
            role = msg._getType();
        }
        
        return {
            role: role,
            content: typeof msg.content === "string" 
                ? msg.content 
                : JSON.stringify(msg.content)
        };
    });
}

export function convertToLangChainMessages(messages: FloTorchMessage[]): BaseMessage[] {
    return messages.map(msg => {
        const content = msg.content;
        let output: BaseMessage;
        
        if (msg.role == "user") {
            const fields: BaseMessageFields = {
                content: content,
            };
            output = new HumanMessage(fields);
        } else if (msg.role == "assistant") {
            const fields: AIMessageFields = {
                content: content,
            };
            output = new AIMessage(fields);
        } else if (msg.role == "system") {
            const fields: BaseMessageFields = {
                content: content,
            };
            output = new SystemMessage(fields);
        } else if (msg.role == "function") {
            const fields: FunctionMessageFieldsWithName = {
                content: content,
                name: 'function name'
            };
            output = new FunctionMessage(fields);
        } else if (msg.role == "tool") {
            const fields: ToolMessageFieldsWithToolCallId = {
                content: content,
                tool_call_id: "tool call id"
            };
            output = new ToolMessage(fields);
        } else {;
            const fields: BaseMessageFields = {
                content: content,
            };
            output = new AIMessage(fields);
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