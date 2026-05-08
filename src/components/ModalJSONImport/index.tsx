import React, { useState } from 'react';

import { Button, CloseButton, Dialog, Flex, Portal, Stack, Text, Textarea } from '@chakra-ui/react';

import { HISTORICAL_YEARS } from '@utils/dcf';
import { formatMoneyMask } from '@utils/format';
import { COLORS, FONT_SIZE } from '@theme';

interface ProfitJsonEntry {
  year: string;
  value: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (historicalProfits: number[]) => void;
}

const FOUR_DIGIT_YEAR_REGEX = /^\d{4}$/;

const ModalJSONImport: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [jsonText, setJsonText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewValues, setPreviewValues] = useState<(number | null)[]>([]);

  const parseAndPreview = (rawText: string) => {
    setErrorMessage('');

    if (!rawText.trim()) {
      setPreviewValues([]);

      return;
    }

    let parsedData: unknown;

    try {
      parsedData = JSON.parse(rawText.trim());
    } catch {
      setErrorMessage('JSON inválido.');
      setPreviewValues([]);

      return;
    }

    if (!Array.isArray(parsedData)) {
      setErrorMessage('O JSON precisa ser um array de objetos.');
      setPreviewValues([]);

      return;
    }

    const profitsByYear = new Map<number, number>(
      (parsedData as ProfitJsonEntry[])
        .filter((entry) => FOUR_DIGIT_YEAR_REGEX.test(String(entry.year)))
        .map((entry) => [Number(entry.year), entry.value]),
    );

    setPreviewValues(HISTORICAL_YEARS.map((year) => profitsByYear.get(year) ?? null));
  };

  const handleTextChange = (rawText: string) => {
    setJsonText(rawText);
    parseAndPreview(rawText);
  };

  const handleImport = () => {
    if (previewValues.every((value) => value == null)) {
      setErrorMessage('Nenhum ano válido encontrado no JSON.');

      return;
    }

    onImport(previewValues.map((value) => value ?? 0));
    handleClose();
  };

  const handleClose = () => {
    setJsonText('');
    setErrorMessage('');
    setPreviewValues([]);
    onClose();
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
                Importar lucros históricos
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" color={COLORS.TEXT_MUTED} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={4}>
              <Stack gap={3}>
                <Text fontSize={FONT_SIZE.MD} color={COLORS.TEXT_SECONDARY}>
                  Cole o JSON com os lucros históricos exportado do seu site de dados.
                </Text>
                <Textarea
                  value={jsonText}
                  onChange={(event) => handleTextChange(event.target.value)}
                  placeholder='[{"period":"2025","year":"2025","value":9017329000,...}]'
                  rows={6}
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

                {previewValues.some((value) => value != null) && (
                  <Flex gap={2} flexWrap="wrap">
                    {HISTORICAL_YEARS.map((year, index) => (
                      <div
                        key={year}
                        style={{
                          background: COLORS.BACKGROUND,
                          border: `1px solid ${previewValues[index] != null ? COLORS.PURPLE : COLORS.BORDER}`,
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: FONT_SIZE.XS,
                          fontFamily: 'monospace',
                          color: previewValues[index] != null ? COLORS.TEXT_PRIMARY : COLORS.TEXT_MUTED,
                        }}
                      >
                        <div style={{ color: COLORS.TEXT_MUTED }}>{year}</div>
                        <div>{previewValues[index] != null ? formatMoneyMask(previewValues[index]!) : '—'}</div>
                      </div>
                    ))}
                  </Flex>
                )}

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

export default ModalJSONImport;
