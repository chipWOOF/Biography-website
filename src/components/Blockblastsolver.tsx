import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * BlockBlastSolver.jsx
 *
 * - GRID_SIZE: 8
 * - Users toggle board cells to match their in-game board.
 * - Choose 3 pieces from a dropdown (no rotation).
 * - Run solver: finds optimal sequence of placements (all permutations + all placements).
 * - Manual stepper to preview steps; "Apply Step" commits the selected step to the real board and persists to localStorage.
 *
 * Persistence keys:
 * - "bb-grid"    : current board (8x8)
 * - "bb-pieces"  : current 3 pieces (array of shape names)
 * - "bb-final"   : last final board after a full apply (optional)
 * - "bb-solution": cached solution steps (for preview, optional)
 */

// ---- Config ----
const GRID_SIZE = 8;

// define piece shapes (no rotation allowed)
const PIECE_DEFINITIONS = {
  Square: { name: "Square", shape: [[1, 1], [1, 1]] },
  Line: { name: "Line", shape: [[1, 1, 1, 1]] },
  "L-Shape": { name: "L-Shape", shape: [[1, 0], [1, 0], [1, 1]] },
  T: { name: "T", shape: [[1,1,1],[0,1,0]] },
  Single: { name: "Single", shape: [[1]] },
};

const DEFAULT_PIECE_KEYS = ["Square", "Line", "L-Shape"];

function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneGrid(g) {
  return g.map(r => [...r]);
}

function clearLines(grid) {
  // returns [newGrid, linesCleared]
  const newGrid = cloneGrid(grid);
  let cleared = 0;

  // rows
  for (let i = 0; i < GRID_SIZE; i++) {
    if (newGrid[i].every(c => c === 1)) {
      newGrid[i] = Array(GRID_SIZE).fill(0);
      cleared++;
    }
  }

  // columns
  for (let j = 0; j < GRID_SIZE; j++) {
    let full = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i][j] !== 1) { full = false; break; }
    }
    if (full) {
      for (let i = 0; i < GRID_SIZE; i++) newGrid[i][j] = 0;
      cleared++;
    }
  }

  return [newGrid, cleared];
}

function canPlaceOnGrid(grid, shape, r, c) {
  const shapeH = shape.length;
  const shapeW = shape[0].length;
  if (r + shapeH > GRID_SIZE || c + shapeW > GRID_SIZE) return false;
  for (let i = 0; i < shapeH; i++) {
    for (let j = 0; j < shapeW; j++) {
      if (shape[i][j] === 1 && grid[r + i][c + j] === 1) return false;
    }
  }
  return true;
}

function applyShape(grid, shape, r, c) {
  const g = cloneGrid(grid);
  const shapeH = shape.length;
  const shapeW = shape[0].length;
  for (let i = 0; i < shapeH; i++) {
    for (let j = 0; j < shapeW; j++) {
      if (shape[i][j] === 1) g[r + i][c + j] = 1;
    }
  }
  const [clearedGrid, linesCleared] = clearLines(g);
  return { grid: clearedGrid, linesCleared };
}

function getAllValidPlacements(grid, shape) {
  const places = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlaceOnGrid(grid, shape, r, c)) places.push({ r, c });
    }
  }
  return places; // may be empty
}

/**
 * Search for best sequence:
 * - piecesKeys: array of 3 keys (strings) referencing PIECE_DEFINITIONS
 * - returns { totalLinesCleared, steps } where steps is array of { pieceKey, r, c, linesCleared, boardAfter }
 *
 * Approach: brute-force search:
 * - treat pieces as distinct by index (so duplicates allowed)
 * - try all orderings (permutations of indices) -> for each ordering, recursively try all placements for piece 1,
 *   then for piece 2 (on boardAfter1), then piece 3 -> pick sequence with max total lines cleared.
 */
function findBestSequence(initialGrid, piecesKeys) {
  // create list of piece objects by index to keep duplicates distinct
  const pieces = piecesKeys.map((k, idx) => ({ key: k, shape: PIECE_DEFINITIONS[k].shape, idx }));

  // generate permutations of indices [0,1,2] (6 permutations)
  const orderPerms = permute([0,1,2]);

  let best = null;

  for (const perm of orderPerms) {
    // recursive DFS through placements
    function dfs(depth, currentGrid, chosenSteps, totalCleared) {
      if (depth === perm.length) {
        if (!best || totalCleared > best.totalLinesCleared) {
          best = {
            totalLinesCleared: totalCleared,
            steps: chosenSteps.map(s => ({ ...s })) // clone
          };
        }
        return;
      }
      const pieceIndex = perm[depth];
      const piece = pieces[pieceIndex];
      const placements = getAllValidPlacements(currentGrid, piece.shape);
      // If there are no placements, we can still proceed (skip placing) — but that's not helpful, so treat as fail
      if (placements.length === 0) {
        // treat as zero-placement: still continue with same grid but no lines gained
        dfs(depth + 1, currentGrid, [...chosenSteps, { pieceKey: piece.key, r: null, c: null, linesCleared: 0, boardAfter: cloneGrid(currentGrid) }], totalCleared);
      } else {
        for (const p of placements) {
          const result = applyShape(currentGrid, piece.shape, p.r, p.c);
          dfs(depth + 1, result.grid, [...chosenSteps, { pieceKey: piece.key, r: p.r, c: p.c, linesCleared: result.linesCleared, boardAfter: result.grid }], totalCleared + result.linesCleared);
        }
      }
    }

    dfs(0, initialGrid, [], 0);
  }

  // If best is null (no placements at all), return empty steps
  if (!best) return { totalLinesCleared: 0, steps: [] };
  // best.steps is steps in the order of that permutation
  return best;
}

