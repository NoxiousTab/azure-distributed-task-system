import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { SubmitTaskPage } from './pages/SubmitTask';
import { TaskStatusPage } from './pages/TaskStatus';
import { RecentTasksPage } from './pages/RecentTasks';
import { AboutPage } from './pages/About';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar darkMode={darkMode} toggleDarkMode={() => setDarkMode((d) => !d)} />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitTaskPage />} />
            <Route path="/status" element={<TaskStatusPage />} />
            <Route path="/recent" element={<RecentTasksPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </div>
    </BrowserRouter>
  );
};

export default App;
