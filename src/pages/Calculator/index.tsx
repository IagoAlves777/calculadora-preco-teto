import React, { useMemo, useRef, useState } from 'react';

import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import InputMoney from '@components/InputMoney';
import { LuArrowLeft, LuBraces } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';

import ModalConfirm from '@components/ModalConfirm';
import ModalJSONImport from '@components/ModalJSONImport';
import ModalUnsavedChanges from '@components/ModalUnsavedChanges';
import { useAnalyses } from '@hooks/useAnalyses';
import useConfirm from '@hooks/useConfirm';
import { calculateDCF } from '@utils/dcf';
import { formatCompact, formatCompactNumber, formatPercent, formatToBRL } from '@utils/format';
import { toaster } from '@utils/toaster';
import { COLORS, FONT_SIZE } from '@theme';
import type { Analysis } from '@appTypes';

import DCFTable from './components/DCFTable';
import HistInputs from './components/HistInputs';

const PERCENTAGE_BASE = 100;
const DEFAULT_DISCOUNT_RATE = 13;
const DEFAULT_PERPETUITY_RATE = 3.0;
const DEFAULT_PROJECTION_YEARS = 5;
const DEFAULT_GROWTHS = [3, 5, 5, 5, 5];
const PERPETUITY_MIN = 0.5;
const PERPETUITY_MAX = 20;

const buildEmptyState = () => ({
  ticker: '',
  discountRatePct: DEFAULT_DISCOUNT_RATE,
  totalShares: 0,
  treasuryShares: 0,
  netDebt: 0,
  currentPrice: 0,
  historicalProfits: [0, 0, 0, 0, 0],
  projectionYears: DEFAULT_PROJECTION_YEARS as 3 | 5,
  projectionGrowths: [...DEFAULT_GROWTHS],
  perpetuityGrowthPct: DEFAULT_PERPETUITY_RATE,
  manualProfits: [] as number[],
  isProfitManual: [] as boolean[],
});

const buildStateFromAnalysis = (analysis: Analysis) => ({
  ticker: analysis.ticker,
  discountRatePct: analysis.discountRatePct,
  totalShares: analysis.totalShares,
  treasuryShares: analysis.treasuryShares,
  netDebt: analysis.netDebt,
  currentPrice: parseFloat(analysis.currentPrice) || 0,
  historicalProfits: analysis.historicalProfits,
  projectionYears: analysis.projectionYears as 3 | 5,
  projectionGrowths: analysis.projectionGrowths,
  perpetuityGrowthPct: analysis.perpetuityGrowthPct,
  manualProfits: [] as number[],
  isProfitManual: [] as boolean[],
});

