# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install python3 and git
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

# Clone the GitHub repository
ARG GITHUB_REPO=https://github.com/moranmoa/TGC-bot.git
RUN git clone $GITHUB_REPO .
RUN git pull

# Verify package.json
RUN cat package.json

# Install application dependencies
RUN npm install

# Expose the port your application listens on (if it does)
# EXPOSE 3000 # Example port, if your express server uses a port.

# Define environment variables
ENV TOKEN=${TOKEN}
ENV GUILD_ID=${GUILD_ID}
ENV BOT_ID=${BOT_ID}
ENV dev=${dev}
ENV dudiBOT_ID=${dudiBOT_ID}
ENV dudiTOKEN=${dudiTOKEN}

# Command to run the application
CMD [ "npm", "start" ]