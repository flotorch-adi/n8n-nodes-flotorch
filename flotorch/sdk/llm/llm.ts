import {
    chatCompletion,
    FloTorchMessage,
    FloTorchToolDefinition,
    getFloTorchMessages,
} from "./utils";

export class FloTorchLLM {
    _model: string;
    private _apiKey: string;
    _baseUrl: string;

    constructor(model: string, apiKey: string, baseUrl: string) {
        this._model = model;
        this._apiKey = apiKey;
        this._baseUrl = baseUrl;
    }

    async invoke(messages: FloTorchMessage[], tools?: FloTorchToolDefinition[], options?: Record<string, any>): Promise<FloTorchMessage[]> {
        try {
            const params = {
                model: this._model,
                apiKey: this._apiKey,
                baseUrl: this._baseUrl,
                messages: messages,
                tools: tools,
                ...options
            };
            const response = await chatCompletion(params);
            const output = await getFloTorchMessages(response);
            return output;
        } catch (err) {
            throw(err);
        }
    }
}