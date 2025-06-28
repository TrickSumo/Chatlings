import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    console.log("JoinGroup handler started", event);
    const userId = event?.requestContext?.authorizer?.userId;

    try {
        const queryCommand = new QueryCommand({
            TableName: "Chatlings",
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ProjectionExpression: "SK",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":skPrefix": "MEMBER#"
            }
        });

        const queryResponse = await docClient.send(queryCommand);
        console.log("Query response:", queryResponse);

        if (!queryResponse.Items || queryResponse.Items.length === 0)
            return { body: JSON.stringify({ status: 200, groups: [] }) };


        const keys = queryResponse.Items.map(item => (
            { PK: `GROUP#${item.SK.split("MEMBER#")[1]}`, "SK": "META" }
        ))

        const batchCommand = new BatchGetCommand({
            RequestItems: {
                [tableName]: {  // 👈 dynamic table name using computed property
                    Keys: keys     // array of { PK, SK } objects
                }
            }
        });
        
        const batchResponse = await docClient.send(batchCommand);
        console.log("Batch response:", batchResponse);
        if (!batchResponse.Responses || batchResponse.Responses[tableName].length === 0)
            return { body: JSON.stringify({ status: 200, groups: [] }) };
        else return { body: JSON.stringify({ status: 200, groups: batchResponse.Responses[tableName] }) };
    }
    catch (err) {
        console.log("Error in ListGroupsForUser handler:", err);
        return { body: JSON.stringify({ status: 500, errorResponse: { action: "error", message: err } }) };

    }

}