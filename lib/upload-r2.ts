import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
});

export async function upload_to_r2(
    buffer: Buffer,
    file_name: string,
    content_type: string
): Promise<string> {
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${file_name}`;

    await r2.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: content_type
        })
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
}
