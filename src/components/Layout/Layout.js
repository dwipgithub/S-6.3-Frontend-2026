import { Outlet } from "react-router-dom";
import NavigationBar, { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "../NavigationBar/NavigationBar";
import Footer from "../Footer/Footer";

const Layout = () => {
  return (
    <>
      <NavigationBar />
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: TOPBAR_HEIGHT,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          display: "flex",
          flexDirection: "column",
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
