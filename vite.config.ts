import { defineConfig } from 'vite';
import { node } from '@liuli-util/vite-plugin-node'


export default defineConfig({
	plugins: [
		node({
			entry: './src/main.ts',
			formats: ['cjs'],
			outDir: 'dist'
		})
	],

	build: {
		minify: false,
	}
});
