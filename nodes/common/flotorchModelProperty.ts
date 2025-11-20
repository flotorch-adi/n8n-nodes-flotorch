import type { INodeProperties } from 'n8n-workflow';

export const flotorchModelProperty: INodeProperties = {
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