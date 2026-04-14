import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import style from "./FormTambahRL43.module.css";
import { useNavigate, Link } from "react-router-dom";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Table from "react-bootstrap/Table";
import { Modal } from "react-bootstrap";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import Spinner from "react-bootstrap/Spinner";

const RL43 = () => {
  // const [namaRS, setNamaRS] = useState("");
  // const [alamatRS, setAlamatRS] = useState("");
  // const [namaPropinsi, setNamaPropinsi] = useState("");
  // const [namaKabKota, setNamaKabKota] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState("01");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);

  //baru
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});

  const [idValidasi, setidValidasi] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [selectedRsID, setSelectedRsID] = useState(null);
  const { CSRFToken } = useCSRFTokenContext();
  const tableRef = useRef(null);

  useEffect(() => {
    refreshToken();
    // getDataRLEmpatTitikSatuDetails("2023-01-01");
    getBulan();
    // const getLastYear = async () => {
    //   const date = new Date();
    //   setTahun(date.getFullYear() );
    //   return date.getFullYear() ;
    // };
    // getLastYear().then((results) => {});

    const headerRow = tableRef.current?.querySelector("thead tr:first-child");

    if (!headerRow) return;

    const updateHeight = () => {
      const height = headerRow.getBoundingClientRect().height;
      tableRef.current.style.setProperty("--header-height", `${height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRow);

    return () => observer.disconnect();
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
      if (decoded.jenisUserId == 4) {
        showRumahSakit(decoded.satKerId);
      }
      setExpire(decoded.exp);
      setUser(decoded);
      // setExpire(decoded.exp);
      // getDataRS(decoded.rsId);
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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "01",
    });
    results.push({
      key: "Februari",
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

  // const getRumahSakit = async (kabKotaId) => {
  //   setLoadingRS(true);
  //   setDaftarRumahSakit([]);
  //   try {
  //     const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       params: {
  //         kabKotaId: kabKotaId,
  //       },
  //     });
  //     setDaftarRumahSakit(response.data.data);
  //   } catch (error) {}
  //   setLoadingRS(false);
  // };

  const getRumahSakit = async (id, type = "kabkota") => {
    setLoadingRS(true);
    setDaftarRumahSakit([]);
    try {
      let params = {};
      if (type === "provinsi") {
        params.provinsiId = id;
      } else {
        params.kabKotaId = id;
      }
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
    setLoadingRS(false);
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

  const getValidasi = async () => {
    setSpinner(true);
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
        "/apisirs6v2/rlempattitiktigavalidasi",
        customConfig,
      );

      if (results.data.data != null && results.data.data.length > 0) {
        setidValidasi(results.data.data[0].id);
        setStatusValidasi(results.data.data[0].statusValidasiId);
        setKeteranganValidasi(results.data.data[0].catatan || "");
        setTglValidasi(results.data.data[0].modifiedAt);
        setIsValidated(results.data.data[0].statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi(1);
        setKeteranganValidasi("");
        setTglValidasi("");
        setIsValidated(false);
      }
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const getRL = async (e) => {
    setSpinner(true);
    e.preventDefault();
    if (user.jenisUserId == 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSpinner(false);
        return;
      }
    }
    const filter = [];
    filter.push("Nama Rumah Sakit: ".concat(rumahSakit.nama));
    filter.push("Periode: ".concat(String(tahun).concat("-").concat(bulan)));
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
        "/apisirs6v2/rlempattitiktiga",
        customConfig,
      );

      const rlEmpatDetails = results.data.data.map((value) => {
        return value;
      });
      setDataRL(rlEmpatDetails);
      handleClose();
      setIsFilterApplied(true);
      setActiveTab("tab1");
      await getValidasi();
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan("01");
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan("01");
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

  // const changeHandlerSingle = (event) => {
  //   const name = event.target.name;
  //   if (name === "tahun") {
  //     setTahun(event.target.value);
  //   } else if (name === "bulan") {
  //     setBulan(event.target.value);
  //   }
  // };

  function handleDownloadExcel() {
    const header = [
      "No",
      "Kelompok ICD-10",
      "Kelompok Diagnosa Penyakit",
      "Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin Laki-Laki",
      "Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin Perempuan",
      "Total Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin",
      "Jumlah Pasien Keluar Mati Laki-Laki",
      "Jumlah Pasien Keluar Mati Perempuan",
      "Total Jumlah Pasien Keluar Mati ",
    ];
    // console.log("tes")
    // console.log(dataRL)

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.icd_code_group,
        value.description_code_group,
        value.jmlh_pas_hidup_mati_laki,
        value.jmlh_pas_hidup_mati_perempuan,
        value.total_pas_hidup_mati_group_by_icd_code,
        value.jmlh_pas_keluar_mati_gen_laki,
        value.jmlh_pas_keluar_mati_gen_perempuan,
        value.total_pas_keluar_mati_group_by_icd_code,
      ];
      return data;
    });

    downloadExcel({
      fileName: "rl43_"
        .concat(dataRL[0].rs_id)
        .concat("_")
        .concat(String(tahun).concat("-").concat(bulan).concat("-01")),
      sheet: "rl43",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  const [activeTab, setActiveTab] = useState("tab1");

  const handleTabClick = (tab) => {
    if (tab === "tab2") {
      getValidasi();
    }
    setActiveTab(tab);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
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
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
          <Modal.Body>
            {user.jenisUserId === 1 || user.jenisUserId === 99 ? (
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
                    value={selectedRsID || ""}
                    onChange={(e) => handleSelectRumahSakit(e)}
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
                    value={selectedRsID || ""}
                    onChange={(e) => handleSelectRumahSakit(e)}
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
                    value={selectedRsID || ""}
                    onChange={(e) => handleSelectRumahSakit(e)}
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
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>
              RL 4.3 - 10 Besar Kematian Penyakit Pasien Rawat Inap
            </h4>
          </div>
          <div className={style.toolbar}>
            <button className={style.btnPrimary} onClick={handleShow}>
              Filter
            </button>
            <button className={style.btnPrimary} onClick={handleDownloadExcel}>
              Download
            </button>
          </div>

          <div className={style.filterLabel}>
            {filterLabel.length > 0 ? (
              <div>
                <h5 style={{ fontSize: "14px" }}>
                  Filtered By{" "}
                  {filterLabel
                    .map((value) => {
                      return value;
                    })
                    .join(", ")}
                </h5>
              </div>
            ) : (
              <></>
            )}
          </div>

          <div>
            <ul className={`nav nav-tabs ${style.navTabs}`}>
              <li className={`nav-item ${style.navItem}`}>
                <button
                  type="button"
                  className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`}
                  onClick={() => handleTabClick("tab1")}
                >
                  Data
                </button>
              </li>
              {user.jenisUserId === 1 ||
              user.jenisUserId === 2 ||
              user.jenisUserId === 3 ||
              user.jenisUserId === 4 ? (
                //   &&
                // dataRL.length > 0 &&
                // rumahSakit != null
                <li className={`nav-item ${style.navItem}`}>
                  <button
                    type="button"
                    className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                    onClick={() => handleTabClick("tab2")}
                  >
                    Validasi
                  </button>
                </li>
              ) : null}
            </ul>

            <div className={`tab-content ${style.tabContent}`}>
              <div
                className={`tab-pane fade ${
                  activeTab === "tab1" ? "show active" : ""
                }`}
              >
                <div className={style["table-container"]}>
                  <table ref={tableRef} className={style["table"]}>
                    <thead>
                      <tr>
                        <th rowSpan={3} style={{ verticalAlign: "middle" }}>
                          No.
                        </th>
                        <th
                          rowSpan={3}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          Kelompok ICD-10
                        </th>
                        <th
                          rowSpan={3}
                          style={{ textAlign: "left", verticalAlign: "middle" }}
                        >
                          Kelompok Diagnosa Penyakit
                        </th>
                        <th
                          colSpan={3}
                          // rowSpan={2}
                          style={{
                            width: "30%",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin
                        </th>
                        <th
                          colSpan={3}
                          // rowSpan={2}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          Jumlah Pasien Keluar Mati
                        </th>
                      </tr>
                      <tr>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Total</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRL.map((value, index) => {
                        return (
                          <tr style={{ verticalAlign: "center" }} key={index}>
                            <td>
                              <label>{index + 1}</label>
                            </td>
                            <td style={{ textAlign: "center " }}>
                              <label>{value.icd_code_group}</label>
                            </td>
                            <td style={{ textAlign: "left" }}>
                              <label>{value.description_code_group}</label>
                            </td>
                            <td>{value.jmlh_pas_hidup_mati_laki}</td>
                            <td>{value.jmlh_pas_hidup_mati_perempuan}</td>
                            <td>
                              {value.total_pas_hidup_mati_group_by_icd_code}
                            </td>
                            <td>{value.jmlh_pas_keluar_mati_gen_laki}</td>
                            <td>{value.jmlh_pas_keluar_mati_gen_perempuan}</td>
                            <td>
                              {value.total_pas_keluar_mati_group_by_icd_code}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div
                  className={`tab-pane fade ${
                    activeTab === "tab2" ? "show active" : ""
                  }`}
                >
                  <div className={style.validasiCard}>
                    <h3 className={style.validasiCardTitle}>Validasi RL 4.3</h3>
                    <div
                      style={{
                        backgroundColor: "#d1ecf1",
                        color: "#0c5460",
                        padding: "15px",
                        borderRadius: "5px",
                        marginBottom: "20px",
                        border: "1px solid #bee5eb",
                      }}
                    >
                      <p style={{ margin: "0" }}>
                        Info : Validasi RL 4.3 ini berdasarkan validasi RL 4.1
                      </p>
                    </div>
                    {!isFilterApplied ? (
                      <div
                        style={{
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffc107",
                          color: "#856404",
                          padding: "15px",
                          borderRadius: "4px",
                          textAlign: "center",
                        }}
                      >
                        <strong>
                          Silakan pilih filter terlebih dahulu untuk menampilkan
                          data.
                        </strong>
                      </div>
                    ) : dataRL.length === 0 ? (
                      <div
                        style={{
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffc107",
                          color: "#856404",
                          padding: "15px",
                          borderRadius: "4px",
                          textAlign: "center",
                        }}
                      >
                        <strong>Tidak ada data untuk proses validasi</strong>
                      </div>
                    ) : idValidasi ? (
                      <div
                        style={{
                          backgroundColor: "#E9ECEF",
                          padding: "15px",
                          borderRadius: "5px",
                          marginBottom: "20px",
                        }}
                      >
                        <p style={{ margin: "0" }}>
                          <strong
                            style={{ width: "100px", display: "inline-block" }}
                          >
                            Status
                          </strong>
                          :{" "}
                          {statusValidasi == 1
                            ? "Perlu Perbaikan"
                            : statusValidasi == 2
                              ? "Selesai Diperbaiki"
                              : "Disetujui"}
                        </p>
                        <p style={{ margin: "0" }}>
                          <strong
                            style={{ width: "100px", display: "inline-block" }}
                          >
                            Catatan
                          </strong>
                          : {keteranganValidasi || "-"}
                        </p>
                        <p style={{ margin: "0" }}>
                          <strong
                            style={{ width: "100px", display: "inline-block" }}
                          >
                            Tanggal
                          </strong>
                          :{" "}
                          {tglValidasi
                            ? new Date(tglValidasi).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </p>
                      </div>
                    ) : (
                      user.jenisUserId !== 3 && (
                        <div
                          style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          <strong>Data Belum di Validasi</strong>
                        </div>
                      )
                    )}

                    {dataRL.length > 0 && rumahSakit?.id ? (
                      isValidated ? (
                        <div
                          style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          <div className="text-center">
                            <strong>Data telah di validasi</strong>
                          </div>
                        </div>
                      ) : null
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL43;