const Calculator: React.FC = () => {
  const navigate = useNavigate();
  const { ticker: editingTicker = null } = useParams<{ ticker: string }>();
  const { analyses, saveAnalysis } = useAnalyses();

  const existingAnalysis = editingTicker
    ? (analyses.find((item) => item.ticker === editingTicker) ?? null)
    : null;

  const initialState = existingAnalysis
    ? buildStateFromAnalysis(existingAnalysis)
    : buildEmptyState();

  const [ticker, setTicker] = useState(initialState.ticker);
  const [discountRatePct, setDiscountRatePct] = useState(initialState.discountRatePct);
  const [totalShares, setTotalShares] = useState(initialState.totalShares);
  const [treasuryShares, setTreasuryShares] = useState(initialState.treasuryShares);
  const [netDebt, setNetDebt] = useState(initialState.netDebt);
  const [currentPrice, setCurrentPrice] = useState(initialState.currentPrice);
  const [historicalProfits, setHistoricalProfits] = useState(initialState.historicalProfits);
  const [projectionYears, setProjectionYears] = useState<3 | 5>(initialState.projectionYears);
  const [projectionGrowths, setProjectionGrowths] = useState(initialState.projectionGrowths);
  const [perpetuityGrowthPct, setPerpetuityGrowthPct] = useState(initialState.perpetuityGrowthPct);
  const [manualProfits, setManualProfits] = useState<number[]>(initialState.manualProfits);
  const [isProfitManual, setIsProfitManual] = useState<boolean[]>(initialState.isProfitManual);
  const [isJSONModalOpen, setIsJSONModalOpen] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const { confirm, modalProps: confirmModalProps } = useConfirm();

  const initialStateRef = useRef(initialState);

  const hasUnsavedChanges = useMemo(() => {
    const init = initialStateRef.current;
    return (
      ticker !== init.ticker ||
      discountRatePct !== init.discountRatePct ||
      totalShares !== init.totalShares ||
      treasuryShares !== init.treasuryShares ||
      netDebt !== init.netDebt ||
      currentPrice !== init.currentPrice ||
      projectionYears !== init.projectionYears ||
      perpetuityGrowthPct !== init.perpetuityGrowthPct ||
      historicalProfits.some((p, i) => p !== init.historicalProfits[i]) ||
      projectionGrowths.some((g, i) => g !== init.projectionGrowths[i])
    );
  }, [ticker, discountRatePct, totalShares, treasuryShares, netDebt, currentPrice, projectionYears, perpetuityGrowthPct, historicalProfits, projectionGrowths]);

  const sharesOutstanding = Math.max(totalShares - treasuryShares, 1);

  const dcfResult = useMemo(
    () =>
      calculateDCF({
        discountRatePct,
        historicalProfits,
        projectionYears,
        projectionGrowths,
        perpetuityGrowthPct,
        manualProfits,
        isProfitManual,
        totalShares,
        treasuryShares,
        netDebt,
        currentPrice,
      }),
    [
      discountRatePct,
      historicalProfits,
      projectionYears,
      projectionGrowths,
      perpetuityGrowthPct,
      manualProfits,
      isProfitManual,
      totalShares,
      treasuryShares,
      netDebt,
      currentPrice,
    ],
  );

  const handleHistoricalProfitChange = (index: number, value: number) => {
    setHistoricalProfits((previous) => previous.map((profit, i) => (i === index ? value : profit)));
  };

  const handleGrowthChange = (index: number, value: number) => {
    setProjectionGrowths((previous) =>
      previous.map((growth, i) => (i === index ? parseFloat(value.toFixed(2)) : growth)),
    );
    setIsProfitManual((previous) => {
      const updated = [...previous];

      updated[index] = false;

      return updated;
    });
  };

  const handleGrowthIncrement = (index: number, delta: number) => {
    setProjectionGrowths((previous) =>
      previous.map((growth, i) => (i === index ? parseFloat((growth + delta).toFixed(2)) : growth)),
    );
    setIsProfitManual((previous) => {
      const updated = [...previous];

      updated[index] = false;

      return updated;
    });
  };

  const handleManualProfitCommit = (index: number, value: number) => {
    const initialProfit = historicalProfits.at(-1) ?? 0;
    const previousProfit = Array.from({ length: index }, (_, i) => i).reduce((profit, i) => {
      return isProfitManual[i] === true
        ? (manualProfits[i] ?? profit)
        : profit * (1 + projectionGrowths[i] / PERCENTAGE_BASE);
    }, initialProfit);

    const impliedGrowth =
      previousProfit > 0
        ? (value / previousProfit - 1) * PERCENTAGE_BASE
        : projectionGrowths[index];

    setManualProfits((previous) => {
      const updated = [...previous];

      updated[index] = value;

      return updated;
    });
    setIsProfitManual((previous) => {
      const updated = [...previous];

      updated[index] = true;

      return updated;
    });
    setProjectionGrowths((previous) =>
      previous.map((growth, i) => (i === index ? parseFloat(impliedGrowth.toFixed(2)) : growth)),
    );
  };

  const handlePerpetuityIncrement = (delta: number) => {
    setPerpetuityGrowthPct((previous) =>
      Math.max(PERPETUITY_MIN, Math.min(PERPETUITY_MAX, parseFloat((previous + delta).toFixed(1)))),
    );
  };

  const handleReset = async () => {
    const confirmed = await confirm({ message: 'Limpar todos os campos?' });
    if (!confirmed) return;
    const emptyState = buildEmptyState();

    setTicker(emptyState.ticker);
    setDiscountRatePct(emptyState.discountRatePct);
    setTotalShares(emptyState.totalShares);
    setTreasuryShares(emptyState.treasuryShares);
    setNetDebt(emptyState.netDebt);
    setCurrentPrice(emptyState.currentPrice);
    setHistoricalProfits(emptyState.historicalProfits);
    setProjectionYears(emptyState.projectionYears);
    setProjectionGrowths(emptyState.projectionGrowths);
    setPerpetuityGrowthPct(emptyState.perpetuityGrowthPct);
    setManualProfits(emptyState.manualProfits);
    setIsProfitManual(emptyState.isProfitManual);
  };

  const performSave = async (): Promise<boolean> => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      toaster.create({ title: 'Informe o ticker da empresa', type: 'error' });
      return false;
    }

    if (dcfResult.intrinsicValuePerShare <= 0) {
      toaster.create({
        title: 'Preencha os dados para calcular o valor intrínseco',
        type: 'error',
      });
      return false;
    }

    const alreadyExists = analyses.some(
      (item) => item.ticker === normalizedTicker && item.ticker !== editingTicker,
    );

    if (alreadyExists) {
      const confirmed = await confirm({
        message: `Já existe uma análise de ${normalizedTicker}. Substituir?`,
      });
      if (!confirmed) return false;
    }

    const now = new Date();
    const savedAt =
      now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    saveAnalysis({
      ticker: normalizedTicker,
      intrinsicFormatted: formatToBRL(dcfResult.intrinsicValuePerShare),
      intrinsicValue: dcfResult.intrinsicValuePerShare,
      currentPrice: String(currentPrice),
      savedAt,
      discountRatePct,
      totalShares,
      treasuryShares,
      netDebt,
      historicalProfits,
      projectionGrowths,
      perpetuityGrowthPct,
      projectionYears,
    });

    toaster.create({ title: `${normalizedTicker} salvo!`, type: 'success' });
    return true;
  };

  const handleSave = () => performSave();

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedModalOpen(true);
    } else {
      navigate('/');
    }
  };

  const marginColor =
    dcfResult.safetyMarginPct == null
      ? COLORS.AMBER
      : dcfResult.safetyMarginPct >= 0
        ? COLORS.AMBER
        : COLORS.RED;

  const upsideColor =
    dcfResult.upsidePct == null
      ? COLORS.TEXT_MUTED
      : dcfResult.upsidePct >= 0
        ? COLORS.GREEN
        : COLORS.RED;

  const validationBadge = (() => {
    if (currentPrice > 0 && dcfResult.intrinsicValuePerShare > 0) {
      if (currentPrice <= dcfResult.intrinsicValuePerShare) {
        return { label: 'Abaixo do intrínseco', color: COLORS.GREEN, bg: COLORS.GREEN_TRANSPARENT };
      }

      return { label: 'Acima do intrínseco', color: COLORS.RED, bg: COLORS.RED_TRANSPARENT };
    }

    return { label: 'Aguardando dados', color: COLORS.AMBER, bg: COLORS.AMBER_TRANSPARENT };
  })();

  const INPUT_BASE_PROPS = {
    bg: '#0c0b17',
    borderColor: COLORS.BORDER,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'mono',
    fontSize: FONT_SIZE.MD,
    _hover: { borderColor: COLORS.BORDER_HOVER },
    _focus: { borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` },
    _placeholder: { color: COLORS.TEXT_MUTED },
  } as const;

  return (
    <Flex direction="column" height="100vh" bg={COLORS.BACKGROUND}>
      {/* Topbar */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        py={4}
        borderBottom={`1px solid ${COLORS.BORDER}`}
        bg="rgba(15, 13, 28, 0.85)"
        backdropFilter="blur(12px)"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex align="center" gap={3}>
          <Button
            size="sm"
            bg="transparent"
            color={COLORS.TEXT_SECONDARY}
            border={`1px solid ${COLORS.BORDER}`}
            _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
            fontFamily="mono"
            fontSize={FONT_SIZE.SM}
            onClick={handleBack}
          >
            <LuArrowLeft /> Voltar
          </Button>
          <Text color={COLORS.TEXT_MUTED} fontFamily="mono" fontSize={FONT_SIZE.SM}>
            /
          </Text>
          <Text color={COLORS.TEXT_MUTED} fontFamily="mono" fontSize={FONT_SIZE.SM}>
            {editingTicker ? `editando ${editingTicker}` : 'nova análise'}
          </Text>
        </Flex>

        <Flex align="center" gap={3}>
          <Box>
            <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono" mb={1}>
              Ticker
            </Text>
            <Input
              type="text"
              value={ticker}
              placeholder="ex: ITUB4"
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              textTransform="uppercase"
              width="120px"
              {...INPUT_BASE_PROPS}
            />
          </Box>
          <Button
            size="sm"
            bg="transparent"
            color={COLORS.TEXT_SECONDARY}
            border={`1px solid ${COLORS.BORDER}`}
            _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
            fontFamily="mono"
            fontSize={FONT_SIZE.SM}
            title="Importar lucros do JSON"
            onClick={() => setIsJSONModalOpen(true)}
            mt={4}
          >
            <LuBraces /> JSON
          </Button>
        </Flex>
      </Flex>

      {/* Body */}
      <Flex flex={1} overflow="hidden" minHeight="0">
        {/* Left panel */}
        <Box
          width="22%"
          minWidth="240px"
          borderRight={`1px solid ${COLORS.BORDER}`}
          p={5}
          overflowY="auto"
          display="flex"
          flexDirection="column"
          gap={5}
        >
          {/* Premises */}
          <Box>
            <Text
              fontSize={FONT_SIZE.XS}
              fontWeight="500"
              color={COLORS.TEXT_MUTED}
              fontFamily="mono"
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb={3}
            >
              Premissas
            </Text>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                  Taxa de desconto
                </Text>
                <Box display="flex" alignItems="center" gap={1}>
                  <Input
                    type="number"
                    value={discountRatePct}
                    min={1}
                    max={50}
                    step={0.5}
                    onChange={(event) =>
                      setDiscountRatePct(parseFloat(event.target.value) || DEFAULT_DISCOUNT_RATE)
                    }
                    textAlign="right"
                    width="64px"
                    {...INPUT_BASE_PROPS}
                  />
                  <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_MUTED} fontFamily="mono">
                    %
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box height="1px" bg={COLORS.BORDER} />

          {/* Company data */}
          <Box>
            <Text
              fontSize={FONT_SIZE.XS}
              fontWeight="500"
              color={COLORS.TEXT_MUTED}
              fontFamily="mono"
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb={3}
            >
              Dados da empresa
            </Text>
            <Box display="flex" flexDirection="column" gap={2}>
              {[
                {
                  label: 'Total de ações',
                  value: totalShares,
                  onChange: setTotalShares,
                  suffix: '',
                },
                {
                  label: 'Ações em tesouraria',
                  value: treasuryShares,
                  onChange: setTreasuryShares,
                  suffix: '',
                },
              ].map(({ label, value, onChange, suffix }) => (
                <Box key={label} display="flex" justifyContent="space-between" alignItems="center">
                  <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                    {label}
                  </Text>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Input
                      value={value || ''}
                      placeholder="0"
                      min={0}
                      onChange={(event) => onChange(parseInt(event.target.value.replace(/\./g, ''), 10) || 0)}
                      textAlign="right"
                      width="130px"
                      {...INPUT_BASE_PROPS}
                    />
                    {suffix && (
                      <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_MUTED} fontFamily="mono">
                        {suffix}
                      </Text>
                    )}
                  </Box>
                </Box>
              ))}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pb={2}
                borderBottom={`1px solid ${COLORS.BORDER}`}
              >
                <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono">
                  Ações ex-tesouraria
                </Text>
                <Text fontSize={FONT_SIZE.XS} color={COLORS.PURPLE} fontFamily="mono">
                  {totalShares > 0 ? formatCompactNumber(sharesOutstanding) : '—'}
                </Text>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                  Dívida líquida
                </Text>
                <InputMoney value={netDebt} onValueChange={setNetDebt} width="130px" />
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                  Preço atual
                </Text>
                <InputMoney value={currentPrice} onValueChange={setCurrentPrice} width="120px" />
              </Box>
            </Box>
          </Box>

          <Box height="1px" bg={COLORS.BORDER} />

          {/* Results */}
          <Box>
            <Text
              fontSize={FONT_SIZE.XS}
              fontWeight="500"
              color={COLORS.TEXT_MUTED}
              fontFamily="mono"
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb={3}
            >
              Resultado
            </Text>
            <Box display="flex" flexDirection="column" gap={2}>
              {[
                {
                  label: 'Market cap',
                  value: formatCompact(Math.round(dcfResult.enterpriseValue)),
                  color: COLORS.PURPLE,
                },
                {
                  label: 'Valor intrínseco/ação',
                  value: formatToBRL(dcfResult.intrinsicValuePerShare),
                  color: COLORS.PURPLE,
                },
                {
                  label: 'Preço teto',
                  value: formatToBRL(dcfResult.intrinsicValuePerShare),
                  color: COLORS.GREEN,
                },
                {
                  label: 'Margem de segurança',
                  value:
                    dcfResult.safetyMarginPct != null
                      ? formatPercent(dcfResult.safetyMarginPct, true)
                      : '—',
                  color: marginColor,
                },
                {
                  label: 'Upside / Downside',
                  value:
                    dcfResult.upsidePct != null ? formatPercent(dcfResult.upsidePct, true) : '—',
                  color: upsideColor,
                },
              ].map(({ label, value, color }) => (
                <Box key={label} display="flex" justifyContent="space-between" alignItems="center">
                  <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                    {label}
                  </Text>
                  <Text fontSize={FONT_SIZE.MD} fontWeight="500" color={color} fontFamily="mono">
                    {value}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Action buttons */}
          <Box display="flex" flexDirection="column" gap={2} mt="auto">
            <Button
              bg={COLORS.PURPLE_DARK}
              color="white"
              _hover={{ opacity: 0.9 }}
              fontFamily="mono"
              fontSize={FONT_SIZE.MD}
              onClick={handleSave}
              width="100%"
            >
              ⊕ Salvar preço teto
            </Button>
            <Button
              bg="transparent"
              color={COLORS.TEXT_SECONDARY}
              border={`1px solid ${COLORS.BORDER}`}
              _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
              fontFamily="mono"
              fontSize={FONT_SIZE.MD}
              onClick={handleReset}
              width="100%"
            >
              ↺ Limpar campos
            </Button>
          </Box>
        </Box>

        {/* Right panel */}
        <Box flex={1} p={6} overflowY="auto" display="flex" flexDirection="column" gap={6}>
          {/* Historical profits */}
          <Box
            bg={COLORS.PURPLE_TRANSPARENT}
            border={`1px solid ${COLORS.PURPLE_SEMI}`}
            borderRadius="10px"
            p={4}
          >
            <Text
              fontSize={FONT_SIZE.XS}
              fontWeight="500"
              color={COLORS.PURPLE}
              fontFamily="mono"
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb={3}
            >
              Lucros líquidos históricos (R$)
            </Text>
            <HistInputs
              historicalProfits={historicalProfits}
              onProfitChange={handleHistoricalProfitChange}
            />
          </Box>

          {/* DCF Table */}
          <DCFTable
            dcfResult={dcfResult}
            projectionYears={projectionYears}
            projectionGrowths={projectionGrowths}
            perpetuityGrowthPct={perpetuityGrowthPct}
            onProjectionYearsChange={setProjectionYears}
            onGrowthChange={handleGrowthChange}
            onGrowthIncrement={handleGrowthIncrement}
            onManualProfitCommit={handleManualProfitCommit}
            onPerpetuityIncrement={handlePerpetuityIncrement}
          />

          {/* Summary cards */}
          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={3}>
            {[
              {
                label: 'VPL fluxos',
                value: formatCompact(Math.round(dcfResult.presentValueFlows)),
                sublabel: 'anos projetados',
                color: COLORS.PURPLE,
              },
              {
                label: 'VPL perpetuidade',
                value: formatCompact(Math.round(dcfResult.presentValueTerminal)),
                sublabel: 'valor terminal',
                color: COLORS.PURPLE,
              },
              {
                label: 'Valor intrínseco',
                value: formatToBRL(dcfResult.intrinsicValuePerShare),
                sublabel: 'por ação',
                color: COLORS.GREEN,
              },
              {
                label: 'Margem de segurança',
                value:
                  dcfResult.safetyMarginPct != null
                    ? formatPercent(dcfResult.safetyMarginPct, true)
                    : '—',
                sublabel:
                  dcfResult.safetyMarginPct != null
                    ? dcfResult.safetyMarginPct >= 0
                      ? 'margem disponível'
                      : 'acima do intrínseco'
                    : 'informe o preço atual',
                color:
                  dcfResult.safetyMarginPct != null
                    ? dcfResult.safetyMarginPct >= 0
                      ? COLORS.GREEN
                      : COLORS.RED
                    : COLORS.AMBER,
              },
            ].map(({ label, value, sublabel, color }) => (
              <Box
                key={label}
                bg={COLORS.SURFACE}
                border={`1px solid ${COLORS.BORDER}`}
                borderRadius="10px"
                p={4}
              >
                <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono" mb={1}>
                  {label}
                </Text>
                <Text
                  fontSize={FONT_SIZE.XL}
                  fontWeight="600"
                  color={color}
                  fontFamily="mono"
                  mb={1}
                >
                  {value}
                </Text>
                <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono">
                  {sublabel}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Validation bar */}
          <Box
            bg={validationBadge.bg}
            border={`1px solid ${validationBadge.color}40`}
            borderRadius="8px"
            p={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Flex align="center" gap={3}>
              <Box
                bg={validationBadge.color}
                color={COLORS.BACKGROUND}
                fontSize={FONT_SIZE.XS}
                fontFamily="mono"
                fontWeight="600"
                px={2}
                py={1}
                borderRadius="4px"
                whiteSpace="nowrap"
              >
                {validationBadge.label}
              </Box>
              <Text fontSize={FONT_SIZE.SM} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
                {currentPrice > 0 && dcfResult.intrinsicValuePerShare > 0
                  ? currentPrice <= dcfResult.intrinsicValuePerShare
                    ? `Margem de ${dcfResult.safetyMarginPct?.toFixed(1)}% — upside de ${dcfResult.upsidePct?.toFixed(2)}%`
                    : `Preço ${Math.abs(dcfResult.upsidePct ?? 0).toFixed(2)}% acima do valor calculado`
                  : 'Preencha os lucros históricos e o preço atual'}
              </Text>
            </Flex>
            <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono">
              {dcfResult.impliedPriceToEarnings !== '—'
                ? `P/L implícito: ${dcfResult.impliedPriceToEarnings}x`
                : ''}
            </Text>
          </Box>
        </Box>
      </Flex>

      <ModalJSONImport
        isOpen={isJSONModalOpen}
        onClose={() => setIsJSONModalOpen(false)}
        onImport={(profits) => {
          setHistoricalProfits(profits);
          setIsJSONModalOpen(false);
        }}
      />
      <ModalUnsavedChanges
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onDiscard={() => navigate('/')}
        onSave={async () => {
          const saved = await performSave();
          if (saved) navigate('/');
          else setIsUnsavedModalOpen(false);
        }}
      />
      <ModalConfirm {...confirmModalProps} />
    </Flex>
  );
};

export default Calculator;
