# Mandi Gate Pass & Weighbridge Slip Matcher

A production-grade document verification web application that automatically matches **Mandi Gate Pass** and **Weighbridge Slip** documents before farmer payout approval.

Built using **Next.js, Node.js, Express, TypeScript, and OCR**, the system extracts key fields from both documents, validates them using rule-based matching, and generates an approval or manual review decision.

## Problem Statement

Mandi procurement centers manually compare paper gate passes with weighbridge slips before releasing payments. This process is slow and prone to errors such as:

* Altered gross or net weight
* Duplicate gate pass numbers
* Date mismatches
* Incorrect farmer or vehicle details

This project digitizes the verification process and provides an instant audit decision.

## Features

* Upload Gate Pass and Weighbridge Slip
* OCR-based text extraction
* Automatic field matching
* Rule-based verification engine
* Approval / Manual Review / Rejection workflow
* Document preview before verification
* REST API backend with secure JWT authentication
* Responsive web interface

## Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Frontend       | Next.js 14, React, TypeScript         |
| Backend        | Node.js, Express, TypeScript          |
| OCR            | Mock OCR / Document extraction module |
| Authentication | JWT                                   |
| Deployment     | Railway                               |
| Language       | TypeScript                            |

## Verification Workflow

1. Upload Gate Pass
2. Upload Weighbridge Slip
3. OCR extracts document fields
4. Matching engine compares:

   * Gate Pass Number
   * Date
   * Farmer Name
   * Vehicle Number
   * Gross Weight
   * Tare Weight
   * Net Weight
5. Generate verification result
6. Approve or send for manual review

## Project Structure

```text
mandi-slip-matcher/
│
├── apps/
│   ├── web/        # Next.js frontend
│   └── server/     # Express backend
│
├── packages/
│   └── shared/     # Shared types & utilities
│
└── README.md
```

## Environment Variables

### Server

```env
JWT_SECRET=your_secret
UPLOAD_DIR=./uploads
USE_MOCK_OCR=true
```

### Web

```env
NEXT_PUBLIC_API_URL=https://your-server-url/api
```

## Local Setup

```bash
# Clone repository
git clone https://github.com/PranithaBoddu/mandi-slip-matcher.git

cd mandi-slip-matcher

# Install dependencies
npm install

# Run backend
npm run dev --workspace=@oaks/server

# Run frontend
npm run dev --workspace=@oaks/web
```

Frontend runs on `http://localhost:3000`

Backend runs on `http://localhost:4000`

## API Endpoints

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | `/api/dev-token`        | Generate development token |
| POST   | `/api/documents/upload` | Upload document            |
| POST   | `/api/audit`            | Verify uploaded documents  |
| GET    | `/api/audit/:id`        | Fetch audit result         |

## Future Improvements

- Enable production-grade Tesseract OCR for real scanned Mandi documents.
- Support multilingual slips (English, Telugu, and Hindi).
- Store audit history and verification logs using PostgreSQL.
- Add QR/Barcode validation for gate pass authenticity.
- Implement role-based access for Operators, Auditors, and Administrators.
- Introduce AI-assisted fraud detection for suspicious document anomalies.

## Author

**Pranitha Boddu**

B.Tech Computer Science & Engineering (2027)

MGIT, Hyderabad
