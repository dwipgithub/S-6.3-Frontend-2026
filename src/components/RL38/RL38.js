import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { downloadExcel } from "react-export-table-to-excel";
import style from "./RL38.module.css";
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

// ==========================================
// KOMPONEN UTAMA (TAB MENU WRAPPER)
// ==========================================
export default function RL38() {
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
          <h4 className={style.pageHeader}>RL 3.8 - Laboratorium</h4>

          {/* NAVIGASI TAB UTAMA */}
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
// KOMPONEN TAB 1: SIRS ONLINE (RL 3.8)
// ==========================================
function TabOne() {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState("2026");
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
  const [totalJumlahLaki, setTotalJumlahLaki] = useState(0);
  const [totalJumlahPerempuan, setTotalJumlahPerempuan] = useState(0);
  const [totalRataLaki, setTotalRataLaki] = useState(0);
  const [totalRataPerempuan, setTotalRataPerempuan] = useState(0);
  const [spinner, setSpinner] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const [activeTabInner, setActiveTabInner] = useState("tab1");
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [submittedBulan, setSubmittedBulan] = useState(null);
  const [submittedTahun, setSubmittedTahun] = useState(null);
  const [submittedRumahSakit, setSubmittedRumahSakit] = useState(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

  useEffect(() => {
    if (activeTabInner === "tab2" && submittedRumahSakit && submittedRumahSakit.id && submittedBulan !== null && submittedTahun) {
      getValidasi();
    }
  }, [submittedBulan, submittedTahun, submittedRumahSakit, activeTabInner]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setUser(decoded);
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      } else if (decoded.jenisUserId === 4) {
        if (!rumahSakit || !rumahSakit.id) {
          showRumahSakit(decoded.satKerId, accessToken);
        }
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
      if (
        ["post", "put", "patch", "delete"].includes(
          config.method?.toLowerCase()
        )
      ) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET
        ).toString();

        config.headers = config.headers || {};
        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const getBulan = async () => {
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

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { kabKotaId },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id, tokenOverride) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${tokenOverride || token}` },
      });
      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getRL = async (e) => {
    e.preventDefault();
    setSpinner(true);
    if (!rumahSakit || !rumahSakit.id || rumahSakit.id === 0) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      setSpinner(false);
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    
    setValidasiId(null);
    setStatusValidasi(0);
    setKeteranganValidasi("");
    setDataValidasi(null);

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

      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapan",
        customConfig
      );

      if (!detailkegiatan.data.data || detailkegiatan.data.data.length === 0) {
        setDataRL([]);
        toast("Data RL tidak ditemukan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSpinner(false);
        handleClose();
        return;
      }

      const rlTemplate = detailkegiatan.data.data.map((value) => {
        return {
          id: value.id,
          groupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.no,
          groupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.nama,
          subGroupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.id,
          subGroupNo:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.no,
          subGroupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.nama,
          jenisKegiatanId: value.rl_tiga_titik_delapan_pemeriksaan.id,
          jenisKegiatanNo: value.rl_tiga_titik_delapan_pemeriksaan.no,
          jenisKegiatanNama: value.rl_tiga_titik_delapan_pemeriksaan.nama,
          jumlahLaki: value.jumlahLaki,
          jumlahPerempuan: value.jumlahPerempuan,
          rataLaki: value.rataLaki,
          rataPerempuan: value.rataPerempuan,
        };
      });

      let subGroups = [];
      rlTemplate.reduce(function (res, value) {
        if (!res[value.subGroupId]) {
          res[value.subGroupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            subGroupId: value.subGroupId,
            subGroupNo: value.subGroupNo,
            subGroupNama: value.subGroupNama,
            subGroupJumlahLaki: 0,
            subGroupJumlahPerempuan: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupJumlahLaki += value.jumlahLaki;
        res[value.subGroupId].subGroupJumlahPerempuan += value.jumlahPerempuan;
        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupJumlahLaki: 0,
            groupJumlahPerempuan: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupJumlahLaki += value.subGroupJumlahLaki;
        res[value.groupId].groupJumlahPerempuan += value.subGroupJumlahPerempuan;
        return res;
      }, {});

      let satu = [];
      let dua = [];

      subGroups.forEach((element2) => {
        const filterData2 = rlTemplate.filter((value2) => value2.subGroupId === element2.subGroupId);
        dua.push({
          groupId: element2.groupId,
          subGroupId: element2.subGroupId,
          subGroupNo: element2.subGroupNo,
          subGroupNama: element2.subGroupNama,
          subGroupJumlahLaki: element2.subGroupJumlahLaki,
          subGroupJumlahPerempuan: element2.subGroupJumlahPerempuan,
          kegiatan: filterData2,
        });
      });

      groups.forEach((element) => {
        const filterData = dua.filter((value) => value.groupId === element.groupId);
        satu.push({
          groupId: element.groupId,
          groupNama: element.groupNama,
          groupJumlahLaki: element.groupJumlahLaki,
          groupJumlahPerempuan: element.groupJumlahPerempuan,
          details: filterData,
        });
      });

      let totalL = 0;
      let totalP = 0;
      let totalRL = 0;
      let totalRP = 0;

      satu.forEach((value) => {
        if (value.groupNama != null) {
          value.details.forEach((value2) => {
            value2.kegiatan.forEach((value3) => {
              totalL += value3.jumlahLaki;
              totalP += value3.jumlahPerempuan;
              totalRL += value3.rataLaki;
              totalRP += value3.rataPerempuan;
            });
          });
        }
      });

      setTotalJumlahLaki(totalL);
      setTotalJumlahPerempuan(totalP);
      setTotalRataLaki(totalRL);
      setTotalRataPerempuan(totalRP);
      setDataRL(satu);
      setNamaFile("rl38_" + rumahSakit.id + "_".concat(String(tahun).concat("-").concat(bulan).concat("-01")));
      handleClose();
      setSpinner(false);

      setSubmittedBulan(bulan);
      setSubmittedTahun(tahun);
      setSubmittedRumahSakit(rumahSakit);

      if (activeTabInner === "tab2") {
        getValidasi();
      }
    } catch (error) {
      console.log(error);
      setSpinner(false);
      toast("Gagal mengambil data RL", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitikdelapan/${id}`, customConfig);
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      getRL({ preventDefault: () => {} });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    }
  };

  const getValidasi = async () => {
    try {
      if (!submittedRumahSakit || !submittedRumahSakit.id) return;
      const periode = String(submittedTahun).concat("-").concat(submittedBulan);
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: submittedRumahSakit.id,
          periode: periode,
        },
      };
      const response = await axiosJWT.get("/apisirs6v2/rltigatitikdelapanvalidasi", customConfig);

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
      console.log(error);
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();

    if (!submittedRumahSakit || !submittedRumahSakit.id) {
      toast("Rumah sakit harus dipilih dan filter diterapkan terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    if (parseInt(statusValidasi, 10) === 0) {
      toast("Status harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
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

      let payload = { statusValidasiId: parseInt(statusValidasi, 10) };
      if (user.jenisUserId !== 4) {
        payload.catatan = keteranganValidasi;
      }

      if (validasiId) {
        await axiosJWT.patch(`/apisirs6v2/rltigatitikdelapanvalidasi/${validasiId}`, payload, customConfig);
        toast("Data Validasi Berhasil Diperbarui", { position: toast.POSITION.TOP_RIGHT, autoClose: 3000 });
      } else {
        let createPayload = {
          rsId: submittedRumahSakit.id,
          periode: String(submittedTahun).concat("-").concat(submittedBulan),
          jenisPeriode: 1,
          statusValidasiId: parseInt(statusValidasi, 10),
        };
        if (user.jenisUserId !== 4) createPayload.catatan = keteranganValidasi;

        const response = await axiosJWT.post("/apisirs6v2/rltigatitikdelapanvalidasi", createPayload, customConfig);
        setValidasiId(response.data.data.id);
        toast("Data Validasi Berhasil Disimpan", { position: toast.POSITION.TOP_RIGHT, autoClose: 3000 });
      }

      setTimeout(() => { getValidasi(); }, 1500);
    } catch (error) {
      toast(`Data tidak bisa disimpan karena: ${error.response?.data?.message || error.message}`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        { label: "Yes", onClick: () => deleteRL(id) },
        { label: "No" },
      ],
    });
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const { jenisUserId, satKerId } = user;
    setBulan("01");
    if (jenisUserId === 1) getProvinsi();
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
      console.log(error);
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
      console.log(error);
    }
  };

  const handleDownloadExcel = () => {
    const header = ["No", "Jenis Pemeriksaan", "Jumlah Pemeriksaan (Laki-laki)", "Jumlah Pemeriksaan (Perempuan)", "Rata-Rata (Laki-laki)", "Rata-Rata (Perempuan)"];
    const body = [];

    dataRL.forEach(value => {
      if (value.groupNama != null) {
        value.details.forEach(value2 => {
          value2.kegiatan.forEach(value3 => {
            body.push([
              value3.jenisKegiatanNo,
              value3.jenisKegiatanNama,
              value3.jumlahLaki,
              value3.jumlahPerempuan,
              value3.rataLaki,
              value3.rataPerempuan
            ]);
          });
        });
      }
    });

    body.push(["99", "TOTAL", totalJumlahLaki, totalJumlahPerempuan, totalRataLaki, totalRataPerempuan]);

    downloadExcel({
      fileName: namafile || "RL_3_8",
      sheet: "Data RL 38",
      tablePayload: { header, body },
    });
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

      <ToastContainer autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {/* MODAL FILTER */}
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter SIRS</Modal.Title>
        </Modal.Header>

        <form onSubmit={getRL}>
          <Modal.Body>
            {user.jenisUserId === 1 && (
              <>
                <div className="form-floating mb-2">
                  <select className="form-select" onChange={(e) => getKabKota(e.target.value)}>
                    <option value={0}>Pilih</option>
                    {daftarProvinsi.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label>Provinsi</label>
                </div>

                <div className="form-floating mb-2">
                  <select className="form-select" onChange={(e) => getRumahSakit(e.target.value)}>
                    <option value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label>Kab/Kota</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    className="form-select"
                    value={rumahSakit?.id || 0}
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option value={0}>Pilih</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label>Rumah Sakit</label>
                </div>
              </>
            )}

            {user.jenisUserId === 2 && (
              <>
                <div className="form-floating mb-2">
                  <select className="form-select" onChange={(e) => getRumahSakit(e.target.value)}>
                    <option value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label>Kab/Kota</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    className="form-select"
                    value={rumahSakit?.id || 0}
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option value={0}>Pilih</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label>Rumah Sakit</label>
                </div>
              </>
            )}

            {user.jenisUserId === 3 && (
              <div className="form-floating mb-2">
                <select
                  className="form-select"
                  value={rumahSakit?.id || 0}
                  onChange={(e) => showRumahSakit(e.target.value)}
                >
                  <option value={0}>Pilih</option>
                  {daftarRumahSakit.map((nilai) => (
                    <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
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

      {/* NAVBAR AKSIS */}
      <div className={style.toolbar}>
        {user.jenisUserId === 4 && (
          <Link to="/rl38/tambah/" className={style.btnPrimary} style={{ textDecoration: "none" }}>
            Tambah
          </Link>
        )}
        <button type="button" className={style.btnPrimary} onClick={handleShow}>
          Filter
        </button>
        <button type="button" className={style.btnPrimary} onClick={handleDownloadExcel}>
          Download
        </button>
      </div>

      {filterLabel.length > 0 && (
        <div>
          <h5 style={{ fontSize: "14px" }}>
            filtered by {filterLabel.join(", ")}
          </h5>
        </div>
      )}

      {/* INNER TABS */}
      <ul className={`nav nav-tabs ${style.navTabs}`}>
        <li className={`nav-item ${style.navItem}`}>
          <button
            type="button"
            className={`${style.navLink} ${activeTabInner === "tab1" ? style.active : ""}`}
            onClick={() => setActiveTabInner("tab1")}
          >
            Data
          </button>
        </li>
        <li className={`nav-item ${style.navItem}`}>
          <button
            type="button"
            className={`${style.navLink} ${activeTabInner === "tab2" ? style.active : ""}`}
            onClick={() => setActiveTabInner("tab2")}
          >
            Validasi
          </button>
        </li>
      </ul>

      <div className={`tab-content ${style.tabContent}`}>
        {/* TAB 1: DATA TABLE */}
        <div className={`tab-pane fade ${activeTabInner === "tab1" ? "show active" : ""}`}>
          <div className={style["table-container"]}>
            <table className={style["table"]} ref={tableRef}>
              <thead className={style["thead"]}>
                <tr className="main-header-row">
                  <th style={{ width: "4%" }} rowSpan={2} className={style["sticky-header-view"]}>
                    No.
                  </th>
                  {user.jenisUserId === 4 && (
                    <th style={{ width: "15%" }} rowSpan={2} className={style["sticky-header-view"]}>
                      Aksi
                    </th>
                  )}
                  <th style={{ width: "50%", textAlign: "center" }} rowSpan={2} className={style["sticky-header-view"]}>
                    Jenis Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                    Jumlah Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                    Rata-Rata Pemeriksaan
                  </th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  if (value.groupNama != null) {
                    return (
                      <React.Fragment key={index}>
                        <tr style={{ textAlign: "center", backgroundColor: "#C4DFAA", fontWeight: "bold" }}>
                          <td className={style["sticky-column"]}>{value.groupId}</td>
                          {user.jenisUserId === 4 && <td className={style["sticky-column"]}></td>}
                          <td className={style["sticky-column"]}>{value.groupNama}</td>
                          <td>{parseInt(value.groupJumlahLaki || 0)}</td>
                          <td>{parseInt(value.groupJumlahPerempuan || 0)}</td>
                          <td></td>
                          <td></td>
                        </tr>
                        {value.details.map((value2, index2) => (
                          <React.Fragment key={index2}>
                            <tr style={{ textAlign: "center", backgroundColor: "#DCE8C8", fontWeight: "bold" }}>
                              <td className={style["sticky-column"]}>{value2.subGroupNo}</td>
                              {user.jenisUserId === 4 && <td className={style["sticky-column"]}></td>}
                              <td className={style["sticky-column"]}>{value2.subGroupNama}</td>
                              <td>{parseInt(value2.subGroupJumlahLaki || 0)}</td>
                              <td>{parseInt(value2.subGroupJumlahPerempuan || 0)}</td>
                              <td></td>
                              <td></td>
                            </tr>
                            {value2.kegiatan.map((value3, index3) => (
                              <tr key={index3}>
                                <td className={style["sticky-column"]}>{value3.jenisKegiatanNo}</td>
                                {user.jenisUserId === 4 && (
                                  <td className={style["sticky-column"]} style={{ textAlign: "center", verticalAlign: "middle" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                      <button className={style.btnDanger} type="button" onClick={() => hapus(value3.id)}>
                                        Hapus
                                      </button>
                                      {value3.jenisKegiatanNama !== "Tidak Ada Data" && (
                                        <Link to={`/rl38/ubah/${value3.id}`} className={style.btnWarning} style={{ textDecoration: "none" }}>
                                          Ubah
                                        </Link>
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td className={style["sticky-column"]}>&emsp;{value3.jenisKegiatanNama}</td>
                                <td>{parseInt(value3.jumlahLaki || 0)}</td>
                                <td>{parseInt(value3.jumlahPerempuan || 0)}</td>
                                <td>{parseFloat(value3.rataLaki || 0).toFixed(3)}</td>
                                <td>{parseFloat(value3.rataPerempuan || 0).toFixed(3)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  }
                  return null;
                })}

                {dataRL.length > 0 && (
                  <tr style={{ textAlign: "center", backgroundColor: "#C4DFAA", fontWeight: "bold" }}>
                    <td></td>
                    {user.jenisUserId === 4 ? <td colSpan={2}>TOTAL</td> : <td colSpan={1}>TOTAL</td>}
                    <td>{parseInt(totalJumlahLaki || 0)}</td>
                    <td>{parseInt(totalJumlahPerempuan || 0)}</td>
                    <td>{parseFloat(totalRataLaki || 0).toFixed(3)}</td>
                    <td>{parseFloat(totalRataPerempuan || 0).toFixed(3)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAB 2: VALIDASI */}
        <div className={`tab-pane fade ${activeTabInner === "tab2" ? "show active" : ""}`}>
          <div className={style.validasiCard}>
            <h3 className={style.validasiCardTitle}>Validasi RL 3.8</h3>
            {dataRL.length === 0 ? (
              <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
              </div>
            ) : !dataValidasi && user.jenisUserId === 4 ? (
              <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                <strong>Data Belum di Validasi</strong>
              </div>
            ) : (
              <>
                {dataValidasi && (
                  <div style={{ backgroundColor: "#f0f0f0", padding: "12px", borderRadius: "4px", marginBottom: "15px" }}>
                    <div style={{ display: "flex", marginBottom: "4px" }}>
                      <div style={{ width: "90px", fontWeight: "600" }}>Status</div>
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
                        <div style={{ width: "90px", fontWeight: "600" }}>Catatan</div>
                        <div style={{ width: "10px" }}>:</div>
                        <div>{dataValidasi.catatan || dataValidasi.keterangan}</div>
                      </div>
                    )}
                    <div style={{ display: "flex" }}>
                      <div style={{ width: "90px", fontWeight: "600" }}>Dibuat</div>
                      <div style={{ width: "10px" }}>:</div>
                      <div>{new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}</div>
                    </div>
                  </div>
                )}

                {dataValidasi && dataValidasi.statusValidasiId === 3 ? (
                  <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                    <strong>Data telah divalidasi.</strong>
                  </div>
                ) : (
                  <form onSubmit={simpanValidasi}>
                    <div className={style.validasiFormGroup}>
                      <label>Status</label>
                      <select value={statusValidasi} onChange={(e) => setStatusValidasi(e.target.value)}>
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
                          onChange={(e) => setKeteranganValidasi(e.target.value)}
                          rows={4}
                          value={keteranganValidasi}
                        />
                      </div>
                    )}

                    <button type="submit" className={style.btnPrimary}>
                      <HiSaveAs size={20} /> {validasiId ? "Perbarui" : "Simpan"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONEN TAB 2: SATUSEHAT (RL 3.8)
// ==========================================
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
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB";
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
    isBackground = false,
    currentToken = token,
    currentUser = user,
    currentTahun = tahun,
    currentBulan = bulan
  ) => {
    if (!currentToken || !currentUser.satKerId) return;

    if (!isBackground) setLoadingTable(true);

    try {
      const res = await axiosJWT.get("/apisirs6v2/rltigatitikdelapansatusehat", {
        headers: { Authorization: `Bearer ${currentToken}` },
        params: {
          rsId: currentUser.satKerId,
          periode: `${currentTahun}-${currentBulan}`,
        },
      });

      const newSync = res.data.sync ?? {};
      setDataRL(res.data.data?.group_pemeriksaan ?? []);
      setSync(newSync);

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
        const res = await axiosJWT.get("/apisirs6v2/rltigatitikdelapansatusehat", {
          headers: { Authorization: `Bearer ${currentToken}` },
          params: {
            rsId: currentUser.satKerId,
            periode: `${currentTahun}-${currentBulan}`,
          },
        });

        const newSync = res.data.sync ?? {};
        setDataRL(res.data.data?.group_pemeriksaan ?? []);
        setSync(newSync);

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

    await fetchData(false, token, user, tahun, bulan);

    setSync((prevSync) => {
      if (prevSync.isUpdating || prevSync.status === "syncing") {
        setLoadingTable(true);
        startPolling(token, user, tahun, bulan);
      }
      return prevSync;
    });
  };

  const getRemainingSeconds = () => {
    if (!sync?.lastSync) return 0;
    const lastSyncTime = new Date(sync.lastSync).getTime();
    if (isNaN(lastSyncTime)) return 0;

    const elapsedSeconds = Math.floor((now - lastSyncTime) / 1000);
    const remaining = MANUAL_SYNC_COOLDOWN_SEC - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  };

  const remainingSeconds = getRemainingSeconds();

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
        "/apisirs6v2/rltigatitikdelapansatusehat/sync",
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
      const res = await axiosJWT.get("/apisirs6v2/rltigatitikdelapansatusehat", {
        headers: { Authorization: `Bearer ${token}` },
        params: { rsId: user.satKerId, periode: `${tahun}-${bulan}` },
      });

      const groups = res.data.data?.group_pemeriksaan || [];
      const namaBulanSelected = daftarBulan.find((b) => b.value === bulan)?.key || bulan;
      const namaRumahSakit = user?.satKerNama || user?.rsNama || rumahSakit?.nama || "-";

      let grandTotalLK = 0;
      let grandTotalPR = 0;
      let sumAvgLK = 0;
      let sumAvgPR = 0;
      let totalItems = 0;

      // 1. Susun Baris Data Tabel
      let tableRowsHtml = "";

      groups.forEach((group) => {
        const groupMatch = group.nama_group?.trim().match(/^([A-Za-z0-9]+)\s+(.*)$/);
        const groupNo = groupMatch ? groupMatch[1] : "";
        const groupName = groupMatch ? groupMatch[2] : group.nama_group;

        const groupTotalLK = group.pemeriksaan?.reduce(
          (acc, item) => acc + parseInt(item.jumlah_pemeriksaan?.laki_laki || 0),
          0
        ) || 0;
        const groupTotalPR = group.pemeriksaan?.reduce(
          (acc, item) => acc + parseInt(item.jumlah_pemeriksaan?.perempuan || 0),
          0
        ) || 0;

        // Baris Header Group Utama
        tableRowsHtml += `
          <tr style="font-weight: bold;">
            <td style="border: 1px solid black; text-align: center;">${groupNo}</td>
            <td style="border: 1px solid black;">${namaRumahSakit}</td>
            <td style="border: 1px solid black;">${groupName}</td>
            <td style="border: 1px solid black; text-align: right;">${groupTotalLK}</td>
            <td style="border: 1px solid black; text-align: right;">${groupTotalPR}</td>
            <td style="border: 1px solid black;"></td>
            <td style="border: 1px solid black;"></td>
          </tr>
        `;

        if (group.pemeriksaan && group.pemeriksaan.length > 0) {
          group.pemeriksaan.forEach((item) => {
            const textRaw = item.pemeriksaan?.trim() || "";
            const match = textRaw.match(/^(\d+(\.\d+)*)\s+(.*)$/);
            const noCode = match ? match[1] : item.pemeriksaan_id || "";
            const cleanName = match ? match[3] : textRaw;
            const isSubHeader = !/^\d+\.\d+/.test(noCode || textRaw);

            const lk = parseInt(item.jumlah_pemeriksaan?.laki_laki || 0);
            const pr = parseInt(item.jumlah_pemeriksaan?.perempuan || 0);

            if (isSubHeader) {
              // Baris Sub-Group
              tableRowsHtml += `
                <tr style="font-weight: bold;">
                  <td style="border: 1px solid black; text-align: center;">${noCode || item.pemeriksaan_id}</td>
                  <td style="border: 1px solid black;">${namaRumahSakit}</td>
                  <td style="border: 1px solid black;">${cleanName}</td>
                  <td style="border: 1px solid black; text-align: right;">${lk}</td>
                  <td style="border: 1px solid black; text-align: right;">${pr}</td>
                  <td style="border: 1px solid black;"></td>
                  <td style="border: 1px solid black;"></td>
                </tr>
              `;
            } else {
              // Baris Detail Kegiatan
              const avgLk = parseFloat(item.nilai_rata_rata?.laki_laki || 0);
              const avgPr = parseFloat(item.nilai_rata_rata?.perempuan || 0);

              grandTotalLK += lk;
              grandTotalPR += pr;
              sumAvgLK += avgLk;
              sumAvgPR += avgPr;
              totalItems++;

              tableRowsHtml += `
                <tr>
                  <td style="border: 1px solid black; text-align: center;">${noCode || item.pemeriksaan_id}</td>
                  <td style="border: 1px solid black;">${namaRumahSakit}</td>
                  <td style="border: 1px solid black; padding-left: 15px;">${cleanName}</td>
                  <td style="border: 1px solid black; text-align: right;">${lk}</td>
                  <td style="border: 1px solid black; text-align: right;">${pr}</td>
                  <td style="border: 1px solid black; text-align: right;">${avgLk.toFixed(3)}</td>
                  <td style="border: 1px solid black; text-align: right;">${avgPr.toFixed(3)}</td>
                </tr>
              `;
            }
          });
        }
      });

      // Baris TOTAL
      const overallAvgLK = totalItems > 0 ? (sumAvgLK / totalItems).toFixed(3) : "0.000";
      const overallAvgPR = totalItems > 0 ? (sumAvgPR / totalItems).toFixed(3) : "0.000";

      tableRowsHtml += `
        <tr style="font-weight: bold;">
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;">TOTAL</td>
          <td style="border: 1px solid black; text-align: right;">${grandTotalLK}</td>
          <td style="border: 1px solid black; text-align: right;">${grandTotalPR}</td>
          <td style="border: 1px solid black; text-align: right;">${overallAvgLK}</td>
          <td style="border: 1px solid black; text-align: right;">${overallAvgPR}</td>
        </tr>
      `;

      // 2. Format Elemen HTML Lengkap dengan Inline Style
      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>RL 3.8 SATUSEHAT</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            .bold { font-weight: bold; }
            td { mso-number-format:"\\@"; }
            .num { mso-number-format:"General"; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="3" class="bold" style="font-size: 14pt;">SIRS ONLINE RL 3.8 - SATUSEHAT</td></tr>
            <tr><td></td></tr>
            <tr><td colspan="3" class="bold">Periode Data</td></tr>
            <tr><td colspan="3" class="bold">Bulan : ${namaBulanSelected}</td></tr>
            <tr><td colspan="3" class="bold">Tahun: ${tahun}</td></tr>
            <tr><td></td></tr>
            <!-- Header Tabel -->
            <thead>
              <tr style="font-weight: bold;">
                <th style="border: 1px solid black;" rowspan="2">No</th>
                <th style="border: 1px solid black;" rowspan="2">Rumah Sakit</th>
                <th style="border: 1px solid black;" rowspan="2">Jenis Pemeriksaan</th>
                <th style="border: 1px solid black;" colspan="2">Jumlah Pemeriksaan</th>
                <th style="border: 1px solid black;" colspan="2">Rata-Rata Pemeriksaan</th>
              </tr>
              <tr style="font-weight: bold;">
                <th style="border: 1px solid black;">Laki-Laki</th>
                <th style="border: 1px solid black;">Perempuan</th>
                <th style="border: 1px solid black;">Laki-Laki</th>
                <th style="border: 1px solid black;">Perempuan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // 3. Proses Download File Excel
      const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SIRS_ONLINE_RL_3.8_SATUSEHAT_${tahun}_${bulan}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
                <div className={style["table-container"]}>
                  <table className={style["table"]} style={{ width: "100%"}}>
                    <thead className={style["thead"]}>
                      <tr className="main-header-row">
                        <th style={{ width: "7%" }} rowSpan={2} className={style["sticky-header-view"]}>
                          No
                        </th>
                        <th style={{ width: "50%", textAlign: "center" }} rowSpan={2} className={style["sticky-header-view"]}>
                          Jenis Pemeriksaan
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                          Jumlah Pemeriksaan
                        </th>
                        <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                          Rata-Rata Pemeriksaan
                        </th>
                      </tr>
                      <tr className={style["subheader-row"]}>
                        <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                        <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                        <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                      </tr>
                    </thead>      
                    <tbody>
                      {!isFilterApplied ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                            Silakan pilih Filter terlebih dahulu.
                          </td>
                        </tr>
                      ) : dataRL.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                            Data SATUSEHAT tidak ditemukan.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {dataRL.map((group, gIdx) => {
                            // Hitung total Laki-laki & Perempuan per Group
                            const groupTotalLK = group.pemeriksaan?.reduce(
                              (acc, item) => acc + parseInt(item.jumlah_pemeriksaan?.laki_laki || 0),
                              0
                            ) || 0;

                            const groupTotalPR = group.pemeriksaan?.reduce(
                              (acc, item) => acc + parseInt(item.jumlah_pemeriksaan?.perempuan || 0),
                              0
                            ) || 0;

                            const groupMatch = group.nama_group?.trim().match(/^([A-Za-z0-9]+)\s+(.*)$/);
                            const groupNo = groupMatch ? groupMatch[1] : "";
                            const groupName = groupMatch ? groupMatch[2] : group.nama_group;

                            return (
                              <React.Fragment key={gIdx}>
                                {/* HEADER GROUP (Level 1) */}
                                <tr style={{ backgroundColor: "#C4DFAA", fontWeight: "bold" }}>
                                  <td style={{ textAlign: "center" }}>
                                    {groupNo}
                                  </td>
                                  <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                                    {groupName}
                                  </td>
                                  <td style={{ textAlign: "center" }}>{groupTotalLK}</td>
                                  <td style={{ textAlign: "center" }}>{groupTotalPR}</td>
                                  <td style={{ textAlign: "center" }}></td>
                                  <td style={{ textAlign: "center" }}></td>
                                </tr>

                                {/* DETAIL PEMERIKSAAN (Level 2 Sub Group / Level 3 Kegiatan) */}
                                {group.pemeriksaan &&
                                  group.pemeriksaan.map((item, pIdx) => {
                                    const textRaw = item.pemeriksaan?.trim() || "";

                                    const match = textRaw.match(/^(\d+(\.\d+)*)\s+(.*)$/);
                                    const noCode = match ? match[1] : "";
                                    const cleanName = match ? match[3] : textRaw;
                                    // Membedakan Sub Group vs Detail Kegiatan berdasarkan pola penomoran (seperti 8.1 vs 8.1.1)
                                    const isSubHeader = !/^\d+\.\d+/.test(noCode || textRaw);

                                    return (
                                      <tr
                                        key={pIdx}
                                        style={isSubHeader ? { backgroundColor: "#DCE8C8", fontWeight: "bold" } : {}}
                                      >
                                        <td style={{ textAlign: "center" }}>
                                          {noCode || item.pemeriksaan_id}
                                        </td>
                                        <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                                          {isSubHeader ? cleanName : `\u2003${cleanName}`}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          {parseInt(item.jumlah_pemeriksaan?.laki_laki || 0)}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          {parseInt(item.jumlah_pemeriksaan?.perempuan || 0)}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          {isSubHeader
                                            ? ""
                                            : parseFloat(item.nilai_rata_rata?.laki_laki || 0).toFixed(3)}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          {isSubHeader
                                            ? ""
                                            : parseFloat(item.nilai_rata_rata?.perempuan || 0).toFixed(3)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </React.Fragment>
                            );
                          })}

                          {/* TOTAL */}
                          {(() => {
                            let grandTotalLK = 0;
                            let grandTotalPR = 0;
                            let sumAvgLK = 0;
                            let sumAvgPR = 0;
                            let totalItems = 0;

                            dataRL.forEach((group) => {
                              group.pemeriksaan?.forEach((item) => {
                                const textRaw = item.pemeriksaan?.trim() || "";
                                const match = textRaw.match(/^(\d+(\.\d+)*)\s+(.*)$/);
                                const noCode = match ? match[1] : "";
                                const isSubHeader = !/^\d+\.\d+/.test(noCode || textRaw);

                                // Hanya menjumlahkan detail kegiatan (bukan sub group) agar tidak terhitung dua kali
                                if (!isSubHeader) {
                                  grandTotalLK += parseInt(item.jumlah_pemeriksaan?.laki_laki || 0);
                                  grandTotalPR += parseInt(item.jumlah_pemeriksaan?.perempuan || 0);
                                  sumAvgLK += parseFloat(item.nilai_rata_rata?.laki_laki || 0);
                                  sumAvgPR += parseFloat(item.nilai_rata_rata?.perempuan || 0);
                                  totalItems++;
                                }
                              });
                            });

                            const overallAvgLK = totalItems > 0 ? (sumAvgLK / totalItems).toFixed(3) : "0.000";
                            const overallAvgPR = totalItems > 0 ? (sumAvgPR / totalItems).toFixed(3) : "0.000";

                            return (
                              <tr style={{ backgroundColor: "#C4DFAA", fontWeight: "bold" }}>
                                <td></td>
                                <td className={style["sticky-column"]} style={{ textAlign: "center" }}>
                                  TOTAL
                                </td>
                                <td style={{ textAlign: "center" }}>{grandTotalLK}</td>
                                <td style={{ textAlign: "center" }}>{grandTotalPR}</td>
                                <td style={{ textAlign: "center" }}>{overallAvgLK}</td>
                                <td style={{ textAlign: "center" }}>{overallAvgPR}</td>
                              </tr>
                            );
                          })()}
                        </>
                      )}
                    </tbody>
                  </table>    
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}