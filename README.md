# KeetaPay

KeetaPay is a modern peer-to-peer payment application built on the Keeta blockchain testnet for the Keeta Coding Challenge. It enables users to send KTA on Keeta testnet instantly and securely using simple usernames instead of long wallet addresses. Users can sign in, create a profile, make payment requests, send payments, and view recent activity, track transaction and history in a friendly dashboard.

- SDK used: [`@keetanetwork/keetanet-client`](https://docs.keeta.com/introduction/start-developing)
- Network: Keeta testnet
- Tech stack: Node.js, NestJS, Next.js, TypeScript, Tailwind CSS, MongoDB, Privy Auth

## Prerequisites

- Node.js v18+
- npm

## Installation

```bash
git clone https://github.com/your-username/keetapay.git
cd keetapay
npm install
cd backend
npm install
cd ../frontend
npm install
```

## Environment

Create a `backend/.env` file before running the backend. The app uses environment variables for server settings and wallet seed encryption.

```bash
MONGODB_URI=your_mongodb_uri
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
MASTER_ENCRYPTION_KEY=base64_32_byte_key
KEETA_NETWORK=test
KEETA_DEMO_MODE=false
PORT=4000
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `frontend/.env.local` file for the frontend.

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Do not commit `.env` files. Keep wallet seeds and encryption keys private.

## How To Run

This project is a full-stack app, so run the backend and frontend separately.

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open the frontend at http://localhost:3000. The backend runs at http://localhost:4000.

## SDK

This project uses the official Keeta SDK:

[`@keetanetwork/keetanet-client`](https://docs.keeta.com/introduction/start-developing)

The app is configured for Keeta testnet.
