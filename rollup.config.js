import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

export default {
  input: 'src/main.js',

  plugins: [terser()],
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
  ]
};
