export interface User {
  id: number
  name: string
  photoURL: string
}

export async function getUserById(id: string | number | string[]) {
  return {} as User
}
export async function getUserList() {
  return [] as User[]
}

export async function getCommonFriends(
  userAId: string | number | string[],
  userBId: string | number | string[]
) {
  return [] as User[]
}

export async function getCurrentUser() {
  return {} as User
}

export async function getFriends(id: string | number | string[]) {
  return [] as User[]
}
