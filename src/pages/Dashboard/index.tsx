import React, { useMemo, useState } from 'react';

import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { LuDownload, LuPencil, LuPlus, LuTrash2, LuUpload } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import ModalConfirm from '@components/ModalConfirm';
import ModalImport from '@components/ModalImport';
import Table from '@components/Table';
import { useAnalyses } from '@hooks/useAnalyses';
import useConfirm from '@hooks/useConfirm';
import { formatPercent, formatToBRL } from '@utils/format';
import { COLORS, FONT_SIZE } from '@theme';
import type { Analysis } from '@appTypes';

const MARGIN_TIERS = {
  GOOD: 20,
  DECENT: 10,
  NEUTRAL: 0,
} as const;

const getMarginTier = (marginPct: number | null) => {
  if (marginPct == null)
    return { label: 'Sem preço', color: COLORS.AMBER, background: COLORS.AMBER_TRANSPARENT };
  if (marginPct < MARGIN_TIERS.NEUTRAL)
    return { label: 'Loucura comprar', color: COLORS.RED, background: COLORS.RED_TRANSPARENT };
  if (marginPct < MARGIN_TIERS.DECENT)
    return {
      label: 'Eu gostaria de um preço melhor',
      color: COLORS.AMBER,
      background: COLORS.AMBER_TRANSPARENT,
    };
  if (marginPct < MARGIN_TIERS.GOOD)
    return { label: 'Ótimo preço', color: COLORS.BLUE, background: COLORS.BLUE_TRANSPARENT };
  return {
    label: 'Preço bom pra caralho',
    color: COLORS.GREEN,
    background: COLORS.GREEN_TRANSPARENT,
  };
};

