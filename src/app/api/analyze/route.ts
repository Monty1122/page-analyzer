import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODEL_NAME = "gemini-1.5-flash"; // Or your preferred model

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env.local");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function urlToGenerativePart(url: string, mimeType: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType,
    },
  };
}

export async function POST(request: Request) {
  try {
    const { imageUrl, prompt, mimeType } = await request.json();

    if (!imageUrl || !prompt || !mimeType) {
      return NextResponse.json(
        { error: "Missing imageUrl, prompt, or mimeType in request body" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      // systemInstruction: "You are an expert UI/UX analyzer. Given an image of a web page, provide detailed feedback on its design, usability, and suggest improvements. Focus on clarity, consistency, accessibility, and overall user experience. Format your response in Markdown."
    });

    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096, // Adjust as needed
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const imagePart = await urlToGenerativePart(imageUrl, mimeType);

    const parts = [
      { text: prompt },
      imagePart,
    ];

    const result = await model.generateContent({ 
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings 
    });

    const analysis = result.response.text();
    return NextResponse.json({ analysis });

  } catch (error) {
    console.error("Error in AI analysis:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to analyze image.", details: errorMessage }, { status: 500 });
  }
} 