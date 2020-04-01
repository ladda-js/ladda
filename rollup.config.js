import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
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
    plugins: [typescript({
      tsconfigOverride: {
        compilerOptions: { module: 'ESNext' },
        exclude: ['*.spec.?s', '**/*.spec.?s']
      },
      clean: true
    })]
  }
];
