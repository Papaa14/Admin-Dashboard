import { useState, useEffect, ChangeEvent } from 'react';
import ImageUploadCard from "../../components/form/form-elements/ImageUploadCard";
import api from "../../Api/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';

interface Config {
  id?: number;
  name: string;
  value: string;
  avatarId?: number;
}

interface Avatar {
  id: number; // Frontend ID for React keys
  originalId: string; // Unique server ID with avatar_path prefix
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
              const avatarMap = value as Record<string, Record<string, { 
                path: string; 
                url: string;
                id?: string;
              }>>;
              
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
            } else if (typeof value === 'object' && value !== null && 'url' in value && (value as {url: string}).url) {
              transformedConfigs.push({ name: key, value: (value as {url: string}).url });
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
      const response = await api.post('/avatar-update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        const newUrl = response.data.data.config_value.url;
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
            setConfigs(
              configs.map(config =>
                config.name === 'support_number' ? { ...config, value: updatedSupportNumbersString } : config
              )
            );
            showSuccessToast(response.data.message || 'Configuration updated successfully');
          }
        }
      } else {
        const response = await api.put(`/update/${editingConfig.name}`, {
          config_name: editingConfig.name,
          config_value: editingConfig.value,
        });
        if (response.data.status === 'success') {
          setConfigs(
            configs.map((config) =>
              config.name === editingConfig.name
                ? { ...config, value: editingConfig.value }
                : config
            )
          );
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
      setConfigs(
        configs.map(config =>
          config.name === 'support_number' ? { ...config, value: updatedSupportNumbersString } : config
        )
      );
    } catch (error: unknown) {
      console.error('Error deleting support number:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete support number';
      showErrorToast(errorMessage);
    }
  };

  const handleDeleteAvatar = async (avatar: Avatar) => {
    const isConfirmed = await confirmDelete(avatar.name, async () => {
      try {
        const response = await api.delete(`/avatar/${avatar.originalId}`);
        setAvatarPaths(avatarPaths.filter(a => a.originalId !== avatar.originalId));
        const remainingCount = avatarPaths.length - 1;
        setConfigs(configs.map(config => 
          config.name === 'avatar_paths' 
            ? { ...config, value: `${remainingCount} avatars loaded` }
            : config
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
        const errorMessage =
          (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to delete configuration';
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
            formData.append('config_name', `avatar_paths`);
            formData.append('file', file);
            return api.post('/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
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
              config.name === 'avatar_paths' 
                ? { ...config, value: `${totalCount} avatars loaded` }
                : config
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
            headers: {
              'Content-Type': 'multipart/form-data',
            },
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
      <PageBreadcrumb pageTitle="App Configurations Config Files" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Configurations</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New
        </button>
      </div>
      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h2 className="text-xl font-bold mb-2">Add New Configuration</h2>
          <div className="mb-2">
            <label className="block text-gray-700 dark:text-gray-300">Config Name</label>
            <input
              type="text"
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              className="border rounded p-2 w-full bg-transparent"
              placeholder="e.g., app_logo, avatar_paths"
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-700 dark:text-gray-300">Config Value (for text)</label>
            <input
              type="text"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(e.target.value)}
              className="border rounded p-2 w-full bg-transparent"
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-700 dark:text-gray-300">Or Upload Image(s)</label>
            <ImageUploadCard
              title={newConfigName === 'avatar_paths' ? "Upload Multiple Avatars" : "Upload Image"}
              rules={{
                mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
                max: 200,
              }}
              type={newConfigName === 'avatar_paths' ? "collection" : "single"}
              onFileSelect={handleFileSelect}
              onFilesSelect={handleFilesSelect}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNewConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-start">Config Name</TableCell>
                <TableCell className="px-5 py-3 font-medium text-start">Config Value</TableCell>
                <TableCell className="px-5 py-3 font-medium text-start">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {regularConfigs.map((config, index) => (
                <TableRow key={`${config.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4 text-start">
                    <div className="cursor-pointer font-medium">{config.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    {editingConfig?.name === config.name ? (
                      isImageConfig(config.name, config.value) ? (
                        <div>
                          <img
                            src={config.value}
                            alt="Preview"
                            className="max-w-[200px] max-h-[200px] object-contain mb-2 rounded"
                          />
                          <ImageUploadCard
                            title={`Update ${editingConfig.name}`}
                            rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 200 }}
                            type="single"
                            onFileSelect={handleSingleFileUpdate}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={editingConfig.value}
                          onChange={(e) => {
                            setEditingConfig({ ...editingConfig, value: e.target.value });
                          }}
                          className="border rounded p-2 w-full bg-transparent"
                        />
                      )
                    ) : (
                      <div>
                        {isImageConfig(config.name, config.value) ? (
                          <img src={config.value} alt="Preview" className="max-w-[200px] max-h-[200px] object-contain rounded" />
                        ) : (
                          <span className="break-words">{config.value}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    <div className="flex gap-2">
                      {editingConfig?.name === config.name ? (
                        <>
                          {!isImageConfig(config.name, config.value) && (
                            <button onClick={() => handleSave()} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                          )}
                          <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                        </>
                      ) : (
                        <button onClick={() => handleEdit(config)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                      )}
                      <button onClick={() => handleDelete(config)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Avatar Paths Section */}
              {avatarPathsConfig && (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4 text-start">
                    <div className="cursor-pointer font-medium">Avatar Paths</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
                      {avatarPaths.map((avatar) => (
                        <div key={avatar.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                            <img 
                              src={avatar.url} 
                              alt={avatar.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-500">
                            {avatar.name}
                          </div>
                          {editingAvatarId === avatar.id ? (
                            <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center p-2">
                              <ImageUploadCard
                                title=""
                                rules={{ mimes: ['image/svg+xml', 'image/png', 'image/jpg', 'image/jpeg'], max: 200 }}
                                type="single"
                                onFileSelect={(file) => handleAvatarUpdate(file, avatar)}
                              />
                              <button 
                                onClick={() => setEditingAvatarId(null)}
                                className="mt-2 p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button 
                                onClick={() => handleAvatarEdit(avatar.id)}
                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAvatar(avatar)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {avatarPaths.length === 0 && (
                      <div className="text-gray-400 italic">No avatars uploaded yet</div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setNewConfigName('avatar_paths');
                          setShowAddForm(true);
                        }}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Add more avatars"
                      >
                        <Upload size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              
              {/* Support Numbers Section */}
              {supportNumberConfig && (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4 text-start">
                    <div className="cursor-pointer font-medium">Support Numbers</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    {editingConfig?.name === supportNumberConfig.name ? (
                      <div className="space-y-2">
                        {supportNumbers.map((number) => (
                          <div key={number.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={number.value}
                              onChange={handleTextInputChange(number.id)}
                              className="border rounded p-2 flex-1 bg-transparent"
                            />
                            <button onClick={() => handleSave(number.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Save size={16} />
                            </button>
                            <button onClick={() => handleDeleteNumber(number.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="break-words">{supportNumberConfig.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    <div className="flex gap-2">
                      {editingConfig?.name === supportNumberConfig.name ? (
                        <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleEdit(supportNumberConfig)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
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