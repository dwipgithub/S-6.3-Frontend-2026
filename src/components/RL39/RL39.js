import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { downloadExcel } from "react-export-table-to-excel";
import style from "./RL39.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";
import CryptoJS from "crypto-js";
import {
  FaSyncAlt,
  FaInfoCircle,
  FaDatabase,
  FaCalendarAlt,
  FaFilter,
  FaListAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { SiMicrosoftexcel } from "react-icons/si";
import Pagination from "../Pagination/Pagination.js";

// ==========================================
// KOMPONEN UTAMA (TAB MENU)
// ==========================================
export default function TabMenu() {
  const [activeTab, setActiveTab] = useState("tab1");
  const { CSRFToken } = useCSRFTokenContext();
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [statusSatset, setStatusSatset] = useState(0);

  useEffect(() => {
    refreshToken();
  }, []);

  useEffect(() => {
    if (token) {
      loadStatusSatset();
    }
  }, [token]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const loadStatusSatset = async () => {
    try {
      const response = await axios.get("/apisirs6v2/status-satset", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusSatset(response.data.status_satset || 0);
    } catch (error) {
      console.error("Gagal memuat status SATUSEHAT:", error);
    }
  };

  return (
    <div className="container" style={{ marginTop: "20px", marginBottom: "70px" }}>
      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}>RL 3.9 - Radiologi</h4>

          {/* NAVIGASI TAB */}
          <ul className="nav nav-tabs border-bottom mb-0">
            <li className="nav-item">
              <button
                style={{ color: activeTab === "tab1" ? "#00b9ad" : "black" }}
                className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                SIRS
              </button>
            </li>

            {user.jenisUserId === 4 && statusSatset === 1 && (
              <li className="nav-item">
                <button
                  style={{ color: activeTab === "tab2" ? "#00b9ad" : "black" }}
                  className={`nav-link ${activeTab === "tab2" ? "active" : ""}`}
                  onClick={() => setActiveTab("tab2")}
                >
                  SATUSEHAT
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* KONTEN TAB */}
      <div className="tab-content mt-0">
        <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
          <div className="border rounded-bottom p-4 shadow-sm bg-white">
            <TabOne />
          </div>
        </div>

        <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
          <div className="border rounded-bottom p-4 shadow-sm bg-white">
            <TabTwo />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN TAB 1: SIRS ONLINE
// ==========================================
function TabOne() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState("01");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();

  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [KeteranganValidasiDb, setKeteranganValidasiDb] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const [selectedRsID, setSelectedRsID] = useState(null);
  const [activeTabInner, setActiveTabInner] = useState("tab1");

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      if (decoded.jenisUserId === 4) {
        showRumahSakit(decoded.satKerId);
      }
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) navigate("/");
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
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }

      if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET
        ).toString();

        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  const getBulan = () => {
    setDaftarBulan([
      { key: "Januari", value: "01" },
      { key: "Februari", value: "02" },
      { key: "Maret", value: "03" },
      { key: "April", value: "04" },
      { key: "Mei", value: "05" },
      { key: "Juni", value: "06" },
      { key: "Juli", value: "07" },
      { key: "Agustus", value: "08" },
      { key: "September", value: "09" },
      { key: "Oktober", value: "10" },
      { key: "November", value: "11" },
      { key: "Desember", value: "12" },
    ]);
  };

  const getRumahSakit = async (id, type = "kabkota") => {
    setLoadingRS(true);
    setDaftarRumahSakit([]);
    try {
      const params = type === "provinsi" ? { provinsiId: id } : { kabKotaId: id };
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDaftarRumahSakit(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoadingRS(false);
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRumahSakit(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectRumahSakit = (e) => {
    const id = e.target.value;
    const selected = daftarRumahSakit.find((item) => item.id == id);
    if (selected) {
      setSelectedRsID(selected.id);
      setRumahSakit(selected);
    } else {
      setSelectedRsID(null);
      setRumahSakit(null);
    }
  };

  const getValidasi = async () => {
    if (!rumahSakit?.id) return;
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulan}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/rltigatitiksembilanvalidasi", customConfig);

      if (results.data.data != null && results.data.data.length > 0) {
        const valData = results.data.data[0];
        setidValidasi(valData.id);
        setidValidasiSubmited(valData.statusValidasiId);
        if (user.jenisUserId === 3) setStatusValidasi(1);
        else if (user.jenisUserId === 4) setStatusValidasi(2);
        else setStatusValidasi("");

        setKeteranganValidasi(valData.catatan || "");
        setKeteranganValidasiDb(valData.catatan || "");
        setTglValidasi(valData.modifiedAt);
        setIsValidated(valData.statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi(1);
        setKeteranganValidasi("");
        setKeteranganValidasiDb("");
        setTglValidasi("");
        setIsValidated(false);
      }
    } catch (error) {
      console.error(error);
    }
    setSpinner(false);
  };

  const fetchRL = async (pageNumber = 1) => {
    if (!rumahSakit?.id) return;
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulan}`,
          page: pageNumber,
          limit,
        },
      };

      const results = await axiosJWT.get("/apisirs6v2/rltigatitiksembilan", customConfig);
      setDataRL(results.data.data || []);
      setTotalPages(results.data.pagination?.totalPages || 0);
      setPage(results.data.pagination?.page || 1);
    } catch (error) {
      console.error(error);
      setDataRL([]);
    }
    setSpinner(false);
  };

  const getRL = async (e) => {
    e.preventDefault();

    if (user.jenisUserId === 3 && !selectedRsID) {
      toast("Rumah sakit harus dipilih", { position: toast.POSITION.TOP_RIGHT });
      return;
    }

    setFilterLabel([`Nama Rumah Sakit: ${rumahSakit?.nama || "-"}`, `Periode: ${tahun}-${bulan}`]);
    setNamaFile(`rl39_${rumahSakit?.id || ""}_${tahun}-${bulan}-01`);

    setShow(false);
    setActiveTabInner("tab1");
    setIsFilterApplied(true);

    await fetchRL(1);
    await getValidasi();
  };

  const handleShowModal = () => {
    const { jenisUserId, satKerId } = user;
    setBulan("01");

    if (jenisUserId === 1 || jenisUserId === 99) getProvinsi();
    else if (jenisUserId === 2) getKabKota(satKerId);
    else if (jenisUserId === 3) getRumahSakit(satKerId);
    else if (jenisUserId === 4) showRumahSakit(satKerId);

    setShow(true);
  };

  const getProvinsi = async () => {
    try {
      const results = await axiosJWT.get("/apisirs6v2/provinsi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDaftarProvinsi(results.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const results = await axiosJWT.get("/apisirs6v2/kabkota", {
        headers: { Authorization: `Bearer ${token}` },
        params: { provinsiId },
      });
      setDaftarKabKota(results.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteDetailRL = async (id) => {
    try {
      await axiosJWT.delete("/apisirs6v2/rltigatitiksembilan/" + id, {
        headers: { Authorization: `Bearer ${token}`, "XSRF-TOKEN": CSRFToken },
      });
      setDataRL((current) => current.filter((item) => item.id !== id));
      toast("Data Berhasil Dihapus", { position: toast.POSITION.TOP_RIGHT });
    } catch (error) {
      console.error(error);
      toast("Data Gagal Dihapus", { position: toast.POSITION.TOP_RIGHT });
    }
  };

  const Delete = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        { label: "Ya", onClick: () => deleteDetailRL(id) },
        { label: "Tidak" },
      ],
    });
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();
    setSpinner(true);

    if (!rumahSakit) {
      toast("Rumah sakit harus dipilih", { position: toast.POSITION.TOP_RIGHT });
      setSpinner(false);
      return;
    }

    if (statusValidasi == 1 && keteranganValidasi === "") {
      toast("Keterangan tidak boleh kosong", { position: toast.POSITION.TOP_RIGHT });
      setSpinner(false);
      return;
    }

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      if (idValidasi !== "") {
        await axiosJWT.patch(
          "/apisirs6v2/rltigatitiksembilanvalidasi/" + idValidasi,
          { statusValidasiId: statusValidasi, catatan: keteranganValidasi },
          customConfig
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rltigatitiksembilanvalidasi",
          {
            rsId: rumahSakit.id,
            periode: `${tahun}-${bulan}`,
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig
        );
      }

      toast("Data Berhasil Disimpan", { position: toast.POSITION.TOP_RIGHT });
      setIsValidated(statusValidasi == 3);
      await getValidasi();
    } catch (error) {
      toast(`Data tidak bisa disimpan: ${error.response?.data?.message || "Terjadi kesalahan"}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setSpinner(false);
  };

  const handleDownloadExcel = async () => {
    try {
      setSpinner(true);
      const res = await axiosJWT.get("/apisirs6v2/rltigatitiksembilan", {
        headers: { Authorization: `Bearer ${token}` },
        params: { rsId: rumahSakit.id, periode: `${tahun}-${bulan}` },
      });

      const body = (res.data.data || []).map((val) => [
        val.no_jenis_kegiatan,
        val.nama_jenis_kegiatan,
        val.jumlah,
      ]);

      downloadExcel({
        fileName: namafile,
        sheet: "RL 3.9",
        tablePayload: {
          header: ["No", "Jenis Kegiatan", "Jumlah"],
          body,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSpinner(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === "tab2") getValidasi();
    setActiveTabInner(tab);
  };

  return (
    <div className="container" style={{ marginTop: "0px", marginBottom: "70px" }}>
      {spinner && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      <ToastContainer />

      {/* MODAL FILTER */}
      <Modal show={show} onHide={() => setShow(false)} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter SIRS</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
          <Modal.Body>
            {(user.jenisUserId === 1 || user.jenisUserId === 99) && (
              <>
                <div className="form-floating mb-2">
                  <select
                    className="form-select"
                    onChange={(e) => getKabKota(e.target.value)}
                  >
                    <option value={0}>Pilih</option>
                    {daftarProvinsi.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                  <label>Provinsi</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option value={0}>Pilih</option>
                    {daftarKabKota.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                  <label>Kab/Kota</label>
                </div>
              </>
            )}

            {user.jenisUserId === 2 && (
              <div className="form-floating mb-2">
                <select
                  className="form-select"
                  onChange={(e) => getRumahSakit(e.target.value)}
                >
                  <option value={0}>Pilih</option>
                  {daftarKabKota.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
                <label>Kab/Kota</label>
              </div>
            )}

            {[1, 2, 3, 99].includes(user.jenisUserId) && (
              <div className="form-floating mb-2">
                <select
                  className="form-select"
                  value={selectedRsID || ""}
                  onChange={handleSelectRumahSakit}
                >
                  <option value={0}>{loadingRS ? "Loading..." : "Pilih"}</option>
                  {daftarRumahSakit.map((rs) => (
                    <option key={rs.id} value={rs.id}>{rs.nama}</option>
                  ))}
                </select>
                <label>Rumah Sakit</label>
              </div>
            )}

            <div className="form-floating" style={{ width: "70%", display: "inline-block" }}>
              <select className="form-control" onChange={(e) => setBulan(e.target.value)}>
                {daftarBulan.map((b) => (
                  <option key={b.value} value={b.value}>{b.key}</option>
                ))}
              </select>
              <label>Bulan</label>
            </div>

            <div className="form-floating" style={{ width: "30%", display: "inline-block" }}>
              <input
                type="number"
                className="form-control"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
              <label>Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="submit" className={style.btnPrimary}>
              <HiSaveAs size={20} /> Terapkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <div className={style.toolbar}>
            {user.jenisUserId === 4 && (
              <Link to="/rl39/tambah/" className={style.btnPrimary} style={{ textDecoration: "none" }}>
                Tambah
              </Link>
            )}
            <button className={style.btnPrimary} onClick={handleShowModal}>
              Filter
            </button>
            <button className={style.btnPrimary} onClick={handleDownloadExcel}>
              Download
            </button>
          </div>

          <div className={style.filterLabel}>
            {filterLabel.length > 0 && (
              <h5 style={{ fontSize: "14px" }}>Filtered By {filterLabel.join(", ")}</h5>
            )}
          </div>

          <ul className={`nav nav-tabs ${style.navTabs}`}>
            <li className={`nav-item ${style.navItem}`}>
              <button
                type="button"
                className={`${style.navLink} ${activeTabInner === "tab1" ? style.active : ""}`}
                onClick={() => handleTabClick("tab1")}
              >
                Data
              </button>
            </li>
            {[1, 2, 3, 4].includes(user.jenisUserId) && (
              <li className={`nav-item ${style.navItem}`}>
                <button
                  type="button"
                  className={`${style.navLink} ${activeTabInner === "tab2" ? style.active : ""}`}
                  onClick={() => handleTabClick("tab2")}
                >
                  Validasi
                </button>
              </li>
            )}
          </ul>

          <div className={`tab-content ${style.tabContent}`}>
            {/* TAB DATA */}
            <div className={`tab-pane fade ${activeTabInner === "tab1" ? "show active" : ""}`}>
              <div className={style["outer-wrapper"]} style={{ width: "100%", overflowX: "auto" }}>
                <div className={style["inner-content"]}>
                  <div className={style["table-container"]}>
                    <table className={style["table"]} ref={tableRef}>
                      <thead className={style["thead"]}>
                        <tr>
                          <th style={{ width: "5%" }}>No.</th>
                          {user.jenisUserId === 4 && <th style={{ width: "10%" }}>Aksi</th>}
                          <th style={{ textAlign: "left", width: "50%" }}>Jenis Kegiatan</th>
                          <th style={{ textAlign: "center", width: "15%" }}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const groupedData = dataRL.reduce((acc, item) => {
                            const groupId = item.group_jenis_kegiatan_id;
                            if (!acc[groupId]) {
                              acc[groupId] = {
                                noGroup: item.no_group_jenis_kegiatan,
                                namaGroup: item.nama_group_jenis_kegiatan,
                                items: [],
                                subtotal: 0,
                              };
                            }
                            acc[groupId].items.push(item);
                            acc[groupId].subtotal += Number(item.jumlah || 0);
                            return acc;
                          }, {});

                          const grandTotal = dataRL.reduce((acc, item) => acc + Number(item.jumlah || 0), 0);

                          if (dataRL.length === 0) {
                            return (
                              <tr>
                                <td colSpan={user.jenisUserId === 4 ? 4 : 3} style={{ textAlign: "center" }}>
                                  Tidak ada data
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <>
                              {Object.keys(groupedData).map((groupId) => {
                                const group = groupedData[groupId];
                                return (
                                  <React.Fragment key={`group-${groupId}`}>
                                    <tr style={{ verticalAlign: "middle", fontWeight: "bold" }}>
                                      <td style={{ textAlign: "center" }}>{group.noGroup}</td>
                                      {user.jenisUserId === 4 && <td />}
                                      <td style={{ textAlign: "left" }}>{group.namaGroup}</td>
                                      <td style={{ textAlign: "center" }}>{group.subtotal}</td>
                                    </tr>

                                    {group.items.map((val) => (
                                      <tr key={val.id} style={{ verticalAlign: "middle" }}>
                                        <td style={{ textAlign: "center" }}>{val.no_jenis_kegiatan}</td>
                                        {user.jenisUserId === 4 && (
                                          <td style={{ textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                              <button
                                                className="btn btn-danger"
                                                style={{ backgroundColor: "#FF6663", padding: "4px 10px", fontSize: "12px" }}
                                                type="button"
                                                onClick={() => Delete(val.id)}
                                              >
                                                Hapus
                                              </button>
                                              <Link
                                                to={`/rl39/ubah/${val.id}`}
                                                className="btn btn-warning"
                                                style={{ backgroundColor: "#CFD35E", color: "#FFF", padding: "4px 10px", fontSize: "12px" }}
                                              >
                                                Ubah
                                              </Link>
                                            </div>
                                          </td>
                                        )}
                                        <td style={{ textAlign: "left" }}>{val.nama_jenis_kegiatan}</td>
                                        <td style={{ textAlign: "center" }}>{val.jumlah}</td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              })}

                              <tr style={{ verticalAlign: "middle", fontWeight: "bold" }}>
                                <td style={{ textAlign: "center" }}>99</td>
                                <td colSpan={user.jenisUserId === 4 ? 2 : 1} style={{ textAlign: "center" }}>
                                  TOTAL
                                </td>
                                <td style={{ textAlign: "center" }}>{grandTotal}</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={(newPage) => fetchRL(newPage)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* TAB VALIDASI */}
            <div className={`tab-pane fade ${activeTabInner === "tab2" ? "show active" : ""}`}>
              <div className={style.validasiCard}>
                <h3 className={style.validasiCardTitle}>Validasi RL 3.9</h3>
                {!isFilterApplied ? (
                  <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                    <strong>Silakan pilih filter terlebih dahulu untuk menampilkan data.</strong>
                  </div>
                ) : dataRL.length === 0 ? (
                  <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                    <strong>Tidak ada data untuk proses validasi</strong>
                  </div>
                ) : idValidasi ? (
                  <div style={{ backgroundColor: "#E9ECEF", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
                    <p style={{ margin: 0 }}>
                      <strong style={{ width: "100px", display: "inline-block" }}>Status</strong>:{" "}
                      {idValidasiSubmited == 1 ? "Perlu Perbaikan" : idValidasiSubmited == 2 ? "Selesai Diperbaiki" : "Disetujui"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong style={{ width: "100px", display: "inline-block" }}>Catatan</strong>: {KeteranganValidasiDb || "-"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong style={{ width: "100px", display: "inline-block" }}>Tanggal</strong>:{" "}
                      {tglValidasi ? new Date(tglValidasi).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                    </p>
                  </div>
                ) : (
                  user.jenisUserId !== 3 && (
                    <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                      <strong>Data Belum di Validasi</strong>
                    </div>
                  )
                )}

                {dataRL.length > 0 && rumahSakit?.id ? (
                  isValidated ? (
                    <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                      <strong>Data telah di validasi</strong>
                    </div>
                  ) : (
                    (user.jenisUserId === 3 || (user.jenisUserId === 4 && idValidasi)) && (
                      <form onSubmit={simpanValidasi}>
                        <div className={style.validasiFormGroup}>
                          <label htmlFor="statusValidasi">Status</label>
                          <select
                            id="statusValidasi"
                            value={statusValidasi}
                            required
                            onChange={(e) => setStatusValidasi(e.target.value)}
                          >
                            {user.jenisUserId === 4 ? (
                              <>
                                <option value="">Pilih Status</option>
                                <option value="2">Selesai Diperbaiki</option>
                              </>
                            ) : (
                              <>
                                <option value="1">Perlu Perbaikan</option>
                                <option value="3">Disetujui</option>
                              </>
                            )}
                          </select>
                        </div>

                        {user.jenisUserId === 3 && (
                          <div className={style.validasiFormGroup}>
                            <label htmlFor="keteranganValidasi">Catatan</label>
                            <textarea
                              id="keteranganValidasi"
                              value={keteranganValidasi}
                              onChange={(e) => setKeteranganValidasi(e.target.value)}
                              placeholder="Tambahkan catatan (opsional)"
                              rows={4}
                            />
                          </div>
                        )}

                        <button type="submit" className={style.btnPrimary}>
                          <HiSaveAs size={20} /> Simpan
                        </button>
                      </form>
                    )
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTwo() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState("01");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const [loadingTable, setLoadingTable] = useState(false);
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [sync, setSync] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const limit = 50;

  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();
  const pollingRef = useRef(null);

  const MANUAL_SYNC_COOLDOWN_SEC = 300; // 5 menit

  useEffect(() => {
    refreshToken();
    getBulan();
    return () => clearInterval(pollingRef.current);
  }, []);

  useEffect(() => {
    if (user?.jenisUserId === 4) {
      showRumahSakit(user.satKerId);
    }
  }, [user.jenisUserId]);

  // Timer real-time per detik untuk memperbarui sisa waktu cooldown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("/apisirs6v2/token", {
        headers: { "XSRF-TOKEN": CSRFToken },
      });
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) navigate("/");
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const response = await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }

      if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET
        ).toString();

        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
        config.headers["XSRF-TOKEN"] = CSRFToken;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRumahSakit(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getBulan = () => {
    setDaftarBulan([
      { key: "Pilih Bulan", value: "" },
      { key: "Januari", value: "01" },
      { key: "Februari", value: "02" },
      { key: "Maret", value: "03" },
      { key: "April", value: "04" },
      { key: "Mei", value: "05" },
      { key: "Juni", value: "06" },
      { key: "Juli", value: "07" },
      { key: "Agustus", value: "08" },
      { key: "September", value: "09" },
      { key: "Oktober", value: "10" },
      { key: "November", value: "11" },
      { key: "Desember", value: "12" },
    ]);
  };

  const fetchData = async (
    pageNumber = 1,
    isBackground = false,
    currentToken = token,
    currentUser = user,
    currentTahun = tahun,
    currentBulan = bulan
  ) => {
    if (!currentToken || !currentUser.satKerId) return;

    if (!isBackground) setLoadingTable(true);

    try {
      const res = await axiosJWT.get("/apisirs6v2/rltigatitiksembilansatusehat", {
        headers: { Authorization: `Bearer ${currentToken}` },
        params: {
          rsId: currentUser.satKerId,
          periode: `${currentTahun}-${currentBulan}`,
          page: pageNumber,
          limit,
        },
      });

      const newSync = res.data.sync ?? {};
      setDataRL(res.data.data ?? []);
      setSync(newSync);
      setTotalPages(res.data.pagination?.totalPages || 0);
      setPage(res.data.pagination?.page || 1);

      if (!newSync.isUpdating) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (err) {
      console.error(err);
      setDataRL([]);
      setSync({});
    } finally {
      if (!isBackground) setLoadingTable(false);
    }
  };

  const startPolling = (currentToken, currentUser, currentTahun, currentBulan) => {
    clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axiosJWT.get("/apisirs6v2/rltigatitiksembilansatusehat", {
          headers: { Authorization: `Bearer ${currentToken}` },
          params: {
            rsId: currentUser.satKerId,
            periode: `${currentTahun}-${currentBulan}`,
            page: 1,
            limit,
          },
        });

        const newSync = res.data.sync ?? {};
        setDataRL(res.data.data ?? []);
        setSync(newSync);
        setTotalPages(res.data.pagination?.totalPages || 0);
        setPage(res.data.pagination?.page || 1);

        if (!newSync.isUpdating) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setLoadingTable(false);
        }
      } catch (err) {
        console.error(err);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setLoadingTable(false);
      }
    }, 4000);
  };

  const getRL = async (e) => {
    e.preventDefault();
    if (!tahun || !bulan) {
      toast("Pilih Bulan & Tahun", { type: "error", position: toast.POSITION.TOP_RIGHT });
      return;
    }

    setFilterLabel([`Rumah Sakit: ${rumahSakit?.nama || "-"}`, `Periode: ${tahun}-${bulan}`]);
    setIsFilterApplied(true);
    setDataRL([]);

    await fetchData(1, false, token, user, tahun, bulan);

    setSync((prevSync) => {
      if (prevSync.isUpdating || prevSync.status === "syncing") {
        setLoadingTable(true);
        startPolling(token, user, tahun, bulan);
      }
      return prevSync;
    });
  };

  const parseLabel = (label) => {
    if (!label || typeof label !== "string") {
      return { isTotal: false, text: "-", isParent: false };
    }

    const cleanLabel = label.trim();

    if (cleanLabel.toUpperCase() === "TOTAL") {
      return { isTotal: true, text: "TOTAL", isParent: false };
    }

    const parts = cleanLabel.split(".");
    if (parts.length === 1) {
      return { isTotal: false, text: parts[0], isParent: true };
    } else {
      return { isTotal: false, text: parts[1], isParent: false };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB";
  };

  // Menghitung sisa detik cooldown berdasarkan lastSync
  const getRemainingSeconds = () => {
    if (!sync?.lastSync) return 0;
    const lastSyncTime = new Date(sync.lastSync).getTime();
    if (isNaN(lastSyncTime)) return 0;

    const elapsedSeconds = Math.floor((now - lastSyncTime) / 1000);
    const remaining = MANUAL_SYNC_COOLDOWN_SEC - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  };

  const remainingSeconds = getRemainingSeconds();

  // Tombol aktif jika tidak sedang update dan (lastSync belum ada ATAU cooldown >= 5 menit)
  const canSync =
    !sync.isUpdating &&
    !isManualSyncing &&
    remainingSeconds === 0;

  const handleManualSync = async () => {
    if (!canSync || !isFilterApplied) return;

    setIsManualSyncing(true);
    setLoadingTable(true);
    setDataRL([]);

    try {
      await axiosJWT.post(
        "/apisirs6v2/rltigatitiksembilansatusehat/sync",
        {
          rsId: user.satKerId,
          periode: `${tahun}-${bulan}`,
          overwrite: true,
          resetData: true
        },
        { headers: { Authorization: `Bearer ${token}`, "XSRF-TOKEN": CSRFToken } }
      );
      
      toast.info("Memulai sinkronisasi baru. Data lama telah direset.", {
        position: toast.POSITION.TOP_RIGHT,
      });

      startPolling(token, user, tahun, bulan);
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan sinkronisasi data SATUSEHAT", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    setIsManualSyncing(false);
  }, [sync]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownloadExcel = async () => {
    if (!isFilterApplied) {
      toast("Terapkan filter terlebih dahulu", { type: "error", position: toast.POSITION.TOP_RIGHT });
      return;
    }

    setIsDownloading(true);

    try {
      const MAX_LIMIT = 200;
      const firstRes = await axiosJWT.get("/apisirs6v2/rltigatitiksembilansatusehat", {
        headers: { Authorization: `Bearer ${token}` },
        params: { rsId: user.satKerId, periode: `${tahun}-${bulan}`, page: 1, limit: MAX_LIMIT },
      });

      const tp = firstRes.data.pagination?.totalPages || 1;
      let allData = [...(firstRes.data.data ?? [])];

      if (tp > 1) {
        const remainingPages = Array.from({ length: tp - 1 }, (_, i) => i + 2);
        const results = await Promise.all(
          remainingPages.map((p) =>
            axiosJWT.get("/apisirs6v2/rltigatitiksembilansatusehat", {
              headers: { Authorization: `Bearer ${token}` },
              params: { rsId: user.satKerId, periode: `${tahun}-${bulan}`, page: p, limit: MAX_LIMIT },
            })
          )
        );
        results.forEach((r) => allData.push(...(r.data.data ?? [])));
      }

      let parentIndex = 0;
      let childIndex = 0;

      const namaBulanSelected = daftarBulan.find((b) => b.value === bulan)?.key || bulan;
      const namaRS = rumahSakit?.nama || "-";

      let rowsHTML = "";

      allData.forEach((v) => {
        const rawLabel = v.nama_jenis_kegiatan || v.jenis_kegiatan || v.label || "";
        const { isTotal, text, isParent } = parseLabel(rawLabel);

        let noUrut = "";
        let rsValue = namaRS;
        let isBoldRow = false;

        if (isTotal) {
          noUrut = "99";
          rsValue = "";
          isBoldRow = true;
        } else if (isParent) {
          parentIndex += 1;
          childIndex = 0;
          noUrut = `${parentIndex}`;
          isBoldRow = true;
        } else {
          childIndex += 1;
          noUrut = `${parentIndex}.${childIndex}`;
        }

        const fontStyle = isBoldRow ? "font-weight: bold;" : "";

        rowsHTML += `
          <tr style="${fontStyle}">
            <td style="border: 1px solid #000; text-align: center;">${noUrut}</td>
            <td style="border: 1px solid #000; text-align: left;">${rsValue}</td>
            <td style="border: 1px solid #000; text-align: left;">${text}</td>
            <td style="border: 1px solid #000; text-align: right;">${v.jumlah || 0}</td>
          </tr>
        `;
      });

      const excelHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>RL 3.9 SATUSEHAT</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            <tr><td colspan="4" style="font-weight: bold;">SIRS ONLINE RL 3.9 - SATUSEHAT</td></tr>
            <tr></tr>
            <tr><td colspan="4" style="font-weight: bold;">Periode Data</td></tr>
            <tr><td colspan="4">Bulan : ${namaBulanSelected}</td></tr>
            <tr><td colspan="4">Tahun: ${tahun}</td></tr>
            <tr></tr>
            <thead>
              <tr style="font-weight: bold; background-color: #f2f2f2;">
                <td style="border: 1px solid #000; text-align: center; width: 60px;">No</td>
                <td style="border: 1px solid #000; text-align: left; width: 220px;">Rumah Sakit</td>
                <td style="border: 1px solid #000; text-align: left; width: 350px;">Jenis Kegiatan</td>
                <td style="border: 1px solid #000; text-align: right; width: 100px;">Jumlah</td>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelHTML], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RL3.9_SATUSEHAT_${rumahSakit?.id || ""}_${tahun}-${bulan}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast("Download berhasil!", { type: "success", position: toast.POSITION.TOP_RIGHT });
    } catch (err) {
      console.error(err);
      toast("Gagal download Excel", { type: "error", position: toast.POSITION.TOP_RIGHT });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "0px", marginBottom: "70px" }}>
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          {/* PANEL FILTERS & ACTION */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 14,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", margin: "0 0 14px 0" }}>
              Periode Data
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Bulan</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 7, padding: "7px 10px", background: "#f8fafc" }}>
                  <FaCalendarAlt size={13} color="#94a3b8" style={{ marginRight: 7 }} />
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 13 }}
                  >
                    {daftarBulan.map((b) => (
                      <option key={b.value} value={b.value}>{b.key}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Tahun</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 7, padding: "7px 10px", background: "#f8fafc", width: 125 }}>
                  <FaCalendarAlt size={13} color="#94a3b8" style={{ marginRight: 7 }} />
                  <input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={getRL}
                  style={{
                    background: "#1d4ed8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <FaFilter size={14} /> FILTER
                </button>

                <button
                  onClick={handleManualSync}
                  disabled={!canSync || isManualSyncing || !isFilterApplied}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    cursor: canSync && !isManualSyncing && isFilterApplied ? "pointer" : "not-allowed",
                    opacity: canSync && !isManualSyncing && isFilterApplied ? 1 : 0.55,
                  }}
                >
                  {isManualSyncing || sync.isUpdating ? (
                    <>
                      <Spinner animation="border" size="sm" /> Syncing...
                    </>
                  ) : remainingSeconds > 0 ? (
                    <>
                      <FaSyncAlt size={14} /> SYNC ({formatCountdown(remainingSeconds)})
                    </>
                  ) : (
                    <>
                      <FaSyncAlt size={14} /> SYNC SATUSEHAT
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadExcel}
                  disabled={!isFilterApplied || isDownloading || dataRL.length === 0}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isFilterApplied && !isDownloading && dataRL.length > 0 ? "pointer" : "not-allowed",
                    opacity: isFilterApplied && !isDownloading && dataRL.length > 0 ? 1 : 0.55,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {isDownloading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Mengunduh...
                    </>
                  ) : (
                    <>
                      <SiMicrosoftexcel size={15} /> DOWNLOAD EXCEL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* INFORMASI DASHBOARD */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", border: "1.5px solid #3b82f6", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
                <FaInfoCircle size={14} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: 13, color: "#2563eb" }}>KETERANGAN TOMBOL</span>
              </div>
              {[
                {
                  icon: <FaFilter size={11} />,
                  bg: "#1d4ed8",
                  label: "FILTER",
                  desc: "Menampilkan data dari database SIRS Online",
                },
                {
                  icon: <FaSyncAlt size={11} />,
                  bg: "#059669",
                  label: "SYNC SATUSEHAT",
                  desc: "Mengambil data terbaru dari SATUSEHAT",
                },
                {
                  icon: <SiMicrosoftexcel size={15} />,
                  bg: "#059669",
                  label: "DOWNLOAD EXCEL",
                  desc: "Mengunduh data hasil filter",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    marginBottom: 9,
                  }}
                >
                  <div
                    style={{
                      background: item.bg,
                      borderRadius: 5,
                      width: 26,
                      height: 26,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#475569", lineHeight: 1.45 }}
                  >
                    <strong style={{ fontWeight: 700 }}>{item.label}</strong>
                    {" : "}
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: "1 1 210px", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <FaSyncAlt size={15} color="#059669" />
                <span style={{ fontWeight: 700, fontSize: 13, color: "#059669" }}>STATUS SINKRONISASI</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 11 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaCalendarAlt size={13} color="#64748b" />
                  </div>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    Terakhir Sync&nbsp;:&nbsp;
                    <strong>
                      {sync.lastSync ? formatDate(sync.lastSync) : "-"}
                    </strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{ fontSize: 15, lineHeight: 1, color: "#64748b" }}
                    >
                      ⏱
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    Interval Sync&nbsp;:&nbsp;
                    <strong>5 Menit</strong>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ flex: "1 1 180px", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <FaDatabase size={14} color="#3b82f6" />
                <span style={{ fontWeight: 700, fontSize: 13, color: "#3b82f6" }}>SUMBER DATA</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    margin: 0,
                    flex: 1,
                    lineHeight: 1.6,
                  }}
                >
                  Data yang ditampilkan bersumber dari{" "}
                  <strong>SATUSEHAT</strong> yang sudah tersimpan dalam database{" "}
                  <strong>SIRS</strong>.
                </p>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <FaDatabase size={38} color="#bfdbfe" />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -3,
                      right: -6,
                      background: "#059669",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={style.filterLabel}>
            {filterLabel.length > 0 && <h5 style={{ fontSize: "14px" }}>Filtered By {filterLabel.join(", ")}</h5>}
          </div>

          {/* TABEL DATA SINKRONISASI SATUSEHAT */}
          {!isFilterApplied ? (
            <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: 15, borderRadius: 8, textAlign: "center" }}>
              <strong>Silakan pilih filter terlebih dahulu.</strong>
            </div>
          ) : loadingTable ? (
            <div style={{ textAlign: "center", padding: "60px 0", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <Spinner animation="border" variant="primary" />
              <p style={{ marginTop: 12, color: "#64748b", fontWeight: 500 }}>Menyinkronkan & mengambil data dari SATUSEHAT...</p>
            </div>
          ) : !sync?.lastSync ? (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                color: "#856404",
                padding: 20,
                borderRadius: 8,
                textAlign: "center",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              <strong>
                Data belum disinkronkan dengan SATUSEHAT untuk periode ini. Silakan lakukan sinkronisasi terlebih dahulu.
              </strong>
            </div>
          ) : dataRL.length === 0 ? (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                color: "#856404",
                padding: 20,
                borderRadius: 8,
                textAlign: "center",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              <strong>
                Data tidak ditemukan di SATUSEHAT untuk periode ini.
              </strong>
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className={style["table"]} style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead className={style["thead"]}>
                    <tr>
                      <th style={{ padding: "12px 16px", width: "8%", textAlign: "center" }}>No.</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Jenis Kegiatan</th>
                      <th style={{ padding: "12px 16px", width: "18%", textAlign: "center" }}>Jumlah Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let parentIndex = 0;
                      let childIndex = 0;

                      const totalJumlah = dataRL
                        .filter((item) => {
                          const labelData = item.nama_jenis_kegiatan || item.jenis_kegiatan || item.label || "";
                          return !labelData.includes(".");
                        })
                        .reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);

                      const sortedDataRL = [...dataRL].sort((a, b) => {
                        const labelA = a.nama_jenis_kegiatan || a.jenis_kegiatan || a.label || "";
                        const labelB = b.nama_jenis_kegiatan || b.jenis_kegiatan || b.label || "";

                        const parentA = labelA.split(".")[0];
                        const parentB = labelB.split(".")[0];

                        if (parentA !== parentB) {
                          return parentA.localeCompare(parentB);
                        }

                        if (!labelA.includes(".")) return -1;
                        if (!labelB.includes(".")) return 1;

                        return 0;
                      });

                      return (
                        <>
                          {sortedDataRL.map((item, idx) => {
                            const labelData = item.nama_jenis_kegiatan || item.jenis_kegiatan || item.label;
                            const { isTotal, text, isParent } = parseLabel(labelData);

                            if (isTotal) {
                              return (
                                <tr
                                  key="total"
                                  style={{
                                    fontWeight: "bold",
                                  }}
                                >
                                  <td style={{ padding: "12px 16px", textAlign: "center" }}>99</td>
                                  <td style={{ padding: "12px 16px", letterSpacing: "0.5px" }}>TOTAL</td>
                                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                    <span
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                      }}
                                    >
                                      {item.jumlah}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }

                            let noUrut = "";
                            if (isParent) {
                              parentIndex += 1;
                              childIndex = 0;
                              noUrut = `${parentIndex}`;
                            } else {
                              childIndex += 1;
                              noUrut = `${parentIndex}.${childIndex}`;
                            }

                            return (
                              <tr
                                key={item.id || labelData}
                                style={{
                                  fontWeight: isParent ? "700" : "400",
                                  borderBottom: "1px solid #e2e8f0",
                                  transition: "background 0.2s ease",
                                }}
                              >
                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                  {noUrut}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 16px",
                                    paddingLeft: isParent ? "16px" : "36px",
                                  }}
                                >
                                  {text}
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                  <span
                                    style={{
                                      padding: "3px 10px",
                                      borderRadius: "12px",
                                      display: "inline-block",
                                      minWidth: "45px",
                                    }}
                                  >
                                    {item.jumlah}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {!dataRL.some((i) => (i.nama_jenis_kegiatan || i.jenis_kegiatan || i.label || "").toUpperCase() === "TOTAL") && (
                            <tr
                              style={{
                                fontWeight: "bold",
                                backgroundColor: "#f1f5f9",
                                borderTop: "2px solid #cbd5e1",
                                color: "#0f172a",
                              }}
                            >
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>99</td>
                              <td style={{ padding: "12px 16px", letterSpacing: "0.5px" }}>TOTAL</td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {totalJumlah}
                                </span>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(newPage) => fetchData(newPage)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}