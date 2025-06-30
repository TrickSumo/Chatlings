# Chatlings🐾
Chatlings 🐾 is a serverless, real-time chat platform designed for children aged 8–14. It ensures content safety using AI moderation and a delightful, kid-friendly design.

Blog post on architecture of project:- https://medium.com/@QuantumScientistRishi/chatlings-safe-chat-app-for-kids-98b5b869f28b (Please refer blog for features and functionality of the project).

Demo video:- https://youtu.be/-6383PUenpg

Application URL:- https://d2t0lj9wibb5m4.cloudfront.net/app
username:- cog password:- Secure2025#

Services used:-
* AWS Lambda, DynamoDB, S3, Bedrock, Rekognition and API Gateway for backend.
* Cognito userpool and Lambda authorizer for authentication. AWS CloudFront Distribution as entrypoint for application.
* React, Zustand and other frontend tools for delightful interface.

  
![Chatlings Github Poster](https://github.com/user-attachments/assets/760905d1-4aea-4562-a516-b9d894f8b101)

# Entity Relationship Grid

| **Entity Type**        | **PK**            | **SK**                | **Attributes** (optional)                          | **Notes**                        |
| ---------------------- | ----------------- | --------------------- | -------------------------------------------------- | -------------------------------- |
| **User Profile**       | `USER#<userId>`   | `PROFILE`             | `name`, `avatarUrl`, `joinedAt`, `connectionId`    | Stores main user profile         |
| **Group Metadata**     | `GROUP#<groupId>` | `META`                | `groupName`, `groupCode`, `createdBy`, `createdAt` | Describes a group                |
| **Group Message**      | `GROUP#<groupId>` | `MSG#<ISO timestamp>` | `sentBy`, `text`, `type`, `imageUrl`               | One row per message              |
| **Group Member (FWD)** | `USER#<userId>`   | `MEMBER#<groupId>`    | `joinedAt`                                         | Links user → group               |
| **Group Member (REV)** | `GROUP#<groupId>` | `MEMBER#<userId>`     | `joinedAt`                                         | Links group → user               |

### DynamoDB Schema Design for Chatlings🐾

| Entity | PK                | SK                    | Attributes                                  |
|--------|-------------------|------------------------|---------------------------------------------|
| User Profile | USER#rishi123     | PROFILE               | name, avatarUrl, joinedAt, connectionId     |
| Group | GROUP#group1       | META                  | groupName, groupCode, createdAt, createdBy  |
| Group Message | GROUP#group1       | MSG#2025-06-22T10:02:00Z | sentBy, text, type                          |
| Group Member (FWD) | USER#rishi123     | MEMBER#group1         | joinedAt                                    |
| Group Member (REV) | GROUP#group1       | MEMBER#rishi123       | joinedAt                                    |
