import { EmployeeRole } from "../types";

export type AccessAction =
  | 'search'
  | 'stats'
  | 'allWaves'
  | 'anyTableOpen'
  | 'editEmployee'
  | 'deleteEmployee'
  | 'transferEmployee'
  | 'addEmployee'
  | 'duplicateControl'
  | 'ownTableOpen'
  | 'ownWaveMap';

const ACCESS: Record<AccessAction, EmployeeRole[]> = {
  search: ['facilitator'],
  stats: ['facilitator'],
  allWaves: ['facilitator'],
  anyTableOpen: ['facilitator'],
  editEmployee: ['facilitator'],
  deleteEmployee: ['facilitator'],
  transferEmployee: ['facilitator'],
  addEmployee: ['facilitator'],
  duplicateControl: ['facilitator'],
  ownTableOpen: ['employee', 'facilitator'],
  ownWaveMap: ['employee', 'facilitator'],
};

export function can(action: AccessAction, role: EmployeeRole): boolean {
  return ACCESS[action]?.includes(role) ?? false;
}
