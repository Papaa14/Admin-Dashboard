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
  const [showModal, setShowModal] = useState(false);

  // Add some sample FAQs for demonstration
  useEffect(() => {
    const sampleFaqs: Faq[] = [
      {
        id: '1',
        category: 'General',
        question: 'How do I contact support?',
        answer: 'You can contact our support team through email at support@example.com or by calling 1-800-SUPPORT during business hours.'
      },
      {
        id: '2',
        category: 'Technical',
        question: 'Why is my app running slowly?',
        answer: 'App performance can be affected by various factors including device storage, network connection, and background apps. Try clearing cache or restarting the app.'
      },
      {
        id: '3',
        category: 'Account',
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your registered email address.'
      }
    ];
    setFaqs(sampleFaqs);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.category || !formData.question || !formData.answer) {
      alert('Please fill in all fields');
      return;
    }
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
    // Reset form and close modal
    setFormData({
      category: '',
      question: '',
      answer: '',
    });
    setShowModal(false);
  };

  const handleEdit = (faq: Faq) => {
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    });
    setEditingId(faq.id);
    setShowModal(true);
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
    setShowModal(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      category: '',
      question: '',
      answer: '',
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Support FAQs</h1>
              <p className="text-slate-600">Manage your support FAQs and their categories</p>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add New FAQ
            </button>
          </div>
        </div>

        {/* Existing FAQs */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-slate-800">Existing FAQs ({faqs.length})</h3>
          {faqs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <BookOpen size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 text-lg">No FAQs added yet</p>
              <p className="text-slate-400">Click "Add New FAQ" to create your first FAQ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800 text-lg">{faq.question}</h4>
                      <div className="flex items-center gap-1">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">{faq.category}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-slate-600">
                      <p className="leading-relaxed">{faq.answer}</p>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                  {editingId ? 'Edit FAQ' : 'Add New FAQ'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-slate-200 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
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
                    placeholder="Enter your question here..."
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
                    placeholder="Enter the answer here..."
                    required
                    rows={5}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Save size={16} />
                    {editingId ? 'Update FAQ' : 'Save FAQ'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition-all duration-200"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportFaqUI;