import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  className?: string;
};

type Props<T extends Record<string, unknown> & { id?: number | string }> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  animateRows?: boolean;
};

export default function AdminTable<
  T extends Record<string, unknown> & { id?: number | string }
>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records.",
  className = "",
  animateRows = true,
}: Props<T>): React.ReactElement {
  // row animation variants
  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, delay: i * 0.03 },
    }),
    exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
  };


  const readRowValue = (row: T, key: string): React.ReactNode => {
    const r = row as Record<string, unknown>;
    const v = r[key];
    if (v === undefined || v === null) return "";

    if (
      typeof v === "string" ||
      typeof v === "number" ||
      React.isValidElement(v)
    ) {
      return v as React.ReactNode;
    }
    try {
      return String(v);
    } catch {
      return "";
    }
  };

  return (

    <div className={`w-full ${className}`} style={{ overflowX: "hidden" }}>
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ willChange: "transform" }}
      >
        <div
          className="w-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)",
          }}
        >
          <div className="px-6 py-3 bg-white/6 backdrop-blur-sm">
        
            <table className="min-w-full table-fixed" style={{ borderCollapse: "separate", borderSpacing: "0 0.6rem" }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left text-sm font-semibold tracking-wider uppercase text-white/95 px-4 py-3 ${
                        col.className ?? ""
                      }`}
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

             
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-white/80"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-white/80"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : animateRows ? (
                  <AnimatePresence initial={false}>
                    {data.map((row, ri) => {
                      const bgClass = ri % 2 === 0 ? "bg-white/6" : "bg-white/8";

                      return (
                        <motion.tr
                      
                          key={String(row.id ?? ri)}
                          custom={ri}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={rowVariants}
                        
                          whileHover={{ y: -4 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 24,
                          }}
                          className={`group`} 
                          style={{
                            cursor: "default",
                            transformOrigin: "center",
                          }}
                        >
                          {columns.map((col, ci) => {
                            const isFirst = ci === 0;
                            const isLast = ci === columns.length - 1;

                            const roundedClasses = `${isFirst ? "rounded-l-2xl overflow-hidden" : ""} ${
                              isLast ? "rounded-r-2xl overflow-hidden" : ""
                            }`;

                            return (
                              <td
                                key={col.key}
                         
                                className={`px-4 py-2 align-top text-sm text-white ${bgClass} group-hover:bg-white/20 ${roundedClasses}`}
                                style={{ textShadow: "0 1px 0 rgba(0,0,0,0.06)" }}
                              >
                                <div className="flex items-center gap-2">
                                  {col.render
                                    ? col.render(row, ri)
                                    : readRowValue(row, col.key)}
                                </div>
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  data.map((row, ri) => {
                    const bgClass = ri % 2 === 0 ? "bg-white/6" : "bg-white/8";
                    return (
                      <tr key={String(row.id ?? ri)} className={`group`}>
                        {columns.map((col, ci) => {
                          const isFirst = ci === 0;
                          const isLast = ci === columns.length - 1;
                          const roundedClasses = `${isFirst ? "rounded-l-2xl overflow-hidden" : ""} ${
                            isLast ? "rounded-r-2xl overflow-hidden" : ""
                          }`;

                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-2 align-top text-sm text-white ${bgClass} group-hover:bg-white/20 ${roundedClasses}`}
                            >
                              {col.render ? col.render(row, ri) : readRowValue(row, col.key)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="h-3" />
        </div>
      </div>
    </div>
  );
}
