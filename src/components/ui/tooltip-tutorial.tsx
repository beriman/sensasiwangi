// @ts-ignore
import React, { useState, useRef, useEffect } from "react";
// @ts-ignore
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { X, HelpCircle, ArrowRight, ArrowLeft } from "lucide-react";

export interface TutorialStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
}

interface TooltipTutorialProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function TooltipTutorial({
  steps,
  isOpen,
  onComplete,
  onDismiss,
}: TooltipTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionTooltip = () => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Add highlight effect to target element
    targetElement.classList.add(
      "ring-2",
      "ring-purple-500",
      "ring-offset-2",
      "z-50",
    );

    // Calculate position based on specified direction
    let top = 0;
    let left = 0;

    switch (step.position || "bottom") {
      case "top":
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + 10;
        break;
      case "bottom":
        top = targetRect.bottom + 10;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - 10;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10)
      left = window.innerWidth - tooltipRect.width - 10;
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10)
      top = window.innerHeight - tooltipRect.height - 10;

    setTooltipPosition({ top, left });
  };

  // Remove highlight from previous step
  const removeHighlights = () => {
    document.querySelectorAll(".ring-2.ring-purple-500").forEach((el) => {
      el.classList.remove("ring-2", "ring-purple-500", "ring-offset-2", "z-50");
    });
  };

  useEffect(() => {
    if (isOpen) {
      removeHighlights();
      positionTooltip();

      // Reposition on window resize
      window.addEventListener("resize", positionTooltip);
      return () => {
        window.removeEventListener("resize", positionTooltip);
        removeHighlights();
      };
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    removeHighlights();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    removeHighlights();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    removeHighlights();
    onDismiss();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: "fixed",
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          className="bg-white rounded-lg shadow-lg p-4 max-w-xs w-full border border-purple-100"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-purple-700 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" />
              {steps[currentStep]?.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {steps[currentStep]?.content}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-xs h-8"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" /> Previous
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="text-xs h-8 bg-purple-600 hover:bg-purple-700"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


