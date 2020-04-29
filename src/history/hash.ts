import { normalizeBase, CreateHistoryFunction } from './common'
import { createWebHistory } from './html5'

export const createWebHashHistory: CreateHistoryFunction = (base?: string) =>
  // Make sure this implementation is fine in terms of encoding, specially for IE11
  createWebHistory(location.host ? normalizeBase(base) + '/#' : '#')
