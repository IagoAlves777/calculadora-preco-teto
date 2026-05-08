import React, { useEffect, useMemo } from 'react';

import { Box, Button, Flex, Input, Spinner, Text } from '@chakra-ui/react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMedia } from 'react-use';

import { COLORS, FONT_SIZE } from '@theme';

const headerCellStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: FONT_SIZE.XS,
  fontFamily: 'monospace',
  fontWeight: 500,
  color: COLORS.TEXT_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(157, 124, 252, 0.2)',
  background: '#13111f',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const bodyCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: 'monospace',
  fontSize: FONT_SIZE.MD,
  color: COLORS.TEXT_PRIMARY,
  borderBottom: '1px solid rgba(157, 124, 252, 0.1)',
};

interface Props<T extends object> {
  columns: ColumnDef<T>[];
  rows: T[];
  title?: string;
  actions?: React.ReactNode | React.ReactNode[];
  height?: string;
  isLoading?: boolean;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  selectedRows?: T[];
  defaultSorting?: SortingState;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

function Table<T extends object>({
  columns,
  rows: tableRows,
  title,
  actions,
  height,
  isLoading,
  pagination,
  setPagination,
  selectedRows = [],
  defaultSorting = [],
  showSearch = false,
  searchPlaceholder = 'Buscar...',
}: Props<T>) {
  const isMobile = useMedia('(max-width: 992px)');
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialRowSelection: Record<number, boolean> = {};

    tableRows.forEach((row, index) => {
      selectedRows.forEach((selectedRow) => {
        if (JSON.stringify(row) === JSON.stringify(selectedRow)) {
          initialRowSelection[index] = true;
        }
      });
    });

    if (
      JSON.stringify(initialRowSelection) !== JSON.stringify(rowSelection) &&
      (Object.keys(rowSelection).length !== tableRows.length || selectedRows.length === 0)
    ) {
      setRowSelection(initialRowSelection);
    }
  }, [rowSelection, selectedRows, tableRows]);

  const table = useReactTable({
    data: tableRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      rowSelection,
      sorting,
      globalFilter,
      pagination: pagination ?? { pageIndex: 0, pageSize: tableRows.length },
    },
    autoResetPageIndex: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 52,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  const currentIndex = table.getState().pagination.pageIndex;

  const pageOptions = useMemo(() => {
    const options = table.getPageOptions();

    if (!options.length || !tableRows.length) return [0];

    const total = options.length;
    const range = isMobile ? 3 : 7;
    const halfRange = Math.floor(range / 2) - 1;
    const start = Math.max(0, Math.min(currentIndex - 1 - halfRange, total - range));
    const end = Math.min(total, start + range);

    return options.slice(start, end);
  }, [table, tableRows.length, isMobile, currentIndex]);

  return (
    <Flex flexDir="column" gap="0.5rem" ref={tableContainerRef} overflowY="auto" height={height ?? 'auto'} width="100%">
      {title && (
        <Flex justifyContent="space-between" p={6}>
          <Text fontFamily="heading" fontSize={FONT_SIZE.XL} fontWeight="700" color={COLORS.TEXT_PRIMARY}>
            {title}
          </Text>
          <Flex gap="1rem">{actions}</Flex>
        </Flex>
      )}

      {showSearch && (
        <Box px={4} pt={3}>
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            bg="#0c0b17"
            borderColor={COLORS.BORDER}
            color={COLORS.TEXT_PRIMARY}
            fontFamily="mono"
            fontSize={FONT_SIZE.MD}
            _hover={{ borderColor: COLORS.BORDER_HOVER }}
            _focus={{ borderColor: COLORS.PURPLE, boxShadow: `0 0 0 1px ${COLORS.PURPLE}` }}
            _placeholder={{ color: COLORS.TEXT_MUTED }}
          />
        </Box>
      )}

      <Box overflowX="auto" width="100%" flex={1}>
        {isLoading && tableRows.length < 1 && (
          <Flex justifyContent="center" py={8}>
            <Spinner color={COLORS.PURPLE} />
          </Flex>
        )}
        {!isLoading && tableRows.length < 1 && (
          <Flex justifyContent="center" py={8}>
            <Text fontFamily="mono" fontSize={FONT_SIZE.MD} color={COLORS.TEXT_MUTED}>Sem dados</Text>
          </Flex>
        )}

        {tableRows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const sortIcon = sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : canSort ? ' ↕' : '';

                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        style={{
                          ...headerCellStyle,
                          width: header.getSize() ? `${header.getSize()}px` : undefined,
                          cursor: canSort ? 'pointer' : 'default',
                          userSelect: 'none',
                          color: sorted ? COLORS.PURPLE : COLORS.TEXT_MUTED,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span style={{ opacity: sorted ? 1 : 0.4 }}>{sortIcon}</span>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];

                return (
                  <tr
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    style={{
                      background: row.getIsSelected() ? COLORS.PURPLE_TRANSPARENT : 'transparent',
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={bodyCellStyle}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Box>

      {pagination && setPagination && (
        <Flex justifyContent="space-between" padding="1rem 1.5rem">
          <Flex width="6.25rem">
            {table.getCanPreviousPage() && (
              <Button
                size="sm"
                bg="transparent"
                color={COLORS.TEXT_SECONDARY}
                border={`1px solid ${COLORS.BORDER}`}
                _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
                fontFamily="mono"
                onClick={() => table.previousPage()}
              >
                Anterior
              </Button>
            )}
          </Flex>

          <Flex gap="0.5rem">
            {pageOptions.map((page) => {
              const isActive = table.getState().pagination.pageIndex === page;

              return (
                <Button
                  key={page}
                  size="sm"
                  bg={isActive ? COLORS.PURPLE_SEMI : 'transparent'}
                  color={isActive ? COLORS.PURPLE : COLORS.TEXT_MUTED}
                  border={`1px solid ${isActive ? COLORS.PURPLE : COLORS.BORDER}`}
                  fontFamily="mono"
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </Button>
              );
            })}
          </Flex>

          <Flex width="6.25rem" justifyContent="flex-end">
            {table.getCanNextPage() && (
              <Button
                size="sm"
                bg="transparent"
                color={COLORS.TEXT_SECONDARY}
                border={`1px solid ${COLORS.BORDER}`}
                _hover={{ bg: COLORS.SURFACE_HOVER, color: COLORS.TEXT_PRIMARY }}
                fontFamily="mono"
                onClick={() => table.nextPage()}
              >
                Próximo
              </Button>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default Table;
