import React from 'react';

import { Box, Text } from '@chakra-ui/react';

import InputMoney from '@components/InputMoney';
import { HISTORICAL_YEARS } from '@utils/dcf';
import { COLORS, FONT_SIZE } from '@theme';

interface Props {
  historicalProfits: number[];
  onProfitChange: (index: number, value: number) => void;
}

const HistInputs: React.FC<Props> = ({ historicalProfits, onProfitChange }) => (
  <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={3}>
    {HISTORICAL_YEARS.map((year, index) => (
      <Box key={year}>
        <Text fontSize={FONT_SIZE.XS} color={COLORS.TEXT_MUTED} fontFamily="mono" mb={1}>
          {year}
        </Text>
        <InputMoney
          value={historicalProfits[index] ?? 0}
          onValueChange={(value) => onProfitChange(index, value)}
        />
      </Box>
    ))}
  </Box>
);

export default HistInputs;
