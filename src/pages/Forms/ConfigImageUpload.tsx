import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ImageUploadCard from "../../components/form/form-elements/ImageUploadCard";

// Define the type for the config map entries
interface ConfigMap {
  rules: {
    mimes: string[];
    max: number;
    aspectRatio?: { width: number; height: number };
  };
  path: string;
  type: string;
}

// Define the type for the config map
interface Config {
  [key: string]: ConfigMap;
}

const configMap: Config = {
  app_logo: {
    rules: {
      mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
      max: 200
    },
    path: 'images/uploads',
    type: 'single'
  },
  app_logo_white: {
    rules: {
      mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
      max: 200
    },
    path: 'images/uploads',
    type: 'single'
  },
  icon_logo: {
    rules: {
      mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
      max: 200
    },
    path: 'images/uploads',
    type: 'single'
  },
  
  avatar_paths: {
    rules: {
      mimes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
      max: 10 // Maximum number of files for collection
    },
    path: 'images/uploads',
    type: 'collection'
  },
};

export default function UploadConfigs() {
  const handleFileSelect = (key: string, file: File | null) => {
    // Handle single file selection
    console.log(`Selected file for ${key}:`, file);
  };

  const handleFilesSelect = (key: string, files: File[]) => {
    // Handle multiple files selection for collections
    console.log(`Selected files for ${key}:`, files);
  };

  return (
    <div>
      <PageMeta title="Admin Dashboard" description="This is an Admin Dashboard" />
      <PageBreadcrumb pageTitle="Upload Config Files" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Object.entries(configMap).map(([key, config]) => (
          <ImageUploadCard 
            key={key} 
            title={key} 
            rules={config.rules} 
            type={config.type as 'single' | 'collection'}
            onFileSelect={(file) => handleFileSelect(key, file)}
            onFilesSelect={(files) => handleFilesSelect(key, files)}
          />
        ))}
      </div>
    </div>
  );
}