import React, { useState, useRef } from 'react';

import CurrencyInputField from 'react-currency-input-field';
import type { CurrencyInputOnChangeValues } from 'react-currency-input-field';

import { COLORS, FONT_SIZE } from '@theme';

const INPUT_STYLE: React.CSSProperties = {
  background: '#0c0b17',
  border: `1px solid ${COLORS.BORDER}`,
  borderRadius: '6px',
  color: COLORS.TEXT_PRIMARY,
  fontFamily: 'monospace',
  fontSize: FONT_SIZE.MD,
  padding: '6px 10px',
  outline: 'none',
  width: '100%',
};

interface Props {
  value: number;
  onValueChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  placeholder?: string;
  width?: string;
  textAlign?: 'left' | 'right' | 'center';
}

const InputMoney: React.FC<Props> = ({
  value,
  onValueChange,
  onCommit,
  placeholder = 'R$ 0,00',
  width,
  textAlign = 'right',
}) => {
  const currentValueRef = useRef(value);
  const [isFocused, setIsFocused] = useState(false);
  const [internalRaw, setInternalRaw] = useState<string | undefined>(undefined);

  const handleChange = (
    rawValue: string | undefined,
    _name: string | undefined,
    values: CurrencyInputOnChangeValues | undefined,
  ) => {
    setInternalRaw(rawValue);
    const parsed = values?.float ?? 0;
    currentValueRef.current = parsed;
    onValueChange?.(parsed);
  };

  const handleFocus = () => {
    setInternalRaw(value != null ? String(value) : undefined);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setInternalRaw(undefined);
    onCommit?.(currentValueRef.current);
  };

  return (
    <CurrencyInputField
      value={isFocused ? internalRaw : (value || undefined)}
      intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
      decimalsLimit={2}
      placeholder={placeholder}
      onValueChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      style={{ ...INPUT_STYLE, width: width ?? INPUT_STYLE.width, textAlign }}
    />
  );
};

export default InputMoney;
