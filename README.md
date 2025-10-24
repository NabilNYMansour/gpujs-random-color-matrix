
# GPU.JS Random Color Matrix

A tiny Vite + React + TypeScript demo that uses gpu.js to generate random colors on the GPU and renders it in a React component.
This [video](https://www.youtube.com/watch?v=B7SE15mzsVs) goes through the code in more details

## Quick start

Requirements: Node.js and a package manager (pnpm recommended, but npm/yarn will work).

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

## How it works

1. A GPU instance is created via `gpu.js` in `useGPU`.
2. A kernel function is configured in `useKernel` and executed to produce color values.
3. The resulting matrix is used by `RandomColorMatrix` to render a color grid.
