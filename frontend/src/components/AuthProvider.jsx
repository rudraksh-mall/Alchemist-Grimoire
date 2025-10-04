import { AuthContext, useAuthProvider } from '../hooks/useAuth';

export function AuthProvider({ children }) {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
