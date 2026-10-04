import { createContext, useContext, useState, type ReactNode } from 'react'
type User = { id: number; name: string; role: string }
const Ctx = createContext<{ user: User | null; login: (u: User, t: string) => void; logout: () => void }>({ user: null, login: () => {}, logout: () => {} })
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const login = (u: User, t: string) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.clear(); setUser(null) }
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
