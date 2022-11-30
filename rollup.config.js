import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel({
        babelHelpers: 'runtime'
      })
    ],
    output: [
      {
        name: 'createKindeClient',
        file: pkg.main,
        format: 'umd',
        plugins: [terser()]
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ],
    external: ['react', 'react-dom']
  },
  {
    input: 'index.d.ts',
    output: [{file: 'dist/index.d.ts', format: 'es'}],
    plugins: [dts()]
  }
];
