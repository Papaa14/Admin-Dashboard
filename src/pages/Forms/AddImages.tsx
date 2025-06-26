import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Upload, Image, Trash2, Edit3, Save, X, Plus, Calendar, Link as LinkIcon, ExternalLink, Loader2, Eye, List } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import api from '../../Api/api';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';

// --- TYPE DEFINITIONS ---

interface ImageType {
    id: string;
    category: string;
    action: boolean | string;
    external_url: string;
    internal_url: string;
    url?: string;
    display_from: string;
    display_until: string;
    file_url: string;
    original_name: string;
}

interface ActiveImageType {
    id: number;
    category: string;
    file_url: string;
    action: boolean;
    url: string;
}

type GroupedActiveImages = Record<string, ActiveImageType[]>;

// --- HELPER FUNCTIONS ---

const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
    return typeof error === 'object' && error !== null && 'response' in error;
};

// --- COMPONENT ---

const SupportImageUI = () => {
    // --- STATE MANAGEMENT ---
    const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
    const [images, setImages] = useState<ImageType[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeImages, setActiveImages] = useState<GroupedActiveImages>({});
    const [isLoadingActive, setIsLoadingActive] = useState(true);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingImage, setEditingImage] = useState<ImageType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUrlSection, setShowUrlSection] = useState(false);
    const [showDurationSection, setShowDurationSection] = useState(false);

    const initialFormData = {
        category: '',
        action: '',
        external_url: '',
        internal_url: '',
        display_from: '',
        display_until: '',
        file: null as File | null,
    };

    const [formData, setFormData] = useState(initialFormData);

    // --- DATA FETCHING ---

    const fetchCategories = async () => {
        try {
            const response = await api.get('images/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showErrorToast('Could not fetch image categories.');
        }
    };

    const fetchActiveImages = async () => {
        setIsLoadingActive(true);
        try {
            const response = await api.get('/images/imagesActive');
            const imagesData: ActiveImageType[] = response.data.data || [];
            const grouped = imagesData.reduce((acc, image) => {
                const { category } = image;
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(image);
                return acc;
            }, {} as GroupedActiveImages);
            setActiveImages(grouped);
        } catch (error) {
            console.error('Error fetching active images:', error);
            setActiveImages({});
        } finally {
            setIsLoadingActive(false);
        }
    };

    const fetchAllImagesForCategory = async (category: string) => {
        if (category) {
            setIsLoadingAll(true);
            try {
                const response = await api.get(`images?category=${category}`);
                setImages(response.data.data.data || response.data.data || []);
            } catch (error) {
                console.error(`Error fetching images for category ${category}:`, error);
                setImages([]);
                showErrorToast(`Failed to fetch images for ${category}.`);
            } finally {
                setIsLoadingAll(false);
            }
        } else {
            setImages([]);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchActiveImages();
    }, []);

    useEffect(() => {
        fetchAllImagesForCategory(selectedCategory);
    }, [selectedCategory]);

    const refreshAllData = async () => {
        await fetchActiveImages();
        if (selectedCategory) {
            await fetchAllImagesForCategory(selectedCategory);
        }
    };

    // --- FORM & CRUD HANDLERS ---

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingImage(null);
        setShowForm(false);
        setShowUrlSection(false);
        setShowDurationSection(false);
        setIsSubmitting(false);
    };

    const handleEdit = (image: ImageType) => {
        setEditingImage(image);
        setFormData({
            ...initialFormData,
            ...image,
            action: image.action ? String(image.action) : '',
            internal_url: image.internal_url || (image.url?.startsWith('/') ? image.url : '') || '',
            external_url: image.external_url || (image.url?.startsWith('http') ? image.url : '') || '',
            display_from: image.display_from ? new Date(image.display_from).toISOString().slice(0, 16) : '',
            display_until: image.display_until ? new Date(image.display_until).toISOString().slice(0, 16) : '',
            file: null,
        });
        setShowForm(true);
        setShowUrlSection(!!(image.action || image.url || image.internal_url || image.external_url));
        setShowDurationSection(!!(image.display_from || image.display_until));
        
        setTimeout(() => {
            const formElement = document.getElementById('image-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleDelete = async (id: string, name: string) => {
        await confirmDelete(`image "${name}"`, async () => {
            try {
                const response = await api.delete(`images/${id}`);
                showSuccessToast(response.data.message || 'Image deleted successfully!');
                await refreshAllData();
            } catch (error) {
                const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to delete image.';
                showErrorToast(message || 'An error occurred.');
            }
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionData = new FormData();
        const dataToSubmit = { ...formData };

        if (!showUrlSection) {
            dataToSubmit.action = '';
            dataToSubmit.external_url = '';
            dataToSubmit.internal_url = '';
        }
        if (!showDurationSection) {
            dataToSubmit.display_from = '';
            dataToSubmit.display_until = '';
        }

        Object.entries(dataToSubmit).forEach(([key, value]) => {
            if (value !== null) {
                submissionData.append(key, value as string | Blob);
            }
        });

        try {
            const url = editingImage ? `images/${editingImage.id}` : 'images';
            const response = await api.post(url, submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const successMessage = editingImage ? 'Image updated successfully!' : 'Image added successfully!';
            showSuccessToast(response.data.message || successMessage);
            resetForm();
            await refreshAllData();
        } catch (error) {
            const message = isAxiosError(error) ? error.response?.data?.message : 'Submission failed.';
            showErrorToast(message || 'An error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sliderSettings = {
        dots:false,
        infinite: true,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 ">
            <PageMeta title="Support Images" description="Manage and configure support images." />
            <PageBreadcrumb pageTitle="Support Images" />
            <div className="container mx-auto px-4 py-8">

                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">Support Images</h1>
                        <p className="text-slate-600 dark:text-slate-400">Add, edit, and manage all support images.</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? 'Close Form' : (editingImage ? 'Edit Image' : 'Add New Image')}
                    </button>
                </div>

                {showForm && (
                    <div id="image-form" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden mb-12 transition-all duration-500">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Upload size={20} />
                                {editingImage ? `Editing: ${editingImage.original_name}` : 'Upload New Image'}
                            </h2>
                            <button onClick={resetForm} className="text-white hover:text-purple-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image File</label>
                                    <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/60" />
                                    {editingImage && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave blank to keep the current image.</p>}
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <input type="text" id="category" name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                </div>
                                <div className="flex items-center space-x-4 self-end">
                                    <div className="flex items-center">
                                        <input type="checkbox" id="showUrlSection" checked={showUrlSection} onChange={() => setShowUrlSection(!showUrlSection)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-gray-600 dark:bg-gray-700 rounded" />
                                        <label htmlFor="showUrlSection" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Add Action URL</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="checkbox" id="showDurationSection" checked={showDurationSection} onChange={() => setShowDurationSection(!showDurationSection)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-gray-600 dark:bg-gray-700 rounded" />
                                        <label htmlFor="showDurationSection" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Set Display Duration</label>
                                    </div>
                                </div>
                                {showUrlSection && (
                                    <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4 border dark:border-gray-600">
                                        <div>
                                            <label htmlFor="action" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action Type</label>
                                            <input type="text" id="action" name="action" value={formData.action} onChange={handleInputChange} placeholder="e.g., 'open_url', 'navigate'" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                        </div>
                                        <div>
                                            <label htmlFor="internal_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Internal URL</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                                <input type="text" id="internal_url" name="internal_url" value={formData.internal_url} onChange={handleInputChange} placeholder="/path/to/page" className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="external_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">External URL</label>
                                            <div className="relative">
                                                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                                <input type="text" id="external_url" name="external_url" value={formData.external_url} onChange={handleInputChange} placeholder="https://example.com" className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showDurationSection && (
                                    <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 border dark:border-gray-600">
                                        <div>
                                            <label htmlFor="display_from" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display From</label>
                                            <input type="datetime-local" id="display_from" name="display_from" value={formData.display_from} onChange={handleInputChange} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                        </div>
                                        <div>
                                            <label htmlFor="display_until" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Until</label>
                                            <input type="datetime-local" id="display_until" name="display_until" value={formData.display_until} onChange={handleInputChange} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={resetForm} className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 dark:bg-gray-600 dark:text-slate-200 dark:hover:bg-gray-500 transition-all duration-200">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {editingImage ? 'Update Image' : 'Save Image'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                <div className="flex justify-center mb-8 border border-slate-300 dark:border-gray-700 rounded-full p-1 bg-slate-100 dark:bg-gray-800 w-fit mx-auto shadow-sm">
                    <button onClick={() => setViewMode('active')} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'active' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}>
                        <Eye size={16}/> Active Images
                    </button>
                    <button onClick={() => setViewMode('all')} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'all' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}>
                        <List size={16} /> All Images (Manage)
                    </button>
                </div>
                
                {viewMode === 'active' && (
                    <div className="animate-fade-in">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Active Images Preview</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">This is what users currently see, grouped by category.</p>
                        </div>
                        {isLoadingActive ? (
                            <div className="text-center p-8 flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400"><Loader2 className="animate-spin" size={24} /><span>Loading Active Images...</span></div>
                        ) : Object.keys(activeImages).length > 0 ? (
                            <div className="space-y-12">
                                {Object.entries(activeImages).map(([category, images]) => (
                                    <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl  border-slate-200 dark:border-gray-700 p-2">
                                        <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 capitalize">{category}</h3>
                                        <div className="w-full max-w-4xl mx-auto">
                                            <Slider {...sliderSettings}>
                                                {images.map((image) => (
                                                    <div key={image.id} className="px-2">
                                                        <div className="relative group rounded-lg overflow-hidden shadow-md aspect-video">
                                                            <img src={image.file_url} alt={`Active image for ${category}`} className="w-full h-full object-cover" />
                                                            {image.action && (
                                                                <a href={image.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                                                    <span className="flex items-center gap-2 text-white font-bold bg-blue-600/80 px-4 py-2 rounded-full"><ExternalLink size={16} />Go to Link</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </Slider>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-12 text-center">
                                <Image size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Active Images Found</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">There are currently no images set to be active.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'all' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Manage All Images</h3>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Select a category to view, edit, or delete its images.</p>
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full max-w-md mx-auto block px-4 py-3 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        >
                            <option value="">-- Select a Category --</option>
                            {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
                        </select>
                        {isLoadingAll ? (
                            <div className="text-center p-8 flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400"><Loader2 className="animate-spin" size={24} /><span>Loading Images...</span></div>
                        ) : selectedCategory && images.length > 0 ? (
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border-slate-200 dark:border-gray-700">
                                <div className="w-full max-w-4xl mx-auto">
                                    <Slider {...sliderSettings} key={selectedCategory}>
                                        {images.map((image) => (
                                            <div key={image.id} className="px-4 py-2">
                                                <div className="relative group overflow-hidden rounded-xl shadow-lg">
                                                    <img src={image.file_url} alt={image.original_name} className="w-full aspect-video object-cover rounded-xl transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(image)} className="p-3 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm text-slate-800 dark:text-slate-200 rounded-full hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600 transition-all duration-200 shadow-md"><Edit3 size={18} /></button>
                                                        <button onClick={() => handleDelete(image.id, image.original_name)} className="p-3 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm text-slate-800 dark:text-slate-200 rounded-full hover:bg-white dark:hover:bg-gray-800 hover:text-red-600 transition-all duration-200 shadow-md"><Trash2 size={18} /></button>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                                                        <h4 className="text-xl font-bold drop-shadow-md">{image.original_name}</h4>
                                                        {/* --- MODIFICATION: Details with icons now displayed on hover --- */}
                                                        <div className="text-sm mt-2 space-y-1 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                                            {image.display_from && <p className="flex items-center gap-2"><Calendar size={14} /> <strong>From:</strong> {new Date(image.display_from).toLocaleString()}</p>}
                                                            {image.display_until && <p className="flex items-center gap-2"><Calendar size={14} /> <strong>Until:</strong> {new Date(image.display_until).toLocaleString()}</p>}
                                                            {image.internal_url && <p className="flex items-center gap-2"><LinkIcon size={14} /> <strong>Internal:</strong> {image.internal_url}</p>}
                                                            {image.external_url && <p className="flex items-center gap-2"><ExternalLink size={14} /> <strong>External:</strong> {image.external_url}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Slider>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-12 text-center">
                                <Image size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Images to Display</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">
                                    {selectedCategory ? 'There are no images in this category.' : 'Please select a category to view images.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportImageUI;