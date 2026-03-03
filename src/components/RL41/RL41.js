import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL41.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import { Modal } from "react-bootstrap";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL41 = () => {
  // const [namaRS, setNamaRS] = useState("");
  // const [alamatRS, setAlamatRS] = useState("");
  // const [namaPropinsi, setNamaPropinsi] = useState("");
  // const [namaKabKota, setNamaKabKota] = useState("");
  const [tahun, setTahun] = useState("2025");
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

  const [idValidasi, setidValidasi] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

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

  const handleSelectRumahSakit = (e) => {
    const id = e.target.value;
    const selected = daftarRumahSakit.find((item) => item.id == id);
    if (selected) {
      setRumahSakit(selected);
    } else {
      setRumahSakit(null);
    }
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
        "/apisirs6v2/rlempattitiksatuvalidasi",
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
        "/apisirs6v2/rlempattitiksatu",
        customConfig,
      );

      const rlEmpatDetails = results.data.data.map((value) => {
        return value;
      });

      // let datarlEmpatDetails = [];
      // rlEmpatDetails.forEach((element) => {
      //   element.forEach((value) => {
      //     datarlEmpatDetails.push(value);
      //   });
      // });

      setDataRL(rlEmpatDetails);
      setNamaFile(
        "rl41_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01")),
      );

      handleClose();
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

  const deleteDetailRL = async (id) => {
    try {
      const customConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.delete("/apisirs6v2/rlempattitiksatu/" + id, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const Delete = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            deleteDetailRL(id);
          },
        },
        {
          label: "Tidak",
        },
      ],
    });
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (statusValidasi == 1 && keteranganValidasi == "") {
      toast(`Keterangan tidak boleh kosong`, {
        position: toast.POSITION.TOP_RIGHT,
      });
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

      if (idValidasi != "") {
        await axiosJWT.patch(
          "/apisirs6v2/rlempattitiksatuvalidasi/" + idValidasi,
          {
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rlempattitiksatuvalidasi",
          {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(bulan),
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      }
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setIsValidated(statusValidasi == 3);
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const [activeTab, setActiveTab] = useState("tab1");

  const handleTabClick = (tab) => {
    if (tab === "tab2") {
      getValidasi();
    }
    setActiveTab(tab);
  };

  const stickyOffsets =
    user.jenisUserId === 4
      ? { no: "0px", aksi: "52px", icd: "205px", diag: "287px" }
      : { no: "0px", icd: "52px", diag: "134px" };

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

      <ToastContainer />
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
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      {loadingRS ? "Loading..." : "Pilih"}
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
                      {loadingRS ? "Loading..." : "Pilih"}
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
                      {loadingRS ? "Loading..." : "Pilih"}
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
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>
              RL 4.1 - Morbiditas Pasien Rawat Inap
            </h4>
          </div>

          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl41/tambah/`}
                className={style.btnPrimary}
                style={{ textDecoration: "none" }}
              >
                +
              </Link>
            ) : (
              <></>
            )}
            <button className={style.btnPrimary} onClick={handleShow}>
              Filter
            </button>
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 35"
              currentTableRef={tableRef.current}
            >
              {/* <button> Export excel </button> */}
              <button className={style.btnPrimary}> Download</button>
            </DownloadTableExcel>
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
              {(user.jenisUserId === 1 ||
                user.jenisUserId === 2 ||
                user.jenisUserId === 3 ||
                user.jenisUserId === 4) &&
              dataRL.length > 0 &&
              rumahSakit != null ? (
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
                  <table className={style["table"]} ref={tableRef}>
                    <thead className={style["thead"]}>
                      <tr className="main-header-row">
                        <th
                          rowSpan={3}
                          style={{
                            width: "1%",
                            verticalAlign: "middle",
                            left: stickyOffsets.no,
                          }}
                          className={style["sticky-header-view"]}
                        >
                          No.
                        </th>
                        {user.jenisUserId === 4 && (
                          <th
                            rowSpan={3}
                            style={{
                              width: "3%",
                              verticalAlign: "middle",
                              left: stickyOffsets.aksi,
                            }}
                            className={style["sticky-header-view"]}
                          >
                            Aksi
                          </th>
                        )}
                        <th
                          className={style["sticky-header-view"]}
                          rowSpan={3}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                            left: stickyOffsets.icd,
                          }}
                        >
                          Kode ICD-10
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          rowSpan={3}
                          style={{
                            width: "5.5%",
                            textAlign: "left",
                            verticalAlign: "middle",
                            left: stickyOffsets.diag,
                          }}
                        >
                          Diagnosis Penyakit
                        </th>
                        <th colSpan={50} style={{ textAlign: "center" }}>
                          Jumlah Pasien Hidup dan Mati Menurut Kelompok Umur &
                          Jenis Kelamin{" "}
                        </th>
                        <th
                          colSpan={3}
                          rowSpan={2}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin
                        </th>
                        <th
                          colSpan={3}
                          rowSpan={2}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          Jumlah Pasien Keluar Mati
                        </th>
                      </tr>
                      <tr className={style["subheader-row"]}>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          {" "}
                          &lt; 1 Jam{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          1 - 23 Jam{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          1 - 7 Hari{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          8 - 28 Hari{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          29 Hari - &lt;3 Bulan{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          3 - &lt;6 Bulan{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          6 - 11 Bulan{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          1 - 4 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          5 - 9 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          10 - 14 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          15 - 19 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          20 - 24 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          25 - 29 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          30 - 34 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          35 - 39 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          40 - 44 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          45 - 49 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          50 - 54 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          55 - 59 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          60 - 64 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          65 - 69 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          70 - 74 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          75 - 79 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          80 - 84 Tahun{" "}
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }}>
                          {" "}
                          ≥ 85 Tahun{" "}
                        </th>
                      </tr>
                      <tr className={style["subsubheader-row"]}>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
                        <th style={{ textAlign: "center" }}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }}>Perempuan</th>
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
                          <tr
                            style={{ verticalAlign: "center" }}
                            key={value.id}
                          >
                            <td
                              className={style["sticky-column-view"]}
                              style={{
                                textAlign: "center",
                                left: stickyOffsets.no,
                              }}
                            >
                              <label>{index + 1}</label>
                            </td>
                            {user.jenisUserId === 4 && (
                              <td
                                className={style["sticky-column-view"]}
                                style={{
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  left: stickyOffsets.aksi,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "100%",
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
                                    onClick={(e) => Delete(value.id)}
                                  >
                                    Hapus
                                  </button>
                                  {value.icd.icd_code != 0 && (
                                    <Link
                                      to={`/rl41/ubah/${value.id}`}
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
                                  )}
                                </div>
                              </td>
                            )}
                            <td
                              className={style["sticky-column-view"]}
                              style={{
                                textAlign: "center",
                                left: stickyOffsets.icd,
                              }}
                            >
                              <label>{value.icd.icd_code}</label>
                            </td>
                            <td
                              className={style["sticky-column-view"]}
                              style={{
                                textAlign: "left",
                                left: stickyOffsets.diag,
                              }}
                            >
                              <label>{value.icd.description_code}</label>
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_0_1jam_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_0_1jam_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_23jam_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_23jam_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_7hr_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_7hr_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_8_28hr_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_8_28hr_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_3_6bln_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_3_6bln_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_6_11bln_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_6_11bln_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_4th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_1_4th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_5_9th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_5_9th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_10_14th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_10_14th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_15_19th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_15_19th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_20_24th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_20_24th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_25_29th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_25_29th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_30_34th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_30_34th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_35_39th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_35_39th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_40_44th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_40_44th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_45_49th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_45_49th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_50_54th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_50_54th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_55_59th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_55_59th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_60_64th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_60_64th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_65_69th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_65_69th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_70_74th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_70_74th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_75_79th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_75_79th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_80_84th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_80_84th_p}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_lebih85th_l}
                            </td>
                            <td>
                              {value.jmlh_pas_hidup_mati_umur_gen_lebih85th_p}
                            </td>
                            <td>{value.jmlh_pas_hidup_mati_gen_l}</td>
                            <td>{value.jmlh_pas_hidup_mati_gen_p}</td>
                            <td>{value.total_pas_hidup_mati}</td>
                            <td>{value.jmlh_pas_keluar_mati_gen_l}</td>
                            <td>{value.jmlh_pas_keluar_mati_gen_p}</td>
                            <td>{value.total_pas_keluar_mati}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div
                className={`tab-pane fade ${
                  activeTab === "tab2" ? "show active" : ""
                }`}
              >
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 4.1</h3>
                  {idValidasi ? (
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
                          padding: "15px",
                          borderRadius: "5px",
                          marginBottom: "20px",
                        }}
                      >
                        <h5 style={{ margin: "0", color: "#856404" }}>
                          Data Belum di Validasi
                        </h5>
                      </div>
                    )
                  )}
                  {isValidated ? (
                    <h2 className="text-center" style={{ color: "green" }}>
                      Data telah di validasi
                    </h2>
                  ) : (
                    (user.jenisUserId === 3 ||
                      (user.jenisUserId === 4 && idValidasi)) && (
                      <form onSubmit={simpanValidasi}>
                        <ToastContainer />
                        <div className={style.validasiFormGroup}>
                          <label htmlFor="statusValidasi">Status</label>
                          <select
                            id="statusValidasi"
                            name="statusValidasi"
                            value={statusValidasi}
                            required
                            onChange={(e) => statusValidasiChangeHadler(e)}
                          >
                            {user.jenisUserId === 4 ? (
                              <>
                                <option value="">Pilih Status</option>
                                <option value="2">Selesai Diperbaiki</option>
                              </>
                            ) : (
                              <>
                                <option value="1">Perlu Perbaikan</option>
                                <option value="2">Selesai Diperbaiki</option>
                                <option value="3">Disetujui</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className={style.validasiFormGroup}>
                          <label htmlFor="keteranganValidasi">Catatan</label>
                          <textarea
                            id="keteranganValidasi"
                            name="keteranganValidasi"
                            value={keteranganValidasi}
                            onChange={(e) => keteranganValidasiChangeHadler(e)}
                            placeholder="Tambahkan catatan (opsional)"
                            rows={4}
                            disabled={user.jenisUserId === 4}
                          />
                        </div>
                        <button type="submit" className={style.btnPrimary}>
                          <HiSaveAs size={20} /> Simpan
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL41;
