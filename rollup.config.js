import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'node:module';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser'

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const commonPlugins = [
  typescript({ tsconfig: './tsconfig.json' }),
  commonjs(),
    // terser()
];
export default [
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'createKindeClient',
        file: pkg.main,
        format: 'umd',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [...commonPlugins],
    external: ['react', 'react-dom']
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  }
];
