import { useState, ChangeEvent } from 'react';
import { Upload, X, File, Image, FileText, Plus } from 'lucide-react';

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

const ImageUploadCard = ({ title, rules, type = 'single', onFileSelect, onFilesSelect }: ImageUploadCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isCollection = type === 'collection';
  const maxFiles = rules.max || 10;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (isCollection && selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelect?.(updatedFiles);
    } else if (!isCollection && selectedFiles?.[0]) {
      const selectedFile = selectedFiles[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (isCollection) {
      const updatedFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelect?.(updatedFiles);
    } else if (droppedFiles[0]) {
      const droppedFile = droppedFiles[0];
      setFile(droppedFile);
      onFileSelect(droppedFile);
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
    } else {
      setFile(null);
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
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {rules.aspectRatio && `${rules.aspectRatio.width}:${rules.aspectRatio.height} ratio • `}
                  Max 5MB{isCollection ? ' each' : ''}
                </p>
              </div>
            </div>
          </div>
        )}
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
                          {formatFileSize(fileItem.size)}
                        </p>
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
                      {formatFileSize(file.size)}
                    </p>
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
    </div>
  );
};

export default ImageUploadCard;
