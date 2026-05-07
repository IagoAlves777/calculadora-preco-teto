import React from 'react';

import { Box, Input } from '@chakra-ui/react';

import InputMoney from '@components/InputMoney';
import { BASE_PROJECTION_YEAR } from '@utils/dcf';
import { formatCompact, formatToBRL } from '@utils/format';
import { COLORS, FONT_SIZE } from '@theme';
import type { DCFResult } from '@appTypes';

const GROWTH_STEP = 0.5;

interface Props {
  dcfResult: DCFResult;
  projectionYears: 3 | 5;
  projectionGrowths: number[];
  perpetuityGrowthPct: number;
  onProjectionYearsChange: (years: 3 | 5) => void;
  onGrowthChange: (index: number, value: number) => void;
  onGrowthIncrement: (index: number, delta: number) => void;
  onManualProfitCommit: (index: number, value: number) => void;
  onPerpetuityIncrement: (delta: number) => void;
}

const cellStyle = {
  padding: '8px 12px',
  fontFamily: 'monospace',
  fontSize: FONT_SIZE.SM,
  color: COLORS.TEXT_PRIMARY,
  borderBottom: `1px solid ${COLORS.BORDER}`,
} as const;

const headerStyle = {
  padding: '8px 12px',
  fontFamily: 'monospace',
  fontSize: FONT_SIZE.XS,
  color: COLORS.TEXT_MUTED,
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${COLORS.BORDER}`,
};

interface IncrementButtonProps {
  onClick: () => void;
  label: string;
}

const IncrementButton: React.FC<IncrementButtonProps> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      background: COLORS.SURFACE,
      border: `1px solid ${COLORS.BORDER}`,
      borderRadius: 4,
      color: COLORS.TEXT_SECONDARY,
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: FONT_SIZE.MD,
      width: 22,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {label}
  </button>
);

const DCFTable: React.FC<Props> = ({
  dcfResult,
  projectionYears,
  projectionGrowths,
  perpetuityGrowthPct,
  onProjectionYearsChange,
  onGrowthChange,
  onGrowthIncrement,
  onManualProfitCommit,
  onPerpetuityIncrement,
}) => {
  const projectedYearOffset = BASE_PROJECTION_YEAR + 1;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box fontSize={FONT_SIZE.SM} fontWeight="500" color={COLORS.TEXT_SECONDARY} fontFamily="mono">
          Fluxo de caixa descontado
        </Box>
        <Box display="flex" gap={1}>
          {([3, 5] as const).map((years) => (
            <button
              key={years}
              onClick={() => onProjectionYearsChange(years)}
              style={{
                background: projectionYears === years ? COLORS.PURPLE_SEMI : 'transparent',
                border: `1px solid ${projectionYears === years ? COLORS.PURPLE : COLORS.BORDER}`,
                borderRadius: 6,
                color: projectionYears === years ? COLORS.PURPLE : COLORS.TEXT_MUTED,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: FONT_SIZE.XS,
                padding: '3px 10px',
              }}
            >
              {years} anos
            </button>
          ))}
        </Box>
      </Box>

      <Box border={`1px solid ${COLORS.BORDER}`} borderRadius="8px" overflow="hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: COLORS.SURFACE }}>
              <th style={{ ...headerStyle, width: 60 }}>Ano</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Lucro líquido</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Crescimento</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>VPL</th>
            </tr>
          </thead>
          <tbody>
            {dcfResult.rows.map((row, rowIndex) => {
              if (row.isHist) {
                const growthDisplay = (() => {
                  if (rowIndex === 0 || !dcfResult.rows[rowIndex - 1]?.isHist) return null;
                  const previousProfit = dcfResult.rows[rowIndex - 1].lucro;

                  if (previousProfit <= 0 || row.lucro <= 0) return null;
                  const growthPct = (row.lucro / previousProfit - 1) * 100;

                  return { value: growthPct, display: `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(2)}%` };
                })();

                return (
                  <tr key={row.year} style={{ opacity: 0.6 }}>
                    <td style={cellStyle}>{row.year}</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                      {row.lucro > 0 ? formatToBRL(row.lucro) : <span style={{ color: COLORS.TEXT_MUTED }}>—</span>}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      {growthDisplay ? (
                        <span style={{ color: growthDisplay.value >= 0 ? COLORS.GREEN : COLORS.RED }}>
                          {growthDisplay.display}
                        </span>
                      ) : (
                        <span style={{ color: COLORS.TEXT_MUTED }}>—</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', color: COLORS.TEXT_MUTED }}>—</td>
                  </tr>
                );
              }

              if (row.isPerp) {
                return (
                  <tr key="perp" style={{ background: COLORS.PURPLE_TRANSPARENT }}>
                    <td style={cellStyle}>Perpétuo</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                      {formatCompact(Math.round(row.lucro))}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <IncrementButton onClick={() => onPerpetuityIncrement(-GROWTH_STEP)} label="−" />
                        <span style={{ minWidth: 40, textAlign: 'center', color: COLORS.PURPLE }}>
                          {perpetuityGrowthPct.toFixed(1)}%
                        </span>
                        <IncrementButton onClick={() => onPerpetuityIncrement(GROWTH_STEP)} label="+" />
                      </Box>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', color: COLORS.GREEN, fontWeight: 500 }}>
                      {formatCompact(Math.round(row.vpl))}
                    </td>
                  </tr>
                );
              }

              const projectionIndex = (row.year as number) - projectedYearOffset;

              return (
                <tr key={row.year}>
                  <td style={cellStyle}>{row.year}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', padding: '4px 12px' }}>
                    <InputMoney
                      value={Math.round(dcfResult.projectedProfits[projectionIndex] ?? 0)}
                      onCommit={(value) => onManualProfitCommit(projectionIndex, value)}
                      width="140px"
                    />
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <IncrementButton
                        onClick={() => onGrowthIncrement(projectionIndex, -GROWTH_STEP)}
                        label="−"
                      />
                      <Input
                        type="number"
                        value={parseFloat(projectionGrowths[projectionIndex]?.toFixed(2) ?? '0')}
                        min={-50}
                        max={300}
                        step={GROWTH_STEP}
                        onChange={(event) => onGrowthChange(projectionIndex, parseFloat(event.target.value) || 0)}
                        bg="#0c0b17"
                        borderColor={COLORS.BORDER}
                        color={COLORS.TEXT_PRIMARY}
                        fontFamily="mono"
                        fontSize={FONT_SIZE.SM}
                        textAlign="center"
                        width="52px"
                        px={1}
                        _hover={{ borderColor: COLORS.BORDER_HOVER }}
                        _focus={{ borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` }}
                      />
                      <span style={{ color: COLORS.TEXT_MUTED, fontSize: FONT_SIZE.XS }}>%</span>
                      <IncrementButton
                        onClick={() => onGrowthIncrement(projectionIndex, GROWTH_STEP)}
                        label="+"
                      />
                    </Box>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: COLORS.TEXT_SECONDARY }}>
                    {formatCompact(Math.round(row.vpl))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default DCFTable;
