/**
 * NOTE: wip of a new navigator interface to replace `history` option and to get ready
 * for the upcoming navigation api
 */

export interface RouterNavigator {
  getState(): unknown

  navigate(url: string, options?: NavigationOptions): void
}
