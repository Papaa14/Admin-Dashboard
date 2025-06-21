import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen } from 'lucide-react';

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface Category {
  id: string;
  name: string;
}

const SupportFaqUI = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories] = useState<Category[]>([
    { id: '1', name: 'General' },
    { id: '2', name: 'Technical' },
    { id: '3', name: 'Account' },
  ]);
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Simulate fetching FAQs and categories
  useEffect(() => {
    // Simulated API calls
    console.log('Fetching FAQs and categories...');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Update existing FAQ
      setFaqs(prev => prev.map(faq =>
        faq.id === editingId ? { ...faq, ...formData } : faq
      ));
      setEditingId(null);
    } else {
      // Create new FAQ
      const newFaq: Faq = {
        id: Date.now().toString(),
        ...formData,
      };
      setFaqs(prev => [...prev, newFaq]);
    }
    // Reset form
    setFormData({
      category: '',
      question: '',
      answer: '',
    });
  };

  const handleEdit = (faq: Faq) => {
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    });
    setEditingId(faq.id);
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(prev => prev.filter(faq => faq.id !== id));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      category: '',
      question: '',
      answer: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Support FAQs</h1>
          <p className="text-slate-600">Manage your support FAQs and their categories</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Question</label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Answer</label>
              <textarea
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save size={16} />
                {editingId ? 'Update FAQ' : 'Save FAQ'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition-all duration-200"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-slate-800">Existing FAQs</h3>
          {faqs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <BookOpen size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 text-lg">No FAQs added yet</p>
              <p className="text-slate-400">Add your first FAQ using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800 truncate">{faq.question}</h4>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{faq.category}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>{faq.answer}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportFaqUI;
