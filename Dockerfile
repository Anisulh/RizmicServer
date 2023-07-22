# Define the base image
FROM node:16-alpine

# Set working directory in the Docker image
WORKDIR /app

# Copy package.json and package-lock.json to Docker image
COPY package*.json ./

# Install dependencies
RUN npm install --unsafe-perm

# Install nodemon for hot reloading
RUN npm install -g nodemon --unsafe-perm

# Copy all files to Docker image
COPY . .

# Expose the port server is running on
EXPOSE 7001

# Start the server with nodemon
CMD [ "npm", "run", "start:nodemon" ]