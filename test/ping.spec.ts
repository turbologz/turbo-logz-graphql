import 'mocha';
import {main} from '../src';
import {GraphqlApplication} from '../src/application';
import {Client, expect} from '@loopback/testlab';
import {getTestClient} from "./test-helpers";

describe('Ping', () => {

    const graphqlPort = 8000;
    const graphqlWsPort = 3000;
    let client: Client;

    let app: GraphqlApplication;

    beforeEach(async () => {
        app = await main({port: graphqlPort, ws: {port: graphqlWsPort}});
        client = getTestClient();
    });

    afterEach(async () => {
        await app.stop();
    });

    it('should respond to ping', async () => {
        const res = await client.get('/').expect(200);

        expect(res.body).to.eql({message: 'Hello'});
    });
});
