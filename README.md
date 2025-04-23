# Let's Talk - Instagram Clone

A modern social media application with features like posts, reels, livestreams, messaging, and more.

## Development Environment Setup

This project consists of a React frontend and a Node.js backend. Follow these instructions to set up your development environment.

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- Git

### Quick Start

For the easiest setup, use the provided batch scripts:

1. **Start the entire development environment**:
   ```
   start-dev-environment.bat
   ```
   This will start both the backend server on port 60000 and the frontend server on port 30000.

2. **Restart the development environment**:
   ```
   restart-dev-environment.bat
   ```
   Use this if you encounter any issues with the servers.

3. **Stop all development servers**:
   ```
   stop-dev-environment.bat
   ```
   This will kill all Node.js processes running on ports 60000 and 30000.

### Manual Setup

If you prefer to start the servers manually:

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd node-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev:watch
   ```
   The backend server will run on port 60000.

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The frontend server will run on port 30000.

### Troubleshooting

If you encounter issues with the development servers:

1. **Backend not refreshing properly**:
   - Try restarting the backend server using `node-backend/restart-dev.bat`
   - Clear the node_modules/.cache directory
   - Check if port 60000 is already in use by another process

2. **Frontend not refreshing properly**:
   - Try running `npm run start:clean` in the frontend directory
   - Clear the browser cache and reload the page
   - Check if port 30000 is already in use by another process

3. **Socket connection issues**:
   - Make sure both frontend and backend servers are running
   - Check the browser console for connection errors
   - Verify that the MongoDB connection is working properly

### MongoDB Configuration

The application uses MongoDB for data storage. Make sure MongoDB is running on localhost:27017 with the database name 'Lets_Talk'.

### Cloudinary Configuration

For image and video uploads, the application uses Cloudinary. The credentials are:
- CLOUDINARY_CLOUD_NAME: droja6ntk
- CLOUDINARY_API_KEY: 366288452711478
- CLOUDINARY_API_SECRET: IApH9iLAbpU1eYLTQjwtXRPoytw

## Project Structure

- `frontend/`: React frontend application
- `node-backend/`: Node.js backend server
- `*.bat`: Utility scripts for development environment management

## Features

- User authentication
- Posts and reels
- Livestreaming
- Real-time messaging
- Stories
- Explore page
- User profiles
- And more!
