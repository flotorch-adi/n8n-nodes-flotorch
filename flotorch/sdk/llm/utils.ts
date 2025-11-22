import { z } from 'zod';
import {
  FloTorchEndpoints,
} from '../constants'

export const FloTorchChatResponseSuccessSchema = z.object({
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
                arguments: z
                  .union([z.record(z.any(), z.any()), z.string()]) // accept object OR string
                  .transform((arg) => {
                    if (typeof arg === 'string') {
                      try {
                        return JSON.parse(arg); // parse string into object
                      } catch {
                        return {}; // fallback if invalid JSON
                      }
                    }
                    return arg; // already an object
                  }),
              }),
              type: z.string(),
              id: z.string(),
            })
          )
          .optional()
          .default([]),
        annotations: z.array(z.any()).optional(),
      }),
      finish_reason: z.string().optional(),
      index: z.number().optional(),
    })
  ),
  model: z.string(),
  usage: z.object({
    completion_tokens: z.number(),
    prompt_tokens: z.number(),
    total_tokens: z.number(),
  })
});

export const FloTorchChatResponseErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.string(),
    param: z.any().optional(),
  })
});

export type FloTorchChatResponseError = z.infer<typeof FloTorchChatResponseErrorSchema>;

export const FloTorchChatResponseSchema = z.union([FloTorchChatResponseSuccessSchema, FloTorchChatResponseErrorSchema]);

export interface FloTorchMessage {
  role?: string | undefined;
  content?: string | undefined;
  tool_calls?: FloTorchToolCall[];
  tool_call_id?: string | undefined;
  metadata?: {
    model: string,
    usage: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    }
  };
};

export interface FloTorchToolDefinition {
  type: 'function';
  function: {
    name: string;
    parameters: Record<string, unknown>; // JSON Schema 7
    description?: string;
  }
};

export interface FloTorchToolCall {
  type: string,
  function: {
    name: string,
    arguments: Record<string, unknown> | string,
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
  response_format?: object;
  extra_body?: Record<string, unknown>;
  [key: string]: unknown;
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

  // handle empty descripion - Amazon models can't handle it
  if (tools) {
    for (let i = 0; i < tools.length; i++) {
      if (!tools[i].function.description) {
        tools[i].function.description = "none";
      }
    }
  }

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

  return response;
}

export async function getFloTorchMessages(response: Response): Promise<FloTorchMessage[]> {
  const json = await response.json();

  const parsed = FloTorchChatResponseSchema.safeParse(json);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map(issue => {
        const path = issue.path.length ? issue.path.join('.') : '(root)';
        return `• ${path}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Invalid FloTorch response:\n${formatted}`);
  }

  const data = parsed.data;

  const isFloTorchError = (d: unknown): d is FloTorchChatResponseError =>
    FloTorchChatResponseErrorSchema.safeParse(d).success;

  if (isFloTorchError(data)) {
    throw new Error(data.error.message);
  }

  const messages = data.choices.map((choice) => {
    const message: FloTorchMessage = {
      role: choice.message.role,
      content: choice.message.content,
      tool_calls: choice.message.tool_calls,
      metadata: {
        model: data.model,
        usage: data.usage,
      }
    };
    return message;
  })

  return messages;
}