import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { visionService } from "../services/vision.service";
import { aiService } from "../services/ai.service";

const locationBodySchema = z.object({
    lat: z.number(),
    lng: z.number(),
    heading: z.number(),
    includeAudio: z.boolean().default(false),
});

export async function locationRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/identify',
        {
            schema: { body: locationBodySchema },
        },
        async (request, reply) => {
            const { lat, lng, heading } = request.body;

            const result = await visionService.identifyTarget(lat, lng, heading);

            if (result.found) {
                const aiDescription = await aiService.generateContext(
                    result.place,
                    result.address,
                    result.type
                );

                return {
                    status: 'success',
                    data: {
                        ...result, 
                        ai_description: aiDescription 
                    }
                };
            }

            return {
                status: 'success',
                data: result
            };
        }
    );
}