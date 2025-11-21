import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import type { ISupplyDataFunctions } from "n8n-workflow";
import { NodeConnectionTypes, NodeOperationError } from "n8n-workflow";
import type { Serialized } from "@langchain/core/load/serializable";

export class FloTorchLlmTracing extends BaseCallbackHandler {
    name = "MinimalLlmTracing";
    awaitHandlers = true;

    connectionType = NodeConnectionTypes.AiLanguageModel;

    constructor(private executionFunctions: ISupplyDataFunctions) {
        super();
    }

    async handleLLMStart(
        llm: Serialized,
        prompts: string[],
        runId: string,
    ) {
        this.executionFunctions.addInputData(
            this.connectionType,
            [[{ json: { prompts } }]],
        );
    }

    async handleLLMEnd(
        output: LLMResult,
        runId: string,
    ) {
        this.executionFunctions.addOutputData(
            this.connectionType,
            0,
            [[{ json: { output } }]],
        );
    }

    async handleLLMError(
        error: any,
        runId: string,
    ) {
        this.executionFunctions.addOutputData(
            this.connectionType,
            0,
            new NodeOperationError(
                this.executionFunctions.getNode(),
                error?.message ?? error,
            ),
        );
    }
}
