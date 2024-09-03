import { Ollama } from "ollama";
import OpenAI from "openai";
import { DESCRIBE_IMAGES_API, DESCRIBE_IMAGES_MAX_TOKENS, DESCRIBE_IMAGES_PROMPT, DESCRIBE_IMAGES_TEMPERATURE, OLLAMA_MODEL, OLLAMA_URL, OPENAI_API_KEY, OPENAI_MODEL } from "../config";
import { readFile } from "fs/promises";
import sharp from "sharp";

export const describeWithOllama = async (image: Buffer) => {
    const client = new Ollama({ host: OLLAMA_URL });

    const response = await client.chat({
        model: OLLAMA_MODEL,
        options: {
            temperature: DESCRIBE_IMAGES_TEMPERATURE,
        },
        messages: [
            { role: "system", content: DESCRIBE_IMAGES_PROMPT },
            { role: "user", images: [image], content: "Describe this image." },
        ]
    });
    return response.message.content;
}

export const describeWithOpenAI = async (image: Buffer) => {
    const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });
    const response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: DESCRIBE_IMAGES_MAX_TOKENS,
        temperature: DESCRIBE_IMAGES_TEMPERATURE,
        messages: [
            { role: "system", content: DESCRIBE_IMAGES_PROMPT },
            { role: "user", content: [{ type: "text", text: "Describe the following image in a detailed but concise manner." }, { type: "image_url", image_url: { url: imageToBase64URL(image) } }] },
        ]
    })
    return response.choices[0].message.content;
}

export const describeImage = async (filePath: string) => {
    const image = await loadImage(filePath);
    if (DESCRIBE_IMAGES_API === "ollama") {
        return describeWithOllama(image);
    } else {
        return describeWithOpenAI(image);
    }
    return "";
}

export const loadImage = async (filePath: string) => {
    return processImage(filePath);
}

async function processImage(imagePath: string): Promise<Buffer> {
    try {
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const maxDimension = 1024;

        // Check if the image needs to be resized
        let resizedImage = image;
        if (metadata.width && metadata.height && (metadata.width > maxDimension || metadata.height > maxDimension)) {
            resizedImage = image.resize({
                width: Math.min(metadata.width, maxDimension),
                height: Math.min(metadata.height, maxDimension),
                fit: sharp.fit.inside,
                withoutEnlargement: true
            });
        }

        // Convert the image to JPG
        const jpgBuffer = await resizedImage.jpeg().toBuffer();

        return jpgBuffer;
    } catch (error) {
        console.error('Error processing the image:', error);
        throw new Error('Failed to process the image.');
    }
}

export const imageToBase64URL = (input: Buffer) => {
    return `data:image/jpeg;base64,${input.toString('base64')}`;
}

