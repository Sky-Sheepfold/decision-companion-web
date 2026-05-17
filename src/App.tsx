import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import { ChatPage } from './pages/ChatPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
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
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
