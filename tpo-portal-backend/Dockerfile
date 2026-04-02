FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for nodemon)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4000

# Run in development mode with nodemon
CMD ["npm", "run", "dev"]