// helper: permutations of array (returns array of arrays)
function permute(arr) {
  if (arr.length === 0) return [[]];
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = permute([...arr.slice(0,i), ...arr.slice(i+1)]);
    for (const r of rest) results.push([arr[i], ...r]);
  }
  return results;
}

// ---- Component ----
export const Bbsolver = () => {
  // load grid from localStorage or make empty
  const [grid, setGrid] = useState(() => {
    try { const s = localStorage.getItem("bb-grid"); return s ? JSON.parse(s) : makeEmptyGrid(); }
    catch { return makeEmptyGrid(); }
  });

  // pieces are stored as keys (strings). Allow user to pick up to 3.
  const [pieces, setPieces] = useState(() => {
    try { const s = localStorage.getItem("bb-pieces"); return s ? JSON.parse(s) : DEFAULT_PIECE_KEYS; }
    catch { return DEFAULT_PIECE_KEYS; }
  });

  // solver results and stepper state
  const [solution, setSolution] = useState(() => {
    try { const s = localStorage.getItem("bb-solution"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [previewIndex, setPreviewIndex] = useState(0); // which step we are previewing
  const [appliedStepCount, setAppliedStepCount] = useState(() => {
    try { const s = localStorage.getItem("bb-applied-count"); return s ? Number(s) : 0; }
    catch { return 0; }
  });
  const availablePieceKeys = useMemo(() => Object.keys(PIECE_DEFINITIONS), []);

  // persist grid/pieces/solution/appliedStepCount changes
  useEffect(() => {
    try { localStorage.setItem("bb-grid", JSON.stringify(grid)); } catch {}
  }, [grid]);

  useEffect(() => {
    try { localStorage.setItem("bb-pieces", JSON.stringify(pieces)); } catch {}
  }, [pieces]);

  useEffect(() => {
    try { localStorage.setItem("bb-solution", JSON.stringify(solution)); } catch {}
  }, [solution]);

  useEffect(() => {
    try { localStorage.setItem("bb-applied-count", String(appliedStepCount)); } catch {}
  }, [appliedStepCount]);

  // toggle a cell (only on real board)
  function toggleCell(r, c) {
    setGrid(prev => {
      const g = cloneGrid(prev);
      g[r][c] = g[r][c] ? 0 : 1;
      return g;
    });
    // reset solution preview when board changed manually
    setSolution(null);
    setPreviewIndex(0);
    setAppliedStepCount(0);
  }

  function clearBoard() {
    setGrid(makeEmptyGrid());
    setSolution(null);
    setPreviewIndex(0);
    setAppliedStepCount(0);
  }

  // change one of the 3 piece selectors
  function setPieceAt(index, key) {
    setPieces(prev => {
      const copy = [...prev];
      copy[index] = key;
      return copy;
    });
    setSolution(null);
    setPreviewIndex(0);
    setAppliedStepCount(0);
  }

  // run solver: find best sequence for current grid and current pieces
  function runSolver() {
    // ensure pieces length is 3
    const keys = pieces.slice(0,3);
    const result = findBestSequence(cloneGrid(grid), keys);
    // result.steps is an array of steps in the selected order
    setSolution(result);
    setPreviewIndex(0);
    // do not auto-apply steps; user must apply manually
  }

  // Preview helpers
  const previewBoard = useMemo(() => {
    if (!solution || !solution.steps || solution.steps.length === 0) return null;
    // preview of board after step at previewIndex (0-based; previewIndex=0 => after first step)
    const idx = Math.max(0, Math.min(solution.steps.length - 1, previewIndex));
    return solution.steps[idx].boardAfter;
  }, [solution, previewIndex]);

  // Apply the current preview step to the real board (commit)
  function applyPreviewStep() {
    if (!solution || !solution.steps || solution.steps.length === 0) return;
    const idx = previewIndex;
    const step = solution.steps[idx];
    if (!step) return;
    // If the step has r===null (no placement), still mark as applied (no board change)
    const newBoard = step.r === null ? cloneGrid(grid) : cloneGrid(step.boardAfter);
    setGrid(newBoard);
    // mark that one more step applied: appliedStepCount increments only if applying the next unapplied step in order
    // For simplicity, increment appliedStepCount to reflect how many steps have been applied (clamp)
    setAppliedStepCount(prev => {
      const next = Math.min(solution.steps.length, prev + 1);
      return next;
    });
    // If we've applied all steps, optionally clear pieces (they were consumed)
    // Keep pieces unchanged, but you might want to reset pieces to default for next round.
  }

  // Reset everything (clear grid and pieces and solution)
  function resetAll() {
    setGrid(makeEmptyGrid());
    setPieces(DEFAULT_PIECE_KEYS);
    setSolution(null);
    setPreviewIndex(0);
    setAppliedStepCount(0);
    try {
      localStorage.removeItem("bb-grid");
      localStorage.removeItem("bb-pieces");
      localStorage.removeItem("bb-solution");
      localStorage.removeItem("bb-applied-count");
    } catch {}
  }

  // UI small helpers
  const stepCount = solution?.steps?.length ?? 0;
  const totalLines = solution?.totalLinesCleared ?? 0;

  return (
    <section id="blockblast" className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">BlockBlast Solver</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Toggle cells to match your game board. Choose the 3 pieces, run the solver, preview steps and apply them manually.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto p-4">
          <CardHeader>
            <CardTitle className="text-xl">Board</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: board */}
              <div>
                <div
                  className="grid gap-1 bg-transparent"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}
                >
                  {grid.map((row, r) =>
                    row.map((cell, c) => {
                      // highlight if preview shows piece covering this cell
                      let previewHighlight = false;
                      if (previewBoard) {
                        // previewBoard same size as grid; 1 => will be filled after that step
                        if (previewBoard[r][c] === 1 && grid[r][c] === 0) previewHighlight = true;
                      }
                      const bg = cell ? "bg-primary" : previewHighlight ? "bg-green-400/60" : "bg-muted";
                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => toggleCell(r, c)}
                          className={`w-8 h-8 rounded-md border border-border cursor-pointer transition-all ${bg}`}
                        />
                      );
                    })
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <Button onClick={clearBoard} variant="outline">Clear Board</Button>
                  <Button onClick={resetAll} variant="ghost">Reset All</Button>
                </div>
              </div>

              {/* Right: controls & pieces */}
              <div className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Select 3 Pieces (no rotation)</h3>
                    <div className="flex gap-3 mt-2">
                      {[0,1,2].map(i => (
                        <div key={i} className="flex flex-col items-center">
                          <select
                            value={pieces[i] ?? ""}
                            onChange={(e) => setPieceAt(i, e.target.value)}
                            className="px-3 py-2 rounded border"
                          >
                            {availablePieceKeys.map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                          <div className="mt-2 text-sm text-muted-foreground">{pieces[i]}</div>

                          {/* shape preview */}
                          <div className="mt-2 grid gap-1"
                               style={{ gridTemplateColumns: `repeat(${PIECE_DEFINITIONS[pieces[i]].shape[0].length}, 0.75rem)`}}>
                            {PIECE_DEFINITIONS[pieces[i]].shape.flat().map((v, idx) => (
                              <div key={idx} className={`w-3 h-3 ${v ? "bg-primary" : "bg-muted"}`} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={runSolver} disabled={pieces.length < 3}>Run Solver</Button>
                    <div className="text-sm text-muted-foreground">
                      {solution ? `Best total lines cleared: ${totalLines}` : "Solver not run yet"}
                    </div>
                  </div>

                  {/* Solver stepper */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Solution Steps (manual stepper)</h4>
                    {solution && stepCount > 0 ? (
                      <>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Step {previewIndex + 1} / {stepCount} — showing result after this step.
                        </div>

                        <div className="flex gap-2 mb-3 items-center">
                          <Button onClick={() => setPreviewIndex(i => Math.max(0, i - 1))} disabled={previewIndex === 0}>Prev</Button>
                          <Button onClick={() => setPreviewIndex(i => Math.min(stepCount - 1, i + 1))} disabled={previewIndex === stepCount - 1}>Next</Button>
                          <Button onClick={applyPreviewStep} variant="outline">Apply This Step</Button>
                          <div className="ml-4 text-sm">
                            Applied steps: {appliedStepCount} / {stepCount}
                          </div>
                        </div>

                        {/* show textual description of the preview step */}
                        <div className="p-3 bg-muted rounded">
                          {(() => {
                            const s = solution.steps[previewIndex];
                            if (!s) return <div className="text-sm">No step info.</div>;
                            if (s.r === null) {
                              return <div className="text-sm">Step {previewIndex+1}: No valid placement for piece <b>{s.pieceKey}</b>. (0 lines)</div>;
                            }
                            return (
                              <div className="text-sm">
                                Step {previewIndex+1}: Place <b>{s.pieceKey}</b> at row {s.r+1}, col {s.c+1} — clears {s.linesCleared} line(s).
                              </div>
                            );
                          })()}
                        </div>

                        {/* small visual preview of the board after this step */}
                        <div className="mt-3">
                          <div className="grid gap-1"
                               style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1.25rem)` }}>
                            {previewBoard?.map((row, r) =>
                              row.map((cell, c) => (
                                <div key={`${r}-${c}`} className={`w-5 h-5 rounded-sm border ${cell ? "bg-primary" : "bg-muted"}`} />
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No solution available — run the solver after selecting 3 pieces.</div>
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
