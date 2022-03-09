import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      presets: ['@babel/preset-react'],
      babelHelpers: 'runtime'
    }),
    terser()
  ],
  output: [
    {
      name: 'createKindeClient',
      file: pkg.browser,
      format: 'umd'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  external: ['react', 'react-dom']
};
