// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
