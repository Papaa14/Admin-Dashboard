import { useState } from 'react';
import { Edit2, Save, X, Trash2, Plus } from 'lucide-react';

// Define the types for the entry
interface Entry {
  AppName: string;
  SupportNumber: string;
  Version: string;
  Copyright: string;
}

interface EditingState {
  [key: string]: {
    AppName?: boolean;
    SupportNumber?: boolean;
    Version?: boolean;
    Copyright?: boolean;
  };
}

const TextEntryForm = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Entry>({
    AppName: '',
    SupportNumber: '',
    Version: '',
    Copyright: '',
  });
  const [editingStates, setEditingStates] = useState<EditingState>({});
  const [tempValues, setTempValues] = useState<{ [key: string]: Entry }>({});
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!currentEntry.AppName || !currentEntry.SupportNumber || !currentEntry.Version || !currentEntry.Copyright) return;

    // Add new entry
    setEntries(prevEntries => [...prevEntries, currentEntry]);
    // Reset form
    setCurrentEntry({ AppName: '', SupportNumber: '', Version: '', Copyright: '' });
  };

  const startInlineEdit = (index: number, field: keyof Entry) => {
    const entryKey = `entry-${index}`;
    setEditingStates(prev => ({
      ...prev,
      [entryKey]: {
        ...prev[entryKey],
        [field]: true
      }
    }));

    // Store the current value as temp value
    setTempValues(prev => ({
      ...prev,
      [entryKey]: {
        ...prev[entryKey],
        ...entries[index]
      }
    }));
  };

  const saveInlineEdit = (index: number, field: keyof Entry) => {
    const entryKey = `entry-${index}`;
    const newValue = tempValues[entryKey]?.[field] || entries[index][field];

    setEntries(prevEntries =>
      prevEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: newValue } : entry
      )
    );

    setEditingStates(prev => ({
      ...prev,
      [entryKey]: {
        ...prev[entryKey],
        [field]: false
      }
    }));
  };

  const cancelInlineEdit = (index: number, field: keyof Entry) => {
    const entryKey = `entry-${index}`;
    setEditingStates(prev => ({
      ...prev,
      [entryKey]: {
        ...prev[entryKey],
        [field]: false
      }
    }));
  };

  const handleInlineInputChange = (index: number, field: keyof Entry, value: string) => {
    const entryKey = `entry-${index}`;
    setTempValues(prev => ({
      ...prev,
      [entryKey]: {
        ...prev[entryKey],
        [field]: value
      }
    }));
  };

  const handleTrashSingle = (index: number) => {
    setEntries(prevEntries => prevEntries.filter((_, i) => i !== index));
    // Clean up editing states and temp values
    const entryKey = `entry-${index}`;
    setEditingStates(prev => {
      const newState = { ...prev };
      delete newState[entryKey];
      return newState;
    });
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[entryKey];
      return newValues;
    });
  };

  const handleSelectEntry = (index: number) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map((_, index) => index)));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = () => {
    if (selectedEntries.size === 0) return;

    setEntries(prevEntries =>
      prevEntries.filter((_, index) => !selectedEntries.has(index))
    );
    setSelectedEntries(new Set());
    setSelectAll(false);
  };

  const handleBulkUpdate = () => {
    // For demo purposes, we'll just show an alert
    // In a real app, you might open a modal or show a bulk edit form
    alert(`Bulk update for ${selectedEntries.size} entries would be implemented here`);
  };

  const isFieldEditing = (index: number, field: keyof Entry) => {
    const entryKey = `entry-${index}`;
    return editingStates[entryKey]?.[field] || false;
  };

  const getTempValue = (index: number, field: keyof Entry) => {
    const entryKey = `entry-${index}`;
    return tempValues[entryKey]?.[field] || entries[index][field];
  };

  const renderEditableField = (entry: Entry, index: number, field: keyof Entry, label: string) => {
    const isEditing = isFieldEditing(index, field);
    const value = isEditing ? getTempValue(index, field) : entry[field];

    return (
      
      <div className="flex items-center space-x-2 mb-2">
        <span className="font-medium text-gray-700 w-20">{label}:</span>
        {isEditing ? (
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleInlineInputChange(index, field, e.target.value)}
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => saveInlineEdit(index, field)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => cancelInlineEdit(index, field)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-gray-900">{value}</span>
            <button
              onClick={() => startInlineEdit(index, field)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Add New Configs</h1>
          <p className="text-gray-600 mt-1">Add new configs and manage existing ones with inline editing</p>
        </div>

        {/* Add New Entry Form */}
        <div className="p-6 border-b bg-gray-50">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Plus className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Add New Entry</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input
                  type="text"
                  name="AppName"
                  value={currentEntry.AppName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Number</label>
                <input
                  type="text"
                  name="SupportNumber"
                  value={currentEntry.SupportNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  name="Version"
                  value={currentEntry.Version}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copyright</label>
                <input
                  type="text"
                  name="Copyright"
                  value={currentEntry.Copyright}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Entries List */}
        <div className="p-6">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
              <p className="text-gray-500">Add your first entry using the form above</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    {entries.length} total entries
                  </span>
                </div>

                {selectedEntries.size > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {selectedEntries.size} selected
                    </span>
                    <button
                      onClick={handleBulkUpdate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Bulk Update
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Entries */}
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className={`group border rounded-lg p-4 transition-all hover:shadow-md ${
                      selectedEntries.has(index) ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(index)}
                        onChange={() => handleSelectEntry(index)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Entry #{index + 1}</h3>
                          <button
                            onClick={() => handleTrashSingle(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          {renderEditableField(entry, index, 'AppName', 'App Name')}
                          {renderEditableField(entry, index, 'SupportNumber', 'Support Number')}
                          {renderEditableField(entry, index, 'Version', 'Version')}
                          {renderEditableField(entry, index, 'Copyright', 'Copyright')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextEntryForm;
