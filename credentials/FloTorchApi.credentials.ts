import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon
} from 'n8n-workflow';
import { FloTorchBaseUrl } from '../utils/FloTorchUtils';

export class FloTorchApi implements ICredentialType {
	name = 'flotorchApi';

	displayName = 'FloTorch';

	icon: Icon = { light: 'file:../icons/flotorch.svg', dark: 'file:../icons/flotorch.svg' };

	documentationUrl = 'https://flotorch.ai';

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
			displayName: 'Organization ID (optional)',
			name: 'organizationId',
			type: 'string',
			default: '',
			hint: 'Only required if you belong to multiple organisations',
			description:
				"For users who belong to multiple organizations, you can set which organization is used for an API request. Usage from these API requests will count against the specified organization's subscription quota.",
		},
		{
			displayName: 'Cloud Provider',
			name: 'url',
			type: 'options',
			options: [
				{
					name: 'Amazon Web Services',
					value: FloTorchBaseUrl.AWS,
				},
				{
					name: 'Microsoft Azure',
					value: FloTorchBaseUrl.AZURE,
				},
				{
					name: 'Google Cloud',
					value: FloTorchBaseUrl.GCP
				}
			],
			default: FloTorchBaseUrl.DEFAULT,
			description: 'Override the default base URL for the API',
		},
		{
			displayName: 'Add Custom Header',
			name: 'header',
			type: 'boolean',
			default: false,
		},
		{
			displayName: 'Header Name',
			name: 'headerName',
			type: 'string',
			displayOptions: {
				show: {
					header: [true],
				},
			},
			default: '',
		},
		{
			displayName: 'Header Value',
			name: 'headerValue',
			type: 'string',
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					header: [true],
				},
			},
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.url}}',
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
		requestOptions.headers['FloTorch-Organization'] = credentials.organizationId;

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
