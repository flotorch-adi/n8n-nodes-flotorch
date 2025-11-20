import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import {
    BaseChatModel,
    BaseChatModelCallOptions,
    BaseChatModelParams,
    BindToolsInput
} from "@langchain/core/language_models/chat_models";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { ToolDefinition } from "@langchain/core/language_models/base";
import { FloTorchParams } from "../sdk/llm/utils";
import { FloTorchLLM } from "../sdk/llm/llm";
import {
    convertToChatResult,
    convertToFloTorchMessages,
    convertToFloTorchToolDefinitions,
    convertToLangChainMessages,
} from "../langchain/utils"
import { CallbackManager } from "@langchain/core/callbacks/manager";

export interface FloTorchLangChainLLMParams extends FloTorchParams, BaseChatModelParams {
    llm?: FloTorchLLM;
    tools?: ToolDefinition[];
};

export class FloTorchLangChainLLM extends BaseChatModel {
    _model: string;
    private _apiKey: string;
    _baseUrl: string;
    _llm: FloTorchLLM;
    _tools?: ToolDefinition[];

    constructor(fields: FloTorchLangChainLLMParams) {
        super(fields ?? {});
        this._model = fields?.model;
        this._apiKey = fields?.apiKey;
        this._baseUrl = fields?.baseUrl;
        this._llm = fields?.llm || new FloTorchLLM(this._model, this._apiKey, this._baseUrl);
        this._tools = fields?.tools;
    }

    _llmType(): string {
        return "flotorch";
    }

    async _generate(messages: BaseMessage[]): Promise<ChatResult> {
        let handlers: any[] = [];

        if (this.callbacks) {
            if (Array.isArray(this.callbacks)) {
                handlers = this.callbacks;
            } else if (this.callbacks instanceof CallbackManager) {
                handlers = this.callbacks.handlers;
            }

        }

        for (const handler of handlers) {
            // if (handler && 'handleLlmStart' in handler && typeof handler.handleLlmStart === 'function') {
            //     await handler.handleLlmStart(/* ... */);
            // }
            handler.handleLLMStart;
        }

        console.log("INPUT LANGCHAIN MESSAGES", JSON.stringify(messages, null, 2))

        // LangChain to FloTorch
        const inputFloTorchMessages = convertToFloTorchMessages(messages);

        console.log("INPUT FLOTORCH MESSAGES", JSON.stringify(inputFloTorchMessages, null, 2))

        const inputFloTorchToolDefinitions = convertToFloTorchToolDefinitions(this._tools ?? []);

        console.log("INPUT FLOTORCH TOOLS", JSON.stringify(inputFloTorchToolDefinitions, null, 2))

        const outputFloTorchMessages = await this._llm.invoke(inputFloTorchMessages, inputFloTorchToolDefinitions);

        console.log("OUTPUT FLOTORCH MESSAGES", JSON.stringify(outputFloTorchMessages, null, 2))

        // FloTorch to LangChain
        const langchainMessages = convertToLangChainMessages(outputFloTorchMessages)

        console.log("OUTPUT LANGCHAIN MESSAGES", JSON.stringify(langchainMessages, null, 2))

        const result = convertToChatResult(langchainMessages)

        for (const handler of handlers) {
            // if (handler && 'handleLlmStart' in handler && typeof handler.handleLlmStart === 'function') {
            //     await handler.handleLlmStart(/* ... */);
            // }
            handler.handleLLMEnd;
        }

        return result;
    }

    bindTools(tools: BindToolsInput[], kwargs?: Partial<BaseChatModelCallOptions>) {
        return new FloTorchLangChainLLM({
            model: this._model,
            apiKey: this._apiKey,
            baseUrl: this._baseUrl,
            llm: this._llm,
            tools: tools.map((tool) => convertToOpenAITool(tool)),
            ...kwargs
        });
    }
}