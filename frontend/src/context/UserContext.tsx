import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: number | null;
  setUserId: (id: number | null) => void;
  login: (id: number) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(null);

  const setUserId = (id: number | null) => setUserIdState(id);
  const login = (id: number) => setUserIdState(id);
  const logout = () => setUserIdState(null);

  return (
    <UserContext.Provider value={{ userId, setUserId, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
