"use client";

import { useState, useEffect, useRef } from "react";

function Digit({ char, pos }: { char: string; pos: number }) {
  return (
    <span
      key={`${pos}-${char}`}
      className="inline-flex items-center justify-center overflow-hidden"
      style={{ width: char === "," ? "0.35em" : "0.63em", height: "1.1em" }}
    >
      <span
        className="inline-flex items-center justify-center animate-odometer-in"
        style={{ lineHeight: 1 }}
      >
        {char}
      </span>
    </span>
  );
}

export function Odometer({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [digits, setDigits] = useState<string[]>([]);
  const prevDigitsRef = useRef<string[]>([]);

  useEffect(() => {
    if (value !== displayValue) {
      prevDigitsRef.current = digits;
      setDisplayValue(value);
    }
  }, [value]);

  useEffect(() => {
    setDigits(value.toLocaleString().split(""));
  }, [displayValue]);

  return (
    <span className="inline-flex items-baseline">
      {digits.map((ch, i) => (
        <Digit key={`${i}-${ch}`} char={ch} pos={i} />
      ))}
    </span>
  );
}

export function LiveTotal({
  initialTotal,
  className,
}: {
  initialTotal: number;
  className?: string;
}) {
  const [total, setTotal] = useState(initialTotal);
  const totalRef = useRef(total);
  totalRef.current = total;

  useEffect(() => {
    setTotal(initialTotal);
  }, [initialTotal]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.total && data.total !== totalRef.current) {
          setTotal(data.total);
        }
      } catch {
        // silent
      }
    }

    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className}>
      <Odometer value={total} />
    </span>
  );
}
