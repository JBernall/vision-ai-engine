import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import 'dotenv/config';
import { locationRoutes } from './routes/location.routes';


const app = Fastify({
    logger: true
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get('/', async () => {
    return { status: 'OK', message: 'Geo Audio API is running 🚀'};
});
app.register(locationRoutes);
const start = async () => {
    try{
        await app.listen({  port:3000, host: '0.0.0.0'});
        console.log('Servidor corriendo en http://localhost:3000');
    }catch (err){
        app.log.error(err);
        process.exit(1);
    }
};

start();