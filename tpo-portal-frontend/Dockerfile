FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Run Vite dev server with polling for Docker file watching
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--force"]
