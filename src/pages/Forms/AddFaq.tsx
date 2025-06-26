import React, { useState, useEffect, ChangeEvent } from 'react';
import { Edit2, Trash2, Save, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../Api/api';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

// Define interfaces
interface Faq {
  id: string;
  question: string;
  answer: string | null;
  category?: string;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  error: string | null;
}

const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

const SupportFaqUI = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<ApiResponse<string[]>>('/faqs/categories');
        if (response.data.status === 'success') {
          setCategories(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedCategory(response.data.data[0]);
          }
        } else {
          showErrorToast(response.data.error || 'Failed to fetch categories');
        }
      } catch (error: unknown) {
        const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to fetch categories';
        showErrorToast(message || 'Failed to fetch categories');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFaqs = async () => {
      if (!selectedCategory) return;
      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<Faq[]>>(`/faqs?category=${selectedCategory}`);
        if (response.data.status === 'success') {
          setFaqs(response.data.data);
        } else {
          showErrorToast(response.data.error || 'Failed to fetch FAQs');
        }
      } catch (error: unknown) {
        const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to fetch FAQs';
        showErrorToast(message || 'Failed to fetch FAQs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, [selectedCategory]);

  const fetchAnswer = async (id: string) => {
    try {
      const response = await api.get<ApiResponse<Faq>>(`/faqs/${id}`);
      if (response.data.status === 'success') {
        setFaqs(prevFaqs => prevFaqs.map(faq =>
          faq.id === id ? { ...faq, answer: response.data.data.answer } : faq
        ));
      } else {
        showErrorToast(response.data.error || 'Failed to fetch answer');
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to fetch answer';
      showErrorToast(message || 'Failed to fetch answer');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.category || !formData.question || !formData.answer) {
      showErrorToast('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        const response = await api.put<ApiResponse<Faq>>(`/faqs/${editingId}`, formData);
        if (response.data.status === 'success') {
          setFaqs(prev => prev.map(faq => faq.id === editingId ? { ...faq, ...formData } : faq));
          showSuccessToast('FAQ updated successfully');
        } else {
          showErrorToast(response.data.error || 'Failed to update FAQ');
        }
      } else {
        const response = await api.post<ApiResponse<Faq>>('/faqs/', formData);
        if (response.data.status === 'success') {
          setFaqs(prev => [...prev, response.data.data]);
          showSuccessToast('FAQ added successfully');
          if (!categories.includes(formData.category)) {
            setCategories(prev => [...prev, formData.category]);
          }
        } else {
          showErrorToast(response.data.error || 'Failed to add FAQ');
        }
      }
      setFormData({ category: '', question: '', answer: '' });
      setShowAddForm(false);
      setEditingId(null);
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred while saving FAQ';
      showErrorToast(message || 'An error occurred while saving FAQ');
    }
  };

  const handleEdit = (faq: Faq) => {
    setFormData({
      category: faq.category || '',
      question: faq.question,
      answer: faq.answer || '',
    });
    setEditingId(faq.id);
    setShowAddForm(false); // Hide the main add form if editing inline
  };

  const handleDelete = (id: string) => {
    confirmDelete(
      'Are you sure you want to delete this FAQ?',
      async () => {
        try {
          const response = await api.delete<ApiResponse<null>>(`/faqs/${id}`);
          if (response.data.status === 'success') {
            setFaqs(prev => prev.filter(faq => faq.id !== id));
            showSuccessToast('FAQ deleted successfully');
          } else {
            showErrorToast(response.data.error || 'Failed to delete FAQ');
          }
        } catch (error: unknown) {
          const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to delete FAQ';
          showErrorToast(message || 'Failed to delete FAQ');
        }
      }
    );
  };

  const toggleFaq = (id: string) => {
    if (expandedFaqId === id) {
      setExpandedFaqId(null);
    } else {
      setExpandedFaqId(id);
      const faq = faqs.find(faq => faq.id === id);
      if (faq && faq.answer === null) {
        fetchAnswer(id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <PageMeta title="Frequently Asked Questions" description="Manage your support FAQs and their categories" />
      <div className="container mx-auto px-4 py-8">
        <PageBreadcrumb pageTitle="Frequently Asked Questions" />
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({ category: '', question: '', answer: '' });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} /> Add New FAQ
          </button>
        </div>
         {showAddForm && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Enter a new category"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
                      <input
                        type="text"
                        name="question"
                        value={formData.question}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Enter your question here..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer</label>
                      <textarea
                        name="answer"
                        value={formData.answer}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Enter the answer here..."
                        required
                        rows={5}
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Save size={16} /> {editingId ? 'Update FAQ' : 'Save FAQ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingId(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition-all duration-200"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">FAQs for {selectedCategory}</h3>
              {isLoading ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                  <p>Loading...</p>
                </div>
              ) : faqs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-lg">No FAQs added yet</p>
                  <p className="text-slate-400 dark:text-slate-500">Click "Add New FAQ" to create your first FAQ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="flex-1 font-semibold text-slate-800 dark:text-slate-100 text-lg cursor-pointer" onClick={() => toggleFaq(faq.id)}>{faq.question}</h4>
                          <button
                            onClick={() => toggleFaq(faq.id)}
                            className="flex-shrink-0 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {expandedFaqId === faq.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                          </button>
                        </div>
                        
                        {expandedFaqId === faq.id && faq.answer && ! (editingId === faq.id) &&(
                          <div className="mt-4 space-y-2 text-slate-600 dark:text-slate-300">
                            <p className="leading-relaxed">{faq.answer}</p>
                          </div>
                        )}

                        {editingId === faq.id ? (
                          <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
                              <input
                                type="text"
                                name="question"
                                value={formData.question}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer</label>
                              <textarea
                                name="answer"
                                value={formData.answer}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                required
                                rows={5}
                              />
                            </div>
                            <div className="flex gap-4">
                              <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <Save size={16} /> Update FAQ
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition-all duration-200"
                              >
                                <X size={16} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                           <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => handleEdit(faq)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 font-medium rounded-lg transition-all duration-200 text-sm"
                            >
                                <Edit2 size={14} /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(faq.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-medium rounded-lg transition-all duration-200 text-sm"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportFaqUI;