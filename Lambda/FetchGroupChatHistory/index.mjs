import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {
    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        return createResponse(400, { error: "Invalid JSON in message body" }, null);
    }
    const requestId = messageData?.requestId || null;


    const groupName = messageData?.groupName;
    if (!groupName) {
        return createResponse(400, { error: "Group name is required!" }, requestId);
    }

    try {
        const command = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
                ":pk": `GROUP#${groupName}`,
                ":skPrefix": "MESSAGE#"
            },
            Limit: 60,
        });

        const response = await docClient.send(command);
        const messages = response.Items || [];

        return createResponse(200, { status: 200, messages }, requestId);
    }
    catch (err) {
        console.log("Error in ListGroupsForUser handler:", err);
        return { body: JSON.stringify({ status: 500, errorResponse: { action: "error", message: err } }) };
    }
}