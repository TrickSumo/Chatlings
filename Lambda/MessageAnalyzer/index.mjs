import {
    BedrockRuntimeClient,
    ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const bedrock = new BedrockRuntimeClient({ region: process.env.region || "us-east-1" });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const modelId = process.env.modelId || "amazon.nova-micro-v1:0";
const tableName = process.env.tableName || "Chatlings";


export const handler = async (event) => {

    console.log(JSON.stringify(event));

    for (const record of event.Records) {
        console.log(record.eventName, record.dynamodb.Keys.SK.S);

        if (record.eventName === 'INSERT' && record.dynamodb.Keys.SK.S.includes("MESSAGE#")) {
            const message = record.dynamodb.NewImage.message.S;
            console.log(message);

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
                    } catch (updateErr) {
                        console.error("❌ Failed to update message:", updateErr);
                    }
                }

            } catch (err) {
                console.error("🧠 Bedrock moderation failed:", err);
                console.log("🧠 Bedrock moderation failed:", err.message || err);
            }
        }
    }
};
