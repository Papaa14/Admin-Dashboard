import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import TicketChatView  from "./pages/OtherPage/TicketChat";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import UploadConfigs from "./pages/Forms/ConfigImageUpload";
import ConfigForm from "./pages/Forms/ConfigForm";
import SupportImageUI from "./pages/Forms/AddImages";
import TextEntryForm from "./pages/Forms/AddConfig";
import SupportFaqUI from "./pages/Forms/AddFaq";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import TicketTable from "./pages/Tables/TicketTable";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
               <Route path="/ticket-chat" element={<TicketChatView />} />

            {/* Forms */}
              <Route path="/config-form" element={<ConfigForm />} />
            <Route path="/form-elements" element={<FormElements />} />
             <Route path="/uploadConfigs" element={<UploadConfigs />} />
                <Route path="/addConfigs" element={<TextEntryForm/>} />
                 <Route path="/addImages" element={<SupportImageUI/>} />
                  <Route path="/addFaq" element={<SupportFaqUI/>} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
             <Route path="/tickets" element={<TicketTable />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
