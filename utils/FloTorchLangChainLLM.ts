import {
    BaseMessage,
} from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, BaseChatModelCallOptions, BaseChatModelParams, BindToolsInput } from "@langchain/core/language_models/chat_models";
import { formatToOpenAITool } from "@langchain/openai"
import { FloTorchLLM } from "./FloTorchLLM";
import {
    FloTorchBaseUrl,
    FloTorchParams,
    convertToChatResult,
    convertToFloTorchMessages,
    convertToLangChainMessages
} from "./FloTorchUtils";
import { ToolDefinition } from "@langchain/core/language_models/base";

export interface FloTorchLangChainLLMParams extends FloTorchParams, BaseChatModelParams {
    llm?: FloTorchLLM;
    tools?: ToolDefinition[];
};

export class FloTorchLangChainLLM extends BaseChatModel {
    _model: string;
    private _apiKey: string;
    _baseUrl: FloTorchBaseUrl | undefined;
    _llm: FloTorchLLM;
    _tools?: ToolDefinition[];
    
    constructor(fields: FloTorchLangChainLLMParams) {
        super(fields ?? {});
        this._model = fields?.model;
        this._apiKey = fields?.apiKey;
        this._baseUrl = fields?.baseUrl;
        this._llm = fields?.llm || new FloTorchLLM(this._model, this._apiKey);
        this._tools = fields?.tools;
    }

    _llmType(): string {
        return "flotorch";
    }

    async _generate(messages: BaseMessage[]): Promise<ChatResult> {
        // LangChain to FloTorch
        const inputFloTorchMessages = convertToFloTorchMessages(messages);
        const outputFloTorchMessages = await this._llm.invoke(inputFloTorchMessages);

        // FloTorch to LangChain
        const langchainMessages = convertToLangChainMessages(outputFloTorchMessages)
        const result = convertToChatResult(langchainMessages)
        return result;
    }

    bindTools(tools: BindToolsInput[], kwargs?: Partial<BaseChatModelCallOptions>) {        
        return new FloTorchLangChainLLM({
            model: this._model,
            apiKey: this._apiKey,
            baseUrl: this._baseUrl,
            llm: this._llm,
            tools: tools.map((tool) => formatToOpenAITool(tool)),
            ...kwargs
        });
    }
}