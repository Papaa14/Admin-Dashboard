import { useState, useEffect } from 'react';
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
import { Edit2, Trash2, Save, X } from 'lucide-react';

interface Config {
  id?: number;
  name: string;
  value: string;
  avatarId?: number;
    uniqueAvatarId?: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: Array<{
    [key: string]: {
      path?: string;
      url?: string;
    } | string | Array<{ id: number; value: string }> | object; // Loosen type for avatar_paths
  }>;
  error: string | null;
}

const ConfigForm = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [newConfigFile, setNewConfigFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await api.get<ApiResponse>('/all');
        if (response.data.status === "success" && response.data.data.length > 0) {
          const configData = response.data.data[0];
          const transformedConfigs: Config[] = [];

          Object.entries(configData).forEach(([key, value]) => {
            if (key === 'support_number' && Array.isArray(value)) {
              const supportNumbers = (value as Array<{ id: number; value: string }>).map(item => item.value).join(', ');
              transformedConfigs.push({
                name: key,
                value: supportNumbers,
              });
            } else if (key === 'avatar_paths' && typeof value === 'object' && value !== null) {
              // CORRECTED LOGIC HERE
              // `value` is {"13": { "0": {...}, "1": {...} }}
              // We get the inner object which contains the actual avatars.
              const avatarsObject = Object.values(value as object)[0];
              if (avatarsObject) {
                Object.entries(avatarsObject).forEach(([avatarId, avatarData]) => {
                  // Now, avatarId is "0", "1", etc. and avatarData is { path: "...", url: "..." }
                  if (avatarData && typeof avatarData === 'object' && 'url' in avatarData && 'id' in avatarData) {
                    transformedConfigs.push({
                      name: `Avatar ${avatarId}`,
                      value: (avatarData as { url: string }).url, // Correctly access the url
                      avatarId: parseInt(avatarId, 10),
                        uniqueAvatarId: (avatarData as { id: string }).id,
                    });
                  }
                });
              }
            } else if (typeof value === 'object' && value !== null && 'url' in value && (value as {url: string}).url) {
              transformedConfigs.push({ name: key, value: (value as {url: string}).url });
            } else if (typeof value === 'string') {
              transformedConfigs.push({ name: key, value });
            }
          });

          setConfigs(transformedConfigs);
        } else {
          setError(response.data.message || "No configs found.");
        }
      } catch (error) {
        console.error('Error fetching configs:', error);
        setError("Failed to fetch configurations.");
      }
    };

    fetchConfigs();
  }, []);

  const handleEdit = (config: Config) => {
    setEditingConfig(config);
    setEditValue(config.value);
  };

  const handleSave = async () => {
  if (!editingConfig) return;

  try {
    if (editingConfig.uniqueAvatarId !== undefined) {
      // Handle avatar update
      const formData = new FormData();
      if (newConfigFile) {
        formData.append('file', newConfigFile);
      }

      const response = await api.post(`/avatar-update/${editingConfig.uniqueAvatarId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        setConfigs(
          configs.map((config) =>
            config.avatarId === editingConfig.avatarId
              ? { ...config, value: response.data.data.url || editValue }
              : config
          )
        );
        setEditingConfig(null);
        setNewConfigFile(null);
      }
    } else {
      // Handle regular config update
      const endpoint = `/update/${editingConfig.name}`;
      const response = await api.put(endpoint, {
        config_value: editValue,
      });

      if (response.data.status === 'success') {
        setConfigs(
          configs.map((config) =>
            config.name === editingConfig.name
              ? { ...config, value: editValue }
              : config
          )
        );
        setEditingConfig(null);
      }
    }
  } catch (error) {
    console.error('Error saving config:', error);
    setError('Failed to save configuration');
  }
};


  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleDelete = async (config: Config) => {
    try {
      // Note: You may need a specific endpoint for deleting avatars
      if (config.id || config.avatarId !== undefined) {
         const endpoint = config.uniqueAvatarId !== undefined
            ? `/avatar-delete/${config.uniqueAvatarId}` // Example endpoint
            : `/config/${config.id}`;
        await api.delete(endpoint);
        setConfigs(configs.filter((c) => c !== config));
      } else {
        console.warn('No ID available for deletion');
        return;
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      setError('Failed to delete configuration');
    }
  };

 const handleFileSelect = (file: File | null) => {
  if (!file) return;
  setNewConfigFile(file);
};


  const isImageConfig = (configName: string | undefined, value: string) => {
    if (!configName) return false;
    const imageConfigs = ['app_logo', 'app_logo_white', 'icon_logo'];
    return imageConfigs.includes(configName) || configName.startsWith('Avatar') || (value && value.match(/\.(jpeg|jpg|gif|png|svg)$/i));
  };

  // In ConfigForm.tsx

const handleAddNewConfig = async () => {
  try {
    // Case 1: A new config item that includes a file (e.g., app_logo, or a new avatar_paths item)
    if (newConfigFile) {
      const formData = new FormData();
      // Your backend expects both 'config_name' and 'file' in the same request
      formData.append('config_name', newConfigName);
      formData.append('file', newConfigFile);

      // Call your single, intelligent upload endpoint
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        // Since the backend handles everything, we just need to refresh the state.
        // The easiest way is to re-fetch all configs to get the latest state.
        // This is more robust than trying to manually update the local state.
        window.location.reload(); // Simple and effective
        return; // Stop execution
      } else {
        setError(response.data.message || 'Failed to upload file.');
        return;
      }
    }

    // Case 2: A new config item that is purely text-based
    if (newConfigName && newConfigValue) {
      // Use the endpoint for simple key-value pairs
      const response = await api.post('/upload-configValue', {
        config_name: newConfigName,
        config_value: newConfigValue,
      });

      if (response.data.status === 'success') {
        // Add the new text-based config to the local state for immediate feedback
        setConfigs([...configs, { name: newConfigName, value: newConfigValue }]);
        // Reset the form
        setShowAddForm(false);
        setNewConfigName('');
        setNewConfigValue('');
        setNewConfigFile(null);
      } else {
        setError(response.data.message || 'Failed to save configuration.');
      }
    } else {
        // Handle case where user clicks save without filling out the form
        setError("Please provide a config name and either a value or a file.");
    }
  } catch (error) {
    console.error('Error adding new config:', error);
    setError('Failed to add new configuration');
  }
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

  // Group configs for rendering
  const regularConfigs = configs.filter(c => !c.name.startsWith('Avatar') && c.name !== 'support_number');
  const avatarConfigs = configs.filter(c => c.name.startsWith('Avatar'));
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
            <label className="block text-gray-700 dark:text-gray-300">Or Upload Image</label>
            <ImageUploadCard
              title="Upload Image"
              rules={{
                mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
                max: 200,
              }}
              type="single"
              onFileSelect={(file) => setNewConfigFile(file)}
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
              {/* Render Regular Configs */}
              {regularConfigs.map((config, index) => (
                  <TableRow key={`${config.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-5 py-4 text-start">
                      <div className="cursor-pointer">{config.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                      {editingConfig?.name === config.name ? (
                        isImageConfig(config.name, config.value) ? (
                          <div>
                            <img
                              src={config.value}
                              alt="Preview"
                              className="max-w-[200px] max-h-[200px] object-contain mb-2"
                            />
                            <ImageUploadCard
                                title={`Update ${editingConfig.name}`}
                                rules={{ mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'], max: 200 }}
                                type="single"
                                onFileSelect={handleFileSelect}
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleTextInputChange}
                            className="border rounded p-1 w-full bg-transparent"
                          />
                        )
                      ) : (
                        <div>
                          {isImageConfig(config.name, config.value) ? (
                            <img src={config.value} alt="Preview" className="max-w-[200px] max-h-[200px] object-contain" />
                          ) : (
                            <span className="break-words">{config.value}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                       {/* Action Buttons */}
                       <div className="flex gap-2">
                        {editingConfig?.name === config.name ? (
                          <>
                            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                            <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleEdit(config)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                        )}
                        <button onClick={() => window.confirm('Are you sure?') && handleDelete(config)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))}

              {/* Render Avatar Configs */}
              {avatarConfigs.map((config) => (
                  <TableRow key={`${config.name}-${config.avatarId}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                     <TableCell className="px-5 py-4 text-start">
                      <div className="cursor-pointer">{config.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                      {editingConfig?.avatarId === config.avatarId ? (
                        <div>
                          <img src={config.value} alt={config.name} className="w-12 h-12 object-cover rounded-full mb-2" />
                          <ImageUploadCard
                              title={`Update ${config.name}`}
                              rules={{ mimes: ['image/svg+xml'], max: 200 }}
                              type="single"
                              onFileSelect={handleFileSelect}
                           />
                        </div>
                      ) : (
                        <img src={config.value} alt={config.name} className="w-12 h-12 object-cover rounded-full" />
                      )}
                    </TableCell>
                     <TableCell className="px-4 py-3 text-start text-gray-500">
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {editingConfig?.avatarId === config.avatarId ? (
                            <>
                              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                              <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                            </>
                          ) : (
                            <button onClick={() => handleEdit(config)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                          )}
                          <button onClick={() => window.confirm('Are you sure?') && handleDelete(config)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                    </TableCell>
                  </TableRow>
              ))}
              
              {/* Render Support Number Config */}
              {supportNumberConfig && (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                     <TableCell className="px-5 py-4 text-start">
                      <div className="cursor-pointer">{supportNumberConfig.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                       {editingConfig?.name === supportNumberConfig.name ? (
                          <input type="text" value={editValue} onChange={handleTextInputChange} className="border rounded p-1 w-full bg-transparent" />
                        ) : (
                          <span className="break-words">{supportNumberConfig.value}</span>
                        )}
                    </TableCell>
                     <TableCell className="px-4 py-3 text-start text-gray-500">
                       {/* Action Buttons */}
                       <div className="flex gap-2">
                          {editingConfig?.name === supportNumberConfig.name ? (
                            <>
                              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                              <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                            </>
                          ) : (
                            <button onClick={() => handleEdit(supportNumberConfig)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                          )}
                          <button onClick={() => window.confirm('Are you sure?') && handleDelete(supportNumberConfig)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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