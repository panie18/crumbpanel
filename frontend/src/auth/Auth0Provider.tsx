import { createContext, useContext, useEffect, useState } from 'react';
import { Auth0Provider as Auth0ProviderSDK, useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext<any>(null);

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  return (
    <Auth0ProviderSDK
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
      }}
    >
      <AuthWrapper>{children}</AuthWrapper>
    </Auth0ProviderSDK>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for token in URL (from backend callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem('token');
      if (storedToken) setToken(storedToken);
    }
  }, []);

  const value = {
    isLoading,
    isAuthenticated: isAuthenticated || !!token,
    user,
    token,
    login: loginWithRedirect,
    logout: () => {
      localStorage.removeItem('token');
      logout({ logoutParams: { returnTo: window.location.origin } });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
