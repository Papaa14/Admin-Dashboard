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
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../components/ui/alert/ToastMessages';

interface Config {
  id?: number;
  name: string;
  value: string;
  avatarId?: number;
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
    } | string | Array<SupportNumber> | object;
  }>;
  error: string | null;
}

const ConfigForm = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [supportNumbers, setSupportNumbers] = useState<SupportNumber[]>([]);
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
              const supportNumbers = value as Array<SupportNumber>;
              setSupportNumbers(supportNumbers);
              const supportNumbersString = supportNumbers.map(item => item.value).join(', ');
              transformedConfigs.push({
                name: key,
                value: supportNumbersString,
              });
            } else if (key === 'avatar_paths' && typeof value === 'object' && value !== null) {
              const avatarsObject = Object.values(value as object)[0];
              if (avatarsObject) {
                Object.entries(avatarsObject).forEach(([avatarId, avatarData]) => {
                  if (avatarData && typeof avatarData === 'object' && 'url' in avatarData) {
                    transformedConfigs.push({
                      name: `Avatar ${avatarId}`,
                      value: (avatarData as { url: string }).url,
                      avatarId: parseInt(avatarId, 10),
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

const handleDelete = async (config: Config) => {
  const isConfirmed = await confirmDelete(config.name, async () => {
    try {
      let endpoint: string;

      if (config.avatarId !== undefined) {
        endpoint = `/config/avatar/${config.avatarId}`;
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


  const handleFileSelect = async (file: File | null) => {
    if (!file || !editingConfig) return;

    const formData = new FormData();
    if (editingConfig.avatarId !== undefined) {
      formData.append('avatar_id', String(editingConfig.avatarId));
    } else {
      formData.append('config_name', editingConfig.name);
    }
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
            config.name === editingConfig.name
              ? { ...config, value: newUrl }
              : config
          )
        );
        setEditingConfig(null);
      }
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    }
  };

  const isImageConfig = (configName: string | undefined, value: string) => {
    if (!configName) return false;
    const imageConfigs = ['app_logo', 'app_logo_white', 'icon_logo'];
    return imageConfigs.includes(configName) || configName.startsWith('Avatar') || (value && value.match(/\.(jpeg|jpg|gif|png|svg)$/i));
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
    } catch (error: unknown) {
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
                          value={config.value}
                          onChange={(e) => {
                            setConfigs(configs.map(c => c.name === config.name ? { ...c, value: e.target.value } : c));
                            setEditingConfig({ ...editingConfig, value: e.target.value });
                          }}
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
                    <div className="flex gap-2">
                      {editingConfig?.name === config.name ? (
                        <>
                          <button onClick={() => handleSave()} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                          <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                        </>
                      ) : (
                        <button onClick={() => handleEdit(config)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                      )}
                      <button onClick={() => handleDelete(config)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

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
                    <div className="flex gap-2">
                      {editingConfig?.avatarId === config.avatarId ? (
                        <>
                          <button onClick={() => handleSave()} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                          <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                        </>
                      ) : (
                        <button onClick={() => handleEdit(config)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                      )}
                      <button onClick={() => handleDelete(config)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {supportNumberConfig && (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4 text-start">
                    <div className="cursor-pointer">{supportNumberConfig.name}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    {editingConfig?.name === supportNumberConfig.name ? (
                      supportNumbers.map((number) => (
                        <div key={number.id} className="mb-2 flex items-center">
                          <input
                            type="text"
                            value={number.value}
                            onChange={handleTextInputChange(number.id)}
                            className="border rounded p-1 w-full bg-transparent"
                          />
                          <button onClick={() => handleSave(number.id)} className="p-1 text-green-600 hover:bg-green-50 rounded ml-2">
                            <Save size={16} />
                          </button>
                          <button onClick={() => handleDeleteNumber(number.id)} className="p-1 text-red-600 hover:bg-red-50 rounded ml-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="break-words">{supportNumberConfig.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-gray-500">
                    <div className="flex gap-2">
                      {editingConfig?.name === supportNumberConfig.name ? (
                        <button onClick={() => setEditingConfig(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
