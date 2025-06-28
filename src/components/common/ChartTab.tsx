

type TimePeriod = 'monthly' | 'quarterly' | 'annually';

interface ChartTabProps {
  activeTab: TimePeriod;
  onTabChange: (tab: TimePeriod) => void;
}

export default function ChartTab({ activeTab, onTabChange }: ChartTabProps) {
  const tabs: { id: TimePeriod; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'annually', label: 'Annually' },
  ];

  return (
    <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg dark:bg-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full px-4 py-1.5 text-sm font-semibold rounded-md transition-colors focus:outline-none
            ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900/80 dark:text-white'
                : 'text-gray-600 hover:bg-white/60 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}