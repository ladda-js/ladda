import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ],
    external: ['ladda-fp'],
    plugins: [
      babel({
        babelrc: false,
        plugins: ['external-helpers'],
        presets: [
          ['env', {
            modules: false
          }],
          'stage-1'
        ],
        exclude: ['node_modules/**']
      })
    ]
  }
];

