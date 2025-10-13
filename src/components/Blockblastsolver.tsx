import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ---- Config ----
const GRID_SIZE = 8;
const PIECE_GRID_SIZE = 4;

// ---- Helpers ----
function makeEmptyGrid(size = GRID_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function makeEmptyPiece() {
  return Array.from({ length: PIECE_GRID_SIZE }, () => Array(PIECE_GRID_SIZE).fill(0));
}

function cloneGrid(g) {
  return g.map(r => [...r]);
}

function clearLines(grid) {
  const newGrid = cloneGrid(grid);
  let cleared = 0;

  for (let i = 0; i < GRID_SIZE; i++) {
    if (newGrid[i].every(c => c === 1)) {
      newGrid[i] = Array(GRID_SIZE).fill(0);
      cleared++;
    }
  }

  for (let j = 0; j < GRID_SIZE; j++) {
    if (newGrid.every(row => row[j] === 1)) {
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
  return places;
}

function findBestPlacement(grid, shape) {
  const placements = getAllValidPlacements(grid, shape);
  if (placements.length === 0) return { r: null, c: null, boardAfter: cloneGrid(grid), linesCleared: 0 };
  let best = null;
  for (const p of placements) {
    const result = applyShape(grid, shape, p.r, p.c);
    if (!best || result.linesCleared > best.linesCleared) {
      best = { r: p.r, c: p.c, boardAfter: result.grid, linesCleared: result.linesCleared };
    }
  }
  return best;
}

// ---- Component ----
export const Bbsolver = () => {
  // Main board
  const [grid, setGrid] = useState(() => {
    try { const s = localStorage.getItem("bb-grid"); return s ? JSON.parse(s) : makeEmptyGrid(); } 
    catch { return makeEmptyGrid(); }
  });

  // 3 custom pieces (4x4 each)
  const [pieces, setPieces] = useState(() => {
    try { const s = localStorage.getItem("bb-pieces"); return s ? JSON.parse(s) : [makeEmptyPiece(), makeEmptyPiece(), makeEmptyPiece()]; } 
    catch { return [makeEmptyPiece(), makeEmptyPiece(), makeEmptyPiece()]; }
  });

  // Preview boards after each piece
  const [previews, setPreviews] = useState([null, null, null]);
  
  // ---- Persistence ----
  useEffect(() => { try { localStorage.setItem("bb-grid", JSON.stringify(grid)); } catch {} }, [grid]);
  useEffect(() => { try { localStorage.setItem("bb-pieces", JSON.stringify(pieces)); } catch {} }, [pieces]);

  // ---- Board Functions ----
  function toggleCell(r, c) {
    setGrid(prev => { const g = cloneGrid(prev); g[r][c] ^= 1; return g; });
  }

  function clearBoard() {
    setGrid(makeEmptyGrid());
    setPreviews([null, null, null]);
  }

  // ---- Piece Editor Functions ----
  function togglePieceCell(pieceIdx, r, c) {
    setPieces(prev => {
      const copy = prev.map(p => cloneGrid(p));
      copy[pieceIdx][r][c] ^= 1;
      return copy;
    });
    setPreviews([null, null, null]);
  }

  function clearPiece(pieceIdx) {
    setPieces(prev => {
      const copy = prev.map(p => cloneGrid(p));
      copy[pieceIdx] = makeEmptyPiece();
      return copy;
    });
    setPreviews([null, null, null]);
  }

  // ---- Solver / Preview ----
  function runSolver() {
    let current = cloneGrid(grid);
    const newPreviews = pieces.map(piece => {
      const best = findBestPlacement(current, piece);
      current = best.boardAfter;
      return best.boardAfter;
    });
    setPreviews(newPreviews);
  }

  function applyAll() {
    if (previews[2]) setGrid(previews[2]);
    setPreviews([null, null, null]);
  }

  // ---- UI ----
  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">BlockBlast Solver (Custom Pieces)</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Draw your 3 custom pieces and see a preview of their best placement on the board.
          </p>
        </div>

        <Card className="max-w-6xl mx-auto p-4">
          <CardHeader>
            <CardTitle className="text-xl">Main Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}>
              {grid.map((row, r) => row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => toggleCell(r, c)}
                  className={`w-8 h-8 rounded-md border cursor-pointer ${cell ? "bg-primary" : "bg-muted"}`}
                />
              )))}
            </div>
            <div className="flex gap-3 mb-6">
              <Button onClick={clearBoard} variant="outline">Clear Board</Button>
            </div>

            {/* Piece Editors */}
            <div className="flex gap-6 mb-6">
              {pieces.map((piece, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="text-sm font-semibold mb-2">Piece {idx+1}</div>
                  <div className="grid gap-1"
                       style={{ gridTemplateColumns: `repeat(${PIECE_GRID_SIZE}, 1.5rem)` }}>
                    {piece.map((row, r) => row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => togglePieceCell(idx, r, c)}
                        className={`w-6 h-6 rounded-sm border cursor-pointer ${cell ? "bg-primary" : "bg-muted"}`}
                      />
                    )))}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => clearPiece(idx)}>Clear</Button>
                </div>
              ))}
            </div>

            {/* Run Solver & Preview */}
            <div className="flex items-center gap-3 mb-4">
              <Button onClick={runSolver}>Run Solver</Button>
              <Button onClick={applyAll} variant="outline">Apply All Changes</Button>
            </div>

            {/* Preview Boards */}
            {previews.some(p => p) && (
              <div>
                <h4 className="font-semibold mb-2">Preview Boards</h4>
                <div className="flex gap-4">
                  {previews.map((board, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-sm mb-1">After Piece {i+1}</div>
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1.25rem)` }}>
                        {board ? board.map((row, r) => row.map((cell, c) => (
                          <div key={`${r}-${c}`} className={`w-5 h-5 rounded-sm border ${cell ? "bg-primary" : "bg-muted"}`} />
                        ))) : <div className="text-xs text-muted-foreground">N/A</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
