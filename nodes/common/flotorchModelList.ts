import type { INodeProperties } from 'n8n-workflow';
import type { ILoadOptionsFunctions } from 'n8n-workflow';

/**
 * Shared n8n resource locator for selecting FloTorch models.
 * 
 * Usage:
 * 
 *    properties: [
 *        flotorchModelList
 *    ],
 *
 * Used by all FloTorch nodes. Updates here propagate everywhere.
 * The search method `flotorchModelSearch` must exist in the node's
 * `methods.listSearch` section.
 */
export const flotorchModelList: INodeProperties = {
    displayName: 'Model',
    name: 'model',
    type: 'resourceLocator',
    default: { mode: 'list', value: 'flotorch/flotorch-aws-nova-micro', cachedResultName: 'Amazon Nova Micro' },
    required: true,
    description:
        'The model which will generate the completion. <a href="https:flotorch.ai">Learn more</a>.',
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'flotorchModelSearch',
                searchable: true,
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
    routing: {
        send: {
            type: 'body',
            property: 'model',
            value: '={{$parameter.model.value}}',
        },
    },
}

export const floTorchDefaultModels = [
    { name: 'Claude Sonnet 4.5', value: 'flotorch/flotorch-claude-sonnet-4-5' },
    { name: 'Claude Haiku 4.5', value: 'flotorch/flotorch-claude-haiku-4-5' },
    { name: 'Amazon Nova Pro', value: 'flotorch/flotorch-aws-nova-pro' },
    { name: 'Amazon Nova Lite', value: 'flotorch/flotorch-aws-nova-lite' },
    { name: 'Amazon Nova Micro', value: 'flotorch/flotorch-aws-nova-micro' },
];

/**
 * Dynamic model search function for FloTorch model selector fields.
 *
 * This method is used by n8n when a user opens a `resourceLocator`
 * with `searchListMethod: 'flotorchModelSearch'`.
 *
 * It returns a list of available FloTorch model options to populate the
 * "From List" dropdown in the UI.
 * 
 * Usage:
 *
 *    methods: {
 *        listSearch: { flotorchModelSearch }
 *    }
 *
 * Notes for developers:
 * - This function runs at design time (in the editor UI), not at workflow execution time.
 * - You may later replace the static list with a live API call to FloTorch.
 * - Returned items must follow: { name: string; value: string }
 * - If modifying the model list, also update the default value in `flotorchModelList`.
 *
 * @param this - n8n load options context (ILoadOptionsFunctions)
 * @returns Available FloTorch models as list of objects with name and ID
 */
export async function flotorchModelSearch(
    this: ILoadOptionsFunctions,
): Promise<{ results: { name: string; value: string }[] }> {
    // const results = [];

    // const credentials = await this.getCredentials('flotorchApi');
    // const apiKey = credentials.apiKey as string;
    // const baseUrl = credentials.baseUrl as string;

    // let uri = 'https://api.openai.com/v1/models';

    // if (baseUrl) {
    // 	uri = `${baseUrl}/models`;
    // }

    // const { data } = (await this.helpers.requestWithAuthentication.call(this, 'flotorchApi', {
    // 	method: 'GET',
    // 	uri,
    // 	json: true,
    // })) as { data: Array<{ owned_by: string; id: string }> };

    // for (const model of data) {
    // 	if (!baseUrl && !model.owned_by?.startsWith('system')) continue;
    // 	results.push({
    // 		name: model.id,
    // 		value: model.id,
    // 	});
    // }

    return { results: floTorchDefaultModels };
}