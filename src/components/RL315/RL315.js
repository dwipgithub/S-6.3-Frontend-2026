import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL315.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL315 = () => {
  const [bulan, setBulan] = useState(1);
  // const [tahun, setTahun] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState(null);
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState("");
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const [selectedRsID, setSelectedRsID] = useState(null);

  useEffect(() => {
    refreshToken();
    const date = new Date();
    setTahun(date.getFullYear());
    setBulan(date.getMonth() + 1);
    // getRLTigaTitikLimaBelasTemplate()
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
      setSelectedRsID(selected.id); // 🔥 penting
      setRumahSakit(selected);
    } else {
      setSelectedRsID(null);
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
          periode: tahun,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimabelasvalidasi",
        customConfig,
      );

      if (results.data.data != null && results.data.data.length > 0) {
        setidValidasi(results.data.data[0].id);
        setidValidasiSubmited(results.data.data[0].statusValidasiId);

        setStatusValidasi("");

        setKeteranganValidasi(results.data.data[0].catatan || "");
        setTglValidasi(results.data.data[0].modifiedAt);
        setIsValidated(results.data.data[0].statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi("");
        setKeteranganValidasi("");
        setTglValidasi("");
        setIsValidated(false);
      }
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const getDataRLTigaTitikLimaBelas = async (event) => {
    event.preventDefault();

    if (user.jenisUserId == 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
    }

    if (rumahSakit == null) {
      setSpinner(false);
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("Nama Rumah Sakit: ".concat(rumahSakit.nama));
    filter.push("Periode ".concat(String(tahun)));
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
          tahun: tahun,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimabelas",
        customConfig,
      );

      const rlTigaTitikLimaBelasDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_lima_belas_details;
      });

      let dataRLTigaTitikLimaBelasDetails = [];
      rlTigaTitikLimaBelasDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikLimaBelasDetails.push(value);
        });
      });

      setDataRL(dataRLTigaTitikLimaBelasDetails);
      // setRumahSakit(null);
      handleClose();
      setActiveTab("tab1");
      setIsFilterApplied(true);
      await getValidasi();
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      const results = await axiosJWT.delete(
        `/apisirs6v2/rltigatitiklimabelas/${id}`,
        customConfig,
      );
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

  const hapus = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            hapusData(id);
          },
        },
        {
          label: "Tidak",
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

  let total = { laki: 0, perempuan: 0, jumlah: 0 };
  dataRL.map((value, index) => {
    total.perempuan += parseInt(value.perempuan || 0);
    total.laki += parseInt(value.laki || 0);
    total.jumlah += parseInt(value.jumlah || 0);
  });

  function handleDownloadExcel() {
    const header = ["No", "No Kegiatan", "Jenis Kegiatan", "Jumlah"];
    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_kegiatan_rl_tiga_titik_lima_belas.no,
        value.jenis_kegiatan_rl_tiga_titik_lima_belas.nama,
        value.jumlah,
      ];
      return data;
    });
    downloadExcel({
      fileName: "RL_3_15",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(Number(e.target.value));
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    setSpinner(true);
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
      return;
    }

    if (statusValidasi === 1 && keteranganValidasi === "") {
      toast(`Keterangan tidak boleh kosong`, {
        position: toast.POSITION.TOP_RIGHT,
      });
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

      if (idValidasi != "") {
        await axiosJWT.patch(
          "/apisirs6v2/rltigatitiklimabelasvalidasi/" + idValidasi,
          {
            statusValidasiId:
              statusValidasi === "" || statusValidasi === null
                ? idValidasiSubmited
                : Number(statusValidasi),
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rltigatitiklimabelasvalidasi",
          {
            rsId: rumahSakit.id,
            periode: `${tahun}-12-01`,
            statusValidasiId:
              statusValidasi === "" || statusValidasi === null
                ? idValidasiSubmited
                : Number(statusValidasi),
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      }
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setIsValidated(statusValidasi == 3);
      await getValidasi();
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setSpinner(false);
  };

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
      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRLTigaTitikLimaBelas}>
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
                    onChange={(e) => {
                      getKabKota(e.target.value);
                      getRumahSakit(e.target.value, "provinsi");
                    }}
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
                    onChange={(e) => getRumahSakit(e.target.value)}
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
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
                    onChange={(e) => getRumahSakit(e.target.value)}
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
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
              style={{ width: "100%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
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
      {/* RL. 3.15 Kesehatan Jiwa */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>RL 3.15 - Kesehatan Jiwa</h4>
          </div>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl315/tambah/`}
                className={style.btnPrimary}
                style={{ textDecoration: "none" }}
              >
                Tambah
              </Link>
            ) : (
              <></>
            )}
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
                <div className={style.tableContainer}>
                  <table className={`table table-bordered ${style.table}`}>
                    <thead>
                      <tr>
                        <th style={{ width: "5%", textAlign: "center" }}>No</th>

                        {user.jenisUserId === 4 && (
                          <th style={{ width: "12%", textAlign: "center" }}>
                            Aksi
                          </th>
                        )}

                        <th style={{ width: "35%", textAlign: "center" }}>
                          Jenis Kegiatan
                        </th>
                        <th style={{ width: "15%", textAlign: "center" }}>
                          Laki-laki
                        </th>
                        <th style={{ width: "15%", textAlign: "center" }}>
                          Perempuan
                        </th>
                        <th style={{ width: "15%", textAlign: "center" }}>
                          Jumlah
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {dataRL.length > 0 && (
                        <>
                          {dataRL.map((value, index) => (
                            <tr key={value.id}>
                              {/* NO */}
                              <td className={style["sticky-column-view"]}>
                                {index + 1}
                              </td>

                              {/* AKSI */}
                              {user.jenisUserId === 4 && (
                                <td className={style["sticky-column"]}>
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
                                      onClick={() => hapus(value.id)}
                                    >
                                      Hapus
                                    </button>

                                    {value
                                      .jenis_kegiatan_rl_tiga_titik_lima_belas
                                      .nama !== "Tidak Ada Data" && (
                                      <Link
                                        to={`/rl315/ubah/${value.id}`}
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

                              {/* JENIS KEGIATAN */}
                              <td style={{ textAlign: "left" }}>
                                {
                                  value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                    .nama
                                }
                              </td>

                              {/* LAKI */}
                              <td style={{ textAlign: "center" }}>
                                {value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.laki
                                  : 0}
                              </td>

                              {/* PEREMPUAN */}
                              <td style={{ textAlign: "center" }}>
                                {value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.perempuan
                                  : 0}
                              </td>

                              {/* JUMLAH */}
                              <td style={{ textAlign: "center" }}>
                                {value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.jumlah
                                  : 0}
                              </td>
                            </tr>
                          ))}

                          {/* TOTAL */}
                          <tr className="table-light fw-bold">
                            <td
                              colSpan={user.jenisUserId === 4 ? 3 : 2}
                              style={{ textAlign: "center" }}
                            >
                              TOTAL
                            </td>

                            <td style={{ textAlign: "center" }}>
                              {total.laki}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {total.perempuan}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {total.jumlah}
                            </td>
                          </tr>
                        </>
                      )}
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
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.15</h3>
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
                        {idValidasiSubmited == 1
                          ? "Perlu Perbaikan"
                          : idValidasiSubmited == 2
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
                        <strong>Data Belum Divalidasi</strong>
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
                          <strong>Data Telah Divalidasi</strong>
                        </div>
                      </div>
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
                              value={statusValidasi || ""}
                              required
                              onChange={(e) => statusValidasiChangeHadler(e)}
                            >
                              {user.jenisUserId === 4 ? (
                                <>
                                  <option value="" disabled>
                                    Pilih Status
                                  </option>
                                  <option value="2">Selesai Diperbaiki</option>
                                </>
                              ) : (
                                <>
                                  <option value="" disabled>
                                    Pilih Status
                                  </option>
                                  <option value="1">Perlu Perbaikan</option>
                                  <option value="3">Disetujui</option>
                                </>
                              )}
                            </select>
                          </div>

                          {user.jenisUserId === 3 ? (
                            <>
                              <div className={style.validasiFormGroup}>
                                <label htmlFor="keteranganValidasi">
                                  Catatan
                                </label>
                                <textarea
                                  id="keteranganValidasi"
                                  name="keteranganValidasi"
                                  value={keteranganValidasi}
                                  onChange={(e) =>
                                    keteranganValidasiChangeHadler(e)
                                  }
                                  placeholder="Tambahkan catatan (opsional)"
                                  rows={4}
                                  disabled={user.jenisUserId === 4}
                                />
                              </div>
                            </>
                          ) : null}

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
    </div>
  );
};

export default RL315;
