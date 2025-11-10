export const enum FloTorchBaseUrls {
    AWS = 'https://gateway.flotorch.cloud',
    AZURE = 'https://gateway-azure.flotorch.cloud',
    GCP = 'https://gateway-gcp.flotorch.cloud',
    DEFAULT = FloTorchBaseUrls.AWS,
}

export const enum FloTorchEndpoints {
    COMPLETIONS = '/openai/v1/chat/completions',
    SESSIONS = '/v1/sessions',
}

export const enum FloTorchDocs {
    QUICKSTART = 'https://docs.flotorch.cloud/',
    RESOURCES = 'https://github.com/FloTorch/Resources',
}

export const enum FloTorchPages {
    HOMEPAGE = 'https://flotorch.ai',
    LINKEDIN = 'https://www.linkedin.com/company/flotorch-ai',
}