import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import ImageUploadCard from "../../components/form/form-elements/ImageUploadCard";
import api from "../../Api/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Edit2, Trash2, Save, X, Plus, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';


// --- INTERFACES TO MATCH THE PAGINATED API STRUCTURE ---
interface Config {
  id?: number | string;
  name: string;
  value: string;
  avatarId?: number | string;
}

interface Avatar {
  id: number;
  originalId: string;
  url: string;
  name: string;
}
interface GroupItem {
  id: string;
  url: string;
  created_at?: string; // Optional if not always present
}

interface SupportNumber {
  id: number;
  value: string;
}

interface Pagination {
  has_more: boolean;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface ConfigData {
  [key: string]: {
    path?: string;
    url?: string;
    id?: string;
  } | string | Array<SupportNumber> | object;
}

interface ApiData {
  data: ConfigData;
  pagination: Pagination;
}

interface ApiResponse {
  status: string;
  message: string;
  data: ApiData;
  error: string | null;
}
const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

const ConfigForm = () => {
  // --- STATE MANAGEMENT ---
  const [configs, setConfigs] = useState<Config[]>([]);
  const [avatarPaths, setAvatarPaths] = useState<Avatar[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [editingAvatarId, setEditingAvatarId] = useState<number | null>(null);
  const [supportNumbers, setSupportNumbers] = useState<SupportNumber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [newConfigFiles, setNewConfigFiles] = useState<File[]>([]);
  const [inputType, setInputType] = useState('text');

  // New state for pagination and loading
  const [isLoading, setIsLoading] = useState(true);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [currentFetchUrl, setCurrentFetchUrl] = useState('/config/all');

  // --- NEW STATE FOR UPLOAD MODE ---
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');

  // --- DATA FETCHING ---
  // --- CORRECTED DATA FETCHING LOGIC ---
 const fetchConfigs = useCallback(async (url: string) => {
  setIsLoading(true);
  setError(null);
  setEditingConfig(null);
  setCurrentFetchUrl(url);

  try {
    const response = await api.get<ApiResponse>(url);

    if (response.data.status === "success" && response.data.data) {
      const configData = response.data.data.data;
      const pagination = response.data.data.pagination;
      const transformedConfigs: Config[] = [];
      const loadedAvatars: Avatar[] = [];

      setSupportNumbers([]);
      setAvatarPaths([]);

      Object.entries(configData).forEach(([key, value]) => {
        if (key === 'avatar_paths' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.values(value as object).forEach(avatarGroup => {
            Object.values(avatarGroup as object).forEach(avatarData => {
              if (avatarData && typeof avatarData === 'object' && 'url' in avatarData) {
                const data = avatarData as { path: string; url: string; id?: string };
                loadedAvatars.push({
                  id: Date.now() + loadedAvatars.length,
                  originalId: data.id || `avatar_${loadedAvatars.length}`,
                  url: data.url,
                  name: `Avatar ${data.id || loadedAvatars.length + 1}`
                });
              }
            });
          });

          if (loadedAvatars.length > 0) {
            transformedConfigs.push({ name: 'avatar_paths', value: `${loadedAvatars.length} avatars loaded` });
          }
        } else if (key === 'support_number' && Array.isArray(value)) {
          const supportNumbersData = value as Array<SupportNumber>;
          setSupportNumbers(supportNumbersData);
          transformedConfigs.push({ name: key, value: supportNumbersData.map(item => item.value).join(', ') });
        } else if (typeof value === 'object' && value !== null && 'url' in value && (value as { url: string }).url) {
          transformedConfigs.push({ name: key, value: (value as { url: string }).url });
        } else if (typeof value === 'string') {
          transformedConfigs.push({ name: key, value: value });
        } else if (typeof value === 'object' && value !== null) {
  // Check if it's a group of images (like avatar_paths but more generic)
  const groupItems = Object.entries(value)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, item]) => typeof item === 'object' && item !== null && 'url' in item && 'id' in item)
    .map(([index, item]) => ({
      id: (item as GroupItem).id,
      name: `${key}_${index}`,
      url: (item as GroupItem).url,
      created_at: (item as GroupItem).created_at,
    }));

  if (groupItems.length > 0) {
    // Treat this as a grouped item (like 'images', 'banners', etc.)
    transformedConfigs.push({ name: key, value: JSON.stringify(groupItems) });
  } else {
    // fallback to flat subfields (non-image nested object)
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      if (typeof nestedValue === 'string') {
        transformedConfigs.push({ name: `${key}_${nestedKey}`, value: nestedValue });
      }
    });
  }
}
      });

      setAvatarPaths(loadedAvatars);
      setConfigs(transformedConfigs);
      setNextPageUrl(pagination.next_page_url);
      setPrevPageUrl(pagination.prev_page_url);
    } else {
      setError(response.data.message || "No configurations found.");
      setConfigs([]);
    }
  } catch (error: unknown) {
    console.error('Error fetching configs:', error);
    setError("Failed to fetch configurations.");
    setConfigs([]);
  } finally {
    setIsLoading(false);
  }
}, []);


  useEffect(() => {
    fetchConfigs('/config/all');
  }, [fetchConfigs]);

  // --- HANDLER FUNCTIONS ---
  const handleEdit = (config: Config) => setEditingConfig(config);
  const handleCancelEdit = () => setEditingConfig(null);
  const handleAvatarEdit = (avatarId: number) => setEditingAvatarId(avatarId);
  const handleFileSelect = (file: File | null) => setNewConfigFiles(file ? [file] : []);
  const handleFilesSelect = (files: File[]) => setNewConfigFiles(files);

  const handleSave = async (id?: number) => {
    if (!editingConfig) return;
    try {
      const payload = {
        config_name: editingConfig.name,
        config_value: id ? supportNumbers.find(n => n.id === id)?.value : editingConfig.value,
      };
      const response = await api.put(`/config/update/${editingConfig.name}`, payload);
      if (response.data.status === 'success') {
        showSuccessToast(response.data.message || 'Configuration updated successfully');
        fetchConfigs(currentFetchUrl);
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to save configuration';
      showErrorToast(message || 'Failed to save configuration');
    }
  };

  const handleSingleFileUpdate = async (file: File | null) => {
    if (!file || !editingConfig) return;
    const formData = new FormData();
    formData.append('config_name', editingConfig.name);
    formData.append('file', file);


    try {
      const response = await api.post('/config/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.status === 'success') {
        showSuccessToast('Image updated successfully!');
        fetchConfigs(currentFetchUrl);
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to upload image.';
      showErrorToast(message || 'Failed to upload image.');
    }
  };

  const handleAvatarUpdate = async (file: File | null, avatar: Avatar) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('avatar_id', avatar.originalId);
    try {
      const response = await api.post(`/config/avatar-update/${avatar.originalId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.status === 'success') {
        showSuccessToast(`Avatar updated successfully!`);
        fetchConfigs(currentFetchUrl);
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'An error occurred.';
      showErrorToast(message || 'An error occurred.');
    }
  };

const handleDelete = async (config: Config) => {
  const readableName = typeof config.id === 'string' && config.id.startsWith('images_')
  ? `Image ${config.id}`
  : config.name?.startsWith('avatar_paths')
  ? `Avatar ${config.name}`
  : config.name || 'config';


  await confirmDelete(readableName, async () => {
    try {
      if (config.id) {
        
        // For grouped config items (like images, banners, etc.)
        const response = await api.delete(`/config/delete-file/${config.id}`, {
          data: { config_name: config.name }
        });
        showSuccessToast(response.data.message || "Item deleted successfully");
      } else if (config.name) {
        // For simple flat configs
        const response = await api.delete(`/config/delete/${config.name}`);
        showSuccessToast(response.data.message || "Configuration deleted successfully");
      } else {
        showErrorToast("Missing config name or ID.");
        return;
      }

      fetchConfigs(currentFetchUrl);
    } catch (error: unknown) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'Failed to delete configuration';
      showErrorToast(message || 'Failed to delete configuration');
    }
  });
};




  const handleDeleteNumber = async (id: number) => {
    try {
      await api.delete(`/config/${id}`);
      showSuccessToast("Support number deleted successfully.");
      fetchConfigs(currentFetchUrl);
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to delete support number';
      showErrorToast(message || 'Failed to delete support number');
    }
  };

  const handleDeleteAvatar = async (avatar: Avatar) => {
    await confirmDelete(avatar.name, async () => {
      try {
        const response = await api.delete(`/config/avatar-delete/${avatar.originalId}`);
        showSuccessToast(response.data.message || "Avatar deleted successfully");
        fetchConfigs(currentFetchUrl);
      } catch (error: unknown) {
        const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to delete avatar';
        showErrorToast(message || 'Failed to delete avatar');
      }
    });
  };

  // --- UPDATED ADD NEW CONFIG HANDLER ---
  const handleAddNewConfig = async () => {
    if (!newConfigName.trim()) {
      showErrorToast("Config Name is required.");
      return;
    }

    try {
      let response;

      // Case 1: File upload (handles both single and multiple)
      if (inputType === 'file') {
        if (newConfigFiles.length === 0) {
          showErrorToast("Please select at least one file.");
          return;
        }

        const formData = new FormData();
        formData.append('config_name', newConfigName);
        // Append the 'is_multiple' flag based on the radio button state
        formData.append('is_multiple', uploadMode === 'multiple' ? '1' : '0');

        // Append all selected files under the 'files[]' key
        newConfigFiles.forEach((file) => {
          formData.append('files[]', file);
        });

        response = await api.post('/config/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Case 2: Plain text config upload
      } else if (inputType === 'text') {
        if (!newConfigValue.trim()) {
          showErrorToast("Please provide a Config Value.");
          return;
        }
        response = await api.post('/config/upload-configValue', {
          config_name: newConfigName,
          config_value: newConfigValue,
        });

      } else {
        showErrorToast("Invalid input type selected.");
        return;
      }

      // Handle successful response
      if (response.data.status === 'success') {
        setShowAddForm(false);
        setNewConfigName('');
        setNewConfigValue('');
        setNewConfigFiles([]);
        setUploadMode('single'); // Reset upload mode
        showSuccessToast(response.data.message || 'Configuration added successfully!');
        fetchConfigs('/config/all'); // Refetch all data from the first page
      }
    } catch (error: unknown) {
      const message = isAxiosError(error) ? error.response?.data?.message : 'Failed to add new configuration';
      showErrorToast(message || 'Failed to add new configuration');
    }
  };


  const handleTextInputChange = (id: number) => (e: ChangeEvent<HTMLInputElement>) => {
    setSupportNumbers(numbers => numbers.map(n => n.id === id ? { ...n, value: e.target.value } : n));
  };

  const handlePageNavigation = (url: string | null) => {
    if (url) {
      try {
        const urlObject = new URL(url);
        const searchParams = urlObject.search;
        fetchConfigs(`/config/all${searchParams}`);
      } catch {
        console.error("Invalid pagination URL:", url);
        showErrorToast("Invalid navigation link provided by the API.");
      }
    }
  };

  const isImageConfig = (configName: string | undefined, value: string) => {
    if (!configName || !value) return false;
    return value.match(/\.(jpeg|jpg|gif|png|svg)$/i) !== null;
  };

  const regularConfigs = configs.filter(c => c.name !== 'avatar_paths' && c.name !== 'support_number');
  const avatarPathsConfig = configs.find(c => c.name === 'avatar_paths');
  const supportNumberConfig = configs.find(c => c.name === 'support_number');

  if (error && !isLoading) {
    return <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <>
      <PageMeta title="Configurations" description="Manage application configurations" />
      <PageBreadcrumb pageTitle="App Configurations" />
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} />
          <span>Add New</span>
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-6 border border-gray-200 rounded-lg bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03] transition-all duration-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Config Name</label>
              <input type="text" value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="e.g., app_logo, social_links" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input Type</label>
              <div className="flex rounded-md shadow-sm">
                <button onClick={() => setInputType('text')} className={`px-4 py-2 text-sm font-medium rounded-l-md ${inputType === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>Text Input</button>
                <button onClick={() => setInputType('file')} className={`px-4 py-2 text-sm font-medium rounded-r-md ${inputType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>File Upload</button>
              </div>
            </div>
            {inputType === 'text' ? (
              <div className="transition-all duration-200 ease-in-out">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Config Value</label>
                <input type="text" value={newConfigValue} onChange={(e) => setNewConfigValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
              </div>
            ) : (
              <div className="transition-all duration-200 ease-in-out space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Type</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="single"
                        checked={uploadMode === 'single'}
                        onChange={() => { setUploadMode('single'); setNewConfigFiles([]); }}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Single File (Replaces existing)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="multiple"
                        checked={uploadMode === 'multiple'}
                        onChange={() => { setUploadMode('multiple'); setNewConfigFiles([]); }}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Multiple Files (Adds to existing)</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <ImageUploadCard
                    title={uploadMode === 'multiple' ? "Upload Multiple Files" : "Upload Single File"}
                    rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 20 }}
                    type={uploadMode === 'multiple' ? 'collection' : 'single'}
                    onFileSelect={handleFileSelect}
                    onFilesSelect={handleFilesSelect}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={handleAddNewConfig} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* --- TABLE AND DISPLAY LOGIC (UNCHANGED) --- */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="w-1/4 px-6 py-4 font-medium text-start dark:text-white">Config Name</TableCell>
                <TableCell className="w-2/4 px-6 py-4 font-medium text-start dark:text-white">Config Value</TableCell>
                <TableCell className="w-1/4 px-6 py-4 font-medium text-start dark:text-white">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" /></TableCell></TableRow>
              ) : (
                <>
                 {regularConfigs.map((config, index) => {
  // Check if the configuration is a grouped item
  if (config.name === 'images' || config.name === 'support_banners') {
    const groupItems: GroupItem[] = JSON.parse(config.value);
    return (
      <TableRow key={`${config.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
        <TableCell className="px-6 py-4 text-start">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {config.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </TableCell>
        <TableCell className="px-6 py-4 text-start">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {groupItems.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-center mt-1 text-gray-500 truncate">
                  {item.name.split('.')[0]}
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleEdit({ ...config, id: item.id })}
                    className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete({ ...config, id: item.id })}
                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TableCell>
        <TableCell className="px-6 py-4 text-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setInputType('file');
                setUploadMode('multiple');
                setNewConfigName(config.name);
              }}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
              title="Add new images"
            >
              <Upload size={18} />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  } else {
    // Handle regular configurations
    return (
      <TableRow key={`${config.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
        <TableCell className="px-6 py-4 text-start">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {config.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </TableCell>
        <TableCell className="px-6 py-4 text-start">
          {editingConfig?.name === config.name ? (
            isImageConfig(config.name, config.value) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={config.value} alt="Preview" className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-600" />
                  <ImageUploadCard
                    title={`Update ${editingConfig.name}`}
                    rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 1 }}
                    type="single"
                    onFileSelect={handleSingleFileUpdate}
                  />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={editingConfig.value}
                onChange={(e) => setEditingConfig({ ...editingConfig, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            )
          ) : (
            <div className="text-gray-600 dark:text-gray-300">
              {isImageConfig(config.name, config.value) ? (
                <img src={config.value} alt="Preview" className="max-w-[200px] max-h-[200px] object-contain rounded-lg border border-gray-200 dark:border-gray-600" />
              ) : (
                <span className="break-words">{config.value}</span>
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="px-6 py-4 text-start">
          <div className="flex items-center gap-3">
            {editingConfig?.name === config.name ? (
              <>
                {!isImageConfig(config.name, config.value) && (
                  <button
                    onClick={() => handleSave()}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                    title="Save"
                  >
                    <Save size={18} />
                  </button>
                )}
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleEdit(config)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
            )}
            <button
              onClick={() => handleDelete(config)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
})}

                  {avatarPathsConfig && (
                    <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-6 py-4 text-start">
                        <div className="font-medium text-gray-800 dark:text-gray-200">Avatar Paths</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-start">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {avatarPaths.map((avatar) => (
                              <div key={avatar.id} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                                  <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-500 truncate">{avatar.name.split('.')[0]}</div>
                                {editingAvatarId === avatar.id ? (
                                  <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 rounded-lg flex flex-col items-center justify-center p-2 space-y-2">
                                    <ImageUploadCard
                                      title="Upload New Avatar"
                                      rules={{ mimes: ['image/svg+xml', 'image/png', 'image/jpg', 'image/jpeg'], max: 1 }}
                                      type="single"
                                      onFileSelect={(file) => handleAvatarUpdate(file, avatar)}
                                    />
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingAvatarId(null)}
                                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={() => handleAvatarEdit(avatar.id)}
                                      className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAvatar(avatar)}
                                      className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {avatarPaths.length === 0 && (
                            <div className="text-gray-400 italic py-4">No avatars uploaded yet</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-start align-top">
                        <div className="flex flex-col items-start gap-3">
                          <button
                            onClick={() => {
                              setShowAddForm(true);
                              setInputType('file');
                              setUploadMode('multiple');
                              setNewConfigName('avatar_paths');
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                            title="Add new avatars"
                          >
                            <Upload size={18} />
                          </button>
                          <span className="text-xs text-gray-500">Upload more avatars</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {supportNumberConfig && (
                    <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-6 py-4 text-start">
                        <div className="font-medium text-gray-800 dark:text-gray-200">Support Numbers</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-start">
                        {editingConfig?.name === supportNumberConfig.name ? (
                          <div className="space-y-3">
                            {supportNumbers.map((number) => (
                              <div key={number.id} className="flex items-center gap-3">
                                <input type="text" value={number.value} onChange={handleTextInputChange(number.id)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                                <button onClick={() => handleSave(number.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors" title="Save">
                                  <Save size={18} />
                                </button>
                                <button onClick={() => handleDeleteNumber(number.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Delete">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-600 dark:text-gray-300">{supportNumberConfig.value}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-start">
                        <div className="flex items-center gap-3">
                          {editingConfig?.name === supportNumberConfig.name ? (
                            <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Cancel">
                              <X size={18} />
                            </button>
                          ) : (
                            <button onClick={() => handleEdit(supportNumberConfig)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title="Edit">
                              <Edit2 size={18} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:bg-white/[0.03] dark:border-white/[0.05]">
          <button
            onClick={() => handlePageNavigation(prevPageUrl)}
            disabled={!prevPageUrl || isLoading}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <button
            onClick={() => handlePageNavigation(nextPageUrl)}
            disabled={!nextPageUrl || isLoading}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfigForm;