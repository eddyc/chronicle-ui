import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@mui/material',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled',
  ],
})
