import * as read from './read-tools'
import * as write from './write-tools'

export type ChatToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

const monthProp = {
  type: 'string',
  description: 'Month as YYYY-MM, or relative phrase (this month, last month, July 2026).'
}

/** Allow-listed read tools only (Phase 6.2). No delete / propose write tools. */
export const READ_TOOL_DEFINITIONS: ChatToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'getDashboardSummary',
      description: 'Dashboard totals for a month (income, expense, margin, cash flow counts).',
      parameters: {
        type: 'object',
        properties: { month: monthProp },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getMonthlyMonitoringSnapshot',
      description:
        'Full Monthly Monitoring snapshot for a month: income/expense/net and category budget vs spending.',
      parameters: {
        type: 'object',
        properties: { month: monthProp },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listAccounts',
      description: 'List local accounts with balances (active by default).',
      parameters: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean', description: 'Include inactive accounts.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listIncomeCategories',
      description: 'List income categories. normalOnly=true excludes auxiliary workflow categories.',
      parameters: {
        type: 'object',
        properties: {
          normalOnly: {
            type: 'boolean',
            description: 'Default true — exclude Transfer/CC Payment/IOU/etc.'
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listExpenseCategories',
      description: 'List expense categories with monthly budgets.',
      parameters: { type: 'object', properties: {}, additionalProperties: false }
    }
  },
  {
    type: 'function',
    function: {
      name: 'queryIncomes',
      description: 'Query income records with optional month/range/account/category/view filters.',
      parameters: {
        type: 'object',
        properties: {
          month: monthProp,
          rangeStart: { type: 'string' },
          rangeEnd: { type: 'string' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          view: {
            type: 'string',
            enum: ['incomes', 'transfers', 'creditCardPayments', 'alkansya', 'receivables']
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'queryExpenses',
      description:
        'Query expenses. Use expenseViewMode for UI scopes: Daily, Weekly, Monthly, Annually, Unpaid Pasabuy, To pay, To buy, Installments, Unpaid CC.',
      parameters: {
        type: 'object',
        properties: {
          month: monthProp,
          rangeStart: { type: 'string' },
          rangeEnd: { type: 'string' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          paymentStatus: { type: 'string' },
          expenseViewMode: { type: 'string' },
          viewMode: { type: 'string' },
          pasabuyer: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCategoryBudgetStatus',
      description: 'Category budget vs spending for a month; optionally filter by category id/name.',
      parameters: {
        type: 'object',
        properties: {
          month: monthProp,
          categoryId: { type: 'string' },
          categoryName: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'explainAppTopic',
      description: 'Explain how an app topic/workflow works (Transfer, Pasabuy, soft/hard delete, sync, etc.).',
      parameters: {
        type: 'object',
        properties: { topic: { type: 'string' } },
        required: ['topic'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getExpenseFieldSchema',
      description: 'Which expense profile fields apply for an account/category/view (base / CC / Pasabuy).',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          categoryName: { type: 'string' },
          viewMode: { type: 'string' },
          expenseViewMode: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'planRebudget',
      description:
        'Build a same-total rebudget plan table. adjustments are { categoryName, delta } that MUST sum to 0. Read-only — does not write budgets.',
      parameters: {
        type: 'object',
        properties: {
          month: monthProp,
          adjustments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                categoryName: { type: 'string' },
                delta: { type: 'number' }
              },
              required: ['categoryName', 'delta']
            }
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resolveMonth',
      description: 'Resolve a relative month phrase to YYYY-MM.',
      parameters: {
        type: 'object',
        properties: {
          phrase: { type: 'string' },
          month: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  }
]

const dateProp = {
  type: 'string',
  description: 'YYYY-MM-DD or today/yesterday/tomorrow.'
}

/** Propose-only write tools (Phase 6.3). Applied only via chat:confirmDraft. */
export const WRITE_TOOL_DEFINITIONS: ChatToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'proposeCreateIncome',
      description:
        'Propose a normal income create (not workflows). Returns a draft for user Approve. Do not claim saved.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: dateProp,
          grossIncome: { type: 'number' },
          amount: { type: 'number' },
          capitalExpenditure: { type: 'number' },
          accountId: { type: 'string' },
          accountName: { type: 'string' },
          categoryId: { type: 'string' },
          categoryName: { type: 'string' },
          notes: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeCreateExpense',
      description:
        'Propose an expense create. Set profile/pasabuy/creditCard when known. Returns draft for Approve.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          name: { type: 'string' },
          purchaseDate: dateProp,
          date: dateProp,
          datePaid: dateProp,
          amount: { type: 'number' },
          interest: { type: 'number' },
          accountId: { type: 'string' },
          accountName: { type: 'string' },
          categoryId: { type: 'string' },
          categoryName: { type: 'string' },
          profile: { type: 'string', enum: ['base', 'creditCard', 'pasabuy'] },
          creditCard: { type: 'boolean' },
          pasabuy: { type: 'boolean' },
          paymentStatus: { type: 'string' },
          paymentFrequency: { type: 'string' },
          periodCount: { type: 'number' },
          paidPeriod: { type: 'number' },
          pasabuyer: { type: 'string' },
          pasabuyStatus: { type: 'string' },
          pasabuyDateOfPayment: dateProp,
          pasabuyAccountReceiver: { type: 'string' },
          viewMode: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeCreateTransfer',
      description: 'Propose Transfer workflow (locked Transfer category). Non-credit source + destination.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: dateProp,
          amount: { type: 'number' },
          grossIncome: { type: 'number' },
          sourceAccountId: { type: 'string' },
          sourceAccount: { type: 'string' },
          accountId: { type: 'string' },
          transferAccountId: { type: 'string' },
          transferAccount: { type: 'string' },
          transactedAccountId: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeCreateCcPayment',
      description: 'Propose Credit Card Payment (locked category). CC account credit-like + non-credit payer.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: dateProp,
          amount: { type: 'number' },
          grossIncome: { type: 'number' },
          ccAccountId: { type: 'string' },
          ccAccount: { type: 'string' },
          accountId: { type: 'string' },
          payerAccountId: { type: 'string' },
          payerAccount: { type: 'string' },
          transactedAccountId: { type: 'string' },
          ccPaymentCoveredId: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeCreateAlkansya',
      description: 'Propose Alkansya/savings income (default Savings category, non-credit account).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: dateProp,
          amount: { type: 'number' },
          grossIncome: { type: 'number' },
          accountId: { type: 'string' },
          account: { type: 'string' },
          categoryId: { type: 'string' },
          categoryName: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeCreateReceivable',
      description: 'Propose Receivable (income; account may be empty). Requires category.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: dateProp,
          amount: { type: 'number' },
          grossIncome: { type: 'number' },
          capitalExpenditure: { type: 'number' },
          accountId: { type: 'string' },
          account: { type: 'string' },
          categoryId: { type: 'string' },
          categoryName: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeUpdateIncome',
      description: 'Propose update to one income by id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          recordId: { type: 'string' },
          name: { type: 'string' },
          date: dateProp,
          grossIncome: { type: 'number' },
          amount: { type: 'number' },
          capitalExpenditure: { type: 'number' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          notes: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeUpdateExpense',
      description: 'Propose update to one expense by id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          recordId: { type: 'string' },
          description: { type: 'string' },
          name: { type: 'string' },
          purchaseDate: dateProp,
          date: dateProp,
          datePaid: dateProp,
          amount: { type: 'number' },
          interest: { type: 'number' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          paymentStatus: { type: 'string' },
          pasabuyer: { type: 'string' },
          pasabuyStatus: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeMassUpdateIncomes',
      description: 'Propose mass income update (max 50 ids). Same patch applied to all.',
      parameters: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          patch: { type: 'object' },
          grossIncome: { type: 'number' },
          date: dateProp,
          accountId: { type: 'string' }
        },
        additionalProperties: true
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'proposeMassUpdateExpenses',
      description: 'Propose mass expense update (max 50 ids).',
      parameters: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          patch: { type: 'object' },
          amount: { type: 'number' },
          paymentStatus: { type: 'string' },
          datePaid: dateProp
        },
        additionalProperties: true
      }
    }
  }
]

export const CHAT_TOOL_DEFINITIONS: ChatToolDefinition[] = [
  ...READ_TOOL_DEFINITIONS,
  ...WRITE_TOOL_DEFINITIONS
]

const ALLOWED = new Set(CHAT_TOOL_DEFINITIONS.map((t) => t.function.name))
const FORBIDDEN_NAME = /delete|softDelete|hardDelete|archive|trash/i

export function listAllowedChatToolNames(): string[] {
  return [...ALLOWED].sort()
}

export function isChatToolAllowed(name: string): boolean {
  return ALLOWED.has(name) && !FORBIDDEN_NAME.test(name) && !name.toLowerCase().includes('delete')
}

export type ChatToolContext = { threadId: string }

export function executeChatTool(
  name: string,
  argsJson: string,
  ctx: ChatToolContext
): unknown {
  if (FORBIDDEN_NAME.test(name) || name.toLowerCase().includes('delete')) {
    return { error: 'Forbidden tool — finance delete tools are not available in Chat.' }
  }
  if (!ALLOWED.has(name)) {
    return { error: `Unknown or disallowed tool: ${name}` }
  }

  let args: unknown = {}
  try {
    args = argsJson?.trim() ? JSON.parse(argsJson) : {}
  } catch {
    return { error: 'Invalid tool arguments JSON' }
  }

  switch (name) {
    case 'getDashboardSummary':
      return read.getDashboardSummary(args)
    case 'getMonthlyMonitoringSnapshot':
      return read.getMonthlyMonitoringSnapshot(args)
    case 'listAccounts':
      return read.listAccountsTool(args)
    case 'listIncomeCategories':
      return read.listIncomeCategoriesTool(args)
    case 'listExpenseCategories':
      return read.listExpenseCategoriesTool(args)
    case 'queryIncomes':
      return read.queryIncomes(args)
    case 'queryExpenses':
      return read.queryExpenses(args)
    case 'getCategoryBudgetStatus':
      return read.getCategoryBudgetStatus(args)
    case 'explainAppTopic':
      return read.explainAppTopic(args)
    case 'getExpenseFieldSchema':
      return read.getExpenseFieldSchema(args)
    case 'planRebudget':
      return read.planRebudget(args)
    case 'resolveMonth':
      return read.resolveMonthTool(args)
    case 'proposeCreateIncome':
      return write.proposeCreateIncome(args, ctx)
    case 'proposeCreateExpense':
      return write.proposeCreateExpense(args, ctx)
    case 'proposeCreateTransfer':
      return write.proposeCreateTransfer(args, ctx)
    case 'proposeCreateCcPayment':
      return write.proposeCreateCcPayment(args, ctx)
    case 'proposeCreateAlkansya':
      return write.proposeCreateAlkansya(args, ctx)
    case 'proposeCreateReceivable':
      return write.proposeCreateReceivable(args, ctx)
    case 'proposeUpdateIncome':
      return write.proposeUpdateIncome(args, ctx)
    case 'proposeUpdateExpense':
      return write.proposeUpdateExpense(args, ctx)
    case 'proposeMassUpdateIncomes':
      return write.proposeMassUpdateIncomes(args, ctx)
    case 'proposeMassUpdateExpenses':
      return write.proposeMassUpdateExpenses(args, ctx)
    default:
      return { error: `Unknown or disallowed tool: ${name}` }
  }
}

/** @deprecated prefer executeChatTool */
export function executeReadTool(name: string, argsJson: string): unknown {
  return executeChatTool(name, argsJson, { threadId: 'test-thread' })
}
