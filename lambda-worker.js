import { deserialize } from './lambda.js';

onmessage = e => {
    postMessage(deserialize(e.data).reduce());
    self.close();
}
