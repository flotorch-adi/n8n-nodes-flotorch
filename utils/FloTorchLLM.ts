import {
    invoke,
    FloTorchMessage,
    Tool,
    FloTorchBaseUrl,
    getFloTorchMessages,
} from "./FloTorchUtils";

export class FloTorchLLM {
    _model: string;
    private _apiKey: string;
    _baseUrl: FloTorchBaseUrl | undefined = FloTorchBaseUrl.DEFAULT;

    constructor(model: string, apiKey: string, baseUrl?: FloTorchBaseUrl) {
        this._model = model;
        this._apiKey = apiKey;
        this._baseUrl = baseUrl;
    }

    async invoke(messages: FloTorchMessage[], tools?: Tool[], options?: Record<string, any>): Promise<FloTorchMessage[]> {
        try {
            const params = {
                model: this._model,
                apiKey: this._apiKey,
                baseUrl: this._baseUrl,
                messages: messages,
                tools: tools,
                ...options
            };
            const response = await invoke(params);
            const output = getFloTorchMessages(response);
            return output;
        } catch (err) {
            throw(err);
        }
    }
}