import { describe, expect, it } from 'vitest'
import { checkTopicGuard } from '../src/main/chat/topic-guard'

describe('checkTopicGuard — finance/app lexicon', () => {
  it('lets tipid tips / generic personal-finance advice through', () => {
    expect(checkTopicGuard('Give me a random tipid tips')).toBeNull()
    expect(checkTopicGuard('give me tips to save money this month')).toBeNull()
    expect(checkTopicGuard('Any advice for my budget?')).toBeNull()
    expect(checkTopicGuard('paano mag-ipon ng pera')).toBeNull()
    expect(checkTopicGuard('sulit ba ang sale na ito?')).toBeNull()
    expect(checkTopicGuard('How much should I spend on food and groceries?')).toBeNull()
  })

  it('lets financial insight / summary questions through', () => {
    expect(checkTopicGuard('Give me a financial insight of my July 2026')).toBeNull()
    expect(checkTopicGuard('What is the total expense for 2026?')).toBeNull()
    expect(checkTopicGuard('insights on my spending')).toBeNull()
  })

  it('still blocks clearly off-topic questions', () => {
    expect(checkTopicGuard('What is the weather today in Manila?')).not.toBeNull()
    expect(checkTopicGuard('Tell me a joke about programming')).not.toBeNull()
    expect(checkTopicGuard('who won the basketball game last night')).not.toBeNull()
    expect(checkTopicGuard('recipe for adobo')).not.toBeNull()
  })

  it('lets greetings and short follow-ups through', () => {
    expect(checkTopicGuard('hi')).toBeNull()
    expect(checkTopicGuard('good morning')).toBeNull()
    expect(checkTopicGuard('show me')).toBeNull()
    expect(checkTopicGuard('thank you')).toBeNull()
  })

  it('blocks empty messages with a prompt', () => {
    expect(checkTopicGuard('')).toContain('Please type a question')
    expect(checkTopicGuard('   ')).toContain('Please type a question')
  })
})
