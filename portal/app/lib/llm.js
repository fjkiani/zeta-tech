
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

/**
 * Agnostic LLM Wrapper
 * Currently defaults to Cohere. Change provider here easily.
 */
export async function generateResponse(message, context, schoolKey) {
    try {
        // Prepare context based on school (can be passed in or derived)
        // Here we use the 'context' string provided by the caller (MissionConsole/API)

        const response = await cohere.chat({
            model: 'command-r-08-2024', // Explicit version
            message: message,
            preamble: context, // System prompt/Persona
            // connectors: [{ id: 'web-search' }] // Optional: enable web search if needed
        });

        return response.text;
    } catch (error) {
        console.error("LLM Error:", error);
        return "System Malfunction. Unable to process request at this time.";
    }
}
