import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import IssueList from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IssueList />
  </StrictMode>,
)
