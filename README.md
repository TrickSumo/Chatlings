# Chatlings 🐾

A serverless, real-time chat platform for children aged 8–14 with AI content moderation and CloudFront-protected media.

**Live app:** https://d19ptumhqepwqw.cloudfront.net · **Demo video:** https://youtu.be/-6383PUenpg · **Blog:** https://dev.to/aws-builders/chatlings-ai-moderated-serverless-chat-app-for-kids-15lp

![Chatlings Github Poster](https://github.com/user-attachments/assets/760905d1-4aea-4562-a516-b9d894f8b101)

---

## What I Finished for This Hackathon

- **One-command AWS deployment** via AWS CDK — `npm run deploy` provisions the entire stack (DynamoDB, S3, Lambda, API Gateway, CloudFront, Cognito) and deploys the frontend automatically
- **Fixed WebSocket through CloudFront** — added `OriginRequestPolicy` to forward upgrade headers and query strings so the Lambda Authorizer is actually invoked
- **Fixed CloudFront signed cookies** — origin request policy on the `/api*` behavior was stripping `Set-Cookie` headers before they reached the browser; media access now works correctly
- **Fixed DynamoDB bugs:**
  - `FetchGroupChatHistory` was returning the oldest messages instead of the newest (`ScanIndexForward: false` + pagination with `LastEvaluatedKey`)
  - `MessageAnalyzer` was making N individual DynamoDB reads per broadcast → replaced with a single `BatchGetCommand`
  - `ListGroupsForUser` silently dropped groups when DynamoDB returned `UnprocessedKeys`
  - Stale `connectionId` entries now cleaned up on `GoneException` (410) from API Gateway

---

## Features

- **Real-time group chat** over WebSocket API Gateway, authenticated with Cognito and a Lambda Authorizer
- **AI content moderation** — every message is checked by Amazon Bedrock (Nova Micro) before being broadcast; unsafe messages are replaced with a notice
- **Image sharing** — direct browser-to-S3 upload via pre-signed URLs; images served through CloudFront signed cookies
- **Image moderation** — Amazon Rekognition scans every uploaded image for inappropriate content
- **Ask the bot** — mention `@askbot` in any message to get an AI response inline

---

## Architecture

![Chatlings Architecture](https://github.com/user-attachments/assets/ADD-YOUR-ARCHITECTURE-IMAGE-URL-HERE)

CloudFront is the single entrypoint with four behaviors:

| Path | Origin | Notes |
|---|---|---|
| `default` | S3 (frontend) | React SPA |
| `/api*` | HTTP API Gateway | Signed cookie generation |
| `/media/*` | S3 (media) | CloudFront signed cookies required |
| `/production*` | WebSocket API Gateway | All viewer headers forwarded |

---

## One-Command Deploy

**Prerequisites:** Node.js 20+, AWS CLI configured, AWS CDK installed (`npm i -g aws-cdk`)

```bash
git clone https://github.com/TrickSumo/Chatlings.git
cd Chatlings
npm run deploy
```

`deploy.sh` will:
1. Run `cdk deploy` to provision all AWS infrastructure
2. Parse the CDK outputs to get CloudFront domain, Cognito config, S3 bucket name
3. Write `Frontend/.env` with the resolved values
4. Build the React app and sync it to S3
5. Invalidate the CloudFront cache

---

## DynamoDB Single-Table Design

| Entity | PK | SK | Key Attributes |
|---|---|---|---|
| User Profile | `USER#<userId>` | `PROFILE` | `connectionId`, `username` |
| Group Metadata | `GROUP#<groupId>` | `META` | `groupName`, `groupCode`, `createdBy` |
| Group Message | `GROUP#<groupId>` | `MESSAGE#<ISO timestamp>` | `message`, `sentBy`, `type` |
| Group Member (user→group) | `USER#<userId>` | `MEMBER#<groupId>` | `joinedAt` |
| Group Member (group→user) | `GROUP#<groupId>` | `MEMBER#<userId>` | `joinedAt` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Zustand, Vite |
| Auth | Amazon Cognito, Lambda Authorizer (JWT) |
| Real-time | AWS WebSocket API Gateway |
| Backend | AWS Lambda (Node.js 20), HTTP API Gateway |
| Database | Amazon DynamoDB (single-table) |
| Media | S3 + CloudFront signed cookies |
| AI Moderation | Amazon Bedrock (Nova Micro) |
| Image Moderation | Amazon Rekognition |
| Infrastructure | AWS CDK v2 (TypeScript) |
| CDN | Amazon CloudFront |
