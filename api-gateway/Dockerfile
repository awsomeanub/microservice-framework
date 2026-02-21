# Simple Dockerfile for API Gateway
FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV ITEM_SERVICE_URL=http://localhost:3000

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
