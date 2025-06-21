import { useState, ChangeEvent, FormEvent } from 'react';
import { Upload, Image, ExternalLink, Calendar, Trash2, Edit3, Save, X } from 'lucide-react';

interface SupportImage {
  id: string;
  category: string;
  action: number;
  external_url: string;
  internal_url: string;
  display_from: string;
  display_until: string;
  file_url: string;
  original_name: string;
  user_id: string;
}

interface TempUpload {
  id: string;
  original_name: string;
  file_url: string;
}

interface FormData {
  category: string;
  action: string;
  external_url: string;
  internal_url: string;
  display_from: string;
  display_until: string;
  user_id: string;
  temp_upload_id: string;
}

const SupportImageUI = () => {
  const [images, setImages] = useState<SupportImage[]>([
    {
      id: '1',
      category: 'Banner',
      action: 1,
      external_url: 'https://example.com',
      internal_url: '',
      display_from: '2024-01-01T10:00',
      display_until: '2024-12-31T23:59',
      file_url: 'https://cdn.amazons.co.ke/storage/images/uploads/684d5e4e01405_1749900878.jpeg',
      original_name: 'sample-banner.jpg',
      user_id: 'user123'
    }
  ]);

  const categories = ['Hotspot', 'Home-Fibre', 'Captive-Portal'];

  const [tempUploads, setTempUploads] = useState<TempUpload[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: '',
    action: '0',
    external_url: '',
    internal_url: '',
    display_from: '',
    display_until: '',
    user_id: 'user123',
    temp_upload_id: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newUpload: TempUpload = {
        id: Date.now().toString(),
        original_name: file.name,
        file_url: URL.createObjectURL(file)
      };
      setTempUploads(prev => [...prev, newUpload]);
      setIsUploading(false);
    }, 2000);
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (editingId) {
      setImages(prev => prev.map(img =>
        img.id === editingId
          ? {
              ...img,
              category: formData.category,
              action: parseInt(formData.action),
              external_url: formData.external_url,
              internal_url: formData.internal_url,
              display_from: formData.display_from,
              display_until: formData.display_until
            }
          : img
      ));
      setEditingId(null);
    } else {
      const selectedUpload = tempUploads.find(upload => upload.id === formData.temp_upload_id);
      if (selectedUpload) {
        const newImage: SupportImage = {
          id: Date.now().toString(),
          category: formData.category,
          action: parseInt(formData.action),
          external_url: formData.external_url,
          internal_url: formData.internal_url,
          display_from: formData.display_from,
          display_until: formData.display_until,
          file_url: selectedUpload.file_url,
          original_name: selectedUpload.original_name,
          user_id: formData.user_id
        };
        setImages(prev => [...prev, newImage]);
        setTempUploads(prev => prev.filter(upload => upload.id !== formData.temp_upload_id));
      }
    }
    setFormData({
      category: '',
      action: '0',
      external_url: '',
      internal_url: '',
      display_from: '',
      display_until: '',
      user_id: 'user123',
      temp_upload_id: '',
    });
  };

  const handleEdit = (image: SupportImage) => {
    setFormData({
      category: image.category,
      action: image.action.toString(),
      external_url: image.external_url,
      internal_url: image.internal_url,
      display_from: image.display_from,
      display_until: image.display_until,
      user_id: image.user_id,
      temp_upload_id: '',
    });
    setEditingId(image.id);
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      category: '',
      action: '0',
      external_url: '',
      internal_url: '',
      display_from: '',
      display_until: '',
      user_id: 'user123',
      temp_upload_id: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Support Images</h1>
          <p className="text-slate-600">Manage your support images and their display settings</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {editingId ? <Edit3 size={20} /> : <Upload size={20} />}
              {editingId ? 'Edit Image' : 'Upload New Image'}
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
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Link Type</label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="0">Internal Link</option>
                  <option value="1">External Link</option>
                </select>
              </div>
            </div>

            {formData.action === '1' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ExternalLink size={16} />
                  External URL
                </label>
                <input
                  type="url"
                  name="external_url"
                  value={formData.external_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            )}

            {formData.action === '0' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Internal URL</label>
                <input
                  type="text"
                  name="internal_url"
                  value={formData.internal_url}
                  onChange={handleInputChange}
                  placeholder="/dashboard/page"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Calendar size={16} />
                  Display From
                </label>
                <input
                  type="datetime-local"
                  name="display_from"
                  value={formData.display_from}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Calendar size={16} />
                  Display Until
                </label>
                <input
                  type="datetime-local"
                  name="display_until"
                  value={formData.display_until}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {!editingId && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Upload size={16} />
                    Upload Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/jpg"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>

                {tempUploads.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Uploaded Image</label>
                    <select
                      name="temp_upload_id"
                      value={formData.temp_upload_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="">Select an uploaded image</option>
                      {tempUploads.map((upload) => (
                        <option key={upload.id} value={upload.id}>{upload.original_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save size={16} />
                {editingId ? 'Update Image' : 'Save Image'}
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
          <h3 className="text-2xl font-semibold text-slate-800">Existing Images</h3>
          {images.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <Image size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 text-lg">No images uploaded yet</p>
              <p className="text-slate-400">Upload your first image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {images.map((image) => (
                <div key={image.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    <img
                      src={image.file_url}
                      alt={image.original_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                        {image.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800 truncate">{image.original_name}</h4>
                      <div className="flex items-center gap-1">
                        {image.action === 1 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">External</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Internal</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        {image.action === 1 ? <ExternalLink size={14} /> : <div className="w-3.5 h-3.5 bg-blue-500 rounded-full"></div>}
                        <span className="truncate">
                          {image.action === 1 ? image.external_url : image.internal_url}
                        </span>
                      </div>
                      {image.display_from && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>
                            From: {new Date(image.display_from).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {image.display_until && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>
                            Until: {new Date(image.display_until).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
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

export default SupportImageUI;
