import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/fuelPrice.js',
        format: 'es',
    },
    plugins: [
        typescript(),
        commonjs({extensions: ['.js', '.ts']}),
    ],
};