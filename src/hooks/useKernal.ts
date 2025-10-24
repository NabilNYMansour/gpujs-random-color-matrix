import { useRef } from "react";
import useOnUnmount from "./useOnUnmount";
import useGPU from "./useGPU";
import type { IKernelRunShortcut } from "gpu.js";
import { MAX_LOOP_COUNT, type RGB } from "../utils/constants";

const useKernel = () => {
  const { getGPU } = useGPU();
  const kernelRef = useRef<IKernelRunShortcut | null>(null);

  const createKernel = (n: number) => {
    const gpu = getGPU();

    if (kernelRef.current) {
      kernelRef.current.destroy();
      kernelRef.current = null;
    }

    kernelRef.current = gpu.createKernel(
      function (loopCount: number) {
        let r = 0, g = 0, b = 0;
        for (let l = 0; l < loopCount; l++) {
          r = Math.floor(Math.random() * 255);
          g = Math.floor(Math.random() * 255);
          b = Math.floor(Math.random() * 255);
        }
        return [r, g, b];
      }
    )
      .setOutput([n, n])
      .setLoopMaxIterations(MAX_LOOP_COUNT);
  };

  const runKernel = (loopCount: number): RGB[][] => {
    const kernel = kernelRef.current;
    if (!kernel) return [];

    const result = kernel(loopCount) as RGB[][];
    return result.map((row) => Array.from(row));
  };

  useOnUnmount(() => {
    kernelRef.current?.destroy();
  });

  return { createKernel, runKernel };
}

export default useKernel;