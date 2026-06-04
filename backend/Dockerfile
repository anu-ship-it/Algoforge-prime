FROM node:20-alpine

WORKDIR /app

# Install dependencies first (separate layer — cached unless package.json changes)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
