"use client";

import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";

interface AnimatedAmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 10;

export function AnimatedAmountInput({ value, onChange }: AnimatedAmountInputProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9.]/g, "");
      if (val.split(".").length > 2) return;

      if (val.length > MAX_LENGTH) {
        return;
      }

      if (val === "") {
        onChange("0");
      } else if (
        val.length > 1 &&
        val.startsWith("0") &&
        !val.startsWith("0.")
      ) {
        onChange(val.replace(/^0+/, ""));
      } else {
        onChange(val);
      }
    },
    [onChange]
  );

  const characters = useMemo(() => value.split(""), [value]);

  return (
    <div className="w-full flex items-center justify-center bg-transparent font-sans transition-colors duration-300 select-none">
      <MotionConfig
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 19,
          mass: 1.2,
        }}
      >
        <motion.div className="w-full">
          <motion.div
            layout
            className="rounded-[24px] border-[1.6px] border-neutral-200 bg-neutral-50 p-4 transition-colors dark:border-[#2b2b2b] dark:bg-[#0e0e0e]"
          >
            <div className="relative flex flex-col items-center overflow-hidden py-4 sm:py-6">
              <div className="relative h-16 sm:h-20 w-full overflow-hidden">
                <input
                  inputMode="decimal"
                  value={value === "0" ? "" : value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="absolute inset-0 z-20 w-full bg-transparent text-center text-4xl sm:text-5xl font-medium text-transparent caret-black outline-none dark:caret-white"
                />

                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-4xl sm:text-5xl font-medium tabular-nums text-slate-900 dark:text-white">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 40 }}
                      transition={{ type: "spring", stiffness: 240, damping: 16, mass: 0.8 }}
                      className="inline-block mr-2 text-slate-300"
                    >
                      R$
                    </motion.span>
                    {value === "0" || value === "" ? (
                      <motion.span
                        key="placeholder"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 16,
                          mass: 0.8,
                        }}
                        className="text-slate-300"
                      >
                        0.00
                      </motion.span>
                    ) : (
                      characters.map((char, i) => (
                        <motion.span
                          key={`${i}-${char}`}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 40 }}
                          transition={{
                            type: "spring",
                            stiffness: 240,
                            damping: 16,
                            mass: 0.8,
                          }}
                          className="inline-block"
                        >
                          {char}
                        </motion.span>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </MotionConfig>
    </div>
  );
}
