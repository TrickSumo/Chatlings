import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const tableName = process.env.tableName || "Chatlings";
const region = process.env.AWS_REGION || "us-east-1";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const rekognition = new RekognitionClient({ region });
const s3 = new S3Client({ region });

export const handler = async (event) => {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log("🔍 Analyzing:", { bucket, key });

    const command = new DetectModerationLabelsCommand({
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: key,
            },
        },
        MinConfidence: 30,
    });

    try {
        // Get object metadata to extract group and user information
        const headCommand = new HeadObjectCommand({
            Bucket: bucket,
            Key: key
        });
        const headResponse = await s3.send(headCommand);
        const metadata = headResponse.Metadata || {};
        
        const groupName = metadata.group;
        const username = metadata.username;
        const uploadTimestamp = metadata.uploadtimestamp;
        
        console.log("📋 Metadata extracted:", { groupName, username, uploadTimestamp });

        let message = "";
        let type = "";
        const response = await rekognition.send(command);
        console.log("✅ Moderation labels:", response.ModerationLabels);        if (response.ModerationLabels.length > 0) {
            console.warn("⚠️ Inappropriate content detected!");
            message = "Image removed for violation of community guidelines.";
            type = "txt";
            
            // Delete the inappropriate image from S3
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: key
                });
                await s3.send(deleteCommand);
                console.log("🗑️ Inappropriate image deleted from S3:", key);
            } catch (deleteError) {
                console.error("❌ Error deleting image from S3:", deleteError);
            }
            
        } else {
            console.log("✅ No inappropriate content detected.");
            message = key;
            type = "img";
        }

        const putItem = {
            PK: `GROUP#${groupName}`,
            SK: `MESSAGE#${uploadTimestamp || new Date().toISOString()}`, // Use upload timestamp or current time
            message,
            sentBy: username,
            sentAt: uploadTimestamp || new Date().toISOString(),
            type: type,
            ...(response.ModerationLabels.length > 0 && { moderation: "flagged" })
        };
        
        const putCommand = new PutCommand({
            TableName: tableName,
            Item: putItem,
        });
        
        const putResponse = await docClient.send(putCommand);
        
        if (putResponse?.$metadata?.httpStatusCode) {
            console.log("💾 Message saved to DynamoDB:", putItem);
        }

    } catch (err) {
        console.error("❌ Rekognition error:", err);
    }
};
