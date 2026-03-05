'use client';

import type { ReactNode } from 'react';
import { Button, Tooltip } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

type TopMenuActionButtonProps = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  menuItemsAsIcons?: boolean;
  onBeforeClick?: () => void;
};

export function TopMenuActionButton({
  id,
  label,
  icon,
  menuItemsAsIcons,
  onClick,
  onBeforeClick
}: TopMenuActionButtonProps) {
  const topMenu = useTopMenuContext();
  const iconMode = menuItemsAsIcons ?? topMenu.menuItemsAsIcons;
  const beforeClick = onBeforeClick ?? topMenu.onPlayToggleSound;

  const onActionClick = () => {
    beforeClick?.();
    onClick();
  };

  if (!iconMode) {
    return (
      <Button id={id} className="btn ghost" size="small" variant="outlined" type="button" onClick={onActionClick}>
        {label}
      </Button>
    );
  }

  return (
    <Tooltip title={label}>
      <Button
        id={id}
        className="btn ghost topMenuActionBtnIconOnly"
        size="small"
        variant="outlined"
        type="button"
        aria-label={label}
        onClick={onActionClick}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
