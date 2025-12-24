import OpenAI from 'openai';

const openai = new OpenAI();

export const aiService = {
    generateContext: async (placeName: string, address: string, type: string) => {
        try {
            console.log(`🤖 AI generating context for: ${placeName}...`);

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a world-class local tour guide (warm, insightful, and strictly factual).
                        Your goal is to enhance the user's surroundings with interesting knowledge.

                        Rules:
                        1. If the place is a Landmark/Monument: Give a fascinating historical fact or architectural detail.
                        2. If the place is a Generic Business (Gym, Academy, Shop, Bank): Do NOT invent history. Instead, briefly comment on its role in local daily life or a fun fact about that industry.
                        3. Tone: Professional, friendly, and concise (max 2 sentences).
                        4. STRICTLY FORBIDDEN: Do not invent names, events, or magical stories. Stick to reality.`
                    },
                    {
                        role: "user",
                        content: `Identify this place: "${placeName}". Type: ${type}. Address: ${address}.`
                    }
                ],
                max_tokens: 150,
                temperature: 0.5, 
            });

            return response.choices[0].message.content || "No context available.";

        } catch (error) {
            console.error("❌ OpenAI Connection Error:", error);
            return `A nice spot, though I don't have specific historical records for it right now.`;
        }
    }
};