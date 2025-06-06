# Fantasy Football Trade Grader

A web application that analyzes fantasy football trades and provides grades out of 100.

## Features
- Add multiple players for each team
- Real-time trade analysis
- Scoring system (0-100)
- Mobile responsive design

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

## Setup

### Backend Setup

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   # or if using yarn
   yarn install
   ```

## Running the Application

### Start the Backend Server

1. From the root directory with the virtual environment activated:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be available at http://localhost:8000

### Start the Frontend Development Server

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or if using yarn
   yarn dev
   ```
   The frontend will be available at http://localhost:5173

## Development

- Backend API documentation is available at http://localhost:8000/docs
- The frontend is built with React + TypeScript + Vite
- The UI uses Chakra UI components for a modern, responsive design

## Building for Production

### Frontend Build

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a production build:
   ```bash
   npm run build
   # or if using yarn
   yarn build
   ```
   The build output will be in the `frontend/dist` directory.

### Backend Deployment

1. For production, use a production-grade ASGI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Live Demo
[View App](https://ethansepa.github.io/FantasyFootballTradeGrader)
