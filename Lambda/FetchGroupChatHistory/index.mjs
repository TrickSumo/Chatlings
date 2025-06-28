import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    console.log("FetchGroupChatHistory handler started", event);
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
    if (!groupName) {
        const errorResponse = {
            action: "error",
            message: "Group name is required!"
        };
        return { body: JSON.stringify({ status: 400, errorResponse }) };
    }

    try {

        const command = new QueryCommand({
            TableName: "Chatlings",
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
                ":pk": `GROUP#${groupId}`,
                ":skPrefix": "MESSAGE#"
            },
            //  ScanIndexForward: false // to get messages in descending order
            Limit: 60, // Adjust as needed
        });

        const response = await client.send(command);

        const messages = response.Items || [];
        console.log("Fetched messages:", messages);

        return { body: JSON.stringify({ status: 200, messages }) };

    }
    catch (err) {
        console.log("Error in ListGroupsForUser handler:", err);
        return { body: JSON.stringify({ status: 500, errorResponse: { action: "error", message: err } }) };

    }

}