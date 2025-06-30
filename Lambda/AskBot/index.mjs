import {
    BedrockRuntimeClient,
    ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const bedrock = new BedrockRuntimeClient({ region: process.env.region || "us-east-1" });

const tableName = process.env.tableName || "Chatlings";
const modelId = process.env.modelId || "amazon.nova-micro-v1:0";

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {

    const userId = event?.requestContext?.authorizer?.userId;
    const username = event?.requestContext?.authorizer?.username;

    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        return createResponse(400, { error: "Invalid JSON in message body" }, null);
    }
    const requestId = messageData?.requestId || null;

    const groupName = messageData?.groupName;
    const message = messageData?.message;

    if (!groupName || message === undefined || message === null) {
        return createResponse(400, { error: "Group name and message are required!" }, requestId);
    }

    try {
        // Check if user is member of the group
        const getCommand = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `MEMBER#${groupName}`,
            },
        });

        const response = await docClient.send(getCommand);

        if (!response.Item) {
            return createResponse(403, { error: "User is not a member of the group!" }, requestId);
        }

        // askBot itegration
        const converseCommand = new ConverseCommand({
            modelId: modelId,
            system: [
                {
                    text: `You are a friendly helpbot named askbot for group of kids (9years old). Reply queries in plaintext in a friendly way.
                                        Example: 
        
                                        Input:- This is a great day!
                                        Output:- yes indeed, it is a great day! Let's make the most of it!🌿
        
                                        Input:- What is programming?
                                        Output:- Programming is like giving instructions to a computer to make it do things! It's like telling a robot what to do! 🤖
        
                                        Input:- How to make a cake?
                                        Output:- Making a cake is fun! You need flour, sugar, cream, and some other ingredients. Mix them together, bake it in the oven, and you have a yummy cake! 🍰`,
                }],
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: message
                        }
                    ]
                }
            ],
            inferenceConfig: {
                temperature: 0.1,
                topP: 1,
                maxTokens: 600
            }
        });

        let converseResponse = ""
        try {
            converseResponse = await bedrock.send(converseCommand);
        }
        catch (err) {
            console.error("Error during ConverseCommand:", err);
        }
        const aiResponse = converseResponse.output?.message?.content?.[0];

        console.log("AI Response:", aiResponse);


        // Send human message to the group
        const humanMessageTimestamp = new Date().toISOString();
        const humanMessageItem = {
            PK: `GROUP#${groupName}`,
            SK: `MESSAGE#${humanMessageTimestamp}`, // Unique message ID based on timestamp
            message,
            sentBy: username,
            sentAt: humanMessageTimestamp,
            type: "txt"
        };
        const humanMessageCommand = new PutCommand({
            TableName: tableName,
            Item: humanMessageItem,
        });

        // Send AI response to the group (slightly later timestamp to ensure order)
        const aiMessageTimestamp = new Date(Date.now() + 1).toISOString();
        const aiMessageItem = {
            PK: `GROUP#${groupName}`,
            SK: `MESSAGE#${aiMessageTimestamp}`,
            message: aiResponse?.text || "Sorry, I couldn't generate a response.",
            sentBy: "askbot",
            sentAt: aiMessageTimestamp,
            type: "txt"
        };
        const aiMessageCommand = new PutCommand({
            TableName: tableName,
            Item: aiMessageItem,
        });

        // Send both messages
        const [humanResponse, aiPutResponse] = await Promise.all([
            docClient.send(humanMessageCommand),
            docClient.send(aiMessageCommand)
        ]);

        if (humanResponse?.$metadata?.httpStatusCode) {
            return createResponse(200, {
                message: humanMessageItem
            }, requestId);
        }
    }
    catch (err) {
        console.log("Failed to send message", err);
        return createResponse(500, { error: "Failed to send message to group" }, requestId);
    }
}