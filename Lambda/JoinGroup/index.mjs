import { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    console.log("JoinGroup handler started", event);

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
    const groupCode = messageData?.groupCode;

    if (!groupName) {
        const errorResponse = {
            action: "error",
            message: "Group name is required!"
        };
        return { body: JSON.stringify({ status: 400, errorResponse }) };
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

        const response = await docClient.send(getCommand);

        if (!response.Item) {
            const errorResponse = {
                action: "error",
                message: "Group does not exist!"
            };
            return { body: JSON.stringify({ status: 404, errorResponse }) };
        }

        if (
            response?.Item?.groupCode &&
            String(response.Item.groupCode) !== String(groupCode)
        ) {
            const errorResponse = {
            action: "error",
            message: "Invalid group code!"
            };
            return { body: JSON.stringify({ status: 403, errorResponse }) };
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
            const successResponse = {
                action: "groupJoined",
                message: "Group joined successfully!",
            };
            return { body: JSON.stringify({ status: 200, successResponse }) };
        }
    }
    catch (err) {
        console.log("Error joining group:", err);
        let errorResponse = {
            action: "error",
            message: "Failed to join group",
        };
        return { body: JSON.stringify({ status: 500, errorResponse }) };
    }
}