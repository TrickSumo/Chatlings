import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {

    const userId = event?.requestContext?.authorizer?.userId;
    const username = event?.requestContext?.authorizer?.username;

    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        return createResponse(400, { error: "Invalid JSON in message body" }, null);
    }
    const requestId = messageData?.requestId || null;

    const groupName = messageData?.groupName;
    const message = messageData?.message;

    if (!groupName || message === undefined || message === null) {
        return createResponse(400, { error: "Group name and message are required!" }, requestId);
    }

    try {
        // Check if user is member of the group
        const getCommand = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `MEMBER#${groupName}`,
            },
        });

        const response = await docClient.send(getCommand);

        if (!response.Item) {
            return createResponse(403, { error: "User is not a member of the group!" }, requestId);
        }

        // Send message to the group
        const putItem = {
            PK: `GROUP#${groupName}`,
            SK: `MESSAGE#${new Date().toISOString()}`, // Unique message ID based on timestamp
            message,
            sentBy: username,
            sentAt: new Date().toISOString(),
            type: "txt"
        };
        const putCommand = new PutCommand({
            TableName: tableName,
            Item: putItem,
        });
        const putResponse = await docClient.send(putCommand);
        
        if (putResponse?.$metadata?.httpStatusCode) {
            return createResponse(200, { message: putItem }, requestId);
        }
    }
    catch (err) {
        console.log("Failed to send message", err);
        return createResponse(500, { error: "Failed to send message to group" }, requestId);
    }
}