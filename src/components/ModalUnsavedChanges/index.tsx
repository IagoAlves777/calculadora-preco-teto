import React from 'react';

import { Button, CloseButton, Dialog, Flex, Portal, Text } from '@chakra-ui/react';

import { COLORS, FONT_SIZE } from '@theme';

interface Props {
  isOpen: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onClose: () => void;
}

const ModalUnsavedChanges: React.FC<Props> = ({ isOpen, onDiscard, onSave, onClose }) => (
  <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
    <Portal>
      <Dialog.Backdrop bg="rgba(0,0,0,0.8)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg={COLORS.SURFACE}
          border={`1px solid ${COLORS.BORDER}`}
          borderRadius="12px"
          maxWidth="420px"
          width="90%"
        >
          <Dialog.Header
            borderBottom={`1px solid ${COLORS.BORDER}`}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            p={4}
          >
            <Dialog.Title
              fontFamily="mono"
              fontSize={FONT_SIZE.LG}
              fontWeight="500"
              color={COLORS.TEXT_PRIMARY}
            >
              Alterações não salvas
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color={COLORS.TEXT_MUTED} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={4}>
            <Text fontSize={FONT_SIZE.MD} color={COLORS.TEXT_SECONDARY} fontFamily="mono">
              Você tem alterações não salvas. O que deseja fazer?
            </Text>
          </Dialog.Body>

          <Dialog.Footer borderTop={`1px solid ${COLORS.BORDER}`} p={4}>
            <Flex gap={2} justify="flex-end" width="100%">
              <Button
                size="sm"
                onClick={onClose}
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
                onClick={onDiscard}
                bg="transparent"
                color={COLORS.RED}
                border={`1px solid ${COLORS.RED}`}
                _hover={{ bg: COLORS.RED_TRANSPARENT }}
                fontFamily="mono"
              >
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                bg={COLORS.PURPLE_DARK}
                color="white"
                _hover={{ opacity: 0.9 }}
                fontFamily="mono"
              >
                Salvar
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

export default ModalUnsavedChanges;
