// Renders a finance page inside the same provider stack production mounts in
// src/renderer/src/main.tsx (App()) — minus the window-chrome-only providers
// (AppTabsProvider, IpcInvalidationBridge) that page components never consume.
// Reference data only starts loading once UiSettingsProvider's `ready` flips and
// AuthProvider's stub user resolves, both async — assert with `findBy*`/`waitFor`,
// not immediately after render().
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import { UiSettingsProvider } from '../src/renderer/src/lib/ui-settings-context'
import { ThemeProvider } from '../src/renderer/src/lib/theme-context'
import { AuthProvider } from '../src/renderer/src/lib/auth-context'
import { FinanceDataProvider } from '../src/renderer/src/lib/finance-data-context'
import { ShortcutProvider } from '../src/renderer/src/lib/shortcuts/context'
import { FabExportProvider } from '../src/renderer/src/lib/fab-export-context'
import { installMockWindowApi } from './mock-window-api'
import type { PreloadApi } from '../src/preload/index'

type MockOverrides = Parameters<typeof installMockWindowApi>[0]

export function renderPage(
  ui: ReactElement,
  options: { apiOverrides?: MockOverrides } = {}
): RenderResult & { api: PreloadApi; queryClient: QueryClient } {
  const api = installMockWindowApi(options.apiOverrides)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } }
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <UiSettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <FinanceDataProvider>
              <ShortcutProvider>
                <FabExportProvider>{ui}</FabExportProvider>
              </ShortcutProvider>
            </FinanceDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </UiSettingsProvider>
    </QueryClientProvider>
  )

  return { ...result, api, queryClient }
}
