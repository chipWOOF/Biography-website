import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* unchanged helpers/configs */
const GRID_SIZE = 8;
const DEFAULT_PIECE_KEYS = ["Square", "Line", "L-Shape"];

const PIECE_DEFINITIONS: Record<string, { name: string; shape: number[][] }> = {
  Square: { name: "Square", shape: [[0, 0], [0, 0]] },
  Line: { name: "Line", shape: [[0, 0, 0, 0]] },
  "L-Shape": { name: "L-Shape", shape: [[0, 0], [0, 0], [0, 0]] },
  T: { name: "T", shape: [[0,0,0],[0,0,0]] },
  Single: { name: "Single", shape: [[0]] },
};

function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}
function cloneGrid(g: number[][]) { return g.map(r => [...r]); }
function clearLines(grid: number[][]) {
  const newGrid = cloneGrid(grid);
  let cleared = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    if (newGrid[i].every(c => c === 1)) { newGrid[i] = Array(GRID_SIZE).fill(0); cleared++; }
  }
  for (let j = 0; j < GRID_SIZE; j++) {
    let full = true;
    for (let i = 0; i < GRID_SIZE; i++) { if (newGrid[i][j] !== 1) { full = false; break; } }
    if (full) { for (let i = 0; i < GRID_SIZE; i++) newGrid[i][j] = 0; cleared++; }
  }
  return [newGrid, cleared] as const;
}
function canPlaceOnGrid(grid: number[][], shape: number[][], r: number, c: number) {
  const shapeH = shape.length; const shapeW = shape[0].length;
  if (r + shapeH > GRID_SIZE || c + shapeW > GRID_SIZE) return false;
  for (let i = 0; i < shapeH; i++) for (let j = 0; j < shapeW; j++)
    if (shape[i][j] === 1 && grid[r + i][c + j] === 1) return false;
  return true;
}
function applyShape(grid: number[][], shape: number[][], r: number, c: number) {
  const g = cloneGrid(grid);
  const shapeH = shape.length; const shapeW = shape[0].length;
  for (let i = 0; i < shapeH; i++) for (let j = 0; j < shapeW; j++) if (shape[i][j] === 1) g[r + i][c + j] = 1;
  const [clearedGrid, linesCleared] = clearLines(g);
  return { grid: clearedGrid, linesCleared };
}
function getAllValidPlacements(grid: number[][], shape: number[][]) {
  const places: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++)
    if (canPlaceOnGrid(grid, shape, r, c)) places.push({ r, c });
  return places;
}
function permute(arr: number[]) {
  if (arr.length === 0) return [[]] as number[][];
  const results: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = permute([...arr.slice(0,i), ...arr.slice(i+1)]);
    for (const r of rest) results.push([arr[i], ...r]);
  }
  return results;
}

/* new: findBestSequence accepts piecesShapes array (each piece is { name?, shape }) */
function findBestSequence(initialGrid: number[][], piecesShapes: { name?: string; shape: number[][] }[]) {
  const pieces = piecesShapes.map((p, idx) => ({ ...p, idx }));
  const orderPerms = permute(pieces.map((_, i) => i));
  let best: { totalLinesCleared: number; steps: any[] } | null = null;

  for (const perm of orderPerms) {
    function dfs(depth: number, currentGrid: number[][], chosenSteps: any[], totalCleared: number) {
      if (depth === perm.length) {
        if (!best || totalCleared > best.totalLinesCleared) {
          best = { totalLinesCleared: totalCleared, steps: chosenSteps.map(s => ({ ...s })) };
        }
        return;
      }
      const pieceIndex = perm[depth];
      const piece = pieces[pieceIndex];
      const placements = getAllValidPlacements(currentGrid, piece.shape);
      if (placements.length === 0) {
        dfs(depth + 1, currentGrid, [...chosenSteps, { pieceName: piece.name ?? `p${piece.idx}`, r: null, c: null, linesCleared: 0, boardAfter: cloneGrid(currentGrid) }], totalCleared);
      } else {
        for (const p of placements) {
          const result = applyShape(currentGrid, piece.shape, p.r, p.c);
          dfs(depth + 1, result.grid, [...chosenSteps, { pieceName: piece.name ?? `p${piece.idx}`, r: p.r, c: p.c, linesCleared: result.linesCleared, boardAfter: result.grid }], totalCleared + result.linesCleared);
        }
      }
    }
    dfs(0, initialGrid, [], 0);
  }

  if (!best) return { totalLinesCleared: 0, steps: [] };
  return best;
}

