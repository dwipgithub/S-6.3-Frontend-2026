import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL34.module.css";
import { HiSaveAs } from "react-icons/hi";
import {
  FaCalendarAlt,
  FaClock,
  FaDatabase,
  FaFilter,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { getStatusSatset } from "../../api/status_satset.js";
import { getJenisPengunjungName, getSafeDataRL } from "./rl34Helpers";

export default function TabMenu34() {
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
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <div className="row">
        <div className="col-md-12">
          <h4 className="text-secondary">
            <span>🏥</span>
            RL 3.4 - Pengunjung
          </h4>

          {/* TAB HEADER */}
          <ul className="nav nav-tabs border-bottom mb-0">
            {/* TAB SIRS */}
            <li className="nav-item">
              <button
                style={{ color: activeTab === "tab1" ? "#00b9ad" : "black" }}
                className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                SIRS
              </button>
            </li>

            {/* TAB SATUSEHAT */}
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
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
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
  const [spinner, setSpinner] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("tab1");
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun(date.getFullYear());
      return date.getFullYear();
    };
    getLastYear().then((results) => {});

    totalPengunjung();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load validasi data secara realtime saat tab validasi dibuka atau filter berubah
  useEffect(() => {
    if (activeTab === "tab2" && rumahSakit && rumahSakit.id && bulan !== 0 && tahun) {
      getValidasi();
    }
  }, [bulan, tahun, rumahSakit, activeTab]);

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
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      } else if (decoded.jenisUserId === 4) {
        showRumahSakit(decoded.satKerId, response.data.accessToken);
      }

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
    }
  );

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Februari",
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

  const showRumahSakit = async (id, tokenOverride) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${tokenOverride || token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(event.target.value);
    } else if (name === "bulan") {
      setBulan(event.target.value);
    }
  };

  const changeHandler = (event, index) => {
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        hapus();
      } else if (event.target.checked === false) {
        // console.log('hello2')
      }
    }
  };

  const getRL = async (e) => {
    if (e) e.preventDefault();
    setSpinner(true);

    if (!rumahSakit || !rumahSakit.id) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
      return;
    }

  setFilterLabel([]);

  const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));

    // Ambil nama bulan dari daftarBulan
    const bulanObj = daftarBulan.find(
      (item) => item.value === String(parseInt(bulan))
    );

    const namaBulan = bulanObj ? bulanObj.key : bulan;

    // Tampilkan nama bulan
    filter.push(
      "periode: ".concat(namaBulan + " " + tahun)
    );

    setFilterLabel(filter);

    setValidasiId(null);
    setStatusValidasi(0);
    setKeteranganValidasi("");
    setDataValidasi(null);

    try {
      const date = String(tahun).concat("-").concat(String(bulan).padStart(2, "0")).concat("-01");
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          tahun: date,
        },
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempat",
        customConfig
      );

      const apiData = results.data.data;
      if (!apiData || apiData.length === 0) {
        setDataRL([]);
        toast("Data RL 3.4 tidak ditemukan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSpinner(false);
        handleClose();
        return;
      }

      const dataRLTigaTitikEmpatDetails = [];
      apiData.forEach((value) => {
        if (value.rl_tiga_titik_empat_details && Array.isArray(value.rl_tiga_titik_empat_details)) {
          value.rl_tiga_titik_empat_details.forEach((item) => {
            dataRLTigaTitikEmpatDetails.push(item);
          });
        }
      });

      setDataRL(dataRLTigaTitikEmpatDetails);
      setSpinner(false);
      handleClose();

      // Load validasi data setelah filter diterapkan
      try {
        const validasiConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
          },
        };
        const validasiResponse = await axiosJWT.get(
          "/apisirs6v2/rltigatitikempatvalidasi",
          validasiConfig
        );

        if (validasiResponse.data.data && validasiResponse.data.data.length > 0) {
          const validasi = validasiResponse.data.data[0];
          setValidasiId(validasi.id);
          setStatusValidasi(validasi.statusValidasiId);
          setKeteranganValidasi(validasi.catatan || "");
          setDataValidasi(validasi);
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
      toast("Gagal mengambil data RL 3.4", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
    }
  };

  const getValidasi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatvalidasi",
        customConfig
      );

      if (response.data.data && response.data.data.length > 0) {
        const validasi = response.data.data[0];
        setValidasiId(validasi.id);
        setStatusValidasi(validasi.statusValidasiId);
        setKeteranganValidasi(validasi.catatan || "");
        setDataValidasi(validasi);
      } else {
        setValidasiId(null);
        setStatusValidasi(0);
        setKeteranganValidasi("");
        setDataValidasi(null);
      }
    } catch (error) {
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();
    if (!rumahSakit || (!rumahSakit.id && user.jenisUserId === 4)) {
      toast("Rumah sakit harus dipilih terlebih dahulu", { position: toast.POSITION.TOP_RIGHT });
      return;
    }
    if (parseInt(statusValidasi) === 0) {
      toast("Status harus dipilih terlebih dahulu", { position: toast.POSITION.TOP_RIGHT });
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
      const payload = {
        statusValidasiId: parseInt(statusValidasi),
        catatan: keteranganValidasi,
      };

      if (validasiId) {
        await axiosJWT.patch(`/apisirs6v2/rltigatitikempatvalidasi/${validasiId}`, payload, customConfig);
        toast("Data Validasi Berhasil Diperbarui", { position: toast.POSITION.TOP_RIGHT });
      } else {
        const createPayload = {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
          jenisPeriode: 1,
          ...payload,
        };
        const response = await axiosJWT.post("/apisirs6v2/rltigatitikempatvalidasi", createPayload, customConfig);
        setValidasiId(response.data.data.id);
        toast("Data Validasi Berhasil Disimpan", { position: toast.POSITION.TOP_RIGHT });
      }
      setTimeout(() => getValidasi(), 1500);
    } catch (error) {
      toast(`Gagal menyimpan: ${error.response?.data?.message || error.message}`, { position: toast.POSITION.TOP_RIGHT });
    }
  };

  const totalPengunjung = () => {
    let totall = 0;
    dataRL.map((value, index) => (totall = totall + value.jumlah));
    setTotal(totall);
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitikempat/${id}`, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
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
      message: "Apakah Anda Yakin? ",
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
  // RESET FILTER LABEL
  setFilterLabel([]);

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

  function handleDownloadExcel() {
    const header = ["No", "Jenis Kunjungan", "Jumlah"];
    const safeData = getSafeDataRL(dataRL);
  
    // hitung total jumlah
    const totalJumlah = safeData.reduce((acc, item) => {
      return acc + Number(item.jumlah || 0);
    }, 0);
  
    // isi body data
    const body = safeData.map((value, index) => {
      return [
        index + 1,
        getJenisPengunjungName(value),
        value.jumlah,
      ];
    });
  
    // tambahkan baris TOTAL di bawah
    body.push([
      "",          // kolom No kosong
      "TOTAL",     // tulisan TOTAL
      totalJumlah  // total jumlah
    ]);
  
    downloadExcel({
      fileName: "RL_Pengunjung",
      sheet: "RL",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  return (
    <div className="container">
      <ToastContainer />
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
                          className="form-select"
                          value={rumahSakit?.id || 0}
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
                        className="form-select"
                        value={rumahSakit?.id || 0}
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
                        className="form-select"
                        value={rumahSakit?.id || 0}
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
                value={bulan}
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
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <>
                <Link
                  className={style.btnPrimary}
                  to={`/rl34/tambah/`}
                  style={{textDecoration: "none",
                          display: "inline-block",
                          color: "#FFF",
                          marginRight: "5px"}}
                >
                  Tambah
                </Link>
              </>
            ) : (
              <></>
            )}
            <button
              className={style.btnPrimary}
              style={{ fontSize: "18px", marginRight: "5px" }}
              onClick={handleShow}
            >
              Filter
            </button>
            <button
              className={style.btnPrimary}
              style={{ fontSize: "18px", marginRight: "5px" }}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
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

          <div>
            <ul className={`nav nav-tabs ${style.navTabs}`}>
              <li className={`nav-item ${style.navItem}`}>
                <button
                  type="button"
                  className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`}
                  onClick={() => setActiveTab("tab1")}
                >
                  Data
                </button>
              </li>
              {[3, 4].includes(user.jenisUserId) && (
                <li className={`nav-item ${style.navItem}`}>
                  <button
                    type="button"
                    className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                    onClick={() => setActiveTab("tab2")}
                  >
                    Validasi
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content mt-3">
              <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
                <div className={style.tableContainer}>
                  <div className="table-responsive">
                    <Table className={style.rlTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "5%" }}>No.</th>
                          {user.jenisUserId === 4 ?
                            <th
                              rowSpan={2}
                              style={{ width: "8%", verticalAlign: "middle" }}>
                                Aksi
                              </th>
                              : <></>
                          }
                          <th style={{ width: "40%" }}>Jenis Pengunjung</th>
                          <th style={{ textAlign: "center", verticalAlign: "middle" }}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRL.map((value, index) => {
                          // setTotal(total + value.jumlah);
                          return (
                            <tr key={value.id}>
                              <td>
                              
                                  {index + 1}
                              
                              </td>
                              {user.jenisUserId === 4 ?
                              <td
                                style={{ textAlign: "center", verticalAlign: "middle" }}
                              >
                                <ToastContainer />
                                <div style={{ display: "flex" }}>
                                  {/* <RiDeleteBin5Fill  size={20} onClick={(e) => hapus(value.id)} style={{color: "gray", cursor: "pointer", marginRight: "5px"}} /> */}
                                  <button
                                    className="btn btn-danger"
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
                                  {getJenisPengunjungName(value) !== "Tidak Ada Data" && (
                                    <Link
                                      to={`/rl34/ubah/${value.id}`}
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
                              : <></>
                                    }
                              <td>
                                  {getJenisPengunjungName(value)}
                              </td>
                              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                              {value.jumlah}
                              </td>
                            </tr>
                          );
                        })}
                        {total != 0 ? (
                          <tr>
                            <td
                            colSpan={user.jenisUserId === 4 ? 3 : 2}
                              style={{ textAlign: "center", verticalAlign: "middle" }}
                            >
                              TOTAL :{" "}
                            </td>
                            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                              {total}
                            </td>
                          </tr>
                        ) : (
                          <></>
                        )}
                      </tbody>
          </Table>
                  </div>
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.4</h3>
                  {dataRL.length === 0 ? (
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
                      <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
                    </div>
                  ) : (!dataValidasi && user.jenisUserId === 4) ? (
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
                  ) : (
                    <>
                      {dataValidasi && (
                        <div
                          style={{
                            backgroundColor: "#f0f0f0",
                            padding: "12px",
                            borderRadius: "4px",
                            marginBottom: "15px",
                          }}
                        >
                          <div style={{ display: "flex", marginBottom: "4px" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Status
                            </div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {dataValidasi.statusValidasiId === 1
                                ? "Perlu Perbaikan"
                                : dataValidasi.statusValidasiId === 2
                                ? "Selesai Diperbaiki"
                                : dataValidasi.statusValidasiId === 3
                                ? "Disetujui"
                                : "-"}
                            </div>
                          </div>
                          {(dataValidasi.catatan || dataValidasi.keterangan) && (
                            <div style={{ display: "flex", marginBottom: "4px" }}>
                              <div
                                style={{
                                  width: "90px",
                                  textAlign: "left",
                                  paddingRight: "8px",
                                  fontWeight: "600",
                                }}
                              >
                                Catatan
                              </div>
                              <div style={{ width: "10px" }}>:</div>
                              <div>
                                {dataValidasi.catatan || dataValidasi.keterangan}
                              </div>
                            </div>
                          )}
                          <div style={{ display: "flex" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Dibuat
                            </div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </div>
                        </div>
                      )}

                      {dataValidasi && dataValidasi.statusValidasiId === 3 ? (
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
                          <strong>Data telah divalidasi.</strong>
                        </div>
                      ) : (
                        <form onSubmit={simpanValidasi}>
                          <div className={style.validasiFormGroup}>
                            <label>Status</label>
                            <select
                              value={statusValidasi}
                              onChange={(e) => setStatusValidasi(e.target.value)}
                            >
                              <option value={0}>Pilih</option>
                              {user.jenisUserId === 4 ? (
                                <option value="2">Selesai Diperbaiki</option>
                              ) : (
                                <>
                                  <option value="1">Perlu Perbaikan</option>
                                  <option value="3">Disetujui</option>
                                </>
                              )}
                            </select>
                          </div>

                          {user.jenisUserId !== 4 && (
                            <div className={style.validasiFormGroup}>
                              <label>Catatan</label>
                              <textarea
                                value={keteranganValidasi}
                                onChange={(e) => setKeteranganValidasi(e.target.value)}
                                rows={4}
                                placeholder="Tambahkan catatan jika perlu perbaikan..."
                              />
                            </div>
                          )}

                          {user.jenisUserId === 4 && statusValidasi === "2" && (
                             <div className="alert alert-info py-2">
                               Setelah memperbaiki data di SIRS, silakan klik tombol di bawah untuk memberitahu validator.
                             </div>
                          )}

                          <button type="submit" className={style.btnPrimary}>
                            <HiSaveAs size={20} /> {validasiId ? "Perbarui Validasi" : "Simpan Validasi"}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTwo() {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState("");
  const [rumahSakit, setRumahSakit] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const [filterLabel, setFilterLabel] = useState([]);
  const [isSyncingSatusehat, setIsSyncingSatusehat] = useState(false);
  const [isSyncCooldown, setIsSyncCooldown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hasFilteredSatusehat, setHasFilteredSatusehat] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();
  const syncCooldownTimeoutRef = useRef(null);
  const syncCooldownMinutes = 5;
  const syncCooldownMs = syncCooldownMinutes * 60 * 1000;

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  useEffect(() => {
    refreshToken();
    const date = new Date();
    setTahun(String(date.getFullYear()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (syncCooldownTimeoutRef.current) {
        clearTimeout(syncCooldownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSyncCooldown || !lastSyncAt) return;
    const elapsed = (Date.now() - new Date(lastSyncAt).getTime()) / 60000;
    if (elapsed >= syncCooldownMinutes) return;
    const remainingMs = (syncCooldownMinutes - elapsed) * 60 * 1000;
    const t = setTimeout(() => setIsSyncCooldown(false), remainingMs);
    return () => clearTimeout(t);
  }, [isSyncCooldown, lastSyncAt, syncCooldownMinutes]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
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
      setUser(decoded);
      if (decoded.jenisUserId === 4 && (!rumahSakit || !rumahSakit.id)) {
        showRumahSakit(decoded.satKerId, response.data.accessToken);
      }
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
    (error) => Promise.reject(error)
  );

  const showRumahSakit = async (id, tokenOverride) => {
    try {
      if (rumahSakit && String(rumahSakit.id) === String(id)) {
        return;
      }

      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${tokenOverride || token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getSelectedRsId = () => {
    const rsFromState = rumahSakit && rumahSakit.id ? rumahSakit.id : null;
    if (rsFromState && String(rsFromState) !== "0") return Number(rsFromState);
    if (user && user.jenisUserId === 4 && user.satKerId) return Number(user.satKerId);
    return null;
  };

  const minutesSinceSync = lastSyncAt
    ? (now - new Date(lastSyncAt).getTime()) / 60000
    : null;
  const canSync =
    !isSyncingSatusehat &&
    (minutesSinceSync === null || minutesSinceSync >= syncCooldownMinutes) &&
    !isSyncCooldown;
  const cooldownLeft =
    minutesSinceSync !== null
      ? Math.max(0, syncCooldownMinutes - minutesSinceSync).toFixed(1)
      : null;

  const formatLastSyncAt = (value) => {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(value)).replace(".", ":").replace(".", ":") + " WIB";
    } catch (error) {
      return "-";
    }
  };

  const startSyncCooldown = () => {
    setIsSyncCooldown(true);

    if (syncCooldownTimeoutRef.current) {
      clearTimeout(syncCooldownTimeoutRef.current);
    }

    syncCooldownTimeoutRef.current = setTimeout(() => {
      setIsSyncCooldown(false);
    }, syncCooldownMs);
  };

  const getSatusehatRL34 = async (e) => {
    if (e) e.preventDefault();

    const rsId = getSelectedRsId();
    if (!rsId) {
      toast("rumah sakit harus dipilih", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (!tahun || !bulan) {
      toast("periode wajib diisi", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    let currentRumahSakit = rumahSakit;
    if (!currentRumahSakit || !currentRumahSakit.id || String(currentRumahSakit.id) === "0") {
      try {
        const detailRs = await axiosJWT.get("/apisirs6v2/rumahsakit/" + rsId, {
          headers: { Authorization: `Bearer ${token}` },
        });
        currentRumahSakit = detailRs.data.data || { id: rsId, nama: "Rumah Sakit" };
        setRumahSakit(currentRumahSakit);
      } catch (error) {
        currentRumahSakit = { id: rsId, nama: "Rumah Sakit" };
        setRumahSakit(currentRumahSakit);
      }
    }

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const filter = [];
    filter.push("Provinsi: ".concat(currentRumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(currentRumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabel(filter);
    setHasFilteredSatusehat(true);

    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/getDataRLTigaTitikEmpatSatusehatLocal",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId,
            month: periode,
          },
        }
      );

      const arr = response?.data?.data || [];
      setDataRL(Array.isArray(arr) ? arr : []);
    } catch (error) {
      setDataRL([]);
      const detailMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan";
      toast.error(detailMessage, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const syncSatusehatRL34 = async () => {
    const rsId = getSelectedRsId();
    if (!rsId) {
      toast("rumah sakit harus dipilih", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (!tahun || !bulan) {
      toast("periode wajib diisi", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (isSyncingSatusehat || isSyncCooldown) {
      toast(`Sync Satusehat masih dibatasi, tunggu ${syncCooldownMinutes} menit.`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;

    try {
      setIsSyncingSatusehat(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const apiKey = process.env.REACT_APP_SATUSEHAT_API_KEY;
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      await axiosJWT.get("/apisirs6v2/rltigatitikempatsatusehat", {
        headers,
        params: {
          rsId,
          periode,
        },
      });

      toast.success("Sync Satusehat berhasil.", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setLastSyncAt(new Date());
      await getSatusehatRL34();
      startSyncCooldown();
    } catch (error) {
      const detailMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Gagal sync Satusehat";
      toast.error(detailMessage, {
        position: toast.POSITION.TOP_RIGHT,
      });
      startSyncCooldown();
    } finally {
      setIsSyncingSatusehat(false);
    }
  };

  const handleSatusehatFilterClick = () => {
    getSatusehatRL34();
  };

  const handleSatusehatSyncClick = () => {
    syncSatusehatRL34();
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const header = [
        "No.",
        "Bulan",
        "Pengunjung Baru",
        "Pengunjung Lama",
        "Total",
      ];

      const body = dataRL.map((item, idx) => [
        idx + 1,
        item.month || "-",
        item.new_visitors || 0,
        item.returning_visitors || 0,
        item.total_visitors || 0,
      ]);

      downloadExcel({
        fileName: `RL_3_4_SatuSehat_${tahun}-${bulan}`,
        sheet: "react-export-table-to-excel",
        tablePayload: {
          header,
          body,
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="row">
        <div className="col-md-12">
          <div
            className="border rounded-bottom shadow-sm bg-white"
            style={{ padding: "20px 24px" }}
          >
            <div
              style={{
                background: "var(--color-background-primary, #fff)",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#1e293b",
                  margin: "0 0 14px 0",
                }}
              >
                Periode Data
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 180 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      Bulan
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        border: "1px solid #cbd5e1",
                        borderRadius: 7,
                        padding: "7px 10px",
                        background: "#f8fafc",
                      }}
                    >
                      <FaCalendarAlt size={13} color="#94a3b8" />
                      <select
                        value={bulan}
                        onChange={(e) => setBulan(e.target.value)}
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          flex: 1,
                          fontSize: 13,
                          color: "#0f172a",
                          fontWeight: 500,
                          minWidth: 0,
                        }}
                      >
                        {months.map((value) => (
                          <option key={value.value} value={value.value}>
                            {value.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 150 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      Tahun
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        border: "1px solid #cbd5e1",
                        borderRadius: 7,
                        padding: "7px 10px",
                        background: "#f8fafc",
                      }}
                    >
                      <FaCalendarAlt size={13} color="#94a3b8" />
                      <input
                        type="number"
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          flex: 1,
                          fontSize: 13,
                          color: "#0f172a",
                          fontWeight: 500,
                          width: "100%",
                          minWidth: 0,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSatusehatFilterClick}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#1d4ed8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <FaFilter size={14} />
                    FILTER
                  </button>

                  <button
                    type="button"
                    onClick={handleSatusehatSyncClick}
                    disabled={!canSync}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      cursor: canSync ? "pointer" : "not-allowed",
                      opacity: canSync ? 1 : 0.55,
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) => canSync && (e.currentTarget.style.opacity = "0.9")}
                    onMouseOut={(e) => canSync && (e.currentTarget.style.opacity = "1")}
                  >
                    {isSyncingSatusehat ? (
                      <Spinner
                        animation="border"
                        role="status"
                        size="sm"
                        style={{ color: "#fff", borderWidth: 2 }}
                      />
                    ) : (
                      <FaSyncAlt size={14} className={isSyncingSatusehat ? "fa-spin" : ""} />
                    )}
                    {isSyncingSatusehat
                      ? "Syncing..."
                      : !canSync && !isSyncingSatusehat
                      ? `Tunggu ${cooldownLeft ?? "5.0"} menit lagi`
                      : "SYNC SATUSEHAT"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isDownloading || !hasFilteredSatusehat}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      cursor:
                        !isDownloading && hasFilteredSatusehat ? "pointer" : "not-allowed",
                      opacity: !isDownloading && hasFilteredSatusehat ? 1 : 0.55,
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) =>
                      !isDownloading && hasFilteredSatusehat && (e.currentTarget.style.opacity = "0.9")
                    }
                    onMouseOut={(e) =>
                      !isDownloading && hasFilteredSatusehat && (e.currentTarget.style.opacity = "1")
                    }
                  >
                    {isDownloading ? (
                      <Spinner
                        animation="border"
                        role="status"
                        size="sm"
                        style={{ color: "#fff", borderWidth: 2 }}
                      />
                    ) : (
                      <SiMicrosoftexcel size={15} />
                    )}
                    {isDownloading ? "Mengunduh..." : "DOWNLOAD EXCEL"}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: "1 1 240px",
                  border: "1.5px solid #3b82f6",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "#fff",
                  minHeight: 150,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaInfoCircle size={14} color="#2563eb" />
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#1e293b",
                      letterSpacing: "0.3px",
                    }}
                  >
                    KETERANGAN TOMBOL
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaFilter size={12} color="#fff" />
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: "19px" }}>
                    <strong style={{ color: "#0f172a" }}>FILTER</strong> : Menampilkan data dari
                    database SIRS Online
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaSyncAlt size={12} color="#fff" />
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: "19px" }}>
                    <strong style={{ color: "#0f172a" }}>SYNC SATUSEHAT</strong> : Mengambil data
                    terbaru dari SATUSEHAT
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <SiMicrosoftexcel size={12} color="#fff" />
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: "19px" }}>
                    <strong style={{ color: "#0f172a" }}>DOWNLOAD EXCEL</strong> : Mengunduh data
                    hasil filter
                  </div>
                </div>
              </div>

              <div
                style={{
                  flex: "1 1 210px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <FaSyncAlt size={13} color="#059669" />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#059669",
                      letterSpacing: "0.3px",
                    }}
                  >
                    STATUS SINKRONISASI
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FaCalendarAlt size={11} color="#475569" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginBottom: 2,
                          letterSpacing: "0.3px",
                        }}
                      >
                        TERAKHIR SYNC
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {formatLastSyncAt(lastSyncAt)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FaClock size={11} color="#475569" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginBottom: 2,
                          letterSpacing: "0.3px",
                        }}
                      >
                        INTERVAL SYNC
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {syncCooldownMinutes} Menit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  flex: "1 1 180px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 12,
                  }}
                >
                  <FaDatabase size={14} color="#3b82f6" />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#3b82f6",
                      letterSpacing: 0.3,
                    }}
                  >
                    SUMBER DATA
                  </span>
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

            {hasFilteredSatusehat && !isSyncingSatusehat && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
                  border: "1px solid #d9dee7",
                  borderRadius: 8,
                  padding: "8px 16px",
                  marginBottom: 12,
                  fontSize: 12,
                  color: "#334155",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Filtered By {filterLabel.join(", ")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                  Total {dataRL.length} baris
                </div>
              </div>
            )}

            {isSyncingSatusehat && (
              <div
                style={{
                  border: "1px solid #d9dee7",
                  borderRadius: 10,
                  padding: "18px 16px",
                  marginBottom: 14,
                  background: "#f8fafc",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Spinner animation="border" role="status" size="sm" />
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Sedang mengambil data dari SatuSehat, mohon tunggu...
                </div>
              </div>
            )}

            {!hasFilteredSatusehat && !isSyncingSatusehat && (
              <div
                style={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  color: "#856404",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 14,
                  textAlign: "center",
                }}
              >
                Silakan pilih filter terlebih dahulu.
              </div>
            )}

            {hasFilteredSatusehat &&
              !isSyncingSatusehat &&
              dataRL.length === 0 && (
                <div
                  style={{
                    backgroundColor:
                      lastSyncAt && !isSyncCooldown ? "#d1ecf1" : "#f8d7da",
                    border:
                      lastSyncAt && !isSyncCooldown
                        ? "1px solid #bee5eb"
                        : "1px solid #f5c6cb",
                    color:
                      lastSyncAt && !isSyncCooldown ? "#0c5460" : "#721c24",
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "12px 16px",
                    borderRadius: 8,
                    marginBottom: 14,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Filtered By {filterLabel.join(", ")}
                  </div>
                  <div>
                    {lastSyncAt && !isSyncCooldown
                      ? "Data tidak ditemukan di SATUSEHAT untuk periode ini."
                      : "Belum sinkronisasi dengan SATUSEHAT untuk periode ini."}
                    {lastSyncAt ? (
                      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                        Terakhir sinkronisasi: {formatLastSyncAt(lastSyncAt)}
                      </div>
                    ) : (
                      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                        Terakhir sinkronisasi: -
                      </div>
                    )}
                  </div>
                </div>
              )}

            {hasFilteredSatusehat && dataRL.length > 0 && (
              <Table className={style.rlTable}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Bulan</th>
                    <th>Pengunjung Baru</th>
                    <th>Pengunjung Lama</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((item, idx) => (
                    <tr key={`${item.month || "month"}-${idx}`} style={{ textAlign: "center" }}>
                      <td>{idx + 1}</td>
                      <td>{item.month || "-"}</td>
                      <td>{item.new_visitors || 0}</td>
                      <td>{item.returning_visitors || 0}</td>
                      <td>{item.total_visitors || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
