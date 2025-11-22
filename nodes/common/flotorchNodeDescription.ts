import { DeclarativeRestApiSettings, Icon, INodeCredentialDescription } from "n8n-workflow";

export const flotorchNodeIcon: Icon = { light: 'file:../../icons/flotorch.svg', dark: 'file:../../icons/flotorch.svg' }

export const flotorchNodeRequestDefaults: DeclarativeRestApiSettings.HttpRequestOptions = {
    ignoreHttpStatusErrors: true,
    baseURL:
        '={{ $credentials.baseUrl?.split("/").slice(0,-1).join("/") ?? "https://gateway.flotorch.cloud" }}',
}

export const flotorchNodeCredentials: INodeCredentialDescription[] = [
    {
        name: 'flotorchApi',
        required: true,
    }
]
