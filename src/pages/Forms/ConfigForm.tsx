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
}

interface AvatarPath {
  url: string;
  path?: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: Array<{
    [key: string]: {
      path?: string;
      url?: string;
    } | string | string[];
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
            if (key === 'support_number') {
              transformedConfigs.push({
                name: key,
                value: (value as string[]).join(', '),
              });
            } else if (key === 'avatar_paths') {
              Object.entries(value as { [key: string]: AvatarPath }).forEach(([id, avatar]) => {
                transformedConfigs.push({
                  name: key,
                  value: avatar.url,
                  avatarId: parseInt(id),
                });
              });
            } else if (typeof value === 'object' && value !== null && 'url' in value && value.url) {
              transformedConfigs.push({ name: key, value: value.url });
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
      const response = await api.put(`/update/${editingConfig.name}/${editingConfig.avatarId || ''}`, {
        config_value: editValue,
      });

      if (response.data.status === 'success') {
        setConfigs(
          configs.map((config) =>
            config.name === editingConfig.name && (editingConfig.avatarId ? config.avatarId === editingConfig.avatarId : true)
              ? { ...config, value: editValue }
              : config
          )
        );
        setEditingConfig(null);
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
      if (config.id) {
        await api.delete(`/config/${config.id}`);
      } else {
        console.warn('No ID available for deletion');
        return;
      }
      setConfigs(configs.filter((c) => !(c.name === config.name && c.id === config.id)));
    } catch (error) {
      console.error('Error deleting config:', error);
      setError('Failed to delete configuration');
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file || !editingConfig) return;

    const formData = new FormData();
    formData.append('config_name', editingConfig.name);
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        const newUrl = response.data.data.config_value.url;
        setConfigs(
          configs.map((config) =>
            config.name === editingConfig.name && (editingConfig.avatarId ? config.avatarId === editingConfig.avatarId : true)
              ? { ...config, value: newUrl }
              : config
          )
        );
        setEditingConfig(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    }
  };

  const isImageConfig = (configName: string, value: string) => {
    const imageConfigs = ['app_logo', 'app_logo_white', 'icon_logo', 'avatar_paths'];
    return imageConfigs.includes(configName) || value.match(/\.(jpeg|jpg|gif|png|svg)$/i);
  };

  const handleAddNewConfig = async () => {
    try {
      let valueToSave = newConfigValue;
      if (newConfigFile) {
        const formData = new FormData();
        formData.append('config_name', newConfigName);
        formData.append('file', newConfigFile);

        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.status === 'success') {
          valueToSave = response.data.data.config_value.url;
        }
      }

      const response = await api.post('/upload-configValue', {
        config_name: newConfigName,
        config_value: valueToSave,
      });

      if (response.data.status === 'success') {
        setConfigs([...configs, { name: newConfigName, value: valueToSave }]);
        setShowAddForm(false);
        setNewConfigName('');
        setNewConfigValue('');
        setNewConfigFile(null);
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
            <label className="block text-gray-700">Config Name</label>
            <input
              type="text"
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-700">Config Value</label>
            <input
              type="text"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-700">Or Upload Image</label>
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
          <div className="flex justify-end gap-2">
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
              {configs
                .filter(config => config.name !== 'avatar_paths')
                .map((config, index) => (
                  <TableRow key={`${config.name}-${index}`} className="hover:bg-gray-50">
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
                              style={{ maxWidth: '200px', maxHeight: '200px' }}
                            />
                            <div className="mt-2">
                              <ImageUploadCard
                                title={editingConfig.name}
                                rules={{
                                  mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
                                  max: 200,
                                }}
                                type="single"
                                onFileSelect={handleFileSelect}
                              />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleTextInputChange}
                            className="border rounded p-1 w-full"
                          />
                        )
                      ) : (
                        <div>
                          {isImageConfig(config.name, config.value) ? (
                            <img
                              src={config.value}
                              alt="Preview"
                              style={{ maxWidth: '200px', maxHeight: '200px' }}
                            />
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingConfig(null);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(config);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this configuration?')) {
                              handleDelete(config);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {configs
                .filter(config => config.name === 'avatar_paths')
                .map((config) => (
                  <TableRow key={`${config.name}-${config.avatarId}`} className="hover:bg-gray-50">
                    <TableCell className="px-5 py-4 text-start">
                      <div className="cursor-pointer">{`Avatar ${config.avatarId}`}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                      {editingConfig?.avatarId === config.avatarId ? (
                        <div>
                          <img
                            src={config.value}
                            alt={`Avatar ${config.avatarId}`}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                          />
                          <div className="mt-2">
                            <ImageUploadCard
                              title={`Avatar ${config.avatarId}`}
                              rules={{
                                mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
                                max: 200,
                              }}
                              type="single"
                              onFileSelect={handleFileSelect}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <img
                            src={config.value}
                            alt={`Avatar ${config.avatarId}`}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500">
                      <div className="flex gap-2">
                        {editingConfig?.avatarId === config.avatarId ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingConfig(null);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(config);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this configuration?')) {
                              handleDelete(config);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ConfigForm;
