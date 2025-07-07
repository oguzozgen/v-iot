import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { ProtectedAppComp } from './components/ProtectedAppComp/ProtectedAppComp';
import configApp from './config/config.app';
import './App.css'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { PermissionsProvider } from './hooks/usePermissions';
import RoutesProject from './routes-project';
import HeaderComp from './components/HeaderComp/HeaderComp';
import { AxiosContextProvider } from './context/axios-context';
import { SocketContextProvider } from './context/socket-context';

const { Content, Footer } = Layout;

// Memoize the style object to prevent re-creation on every render
const styleContent = {
  marginTop: "1.5rem",
  marginLeft: "0.7rem",
  marginRight: "0.7rem",
  marginBottom: "1.5rem",
  minHeight: "84vh",
};

const footerStyle = {
  textAlign: 'center',
};

// Memoize the Clerk appearance configuration
const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

// Memoize the main app content to prevent unnecessary re-renders
const AppContent = React.memo(({ currentUserRoles, setCurrentUserRoles }) => {
  return (
    <Layout>
      <HeaderComp />
      <Content style={styleContent}>
        <ProtectedAppComp
          currentUserRoles={currentUserRoles}
          setCurrentUserRoles={setCurrentUserRoles}
        >
          <PermissionsProvider initialPermissions={currentUserRoles}>
            <RoutesProject />
          </PermissionsProvider>
        </ProtectedAppComp>
        <Outlet />
      </Content>
      <Footer style={footerStyle}>
        V-IOT - IOT Fleet Management ©{new Date().getFullYear()} Created by Ozz
      </Footer>

    </Layout>
  );
});

AppContent.displayName = 'AppContent';

function App() {
  const [currentUserRoles, setCurrentUserRoles] = useState([]);

  // Memoize the setCurrentUserRoles callback to prevent recreation
  const handleSetCurrentUserRoles = useCallback((roles) => {
    setCurrentUserRoles(roles);
  }, []);

  // Memoize the Clerk configuration to prevent recreation
  const clerkConfig = useMemo(() => ({
    frontendApi: configApp.openId.clerkFrontEndApi,
    publishableKey: configApp.openId.clerkPublishableKey,
    tokenCache: "localstorage",
    appearance: clerkAppearance,
    afterSignOutUrl: "/home"
  }), []);

  useEffect(() => {
    // Only runs when currentUserRoles actually changes
  }, [currentUserRoles]);

  return (
    <ClerkProvider
      frontendApi={clerkConfig.frontendApi}
      publishableKey={clerkConfig.publishableKey}
      tokenCache={clerkConfig.tokenCache}
      appearance={clerkConfig.appearance}
      afterSignOutUrl={clerkConfig.afterSignOutUrl}
    >
      <SignedIn>
        <SocketContextProvider>
          <AxiosContextProvider>
            <AppContent
              currentUserRoles={currentUserRoles}
              setCurrentUserRoles={handleSetCurrentUserRoles}
            />
          </AxiosContextProvider>
        </SocketContextProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider >
  );
}

export default App;
