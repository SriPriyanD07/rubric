"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover" | "click";
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  encryptedClassName = "",
  parentClassName = "",
  animateOn = "view",
}: DecryptedTextProps) {
  const [isAnimating, setIsAnimating] = useState<boolean>(animateOn === "view");
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());

  const availableChars = useMemo<string[]>(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  // Compute character reveal order list based on direction
  const revealOrder = useMemo<number[]>(() => {
    const len = text.length;
    const order: number[] = [];
    if (len <= 0) return order;

    if (revealDirection === "start") {
      for (let i = 0; i < len; i++) order.push(i);
    } else if (revealDirection === "end") {
      for (let i = len - 1; i >= 0; i--) order.push(i);
    } else {
      // center
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.floor(offset / 2) - 1;
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
    }
    return order;
  }, [text, revealDirection]);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setRevealedIndices(new Set());
  }, []);

  useEffect(() => {
    if (animateOn === "view") {
      triggerAnimation();
    }
  }, [animateOn, triggerAnimation]);

  useEffect(() => {
    if (!isAnimating) return;

    let iterations = 0;
    const len = text.length;
    
    const intervalId = setInterval(() => {
      const nextIndices = new Set<number>();
      
      if (sequential) {
        // Reveal characters sequentially
        const numToReveal = Math.min(
          Math.floor(iterations / maxIterations) + 1,
          len
        );
        for (let i = 0; i < numToReveal; i++) {
          if (i < revealOrder.length) {
            nextIndices.add(revealOrder[i]);
          }
        }
      } else {
        // Non-sequential
        if (iterations >= maxIterations) {
          for (let i = 0; i < len; i++) nextIndices.add(i);
        }
      }

      setRevealedIndices(nextIndices);

      // Check if animation is finished
      const allRevealed = text.split("").every((char, i) => char === " " || nextIndices.has(i));
      
      if (allRevealed || (nextIndices.size >= len && iterations >= maxIterations * 2)) {
        clearInterval(intervalId);
        setIsAnimating(false);
      }

      iterations++;
    }, speed);

    return () => clearInterval(intervalId);
  }, [isAnimating, text, speed, maxIterations, sequential, revealOrder]);

  // Generate scrambled output mapping
  const renderedChars = useMemo(() => {
    return text.split("").map((char, i) => {
      if (char === " ") {
        return (
          <span key={i} className="inline-block w-[0.25em]">
            &nbsp;
          </span>
        );
      }

      const isRevealed = revealedIndices.has(i);
      if (isRevealed || !isAnimating) {
        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      }

      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      return (
        <span key={i} className={encryptedClassName || className}>
          {randomChar}
        </span>
      );
    });
  }, [text, isAnimating, revealedIndices, availableChars, className, encryptedClassName]);

  return (
    <span className={parentClassName} onClick={animateOn === "click" ? triggerAnimation : undefined}>
      {renderedChars}
    </span>
  );
}
