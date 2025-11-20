import type { ILoadOptionsFunctions } from 'n8n-workflow';

export const floTorchModelList = [
    { name: 'Claude Sonnet 4.5', value: 'flotorch/flotorch-claude-sonnet-4-5' },
    { name: 'Claude Haiku 4.5', value: 'flotorch/flotorch-claude-haiku-4-5' },
    { name: 'Amazon Nova Pro', value: 'flotorch/flotorch-aws-nova-pro' },
    { name: 'Amazon Nova Lite', value: 'flotorch/flotorch-aws-nova-lite' },
    { name: 'Amazon Nova Micro', value: 'flotorch/flotorch-aws-nova-micro' },
];

export async function flotorchModelSearch(
    this: ILoadOptionsFunctions,
) {
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

    return { results: floTorchModelList };
}