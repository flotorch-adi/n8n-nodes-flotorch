import { IExecuteFunctions, NodeOperationError } from "n8n-workflow";

export async function safe<T>(fn: () => Promise<T> | T, message: string, node: IExecuteFunctions): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		throw new NodeOperationError(node.getNode(), message, {
			description: error instanceof Error ? error.message : String(error),
		});
	}
}