import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL310.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
// import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL310 = () => {
  const [tahun, setTahun] = useState(1);
  const [bulan, setBulan] = useState("");
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
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const [namafile, setNamaFile] = useState("");
  const [limit] = useState(50);

  // untuk validasi
  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    const date = new Date();
    setTahun(date.getFullYear());
    // getDataRLTigaTitikSepuluh();

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
    },
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

  const getDataRLTigaTitikSepuluh = async (e) => {
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("Nama: ".concat(rumahSakit.nama));
    filter.push(
      "Periode ".concat(
        String(months[bulan - 1].label)
          .concat(" ")
          .concat(tahun),
      ),
    );
    setFilterLabel(filter);

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: tahun,
          bulan: bulan,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksepuluh",
        customConfig,
      );

      const rlTigaTitikSepuluhDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_sepuluh_details;
      });

      let dataRLTigaTitikSepuluhDetails = [];
      rlTigaTitikSepuluhDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikSepuluhDetails.push(value);
        });
      });
      setDataRL(dataRLTigaTitikSepuluhDetails);
      setIsFilterApplied(true);
      getValidasi();
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const getValidasi = async () => {
    if (!rumahSakit || !rumahSakit.id) {
      return;
    }
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
        "/apisirs6v2/rltigatitiksepuluhvalidasi",
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
        `/apisirs6v2/rltigatitiksepuluh/${id}`,
        customConfig,
      );
      // getDataRLTigaTitikSepuluh();
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

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  let total = {
    rm_diterima_puskesmas: 0,
    rm_diterima_rs: 0,
    rm_diterima_faskes_lain: 0,
    rm_diterima_total_rm: 0,
    rm_dikembalikan_puskesmas: 0,
    rm_dikembalikan_rs: 0,
    rm_dikembalikan_faskes_lain: 0,
    rm_dikembalikan_total_rm: 0,
    keluar_pasien_rujukan: 0,
    keluar_pasien_datang_sendiri: 0,
    keluar_total_keluar: 0,
    keluar_diterima_kembali: 0,
  };

  dataRL.map((value, index) => {
    total.rm_diterima_puskesmas += parseInt(value.rm_diterima_puskesmas || 0);
    total.rm_diterima_rs += parseInt(value.rm_diterima_rs || 0);
    total.rm_diterima_faskes_lain += parseInt(
      value.rm_diterima_faskes_lain || 0,
    );
    total.rm_diterima_total_rm += parseInt(value.rm_diterima_total_rm || 0);
    total.rm_dikembalikan_puskesmas += parseInt(
      value.rm_dikembalikan_puskesmas || 0,
    );
    total.rm_dikembalikan_rs += parseInt(value.rm_dikembalikan_rs || 0);
    total.rm_dikembalikan_faskes_lain += parseInt(
      value.rm_dikembalikan_faskes_lain || 0,
    );
    total.rm_dikembalikan_total_rm += parseInt(
      value.rm_dikembalikan_total_rm || 0,
    );
    total.keluar_pasien_rujukan += parseInt(value.keluar_pasien_rujukan || 0);
    total.keluar_pasien_datang_sendiri += parseInt(
      value.keluar_pasien_datang_sendiri || 0,
    );
    total.keluar_total_keluar += parseInt(value.keluar_total_keluar || 0);
    total.keluar_diterima_kembali += parseInt(
      value.keluar_diterima_kembali || 0,
    );
  });

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
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

    if (statusValidasi == 1 && keteranganValidasi == "") {
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
    setSpinner(false);
  };

  function handleDownloadExcel() {
    const header = [
      "No",
      "No Spesialisasi",
      "Jenis Spesialisasi",
      "Rujukan Masuk Diterima Dari Puskesmas",
      "Rujukan Masuk Diterima Dari RS Lain",
      "Rujukan Masuk Diterima Dari Faskes Lain",
      "Total Rujukan Masuk Diterima",
      "Rujukan Masuk Dikembalikan Ke Puskesmas",
      "Rujukan Masuk Dikembalikan Ke RS Asal",
      "Rujukan Masuk Dikembalikan Ke Faskes Lain",
      "Total Rujukan Masuk Dikembalikan",
      "Dirujuk Keluar Pasien Rujukan",
      "Dirujuk Keluar Pasien Datang Sendiri",
      "Total Dirujuk Keluar",
      "Diterima Kembali",
    ];

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_spesialis_rl_tiga_titik_sepuluh.no,
        value.jenis_spesialis_rl_tiga_titik_sepuluh.nama,
        value.rm_diterima_puskesmas,
        value.rm_diterima_rs,
        value.rm_diterima_faskes_lain,
        value.rm_diterima_total_rm,
        value.rm_dikembalikan_puskesmas,
        value.rm_dikembalikan_rs,
        value.rm_dikembalikan_faskes_lain,
        value.rm_dikembalikan_total_rm,
        value.keluar_pasien_rujukan,
        value.keluar_pasien_datang_sendiri,
        value.keluar_total_keluar,
        value.keluar_diterima_kembali,
      ];
      return data;
    });

    downloadExcel({
      fileName: "RL_3_10",
      sheet: "react-export-table-to-excel",
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

      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRLTigaTitikSepuluh}>
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
                name="bulan"
                className="form-control"
                id="bulan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              >
                {months.map((value) => (
                  <option key={value.value - 1} value={value.value}>
                    {value.label}
                  </option>
                ))}
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

      {/* RL. 3.10 Rujukan */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>RL 3.10 - Rujukan</h4>
          </div>

          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl310/tambah/`}
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
                <div className={style["table-container"]}>
                  <table
                    className={style["table"]}
                    // style={{ width: "500%" }}
                    ref={tableRef}
                  >
                    <thead className={style["thead"]}>
                      <tr className="main-header-row">
                        <th
                          className={style["sticky-header-view"]}
                          style={{ width: "2%", verticalAlign: "middle" }}
                          rowSpan={3}
                        >
                          No
                        </th>
                        {user.jenisUserId === 4 && (
                          <th
                            className={style["sticky-header-view"]}
                            rowSpan="3"
                            style={{ width: "8%", verticalAlign: "middle" }}
                          >
                            Aksi
                          </th>
                        )}
                        <th
                          className={style["sticky-header-view"]}
                          style={{ width: "20%", verticalAlign: "middle" }}
                          rowSpan={3}
                        >
                          Jenis Spesialisasi
                        </th>
                        <th colSpan={8}>Rujukan Masuk</th>
                        <th
                          colSpan={4}
                          rowSpan={2}
                          style={{ verticalAlign: "middle" }}
                        >
                          Dirujuk Keluar
                        </th>
                      </tr>
                      <tr className={style["sticky-header-view"]}>
                        <th colSpan={4}>Diterima Dari</th>
                        <th colSpan={4}>Dikembalikan Ke</th>
                      </tr>
                      <tr className={style["sticky-header-view"]}>
                        <th>Puskesmas</th>
                        <th>RS Lain</th>
                        <th>Faskes Lain</th>
                        <th>Total Rujukan Masuk</th>
                        <th>Puskesmas</th>
                        <th>RS Asal</th>
                        <th>Faskes Lain</th>
                        <th>Total Rujukan Masuk Dikembalikan</th>
                        <th>Pasien Rujukn</th>
                        <th>Pasien Datang Sendiri</th>
                        <th>Total Dirujuk Keluar</th>
                        <th>Diterima Kembali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRL.length > 0 ? (
                        <>
                          {dataRL.map((value, index) => {
                            return (
                              <tr key={value.id}>
                                <td className={style["sticky-column-view"]}>
                                  <input
                                    type="text"
                                    name="no"
                                    className="form-control"
                                    value={
                                      value
                                        .jenis_spesialis_rl_tiga_titik_sepuluh
                                        .no
                                    }
                                    disabled={true}
                                  />
                                </td>
                                <td
                                  className={style["sticky-column-view"]}
                                  style={{
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <ToastContainer />
                                  {/* <RiDeleteBin5Fill size={20} onClick={(e) => hapus(value.id)} style={{ color: "gray", cursor: "pointer", marginRight: "5px" }} /> */}
                                  <button
                                    className="btn btn-danger"
                                    disabled={isValidated}
                                    style={{
                                      margin: "0 5px 0 0",
                                      backgroundColor: "#FF6663",
                                      border: "1px solid #FF6663",
                                    }}
                                    type="button"
                                    onClick={(e) => hapus(value.id)}
                                  >
                                    Hapus
                                  </button>
                                  <Link
                                    to={`/rl310/ubah/${value.id}`}
                                    className="btn btn-warning"
                                    style={{
                                      margin: "0 5px 0 0",
                                      backgroundColor: "#CFD35E",
                                      border: "1px solid #CFD35E",
                                      color: "#FFFFFF",
                                    }}
                                  >
                                    Ubah
                                    {/* <RiEdit2Fill size={20} style={{ color: "gray", cursor: "pointer" }} /> */}
                                  </Link>
                                </td>
                                <td className={style["sticky-column-view"]}>
                                  <input
                                    type="text"
                                    name="nama"
                                    className="form-control"
                                    value={
                                      value
                                        .jenis_spesialis_rl_tiga_titik_sepuluh
                                        .nama
                                    }
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_diterima_puskesmas"
                                    className="form-control"
                                    value={value.rm_diterima_puskesmas}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_diterima_rs"
                                    className="form-control"
                                    value={value.rm_diterima_rs}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_diterima_faskes_lain"
                                    className="form-control"
                                    value={value.rm_diterima_faskes_lain}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_diterima_total_rm"
                                    className="form-control"
                                    value={value.rm_diterima_total_rm}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_dikembalikan_puskesmas"
                                    className="form-control"
                                    value={value.rm_dikembalikan_puskesmas}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_dikembalikan_rs"
                                    className="form-control"
                                    value={value.rm_dikembalikan_rs}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_dikembalikan_faskes_lain"
                                    className="form-control"
                                    value={value.rm_dikembalikan_faskes_lain}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rm_dikembalikan_total_rm"
                                    className="form-control"
                                    value={value.rm_dikembalikan_total_rm}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="keluar_pasien_rujukan"
                                    className="form-control"
                                    value={value.keluar_pasien_rujukan}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="keluar_pasien_datang_sendiri"
                                    className="form-control"
                                    value={value.keluar_pasien_datang_sendiri}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="keluar_total_keluar"
                                    className="form-control"
                                    value={value.keluar_total_keluar}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="keluar_diterima_kembali"
                                    className="form-control"
                                    value={value.keluar_diterima_kembali}
                                    disabled={true}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td></td>
                            <td></td>
                            <td className={style["sticky-column-view"]}>
                              <strong>Total</strong>
                            </td>
                            <td className="text-center">
                              {total.rm_diterima_puskesmas}
                            </td>
                            <td className="text-center">
                              {total.rm_diterima_rs}
                            </td>
                            <td className="text-center">
                              {total.rm_diterima_faskes_lain}
                            </td>
                            <td className="text-center">
                              {total.rm_diterima_total_rm}
                            </td>
                            <td className="text-center">
                              {total.rm_dikembalikan_puskesmas}
                            </td>
                            <td className="text-center">
                              {total.rm_dikembalikan_rs}
                            </td>
                            <td className="text-center">
                              {total.rm_dikembalikan_faskes_lain}
                            </td>
                            <td className="text-center">
                              {total.rm_dikembalikan_total_rm}
                            </td>
                            <td className="text-center">
                              {total.keluar_pasien_rujukan}
                            </td>
                            <td className="text-center">
                              {total.keluar_pasien_datang_sendiri}
                            </td>
                            <td className="text-center">
                              {total.keluar_total_keluar}
                            </td>
                            <td className="text-center">
                              {total.keluar_diterima_kembali}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <></>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className={`tab-pane fade ${
                activeTab === "tab2" ? "show active" : ""
              }`}
            >
              <div className={style.validasiCard}>
                <h3 className={style.validasiCardTitle}>Validasi RL 3.10</h3>
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
  );
};

export default RL310;
