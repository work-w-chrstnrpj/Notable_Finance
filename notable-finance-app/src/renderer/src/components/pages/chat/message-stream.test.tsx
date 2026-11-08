// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatDraftDto } from '@shared/finance.types';
import { account } from '../../../../../../test/factories';
import { DraftCard } from './draft-card';
import { MessageStream } from './message-stream';

const writeText = vi.fn(async () => undefined);
const shareReply = vi.fn(async () => ({ ok: true as const, data: true as const }));

describe('MessageStream reply actions', () => {
  beforeEach(() => {
    writeText.mockClear();
    shareReply.mockClear();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    Object.defineProperty(window, 'api', { configurable: true, value: { chat: { shareReply } } });
  });

  it('copies and shares assistant text without adding actions to user messages', async () => {
    render(
      <MessageStream
        messages={[
          { id: 'u1', role: 'user', content: 'report', createdAt: 1, threadId: 't1', payloadJson: null },
          { id: 'a1', role: 'assistant', content: '**Income:** ₱100', createdAt: 2, threadId: 't1', payloadJson: null },
        ]}
        busy={false}
        greeting="Hello"
        dailyAskLine=""
        canChatWithoutKey={false}
        setDraft={vi.fn()}
        pendingDrafts={[]}
        accounts={[]}
        incomeCategories={[]}
        expenseCategories={[]}
        draftBusyId={null}
        needsKey={false}
        onEditDraft={vi.fn()}
        onApproveDraft={vi.fn()}
        onCancelDraft={vi.fn()}
        bottomRef={{ current: null }}
      />
    );

    expect(screen.queryByLabelText('Copy reply u1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Copy reply a1'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('**Income:** ₱100'));
    fireEvent.click(screen.getByLabelText('Share reply a1'));
    await waitFor(() => expect(shareReply).toHaveBeenCalledWith('**Income:** ₱100'));
  });
});

it('shows expense fields for the selected account and category before the draft response returns', () => {
  const draft: ChatDraftDto = {
    id: 'draft', threadId: 'thread', resource: 'expenses', action: 'create',
    kind: 'proposeCreateExpense', status: 'needs_input', summary: 'Expense',
    missingRequired: ['Expense Amount'], warnings: [], createdAt: 1,
    payload: { accountId: 'wallet', categoryId: 'food' },
  };
  const onEdit = vi.fn();
  render(<DraftCard
    draft={draft}
    accounts={[account({ id: 'wallet', name: 'Wallet' }), account({ id: 'card', name: 'Card', type: 'Credit Account' })]}
    expenseCategories={[
      { id: 'food', name: 'Food', icon: null, monthlyBudget: 0, auxiliary: false },
      { id: 'pasabuy', name: 'Pasabuy', icon: null, monthlyBudget: 0, auxiliary: false },
    ]}
    incomeCategories={[]}
    busy={false}
    needsKey={false}
    onEdit={onEdit}
    onApprove={vi.fn()}
    onCancel={vi.fn()}
  />);

  expect(screen.getByLabelText('Date Paid')).toBeInTheDocument();
  expect(screen.queryByLabelText('Payment Status', { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Pasabuy Status')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Account', { exact: true }), { target: { value: 'card' } });
  fireEvent.change(screen.getByLabelText('Category', { exact: true }), { target: { value: 'pasabuy' } });
  expect(screen.getByLabelText('Payment Status', { exact: true })).toBeRequired();
  expect(screen.getByLabelText('Pasabuy Status')).toBeRequired();
  fireEvent.change(screen.getByLabelText('Payment Status', { exact: true }), { target: { value: 'Installment' } });
  expect(screen.getByLabelText('Frequency')).toBeRequired();
  expect(screen.getByLabelText('Period count')).toBeRequired();
  fireEvent.change(screen.getByLabelText('Pasabuy Account Receiver'), { target: { value: 'wallet' } });
  expect(onEdit).toHaveBeenLastCalledWith('draft', { pasabuyAccountReceiverId: 'wallet' });
  fireEvent.change(screen.getByLabelText('Account', { exact: true }), { target: { value: 'wallet' } });
  expect(screen.queryByLabelText('Payment Status', { exact: true })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Pasabuy Status')).toBeInTheDocument();
});
