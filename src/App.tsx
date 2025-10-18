import React, { useEffect, useState } from "react";
import { GPU } from "gpu.js";

const App: React.FC = () => {
  const [matrix, setMatrix] = useState<number[][] | null>(null);

  useEffect(() => {
    const gpu = new GPU();

    const sumKernel = gpu.createKernel(
      function () {
        return this.thread.x + this.thread.y;
      }
    ).setOutput([10, 10]);

    const result = sumKernel() as number[][];

    const formattedResult = Array.from(result).map((row) =>
      Array.from(row)
    );

    setMatrix(formattedResult);
  }, []);

  return (
    <div>
      <h1>GPU.js + React + TypeScript Demo</h1>
      {matrix ? (
        <table border={1} cellPadding={5}>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j}>{value.toFixed(0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Computing...</p>
      )}
    </div>
  );
};

export default App;
