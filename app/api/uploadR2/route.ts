import { upload_to_r2 } from "@/lib/upload-r2";

export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
        return new Response("No file", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await upload_to_r2(
        buffer,
        file.name,
        file.type
    );

    return Response.json({ url });
}
