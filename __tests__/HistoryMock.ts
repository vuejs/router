import { HistoryLocationNormalized, START } from '../src/history/base'
import { AbstractHistory } from '../src/history/abstract'

export class HistoryMock extends AbstractHistory {
  constructor(start: string | HistoryLocationNormalized = START) {
    super()
    const location =
      typeof start === 'string' ? this.utils.normalizeLocation(start) : start
    this.queue = [location]
  }
}
