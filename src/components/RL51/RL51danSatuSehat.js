import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";

import style from "./FormTambahRL51.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { getStatusSatset } from "../../api/status_satset.js";
import { getDataSatusehat } from "../../api/rlLimasatuSatusehat.js";
import { FaSlidersH, FaDownload, FaSync } from "react-icons/fa";

export default function TabMenu() {
  const [activeTab, setActiveTab] = useState("tab1");
  const { CSRFToken } = useCSRFTokenContext();
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [statusSatset, setStatusSatset] = useState(0);

  useEffect(() => {
    refreshToken();
  }, []);

  // kalau token berhasil di-set, baru load status satset
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
      //   showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  // LOAD STATUS SATSET
  const loadStatusSatset = async () => {
    const status = await getStatusSatset(token);
    setStatusSatset(status);
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <div className="row">
        <div className="col-md-12">
          <h4 className="text-secondary">
            <span>🏥</span>
            RL 5.1 - Morbiditas Pasien Rawat Jalan
          </h4>

          {/* TAB HEADER */}
          <ul className="nav nav-tabs border-bottom mb-0">
            {/* TAB SIRS */}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                <span>📄</span>
                SIRS
              </button>
            </li>

            {/* TAB SATUSEHAT */}
            {user.jenisUserId === 4 && statusSatset === 1 && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "tab2" ? "active" : ""}`}
                  onClick={() => setActiveTab("tab2")}
                >
                  <span>🌐</span>
                  SATUSEHAT
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* TAB CONTENT SECTION */}
      <div className="tab-content mt-0">
        {/* TAB SIRS */}
        <div
          className={`tab-pane fade ${
            activeTab === "tab1" ? "show active" : ""
          }`}
        >
          <div className="border rounded-bottom p-4 shadow-sm bg-white">
            <TabOne />
          </div>
        </div>

        {/* TAB SATUSEHAT */}
        <div
          className={`tab-pane fade ${
            activeTab === "tab2" ? "show active" : ""
          }`}
        >
          <div className="border rounded-bottom p-4 shadow-sm bg-white">
            <TabTwo />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabOne() {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("2025");
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

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
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Febuari",
      value: "2",
    });
    results.push({
      key: "Maret",
      value: "3",
    });
    results.push({
      key: "April",
      value: "4",
    });
    results.push({
      key: "Mei",
      value: "5",
    });
    results.push({
      key: "Juni",
      value: "6",
    });
    results.push({
      key: "Juli",
      value: "7",
    });
    results.push({
      key: "Agustus",
      value: "8",
    });
    results.push({
      key: "September",
      value: "9",
    });
    results.push({
      key: "Oktober",
      value: "10",
    });
    results.push({
      key: "November",
      value: "11",
    });
    results.push({
      key: "Desember",
      value: "12",
    });

    setDaftarBulan([...results]);
  };

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    getRumahSakit(kabKotaId);
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          kabKotaId: kabKotaId,
        },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getRL = async (e) => {
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(bulan),
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rllimatitiksatu",
        customConfig
      );

      const rlLimaTitikSatuDetails = results.data.data.map((value) => {
        return value;
      });

      setNamaFile(
        "RL51_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setDataRL(rlLimaTitikSatuDetails);
      setRumahSakit(null);
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRL = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(`/apisirs6v2/rllimatitiksatu/${id}`, customConfig);
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setDataRL((current) => current.filter((value) => value.id !== id));
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const deleteConfirmation = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            deleteRL(id);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan(1);
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      default:
    }
  };

  const getProvinsi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/provinsi", customConfig);

      const daftarProvinsi = results.data.data.map((value) => {
        return value;
      });

      setDaftarProvinsi(daftarProvinsi);
    } catch (error) {
      console.log(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          provinsiId: provinsiId,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);

      const daftarKabKota = results.data.data.map((value) => {
        return value;
      });

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getRL}>
          <Modal.Body>
            {user.jenisUserId === 1 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="provinsi"
                    id="provinsi"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => provinsiChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarProvinsi.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => kabKotaChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 2 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => kabKotaChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 3 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                onChange={bulanChangeHandler}
              >
                {daftarBulan.map((bulan) => {
                  return (
                    <option
                      key={bulan.value}
                      name={bulan.key}
                      value={bulan.value}
                    >
                      {bulan.key}
                    </option>
                  );
                })}
              </select>
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => tahunChangeHandler(e)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <>
                <Link
                  className="btn"
                  to={`/rl51/tambah/`}
                  style={{
                    marginRight: "5px",
                    fontSize: "18px",
                    backgroundColor: "#779D9E",
                    color: "#FFFFFF",
                  }}
                >
                  +
                </Link>
              </>
            ) : (
              <></>
            )}

            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleShow}
            >
              <FaSlidersH />
              Filter
            </button>

            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 51"
              currentTableRef={tableRef.current}
            >
              {/* <button> Export excel </button> */}
              <button
                className="btn"
                style={{
                  fontSize: "18px",
                  marginLeft: "5px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {" "}
                <FaDownload />
                Download
              </button>
            </DownloadTableExcel>
          </div>

          <div>
            <h5 style={{ fontSize: "14px" }}>
              {filterLabel.length > 0 ? (
                <>
                  filtered by{" "}
                  {filterLabel
                    .map((value) => {
                      return value;
                    })
                    .join(", ")}
                </>
              ) : (
                <></>
              )}
            </h5>
          </div>
          <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
            <Table
              className={style.table}
              striped
              bordered
              responsive
              style={{ width: "500%" }}
              ref={tableRef}
            >
              <thead className={style.thead}>
                <tr className="main-header-row">
                  <th
                    className={style["sticky-header-view"]}
                    rowSpan="3"
                    style={{ width: "1%" }}
                  >
                    No.
                  </th>
                  <th
                    className={style["sticky-header-view"]}
                    rowSpan="3"
                    style={{ width: "2%" }}
                  >
                    Aksi
                  </th>
                  <th
                    className={style["sticky-header-view"]}
                    rowSpan="3"
                    style={{ width: "2%" }}
                  >
                    Kode ICD 10
                  </th>
                  <th
                    className={style["sticky-header-view"]}
                    rowSpan="3"
                    style={{ width: "5%" }}
                  >
                    Diagnosis Penyakit
                  </th>
                  <th colSpan="50" style={{ width: "70%" }}>
                    Jumlah Kasus Baru Menurut Kelompok Umur & Jenis Kelamin
                  </th>
                  <th colSpan="3" style={{ width: "5%" }}>
                    Jumlah Kasus Baru Menurut Jenis Kelamin
                  </th>
                  <th colSpan="3" style={{ width: "5%" }}>
                    Jumlah Kunjungan
                  </th>
                </tr>
                <tr>
                  <th colSpan="2">&lt;1Jam</th>
                  <th colSpan="2">1 - 23 Jam</th>
                  <th colSpan="2">1 - 7 Hr</th>
                  <th colSpan="2">8 - 28 Hr</th>
                  <th colSpan="2">29 hr - &lt; 3 bln</th>
                  <th colSpan="2">3 - &lt; 6 bln</th>
                  <th colSpan="2">6 - 11 bln</th>
                  <th colSpan="2">1 - 4 th</th>
                  <th colSpan="2">5 - 9 th</th>
                  <th colSpan="2">10 - 14 th</th>
                  <th colSpan="2">15 - 19 th</th>
                  <th colSpan="2">20 - 24 th</th>
                  <th colSpan="2">25 - 29 th</th>
                  <th colSpan="2">30 - 34 th</th>
                  <th colSpan="2">35 - 39 th</th>
                  <th colSpan="2">40 - 44 th</th>
                  <th colSpan="2">45 - 49 th</th>
                  <th colSpan="2">50 - 54 th</th>
                  <th colSpan="2">55 - 59 th</th>
                  <th colSpan="2">60 - 64 th</th>
                  <th colSpan="2">65 - 69 th</th>
                  <th colSpan="2">70 - 74 th</th>
                  <th colSpan="2">75 - 79 th</th>
                  <th colSpan="2">80 - 84 th</th>
                  <th colSpan="2">&gt; 85 th</th>
                  <th rowSpan="2">L</th>
                  <th rowSpan="2">P</th>
                  <th rowSpan="2">Total</th>
                  <th rowSpan="2">L</th>
                  <th rowSpan="2">P</th>
                  <th rowSpan="2">Total</th>
                </tr>
                <tr>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                  <th>L</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  return (
                    <tr key={value.id}>
                      <td
                        className={style["sticky-column-view"]}
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="id"
                        className="form-control"
                        value={index + 1}
                        disabled={true}
                        style={{ textAlign: "center" }}
                      /> */}
                        <p>{index + 1}</p>
                      </td>
                      <td className={style["sticky-column-view"]}>
                        <ToastContainer />
                        {/* <RiDeleteBin5Fill  size={20} onClick={(e) => hapus(value.id)} style={{color: "gray", cursor: "pointer", marginRight: "5px"}} /> */}
                        {user.jenisUserId === 4 ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              className="btn btn-danger"
                              style={{
                                margin: "0 5px 0 0",
                                backgroundColor: "#FF6663",
                                border: "1px solid #FF6663",
                              }}
                              type="button"
                              onClick={(e) => deleteConfirmation(value.id)}
                            >
                              Hapus
                            </button>
                            <Link
                              to={`/rl51/edit/${value.id}`}
                              className="btn btn-warning"
                              style={{
                                margin: "0 5px 0 0",
                                backgroundColor: "#CFD35E",
                                border: "1px solid #CFD35E",
                                color: "#FFFFFF",
                              }}
                            >
                              Ubah
                            </Link>
                          </div>
                        ) : (
                          <></>
                        )}
                      </td>
                      <td
                        className={style["sticky-column-view"]}
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="codeICD"
                        className="form-control"
                        value={value.icd.icd_code}
                        disabled={true}
                      /> */}
                        <p>{value.icd.icd_code}</p>
                      </td>
                      <td
                        className={style["sticky-column-view"]}
                        style={{ textAlign: "left", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="diagnosisPenyakit"
                        className="form-control"
                        value={value.icd.description_code}
                        disabled={true}
                      /> */}
                        <p>{value.icd.description_code}</p>
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="jumlah_L_dibawah_1_jam"
                        className="form-control"
                        value={value.jumlah_L_dibawah_1_jam}
                        disabled={true}
                      /> */}
                        <p>{value.jumlah_L_dibawah_1_jam}</p>
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="jumlah_P_dibawah_1_jam"
                        className="form-control"
                        value={value.jumlah_P_dibawah_1_jam}
                        disabled={true}
                      /> */}
                        <p>{value.jumlah_P_dibawah_1_jam}</p>
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_23_jam"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_23_jam}
                        disabled={true}
                      /> */}
                        <p>{value.jumlah_L_1_sampai_23_jam}</p>
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_23_jam"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_23_jam}
                        disabled={true}
                      /> */}
                        <p>{value.jumlah_P_1_sampai_23_jam}</p>
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_7_hari"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_7_hari}
                        disabled={true}
                      /> */}
                        <p>{value.jumlah_L_1_sampai_7_hari}</p>
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_1_sampai_7_hari}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_7_hari"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_7_hari}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_8_sampai_28_hari}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_8_sampai_28_hari"
                        className="form-control"
                        value={value.jumlah_L_8_sampai_28_hari}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_8_sampai_28_hari}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_8_sampai_28_hari"
                        className="form-control"
                        value={value.jumlah_P_8_sampai_28_hari}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_29_hari_sampai_dibawah_3_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={value.jumlah_L_29_hari_sampai_dibawah_3_bulan}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_29_hari_sampai_dibawah_3_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={value.jumlah_P_29_hari_sampai_dibawah_3_bulan}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_3_bulan_sampai_dibawah_6_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={value.jumlah_L_3_bulan_sampai_dibawah_6_bulan}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_3_bulan_sampai_dibawah_6_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={value.jumlah_P_3_bulan_sampai_dibawah_6_bulan}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_6_bulan_sampai_11_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={value.jumlah_L_6_bulan_sampai_11_bulan}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_6_bulan_sampai_11_bulan}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={value.jumlah_P_6_bulan_sampai_11_bulan}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_1_sampai_4_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_4_tahun"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_4_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_1_sampai_4_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_4_tahun"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_4_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_5_sampai_9_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_5_sampai_9_tahun"
                        className="form-control"
                        value={value.jumlah_L_5_sampai_9_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_5_sampai_9_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_5_sampai_9_tahun"
                        className="form-control"
                        value={value.jumlah_P_5_sampai_9_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_10_sampai_14_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_10_sampai_14_tahun"
                        className="form-control"
                        value={value.jumlah_L_10_sampai_14_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_10_sampai_14_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_10_sampai_14_tahun"
                        className="form-control"
                        value={value.jumlah_P_10_sampai_14_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_15_sampai_19_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_15_sampai_19_tahun"
                        className="form-control"
                        value={value.jumlah_L_15_sampai_19_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_15_sampai_19_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_15_sampai_19_tahun"
                        className="form-control"
                        value={value.jumlah_P_15_sampai_19_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_20_sampai_24_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_20_sampai_24_tahun"
                        className="form-control"
                        value={value.jumlah_L_20_sampai_24_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_20_sampai_24_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_20_sampai_24_tahun"
                        className="form-control"
                        value={value.jumlah_P_20_sampai_24_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_25_sampai_29_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_25_sampai_29_tahun"
                        className="form-control"
                        value={value.jumlah_L_25_sampai_29_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_25_sampai_29_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_25_sampai_29_tahun"
                        className="form-control"
                        value={value.jumlah_P_25_sampai_29_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_30_sampai_34_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_30_sampai_34_tahun"
                        className="form-control"
                        value={value.jumlah_L_30_sampai_34_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_30_sampai_34_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_30_sampai_34_tahun"
                        className="form-control"
                        value={value.jumlah_P_30_sampai_34_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_35_sampai_39_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_35_sampai_39_tahun"
                        className="form-control"
                        value={value.jumlah_L_35_sampai_39_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_35_sampai_39_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_35_sampai_39_tahun"
                        className="form-control"
                        value={value.jumlah_P_35_sampai_39_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_40_sampai_44_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_40_sampai_44_tahun"
                        className="form-control"
                        value={value.jumlah_L_40_sampai_44_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_40_sampai_44_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_40_sampai_44_tahun"
                        className="form-control"
                        value={value.jumlah_P_40_sampai_44_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_45_sampai_49_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_45_sampai_49_tahun"
                        className="form-control"
                        value={value.jumlah_L_45_sampai_49_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_45_sampai_49_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_45_sampai_49_tahun"
                        className="form-control"
                        value={value.jumlah_P_45_sampai_49_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_50_sampai_54_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_50_sampai_54_tahun"
                        className="form-control"
                        value={value.jumlah_L_50_sampai_54_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_50_sampai_54_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_50_sampai_54_tahun"
                        className="form-control"
                        value={value.jumlah_P_50_sampai_54_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_55_sampai_59_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_55_sampai_59_tahun"
                        className="form-control"
                        value={value.jumlah_L_55_sampai_59_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_55_sampai_59_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_55_sampai_59_tahun"
                        className="form-control"
                        value={value.jumlah_P_55_sampai_59_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_60_sampai_64_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_60_sampai_64_tahun"
                        className="form-control"
                        value={value.jumlah_L_60_sampai_64_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_60_sampai_64_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_60_sampai_64_tahun"
                        className="form-control"
                        value={value.jumlah_P_60_sampai_64_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_65_sampai_69_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_65_sampai_69_tahun"
                        className="form-control"
                        value={value.jumlah_L_65_sampai_69_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_65_sampai_69_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_65_sampai_69_tahun"
                        className="form-control"
                        value={value.jumlah_P_65_sampai_69_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_70_sampai_74_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_70_sampai_74_tahun"
                        className="form-control"
                        value={value.jumlah_L_70_sampai_74_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_70_sampai_74_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_70_sampai_74_tahun"
                        className="form-control"
                        value={value.jumlah_P_70_sampai_74_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_75_sampai_79_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_75_sampai_79_tahun"
                        className="form-control"
                        value={value.jumlah_L_75_sampai_79_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_75_sampai_79_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_75_sampai_79_tahun"
                        className="form-control"
                        value={value.jumlah_P_75_sampai_79_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_80_sampai_84_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_80_sampai_84_tahun"
                        className="form-control"
                        value={value.jumlah_L_80_sampai_84_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_80_sampai_84_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_80_sampai_84_tahun"
                        className="form-control"
                        value={value.jumlah_P_80_sampai_84_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_L_diatas_85_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_L_diatas_85_tahun"
                        className="form-control"
                        value={value.jumlah_L_diatas_85_tahun}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_P_diatas_85_tahun}</p>
                        {/* <input
                        type="text"
                        name="jumlah_P_diatas_85_tahun"
                        className="form-control"
                        value={value.jumlah_P_diatas_85_tahun}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_kasus_baru_L}</p>
                        {/* <input
                        type="text"
                        name="jumlah_kasus_baru_L"
                        className="form-control"
                        value={value.jumlah_kasus_baru_L}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_kasus_baru_P}</p>
                        {/* <input
                        type="text"
                        name="jumlah_kasus_baru_P"
                        className="form-control"
                        value={value.jumlah_kasus_baru_P}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.total_kasus_baru}</p>
                        {/* <input
                        type="text"
                        name="total_kasus_baru"
                        className="form-control"
                        value={value.total_kasus_baru}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_kunjungan_L}</p>
                        {/* <input
                        type="text"
                        name="jumlah_kunjungan_L"
                        className="form-control"
                        value={value.jumlah_kunjungan_L}
                        disabled={true}
                      /> */}
                      </td>

                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.jumlah_kunjungan_P}</p>
                        {/* <input
                        type="text"
                        name="jumlah_kunjungan_P"
                        className="form-control"
                        value={value.jumlah_kunjungan_P}
                        disabled={true}
                      /> */}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <p>{value.total_jumlah_kunjungan}</p>
                        {/* <input
                        type="text"
                        name="total_jumlah_kunjungan"
                        className="form-control"
                        value={value.total_jumlah_kunjungan}
                        disabled={true}
                      /> */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTwo() {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState("2025");
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const { CSRFToken } = useCSRFTokenContext();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); // default limit, bisa kamu sesuaikan
  const [totalPages, setTotalPages] = useState(1);
  const [initialDataLoaded, setInitialDataLoaded] = React.useState(false);
  const [masterUmur, setMasterUmur] = React.useState([]);
  const [sudahFilter, setSudahFilter] = useState(false);

  useEffect(() => {
    refreshToken();
    getBulan();
    getMasterUmur();
  }, []);

  useEffect(() => {
    setInitialDataLoaded(false);
  }, [bulan, tahun, rumahSakit]);

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
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "01",
    });
    results.push({
      key: "Febuari",
      value: "02",
    });
    results.push({
      key: "Maret",
      value: "03",
    });
    results.push({
      key: "April",
      value: "04",
    });
    results.push({
      key: "Mei",
      value: "05",
    });
    results.push({
      key: "Juni",
      value: "06",
    });
    results.push({
      key: "Juli",
      value: "07",
    });
    results.push({
      key: "Agustus",
      value: "08",
    });
    results.push({
      key: "September",
      value: "09",
    });
    results.push({
      key: "Oktober",
      value: "10",
    });
    results.push({
      key: "November",
      value: "11",
    });
    results.push({
      key: "Desember",
      value: "12",
    });

    setDaftarBulan([...results]);
  };

  const bulanChangeHandler = (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    getRumahSakit(kabKotaId);
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          kabKotaId: kabKotaId,
        },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getInitialData = async () => {
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
    const results = await axiosJWT.get(
      "/apisirs6v2/rllimatitiksatusatusehat",
      customConfig
    );
    // proses results jika perlu

    setInitialDataLoaded(true);
  };

  const getPageData = async (requestedPage = 1, requestedLimit = limit) => {
    setDataRL([]); // 🔥 reset dulu

    const config2 = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        rsId: rumahSakit.id,
        periode: `${tahun}-${bulan}`,
        page: requestedPage,
        limit: requestedLimit,
      },
    };

    const responseShow = await axiosJWT.get(
      "/apisirs6v2/rllimatitiksatusatusehatpage",
      config2
    );

    const rawData = responseShow.data.data;
    const { pages } = responseShow.data.pagination || {};

    // Transformasi data supaya group per ICD 10
    const mapICD = new Map();

    rawData.forEach((item) => {
      const icd = item.icd_10;
      if (!mapICD.has(icd)) {
        mapICD.set(icd, {
          icd_10: icd,
          diagnosis: item.diagnosis,
          total_kunjungan: {
            male: 0,
            female: 0,
            total: 0,
          },
          umur: [],
        });
      }

      const current = mapICD.get(icd);

      current.total_kunjungan.male += item.male_visits;
      current.total_kunjungan.female += item.female_visits;
      current.total_kunjungan.total += item.total_visits;

      current.umur.push({
        age_group: item.age_groups_satusehat?.name || "-",
        kunjungan_baru: {
          male: item.male_new_cases,
          female: item.females_new_cases,
          total: item.total_new_cases,
        },
      });
    });

    const groupedData = Array.from(mapICD.values());
    const finalData = transformDataWithMasterUmur(groupedData, masterUmur);
    setDataRL(finalData);
    setPage(requestedPage);
    setTotalPages(pages || 1);
  };

  const getRL = async (e, requestedPage = 1, requestedLimit = limit) => {
    if (e) e.preventDefault();

    if (!rumahSakit) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    handleClose();

    setLoading(true);
    try {
      if (!initialDataLoaded) {
        await getInitialData(); // hanya dipanggil sekali
      }
      await getPageData(requestedPage, requestedLimit); // dipanggil setiap kali request page
    } catch (error) {
      const detailMessage =
        error.response?.data?.detail || error.message || "Terjadi kesalahan";
      toast.error(detailMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDataRL = async (e, requestedPage = 1, requestedLimit = limit) => {
    if (e) e.preventDefault();

    if (!rumahSakit) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    handleClose();

    setLoading(true);
    try {
      //   if (!initialDataLoaded) {
      //     // await getInitialData(); // hanya dipanggil sekali
      //   }
      await getPageData(requestedPage, requestedLimit); // dipanggil setiap kali request page
    } catch (error) {
      const detailMessage =
        error.response?.data?.detail || error.message || "Terjadi kesalahan";
      toast.error(detailMessage);
    } finally {
      setLoading(false);
      setSudahFilter(true);
    }
  };

  const tarikDataSatusehat = async () => {
    try {
      setLoading(true);
      const response = await getDataSatusehat(
        axiosJWT,
        token,
        rumahSakit.id,
        tahun,
        bulan
      );

      if (response.status) {
        toast.success(response.message);
        getDataRL();
      } else {
        toast.error("Status SatuSehat : " + response.message);
      }
    } catch (err) {
      toast.error("Gagal menarik data Satusehat.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = (newPage) => {
    getRL(null, newPage, limit);
  };

  const getMasterUmur = async () => {
    try {
      const config2 = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await axiosJWT.get(
        "/apisirs6v2/getMasterumursatusehat",
        config2
      );

      setMasterUmur(res.data.data); // asumsi master umur di res.data.data
    } catch (error) {
      console.error("Gagal load master umur", error);
    }
  };

  const transformDataWithMasterUmur = (groupedData, masterUmur) => {
    return groupedData.map((item) => {
      // buat objek umur lengkap dengan default 0
      const umurMap = {};
      masterUmur.forEach((umur) => {
        umurMap[umur.name] = 0; // default 0 kunjungan total
      });

      // isi data umur dari item.umur
      item.umur.forEach((u) => {
        const ageName = u.age_group || "-";
        umurMap[ageName] = u.kunjungan_baru.total ?? 0;
      });

      return {
        ...item,
        umurMap, // ini yang akan dipakai di render
      };
    });
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan(1);
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      default:
    }
  };

  const getProvinsi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/provinsi", customConfig);

      const daftarProvinsi = results.data.data.map((value) => {
        return value;
      });

      setDaftarProvinsi(daftarProvinsi);
    } catch (error) {
      console.log(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          provinsiId: provinsiId,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);

      const daftarKabKota = results.data.data.map((value) => {
        return value;
      });

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  const LoadingTable = ({ data, loading }) => {
    let no = 0;
    return (
      <>
        <div className="table-container mt-2 mb-1 pb-2">
          {loading && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                flexDirection: "column",
              }}
            >
              <div className="spinner" />
              <div
                style={{
                  marginTop: 10,
                  fontWeight: "bold",
                  color: "#007bff",
                }}
              >
                Mohon Tunggu...
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <Table
              className={style.table}
              striped
              bordered
              responsive
              style={{
                filter: loading ? "blur(2px)" : "none",
                width: "500%",
                minWidth: 900,
              }}
              ref={tableRef}
            >
              <thead>
                <tr>
                  <th
                    rowSpan={3}
                    style={{ verticalAlign: "middle", textAlign: "center" }}
                  >
                    No.
                  </th>
                  <th
                    rowSpan={3}
                    style={{ verticalAlign: "middle", textAlign: "center" }}
                  >
                    ICD 10
                  </th>
                  <th
                    rowSpan={3}
                    style={{
                      verticalAlign: "middle",
                      textAlign: "left",
                      width: "300px",
                    }}
                  >
                    Diagnosis
                  </th>
                  <th
                    colSpan={masterUmur.length * 3}
                    style={{ textAlign: "center" }}
                  >
                    Kunjungan Kasus Baru per Umur
                  </th>

                  <th colSpan={3} rowSpan={2} style={{ textAlign: "center" }}>
                    Total Kunjungan
                  </th>
                </tr>
                <tr>
                  {masterUmur.map((umur) => (
                    <th
                      key={umur.name}
                      colSpan={3}
                      style={{ textAlign: "center" }}
                    >
                      {umur.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {masterUmur.map((umur) => (
                    <React.Fragment key={`${umur.name}-sub`}>
                      <th style={{ textAlign: "center" }}>L</th>
                      <th style={{ textAlign: "center" }}>P</th>
                      <th style={{ textAlign: "center" }}>Total</th>
                    </React.Fragment>
                  ))}
                  <th style={{ textAlign: "center" }}>Laki-laki</th>
                  <th style={{ textAlign: "center" }}>Perempuan</th>
                  <th style={{ textAlign: "center" }}>Total</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6 + masterUmur.length * 3}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && dataRL.length === 0 && (
                  <tr>
                    <td
                      colSpan={6 + masterUmur.length * 3}
                      style={{ textAlign: "center" }}
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}

                {!loading &&
                  dataRL.map((item, idx) => (
                    <tr key={item.icd_10} style={{ verticalAlign: "middle" }}>
                      <td style={{ textAlign: "center" }}>
                        {" "}
                        {idx + 1 + (page - 1) * limit}
                      </td>
                      <td style={{ textAlign: "center" }}>{item.icd_10}</td>
                      <td>{item.diagnosis}</td>
                      {masterUmur.map((umur) => {
                        const umurData = item.umur.find(
                          (u) => u.age_group === umur.name
                        );
                        return (
                          <React.Fragment key={`${item.icd_10}-${umur.name}`}>
                            <td style={{ textAlign: "center" }}>
                              {umurData?.kunjungan_baru?.male ?? "0"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {umurData?.kunjungan_baru?.female ?? "0"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {umurData?.kunjungan_baru?.total ?? "0"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td style={{ textAlign: "center" }}>
                        {item.total_kunjungan?.male ?? "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.total_kunjungan?.female ?? "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.total_kunjungan?.total ?? "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1 || loading}
                style={{ marginRight: 10 }}
              >
                Prev
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages || loading}
                style={{ marginLeft: 10 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container">
      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRL}>
          <Modal.Body>
            {user.jenisUserId === 1 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="provinsi"
                    id="provinsi"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => provinsiChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarProvinsi.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => kabKotaChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 2 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => kabKotaChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 3 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                onChange={bulanChangeHandler}
                required
              >
                <option value="">Pilih Bulan</option>
                {daftarBulan.map((bulan) => {
                  return (
                    <option
                      key={bulan.value}
                      name={bulan.key}
                      value={bulan.value}
                    >
                      {bulan.key}
                    </option>
                  );
                })}
              </select>
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => tahunChangeHandler(e)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleShow}
            >
              <FaSlidersH />
              Filter
            </button>

            {sudahFilter && (
              <button
                className="btn"
                style={{
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                  marginLeft: "10px",
                }}
                onClick={tarikDataSatusehat}
                disabled={loading}
              >
                <FaSync />
                {loading ? "Memproses..." : "Tarik Data"}
              </button>
            )}

            {/* <DownloadTableExcel
              filename={namafile}
              sheet="data RL 51"
              currentTableRef={tableRef.current}
            > */}
            {/* <button
                className="btn"
                style={{
                  fontSize: "18px",
                  marginLeft: "5px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {" "}
                Download
              </button> */}
            {/* </DownloadTableExcel> */}
          </div>

          <div>
            <h5 style={{ fontSize: "14px" }}>
              {filterLabel.length > 0 ? (
                <>
                  filtered by{" "}
                  {filterLabel
                    .map((value) => {
                      return value;
                    })
                    .join(", ")}
                </>
              ) : (
                <></>
              )}
            </h5>
          </div>

          <LoadingTable
            data={dataRL}
            loading={loading}
            page={page}
            totalPages={totalPages}
            fetchData={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
