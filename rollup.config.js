import terser from '@rollup/plugin-terser';
import {babel} from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel({
        babelHelpers: 'runtime'
      }),
      terser()
    ],
    output: [
      {
        name: 'createKindeClient',
        file: 'dist/kinde-auth-react.umd.min.js',
        format: 'umd'
      },
      {
        file: 'dist/kinde-auth-react.esm.min.js',
        format: 'es'
      }
    ],
    external: ['react', 'react-dom']
  },
  {
    // path to your declaration files root
    input: 'index.d.ts',
    output: [{file: 'dist/index.d.ts', format: 'es'}],
    plugins: [dts()]
  }
];
