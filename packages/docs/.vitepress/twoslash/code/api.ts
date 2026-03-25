export interface User {
  id: number
  name: string
  photoURL: string
}

export async function getUserById(_id: string | number | string[]) {
  return {} as User
}
export async function getUserList() {
  return [] as User[]
}

export async function getCommonFriends(
  _userAId: string | number | string[],
  _userBId: string | number | string[]
) {
  return [] as User[]
}

export async function getCurrentUser() {
  return {} as User
}

export async function getFriends(_id: string | number | string[]) {
  return [] as User[]
}
