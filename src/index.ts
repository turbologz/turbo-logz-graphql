import { ApplicationConfig } from '@loopback/core';
import { GraphqlApplication } from './application';

export async function main(options: ApplicationConfig = {}): Promise<GraphqlApplication> {
    const app = new GraphqlApplication(options);

    await app.start();

    console.log(`Server is running on port ${app.options.port}`);
    return app;
}
