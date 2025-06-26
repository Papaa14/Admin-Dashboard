import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import api from '../Api/api'; 


import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  DownloadIcon,
  ChatIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

// --- TYPE DEFINITIONS ---
interface LogoConfig {
  url?: string;
}

interface ConfigData {
  app_logo?: LogoConfig;
  app_logo_white?: LogoConfig;
  icon_logo?: string;
}

interface PaginationData {
  next_page_url: string | null;
}

interface ApiResponseData {
  data: ConfigData;
  pagination: PaginationData;
}

interface ApiResponse {
  data: ApiResponseData;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}
// --- END: TYPE DEFINITIONS ---

// This function checks if an unknown error is a structured Axios error
const isAxiosError = (error: unknown): error is AxiosErrorResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      subItems: [{ name: "Ecommerce", path: "/", pro: false }],
    },
    {
      icon: <DownloadIcon />,
      name: "Uploads",
      subItems: [{ name: "View Configs", path: "/config-form", pro: false },
      { name: "Add new slider Images", path: "/addImages", pro: false },
      { name: "Add new Faqs", path: "/addFaq", pro: false },
      ],
    },
    {
      name: "Tickets",
      icon: <ChatIcon />,
      subItems: [{ name: "Tickets", path: "/tickets", pro: false }
      ],
    },
  ];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [logos, setLogos] = useState({
    appLogo: "",
    appLogoWhite: "",
    iconLogo: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // --- START: MODIFICATION 3 - Use Axios client with proper typing ---
  useEffect(() => {
    const fetchAllConfigs = async () => {
      const initialEndpoint = "/config/all"; 
      const allConfigsData: ConfigData[] = [];
      let nextUrl: string | null = initialEndpoint;

      try {
        while (nextUrl) {
          // Use the Axios instance with proper typing
          const response = await api.get<ApiResponse>(nextUrl);
          const pageData: ApiResponse = response.data;

          if (pageData.data && pageData.data.data) {
             allConfigsData.push(pageData.data.data);
          }
                 const nextFullUrl = pageData.data.pagination.next_page_url;

        if (nextFullUrl) {         
         const baseUrlString = api.defaults.baseURL || '';

          
          const relativePath = nextFullUrl
              .replace(baseUrlString.replace('https', 'http'), '')
              .replace(baseUrlString, '');

            nextUrl = relativePath;
        }else{
          nextUrl = null; // No more pages to fetch
        }
      }

        const finalConfig = Object.assign({}, ...allConfigsData);

        setLogos({
          appLogo: finalConfig.app_logo?.url || "",
          appLogoWhite: finalConfig.app_logo_white?.url || "",
          iconLogo: finalConfig.icon_logo || "",
        });

      } catch (error: unknown) {
        console.error("Failed to fetch app logos configuration:", error);

        // Use the type guard to check the error structure
        if (isAxiosError(error)) {
          // Extract the specific message from the API response if it exists
          const message = error.response?.data?.message || 'An unknown API error occurred.';
          setError(message);
        } else {         
          setError('An unexpected error occurred. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllConfigs();
  }, []); 

  useEffect(() => {
    let submenuMatched = false;
    const items = navItems;
    items.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {/* The rendering logic for skeleton/error/logos remains the same and will work perfectly */}
          {loading ? (
            <div
              className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                isExpanded || isHovered || isMobileOpen
                  ? "w-[150px] h-[40px]"
                  : "w-[32px] h-[32px]"
              }`}
            />
          ) : error ? (
            // Now displays the specific error from your API
            <div className="text-red-500 text-xs text-center p-2" title={error}>
              Load Error
            </div>
          ) : isExpanded || isHovered || isMobileOpen ? (
            <>
              {logos.appLogo && (
                <img
                  className="dark:hidden"
                  src={logos.appLogo}
                  alt="Logo"
                  width={150}
                  height={40}
                />
              )}
              {logos.appLogoWhite && (
                <img
                  className="hidden dark:block"
                  src={logos.appLogoWhite}
                  alt="Logo Dark"
                  width={150}
                  height={40}
                />
              )}
            </>
          ) : (
            <>
              {logos.iconLogo && (
                <img
                  src={logos.iconLogo}
                  alt="Logo Icon"
                  width={32}
                  height={32}
                />
              )}
            </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  ""
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;