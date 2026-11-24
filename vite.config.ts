import {defineConfig} from 'vite';
// @ts-expect-error Shared dependency-free Node proxy also used by the production server.
import {api} from './proxy.mjs';
export default defineConfig({plugins:[{name:'context-proxy',configureServer(server){server.middlewares.use(api);},configurePreviewServer(server){server.middlewares.use(api);}}]});
