import type { RGB } from "./constants";

const runCPU = (size: number, loopCount: number): RGB[][] => {
  const result: RGB[][] = [];

  for (let i = 0; i < size; i++) {
    const row: RGB[] = Array.from({ length: size }, () => [0, 0, 0]);
    for (let j = 0; j < size; j++) {
      for (let l = 0; l < loopCount; l++) {
        row[j] = [
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255)
        ];
      }
    }
    result.push(row);
  }

  return result;
}

export default runCPU;