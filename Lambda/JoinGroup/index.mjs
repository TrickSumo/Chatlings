import { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    const groupName = messageData?.groupName;
    const groupCode = messageData?.groupCode;

    if (!groupName) {
        return createResponse(400, { error: "Group name is required!" }, requestId);
    }

    try {
        // Check if group Metadata in DynamoDB have groupCode Attribute
        const getCommand = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `GROUP#${groupName}`,
                SK: "META"
            },
            ProjectionExpression: "groupCode"
        });

        const getCommandResponse = await docClient.send(getCommand);

        if (!getCommandResponse.Item) {
            return createResponse(404, { error: "Group does not exist!" }, requestId);
        }

        if (
            getCommandResponse?.Item?.groupCode &&
            String(getCommandResponse.Item.groupCode) !== String(groupCode)
        ) {
            return createResponse(403, { error: "Invalid group code!" }, requestId);
        }

        const transactionCommand = new TransactWriteCommand({
            TransactItems: [
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

        const trasactionResponse = await docClient.send(transactionCommand);
        if (trasactionResponse.$metadata.httpStatusCode === 200) {
            return createResponse(200, {
                message: {
                    groupName,
                    PK: `GROUP#${groupName}`,
                    SK: "META",
                    groupCode: getCommandResponse.Item.groupCode || null,
                    joinedAt: new Date().toISOString(),
                    groupIcon: getCommandResponse.Item.groupIcon || "🌿"
                }
            }, requestId);
        }
    }
    catch (err) {
        console.log("Error joining group:", err);
        return createResponse(500, { error: "Failed to join group" }, requestId);
    }
}