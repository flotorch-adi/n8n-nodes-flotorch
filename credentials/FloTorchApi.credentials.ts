import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon
} from 'n8n-workflow';
import { FloTorchPages, FloTorchBaseUrls } from '../flotorch/sdk/constants';

export class FloTorchApi implements ICredentialType {
	name = 'flotorchApi';

	displayName = 'FloTorch';

	icon: Icon = { light: 'file:../icons/flotorch.svg', dark: 'file:../icons/flotorch.svg' };

	documentationUrl = FloTorchPages.HOMEPAGE;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: FloTorchBaseUrls.DEFAULT,
			description: 'Set the base URL for your FloTorch account',
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			required: false,
			default: '',
			description: 'Add your FloTorch workspace ID for tracing',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/openai/v1/chat/completions',
			method: 'POST',
			body: {
				model: 'flotorch/default',
				messages: [
					{
						role: 'user',
						content: 'What is the capital of Norway?'
					}
				]
			}
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers ??= {};
		requestOptions.headers['Authorization'] = `Bearer ${credentials.apiKey}`;

		if (
			credentials.header &&
			typeof credentials.headerName === 'string' &&
			credentials.headerName &&
			typeof credentials.headerValue === 'string'
		) {
			requestOptions.headers[credentials.headerName] = credentials.headerValue;
		}

		return requestOptions;
	}
}
