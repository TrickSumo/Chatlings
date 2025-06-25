import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

const makeApiClient = (event) => {
  const { domainName, stage } = event.requestContext;
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });
};

const createResponse = (statusCode, body) => {
  const responseBody = JSON.stringify(body);
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: responseBody,
  };
};

export const createConnection = async (event) => {
  const { connectionId } = event?.requestContext;
  const apiClient = makeApiClient(event);

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      connectionId,
    },
    ConditionExpression: "attribute_not_exists(connectionId)",
  });

  try {
    const response = await docClient.send(command);

    // Scan for all connections
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "connectionId",
      })
    );

    const welcomeMessage = JSON.stringify({
      action: "welcome",
      message: `Let's welcome ${connectionId}!`,
    });

    // Broadcast to all connections
    await Promise.all(
      (scanResult.Items || []).map(async (conn) => {
        try {
          await apiClient.send(
            new PostToConnectionCommand({
              ConnectionId: conn.connectionId,
              Data: welcomeMessage,
            })
          );
        } catch (err) {
          console.warn(`Failed to post to ${conn.connectionId}: ${err.message}`);
        }
      })
    );

    return createResponse(201, {
      message: "Item Created Successfully and welcome broadcast sent!",
      response,
    });
  } catch (err) {
    if (err.message === "The conditional request failed")
      return createResponse(409, { error: "Item already exists!" });
    else
      return createResponse(500, {
        error: "Internal Server Error!",
        message: err.message,
      });
  }
};