/* UI: piece editor - small fixed 5x5 editor, returns shape trimmed to minimal bounding box */
function trimShape(grid4: number[][]) {
  // grid4 is 5x5 array (editor grid)
  const rows = grid4.length, cols = grid4[0].length;
  let minR = rows, maxR = -1, minC = cols, maxC = -1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid4[r][c]) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (c < minC) minC = c; if (c > maxC) maxC = c;
  }
  if (maxR < 0) return [[0]]; // empty -> single-zero (won't place)
  const out = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) row.push(grid4[r][c]);
    out.push(row);
  }
  return out;
}

const MiniEditor: React.FC<{
  grid4: number[][],
  onChange: (g: number[][]) => void,
  name?: string,
}> = ({ grid4, onChange, name }) => {
  return (
    <div>
      <div className="text-sm mb-2">{name}</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(5, 1rem)` }}>
        {grid4.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => {
                const copy = grid4.map(rr => rr.slice());
                copy[r][c] = copy[r][c] ? 0 : 1;
                onChange(copy);
              }}
              className={`w-4 h-4 border ${cell ? "bg-primary" : "bg-muted"} cursor-pointer`}
            />
          ))
        )}
      </div>
    </div>
  );
};

/* Component */
export const Bbsolver = () => {
  const [grid, setGrid] = useState<number[][]>(() => {
    try { const s = localStorage.getItem("bb-grid"); return s ? JSON.parse(s) : makeEmptyGrid(); } catch { return makeEmptyGrid(); }
  });

  // pieces now are custom objects { name, grid4: editor grid (5x5) }
  const makeDefaultEditors = () => DEFAULT_PIECE_KEYS.map(k => {
    const shape = PIECE_DEFINITIONS[k].shape;
    // create a 5x5 editor grid with shape top-left aligned
    const g = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (let r = 0; r < shape.length && r < 5; r++) {
      for (let c = 0; c < (shape[r]?.length ?? 0) && c < 5; c++) {
        g[r][c] = shape[r][c] || 0;
      }
    }
    return { name: PIECE_DEFINITIONS[k].name, grid4: g };
  });

  const [editors, setEditors] = useState<{ name: string; grid4: number[][] }[]>(() => {
    try {
      const s = localStorage.getItem("bb-custom-pieces");
      if (s) return JSON.parse(s);
      return makeDefaultEditors();
    } catch { return makeDefaultEditors(); }
  });

  const [solution, setSolution] = useState<{ totalLinesCleared: number; steps: any[] } | null>(() => {
    try { const s = localStorage.getItem("bb-solution"); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  useEffect(() => { try { localStorage.setItem("bb-grid", JSON.stringify(grid)); } catch {} }, [grid]);
  useEffect(() => { try { localStorage.setItem("bb-custom-pieces", JSON.stringify(editors)); } catch {} }, [editors]);
  useEffect(() => { try { localStorage.setItem("bb-solution", JSON.stringify(solution)); } catch {} }, [solution]);

  function toggleCell(r: number, c: number) {
    setGrid(prev => { const g = cloneGrid(prev); g[r][c] = g[r][c] ? 0 : 1; return g; });
    setSolution(null);
  }
  function clearBoard() { setGrid(makeEmptyGrid()); setSolution(null); }
  function resetAll() {
    setGrid(makeEmptyGrid());
    setEditors(makeDefaultEditors());
    setSolution(null);
    try {
      localStorage.removeItem("bb-grid");
      localStorage.removeItem("bb-custom-pieces");
      localStorage.removeItem("bb-solution");
    } catch {}
  }

  function runSolver() {
    const piecesShapes = editors.slice(0,3).map(e => ({ name: e.name, shape: trimShape(e.grid4) }));
    const result = findBestSequence(cloneGrid(grid), piecesShapes);
    setSolution(result);
  }

  // apply all steps at once (apply final boardAfter of last step)
  function applyAllSteps() {
    if (!solution || !solution.steps || solution.steps.length === 0) return;
    const last = solution.steps[solution.steps.length - 1];
    setGrid(cloneGrid(last.boardAfter));
    // clear solution after applying
    setSolution(null);
  }

  const previewBoards = useMemo(() => {
    if (!solution || !solution.steps) return [];
    return solution.steps.slice(0,3).map(s => s.boardAfter);
  }, [solution]);

  const stepCount = solution?.steps?.length ?? 0;
  const totalLines = solution?.totalLinesCleared ?? 0;

  return (
    <section id="blockblast" className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">BlockBlast Solver (custom pieces)</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Create/save up to 3 custom pieces (5x5 editors). Run solver and preview three result boards at once, then Apply Changes.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto p-4">
          <CardHeader>
            <CardTitle className="text-xl">Board</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: main board */}
              <div>
                <div className="grid gap-1 bg-transparent" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}>
                  {grid.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => toggleCell(r, c)}
                        className={`w-8 h-8 rounded-md border border-border cursor-pointer transition-all ${cell ? "bg-primary" : "bg-muted"}`}
                      />
                    ))
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <Button onClick={clearBoard} variant="outline">Clear Board</Button>
                  <Button onClick={resetAll} variant="ghost">Reset All</Button>
                </div>
              </div>

              {/* Right: editors and solver */}
              <div className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Edit 3 Pieces</h3>
                    <div className="flex gap-4 mt-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <MiniEditor
                            name={`Piece ${i+1}`}
                            grid4={editors[i]?.grid4 ?? Array.from({ length: 5 }, () => Array(5).fill(0))}
                            onChange={(g) => setEditors(prev => {
                              const copy = prev.map(p => ({ ...p, grid4: p.grid4.map(r => r.slice()) }));
                              copy[i] = { name: copy[i]?.name ?? `Piece ${i+1}`, grid4: g };
                              return copy;
                            })}
                          />
                          <div className="mt-2 text-sm text-muted-foreground">{editors[i]?.name}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => {
                        // quick save to localStorage happens via effect; but allow rename
                        setEditors(prev => prev.map((p, idx) => ({ ...p, name: p.name || `Piece ${idx+1}` })));
                      }}>Save Pieces</Button>
                      <Button onClick={() => {
                        setEditors(makeDefaultEditors());
                      }} variant="ghost">Reset Editors</Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={runSolver}>Run Solver</Button>
                    <div className="text-sm text-muted-foreground">
                      {solution ? `Best total lines cleared: ${totalLines}` : "Solver not run yet"}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Preview: boards after each placement (three shown)</h4>

                    {solution && stepCount > 0 ? (
                      <>
                        <div className="flex gap-4">
                          {previewBoards.map((b, idx) => (
                            <div key={idx} className="p-2 bg-muted rounded">
                              <div className="mb-1 text-sm">Step {idx+1}: {solution.steps[idx]?.pieceName ?? solution.steps[idx]?.pieceKey ?? "—"}</div>
                              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1.25rem)` }}>
                                {b.map((row, r) =>
                                    row.map((cell, c) => {
                                        let previewHighlight = false;
                                        const step = solution?.steps?.[idx]; // idx corresponds to this step preview
                                        if (step && step.r !== null) {
                                            const pieceShape = PIECE_DEFINITIONS[step.pieceName]?.shape ?? step.shape ?? [[]];
                                            const pr = r - step.r;
                                            const pc = c - step.c;
                                            if (pr >= 0 && pr < pieceShape.length && pc >= 0 && pc < pieceShape[0].length) {
                                                if (pieceShape[pr][pc] === 1 && grid[r][c] === 0) previewHighlight = true;
                                            }
                                        }
                                        const bg = cell ? "bg-primary" : previewHighlight ? "bg-green-400/60" : "bg-muted";
                                        return <div key={`${r}-${c}`} className={`w-5 h-5 rounded-sm border ${bg}`} />;
                                    })
                                )}
                                </div>
                              <div className="mt-1 text-sm">Cleared: {solution.steps[idx]?.linesCleared ?? 0}</div>
                            </div>
                          ))}
                          {/* if fewer than 3 steps show placeholders */}
                          {Array.from({ length: Math.max(0, 3 - previewBoards.length) }).map((_, i) => (
                            <div key={`ph-${i}`} className="p-2 bg-muted rounded text-sm flex items-center justify-center w-36 h-36">No step</div>
                          ))}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button onClick={applyAllSteps} variant="outline">Apply Changes (All Steps)</Button>
                          <div className="text-sm">Steps: {stepCount}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No solution available — run the solver after editing pieces.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

