FROM n8nio/n8n:latest

USER root

# Create folder for custom nodes
RUN mkdir -p /home/node/.n8n/custom/n8n-nodes-flotorch

# Copy your node: built JS + package.json + node_modules
COPY dist /home/node/.n8n/custom/n8n-nodes-flotorch
COPY package.json /home/node/.n8n/custom/n8n-nodes-flotorch/
COPY node_modules /home/node/.n8n/custom/n8n-nodes-flotorch/node_modules

# Switch back to node user
USER node

# Tell n8n where to load your node
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom/n8n-nodes-flotorch
