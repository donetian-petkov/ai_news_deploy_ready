'use client';

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type UiButtonVariant = 'default' | 'danger' | 'ghost';

type UiButtonProps = PropsWithChildren<{
  variant?: UiButtonVariant;
}> & ButtonHTMLAttributes<HTMLButtonElement>;

export function UiButton({
  children,
  className = '',
  type = 'button',
  variant = 'default',
  ...rest
}: UiButtonProps) {
  const variantClass = variant === 'danger'
    ? 'danger'
    : variant === 'ghost'
      ? 'ghost'
      : '';
  const cls = ['btn', variantClass, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

