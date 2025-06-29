import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {
    const userId = event?.requestContext?.authorizer?.userId;

    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        return createResponse(400, { error: "Invalid JSON in message body" }, null);
    }
    const requestId = messageData?.requestId || null;
    const groupName = messageData.groupName;
    const groupCode = messageData.groupCode;
    const groupIcon = messageData.groupIcon || "🌿"; // Default icon if not provided

    if (!groupName) {
        return createResponse(400, { error: "Group name is required!" }, requestId);
    }

    const command = new TransactWriteCommand({
        TransactItems: [
            // Create group metadata
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        PK: `GROUP#${groupName}`,
                        SK: "META",
                        groupName,
                        groupCode,
                        groupIcon,
                        createdBy: `USER#${userId}`,
                        createdAt: new Date().toISOString()
                    },
                    ConditionExpression: "attribute_not_exists(PK)"
                }
            },
            // Forward user entry (USER -> GROUP)
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        PK: `USER#${userId}`,
                        SK: `MEMBER#${groupName}`,
                        joinedAt: new Date().toISOString()
                    }
                }
            },
            // Reverse user entry (GROUP -> USER)
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        PK: `GROUP#${groupName}`,
                        SK: `MEMBER#${userId}`,
                        joinedAt: new Date().toISOString()
                    }
                }
            }
        ]
    });

    try {
        const response = await docClient.send(command);
        if (response.$metadata.httpStatusCode === 200) {
            return createResponse(200, { "message": { groupName, "PK": `GROUP#${groupName}`, "SK": "META", groupCode, groupIcon, createdBy: `USER#${userId}`, createdAt: new Date().toISOString() } }, requestId);
        }
    }
    catch (err) {
        let error;
        if (err?.CancellationReasons[0].Code === "ConditionalCheckFailed") {
            error = "Group already exists!"
        } else {
            error = "Failed to create group"
        }
        return createResponse(500, { error }, requestId);
    }
}