# Stage 1: Build the Vite React app
FROM node:23-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app using 'serve'
FROM node:23-alpine

WORKDIR /app

# Install 'serve' globally
RUN npm install -g serve

# Copy build output from the previous stage
COPY --from=build /app/dist ./dist

# Expose port 3002
EXPOSE 3002

# Use 'serve' to serve the build on port 3002
CMD ["serve", "-s", "dist", "-l", "3002"]
