import {
    BedrockRuntimeClient,
    ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const bedrock = new BedrockRuntimeClient({ region: process.env.region || "us-east-1" });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const modelId = process.env.modelId || "amazon.nova-micro-v1:0";
const tableName = process.env.tableName || "Chatlings";
const websocketEndpoint = process.env.WEBSOCKET_ENDPOINT; // Set this in your Lambda environment variables


export const handler = async (event) => {

    console.log(JSON.stringify(event));

    for (const record of event.Records) {
        console.log(record.eventName, record.dynamodb.Keys.SK.S);

        if (record.eventName === 'INSERT' && record.dynamodb.Keys.SK.S.includes("MESSAGE#")) {
            const messageData = record.dynamodb.NewImage;
            const message = messageData.message.S;
            const groupName = record.dynamodb.Keys.PK.S.replace("GROUP#", "");

            console.log("Processing new message for group:", groupName);
            console.log("Analyzing message:", message);

            // Prepare the original message object
            const originalMessage = {
                PK: record.dynamodb.Keys.PK.S,
                SK: record.dynamodb.Keys.SK.S,
                message: messageData.message.S,
                sentBy: messageData.sentBy.S,
                sentAt: messageData.sentAt.S,
                type: messageData.type.S
            };

            const isImage = messageData.type.S === "img";
            if (isImage) {
                console.log("📸 Image message detected, skipping AI moderation");
                await notifyGroupMembers(groupName, originalMessage, false);
                continue; // Continue to next record instead of returning
            }

            const converseCommand = new ConverseCommand({
                modelId: modelId,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: `Is the following message safe for a kid-friendly chatroom? Please🥺 respond only "SAFE" or "UNSAFE".\n\n"${message}"
                                Example: 

                                Input:- This is a great day!
                                Output:- SAFE

                                Input:- Spider will attack you!
                                Output:- UNSAFE

                                Input:- I love playing with my friends!
                                Output:- SAFE`
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    temperature: 0.1,
                    topP: 1,
                    maxTokens: 10
                }
            });

            try {
                const response = await bedrock.send(converseCommand);
                const aiResponse = response.output?.message?.content?.[0]?.text?.trim().toUpperCase();
                console.log("AI Response:", JSON.stringify(response));

                if (aiResponse.includes("UNSAFE")) {
                    console.log("🚨 Unsafe message detected:", message);

                    // Update DynamoDB to flag the message and replace content
                    const updateCommand = new UpdateCommand({
                        TableName: tableName,
                        Key: {
                            PK: record.dynamodb.Keys.PK.S,
                            SK: record.dynamodb.Keys.SK.S
                        },
                        UpdateExpression: "SET moderation = :moderation, message = :newMessage",
                        ExpressionAttributeValues: {
                            ":moderation": "flagged",
                            ":newMessage": "Message removed by moderator"
                        }
                    });

                    try {
                        await docClient.send(updateCommand);
                        console.log("✅ Message flagged and content updated");

                        // Send notification with moderated content
                        const moderatedMessage = {
                            PK: record.dynamodb.Keys.PK.S,
                            SK: record.dynamodb.Keys.SK.S,
                            message: "Message removed by moderator",
                            sentBy: messageData.sentBy.S,
                            sentAt: messageData.sentAt.S,
                            type: messageData.type.S,
                            moderation: "flagged"
                        };

                        await notifyGroupMembers(groupName, moderatedMessage, true);

                    } catch (updateErr) {
                        console.error("❌ Failed to update message:", updateErr);
                    }
                } else {
                    console.log("✅ Message is safe, sending notification");
                    // Send notification with original safe message
                    await notifyGroupMembers(groupName, originalMessage, false);
                }

            } catch (err) {
                console.error("🧠 Bedrock moderation failed:", err);
                console.log("🧠 Bedrock moderation failed:", err.message || err);

                // If moderation fails, send the original message (fail-safe)
                console.log("⚠️ Moderation failed, sending original message as fallback");
                await notifyGroupMembers(groupName, originalMessage, false);
            }
        }
    }
};

// Function to notify active group members about new messages
const notifyGroupMembers = async (groupName, messageItem, isModerated = false) => {
    try {
        // Skip notification if no WebSocket endpoint is configured
        if (!websocketEndpoint) {
            console.log("⚠️ No WebSocket endpoint configured, skipping notifications");
            return;
        }

        // Create API Gateway Management API client for WebSocket
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: websocketEndpoint
        });

        // Get all group members
        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ProjectionExpression: "SK",
            ExpressionAttributeValues: {
                ":pk": `GROUP#${groupName}`,
                ":skPrefix": "MEMBER#"
            }
        });

        const membersResponse = await docClient.send(queryCommand);

        if (!membersResponse.Items || membersResponse.Items.length === 0) {
            console.log("No members found for group:", groupName);
            return;
        }

        // Extract userIds from the members
        const userIds = membersResponse.Items.map(item =>
            item.SK.replace("MEMBER#", "")
        );

        // Get active connections for these users
        const connectionPromises = userIds.map(async (userId) => {
            try {
                const userProfileCommand = new GetCommand({
                    TableName: tableName,
                    Key: {
                        PK: `USER#${userId}`,
                        SK: "PROFILE"
                    },
                    ProjectionExpression: "connectionId"
                });

                const userProfile = await docClient.send(userProfileCommand);
                return {
                    userId,
                    connectionId: userProfile.Item?.connectionId
                };
            } catch (err) {
                console.log(`Failed to get connection for user ${userId}:`, err);
                return { userId, connectionId: null };
            }
        });

        const connections = await Promise.all(connectionPromises);
        const activeConnections = connections.filter(conn => conn.connectionId);

        if (activeConnections.length === 0) {
            console.log("No active connections found for group members");
            return;
        }

        // Prepare the notification message
        const notification = {
            action: isModerated ? "messageModerated" : "newMessage",
            groupName,
            message: messageItem
        };

        // Send notifications to all active connections
        const notificationPromises = activeConnections.map(async (conn) => {
            try {
                const command = new PostToConnectionCommand({
                    ConnectionId: conn.connectionId,
                    Data: JSON.stringify(notification)
                });
                await apiGatewayClient.send(command);
                console.log(`✅ ${isModerated ? 'Moderation' : 'Message'} notification sent to user ${conn.userId}`);
            } catch (err) {
                console.log(`❌ Failed to notify user ${conn.userId} (${conn.connectionId}):`, err.message);

                // If connection is stale, we could clean it up here
                if (err.statusCode === 410) {
                    console.log(`Connection ${conn.connectionId} is stale, should clean up`);
                    // TODO: Remove stale connectionId from user profile
                }
            }
        });

        await Promise.all(notificationPromises);
        console.log(`📢 Sent ${isModerated ? 'moderation' : 'message'} notifications to ${activeConnections.length} active group members`);

    } catch (err) {
        console.error("Failed to notify group members:", err);
        // Don't throw error here as message processing should continue
    }
};
