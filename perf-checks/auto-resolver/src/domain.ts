export type Status = 'active' | 'paused' | 'review'
export interface WorkRecord {
  id: string
  title: string
  owner: { name: string; team: string }
  status: Status
  budget: number
  progress: number
  tags: string[]
  updatedAt: Date
}
export type Activity =
  | { kind: 'comment'; id: string; actor: string; body: string }
  | {
      kind: 'status'
      id: string
      actor: string
      previous: Status
      next: Status
    }
  | { kind: 'budget'; id: string; actor: string; amount: number }
export interface Column<T> {
  key: string
  label: string
  value: (row: T) => string
}
export function makeRecords(section: string): WorkRecord[] {
  const statuses: Status[] = ['active', 'paused', 'review']
  return Array.from({ length: 24 }, (_, i) => ({
    id: String(i + 1),
    title: section + ' initiative ' + (i + 1),
    owner: {
      name: ['Alex Chen', 'Sam Rivera', 'Jo Martin'][i % 3] ?? 'Alex Chen',
      team: i % 2 ? 'Product' : 'Engineering',
    },
    status: statuses[i % 3] ?? 'active',
    budget: 1200 + i * 340,
    progress: (i * 13 + 20) % 100,
    tags: ['Q4', i % 2 ? 'Customer' : 'Platform'],
    updatedAt: new Date(Date.UTC(2026, 9, 1 + i)),
  }))
}
export const activities: Activity[] = [
  {
    kind: 'comment',
    id: '1',
    actor: 'Alex Chen',
    body: 'The first milestone is ready for review.',
  },
  {
    kind: 'status',
    id: '2',
    actor: 'Sam Rivera',
    previous: 'paused',
    next: 'active',
  },
  { kind: 'budget', id: '3', actor: 'Jo Martin', amount: 4800 },
]
