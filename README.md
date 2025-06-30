Chatlings🐾

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
