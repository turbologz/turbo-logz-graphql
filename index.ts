import { main } from './src';

const port = parseInt(process.env.PORT as any) || 8000;
const wsPort = parseInt(process.env.WS_PORT as any) || 3000;

main({port, ws: {port: wsPort}});
