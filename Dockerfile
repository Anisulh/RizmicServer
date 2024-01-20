# Step 1: Choose a base image
FROM node:16-alpine as builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build the TypeScript app
RUN npm run build

# Step 2: Setup production environment
FROM node:16-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets from the builder stage
# Ensure this path matches the outDir specified in your tsconfig.json
COPY --from=builder /usr/src/app/prod/build ./prod/build

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 8080

# Define the command to run your app using CMD which defines your runtime
# Adjust this path to point to your compiled main file
CMD ["node", "prod/build/src/index.js"]
