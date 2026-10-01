// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlippableModal } from './flippable-modal';
vi.mock('./page-content-panel', () => ({ PageContentPanel: () => <p>Cached page content</p> }));
describe('Record dialog sections', () => {
  it('preserves entered form values while visiting page content', () => {
    render(<FlippableModal modal={{ mode: 'edit', title: 'Expense' }} subtitle="Details" deleteLabel="Soft Delete" editing saving={false} onEdit={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} onDuplicate={vi.fn()} onClose={vi.fn()} pageContentResource="expenses" recordId="sample"><input aria-label="Description" defaultValue="Original" /></FlippableModal>);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Unsaved edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Page content' }));
    expect(screen.getByText('Cached page content')).toBeVisible();
    expect(screen.getByLabelText('Description')).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByLabelText('Description')).toHaveValue('Unsaved edit');
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Soft Delete' })).toBeVisible();
    expect(screen.getByRole('dialog', { name: 'Expense' })).toBeInTheDocument();
  });
});
