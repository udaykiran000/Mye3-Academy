// src/pages/Catalog.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMockTests } from '../redux/mockTestSlice';
import { fetchCategories } from '../redux/categorySlice';
import MockTestCard from '../components/MockTestCard';

export default function Catalog() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.mockTest);
  const { items: categories } = useSelector((s) => s.category);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchMockTests('')); // initial load
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    dispatch(fetchMockTests(`?${query.toString()}`));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Mocktests Catalog</h1>
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tests..."
            className="border p-2 rounded"
          />
          <select className="border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories?.map((c) => <option key={c._id} value={c.slug || c._id}>{c.name}</option>)}
          </select>
          <button className="px-3 py-2 bg-slate-700 text-white rounded">Search</button>
        </form>
      </header>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items?.length ? items.map((t) => <MockTestCard key={t._id} test={t} />) : <div>No tests found.</div>}
      </div>
    </div>
  );
}
