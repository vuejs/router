export class MatchMiss extends Error {
  name = 'MatchMiss'
}

export const miss = () => new MatchMiss()

export class ParamInvalid extends Error {
  name = 'ParamInvalid'
  constructor(public param: string) {
    super()
  }
}
export const invalid = (param: string) => new ParamInvalid(param)
