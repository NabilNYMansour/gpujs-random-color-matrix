import { useRef, useEffect, useState } from 'react';
import { GPU } from 'gpu.js';

const CELL_SIZE = 6;

const GameOfLifeGPU: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kernelRef = useRef<any>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array());
  const rafRef = useRef<number | null>(null); // requestAnimationFrame ID
  const lastTickRef = useRef(0);
  const isDrawingRef = useRef(false);
  const drawModeRef = useRef<0 | 1>(1);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [cols, setCols] = useState(128);
  const [rows, setRows] = useState(80);
  const [fps, setFps] = useState(20);
  const [generation, setGeneration] = useState(0);
  const [running, setRunning] = useState(false);

  const idx = (x: number, y: number) => y * cols + x;
  const makeEmptyGrid = () => new Uint8Array(cols * rows);

  const randomizeGrid = () => {
    const g = new Uint8Array(cols * rows);
    for (let i = 0; i < g.length; i++) g[i] = Math.random() > 0.7 ? 1 : 0;
    return g;
  };

  useEffect(() => {
    const gpu = new GPU();

    const kernel = gpu.createKernel(function (grid: number[][]) {
      const x = this.thread.x;
      const y = this.thread.y;
      const w = this.output.x;
      const h = this.output.y;

      const xm1 = (x - 1 + w) % w;
      const xp1 = (x + 1) % w;
      const ym1 = (y - 1 + h) % h;
      const yp1 = (y + 1) % h;

      const sum =
        grid[ym1][xm1] + grid[ym1][x] + grid[ym1][xp1] +
        grid[y][xm1] + grid[y][xp1] +
        grid[yp1][xm1] + grid[yp1][x] + grid[yp1][xp1];

      const self = grid[y][x];
      return (self === 1 && (sum === 2 || sum === 3)) || (self === 0 && sum === 3) ? 1 : 0;
    }, { output: [cols, rows] });

    kernelRef.current = kernel;
    gridRef.current = makeEmptyGrid();

    return () => {
      gpu.destroy();
    }
  }, [cols, rows]);

  const drawGrid = (grid: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f2f2f2';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[idx(x, y)]) {
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  };

  const gridTo2DArray = (grid: Uint8Array) => {
    const arr: number[][] = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) row.push(grid[idx(x, y)]);
      arr.push(row);
    }
    return arr;
  };

  const stepOnce = () => {
    if (!kernelRef.current || !gridRef.current) return;
    const out = kernelRef.current(gridTo2DArray(gridRef.current)) as number[][];
    const next = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) next[idx(x, y)] = out[y][x] ? 1 : 0;
    }
    gridRef.current = next;
    setGeneration((g) => g + 1);
    drawGrid(next);
  };

  useEffect(() => {
    const tick = (time: number) => {
      if (!running) return;
      if (time - lastTickRef.current >= 1000 / fps) {
        stepOnce();
        lastTickRef.current = time;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (running) {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, fps]);

  useEffect(() => {
    gridRef.current = makeEmptyGrid();
    drawGrid(gridRef.current);
  }, [cols, rows]);

  const handleRandomize = () => {
    gridRef.current = randomizeGrid();
    setGeneration(0);
    drawGrid(gridRef.current);
  };

  const handleClear = () => {
    gridRef.current = makeEmptyGrid();
    setGeneration(0);
    drawGrid(gridRef.current);
  };

  const toggleCell = (x: number, y: number, value?: 0 | 1) => {
    if (!gridRef.current) return;
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const i = idx(x, y);
    gridRef.current[i] = value ?? (gridRef.current[i] ? 0 : 1);
  };

  const getCoords = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / CELL_SIZE),
      y: Math.floor((e.clientY - rect.top) / CELL_SIZE),
    };
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number, value: 0 | 1) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      toggleCell(x0, y0, value);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    drawGrid(gridRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCoords(e);
    const last = lastPosRef.current;
    if (!last) {
      toggleCell(x, y, drawModeRef.current);
      drawGrid(gridRef.current);
      lastPosRef.current = { x, y };
      return;
    }
    drawLine(last.x, last.y, x, y, drawModeRef.current);
    lastPosRef.current = { x, y };
  };
  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    drawModeRef.current = gridRef.current[idx(x, y)] ? 0 : 1;
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
    toggleCell(x, y, drawModeRef.current);
    drawGrid(gridRef.current);
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    lastPosRef.current = { x, y };
  };
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.buttons === 0) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      return;
    }
    if (isDrawingRef.current) {
      const { x, y } = getCoords(e);
      lastPosRef.current = { x, y };
    }
  };

  return (
    <div className='flex flex-col items-center'>
      <div className="p-4 max-w-screen-lg mx-auto flex flex-col gap-4">
        <div className='flex items-end gap-4'>
          <div className='flex flex-col gap-2'>
            <label className="block text-sm">Actions:</label>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-800 w-16" onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : 'Start'}
              </button>
              <button className="px-3 py-1 bg-gray-800" onClick={handleRandomize}>
                Randomize
              </button>
              <button className="px-3 py-1 bg-gray-800" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          <div className="bg-gray-800 w-0.5 h-8" />

          <div className='flex flex-col gap-2'>
            <label className="block text-sm">Size:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value) || 1)}
                className="w-20 h-8 p-1 border"
              />
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value) || 1)}
                className="w-20 h-8 p-1 border"
              />
            </div>
          </div>

          <div className="bg-gray-800 w-0.5 h-8" />

          <div className='flex flex-col gap-2'>
            <label className="block text-sm">FPS: {fps}</label>
            <input type="range" className='h-8' min={1} max={180} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className='cursor-crosshair w-fit h-fit'
        />

        <div className="text-sm flex items-center h-full w-full">
          <div>Generation: {generation}</div>
        </div>
      </div>
    </div>
  );
};

export default GameOfLifeGPU;
