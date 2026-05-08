import React, { useState } from 'react';

import { Button, CloseButton, Dialog, Portal, Stack, Text, Textarea } from '@chakra-ui/react';

import { COLORS, FONT_SIZE } from '@theme';
import type { Analysis } from '@appTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (analyses: Analysis[]) => void;
}

const normalizeAnalysis = (entry: Record<string, unknown>): Analysis => ({
  ticker: String(entry.ticker ?? ''),
  intrinsicValue: Number(entry.intrinsicValue ?? entry.precoTetoNum ?? entry.intrinsecNum ?? 0),
  intrinsicFormatted: String(entry.intrinsicFormatted ?? entry.precoTeto ?? entry.intrinseco ?? ''),
  currentPrice: String(entry.currentPrice ?? entry.precoAtual ?? ''),
  savedAt: String(entry.savedAt ?? entry.data ?? ''),
  discountRatePct: Number(entry.discountRatePct ?? entry.td ?? 13),
  totalShares: Number(entry.totalShares ?? entry.nAcoes ?? 0),
  treasuryShares: Number(entry.treasuryShares ?? entry.nTesouraria ?? 0),
  netDebt: entry.netDebt != null
    ? Number(entry.netDebt)
    : entry.netDebtMillions != null
      ? Number(entry.netDebtMillions) * 1_000_000
      : entry.divida != null
        ? Number(entry.divida) * 1_000_000
        : 0,
  historicalProfits: Array.isArray(entry.historicalProfits)
    ? (entry.historicalProfits as number[])
    : Array.isArray(entry.hist)
      ? (entry.hist as number[])
      : [],
  projectionGrowths: Array.isArray(entry.projectionGrowths)
    ? (entry.projectionGrowths as number[])
    : Array.isArray(entry.projGrowths)
      ? (entry.projGrowths as number[])
      : [],
  perpetuityGrowthPct: Number(entry.perpetuityGrowthPct ?? entry.perpRate ?? 3),
  projectionYears: Number(entry.projectionYears ?? entry.projAnos ?? 5),
});

const ModalImport: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [jsonText, setJsonText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setJsonText('');
    setErrorMessage('');
    onClose();
  };

  const handleImport = () => {
    setErrorMessage('');

    let parsedData: unknown;

    try {
      parsedData = JSON.parse(jsonText.trim());
    } catch {
      setErrorMessage('JSON inválido. Verifique o formato e tente novamente.');
      return;
    }

    if (!Array.isArray(parsedData)) {
      setErrorMessage('O JSON precisa ser um array de objetos.');
      return;
    }

    onImport((parsedData as Record<string, unknown>[]).map(normalizeAnalysis));
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && handleClose()}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.8)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg={COLORS.SURFACE}
            border={`1px solid ${COLORS.BORDER}`}
            borderRadius="12px"
            maxWidth="540px"
            width="90%"
          >
            <Dialog.Header
              borderBottom={`1px solid ${COLORS.BORDER}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={4}
            >
              <Dialog.Title fontFamily="mono" fontSize={FONT_SIZE.LG} fontWeight="500" color={COLORS.TEXT_PRIMARY}>
                Importar análises
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" color={COLORS.TEXT_MUTED} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={4}>
              <Stack gap={3}>
                <Text fontSize={FONT_SIZE.MD} color={COLORS.TEXT_SECONDARY}>
                  Cole o JSON exportado por esta calculadora.
                </Text>
                <Textarea
                  value={jsonText}
                  onChange={(event) => setJsonText(event.target.value)}
                  placeholder='[{"ticker":"ITUB4","intrinsicValue":45.00,...}]'
                  rows={7}
                  bg="#0c0b17"
                  borderColor={COLORS.BORDER}
                  color={COLORS.TEXT_PRIMARY}
                  fontFamily="mono"
                  fontSize={FONT_SIZE.SM}
                  resize="none"
                  _hover={{ borderColor: COLORS.BORDER_HOVER }}
                  _focus={{ borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` }}
                  _placeholder={{ color: COLORS.TEXT_MUTED }}
                />
                {errorMessage && (
                  <Text fontSize={FONT_SIZE.SM} color={COLORS.RED}>
                    {errorMessage}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>

            <Dialog.Footer borderTop={`1px solid ${COLORS.BORDER}`} p={4} gap={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                bg="transparent"
                color={COLORS.TEXT_SECONDARY}
                border={`1px solid ${COLORS.BORDER}`}
                _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
                fontFamily="mono"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                bg={COLORS.PURPLE}
                color="white"
                _hover={{ opacity: 0.9 }}
                fontFamily="mono"
              >
                Importar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ModalImport;