const computeSafetyMargin = (analysis: Analysis): number | null => {
  const currentPrice = parseFloat(analysis.currentPrice) || 0;
  if (currentPrice <= 0 || analysis.intrinsicValue <= 0) return null;
  return (1 - currentPrice / analysis.intrinsicValue) * 100;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { analyses, deleteAnalysis, updateCurrentPrice, importAnalyses } = useAnalyses();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const { confirm, modalProps: confirmModalProps } = useConfirm();

  const handleExport = () => {
    if (analyses.length === 0) return;
    const blob = new Blob([JSON.stringify(analyses, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `preco-teto-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<Analysis>[]>(
    () => [
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        cell: ({ row }) => {
          const { ticker } = row.original;
          return (
            <Flex
              align="center"
              gap={2}
              cursor="pointer"
              onClick={() => navigate(`/calculator/${ticker}`)}
              _hover={{ opacity: 0.8 }}
              width="fit-content"
            >
              <Box
                bg={COLORS.PURPLE_TRANSPARENT}
                border={`1px solid ${COLORS.PURPLE_SEMI}`}
                borderRadius="6px"
                px={2}
                py={1}
                fontSize={FONT_SIZE.XS}
                fontWeight="700"
                color={COLORS.PURPLE}
                fontFamily="mono"
              >
                {ticker.slice(0, 4)}
              </Box>
              <Text
                fontFamily="heading"
                fontSize={FONT_SIZE.LG}
                fontWeight="700"
                color={COLORS.TEXT_PRIMARY}
              >
                {ticker}
              </Text>
            </Flex>
          );
        },
      },
      {
        accessorKey: 'intrinsicValue',
        header: 'Preço teto',
        cell: ({ getValue }) => (
          <Text fontFamily="mono" fontSize={FONT_SIZE.MD} color={COLORS.GREEN}>
            {formatToBRL(getValue<number>())}
          </Text>
        ),
      },
      {
        id: 'currentPrice',
        accessorFn: (row) => parseFloat(row.currentPrice) || 0,
        header: 'Preço atual',
        cell: ({ row }) => (
          <Input
            type="number"
            step="0.01"
            defaultValue={row.original.currentPrice || ''}
            placeholder="0,00"
            onChange={(event) => updateCurrentPrice(row.original.ticker, event.target.value)}
            bg="#0c0b17"
            borderColor={COLORS.BORDER}
            color={COLORS.TEXT_PRIMARY}
            fontFamily="mono"
            fontSize={FONT_SIZE.MD}
            width="90px"
            _hover={{ borderColor: COLORS.BORDER_HOVER }}
            _focus={{ borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` }}
          />
        ),
      },
      {
        id: 'margin',
        accessorFn: (row) => computeSafetyMargin(row) ?? -Infinity,
        header: 'Margem',
        cell: ({ row }) => {
          const safetyMargin = computeSafetyMargin(row.original);
          const color =
            safetyMargin == null
              ? COLORS.TEXT_MUTED
              : safetyMargin >= 0
                ? COLORS.GREEN
                : COLORS.RED;
          return (
            <Text fontFamily="mono" fontSize={FONT_SIZE.MD} fontWeight="500" color={color}>
              {safetyMargin != null ? formatPercent(safetyMargin, true) : '—'}
            </Text>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => computeSafetyMargin(row) ?? -Infinity,
        header: 'Status',
        cell: ({ row }) => {
          const tier = getMarginTier(computeSafetyMargin(row.original));
          return (
            <Box
              display="inline-flex"
              alignItems="center"
              px={2}
              py={1}
              borderRadius="6px"
              bg={tier.background}
              border={`1px solid ${tier.color}40`}
              fontSize={FONT_SIZE.XS}
              fontFamily="mono"
              color={tier.color}
              whiteSpace="nowrap"
            >
              {tier.label}
            </Box>
          );
        },
      },
      {
        accessorKey: 'savedAt',
        header: 'Atualizado',
        cell: ({ getValue }) => (
          <Text
            fontFamily="mono"
            fontSize={FONT_SIZE.XS}
            color={COLORS.TEXT_MUTED}
            whiteSpace="nowrap"
          >
            {getValue<string>()}
          </Text>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: '',
        cell: ({ row }) => (
          <Flex gap={2} align="center" justify="flex-end">
            <Button
              size="xs"
              bg={COLORS.RED_TRANSPARENT}
              color={COLORS.RED}
              border={`1px solid rgba(240, 82, 82, 0.3)`}
              _hover={{ bg: 'rgba(240, 82, 82, 0.22)' }}
              onClick={async () => {
                const confirmed = await confirm({ message: 'Remover esta análise?' });
                if (confirmed) deleteAnalysis(row.original.ticker);
              }}
              minWidth="32px"
              px={2}
            >
              <LuTrash2 />
            </Button>
            <Button
              size="xs"
              bg={COLORS.PURPLE_TRANSPARENT}
              color={COLORS.PURPLE}
              border={`1px solid ${COLORS.PURPLE_SEMI}`}
              _hover={{ bg: COLORS.PURPLE_SEMI }}
              onClick={() => navigate(`/calculator/${row.original.ticker}`)}
              minWidth="32px"
              px={2}
            >
              <LuPencil />
            </Button>
          </Flex>
        ),
      },
    ],
    [navigate, updateCurrentPrice, deleteAnalysis, confirm],
  );

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
        <Box>
          <Flex align="center" gap={2}>
            <Text fontFamily="heading" fontWeight="700" fontSize={FONT_SIZE.XL} color={COLORS.TEXT_PRIMARY}>
              Preço Teto
            </Text>
            <Text color={COLORS.TEXT_MUTED} fontFamily="mono" fontSize={FONT_SIZE.SM}>/</Text>
            <Text fontFamily="heading" fontWeight="700" fontSize={FONT_SIZE.XL} color={COLORS.TEXT_PRIMARY}>
              Minhas <em style={{ color: COLORS.PURPLE }}>análises</em>
            </Text>
          </Flex>
          <Text fontFamily="mono" fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED}>
            DCF — Análise Fundamentalista
          </Text>
        </Box>

        <Flex gap={2} align="center">
          <Button
            size="sm"
            bg="transparent"
            color={COLORS.TEXT_SECONDARY}
            border={`1px solid ${COLORS.BORDER}`}
            _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
            fontFamily="mono"
            fontSize={FONT_SIZE.SM}
            onClick={handleExport}
            disabled={analyses.length === 0}
          >
            <LuDownload /> Exportar
          </Button>
          <Button
            size="sm"
            bg="transparent"
            color={COLORS.TEXT_SECONDARY}
            border={`1px solid ${COLORS.BORDER}`}
            _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
            fontFamily="mono"
            fontSize={FONT_SIZE.SM}
            onClick={() => setIsImportModalOpen(true)}
          >
            <LuUpload /> Importar
          </Button>
          <Button
            size="sm"
            bg={COLORS.PURPLE}
            color="white"
            _hover={{ opacity: 0.9 }}
            fontFamily="mono"
            fontSize={FONT_SIZE.SM}
            onClick={() => navigate('/calculator')}
          >
            <LuPlus /> Nova análise
          </Button>
        </Flex>
      </Flex>

      {/* Content */}
      <Box px={6} pt={6} pb={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
        {analyses.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={4}
            py={20}
            color={COLORS.TEXT_MUTED}
          >
            <Text fontSize="32px">◈</Text>
            <Text fontFamily="heading" fontSize={FONT_SIZE.XL} color={COLORS.TEXT_SECONDARY}>
              Nenhuma análise ainda
            </Text>
            <Text fontSize={FONT_SIZE.MD} textAlign="center" maxWidth="360px">
              Clique em "Nova análise" para calcular o preço teto de uma empresa pelo método DCF.
            </Text>
            <Button
              mt={2}
              bg={COLORS.PURPLE}
              color="white"
              _hover={{ opacity: 0.9 }}
              fontFamily="mono"
              fontSize={FONT_SIZE.SM}
              onClick={() => navigate('/calculator')}
            >
              <LuPlus /> Começar agora
            </Button>
          </Flex>
        ) : (
          <>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ticker..."
              bg="#0c0b17"
              borderColor={COLORS.BORDER}
              color={COLORS.TEXT_PRIMARY}
              fontFamily="mono"
              fontSize={FONT_SIZE.SM}
              height="3.5rem"
              mb={6}
              _hover={{ borderColor: COLORS.BORDER_HOVER }}
              _focus={{ borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` }}
              _placeholder={{ color: COLORS.TEXT_MUTED }}
            />
            <Box
              flex={1}
              border="1px solid rgba(157, 124, 252, 0.2)"
              borderRadius="12px"
              overflow="hidden"
              bg="rgba(157, 124, 252, 0.04)"
              backdropFilter="blur(20px)"
            >
              <Table
                columns={columns}
                rows={analyses}
                defaultSorting={[{ id: 'margin', desc: true }]}
                globalFilter={search}
                onGlobalFilterChange={setSearch}
                pagination={pagination}
                setPagination={setPagination}
                height="100%"
              />
            </Box>
          </>
        )}
      </Box>

      <Box
        as="footer"
        borderTop={`1px solid ${COLORS.BORDER}`}
        px={6}
        py={4}
        display="flex"
        gap={3}
        alignItems="center"
        fontSize={FONT_SIZE.XS}
        color={COLORS.TEXT_MUTED}
        fontFamily="mono"
      >
        <Text>
          Desenvolvido por{' '}
          <a
            href="https://github.com/IagoAlves777"
            target="_blank"
            rel="noopener"
            style={{ color: COLORS.PURPLE }}
          >
            IagoAlves777
          </a>
        </Text>
        <Text>·</Text>
        <Text>Esta ferramenta não constitui recomendação de investimentos.</Text>
      </Box>

      <ModalImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(importedList) => {
          importAnalyses(importedList);
          setIsImportModalOpen(false);
        }}
      />
      <ModalConfirm {...confirmModalProps} />
    </Flex>
  );
};

export default Dashboard;
