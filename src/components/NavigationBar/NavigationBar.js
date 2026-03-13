import React, { useState, useEffect, useMemo, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import axios from "axios";
import jwt_decode from "jwt-decode";
import logoImage from "../Images/sirsIcon.png";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 56;
const FOOTER_HEIGHT = 70; /* sama dengan max-height footer agar menu bawah tidak tertutup */

export { SIDEBAR_WIDTH, TOPBAR_HEIGHT };

const NavigationBar = ({ sidebarOpen, setSidebarOpen }) => {
  const [user, setUser] = useState({});
  const [expire, setExpire] = useState("");
  const { CSRFToken } = useCSRFTokenContext();
  const navigate = useNavigate();

  const [openMenus, setOpenMenus] = useState({});
  const [openSubMenus, setOpenSubMenus] = useState({});

  const menus = useMemo(
    () => [
      { name: "Beranda", path: "/beranda", icon: "🏠" },
      {
        name: "RL.3",
        icon: "📋",
        subMenus: [
          { name: "RL 3.1 Indikator Pelayanan", path: "/rl31", icon: "📊" },
          { name: "RL 3.2 Rawat Inap", path: "/rl32", icon: "🛏️" },
          { name: "RL 3.3 Rawat Darurat", path: "/rl33", icon: "🚑" },
          { name: "RL 3.4 Pengunjung", path: "/brandarl34", icon: "👥" },
          { name: "RL 3.5 Kunjungan", path: "/rl35", icon: "📅" },
          { name: "RL 3.6 Kebidanan", path: "/rl36", icon: "🤰" },
          {
            name: "RL 3.7 Neonatal, Bayi, dan Balita",
            path: "/rl37",
            icon: "👶",
          },
          { name: "RL 3.8 Laboratorium", path: "/rl38", icon: "🧪" },
          { name: "RL 3.9 Radiologi", path: "/rl39", icon: "🩻" },
          { name: "RL 3.10 Rujukan", path: "/rl310", icon: "↔️" },
          { name: "RL 3.11 Gigi Dan Mulut", path: "/rl311", icon: "🦷" },
          { name: "RL 3.12 Pembedahan", path: "/rl312", icon: "🏥" },
          { name: "RL 3.13 Rehabilitasi Medik", path: "/rl313", icon: "♿" },
          { name: "RL 3.14 Pelayanan Khusus", path: "/rl314", icon: "⭐" },
          { name: "RL 3.15 Kesehatan Jiwa", path: "/rl315", icon: "🧠" },
          { name: "RL 3.16 Keluarga Berencana", path: "/rl316", icon: "👨‍👩‍👧" },
          {
            name: "RL 3.17 Farmasi Pengadaan Obat",
            path: "/rl317",
            icon: "💊",
          },
          { name: "RL 3.18 Farmasi Resep", path: "/rl318", icon: "📝" },
          { name: "RL 3.19 Cara Bayar", path: "/rl319", icon: "💳" },
        ],
      },
      {
        name: "RL.4",
        icon: "📄",
        subMenus: [
          {
            name: "RL 4.1 Morbiditas Pasien Rawat Inap",
            path: "/rl41",
            icon: "📈",
          },
          {
            name: "RL 4.2 10 Besar Penyakit Rawat Inap",
            path: "/rl42",
            icon: "🔟",
          },
          {
            name: "RL 4.3 10 Besar Kematian Penyakit",
            path: "/rl43",
            icon: "📉",
          },
        ],
      },
      {
        name: "RL.5",
        icon: "📑",
        subMenus: [
          {
            name: "RL 5.1 Morbiditas Pasien Rawat Jalan",
            path: "/MENURL51",
            icon: "📊",
          },
          {
            name: "RL 5.2 10 Besar Kasus Baru Penyakit Rawat Jalan",
            path: "/rl52",
            icon: "🔟",
          },
          {
            name: "RL 5.3 10 Besar Kunjungan Penyakit Rawat Jalan",
            path: "/rl53",
            icon: "📋",
          },
        ],
      },
      { name: "Absensi", path: "/absensi", icon: "📌" },
    ],
    [],
  );

  const toggleSubMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleNested = (parentIndex, subIndex) => {
    setOpenSubMenus((prev) => {
      const parent = prev[parentIndex] || {};
      return {
        ...prev,
        [parentIndex]: { ...parent, [subIndex]: !parent[subIndex] },
      };
    });
  };

  const location = useLocation();
  const pathname = location.pathname;

  const isPathActive = useCallback(
    (path) => {
      if (!path) return false;
      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname],
  );

  const isMenuActive = (menu) => {
    if (menu.path && isPathActive(menu.path)) return true;
    if (menu.subMenus) {
      return menu.subMenus.some((sub) => {
        if (sub.path && isPathActive(sub.path)) return true;
        if (sub.subMenus) {
          return sub.subMenus.some((ss) => ss.path && isPathActive(ss.path));
        }
        return false;
      });
    }
    return false;
  };

  useEffect(() => {
    const defaultOpenMenus = {};
    const defaultOpenSubMenus = {};
    menus.forEach((menu, i) => {
      defaultOpenMenus[i] = true;
      if (menu.subMenus) {
        const subMap = {};
        menu.subMenus.forEach((sub, sIdx) => {
          if (sub.subMenus) subMap[sIdx] = true;
        });
        if (Object.keys(subMap).length) defaultOpenSubMenus[i] = subMap;
      }
    });
    menus.forEach((menu, mIdx) => {
      if (menu.subMenus) {
        const activeSubIndex = menu.subMenus.findIndex((sub) => {
          if (sub.path && isPathActive(sub.path)) return true;
          if (sub.subMenus)
            return sub.subMenus.some((ss) => ss.path && isPathActive(ss.path));
          return false;
        });
        if (activeSubIndex !== -1) {
          defaultOpenMenus[mIdx] = true;
          defaultOpenSubMenus[mIdx] = {
            ...(defaultOpenSubMenus[mIdx] || {}),
            [activeSubIndex]: true,
          };
        }
      }
    });
    const t = setTimeout(() => {
      setOpenMenus((prev) => ({ ...prev, ...defaultOpenMenus }));
      setOpenSubMenus((prev) => ({ ...(prev || {}), ...defaultOpenSubMenus }));
    }, 140);
    return () => clearTimeout(t);
  }, [pathname, menus, isPathActive]);

  useEffect(() => {
    refreshToken();
    document.title = "SIRS Online Versi 6";
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: { "XSRF-TOKEN": CSRFToken },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      const decoded = jwt_decode(response.data.accessToken);
      setUser(decoded);
      setExpire(decoded.exp);
    } catch (error) {
      if (error.response || error.code === "ERR_NETWORK") {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const Logout = async () => {
    try {
      const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
      await axios.delete("/apisirs6v2/logout", customConfig);
      localStorage.removeItem("id");
      window.location.replace(process.env.REACT_APP_BASE_SSO);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Top bar */}
      <Navbar
        fixed="top"
        className="navbar-expand-lg fixed-top"
        style={{
          height: TOPBAR_HEIGHT,
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Navbar.Brand
          as={Link}
          to="/beranda"
          className="d-flex align-items-center"
          style={{ color: "#333", paddingLeft: "50px" }}
        >
          {/* <img src={logoImage} width="30" height="30" className="d-inline-block align-top me-2" alt="SIRS" /> */}
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              // fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            <span style={{ color: "#00B9AD" }}>SIRS</span>{" "}
            <span style={{ color: "#CDDC29" }}>ONLINE</span>
          </span>
        </Navbar.Brand>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "22px",
            marginLeft: "15px",
            cursor: "pointer",
          }}
        >
          ☰
        </button>
        <Nav className="ms-auto">
          <NavDropdown
            title={
              <span style={{ fontWeight: 500 }}>
                <span style={{ color: "#00B9AD" }}>Login as</span>{" "}
                <span style={{ color: "#CDDC29" }}>
                  {user.nama ? user.nama : "User"}
                </span>
              </span>
            }
            id="user-dropdown"
            align="end"
          >
            <NavDropdown.Item onClick={Logout}>Log Out</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar>

      {/* Left sidebar - scroll vertikal saat menu banyak */}
      <div
        className="d-flex flex-column p-3"
        style={{
          width: SIDEBAR_WIDTH,
          maxHeight: `calc(100vh - ${TOPBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
          position: "fixed",
          top: TOPBAR_HEIGHT,
          left: sidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px`,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          backgroundColor: "#f8f9fa",
          borderRight: "1px solid #e2e8f0",
          transition: "left 0.3s ease",
        }}
      >
        <style>{`
          .sidebar-menu{ transition: transform .15s ease, filter .15s ease; }
          .sidebar-menu:hover{ filter: brightness(1.06); transform: translateX(6px); }
          .sidebar-submenu{ transition: transform .15s ease, background-color .15s ease; background: transparent; border: none; }
          .sidebar-submenu:hover{ background: rgba(205,220,41,0.2); transform: translateX(6px); }
          .submenu-collapse{ max-height: 0; overflow: hidden; opacity: 0; transform: translateY(-8px); transition: max-height 800ms cubic-bezier(.2,.9,.2,1), opacity 800ms ease, transform 800ms cubic-bezier(.2,.9,.2,1); }
          .submenu-collapse.open{ max-height: 2000px; opacity: 1; transform: translateY(0); transition-delay: 80ms; }
          .submenu-collapse.open .submenu-collapse.open{ transition-delay: 160ms; }
        `}</style>
        <ul className="nav flex-column mb-auto" style={{ lineHeight: "1.2" }}>
          {menus.map((menu, index) => (
            <li
              key={index}
              className="nav-item"
              style={{ marginBottom: "2px" }}
            >
              {menu.subMenus ? (
                <>
                  <button
                    type="button"
                    className="btn btn-link text-start w-100 sidebar-menu"
                    onClick={() => toggleSubMenu(index)}
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      textDecoration: "none",
                      padding: "8px 10px",
                      margin: "0",
                      background: "linear-gradient(90deg,#CDDC29,#b8c924)",
                      borderRadius: "8px",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "none",
                      borderLeft: "none",
                      display: "flex",
                      alignItems: "center",
                      ...(isMenuActive(menu) && {
                        borderLeft: "6px solid #CDDC29",
                        background: "rgba(205,220,41,0.2)",
                        color: "#000",
                      }),
                    }}
                  >
                    <span style={{ marginRight: 8 }}>{menu.icon}</span>
                    {menu.name}
                  </button>
                  <ul
                    className={
                      "nav flex-column ms-3 submenu-collapse " +
                      (openMenus[index] ? "open" : "")
                    }
                    style={{
                      marginTop: "4px",
                      borderLeft: "2px dotted #CDDC29",
                      paddingLeft: "10px",
                    }}
                  >
                    {menu.subMenus.map((sub, subIndex) => (
                      <li
                        key={subIndex}
                        className="nav-item"
                        style={{
                          marginBottom: "2px",
                          borderBottom: "2px dotted #CDDC29",
                          paddingBottom: "2px",
                        }}
                      >
                        <Link
                          to={sub.path}
                          className="nav-link sidebar-submenu"
                          style={{
                            color: "#000",
                            fontSize: "0.9rem",
                            textDecoration: "none",
                            padding: "6px 10px",
                            margin: "4px 0",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            ...(isPathActive(sub.path) && {
                              background: "rgba(205,220,41,0.2)",
                              fontWeight: 700,
                            }),
                          }}
                        >
                          <span style={{ marginRight: 8 }}>{sub.icon}</span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              lineHeight: 1,
                            }}
                          >
                            {(() => {
                              const parts = String(sub.name).split(" ");
                              const first = parts.slice(0, 2).join(" ");
                              const second = parts.slice(2).join(" ");
                              return (
                                <>
                                  <span
                                    style={{
                                      fontSize: "0.95rem",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {first}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.82rem",
                                      color: "#374151",
                                    }}
                                  >
                                    {second}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  to={menu.path}
                  className="nav-link sidebar-menu"
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    padding: "8px 10px",
                    margin: "0",
                    background: "linear-gradient(90deg,#CDDC29,#b8c924)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    ...(isMenuActive(menu) && {
                      borderLeft: "6px solid #CDDC29",
                      background: "rgba(205,220,41,0.2)",
                      color: "#000",
                    }),
                  }}
                >
                  <span style={{ marginRight: 8 }}>{menu.icon}</span>
                  {menu.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default NavigationBar;
