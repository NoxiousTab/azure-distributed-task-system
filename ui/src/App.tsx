import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hub } from './pages/Hub';
import { CategoryPage } from './pages/CategoryPage';
import { ToolPage } from './pages/ToolPage';
import { AboutPage } from './pages/About';

const App: React.FC = () => (
  <BrowserRouter>
    <div className="flex min-h-screen flex-col bg-bg font-body text-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 sm:px-8">
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/:categorySlug/:toolSlug" element={<ToolPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </BrowserRouter>
);

export default App;