"use client";

import React, { useState, useEffect } from "react";

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: number | string;
  min?: number;
  max?: number;
  placeholder?: string;
}

export default function NumericInput({
  value = 0,
  onChange = () => {},
  className = "",
  step = 1,
  min,
  max,
  placeholder = "0",
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(String(value ?? 0));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Sync display value when parent value changes or when blurred
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value ?? 0));
    }
  }, [value, isFocused, step, min, max]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (raw === "" || raw === "-") {
      onChange(0);
    } else {
      try {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
          let finalVal = parsed;
          if (typeof min === "number" && finalVal < min) finalVal = min;
          if (typeof max === "number" && finalVal > max) finalVal = max;
          onChange(finalVal);
        }
      } catch (err) {
        console.error("Error parsing input value in NumericInput:", err);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    try {
      if (displayValue === "" || displayValue === "-" || isNaN(parseFloat(displayValue))) {
        const fallback = typeof min === "number" ? min : 0;
        setDisplayValue(String(fallback));
        onChange(fallback);
      } else {
        let parsed = parseFloat(displayValue);
        if (typeof min === "number" && parsed < min) parsed = min;
        if (typeof max === "number" && parsed > max) parsed = max;
        setDisplayValue(String(parsed));
        onChange(parsed);
      }
    } catch (err) {
      console.error("Error in handleBlur in NumericInput:", err);
      setDisplayValue("0");
      onChange(0);
    }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`${className} placeholder:text-foreground/30 placeholder:font-normal`}
    />
  );
}

