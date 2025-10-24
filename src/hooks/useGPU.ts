import { GPU } from "gpu.js";
import { useRef } from "react";
import useOnUnmount from "./useOnUnmount";

const useGPU = () => {
  const gpuRef = useRef<GPU | null>(null);

  const getGPU = () => {
    if (!gpuRef.current) {
      gpuRef.current = new GPU({ mode: "gpu" });
    }
    return gpuRef.current;
  };

  useOnUnmount(() => {
    gpuRef.current?.destroy();
  });

  return { getGPU };
}

export default useGPU;