import { z } from 'zod';
import { ToolDefinition } from '@langchain/core/language_models/base';
import {
    FloTorchEndpoints,
} from '.././constants'

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
    baseUrl: string;
}

interface InvokeParams extends FloTorchParams {
    messages: FloTorchMessage[];
    tools?: FloTorchToolDefinition[];
    response_format?: any;
    extra_body?: Record<string, any>;
    [key: string]: any;
}

export async function chatCompletion(params: InvokeParams) {
    const { 
        model, 
        apiKey, 
        baseUrl,
        messages,
        tools,
        response_format, 
        extra_body,
        ...additionalParams
    } = params;

    const url = baseUrl + FloTorchEndpoints.COMPLETIONS;

    console.log("URL", url)

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

    console.log("FLOTORCH RESPONSE JSON",  JSON.stringify(json, null, 2))

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