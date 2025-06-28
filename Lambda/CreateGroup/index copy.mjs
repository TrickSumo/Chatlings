import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "Chatlings";

export const handler = async (event) => {
    console.log("CreateGroup handler started", event);
    
    const {connectionId,domainName,stage} = event?.requestContext;


    // Create API Gateway Management API client for WebSocket
    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    });

    // Parse the WebSocket message body
    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        const errorResponse = {
            action: "error",
            message: "Invalid JSON in message body"
        };
        await sendToConnection(apiGatewayClient, connectionId, errorResponse);
        return { statusCode: 400 };
    }

    const groupId = randomUUID();
    const groupName = messageData.groupName || "Default Group";
    const groupCode = messageData.groupCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    const createdBy = messageData.createdBy || connectionId; // Use connectionId as fallback
    const createdAt = new Date().toISOString();

    const command = new PutCommand({
        TableName: tableName,
        Item: {
            PK: `GROUP#${groupId}`,
            SK: "META",
            groupName,
            groupCode,
            createdBy,
            createdAt
        },
        ConditionExpression: "attribute_not_exists(PK)",
    });

    try {
        const response = await docClient.send(command);
        
        // Send success response back through WebSocket
        const successResponse = {
            action: "groupCreated",
            group: {
                groupId,
                groupName,
                groupCode,
                createdBy,
                createdAt
            }
        };
        
        await sendToConnection(apiGatewayClient, connectionId, successResponse);
        return { statusCode: 200 };
    }
    catch (err) {
        let errorResponse;
        if (err.name === "ConditionalCheckFailedException") {
            errorResponse = {
                action: "error",
                message: "Group already exists!"
            };
        } else {
            errorResponse = {
                action: "error",
                message: "Failed to create group",
                details: err.message
            };
        }
        
        await sendToConnection(apiGatewayClient, connectionId, errorResponse);
        return { statusCode: 500 };
    }
}

// Helper function to send messages through WebSocket
const sendToConnection = async (apiGatewayClient, connectionId, data) => {
    try {
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
        });
        await apiGatewayClient.send(command);
    } catch (error) {
        console.error('Failed to send message to connection:', error);
    }
};