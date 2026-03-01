'use client';

import type { PropsWithChildren, SelectHTMLAttributes } from 'react';

type UiSelectProps = PropsWithChildren<{
  id?: string;
  label?: string;
  labelId?: string;
  wrapperClassName?: string;
  selectClassName?: string;
}> & SelectHTMLAttributes<HTMLSelectElement>;

export function UiSelect({
  id,
  label,
  labelId,
  wrapperClassName = 'checkbox',
  selectClassName = 'select',
  children,
  ...rest
}: UiSelectProps) {
  return (
    <label className={wrapperClassName}>
      {label ? <span id={labelId}>{label}</span> : null}
      <select id={id} className={selectClassName} {...rest}>
        {children}
      </select>
    </label>
  );
}

