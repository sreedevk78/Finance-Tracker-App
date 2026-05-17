import type { useFinanceData } from '../hooks/useFinanceData';

export type Workspace = ReturnType<typeof useFinanceData>;

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
