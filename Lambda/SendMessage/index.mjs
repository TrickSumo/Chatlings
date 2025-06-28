import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    console.log("SendMessage handler started", event);

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

    const groupName = messageData?.groupName;
    const message = messageData?.message;

    if (!groupName || message === undefined || message === null) {
        const errorResponse = {
            action: "error",
            message: "Group name and message are required!"
        };
        return { body: JSON.stringify({ status: 400, errorResponse }) };
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
            const errorResponse = {
                action: "error",
                message: "User is not a member of the group!"
            };
            return { body: JSON.stringify({ status: 403, errorResponse }) };
        }

        // Send message to the group
        const putCommand = new PutCommand({
            TableName: tableName,
            Item: {
                PK: `GROUP#${groupName}`,
                SK: `MESSAGE#${new Date().toISOString()}`, // Unique message ID based on timestamp
                message,
                sentBy: `USER#${userId}`,
                sentAt: new Date().toISOString(),
                type: "text"
            },
        });
        const putResponse = await docClient.send(putCommand);
        const successResponse = {
            action: "messageSent",
            message: "Message sent successfully!",
        };
        return { body: JSON.stringify({ status: 200, successResponse }) };

    }
    catch (err) {
        console.log(err);
        let errorResponse = {
            action: "error",
            message: "Failed to send message to group",
        };
        return { body: JSON.stringify({ status: 500, errorResponse }) };
    }
}