import type { RGB } from "./constants";

const getEmptyMatrix = (size: number): RGB[][] => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => [0, 0, 0] as RGB)
  );
}

export default getEmptyMatrix;