import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    const userId = event?.requestContext?.authorizer?.userId;
    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        const errorResponse = {
            action: "error",
            message: "Invalid JSON in message body"
        };
        return { body: JSON.stringify({ status: 400, errorResponse }) };
    }

    const groupName = messageData.groupName;
    const groupCode = messageData.groupCode;
    const groupIcon = messageData.groupIcon || "🌿"; // Default icon if not provided

    if (!groupName) {
        const errorResponse = {
            action: "error",
            message: "Group name is required!"
        };
        return { body: JSON.stringify({ status: 400, errorResponse }) };
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
            const successResponse = {
                action: "groupCreated",
                message: "Group created successfully!",
            };
            return { body: JSON.stringify({ status: 200, successResponse }) };
        }
    }
    catch (err) {
        let errorResponse;
        if (err?.CancellationReasons[0].Code === "ConditionalCheckFailed") {
            errorResponse = {
                action: "error",
                message: "Group already exists!"
            };
        } else {
            errorResponse = {
                action: "error",
                message: "Failed to create group",
            };
        }
        return { body: JSON.stringify({ status: 500, errorResponse }) };
    }
}