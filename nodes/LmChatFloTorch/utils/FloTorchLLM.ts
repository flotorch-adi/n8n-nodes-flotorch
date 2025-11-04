import {
    invoke,
    Message,
    Tool,
    FloTorchBaseUrl,
} from "./FloTorchUtils"

export class FloTorchLLM {
    model: string;
    private apiKey: string;
    baseUrl: string | undefined;

    constructor(model: string, apiKey: string, baseUrl?: FloTorchBaseUrl) {
        this.model = model;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async invoke(model: string, messages: Message[], tools: Tool[], options?: Record<string, any>): Promise<Message[]> {
        try {
            const params = {
                model: model,
                apiKey: this.apiKey,
                baseUrl: this.baseUrl,
                messages: messages,
                tools: tools,
                ...options
            };
            return invoke(params);
        } catch (err) {
            throw(err);
        }
    }
}