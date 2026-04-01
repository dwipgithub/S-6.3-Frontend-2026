import { useState } from "react";
import { Outlet } from "react-router-dom";
import NavigationBar, {
  SIDEBAR_WIDTH,
  TOPBAR_HEIGHT,
} from "../NavigationBar/NavigationBar";
import Footer from "../Footer/Footer";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <NavigationBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div
        style={{
          marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0,
          marginTop: TOPBAR_HEIGHT,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease",
        }}
      >
        <main style={{ flex: 1, paddingBottom: 24 }}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
