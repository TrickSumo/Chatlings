import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
  const connectionId = event?.requestContext?.connectionId;
  const userId = event?.requestContext?.authorizer?.userId;
  const username = event?.requestContext?.authorizer?.username;
  const now = new Date().toISOString();

  try {
    const params = {
      TableName: tableName,
      Item: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
        username: username,
        connectionId: connectionId,
        lastConnectedAt: now,
      }
    };
    const command = new PutCommand(params);
    const response = await docClient.send(command);
    return { statusCode: 200 }
  }
  catch (err) {
    console.log(err);
    return { statusCode: 500 }
  }
}
