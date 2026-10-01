// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateRangeSelector } from './date-range';

describe('single date picker', () => {
  it.each(['day', 'week'] as const)('selects a leap day in %s without a second native picker', unit => {
    const onChange = vi.fn();
    const { container } = render(<DateRangeSelector unit={unit} anchorDate="2028-01-31" onChange={onChange} />);
    fireEvent.click(container.querySelector('.month-stepper__label')!);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(container.querySelector('input[type="date"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(screen.getByRole('button', { name: '2028-02-29' }));
    expect(onChange).toHaveBeenCalledWith('2028-02-29');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
