
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import api from "../../Api/api"; // Assuming this is your configured Axios instance

// --- Embedded Type Guard and Interface ---
// Interface for the expected structure of an Axios error
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Type guard function to check if an error is an Axios error
const isAxiosError = (error: unknown): error is AxiosErrorResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};
// --- End of Embedded Code ---


// Define a type for a single ticket for better code safety
interface Ticket {
  id: number;
  session_status: 'closed' | 'pending' | 'underReview';
  updated_at: string; // e.g., "2025-06-25 15:15:56"
  // ... other properties from your API
}

// Define a type for the calculated stats
interface TicketStats {
  closedToday: number;
  pending: number;
  underReview: number;
  closedPercentage: number;
  totalUpdatedToday: number;
}

export default function DailyTicketStatus() {
  const [stats, setStats] = useState<TicketStats>({
    closedToday: 0,
    pending: 0,
    underReview: 0,
    closedPercentage: 0,
    totalUpdatedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from your API
        const response = await api.get<{ data: { data: Ticket[] } }>('/tickets');
        const tickets = response.data.data.data;

        // --- Data Processing Logic ---
        const todayStr = new Date().toISOString().split('T')[0]; // Gets date in "YYYY-MM-DD" format

        let closedTodayCount = 0;
        let pendingCount = 0;
        let underReviewCount = 0;
        let totalUpdatedTodayCount = 0;

        tickets.forEach(ticket => {
          const ticketUpdateDate = ticket.updated_at.split(' ')[0];

          // Check if the ticket was updated today
          if (ticketUpdateDate === todayStr) {
            totalUpdatedTodayCount++;
            if (ticket.session_status === 'closed') {
              closedTodayCount++;
            }
          }
          
          // Get total counts for pending and under-review tickets regardless of date
          if (ticket.session_status === 'pending') {
            pendingCount++;
          } else if (ticket.session_status === 'underReview') {
            underReviewCount++;
          }
        });
        
        // Calculate the percentage of closed tickets for today
        const percentage = totalUpdatedTodayCount > 0
          ? (closedTodayCount / totalUpdatedTodayCount) * 100
          : 0;
        
        setStats({
          closedToday: closedTodayCount,
          pending: pendingCount,
          underReview: underReviewCount,
          closedPercentage: parseFloat(percentage.toFixed(2)), // Keep 2 decimal places
          totalUpdatedToday: totalUpdatedTodayCount,
        });

      } catch (err) {
        // Use the embedded type guard here
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
  }, []); // Empty dependency array means this runs once on component mount

  const series = [stats.closedPercentage];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val.toFixed(0) + "%"; // Show percentage without decimals
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
      return <div className="rounded-2xl border border-gray-200 bg-gray-100 p-10 text-center">Loading Ticket Data...</div>;
  }
  
  if (error) {
      return <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center text-red-700">{error}</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daily Ticket Status
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Percentage of tickets closed today.
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative ">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-500">
            {`Total Today: ${stats.totalUpdatedToday}`}
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {`Out of ${stats.totalUpdatedToday} tickets updated today, ${stats.closedToday} have been successfully closed. Keep up the good work!`}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Closed Today
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {stats.closedToday}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Pending
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {stats.pending}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Under Review
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {stats.underReview}
          </p>
        </div>
      </div>
    </div>
  );
}
