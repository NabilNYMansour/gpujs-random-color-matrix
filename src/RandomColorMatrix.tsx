import { useEffect, useState } from "react";
import { MAX_LOOP_COUNT, MAX_SIZE, MIN_LOOP_COUNT, MIN_SIZE, type RGB } from "./constants";
import useKernel from "./hooks/useKernal";

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

export default function RandomColorMatrix() {
  const [matrix, setMatrix] = useState<RGB[][]>([]);
  const [size, setSize] = useState<number>(8);
  const [loopCount, setLoopCount] = useState<number>(5000);

  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isGPUMode, setIsGPUMode] = useState<boolean>(true);

  const { createKernel, runKernel } = useKernel();

  const getRandomMatrix = (): RGB[][] => {
    const start = performance.now();
    const result = isGPUMode ? runKernel(loopCount) : runCPU(size, loopCount);
    const end = performance.now();
    setTimeTaken(end - start);
    return result;
  };

  useEffect(() => {
    createKernel(size);
    setMatrix(getRandomMatrix());
  }, [size]);

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Random Color Matrix with GPU.js</h1>

      <div>
        <label className="mr-2">Matrix Size: {size}</label>
        <button
          className="px-2 h-6 w-6 font-bold cursor-pointer bg-blue-500 hover:bg-blue-600"
          onClick={() => setSize((s) => Math.min(MAX_SIZE, s + 1))}
        >
          +
        </button>
        <button
          className="px-2 h-6 w-6 font-bold cursor-pointer bg-red-500 hover:bg-red-600 ml-2"
          onClick={() => setSize((s) => Math.max(MIN_SIZE, s - 1))}
        >
          -
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div>
          <label className="mr-2">Loop Count:</label>
          <input
            className="border px-2 py-1"
            type="number"
            min={MIN_LOOP_COUNT}
            max={MAX_LOOP_COUNT}
            value={loopCount}
            onChange={(e) => setLoopCount(Math.min(MAX_LOOP_COUNT, Math.max(MIN_LOOP_COUNT, Number(e.target.value))))}
          />
        </div>
        <input
          type="range"
          min={MIN_LOOP_COUNT}
          max={MAX_LOOP_COUNT}
          value={loopCount}
          onChange={(e) => setLoopCount(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="mr-2">Mode:</label>
        <select
          value={isGPUMode ? "gpu" : "cpu"}
          onChange={(e) => setIsGPUMode(e.target.value === "gpu")}
          className="p-1 [&>option]:bg-gray-800 [&>option]:cursor-pointer ring-0 outline-0"
        >
          <option value="gpu">GPU</option>
          <option value="cpu">CPU</option>
        </select>
      </div>

      {matrix.length > 0 && (
        <div>
          <button
            className="px-4 py-2 font-bold cursor-pointer bg-green-500 hover:bg-green-600"
            onClick={() => setMatrix(getRandomMatrix())}
          >
            Randomize
          </button>
        </div>
      )}


      <div className="flex flex-col items-center">
        <div>
          Time Taken ({isGPUMode ? "GPU" : "CPU"}): {timeTaken !== null ? `${timeTaken.toFixed(2)} ms` : "N/A"}
        </div>
        <table className="table-auto border-collapse border border-gray-400">
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {row.map((val, j) => (
                  <td key={j} className="border text-center">
                    <div
                      className="w-6 h-6"
                      style={{ backgroundColor: `rgb(${val[0]}, ${val[1]}, ${val[2]})` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
