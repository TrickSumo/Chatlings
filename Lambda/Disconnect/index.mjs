import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {

    const userId = event?.requestContext?.authorizer?.userId;

    try {
        const params = {
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: "PROFILE",
            }
        };
        const command = new DeleteCommand(params)
        const response = await docClient.send(command);
        return createResponse(200, { message: "User disconnected successfully" });
    }
    catch (err) {
        console.log(err);
        return createResponse(500, { error: "Failed to disconnect user" });
    }
}
