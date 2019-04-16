export class NoRouteMatchError extends Error {
  constructor(currentLocation: any, location: any) {
    super('No match for' + JSON.stringify({ ...currentLocation, ...location }))
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
