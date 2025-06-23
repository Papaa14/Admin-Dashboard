import { useState, useEffect, ChangeEvent } from 'react';
import ImageUploadCard from "../../components/form/form-elements/ImageUploadCard";
import api from "../../Api/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Edit2, Trash2, Save, X, Upload, Plus } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';

interface Config {
  id?: number;
  name: string;
  value: string;
  avatarId?: number;
}

interface Avatar {
  id: number;
  originalId: string;
  url: string;
  name: string;
}

interface SupportNumber {
  id: number;
  value: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: Array<{
    [key: string]: {
      path?: string;
      url?: string;
      id?: string;
    } | string | Array<SupportNumber> | object;
  }>;
  error: string | null;
}

const ConfigForm = () => {
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
  const [inputType, setInputType] = useState('text'); // 'text' or 'file'

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await api.get<ApiResponse>('/all');
        if (response.data.status === "success" && response.data.data.length > 0) {
          const configData = response.data.data[0];
          const transformedConfigs: Config[] = [];
          const loadedAvatars: Avatar[] = [];

          Object.entries(configData).forEach(([key, value]) => {
            if (key === 'avatar_paths' && typeof value === 'object' && value !== null) {
              const avatarMap = value as Record<string, Record<string, { path: string; url: string; id?: string }>>;
              Object.entries(avatarMap).forEach(([groupId, groupAvatars]) => {
                Object.entries(groupAvatars).forEach(([avatarIndex, avatarData]) => {
                  if (avatarData && typeof avatarData === 'object' && 'url' in avatarData) {
                    const uniqueId = `avatar_path_${groupId}_${avatarIndex}`;
                    loadedAvatars.push({
                      id: Date.now() + loadedAvatars.length,
                      originalId: avatarData.id || uniqueId,
                      url: avatarData.url,
                      name: `Avatar ${avatarData.id || uniqueId}`,
                    });
                  }
                });
              });
              transformedConfigs.push({
                name: 'avatar_paths',
                value: `${loadedAvatars.length} avatars loaded`,
              });
            } else if (key === 'support_number' && Array.isArray(value)) {
              const supportNumbers = value as Array<SupportNumber>;
              setSupportNumbers(supportNumbers);
              const supportNumbersString = supportNumbers.map(item => item.value).join(', ');
              transformedConfigs.push({
                name: key,
                value: supportNumbersString,
              });
            } else if (typeof value === 'object' && value !== null && 'url' in value && (value as { url: string }).url) {
              transformedConfigs.push({ name: key, value: (value as { url: string }).url });
            } else if (typeof value === 'string') {
              transformedConfigs.push({ name: key, value });
            }
          });

          setAvatarPaths(loadedAvatars);
          setConfigs(transformedConfigs);
        } else {
          setError(response.data.message || "No configs found.");
        }
      } catch (error: unknown) {
        console.error('Error fetching configs:', error);
        setError("Failed to fetch configurations.");
      }
    };

    fetchConfigs();
  }, []);

  const handleEdit = (config: Config) => {
    setEditingConfig(config);
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setEditingAvatarId(null);
  };

  const handleAvatarEdit = (avatarId: number) => {
    setEditingAvatarId(avatarId);
  };

  const handleAvatarUpdate = async (file: File | null, avatar: Avatar) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('avatar_id', avatar.originalId);

    try {
      const response = await api.post(`/avatar-update/${avatar.originalId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        const newUrl = response.data.data.url;
        setAvatarPaths(currentAvatars =>
          currentAvatars.map(a =>
            a.originalId === avatar.originalId ? { ...a, url: newUrl } : a
          )
        );
        setEditingAvatarId(null);
        showSuccessToast(`Avatar updated successfully!`);
      } else {
        showErrorToast(response.data.message || 'Failed to update avatar.');
      }
    } catch (err: unknown) {
      console.error('Error updating avatar:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'An error occurred.';
      showErrorToast(errorMessage);
    }
  };

  const handleSave = async (id?: number) => {
    if (!editingConfig) return;

    try {
      if (editingConfig.name === 'support_number' && id !== undefined) {
        const numberToSave = supportNumbers.find(number => number.id === id);
        if (numberToSave) {
          const response = await api.put(`/update/${editingConfig.name}`, {
            config_name: editingConfig.name,
            config_value: numberToSave.value,
          });

          if (response.data.status === 'success') {
            const updatedSupportNumbersString = supportNumbers.map(number =>
              number.id === id ? numberToSave : number
            ).map(number => number.value).join(', ');

            setConfigs(configs.map(config =>
              config.name === 'support_number' ? { ...config, value: updatedSupportNumbersString } : config
            ));
            showSuccessToast(response.data.message || 'Configuration updated successfully');
          }
        }
      } else {
        const response = await api.put(`/update/${editingConfig.name}`, {
          config_name: editingConfig.name,
          config_value: editingConfig.value,
        });

        if (response.data.status === 'success') {
          setConfigs(configs.map((config) =>
            config.name === editingConfig.name ? { ...config, value: editingConfig.value } : config
          ));
          setEditingConfig(null);
        }
        showSuccessToast(response.data.message || 'Configuration updated successfully');
      }
    } catch (error: unknown) {
      console.error('Error saving config:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save configuration';
      showErrorToast(errorMessage);
    }
  };

  const handleSingleFileUpdate = async (file: File | null) => {
    if (!file || !editingConfig) return;

    const formData = new FormData();
    formData.append('config_name', editingConfig.name);
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        const newUrl = response.data.data.config_value.url;
        setConfigs(configs.map(c => c.name === editingConfig.name ? { ...c, value: newUrl } : c));
        setEditingConfig(null);
        showSuccessToast('Image updated successfully!');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to upload image.';
      showErrorToast(errorMessage);
    }
  };

  const handleTextInputChange = (id: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const updatedNumbers = supportNumbers.map(number =>
      number.id === id ? { ...number, value: e.target.value } : number
    );
    setSupportNumbers(updatedNumbers);
  };

  const handleDeleteNumber = async (id: number) => {
    try {
      await api.delete(`/${id}`);
      const updatedNumbers = supportNumbers.filter(number => number.id !== id);
      setSupportNumbers(updatedNumbers);
      const updatedSupportNumbersString = updatedNumbers.map(number => number.value).join(', ');
      setConfigs(configs.map(config =>
        config.name === 'support_number' ? { ...config, value: updatedSupportNumbersString } : config
      ));
    } catch (error: unknown) {
      console.error('Error deleting support number:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete support number';
      showErrorToast(errorMessage);
    }
  };

  const handleDeleteAvatar = async (avatar: Avatar) => {
    const isConfirmed = await confirmDelete(avatar.name, async () => {
      try {
        const response = await api.delete(`/avatar-delete/${avatar.originalId}`);
        setAvatarPaths(avatarPaths.filter(a => a.originalId !== avatar.originalId));
        const remainingCount = avatarPaths.length - 1;
        setConfigs(configs.map(config =>
          config.name === 'avatar_paths' ? { ...config, value: `${remainingCount} avatars loaded` } : config
        ));
        showSuccessToast(response.data.message || "Avatar deleted successfully");
      } catch (error: unknown) {
        const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete avatar';
        showErrorToast(errorMessage);
      }
    });

    if (!isConfirmed) return;
  };

  const handleDelete = async (config: Config) => {
    const isConfirmed = await confirmDelete(config.name, async () => {
      try {
        let endpoint: string;
        if (config.avatarId !== undefined) {
          endpoint = `/${config.avatarId}`;
        } else if (config.name) {
          endpoint = `/delete/${config.name}`;
        } else {
          console.warn('No valid identifier for deletion');
          return;
        }

        const response = await api.delete(endpoint);
        setConfigs(configs.filter((c) => c !== config));
        showSuccessToast(response.data.message || "Configuration deleted successfully");
      } catch (error: unknown) {
        const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete configuration';
        showErrorToast(errorMessage);
      }
    });

    if (!isConfirmed) return;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setNewConfigFiles([file]);
  };

  const handleFilesSelect = (files: File[]) => {
    setNewConfigFiles(files);
  };

  const handleAddNewConfig = async () => {
    try {
      if (newConfigFiles.length > 0) {
        if (newConfigName === 'avatar_paths') {
          const uploadPromises = newConfigFiles.map((file) => {
            const formData = new FormData();
            formData.append('config_name', 'avatar_paths');
            formData.append('file', file);
            return api.post('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          });

          const responses = await Promise.all(uploadPromises);
          if (responses.every(response => response.data.status === 'success')) {
            const newAvatars = responses.map((response, index) => ({
              id: Date.now() + index,
              originalId: response.data.data.config_value.id || `avatar_path_${Date.now()}_${index}`,
              url: response.data.data.config_value.url,
              name: `Avatar ${response.data.data.config_value.id || index}`,
            }));

            setAvatarPaths([...avatarPaths, ...newAvatars]);
            const totalCount = avatarPaths.length + newAvatars.length;
            setConfigs(configs.map(config =>
              config.name === 'avatar_paths' ? { ...config, value: `${totalCount} avatars loaded` } : config
            ));
            setShowAddForm(false);
            setNewConfigName('');
            setNewConfigFiles([]);
            showSuccessToast('Avatars uploaded successfully!');
          }
        } else {
          const formData = new FormData();
          formData.append('config_name', newConfigName);
          formData.append('file', newConfigFiles[0]);

          const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data.status === 'success') {
            const newUrl = response.data.data.config_value.url;
            setConfigs([...configs, { name: newConfigName, value: newUrl }]);
            setShowAddForm(false);
            setNewConfigName('');
            setNewConfigFiles([]);
            showSuccessToast('Configuration added successfully!');
          }
        }
      } else {
        const response = await api.post('/upload-configValue', {
          config_name: newConfigName,
          config_value: newConfigValue,
        });

        if (response.data.status === 'success') {
          setConfigs([...configs, { name: newConfigName, value: newConfigValue }]);
          setShowAddForm(false);
          setNewConfigName('');
          setNewConfigValue('');
          showSuccessToast('Configuration added successfully!');
        }
      }
    } catch (error: unknown) {
      console.error('Error adding new config:', error);
      setError('Failed to add new configuration');
    }
  };

  const isImageConfig = (configName: string | undefined, value: string) => {
    if (!configName) return false;
    const imageConfigs = ['app_logo', 'app_logo_white', 'icon_logo'];
    return imageConfigs.includes(configName) || configName.startsWith('Avatar') || (value && value.match(/\.(jpeg|jpg|gif|png|svg)$/i));
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const regularConfigs = configs.filter(c => c.name !== 'avatar_paths' && c.name !== 'support_number');
  const avatarPathsConfig = configs.find(c => c.name === 'avatar_paths');
  const supportNumberConfig = configs.find(c => c.name === 'support_number');

  return (

    <>
      <PageMeta title="Configurations" description="This is configurations page" />
      <PageBreadcrumb pageTitle="App Configurations" />
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add New</span>
        </button>
      </div>
      {showAddForm && (
        <div className="mb-4 p-6 border border-gray-200 rounded-lg bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03] transition-all duration-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Configuration</h2>

          <div className="space-y-4">
            {/* Config Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Config Name</label>
              <input
                type="text"
                value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="e.g., app_logo, avatar_paths"
              />
            </div>

            {/* Input Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input Type</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setInputType('text')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${inputType === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                  Text Input
                </button>
                <button
                  onClick={() => setInputType('file')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${inputType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                  File Upload
                </button>
              </div>
            </div>

            {/* Dynamic Input Area */}
            {inputType === 'text' ? (
              <div className="transition-all duration-200 ease-in-out">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Config Value</label>
                <input
                  type="text"
                  value={newConfigValue}
                  onChange={(e) => setNewConfigValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            ) : (
              <div className="transition-all duration-200 ease-in-out">
                <div className="p-4 border border-gray-200 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <ImageUploadCard
                    title={newConfigName === 'avatar_paths' ? "Upload Multiple Avatars" : "Upload Image"}
                    rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 200 }}
                    type={newConfigName === 'avatar_paths' ? "collection" : "single"}
                    onFileSelect={handleFileSelect}
                    onFilesSelect={handleFilesSelect}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewConfig}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="w-1/4 px-6 py-4 font-medium text-start">Config Name</TableCell>
                <TableCell className="w-2/4 px-6 py-4 font-medium text-start">Config Value</TableCell>
                <TableCell className="w-1/4 px-6 py-4 font-medium text-start">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {regularConfigs.map((config, index) => (
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
                            <img
                              src={config.value}
                              alt="Preview"
                              className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                            <ImageUploadCard
                              title={`Update ${editingConfig.name}`}
                              rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 200 }}
                              type="single"
                              onFileSelect={handleSingleFileUpdate}
                            />
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={editingConfig.value}
                          onChange={(e) => {
                            setEditingConfig({ ...editingConfig, value: e.target.value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                      )
                    ) : (
                      <div className="text-gray-600 dark:text-gray-300">
                        {isImageConfig(config.name, config.value) ? (
                          <img
                            src={config.value}
                            alt="Preview"
                            className="max-w-[200px] max-h-[200px] object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                          />
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
              ))}

              {avatarPathsConfig && (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-6 py-4 text-start">
                    <div className="font-medium text-gray-800 dark:text-gray-200">Avatar Paths</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-start">
                    {showAddForm && newConfigName === 'avatar_paths' ? (
                      <div className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X size={16} />
                        </button>
                        <ImageUploadCard
                          title="Upload New Avatars"
                          rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 200 }}
                          type="collection"
                          onFileSelect={handleFileSelect}
                          onFilesSelect={handleFilesSelect}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {avatarPaths.map((avatar) => (
                            <div key={avatar.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                                <img
                                  src={avatar.url}
                                  alt={avatar.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-xs text-center mt-1 text-gray-500 truncate">
                                {avatar.name.split('.')[0]}
                              </div>
                              {editingAvatarId === avatar.id ? (
                                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 rounded-lg flex flex-col items-center justify-center p-2 space-y-2">
                                  <ImageUploadCard
                                    title=""
                                    rules={{ mimes: ['image/svg+xml', 'image/png', 'image/jpg', 'image/jpeg'], max: 200 }}
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
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-start">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setNewConfigName('avatar_paths');
                          setShowAddForm(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                        title="Add avatars"
                      >
                        <Upload size={18} />
                      </button>
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
                            <input
                              type="text"
                              value={number.value}
                              onChange={handleTextInputChange(number.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <button
                              onClick={() => handleSave(number.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                              title="Save"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteNumber(number.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-300">
                        {supportNumberConfig.value}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-start">
                    <div className="flex items-center gap-3">
                      {editingConfig?.name === supportNumberConfig.name ? (
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(supportNumberConfig)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ConfigForm;