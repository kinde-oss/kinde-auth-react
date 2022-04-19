import {server} from './src/mocks/server.js';
import 'whatwg-fetch';

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
