import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Hub } from './pages/Hub';
import { CategoryPage } from './pages/CategoryPage';
import { ToolPage } from './pages/ToolPage';
import { AboutPage } from './pages/About';

const App: React.FC = () => (
  <BrowserRouter>
    <div className="min-h-screen bg-bg font-body text-ink">
      <Navbar />
      <main className="mx-auto max-w-5xl px-8 pb-24">
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/:categorySlug/:toolSlug" element={<ToolPage />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  </BrowserRouter>
);

export default App;
