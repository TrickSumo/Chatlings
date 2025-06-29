import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({ region: "us-east-1" });

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
    MinConfidence: 75,
  });

  try {
    const response = await rekognition.send(command);
    console.log("✅ Moderation labels:", response.ModerationLabels);

    // You can act on results here
    if (response.ModerationLabels.length > 0) {
      console.warn("⚠️ Inappropriate content detected!");
      // mark as flagged, delete, or notify moderators
    }

    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (err) {
    console.error("❌ Rekognition error:", err);
    throw err;
  }
};
