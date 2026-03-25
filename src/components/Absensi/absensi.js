import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { HiSaveAs } from "react-icons/hi";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import style from "./absensi.module.css";
// import Table from 'react-bootstrap/Table'
import checkIcon from "../Images/check.png";
import silangIcon from "../Images/silang.png";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import Spinner from "react-bootstrap/Spinner";

const Absensi = () => {
  const [namaRs, setNamaRs] = useState("");
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [provinsiId, setProvinsiId] = useState(null);
  const [namaProvinsi, setNamaProvinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [kabKotaId, setKabKotaId] = useState(null);
  const [dataAbsensi, setDataAbsensi] = useState([]);
  const [namafile, setNamaFile] = useState("");
  const tableRef = useRef(null);
  const [apa, setApa] = useState(true);
  const navigate = useNavigate();
  const [tahun, setTahun] = useState(
    String(Math.max(new Date().getFullYear(), 2025)),
  );
  const { CSRFToken } = useCSRFTokenContext();
  const [spinner, setSpinner] = useState(false);

  const [sortBy, setSortBy] = useState("nama_rs");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    refreshToken();
    getProvinsi();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setExpire(decoded.exp);
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
    },
  );

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

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    const namaProvinsi = e.target.selectedOptions[0].text;
    setNamaProvinsi(namaProvinsi);
    setProvinsiId(provinsiId);
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    const namaKabKota = e.target.selectedOptions[0].text;
    setNamaKabKota(namaKabKota);
    setKabKotaId(kabKotaId);
  };

  const changeHandlerNamaRs = (event) => {
    setNamaRs(event.target.value);
  };

  const changeHandlerTahun = (event) => {
    setTahun(event.target.value);
  };

  const Cari = async (e) => {
    setSpinner(true);
    e.preventDefault();
    const parameterAbsensi = {};

    if (provinsiId != null) {
      parameterAbsensi.provinsiId = provinsiId;
    }

    if (kabKotaId !== null && kabKotaId !== "0") {
      parameterAbsensi.kabKotaId = kabKotaId;
    }

    if (namaRs !== "") {
      parameterAbsensi.namaRs = namaRs;
    }

    if (tahun !== "") {
      parameterAbsensi.tahun = tahun;
    }

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: parameterAbsensi,
      };
      const results = await axiosJWT.get("/apisirs6v2/absensi", customConfig);
      const dataAbsensiDetail = results.data.data.map((value) => {
        return value;
      });
      setDataAbsensi(dataAbsensiDetail);

      const parts = [namaProvinsi, namaKabKota, namaRs, tahun].filter(Boolean); // buang yang kosong / null / undefined

      setNamaFile("Absensi_" + parts.join("_"));

      // setNamaFile(
      //   "Absensi_".concat(
      //     String(namaProvinsi)
      //       .concat("-")
      //       .concat(namaKabKota)
      //       .concat("-")
      //       .concat(namaRs)
      //       .concat("-")
      //       .concat(tahun),
      //   ),
      // );
      setApa(false);
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const years = [];
  for (let i = startYear; i <= Math.max(currentYear, startYear); i++) {
    years.push(i);
  }

  const renderCell = ({ val, validasi, mode }) => {
    // ===== DATA ROW =====
    if (mode === "data") {
      if (val == null) return null;

      return (
        <div style={{ textAlign: "center" }}>
          {val === 0 ? (
            <span
              className="fw-bold"
              style={{ fontSize: "20px", color: "#FF0000" }}
            >
              X
            </span>
          ) : (
            <span
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                display: "inline-block",
                color: "#32CD32",
              }}
            >
              ✔
            </span>
          )}
        </div>
      );
    }

    // ===== VALIDASI ROW =====
    if (mode === "validasi") {
      return (
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "20px",
              color: getColorByValidasi(validasi?.id),
            }}
          >
            {iconByValidasi(validasi?.id)}
          </span>
        </div>
      );
    }

    return null;
  };

  const iconByValidasi = (id) => {
    switch (id) {
      case 1:
        return "⚠";
      case 2:
        return "🔧";
      case 3:
        return "☑";
      default:
        return "-";
    }
  };

  const getColorByValidasi = (id) => {
    switch (id) {
      case 1:
        return "#FFA500";
      case 2:
        return "#007BFF";
      case 3:
        return "#28A745";
      default:
        return "";
    }
  };

  const renderBulanan = (value, type, mode) =>
    [...Array(12)].map((_, mIndex) => {
      const month = mIndex + 1;
      const val = value[`rl_${type}_bulan_${month}`];
      const validasi = value[`rl_${type}_bulan_${month}_validasi`];

      return (
        <td key={`rl_${type}_${month}_${mode}`}>
          {renderCell({ val, validasi, mode })}
        </td>
      );
    });

  const renderTahunan = (value, type, mode) => {
    const val = value[`rl_${type}`];
    const validasi = value[`rl_${type}_validasi`];

    return (
      <td key={`rl_${type}_${mode}`}>{renderCell({ val, validasi, mode })}</td>
    );
  };

  const sortedData = [...dataAbsensi].sort((a, b) => {
    if (!sortBy) return 0;

    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === "nama_rs") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (sortBy === "persentasePengisian") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }

    if (sortBy === "persentaseValidasi") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }

    return 0;
  });

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <form onSubmit={Cari}>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <strong>FILTER</strong>
              </div>
              <div className="card-body">
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="tahun"
                    id="tahun"
                    className="form-select"
                    value={tahun}
                    onChange={(e) => changeHandlerTahun(e)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="tahun">Tahun</label>
                </div>
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
                  <input
                    type="text"
                    name="namaRs"
                    id="namaRs"
                    className="form-control"
                    value={namaRs}
                    onChange={(e) => changeHandlerNamaRs(e)}
                    disabled={false}
                  />
                  <label htmlFor="namaRs">Nama RS</label>
                </div>

                <div className="mt-1">
                  <button type="submit" className={style.btnPrimary}>
                    <HiSaveAs /> Cari
                  </button>
                  <DownloadTableExcel
                    filename={namafile}
                    sheet="Absensi"
                    currentTableRef={tableRef.current}
                  >
                    {/* <button> Export excel </button> */}
                    <button
                      className={style.btnPrimary}
                      style={{
                        marginLeft: "5px",
                      }}
                      hidden={apa}
                    >
                      {" "}
                      Download
                    </button>
                  </DownloadTableExcel>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="container">
              <div className="card">
                <div className="card-header">
                  <strong>SORTING</strong>
                </div>
                <div className="card-body">
                  <div className="row mt-3" style={{ marginBottom: "10px" }}>
                    <div className="col-md-7">
                      <div
                        className="form-floating"
                        style={{ width: "100%", paddingBottom: "5px" }}
                      >
                        <select
                          name="sortBy"
                          id="sortBy"
                          typeof="select"
                          className="form-select"
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="nama_rs">Nama RS</option>
                          <option value="persentasePengisian">
                            Persentase Pengisian
                          </option>
                          <option value="persentaseValidasi">
                            Persentase Validasi
                          </option>
                        </select>
                        <label htmlFor="sortBy">Sort By</label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div
                        className="form-floating"
                        style={{ width: "100%", paddingBottom: "5px" }}
                      >
                        <select
                          name="sortOrder"
                          id="sortOrder"
                          typeof="select"
                          className="form-select"
                          onChange={(e) => setSortOrder(e.target.value)}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                        <label htmlFor="sortOrder">Order by</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="row mt-3">
        <div className="col-md-12">
          <div className="mb-2">
            <strong>Keterangan:</strong>
            <br />

            <span style={{ marginRight: "15px" }}>
              <span
                style={{
                  color: "#28A745",
                  fontWeight: "bold",
                  fontFamily: "Segoe UI Symbol, Arial",
                }}
              >
                ✓
              </span>{" "}
              : Sudah mengisi data
            </span>

            <span style={{ marginRight: "15px" }}>
              <span
                style={{
                  color: "#FF0000",
                  fontWeight: "bold",
                  fontFamily: "Segoe UI Symbol, Arial",
                }}
              >
                ✖
              </span>{" "}
              : Belum mengisi data
            </span>

            <span style={{ marginRight: "15px" }}>
              <span
                style={{
                  color: "#FFA500",
                  fontWeight: "bold",
                  fontFamily: "Segoe UI Symbol, Arial",
                }}
              >
                ⚠
              </span>{" "}
              : Perlu Perbaikan
            </span>

            <span style={{ marginRight: "15px" }}>
              <span
                style={{
                  color: "#007BFF",
                  fontWeight: "bold",
                  fontFamily: "Segoe UI Symbol, Arial",
                }}
              >
                🔧
              </span>{" "}
              : Selesai Diperbaiki
            </span>

            <span style={{ marginRight: "15px" }}>
              <span
                style={{
                  color: "#28A745",
                  fontWeight: "bold",
                  fontFamily: "Segoe UI Symbol, Arial",
                }}
              >
                ☑
              </span>{" "}
              : Disetujui
            </span>
          </div>
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
          <div className={`${style["table-container"]} `}>
            <table className={style["table"]} ref={tableRef}>
              <thead className={style["thead"]}>
                <tr className="main-header-row">
                  <th rowSpan="2" style={{ width: "60px" }}>
                    No.
                  </th>
                  <th rowSpan="2" style={{ width: "100px" }}>
                    Kode RS
                  </th>
                  <th
                    className={style["sticky-header"]}
                    rowSpan="2"
                    style={{ width: "300px", left: 0 }}
                  >
                    Nama RS
                  </th>
                  {/* <th rowSpan="2" className={style.myTableTH} style={{ "width": "1%" }}>RL 3.2</th> */}
                  <th
                    className={style["sticky-header"]}
                    rowSpan="2"
                    style={{ width: "150px", left: "300px" }}
                  >
                    Kab.Kota
                  </th>

                  <th
                    className={style["sticky-header"]}
                    rowSpan="2"
                    style={{ width: "100px", left: "450px" }}
                  ></th>

                  <th
                    className={style["sticky-header"]}
                    rowSpan="2"
                    style={{ width: "150px", left: "550px" }}
                  >
                    Pengisian %
                  </th>

                  <th colSpan="12">RL 3.1</th>
                  <th colSpan="12">RL 3.2</th>
                  <th colSpan="12">RL 3.3</th>
                  <th colSpan="12">RL 3.4</th>
                  <th colSpan="12">RL 3.5</th>
                  <th colSpan="12">RL 3.6</th>
                  <th colSpan="12">RL 3.7</th>
                  <th colSpan="12">RL 3.8</th>
                  <th colSpan="12">RL 3.9</th>
                  <th colSpan="12">RL 3.10</th>

                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.11
                  </th>
                  <th colSpan="12">RL 3.12</th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.13
                  </th>
                  <th colSpan="12">RL 3.14</th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.15
                  </th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.16
                  </th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.17
                  </th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.18
                  </th>
                  <th
                    rowSpan="2"
                    className={style.myTableTH}
                    style={{ width: "0.5%" }}
                  >
                    RL 3.19
                  </th>

                  <th colSpan="12">RL 4.1</th>
                  <th colSpan="12">RL 4.2</th>
                  <th colSpan="12">RL 4.3</th>
                  <th colSpan="12">RL 5.1</th>
                  <th colSpan="12">RL 5.2</th>
                  <th colSpan="12">RL 5.3</th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th style={{ width: "200px" }}>1</th>
                  <th style={{ width: "50px" }}>2</th>
                  <th style={{ width: "50px" }}>3</th>
                  <th style={{ width: "50px" }}>4</th>
                  <th style={{ width: "50px" }}>5</th>
                  <th style={{ width: "50px" }}>6</th>
                  <th style={{ width: "50px" }}>7</th>
                  <th style={{ width: "50px" }}>8</th>
                  <th style={{ width: "50px" }}>9</th>
                  <th style={{ width: "50px" }}>10</th>
                  <th style={{ width: "50px" }}>11</th>
                  <th style={{ width: "50px" }}>12</th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  {/* rl 4 dan 5  */}
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>

                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    1
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    2
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    3
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    4
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    5
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    6
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    7
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    8
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    9
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    10
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    11
                  </th>
                  <th className={style.myTableTH} style={{ width: "1%" }}>
                    12
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((value, index) => {
                  const renderRLCells = (type, mode) =>
                    [...Array(12)].map((_, mIndex) => {
                      const month = mIndex + 1;
                      const val = value[`rl_${type}_bulan_${month}`];
                      const validasi =
                        value[`rl_${type}_bulan_${month}_validasi`];

                      return (
                        <td key={`rl_${type}_${month}_${mode}`}>
                          {renderCell({ val, validasi, mode })}
                        </td>
                      );
                    });

                  return (
                    <React.Fragment key={index}>
                      {/* ===== ROW DATA ===== */}
                      <tr>
                        <td rowSpan="2">{index + 1}</td>
                        <td rowSpan="2">{value.rs_id}</td>

                        <td
                          rowSpan="2"
                          className={style["sticky-column"]}
                          style={{ left: 0 }}
                        >
                          {value.nama_rs}
                        </td>

                        <td
                          rowSpan="2"
                          className={style["sticky-column"]}
                          style={{ left: "300px" }}
                        >
                          {value.kab_kota}
                        </td>

                        <td
                          className={style["sticky-column"]}
                          style={{ left: "460px", fontWeight: "bold" }}
                        >
                          Data
                        </td>

                        <td
                          className={style["sticky-column"]}
                          style={{ left: "560px", textAlign: "center" }}
                        >
                          {Number(value.persentasePengisian ?? 0).toFixed(2)} %
                        </td>

                        {/* RL 3.1 – 3.10 */}
                        {[
                          "31",
                          "32",
                          "33",
                          "34",
                          "35",
                          "36",
                          "37",
                          "38",
                          "39",
                          "310",
                        ].map((type) => renderRLCells(type, "data"))}

                        {/* ===== 3.11 ===== */}
                        {renderTahunan(value, "311", "data")}

                        {/* ===== 3.12 ===== */}
                        {renderBulanan(value, "312", "data")}

                        {/* ===== 3.13 ===== */}
                        {renderTahunan(value, "313", "data")}

                        {/* ===== 3.14 ===== */}
                        {renderBulanan(value, "314", "data")}

                        {/* ===== 3.15 – 3.19 ===== */}
                        {["315", "316", "317", "318", "319"].map((type) =>
                          renderTahunan(value, type, "data"),
                        )}

                        {/* ===== 4.1 – 4.3 ===== */}
                        {["41", "42", "43"].map((type) =>
                          renderBulanan(value, type, "data"),
                        )}

                        {/* ===== 5.1 – 5.3 ===== */}
                        {["51", "52", "53"].map((type) =>
                          renderBulanan(value, type, "data"),
                        )}
                      </tr>

                      {/* ===== ROW VALIDASI ===== */}
                      <tr>
                        <td
                          className={style["sticky-column"]}
                          style={{ left: "460px", fontWeight: "bold" }}
                        >
                          Validasi
                        </td>

                        <td
                          className={style["sticky-column"]}
                          style={{ left: "560px", textAlign: "center" }}
                        >
                          {Number(value.persentaseValidasi ?? 0).toFixed(2)}{" "}
                          %{" "}
                        </td>

                        {/* RL 3.1 – 3.10 */}
                        {[
                          "31",
                          "32",
                          "33",
                          "34",
                          "35",
                          "36",
                          "37",
                          "38",
                          "39",
                          "310",
                        ].map((type) => renderRLCells(type, "validasi"))}

                        {/* ===== 3.11 ===== */}
                        {renderTahunan(value, "311", "validasi")}

                        {/* ===== 3.12 ===== */}
                        {renderBulanan(value, "312", "validasi")}

                        {/* ===== 3.13 ===== */}
                        {renderTahunan(value, "313", "validasi")}

                        {/* ===== 3.14 ===== */}
                        {renderBulanan(value, "314", "validasi")}

                        {/* ===== 3.15 – 3.19 ===== */}
                        {["315", "316", "317", "318", "319"].map((type) =>
                          renderTahunan(value, type, "validasi"),
                        )}

                        {/* ===== 4.1 – 4.3 ===== */}
                        {["41", "42", "43"].map((type) =>
                          renderBulanan(value, type, "validasi"),
                        )}

                        {/* ===== 5.1 – 5.3 ===== */}
                        {["51", "52", "53"].map((type) =>
                          renderBulanan(value, type, "validasi"),
                        )}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Absensi;
