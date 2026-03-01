'use client';

import type { ReactNode } from 'react';
import { Button, Tooltip } from '@mui/material';

type TopMenuActionButtonProps = {
  id: string;
  label: string;
  icon: ReactNode;
  menuItemsAsIcons: boolean;
  onClick: () => void;
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
  const onActionClick = () => {
    onBeforeClick?.();
    onClick();
  };

  if (!menuItemsAsIcons) {
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
