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
  value,
  onChange,
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
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (raw === "" || raw === "-") {
      onChange(0);
    } else {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (displayValue === "" || displayValue === "-" || isNaN(parseFloat(displayValue))) {
      setDisplayValue("0");
      onChange(0);
    } else {
      const parsed = parseFloat(displayValue);
      setDisplayValue(String(parsed));
      onChange(parsed);
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
