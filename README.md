# 🔭 Vision AI: Contextual Augmented Reality Engine

**Vision AI** is a real-time geolocation engine that bridges the physical and digital worlds. It uses a custom "Field-of-View" algorithm to identify what a user is looking at and enriches that data with Generative AI (GPT-4o-mini) to act as an expert local guide.

Unlike standard maps, Vision AI prioritizes **user orientation (heading)** and **contextual relevance**, filtering out noise to focus on landmarks and cultural points of interest.

## 🚀 Key Features

### 1. 🧭 Spatial Awareness Engine

- **Vector-Based Identification:** Calculates the bearing difference (`Δ Angle`) between the user's heading and thousands of nearby points.
- **Weighted Scoring Algorithm:** Implements a priority system that favors cultural landmarks (Museums, Churches) over utilitarian spots (ATMs, Gas Stations) even if they are slightly further away.
- **Dynamic FOV:** Filters targets within a specific conic field of view (e.g., 60°) to simulate human vision.

### 2. 🧠 Generative AI Context

- **AI-Powered Descriptions:** Connects with OpenAI (GPT-4o-mini) to generate witty, historical, and factual summaries of the identified location.
- **System Persona:** Designed with a specific "Local Expert" prompt to avoid hallucinations and ensure high-quality, concise content.

### 3. 🔒 Privacy-First Architecture

- Location data is processed ephemerally on a private Node.js backend.
- No third-party tracking SDKs on the client side.

## 🛠 Tech Stack

### Backend (Server)

- **Runtime:** Node.js & TypeScript
- **Framework:** Fastify (High-performance API)
- **AI Integration:** OpenAI SDK
- **Geospatial Data:** Google Places API (New Gen) with FieldMasking optimization.

### Frontend (Mobile)

- **Framework:** React Native (Expo SDK 52)
- **Sensors:** `expo-location` (Fused Location Provider & Magnetometer)
- **UI:** Minimalist Dark Mode interface with real-time sensor feedback.

## 📐 How the Algorithm Works

1.  **Ingestion:** App streams `Latitude`, `Longitude`, and `TrueHeading`.
2.  **Radius Search:** Backend fetches POIs within an 80m radius.
3.  **Scoring Loop:**
    - Calculate Bearing to target.
    - Determine `AngleDiff` = `|UserHeading - TargetBearing|`.
    - Apply **Category Weights**: `Landmarks (-25 score boost)`, `Utilities (+20 penalty)`.
4.  **Selection:** Sort by lowest score and verify visibility threshold.
5.  **Enrichment:** If a match is found, prompt the LLM for context and return to client.

## 📦 Project Structure

```bash
vision-ai-engine/
├── backend/       # Fastify Server & Business Logic
│   ├── src/services/vision.service.ts # Geospatial Math
│   └── src/services/ai.service.ts     # GPT-4o Integration
└── mobile-app/    # React Native Client

🔧 Setup & Installation
1. Backend Setup
Bash

cd backend
npm install
Create a .env file in the backend folder with your keys:

GOOGLE_API_KEY=your_google_maps_key
OPENAI_API_KEY=your_openai_key

Run the server:

npm run dev
# Server should start on port 3000
2. Mobile App Setup

cd mobile-app
npm install

⚠️ Configuration: Before running, open app/index.tsx and update the BACKEND_URL:

// app/index.tsx
const BACKEND_URL = 'http://YOUR_LOCAL_IP:3000/identify';
Replace YOUR_LOCAL_IP with your computer's local IP address (e.g., 192.168.1.50) to allow the phone to connect to the server.

Run the app:

npx expo start


Developed by Jorge - 2025
```
