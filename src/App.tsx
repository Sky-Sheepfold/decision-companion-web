import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp, ConfigProvider, Spin } from 'antd'
import { ChatPage } from './pages/ChatPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { useAuthStore } from './stores/authStore'
import './styles/global.css'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#C8845A',
          colorBgContainer: '#FFFFFF',
          colorText: '#2C2C2A',
          colorTextSecondary: '#B09880',
          colorBorder: '#EDE0D4',
          borderRadius: 12,
          fontFamily: "'Noto Sans SC', sans-serif",
        },
        components: {
          Card: {
            borderRadius: 16,
          },
          Button: {
            borderRadius: 12,
          },
          Input: {
            borderRadius: 12,
          }
        }
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

function AppRoutes() {
  const { user, initAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void initAuth().finally(() => setReady(true));
  }, [initAuth]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]">
        <Spin size="large" description="正在确认登录状态..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.onboarded ? '/chat' : '/onboarding') : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to={user.onboarded ? '/chat' : '/onboarding'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.onboarded ? '/chat' : '/onboarding'} replace /> : <RegisterPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/login" replace />;
}

export default App
