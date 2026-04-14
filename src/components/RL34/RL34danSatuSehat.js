import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL34.module.css";
import { HiSaveAs } from "react-icons/hi";
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

    const body = dataRL.map((value, index) => {
      const data = [
        value.id,
        value.jenis_pengunjung_rl_tiga_titik_tempat.nama,
        value.jumlah,
      ];

      return data;
    });

    downloadExcel({
      fileName: "RL_3_4",
      sheet: "react-export-table-to-excel",
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
                                  {value.jenis_pengunjung_rl_tiga_titik_tempat.nama !== "Tidak Ada Data" && (
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
                                  {value.jenis_pengunjung_rl_tiga_titik_tempat.nama}
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
  const [bulan, setBulan] = useState(1);
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
  const { CSRFToken } = useCSRFTokenContext();
  // Fetch RL 3.4 Satusehat Local sesuai filter
  const getSatusehatRL34 = async (e) => {
    if (e) e.preventDefault();
    setSpinner(true);
    // Set filter label for display
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
    try {
      // Ganti ke API Satusehat utama
      const params = {};
      if (rumahSakit && rumahSakit.id) params.rsId = rumahSakit.id;
      if (tahun && bulan)
        params.periode = `${tahun}-${bulan.toString().padStart(2, "0")}`;
      const customConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatsatusehat",
        customConfig
      );
      const apiData = response.data.data;
      // Jika apiData array, pakai langsung. Jika object, cek jika punya property data, ambil dan bungkus array.
      let arr = [];
      if (Array.isArray(apiData)) {
        arr = apiData;
      } else if (apiData && typeof apiData === "object") {
        // Jika ada property data di dalamnya, ambil property data
        if (apiData.data && typeof apiData.data === "object") {
          arr = [apiData.data];
        } else {
          arr = [apiData];
        }
      }
      setDataRL(arr);
    } catch (error) {
      setDataRL([]);
      console.log(error);
    }
    setSpinner(false);
    handleClose();
  };

  useEffect(() => {
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun(date.getFullYear());
      return date.getFullYear();
    };
    getLastYear();
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
    const header = [
      "No.",
      "Bulan",
      "Pengunjung Baru",
      "Pengunjung Lama",
      "Total",
    ];
    const body = (Array.isArray(dataRL) ? dataRL : []).map((item, idx) => [
      idx + 1,
      item.month,
      item.organization_id,
      item.new_visitors,
      item.returning_visitors,
      item.total_visitors,
    ]);
    downloadExcel({
      fileName: "RL_3_4_SatuSehat",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body,
      },
    });
  }

  return (
    <div className="container">
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getSatusehatRL34}>
          <Modal.Body>
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
                onChange={tahunChangeHandler}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className={style.btnPrimary} type="submit">
              Tampilkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className={style.btnPrimary}
                to={`/satusehatrl34/`}
                style={{ marginRight: "5px", fontSize: "18px" }}
              >
                Update SatuSehat
              </Link>
            ) : (
              <></>
            )}

            <button
              className={style.btnPrimary}
              style={{ fontSize: "18px" }}
              onClick={() => setShow(true)}
            >
              Filter
            </button>
            <button
              className={style.btnPrimary}
              style={{ fontSize: "18px", marginLeft: "5px" }}
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
              {Array.isArray(dataRL) && dataRL.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                (Array.isArray(dataRL) ? dataRL : []).map((item, idx) => (
                  <tr key={idx} style={{ textAlign: "center" }}>
                    <td>{idx + 1}</td>
                    <td>{item.month}</td>
                    <td>{item.new_visitors}</td>
                    <td>{item.returning_visitors}</td>
                    <td>{item.total_visitors}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
