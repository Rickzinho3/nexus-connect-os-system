"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { AnimatedToastStack, useAnimatedToastStack, ToastInput } from "@/components/motion/animated-toast-stack";

interface ToastContextType {
  showToast: (input: ToastInput) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, dismissToast } = useAnimatedToastStack({ limit: 5 });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatedToastStack 
        toasts={toasts} 
        onDismiss={dismissToast} 
        position="bottom-right" 
        fixed={true}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
