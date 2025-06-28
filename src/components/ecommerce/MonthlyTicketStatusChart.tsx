import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import api from "../../Api/api"; // Assuming this is your configured Axios instance

// --- Embedded Type Guard and Interface ---
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const isAxiosError = (error: unknown): error is AxiosErrorResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

// Define a type for a single ticket, now including session_status
interface Ticket {
  session_status: 'closed' | 'pending' | 'underReview';
  updated_at: string; // e.g., "2025-06-25 15:15:56"
}
// --- End of Embedded Code ---


export default function MonthlyTicketStatusChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // State to hold the dynamic series data for the stacked chart
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([
    { name: 'Closed', data: [] },
    { name: 'Pending', data: [] },
    { name: 'Under Review', data: [] },
  ]);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<{ data: { data: Ticket[] } }>('/tickets');
        const tickets = response.data.data.data;

        // --- Data Processing for Stacked Bar Chart ---
        const closedCounts = Array(12).fill(0);
        const pendingCounts = Array(12).fill(0);
        const underReviewCounts = Array(12).fill(0);
        const currentYear = new Date().getFullYear();

        tickets.forEach(ticket => {
          const updateDate = new Date(ticket.updated_at);
          
          if (updateDate.getFullYear() === currentYear) {
            const monthIndex = updateDate.getMonth(); // 0 for Jan, 1 for Feb, etc.
            
            // Increment the count in the correct status array
            switch (ticket.session_status) {
              case 'closed':
                closedCounts[monthIndex]++;
                break;
              case 'pending':
                pendingCounts[monthIndex]++;
                break;
              case 'underReview':
                underReviewCounts[monthIndex]++;
                break;
              default:
                break;
            }
          }
        });

        // Update the series state with the processed data
        setSeries([
          { name: 'Closed', data: closedCounts },
          { name: 'Pending', data: pendingCounts },
          { name: 'Under Review', data: underReviewCounts },
        ]);

      } catch (err) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.message || 'Failed to fetch ticket data.');
        } else {
          setError('An unexpected error occurred.');
        }
        console.error("Error fetching ticket data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, []);

  const options: ApexOptions = {
    // A modern color palette: Green for closed, Orange for pending, Blue for review
    colors: ["#16A34A", "#F97316", "#465FFF"], 
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      // --- Key change: Enable stacking ---
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        // Apply radius to the top of the stack for a clean look
        borderRadiusApplication: 'end', 
        borderRadiusWhenStacked: 'last',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      // Add a little margin to the bottom of the legend
      offsetY: -5,
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      // Show values for all series in the stack on hover
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val} tickets`,
      },
    },
  };
  


  if (loading) {
      return (
          <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 h-[265px]">
              Loading Chart Data...
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-red-300 bg-red-50 p-5 h-[265px] text-red-700">
              {error}
          </div>
      );
  }


  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Ticket Status
        </h3>
        
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {/* Chart component now uses the dynamic series and updated options */}
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}