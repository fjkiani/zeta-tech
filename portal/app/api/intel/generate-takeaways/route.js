
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

export async function POST(request) {
    try {
        const { transcript } = await request.json();

        if (!transcript) {
            return Response.json({ error: "Transcript is required" }, { status: 400 });
        }

        if (!process.env.COHERE_API_KEY) {
            return Response.json({ error: "COHERE_API_KEY is missing in server environment." }, { status: 500 });
        }

        // Call Cohere Logic
        const response = await cohere.chat({
            message: `
      You are an expert high school tutor. 
      Read the following video transcript and extract 3-5 "Smart Takeaways".
      
      Rules:
      1. These should be concise, bullet-point style facts.
      2. No intro/outro. Just the bullet points.
      3. Focus on the core educational concepts defined in the text.
      4. Format your response strictly as a list of bullet points starting with "- ".

      TRANSCRIPT:
      ${transcript.substring(0, 15000)} // Limit context window just in case
      `,
            model: "command-r-plus", // or command-r, depending on availability
            temperature: 0.3,
        });

        const text = response.text;

        // Parse into array just in case we want structure later, 
        // but for now we just return the raw text block to append to the markdown.

        return Response.json({
            takeaways: text,
            raw: response
        });

    } catch (error) {
        console.error("Cohere AI Error:", error);
        return Response.json({ error: "AI Generation Failed: " + error.message }, { status: 500 });
    }
}
