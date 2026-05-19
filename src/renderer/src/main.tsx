import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css' // QUAN TRỌNG: Nếu file css của bạn tên là index.css thì đổi lại dòng này!

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)