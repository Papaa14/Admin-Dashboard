import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import ChartTab from "../common/ChartTab"; // Assuming ChartTab component is in this path
import api from "../../Api/api"; // Your API instance

// --- Embedded Types & Helpers ---
interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
}
const isAxiosError = (error: unknown): error is AxiosErrorResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};
interface Ticket {
  session_status: 'closed' | 'pending' | 'underReview';
  created_at: string;
  updated_at: string;
}
type TimePeriod = 'monthly' | 'quarterly' | 'annually';
// --- End of Embedded Code ---

export default function StatisticsChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  
  const [chartData, setChartData] = useState<{ series: ApexAxisChartSeries; options: ApexOptions }>({
    series: [],
    options: {},
  });
  
  // Effect 1: Fetch data only once
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ data: { data: Ticket[] } }>('/tickets');
        setAllTickets(response.data.data.data);
      } catch (err) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.message || 'Failed to fetch statistics.');
        } else {
          setError('An unexpected error occurred.');
        }
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicketData();
  }, []);

  // Effect 2: Process data when time period or tickets change
  useEffect(() => {
    if (allTickets.length === 0) return;

    const currentYear = new Date().getFullYear();
    let categories: string[] = [];
    let closedData: number[] = [];
    let underReviewData: number[] = [];
    // --- Change: Added pendingData array ---
    let pendingData: number[] = [];

    switch (timePeriod) {
      case 'monthly':
        categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        closedData = Array(12).fill(0);
        underReviewData = Array(12).fill(0);
        pendingData = Array(12).fill(0); // Initialize pending data

        allTickets.forEach(ticket => {
          const updatedDate = new Date(ticket.updated_at);
          if (updatedDate.getFullYear() === currentYear) {
            const month = updatedDate.getMonth();
            if (ticket.session_status === 'closed') {
              closedData[month]++;
            } else if (ticket.session_status === 'underReview') {
              underReviewData[month]++;
            } else if (ticket.session_status === 'pending') { // --- Change: Count pending tickets
              pendingData[month]++;
            }
          }
        });
        break;

      case 'quarterly':
        categories = ["Q1", "Q2", "Q3", "Q4"];
        closedData = Array(4).fill(0);
        underReviewData = Array(4).fill(0);
        pendingData = Array(4).fill(0); // Initialize pending data

        allTickets.forEach(ticket => {
          const updatedDate = new Date(ticket.updated_at);
          if (updatedDate.getFullYear() === currentYear) {
            const quarter = Math.floor(updatedDate.getMonth() / 3);
            if (ticket.session_status === 'closed') {
              closedData[quarter]++;
            } else if (ticket.session_status === 'underReview') {
              underReviewData[quarter]++;
            } else if (ticket.session_status === 'pending') { // --- Change: Count pending tickets
              pendingData[quarter]++;
            }
          }
        });
        break;

      case 'annually':
        // --- Change: Added pending to the yearCounts object ---
        { const yearCounts: { [year: number]: { closed: number; underReview: number; pending: number } } = {};
        allTickets.forEach(ticket => {
            const updatedYear = new Date(ticket.updated_at).getFullYear();
            if (!yearCounts[updatedYear]) {
                yearCounts[updatedYear] = { closed: 0, underReview: 0, pending: 0 };
            }
            if (ticket.session_status === 'closed') {
                yearCounts[updatedYear].closed++;
            } else if (ticket.session_status === 'underReview') {
                yearCounts[updatedYear].underReview++;
            } else if (ticket.session_status === 'pending') { // --- Change: Count pending tickets
                yearCounts[updatedYear].pending++;
            }
        });
        categories = Object.keys(yearCounts).sort();
        closedData = categories.map(year => yearCounts[parseInt(year)].closed);
        underReviewData = categories.map(year => yearCounts[parseInt(year)].underReview);
        pendingData = categories.map(year => yearCounts[parseInt(year)].pending); // --- Change: Map pending data
        break; }
    }

    // --- Change: Update Chart State with three series ---
    setChartData({
      series: [
        { name: "Tickets Closed", data: closedData },
        { name: "Under Review", data: underReviewData },
        { name: "Pending", data: pendingData },
      ],
      options: getChartOptions(categories),
    });

  }, [timePeriod, allTickets]);

  // Helper function to generate options dynamically
  const getChartOptions = (categories: string[]): ApexOptions => ({
    legend: { show: false },
    // --- Change: Updated color scheme for three series ---
    colors: ["#16A34A", "#F97316", "#465FFF"], // Green (Closed), Orange (Review), Blue (Pending)
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: { show: false },
    },
    // --- Change: Added a third width value for the new line ---
    stroke: { curve: "smooth", width: [2, 2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val) => `${val} tickets` } },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: ["#6B7280"] } },
    },
  });
  
  if (loading) {
    return <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white h-[420px]">Loading Statistics...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center rounded-2xl border border-red-300 bg-red-50 p-5 h-[420px] text-red-700">{error}</div>
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ticket Status Trends
          </h3>
          {/* --- Change: Updated subtitle to be more general --- */}
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            A comparison of ticket statuses over time
          </p>
        </div>
        <div className="flex items-start w-full sm:w-auto sm:justify-end">
          <ChartTab activeTab={timePeriod} onTabChange={setTimePeriod} />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[700px] xl:min-w-full">
          {chartData.series.length > 0 && (
            <Chart options={chartData.options} series={chartData.series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}