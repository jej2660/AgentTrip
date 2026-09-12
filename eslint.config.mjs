import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
const compat = new FlatCompat({ baseDirectory: fileURLToPath(new URL('.', import.meta.url)) });
export default [
  { ignores: ['.next/**', 'node_modules/**', '_workspace/**', '.superpowers/**', '.impeccable/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
