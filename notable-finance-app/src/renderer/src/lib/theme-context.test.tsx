// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './theme-context';
import { DEFAULT_SETTINGS } from './ui-settings-context';
import { PRESETS } from './presets';

const state = vi.hoisted(() => ({ settings: {} as typeof DEFAULT_SETTINGS, update: vi.fn() }));
vi.mock('./ui-settings-context', async importOriginal => {
  const original = await importOriginal<typeof import('./ui-settings-context')>();
  return { ...original, useUiSettings: () => ({ settings: state.settings, ready: true, updateSettings: state.update }) };
});
vi.mock('./font-loader', () => ({ loadGoogleFont: vi.fn() }));

function Controls() {
  const theme = useTheme();
  return <>
    <button onClick={() => theme.setMode('dark')}>Dark</button>
    <button onClick={() => theme.setMode('light')}>Light</button>
    <button onClick={() => theme.setMode('system')}>System</button>
    {PRESETS.map(p => <button key={p.id} onClick={() => theme.setPreset(p.id)}>{p.id}</button>)}
  </>;
}

beforeEach(() => {
  state.settings = { ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, mode: 'light' }, fonts: { bodyFont: 'Arial', monoFont: 'Courier New', brandFont: 'Georgia', receiptFont: 'Times New Roman' } };
  state.update.mockReset();
  document.documentElement.removeAttribute('style');
});
afterEach(() => vi.restoreAllMocks());

describe('Redesign appearance preservation', () => {
  it.each(PRESETS)('applies $id light and dark tokens', async preset => {
    state.settings.theme = { ...state.settings.theme, preset: preset.id };
    render(<ThemeProvider><Controls /></ThemeProvider>);
    await waitFor(() => expect(document.documentElement.dataset.preset).toBe(preset.id));
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(preset.light['--bg']);
    fireEvent.click(screen.getByText('Dark'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe((preset.dark ?? preset.light)['--bg']);
    expect(document.documentElement.style.getPropertyValue('--font-body')).toContain('Arial');
    expect(document.documentElement.style.getPropertyValue('--font-mono')).toContain('Courier New');
    expect(document.documentElement.style.getPropertyValue('--font-brand')).toContain('Georgia');
    expect(document.documentElement.style.getPropertyValue('--font-receipt')).toContain('Times New Roman');
    expect(state.update).not.toHaveBeenCalledWith(expect.objectContaining({ fonts: expect.anything() }));
  });

  it('reapplies the current preset when system appearance changes', async () => {
    let dark = false;
    let change: (() => void) | undefined;
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      get matches() { return dark; }, media: query,
      addEventListener: (_event: string, handler: () => void) => { change = handler; },
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));
    state.settings.theme = { ...state.settings.theme, mode: 'system', preset: 'hig' };
    render(<ThemeProvider><Controls /></ThemeProvider>);
    await waitFor(() => expect(document.documentElement.dataset.preset).toBe('hig'));
    act(() => { dark = true; change?.(); });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--surface')).toBe(PRESETS.find(p => p.id === 'hig')!.dark!['--surface']);
    expect(state.update).not.toHaveBeenCalled();
  });
});
