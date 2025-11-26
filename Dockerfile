FROM n8nio/n8n:latest

USER root

# Create folder for custom node inside container
RUN mkdir -p /home/node/.n8n/custom/n8n-nodes-flotorch

# Copy the entire project into container
COPY . /home/node/.n8n/custom/n8n-nodes-flotorch

WORKDIR /home/node/.n8n/custom/n8n-nodes-flotorch

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Compile TypeScript
RUN npm run build

# Set custom nodes path
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom/n8n-nodes-flotorch/dist

# Switch back to n8n user
USER node
