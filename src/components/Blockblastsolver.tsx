import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 8;

const defaultPieces = [
  { name: "Square", shape: [[1, 1], [1, 1]] },
  { name: "Line", shape: [[1, 1, 1, 1]] },
  { name: "L-Shape", shape: [[1, 0], [1, 0], [1, 1]] },
];

export const Blockblastsolver = () => {
  const [grid, setGrid] = useState(() => {
    const saved = localStorage.getItem("blockblast-grid");
    return saved ? JSON.parse(saved) : Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  });

  const [pieces, setPieces] = useState(defaultPieces);

  // Save state to localStorage whenever grid changes
  useEffect(() => {
    localStorage.setItem("blockblast-grid", JSON.stringify(grid));
  }, [grid]);

  const toggleCell = (r, c) => {
    setGrid(prev =>
      prev.map((row, i) =>
        row.map((cell, j) => (i === r && j === c ? (cell ? 0 : 1) : cell))
      )
    );
  };

  const clearGrid = () => {
    setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));
  };

  return (
    <section id="blockblast" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            BlockBlast Solver <span className="gradient-text">by Minh Bui</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Fill the 8×8 board to match your in-game layout. Your progress is saved automatically!
          </p>
        </div>

        <Card className="max-w-4xl mx-auto p-6 glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold mb-6">
              Game Board
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="grid gap-1 mx-auto"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => toggleCell(r, c)}
                    className={`w-8 h-8 rounded-md cursor-pointer border border-border transition-all ${
                      cell ? "bg-primary" : "bg-muted hover:bg-muted/70"
                    }`}
                  />
                ))
              )}
            </div>

            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={clearGrid}>
                Clear Board
              </Button>
            </div>

            <h3 className="text-xl font-semibold mt-10 mb-4 text-center">Available Pieces</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {pieces.map((p, i) => (
                <Card key={i} className="w-32 border-border/40 p-3">
                  <CardHeader>
                    <CardTitle className="text-center text-sm">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="grid gap-1 justify-center"
                      style={{ gridTemplateColumns: `repeat(${p.shape[0].length}, 1rem)` }}
                    >
                      {p.shape.flat().map((cell, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-sm ${
                            cell ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
