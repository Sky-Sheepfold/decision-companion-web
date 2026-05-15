import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<div>对话页面 - 待开发</div>} />
        <Route path="/onboarding" element={<div>冷启动页面 - 待开发</div>} />
        <Route path="/profile" element={<div>档案页面 - 待开发</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
