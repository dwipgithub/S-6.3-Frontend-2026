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
import Table from "react-bootstrap/Table";
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
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
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
      showRumahSakit(decoded.satKerId);
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
        "/apisirs6v2/rlempattitiksatu",
        customConfig
      );

      // console.log(results.data.data);

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
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setRumahSakit(null);
      handleClose();
      setSpinner(false);
    } catch (error) {
      console.log(error);
    }
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
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
          <span style={{ color: "gray" }}>
            {" "}
            <h4>RL 4.1 - Morbiditas Pasien Rawat Inap</h4>
          </span>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl41/tambah/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                +
              </Link>
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
              Filter
            </button>
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 35"
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
                Download
              </button>
            </DownloadTableExcel>
          </div>
        </div>
        <div>
          <h5 style={{ fontSize: "14px" }}>
            {filterLabel
              .map((value) => {
                return "filtered by" + value;
              })
              .join(", ")}
          </h5>
        </div>
        <div className={style["table-container"]}>
          <table className={style["table"]} ref={tableRef}>
            <thead className={style["thead"]}>
              <tr className="main-header-row">
                <th
                  rowSpan={3}
                  style={{ width: "1%", verticalAlign: "middle" }}
                  className={style["sticky-header-view"]}
                >
                  No.
                </th>
                <th
                  rowSpan={3}
                  style={{ width: "3%", verticalAlign: "middle" }}
                  className={style["sticky-header-view"]}
                >
                  Aksi
                </th>
                <th
                  className={style["sticky-header-view"]}
                  rowSpan={3}
                  style={{ textAlign: "center", verticalAlign: "middle" }}
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
                  }}
                >
                  Diagnosis Penyakit
                </th>
                <th colSpan={50} style={{ textAlign: "center" }}>
                  Jumlah Pasien Hidup dan Mati Menurut Kelompok Umur & Jenis
                  Kelamin{" "}
                </th>
                <th
                  colSpan={3}
                  rowSpan={2}
                  style={{ textAlign: "center", verticalAlign: "middle" }}
                >
                  Jumlah Pasien Hidup dan Mati Menurut Jenis Kelamin
                </th>
                <th
                  colSpan={3}
                  rowSpan={2}
                  style={{ textAlign: "center", verticalAlign: "middle" }}
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
                  <tr style={{ verticalAlign: "center" }} key={value.id}>
                    <td
                      className={style["sticky-column-view"]}
                      style={{ textAlign: "center" }}
                    >
                      <label>{index + 1}</label>
                    </td>
                    <td
                      className={style["sticky-column-view"]}
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <ToastContainer />
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
                      </div>
                    </td>
                    <td
                      className={style["sticky-column-view"]}
                      style={{ textAlign: "center" }}
                    >
                      <label>{value.icd.icd_code}</label>
                    </td>
                    <td
                      className={style["sticky-column-view"]}
                      style={{ textAlign: "left" }}
                    >
                      <label>{value.icd.description_code}</label>
                    </td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_0_1jam_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_0_1jam_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_23jam_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_23jam_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_7hr_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_7hr_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_8_28hr_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_8_28hr_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_3_6bln_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_3_6bln_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_6_11bln_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_6_11bln_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_4th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_1_4th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_5_9th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_5_9th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_10_14th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_10_14th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_15_19th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_15_19th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_20_24th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_20_24th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_25_29th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_25_29th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_30_34th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_30_34th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_35_39th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_35_39th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_40_44th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_40_44th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_45_49th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_45_49th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_50_54th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_50_54th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_55_59th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_55_59th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_60_64th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_60_64th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_65_69th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_65_69th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_70_74th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_70_74th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_75_79th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_75_79th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_80_84th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_80_84th_p}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_lebih85th_l}</td>
                    <td>{value.jmlh_pas_hidup_mati_umur_gen_lebih85th_p}</td>
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
    </div>
  );
};

export default RL41;
