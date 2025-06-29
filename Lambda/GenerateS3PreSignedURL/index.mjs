import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const bucketName = process.env.bucketName;
const tableName = process.env.tableName || "Chatlings";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3 = new S3Client();

const createResponse = (statusCode, payload, requestId = null) => {
    return { body: JSON.stringify({ statusCode, ...payload, requestId }) };
}

export const handler = async (event) => {
    const username = event?.requestContext?.authorizer?.username;
    const userId = event?.requestContext?.authorizer?.userId;

    let messageData = {};
    try {
        messageData = JSON.parse(event.body || '{}');
    } catch (err) {
        return createResponse(400, { error: "Invalid JSON in message body" }, null);
    }
    const requestId = messageData?.requestId;
    const fileName = messageData?.fileName;
    const groupName = messageData?.groupName;
    const contentType = "image/png";

    if (!fileName || !groupName) return createResponse(400, { error: "File name and groupName are required!" }, requestId);

    try {

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

        const key = `media/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Metadata: {
                group: groupName,
                username: username,
                uploadTimestamp: new Date().toISOString(),
            }
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 360 });
        return createResponse(200, { url, key }, requestId);

    }
    catch (err) {
        console.error("Error generating pre-signed URL:", err);
        return createResponse(500, { error: "Failed to generate pre-signed URL" }, requestId);
    }

}