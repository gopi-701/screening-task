"use client";

import React, { useState } from "react";
import { margin, operators, size } from "../data/operators.jsx";
import { Eye } from "lucide-react";

export default function Operator({
  title,
  itemId,
  fill,
  height,
  width,
  components,
  isCustom,
  symbol,
  style = {},
}) {
  const [isXRayMode, setIsXRayMode] = useState(false); // X-ray mode to show all components of a custom gate

  return (
    <div style={{ ...style }} className="group relative">
      {/* Main gate view or XRay grid */}
      {!isXRayMode && (
        <svg
          className={`z-40 absolute top-0 left-0`}
          height={height * size + margin.y * (height - 1)}
          width={size}
          overflow="visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            fill={fill}
            height={height * size + (height - 1) * margin.y}
            rx="4"
            width={size}
            x="0"
            y="0"
          />
          {symbol}
        </svg>
      )}
      {isXRayMode &&
        isCustom &&
        (() => {
          // Calculate bounding box extents
          const minX = Math.min(...components.map((c) => c.x));
          const maxX = Math.max(...components.map((c) => c.x + (c.w || 1) - 1));
          const minY = Math.min(...components.map((c) => c.y));
          const maxY = Math.max(...components.map((c) => c.y + (c.h || 1) - 1));
          // Build a lookup for fast cell access
          const cellMap = {};
          components.forEach((comp, idx) => {
            for (let dx = 0; dx < (comp.w || 1); dx++) {
              for (let dy = 0; dy < (comp.h || 1); dy++) {
                const key = `${comp.x + dx},${comp.y + dy}`;
                cellMap[key] = idx;
              }
            }
          });
          // Robust overlap check: for each row, for each column, ensure at most one component occupies (col, row)
          let hasOverlap = false;
          // For each row, keep a set of columns that are occupied
          const rowColSet = {};
          components.forEach((comp, idx) => {
            for (let dy = 0; dy < (comp.h || 1); dy++) {
              const row = comp.y + dy;
              if (!rowColSet[row]) rowColSet[row] = new Set();
              for (let dx = 0; dx < (comp.w || 1); dx++) {
                const col = comp.x + dx;
                const key = `${col},${row}`;
                if (rowColSet[row].has(col)) {
                  hasOverlap = true;
                }
                rowColSet[row].add(col);
              }
            }
          });
          return (
            <svg
              className="z-40 absolute top-0 left-0"
              height={(maxY - minY + 1) * (size + margin.y) - margin.y}
              width={(maxX - minX + 1) * (size + margin.x) - margin.x}
              overflow="visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Optional: background for the grid */}
              <rect
                fill="#f0f4ff"
                height={(maxY - minY + 1) * (size + margin.y) - margin.y}
                rx="8"
                width={(maxX - minX + 1) * (size + margin.x) - margin.x}
                x="0"
                y="0"
                stroke="#bcd"
                strokeWidth="2"
              />
              {/* Render the rectangular grid, placing components or leaving empty */}
              {Array.from({ length: maxY - minY + 1 }).map((_, row) =>
                Array.from({ length: maxX - minX + 1 }).map((_, col) => {
                  const x = minX + col;
                  const y = minY + row;
                  const key = `${x},${y}`;
                  const compIdx = cellMap[key];
                  if (compIdx === undefined) return null;
                  const comp = components[compIdx];
                  // Only render the top-left cell of each component
                  if (comp.x !== x || comp.y !== y) return null;
                  const op = operators.find((o) => o.id === comp.gateId);
                  if (!op) return null;
                  return (
                    <g
                      key={key}
                      transform={`translate(${(x - minX) * (size + margin.x)},${
                        (y - minY) * (size + margin.y)
                      })`}
                    >
                      <rect
                        fill={op.fill}
                        height={
                          (comp.h || 1) * size + ((comp.h || 1) - 1) * margin.y
                        }
                        rx="4"
                        width={
                          (comp.w || 1) * size + ((comp.w || 1) - 1) * margin.x
                        }
                        x="0"
                        y="0"
                      />
                      {op.icon}
                    </g>
                  );
                })
              )}
              {/* If overlap, render a red overlay and X icon */}
              {hasOverlap && (
                <g>
                  <rect
                    x="0"
                    y="0"
                    width={(maxX - minX + 1) * (size + margin.x) - margin.x}
                    height={(maxY - minY + 1) * (size + margin.y) - margin.y}
                    fill="red"
                    fillOpacity="0.18"
                    rx="8"
                  />
                  {/* Red X icon in top-left */}
                  <text
                    x="10"
                    y="30"
                    fontSize="40"
                    fontWeight="bold"
                    fill="#e11d48"
                    opacity="0.8"
                  >
                    ✗
                  </text>
                </g>
              )}
            </svg>
          );
        })()}
      {isCustom && (
        <button
          aria-label="Toggle X-Ray Mode"
          className={`${
            !isXRayMode && "group-hover:block hidden"
          } relative top-0 left-0 bg-white cursor-pointer border border-gray-300 z-50 rounded-full shadow -translate-1/2`}
          onClick={(e) => {
            e.stopPropagation();
            setIsXRayMode(!isXRayMode);
          }}
          style={{
            width: 18,
            height: 18,
            minWidth: 0,
            padding: 0,
            zIndex: 100,
          }}
        >
          {isXRayMode ? <Eye size={14} color="lightblue" /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}
