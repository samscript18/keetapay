# KeetaPay

KeetaPay is a modern peer-to-peer payment application built on the Keeta blockchain testnet for the Keeta Coding Challenge. It lets users send KTA with verified usernames instead of long wallet addresses. Users can sign in, create a profile, receive a Keeta wallet, get an SDK-backed identity certificate, make payment requests, send payments, withdraw to external Keeta addresses, and view recent activity in a friendly dashboard.

- SDK used: KeetaNet Client JavaScript/TypeScript SDK [`@keetanetwork/keetanet-client`](https://docs.keeta.com/introduction/start-developing)
- Network: Keeta testnet
- Tech stack: Node.js, NestJS, Next.js, TypeScript, Tailwind CSS, MongoDB, Privy Auth

## Features

- Username-based KTA transfers on Keeta testnet
- Keeta SDK wallet creation and transaction broadcasting
- SDK-backed identity certificate issuance and verification
- Verified username badges in profile, feed, and transaction UI
- Payment requests and external wallet withdrawals
- Live public feed that hides private transactions and descriptions
- Privy authentication for login and sessions

## Prerequisites

- Node.js v18+
- npm

## Installation

```bash
git clone https://github.com/samscript18/keetapay.git
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

## Keeta SDK Usage

This project uses the official Keeta SDK:

[`@keetanetwork/keetanet-client`](https://docs.keeta.com/introduction/start-developing)

The app is configured for Keeta testnet. Wallet creation, KTA transfers, identity certificates, certificate verification, and wallet certificate anchoring are implemented through the SDK.

Identity implementation rules:

- Certificates are created with Keeta SDK certificate APIs.
- Certificate verification uses Keeta SDK certificate verification only.
- Wallet identity anchoring uses Keeta SDK certificate modification APIs.
- Custom certificate signing, custom proof generation, and custom proof verification are not implemented.
- Selective disclosure is stubbed as `Not supported by Keeta SDK` because the installed SDK package does not expose those APIs.

## Testing Identity Verification

1. Start the backend and frontend.
2. Sign in through the app. `POST /auth/sync` creates or loads your wallet and issues an SDK-backed identity certificate.
3. Open your public profile at:

```bash
http://localhost:3000/u/YOUR_USERNAME
```

4. Confirm your username pill shows the verified identity icon.
5. You can also inspect the API response:

```bash
curl http://localhost:4000/users/YOUR_USERNAME
```

Look for:

```json
"identityProof": {
  "verified": true,
  "verificationSource": "keeta-sdk",
  "certificateHash": "..."
}
```

To verify a returned certificate directly, post the `identityProof` object to:

```bash
curl -X POST http://localhost:4000/identity/verify-certificate \
  -H "Content-Type: application/json" \
  -d '{...identityProof JSON...}'
```

Expected response includes `verified: true` and `verificationSource: "keeta-sdk"`.

To confirm unsupported selective disclosure behavior:

```bash
curl -X POST http://localhost:4000/identity/request-selective-disclosure
```

Expected response:

```json
{ "unsupportedReason": "Not supported by Keeta SDK" }
```

If `KEETA_DEMO_MODE=true`, certificate creation and verification still use the SDK, but network anchoring is skipped.
