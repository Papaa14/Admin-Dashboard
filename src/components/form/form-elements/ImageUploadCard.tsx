import { useState, ChangeEvent } from 'react';
import { Upload, X, File, Image, FileText, Plus } from 'lucide-react';
import api from "../../../Api/api";
import Alert from "../../../components/ui/alert/Alert";

interface ImageUploadCardProps {
  title: string;
  rules: {
    mimes: string[];
    max?: number;
    aspectRatio?: { width: number; height: number };
  };
  type?: 'single' | 'collection';
  onFileSelect: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
}

// Define proper error types
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ApiResponse {
  data?: {
    message?: string;
  };
}

const ImageUploadCard = ({ title, rules, type = 'single', onFileSelect, onFilesSelect }: ImageUploadCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const isCollection = type === 'collection';
  const maxFiles = rules.max || 10;

  const simulateUpload = (fileName: string) => {
    setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[fileName] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          return { ...prev, [fileName]: 100 };
        }
        return { ...prev, [fileName]: currentProgress + 5 };
      });
    }, 300);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (isCollection && selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelect?.(updatedFiles);
      await uploadFiles(newFiles);
    } else if (!isCollection && selectedFiles?.[0]) {
      const selectedFile = selectedFiles[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
      await uploadFile(selectedFile);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (isCollection) {
      const updatedFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelect?.(updatedFiles);
      await uploadFiles(droppedFiles);
    } else if (droppedFiles[0]) {
      const droppedFile = droppedFiles[0];
      setFile(droppedFile);
      onFileSelect(droppedFile);
      await uploadFile(droppedFile);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('config_name', title);
    formData.append('file', file);

    try {
      // Use the correct endpoint from your controller
      const response: ApiResponse = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const message = response.data?.message || 'File uploaded successfully!';
      setAlertMessage(message);
      simulateUpload(file.name);
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to upload file.';
      setAlertMessage(errorMessage);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const uploadFiles = async (files: File[]) => {
    // For collection type, we need to upload files one by one since your controller handles single files
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('config_name', title);
      formData.append('file', file);
      return api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });

    try {
      const responses: ApiResponse[] = await Promise.all(uploadPromises);
      const message = responses[0]?.data?.message || `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully!`;
      setAlertMessage(message);
      files.forEach(file => simulateUpload(file.name));
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading files:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to upload files.';
      setAlertMessage(errorMessage);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileName?: string) => {
    if (isCollection && fileName) {
      const updatedFiles = files.filter(f => f.name !== fileName);
      setFiles(updatedFiles);
      onFilesSelect?.(updatedFiles);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
    } else {
      setFile(null);
      setUploadProgress({});
      onFileSelect(null);
    }
  };

  const removeAllFiles = () => {
    if (isCollection) {
      setFiles([]);
      onFilesSelect?.([]);
    } else {
      setFile(null);
      onFileSelect(null);
    }
    setUploadProgress({});
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="w-8 h-8 text-purple-500" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTitle = (title: string) => {
    return title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const hasFiles = isCollection ? files.length > 0 : file !== null;
  const canAddMore = isCollection && files.length < maxFiles;

  return (
    <div className="w-full max-w-md mx-auto bg-white border rounded-lg shadow-sm">
      {alertMessage && (
        <Alert
          variant={alertMessage.includes('Failed') ? 'error' : 'success'}
          title={alertMessage.includes('Failed') ? 'Error' : 'Success'}
          message={alertMessage}
          showLink={false}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{formatTitle(title)}</h2>
          {isCollection && (
            <p className="text-xs text-gray-500 mt-1">
              {files.length} of {maxFiles} files • Max 5MB each
            </p>
          )}
        </div>
        <button
          onClick={removeAllFiles}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        {(!hasFiles || canAddMore) && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
              isDragging
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept={rules.mimes.join(',')}
              multiple={isCollection}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                {hasFiles && canAddMore ? (
                  <Plus className="w-6 h-6 text-purple-600" />
                ) : (
                  <Upload className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  <span className="text-purple-600 hover:text-purple-500 cursor-pointer">
                    {hasFiles && canAddMore ? 'Add More Files' : 'Click to Upload'}
                  </span>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {rules.aspectRatio && `${rules.aspectRatio.width}:${rules.aspectRatio.height} ratio • `}
                  Max 5MB{isCollection ? ' each' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {hasFiles && (
          <div className="space-y-2">
            {isCollection ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((fileItem, index) => (
                  <div key={`${fileItem.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(fileItem.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileItem.size)} • {
                            (uploadProgress[fileItem.name] ?? 0) === 100 ? 'Completed' : `${uploadProgress[fileItem.name] ?? 0}%`
                          }
                        </p>
                        {/* Progress Bar */}
                        {(uploadProgress[fileItem.name] ?? 0) < 100 && (
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div
                              className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[fileItem.name] ?? 0}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(fileItem.name)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-2"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : file && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {
                        (uploadProgress[file.name] ?? 0) === 100 ? 'Completed' : `${uploadProgress[file.name] ?? 0}%`
                      }
                    </p>
                    {/* Progress Bar */}
                    {(uploadProgress[file.name] ?? 0) < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div
                          className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[file.name] ?? 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile()}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collection Status */}
        {isCollection && files.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
              {files.length < maxFiles && (
                <span className="text-blue-600"> • {maxFiles - files.length} more allowed</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex space-x-3 p-4 border-t bg-gray-50">
        <button
          onClick={removeAllFiles}
          className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Clear All
        </button>
        <button
          className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
            hasFiles && Object.values(uploadProgress).every(progress => progress === 100)
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          disabled={!hasFiles || !Object.values(uploadProgress).every(progress => progress === 100)}
        >
          {isCollection ? `Attach ${files.length} file${files.length !== 1 ? 's' : ''}` : 'Attach file'}
        </button>
      </div>
    </div>
  );
};

export default ImageUploadCard;