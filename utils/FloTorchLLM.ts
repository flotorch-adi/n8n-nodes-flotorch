import {
    invoke,
    FloTorchMessage,
    FloTorchToolDefinition,
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

            const response = await invoke(params);
            // console.log("FLOTORCHLLM RESPONSE", response)

            const output = await getFloTorchMessages(response);
            // console.log("FLOTORCHLLM OUTPUT", output)

            return output;
        } catch (err) {
            throw(err);
        }
    }
}