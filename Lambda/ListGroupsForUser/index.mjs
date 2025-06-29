import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
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

    try {
        // Get list Of Groups where user is a member
        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ProjectionExpression: "SK",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":skPrefix": "MEMBER#"
            }
        });

        const queryResponse = await docClient.send(queryCommand);

        // User does not belong to any group
        if (!queryResponse.Items || queryResponse.Items.length === 0)
            return createResponse(200, { groups: [] }, requestId)

        // Batch get the groups metadata 
        const keys = queryResponse.Items.map(item => (
            { PK: `GROUP#${item.SK.split("MEMBER#")[1]}`, "SK": "META" }
        ))
        const batchCommand = new BatchGetCommand({
            RequestItems: {
                [tableName]: {
                    Keys: keys
                }
            }
        });
        const batchResponse = await docClient.send(batchCommand);
        return createResponse(200, { groups: batchResponse?.Responses?.[tableName] || [] }, requestId);
    }
    catch (err) {
        console.log("Error in ListGroupsForUser handler:", err);
        return createResponse(500, { error: err });
    }
}