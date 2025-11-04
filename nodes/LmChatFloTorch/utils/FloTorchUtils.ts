import { z } from 'zod'

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
};

export const enum FloTorchEndpoints {
    COMPLETIONS = '/api/openai/v1/chat/completions',
    SESSIONS = '/v1/sessions',
}

export const BASE_URL = FloTorchBaseUrl.AWS;

export const LLM_ENDPOINT = FloTorchEndpoints.COMPLETIONS;

export type Message = {
    role: string;
    content: string;
};

export type Tool = {

};

interface InvokeParams {
    model: string;
    apiKey: string;
    baseUrl?: string;
    messages: Message[];
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

    const response = await fetch(url, payload);

    const json = await response.json();
    const data = FloTorchChatResponseSchema.parse(json);

    const role = data.choices[0].message.role;
    const content = data.choices[0].message.content;

    const message: Message = {
        role: role,
        content: content
    };
    const output: Message[] = [message];

    return output;
}