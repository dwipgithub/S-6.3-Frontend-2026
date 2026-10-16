import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { downloadExcel } from "react-export-table-to-excel";
import style from "./RL319.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { getStatusSatset } from "../../api/status_satset.js";
import { FaSlidersH, FaDownload, FaSync } from "react-icons/fa";
import Spinner from "react-bootstrap/Spinner";
import CryptoJS from "crypto-js";
import {
  FaSyncAlt,
  FaFileExcel,
  FaInfoCircle,
  FaDatabase,
  FaCalendarAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { SiMicrosoftexcel } from "react-icons/si";
import { FaFilter } from "react-icons/fa";
import Pagination from "../Pagination/Pagination.js";
import SyncButton from "../SyncButton/SyncButton.js";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
    },
  );

  return (
    <div
      className="container"
      style={{
        marginTop: "20px",
        marginBottom: "70px",
      }}
    >
      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}> RL 3.19 - Cara bayar</h4>

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
            {statusSatset === 1 && (
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
  const [tahun, setTahun] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState(null);
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const tableRef = useRef(null);

  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [KeteranganValidasiDb, setKeteranganValidasiDb] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const [selectedRsID, setSelectedRsID] = useState(null);
  const [selectedProvId, setSelectedProvId] = useState(null);
  const [selectedKabId, setselectedKabId] = useState(null);

  useEffect(() => {
    refreshToken();
    const currentYear = new Date().getFullYear();
    setTahun(currentYear.toString());

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
          config.method?.toLowerCase(),
        )
      ) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET,
        ).toString();

        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

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
        "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
        customConfig,
      );

      if (results.data.data != null && results.data.data.length > 0) {
        setidValidasi(results.data.data[0].id);
        setidValidasiSubmited(results.data.data[0].statusValidasiId);
        if (user.jenisUserId === 3) {
          setStatusValidasi(1);
        } else if (user.jenisUserId === 4) {
          setStatusValidasi(2);
        } else {
          setStatusValidasi("");
        }
        setKeteranganValidasi(results.data.data[0].catatan || "");
        setKeteranganValidasiDb(results.data.data[0].catatan || "");
        setTglValidasi(results.data.data[0].modifiedAt);
        setIsValidated(results.data.data[0].statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi(1);
        setKeteranganValidasi("");
        setKeteranganValidasiDb("");
        setTglValidasi("");
        setIsValidated(false);
      }
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const getDataRLTigaTitikSembilanBelas = async (e) => {
    e.preventDefault();
    if (
      user.jenisUserId == 3 ||
      user.jenisUserId == 2 ||
      user.jenisUserId == 1
    ) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
    }

    const periode = `${tahun}`;
    const rsIsAll = selectedRsID === "999999";

    handleClose();

    if (rsIsAll) {
      // salah satu level di atasnya (provinsi/kabkota/rs) pasti ALL,
      // karena daftar RS cuma berisi "ALL" saat itu terjadi
      const params = { periode };

      // provId hanya dikirim kalau provinsi dipilih spesifik (bukan ALL/99)
      if (selectedProvId && selectedProvId !== 99 && selectedProvId !== "99") {
        params.provId = selectedProvId;
      }
      // kabId hanya dikirim kalau kabkota dipilih spesifik (bukan ALL/9999)
      if (selectedKabId && selectedKabId !== "9999") {
        params.kabId = selectedKabId;
      }

      await downloadAllExcel(params);
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
        "/apisirs6v2/rltigatitiksembilanbelas",
        customConfig,
      );

      const rlTigaTitikSembilanBelasDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_sembilan_belas_details;
      });

      let dataRLTigaTitikSembilanBelasDetails = [];

      rlTigaTitikSembilanBelasDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikSembilanBelasDetails.push(value);
        });
      });

      const normalizeData = dataRLTigaTitikSembilanBelasDetails
        .map((item) => {
          return {
            ...item,
            no: item.golongan_obat_rl_tiga_titik_sembilan_belas?.no,
            nama: item.golongan_obat_rl_tiga_titik_sembilan_belas?.nama,
          };
        })
        .filter((item) => item.no !== "2" && item.no !== "4"); // 🔥 hanya buang header DB

      setDataRL(normalizeData);
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

  const generateWithHeader = (data) => {
    const result = [...data];

    // Helper: ambil child berdasarkan prefix no
    const getChildren = (prefix) =>
      data.filter((item) => item.no?.startsWith(prefix + "."));

    const sumFields = (items) => {
      return items.reduce(
        (acc, curr) => {
          acc.ranap_pasien_keluar += curr.ranap_pasien_keluar || 0;
          acc.ranap_lama_dirawat += curr.ranap_lama_dirawat || 0;
          acc.jumlah_pasien_rajal += curr.jumlah_pasien_rajal || 0;
          acc.rajal_lab += curr.rajal_lab || 0;
          acc.rajal_radiologi += curr.rajal_radiologi || 0;
          acc.rajal_lain_lain += curr.rajal_lain_lain || 0;
          return acc;
        },
        {
          ranap_pasien_keluar: 0,
          ranap_lama_dirawat: 0,
          jumlah_pasien_rajal: 0,
          rajal_lab: 0,
          rajal_radiologi: 0,
          rajal_lain_lain: 0,
        },
      );
    };

    // ===== HEADER 2 (Asuransi)
    const children2 = getChildren("2");
    if (children2.length) {
      result.push({
        golonganObatTigaTitikSembilanBelasId: 2,
        no: "2",
        nama: "Asuransi",
        ...sumFields(children2),
        isHeader: true,
      });
    }

    // ===== HEADER 4 (Gratis)
    const children4 = getChildren("4");
    if (children4.length) {
      result.push({
        golonganObatTigaTitikSembilanBelasId: 8,
        no: "4",
        nama: "Gratis",
        ...sumFields(children4),
        isHeader: true,
      });
    }

    // Sorting berdasarkan no
    result.sort((a, b) => {
      const noA = a.golongan_obat_rl_tiga_titik_sembilan_belas?.no || "";
      const noB = b.golongan_obat_rl_tiga_titik_sembilan_belas?.no || "";

      return noA.localeCompare(noB, undefined, { numeric: true });
    });

    return result;
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
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitiksembilanbelas/${id}`,
        customConfig,
      );

      setDataRL((prev) => prev.filter((item) => item.id !== id));

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      toast("Data Gagal Dihapus", {
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
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setShow(true);
        break;
      default:
    }
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = async (e) => {
    const provinsiId = e.target.value;

    // 1. Update State Provinsi
    setSelectedProvId(provinsiId);

    // 2. Reset State Kab/Kota dan RS
    setselectedKabId(0);
    setSelectedRsID(0);
    setDaftarRumahSakit([]);

    // 3. Skenario Opsi
    if (provinsiId === "0" || provinsiId === 0 || provinsiId === "") {
      // Skenario 1: Pilih "Pilih" (0) -> Kosongkan dropdown turunan
      setDaftarKabKota([]);
    } else if (provinsiId === "99" || provinsiId === 99) {
      // Skenario 2: Pilih "Semua Provinsi" (99) -> Otomatis set "Semua Kab/Kota" & "ALL RS"
      setDaftarKabKota([{ id: "9999", nama: "Semua Kab/Kota" }]);
      setselectedKabId("9999");

      setDaftarRumahSakit([{ id: "999999", nama: "Semua Rumah Sakit" }]);
      setSelectedRsID("999999");
    } else {
      // Skenario 3: Pilih Provinsi Spesifik -> Fetch Kab/Kota
      await getKabKota(provinsiId);
    }
  };

  const kabKotaChangeHandler = async (e) => {
    const kabKotaId = e.target.value;

    // 1. Update State Kab/Kota
    setselectedKabId(kabKotaId);

    // 2. Reset State Rumah Sakit
    setSelectedRsID(0);

    // 3. Skenario Opsi
    if (kabKotaId === "0" || kabKotaId === 0 || kabKotaId === "") {
      // Skenario Pilih "Pilih" (0)
      setDaftarRumahSakit([]);
    } else if (kabKotaId === "9999" || kabKotaId === 9999) {
      // Skenario "Semua Kab/Kota"
      setDaftarRumahSakit([{ id: "999999", nama: "Semua Rumah Sakit" }]);
      setSelectedRsID("999999");
    } else {
      // Skenario Kab/Kota Spesifik
      await getRumahSakit(kabKotaId);
    }
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

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
      if (id === 99999 || id === "9999") {
        setLoadingRS(false);
        setDaftarRumahSakit([
          { id: "999999", nama: "Semua Rumah Sakit" }, // Sesuaikan key 'id' dan 'nama' dengan struktur data API Anda
        ]);
        return;
      }
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
      });

      const daftarKabKota = [
        {
          id: "999999",
          nama: "Semua Rumah Sakit",
          alamat: "",
          kab_kota_nama: "",
          provinsi_nama: "",
        }, // Sesuaikan key 'id' dan 'nama' dengan struktur API Anda
        ...response.data.data,
      ];

      setDaftarRumahSakit(daftarKabKota);
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
      setSelectedRsID(selected.id);
      setRumahSakit(selected);
    } else {
      setSelectedRsID(null);
      setRumahSakit(null);
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
      if (provinsiId === "99" || provinsiId === 99) {
        setDaftarKabKota([{ id: "9999", nama: "Semua Kab/Kota" }]);
        return;
      }

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

      const dataApi = results.data.data.map((value) => {
        return value;
      });

      // 2. Gabungkan opsi "Pilih" di awal array dengan data dari API
      const daftarKabKota = [
        { id: "9999", nama: "Semua Kab/Kota" }, // Sesuaikan key 'id' dan 'nama' dengan struktur API Anda
        ...dataApi,
      ];

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadExcel = async () => {
    const periode = `${tahun}`;

    if (user.jenisUserId === 4) {
      // Role 4: selalu RS sendiri
      await downloadAllExcel({
        rsId: user.satKerId,
        periode,
      });
      return;
    }

    // Role 1/2/3: wajib pilih RS dulu lewat filter (modal), sama seperti validasi sebelumnya
    if (!selectedRsID) {
      toast.warn("Rumah sakit harus dipilih", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (selectedRsID === "999999") {
      // RS = ALL -> kirim provId/kabId (bukan rsId), sama seperti logic di getRL untuk mode ALL
      const params = { periode };
      if (selectedProvId && selectedProvId !== "99" && selectedProvId !== 99) {
        params.provId = selectedProvId;
      }
      if (selectedKabId && selectedKabId !== "9999") {
        params.kabId = selectedKabId;
      }
      await downloadAllExcel(params);
    } else {
      // RS spesifik -> kirim rsId
      await downloadAllExcel({
        rsId: selectedRsID,
        periode,
      });
    }
  };

  const pad = (n) => String(n).padStart(2, "0");

  const downloadAllExcel = async (params) => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanbelasdownload",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          responseType: "blob",
        },
      );

      const now = new Date();
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      let fileName = `rl3_19_${params.rsId || params.provId || "all"}_${params.kabId || "all"}_${params.periode}_${timestamp}.xlsx`;

      // Kalau backend kirim nama file lewat header, pakai itu (lebih akurat)
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast("File berhasil diunduh", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      toast("Gagal mengunduh file", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setSpinner(false);
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(Number(e.target.value)); // ✅ FIX
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
          "/apisirs6v2/rltigatitiksembilanbelasvalidasi/" + idValidasi,
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
          "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
          {
            rsId: rumahSakit.id,
            periode: `${tahun}-12-01`,
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

  const finalData = useMemo(() => {
    const data = [...dataRL];

    const getChildren = (prefix) =>
      data.filter((item) => item.no?.startsWith(prefix + "."));

    const sumFields = (items) => {
      return items.reduce(
        (acc, curr) => {
          acc.ranap_pasien_keluar += curr.ranap_pasien_keluar || 0;
          acc.ranap_lama_dirawat += curr.ranap_lama_dirawat || 0;
          acc.jumlah_pasien_rajal += curr.jumlah_pasien_rajal || 0;
          acc.rajal_lab += curr.rajal_lab || 0;
          acc.rajal_radiologi += curr.rajal_radiologi || 0;
          acc.rajal_lain_lain += curr.rajal_lain_lain || 0;
          return acc;
        },
        {
          ranap_pasien_keluar: 0,
          ranap_lama_dirawat: 0,
          jumlah_pasien_rajal: 0,
          rajal_lab: 0,
          rajal_radiologi: 0,
          rajal_lain_lain: 0,
        },
      );
    };

    let result = [...data];

    const children2 = getChildren("2");
    if (children2.length) {
      result.push({
        no: "2",
        nama: "Asuransi",
        ...sumFields(children2),
        isHeader: true,
      });
    }

    const children4 = getChildren("4");
    if (children4.length) {
      result.push({
        no: "4",
        nama: "Gratis",
        ...sumFields(children4),
        isHeader: true,
      });
    }

    // SORTING
    const parseNo = (no) => (no || "0").split(".").map(Number);

    return result.sort((a, b) => {
      const aParts = parseNo(a.no);
      const bParts = parseNo(b.no);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const diff = (aParts[i] || 0) - (bParts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
  }, [dataRL]);

  const total = useMemo(() => {
    return finalData
      .filter((v) => !v.isHeader)
      .reduce(
        (acc, v) => {
          acc.ranap_pasien_keluar += Number(v.ranap_pasien_keluar) || 0;
          acc.ranap_lama_dirawat += Number(v.ranap_lama_dirawat) || 0;
          acc.jumlah_pasien_rajal += Number(v.jumlah_pasien_rajal) || 0;
          acc.rajal_lab += Number(v.rajal_lab) || 0;
          acc.rajal_radiologi += Number(v.rajal_radiologi) || 0;
          acc.rajal_lain_lain += Number(v.rajal_lain_lain) || 0;
          return acc;
        },
        {
          ranap_pasien_keluar: 0,
          ranap_lama_dirawat: 0,
          jumlah_pasien_rajal: 0,
          rajal_lab: 0,
          rajal_radiologi: 0,
          rajal_lain_lain: 0,
        },
      );
  }, [finalData]);

  const isDownloadDisabled = () => {
    return !isFilterApplied;
  };

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
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

        <form onSubmit={getDataRLTigaTitikSembilanBelas}>
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
                    {user.jenisUserId === 1 || user.jenisUserId === 99 ? (
                      <option key={99} value={99}>
                        Semua Provinsi
                      </option>
                    ) : (
                      <></>
                    )}
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
                    value={selectedKabId || ""}
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
                    value={selectedKabId || ""}
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
                    value={selectedRsID || ""}
                    onChange={(e) => handleSelectRumahSakit(e)}
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
                onChange={(e) => tahunChangeHandler(e)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl319/tambah/`}
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
            <button
              className={style.btnPrimary}
              onClick={handleDownloadExcel}
              disabled={isDownloadDisabled()}
              style={{
                opacity: isDownloadDisabled() ? 0.5 : 1,
                cursor: isDownloadDisabled() ? "not-allowed" : "pointer",
              }}
            >
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
                  <table ref={tableRef} className={style.table}>
                    <thead className={style.thead}>
                      <tr className="">
                        <th rowSpan={2}>No.</th>

                        {user.jenisUserId === 4 && <th rowSpan={2}>Aksi</th>}

                        <th rowSpan={2}>Cara Pembayaran</th>

                        <th colSpan={2}>Pasien Rawat Inap</th>

                        <th style={{ verticalAlign: "middle" }} rowSpan={2}>
                          Jumlah Pasien Rawat Jalan
                        </th>

                        <th colSpan={3}>Jumlah Pasien Rawat Jalan</th>
                      </tr>
                      <tr className={style["subheader-row"]}>
                        <th>Jumlah Pasien Keluar</th>
                        <th>Jumlah Lama Dirawat</th>

                        <th>Laboratorium</th>
                        <th>Radiologi</th>
                        <th>Lain-lain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRL.length > 0 ? (
                        <>
                          {finalData.map((value) => {
                            const no = value.no || "";
                            const nama = value.nama || "";
                            const isHeader =
                              value.isHeader || no === "2" || no === "4";

                            return (
                              <tr
                                key={value.id || no}
                                style={{
                                  fontWeight: isHeader ? "normal" : "normal",
                                  backgroundColor: isHeader
                                    ? "#f5f5f5"
                                    : "transparent",
                                }}
                              >
                                {/* NO */}
                                <td>{no}</td>

                                {/* AKSI */}
                                {user.jenisUserId === 4 && (
                                  <td>
                                    {!isHeader && (
                                      <div style={{ display: "flex" }}>
                                        <button
                                          className="btn btn-danger"
                                          style={{
                                            margin: "0 5px 0 0",
                                            backgroundColor: "#FF6663",
                                            border: "1px solid #FF6663",
                                          }}
                                          type="button"
                                          onClick={() => hapus(value.id)}
                                        >
                                          Hapus
                                        </button>

                                        <Link
                                          to={`/rl319/ubah/${value.id}`}
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
                                    )}
                                  </td>
                                )}

                                {/* NAMA */}
                                <td
                                  style={{
                                    textAlign: "left",
                                    paddingLeft: no.includes(".")
                                      ? "20px"
                                      : "5px",
                                  }}
                                >
                                  {nama}
                                </td>

                                {/* DATA */}
                                <td>{value.ranap_pasien_keluar}</td>
                                <td>{value.ranap_lama_dirawat}</td>
                                <td>{value.jumlah_pasien_rajal}</td>
                                <td>{value.rajal_lab}</td>
                                <td>{value.rajal_radiologi}</td>
                                <td>{value.rajal_lain_lain}</td>
                              </tr>
                            );
                          })}

                          <tr>
                            <td colSpan={user.jenisUserId === 4 ? 3 : 2}>
                              <strong>TOTAL</strong>
                            </td>
                            <td className="text-center">
                              {total.ranap_pasien_keluar}
                            </td>
                            <td className="text-center">
                              {total.ranap_lama_dirawat}
                            </td>
                            <td className="text-center">
                              {total.jumlah_pasien_rajal}
                            </td>
                            <td className="text-center">{total.rajal_lab}</td>
                            <td className="text-center">
                              {total.rajal_radiologi}
                            </td>
                            <td className="text-center">
                              {total.rajal_lain_lain}
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

              <div
                className={`tab-pane fade ${
                  activeTab === "tab2" ? "show active" : ""
                }`}
              >
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.19</h3>

                  {!isFilterApplied ? (
                    // 🔸 BELUM FILTER
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
                    // 🔸 DATA KOSONG
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
                        : {KeteranganValidasiDb || "-"}
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
                    dataRL.length > 0 &&
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

                  {/* 🔽 FORM VALIDASI */}
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
                        <strong>Data telah di validasi</strong>
                      </div>
                    ) : (
                      (user.jenisUserId === 3 ||
                        (user.jenisUserId === 4 && idValidasi)) && (
                        <form onSubmit={simpanValidasi}>
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

                          {user.jenisUserId === 3 && (
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
                              />
                            </div>
                          )}

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
}

const TableLoading = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0",
      gap: 16,
    }}
  >
    <div className={style.spinnerSlow} role="status" aria-label="Loading" />
    <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
      Sedang mengambil data dari SatuSehat, mohon tunggu...
    </p>
  </div>
);

function TabTwo() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const [loadingTable, setLoadingTable] = useState(false); // loading di dalam tabel
  const [show, setShow] = useState(false);
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [sync, setSync] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const limit = 50;
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();
  const pollingRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedRsID, setSelectedRsID] = useState(null);
  const [loadingRS, setLoadingRS] = useState(false);
  // --- Tambahan untuk filter bertingkat (role 1/2/3) ---
  const [selectedProvId, setSelectedProvId] = useState(null);
  const [selectedKabId, setSelectedKabId] = useState(null);

  useEffect(() => {
    refreshToken();
    return () => clearInterval(pollingRef.current); // cleanup polling saat unmount
  }, []);

  useEffect(() => {
    if (!user || !user.jenisUserId) return;
    const { jenisUserId, satKerId } = user;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        break;
      case 2:
        setSelectedProvId(satKerId);
        getKabKota(satKerId);
        break;
      case 3:
        setSelectedKabId(satKerId);
        getRumahSakit(satKerId);
        break;
      case 4:
        showRumahSakit(satKerId);
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.jenisUserId]);

  const provinsiChangeHandler = async (e) => {
    const provinsiId = e.target.value;

    // 1. Update State Provinsi
    setSelectedProvId(provinsiId);

    // 2. Reset State Kab/Kota dan RS
    setSelectedKabId(0);
    setSelectedRsID(0);
    setDaftarRumahSakit([]);

    // 3. Skenario Opsi
    if (provinsiId === "0" || provinsiId === 0 || provinsiId === "") {
      // Skenario 1: Pilih "Pilih" (0) -> Kosongkan dropdown turunan
      setDaftarKabKota([]);
    } else if (provinsiId === "99" || provinsiId === 99) {
      // Skenario 2: Pilih "Semua Provinsi" (99) -> Otomatis set "Semua Kab/Kota" & "ALL RS"
      setDaftarKabKota([{ id: "9999", nama: "Semua Kab/Kota" }]);
      setSelectedKabId("9999");

      setDaftarRumahSakit([{ id: "999999", nama: "Semua Rumah Sakit" }]);
      setSelectedRsID("999999");
    } else {
      // Skenario 3: Pilih Provinsi Spesifik -> Fetch Kab/Kota
      await getKabKota(provinsiId);
    }
  };

  const kabKotaChangeHandler = async (e) => {
    const kabKotaId = e.target.value;

    // 1. Update State Kab/Kota
    setSelectedKabId(kabKotaId);

    // 2. Reset State Rumah Sakit
    setSelectedRsID(0);

    // 3. Skenario Opsi
    if (kabKotaId === "0" || kabKotaId === 0 || kabKotaId === "") {
      // Skenario Pilih "Pilih" (0)
      setDaftarRumahSakit([]);
    } else if (kabKotaId === "9999" || kabKotaId === 9999) {
      // Skenario "Semua Kab/Kota"
      setDaftarRumahSakit([{ id: "999999", nama: "Semua Rumah Sakit" }]);
      setSelectedRsID("999999");
    } else {
      // Skenario Kab/Kota Spesifik
      await getRumahSakit(kabKotaId);
    }
  };

  const getProvinsi = async () => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/provinsi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDaftarProvinsi(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      if (provinsiId === "99" || provinsiId === 99) {
        setDaftarKabKota([{ id: "9999", nama: "Semua Kab/Kota" }]);
        return;
      }
      const response = await axiosJWT.get("/apisirs6v2/kabkota", {
        headers: { Authorization: `Bearer ${token}` },
        params: { provinsiId },
      });
      const dataApi = response.data.data ?? [];
      setDaftarKabKota([{ id: "9999", nama: "Semua Kab/kota" }, ...dataApi]);
    } catch (error) {
      console.error(error);
    }
  };

  const getRumahSakit = async (id, type = "kabkota") => {
    setLoadingRS(true);
    setDaftarRumahSakit([]);
    try {
      if (id === 99999 || id === "9999") {
        setLoadingRS(false);
        setDaftarRumahSakit([{ id: "999999", nama: "Semua Rumah Sakit" }]);
        return;
      }

      let params = {};
      if (type === "provinsi") {
        params.provinsiId = id;
      } else {
        params.kabKotaId = id;
      }

      const response = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setDaftarRumahSakit([
        { id: "999999", nama: "Semua Rumah Sakit" },
        ...(response.data.data ?? []),
      ]);
    } catch (error) {
      console.error(error);
    }
    setLoadingRS(false);
  };

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
          config.method?.toLowerCase(),
        )
      ) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET,
        ).toString();

        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
        config.headers["XSRF-TOKEN"] = CSRFToken;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // --- fetchData sekarang menerima rsId secara eksplisit ---
  const fetchData = async (
    pageNumber = 1,
    isBackground = false,
    currentToken = token,
    currentRsId = null,
    currentTahun = tahun,
  ) => {
    const rsIdToUse =
      currentRsId ?? (user.jenisUserId === 4 ? user.satKerId : selectedRsID);

    if (!currentToken || !rsIdToUse) return;

    if (!isBackground) setLoadingTable(true);

    try {
      const res = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanbelassatusehat",
        {
          headers: { Authorization: `Bearer ${currentToken}` },
          params: {
            rsId: rsIdToUse,
            periode: `${currentTahun}`,
            page: pageNumber,
            limit,
          },
        },
      );

      const newSync = res.data.sync ?? {};
      setDataRL(res.data.data ?? []);
      setSync(newSync);
      setTotalPages(res.data.pagination?.totalPages || 0);
      setPage(res.data.pagination?.page || 1);

      // Hentikan polling jika data sudah ada dan tidak sedang updating
      if (!newSync.isUpdating && newSync.status === "success") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (err) {
      console.error(err);
    }

    if (!isBackground) setLoadingTable(false);
  };

  // Mulai polling — dipanggil setelah filter diterapkan (khusus role 4)
  const startPolling = (currentToken, currentRsId, currentTahun) => {
    clearInterval(pollingRef.current); // bersihkan polling lama

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axiosJWT.get(
          "/apisirs6v2/rltigatitiksembilanbelassatusehat",
          {
            headers: { Authorization: `Bearer ${currentToken}` },
            params: {
              rsId: currentRsId,
              periode: `${currentTahun}`,
              page: 1,
              limit,
            },
          },
        );

        const newSync = res.data.sync ?? {};
        setDataRL(res.data.data ?? []);
        setSync(newSync);
        setTotalPages(res.data.pagination?.totalPages || 0);
        setPage(res.data.pagination?.page || 1);

        if (!newSync.isUpdating) {
          if (newSync.status === "success") {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            await fetchData(1, false, currentToken, currentRsId, currentTahun);
            setLoadingTable(false);
            toast.success("Data berhasil disinkronkan!");
          } else if (newSync.status === "failed") {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setLoadingTable(false);
            toast.error("Gagal sync data dari SatuSehat");
          } else if (newSync.status === "never") {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setLoadingTable(false);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000); // cek tiap 4 detik
  };

  // --- Helper: cek apakah RS yang dipilih adalah opsi "ALL" ---
  const isRsAll = (id) => id === "999999";
  const pad = (n) => String(n).padStart(2, "0");

  // --- Download Excel multi-RS/wilayah lewat endpoint backend (streaming) ---
  const downloadAllExcelSatuSehat = async (params) => {
    setIsDownloading(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanbelassatusehatdownload",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          responseType: "blob",
        },
      );

      const now = new Date();
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      let fileName = `RL_3_19_SatuSehat_${params.periode}_${timestamp}.xlsx`;
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast("File berhasil diunduh", {
        type: "success",
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.error(error);
      toast("Gagal mengunduh file", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setIsDownloading(false);
  };

  // --- getRL: titik keputusan utama, bercabang sesuai role & pilihan RS ---
  const getRL = async (e) => {
    e.preventDefault();
    if (!tahun) {
      toast("Pilih Tahun", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const periode = `${tahun}`;
    const jenisUserId = user.jenisUserId;

    // Role 4: selalu RS sendiri, seperti sebelumnya
    if (jenisUserId === 4) {
      setFilterLabel([
        `Rumah Sakit: ${rumahSakit.nama}`,
        `Periode: ${periode}`,
      ]);
      setIsFilterApplied(true);
      setDataRL([]);
      setLoadingTable(true);
      handleClose();
      await fetchData(1, false, token, user.satKerId, tahun);
      return;
    }

    // Role 1/2/3: RS wajib dipilih (termasuk opsi ALL)
    if (!selectedRsID) {
      toast("Rumah sakit harus dipilih", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    handleClose();

    if (isRsAll(selectedRsID)) {
      // ALL di level manapun -> langsung download, tidak tampil tabel
      setIsFilterApplied(false);
      setDataRL([]);
      await downloadAllExcelSatuSehat({
        provId:
          selectedProvId && selectedProvId !== "99" && selectedProvId !== 99
            ? selectedProvId
            : undefined,
        kabId:
          selectedKabId && selectedKabId !== "9999" ? selectedKabId : undefined,
        periode,
      });
      return;
    }

    // RS spesifik dipilih -> tampil tabel seperti RS, TANPA tombol sync
    setFilterLabel([`Rumah Sakit: ${rumahSakit.nama}`, `Periode: ${periode}`]);
    setIsFilterApplied(true);
    setDataRL([]);
    setLoadingTable(true);
    await fetchData(1, false, token, selectedRsID, tahun);
  };

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) +
      " WIB"
    );
  };

  const MANUAL_SYNC_COOLDOWN = 5; // menit

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!sync.lastSync) return;

    const lastSyncMs = new Date(sync.lastSync).getTime();
    setNow(Date.now());

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if ((current - lastSyncMs) / 60000 >= MANUAL_SYNC_COOLDOWN) {
        clearInterval(interval); // cooldown selesai, berhenti
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sync.lastSync]);

  const minutesSinceSync = sync.lastSync
    ? (now - new Date(sync.lastSync).getTime()) / 60000
    : null;

  const canSync =
    !sync.isUpdating &&
    !isManualSyncing &&
    (minutesSinceSync === null || minutesSinceSync >= MANUAL_SYNC_COOLDOWN);

  const cooldownLeft =
    minutesSinceSync !== null
      ? Math.max(0, MANUAL_SYNC_COOLDOWN - minutesSinceSync)
      : null;

  const cooldownDisplay = useMemo(() => {
    if (cooldownLeft === null || cooldownLeft <= 0) return null;

    const totalSeconds = Math.ceil(cooldownLeft * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    return `${minutes}:${formattedSeconds}`;
  }, [cooldownLeft]);

  // --- Manual sync HANYA untuk role 4 (RS sendiri) ---
  const handleManualSync = async () => {
    if (!canSync || user.jenisUserId !== 4) return;

    setIsManualSyncing(true);
    setLoadingTable(true);

    try {
      await axiosJWT.post(
        "/apisirs6v2/rltigatitiksembilanbelassatusatusehat/sync",
        { rsId: user.satKerId, periode: `${tahun}` },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "XSRF-TOKEN": CSRFToken,
          },
        },
      );
      startPolling(token, user.satKerId, tahun);
    } catch (err) {
      console.error(err);
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    setIsManualSyncing(false);
  }, [sync]);

  // --- Download Excel untuk tampilan tabel RS tunggal (dipakai role 4 & role 1/2/3 yang pilih RS spesifik) ---
  const handleDownloadExcel = async () => {
    if (!isFilterApplied) {
      toast("Terapkan filter terlebih dahulu", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const rsIdToUse = user.jenisUserId === 4 ? user.satKerId : selectedRsID;
    const periode = `${tahun}`;

    setIsDownloading(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanbelassatusehatdownload",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            rsId: rsIdToUse,
            periode: `${tahun}`,
          },
          responseType: "blob",
        },
      );

      const now = new Date();
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      let fileName = `RL_3_19_SatuSehat_${tahun}_${timestamp}.xlsx`;
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast("File berhasil diunduh", {
        type: "success",
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.error(error);
      toast("Gagal mengunduh file", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setIsDownloading(false);
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

  // Sync manual hanya relevan/tersedia untuk role 4
  const showSyncButton = user.jenisUserId === 4;

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      {isDownloading && (
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Spinner animation="border" variant="primary" />
            <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
              Sedang menyiapkan file Excel, mohon tunggu...
            </p>
          </div>
        </div>
      )}
      <ToastContainer />

      {/* --- Modal Filter khusus role 1/2/3, filter bertingkat Provinsi -> Kab/Kota -> RS --- */}
      {user.jenisUserId !== 4 && (
        <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
          <Modal.Header closeButton>
            <Modal.Title>Filter</Modal.Title>
          </Modal.Header>
          <form onSubmit={getRL}>
            <Modal.Body>
              {(user.jenisUserId === 1 || user.jenisUserId === 99) && (
                <>
                  <div
                    className="form-floating"
                    style={{ width: "100%", paddingBottom: "5px" }}
                  >
                    <select
                      name="provinsi"
                      id="provinsi"
                      className="form-select"
                      value={selectedProvId || ""}
                      onChange={(e) => provinsiChangeHandler(e)}
                    >
                      <option key={0} value="">
                        Pilih
                      </option>
                      <option key={99} value={99}>
                        Semua Provinsi
                      </option>
                      {daftarProvinsi.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
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
                      className="form-select"
                      value={selectedKabId || ""}
                      onChange={(e) => kabKotaChangeHandler(e)}
                    >
                      <option key={0} value="">
                        Pilih
                      </option>
                      {daftarKabKota.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
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
                      value={selectedRsID || ""}
                      onChange={(e) => handleSelectRumahSakit(e)}
                    >
                      <option key={0} value={0}>
                        {loadingRS ? "Loading..." : "Pilih"}
                      </option>
                      {daftarRumahSakit.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="rumahSakit">Rumah Sakit</label>
                  </div>
                </>
              )}

              {user.jenisUserId === 2 && (
                <>
                  <div
                    className="form-floating"
                    style={{ width: "100%", paddingBottom: "5px" }}
                  >
                    <select
                      name="kabKota"
                      id="kabKota"
                      className="form-select"
                      value={selectedKabId || ""}
                      onChange={(e) => kabKotaChangeHandler(e)}
                    >
                      <option key={0} value="">
                        Pilih
                      </option>
                      {daftarKabKota.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
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
                      value={selectedRsID || ""}
                      onChange={(e) => handleSelectRumahSakit(e)}
                    >
                      <option key={0} value={0}>
                        {loadingRS ? "Loading..." : "Pilih"}
                      </option>
                      {daftarRumahSakit.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="rumahSakit">Rumah Sakit</label>
                  </div>
                </>
              )}

              {user.jenisUserId === 3 && (
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={(e) => handleSelectRumahSakit(e)}
                  >
                    <option key={0} value={0}>
                      {loadingRS ? "Loading..." : "Pilih"}
                    </option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>
                        {nilai.nama}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              )}

              <div
                className="form-floating"
                style={{ display: "inline-block" }}
              >
                <input
                  name="tahun"
                  type="number"
                  className="form-control"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                />
                <label htmlFor="tahun">Tahun</label>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="mt-3 mb-3">
                <button type="submit" className={style.btnPrimary}>
                  <HiSaveAs size={20} /> Terapkan
                </button>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      <div className="row">
        <div className="col-md-12">
          {/* --- Panel filter inline khusus role 4 (RS sendiri): bulan/tahun + sync + download --- */}
          {user.jenisUserId === 4 && (
            <div
              style={{
                background: "var(--color-background-primary, #fff)",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#1e293b",
                  margin: "0 0 14px 0",
                  letterSpacing: 0.2,
                }}
              >
                Periode Data
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* Tahun */}
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      display: "block",
                      marginBottom: 5,
                      fontWeight: 500,
                    }}
                  >
                    Tahun
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 7,
                      padding: "7px 10px",
                      background: "#f8fafc",
                      width: 125,
                    }}
                  >
                    <FaCalendarAlt
                      size={13}
                      color="#94a3b8"
                      style={{ marginRight: 7, flexShrink: 0 }}
                    />
                    <input
                      type="number"
                      value={tahun}
                      onChange={(e) => setTahun(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        width: "100%",
                        fontSize: 13,
                        color: "#334155",
                      }}
                    />
                  </div>
                </div>

                {/* Tombol-tombol */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
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
                      justifyContent: "center",
                      gap: 7,
                      whiteSpace: "nowrap",
                      height: 42,
                    }}
                  >
                    <FaFilter size={14} /> FILTER
                  </button>

                  <SyncButton
                    canSync={canSync}
                    isSyncing={isManualSyncing || sync.isUpdating}
                    isFilterApplied={isFilterApplied}
                    cooldownDisplay={cooldownDisplay}
                    onSync={handleManualSync}
                  />

                  <button
                    onClick={handleDownloadExcel}
                    disabled={
                      !isFilterApplied || isDownloading || dataRL.length === 0
                    }
                    title={
                      !isFilterApplied
                        ? "Terapkan filter terlebih dahulu"
                        : "Download semua data ke Excel"
                    }
                    style={{
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "9px 18px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor:
                        isFilterApplied && !isDownloading
                          ? "pointer"
                          : "not-allowed",
                      opacity: isFilterApplied && !isDownloading ? 1 : 0.55,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      whiteSpace: "nowrap",
                      height: 42,
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
          )}

          {/* --- Panel untuk role 1/2/3: tombol Filter membuka modal, Download muncul kalau RS spesifik dipilih --- */}
          {user.jenisUserId !== 4 && (
            <div
              style={{
                background: "var(--color-background-primary, #fff)",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleShow}
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
                  justifyContent: "center",
                  gap: 7,
                  height: 42,
                }}
              >
                <FaFilter size={14} /> FILTER
              </button>

              {isFilterApplied && !isRsAll(selectedRsID) && (
                <button
                  onClick={handleDownloadExcel}
                  disabled={isDownloading || dataRL.length === 0}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: !isDownloading ? "pointer" : "not-allowed",
                    opacity: !isDownloading ? 1 : 0.55,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    height: 42,
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
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Card 1: Keterangan Tombol */}
            <div
              style={{
                flex: "1 1 240px",
                border: "1.5px solid #3b82f6",
                borderRadius: 10,
                padding: "14px 16px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 13,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FaInfoCircle size={12} color="#2563eb" />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#2563eb",
                    letterSpacing: 0.3,
                  }}
                >
                  KETERANGAN TOMBOL
                </span>
              </div>

              {[
                {
                  icon: <FaFilter size={11} />,
                  bg: "#1d4ed8",
                  label: "FILTER",
                  desc: showSyncButton
                    ? "Menampilkan data dari database SIRS Online"
                    : "Pilih Provinsi/Kab-Kota/RS. Pilih RS spesifik untuk melihat tabel, atau ALL untuk mengunduh langsung",
                },
                ...(showSyncButton
                  ? [
                      {
                        icon: <FaSyncAlt size={11} />,
                        bg: "#059669",
                        label: "SYNC SATUSEHAT",
                        desc: "Mengambil data terbaru dari SATUSEHAT",
                      },
                    ]
                  : []),
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

            {/* Card 2: Status Sinkronisasi — hanya relevan untuk role 4 */}
            {showSyncButton && (
              <div
                style={{
                  flex: "1 1 210px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 14,
                  }}
                >
                  <FaSyncAlt size={15} color="#059669" />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#059669",
                      letterSpacing: 0.3,
                    }}
                  >
                    STATUS SINKRONISASI
                  </span>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 11 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
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
                        style={{
                          fontSize: 15,
                          lineHeight: 1,
                          color: "#64748b",
                        }}
                      >
                        ⏱
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      Interval Sync&nbsp;:&nbsp;
                      <strong>{MANUAL_SYNC_COOLDOWN} Menit</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Sumber Data */}
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

          {/* Filter label + status sync */}
          <div className={style.filterLabel}>
            {filterLabel.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h5 style={{ fontSize: "14px", margin: 0 }}>
                  Filtered By {filterLabel.join(", ")}
                </h5>
              </div>
            )}
          </div>

          {/* Konten utama */}
          {!isFilterApplied ? (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                color: "#856404",
                padding: 15,
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              <strong>Silakan pilih filter terlebih dahulu.</strong>
            </div>
          ) : loadingTable && dataRL.length === 0 ? (
            <TableLoading />
          ) : !loadingTable &&
            dataRL.length === 0 &&
            sync.status === "success" ? (
            <div
              style={{
                backgroundColor: "#d1ecf1",
                border: "1px solid #bee5eb",
                color: "#0c5460",
                padding: 15,
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              <strong>
                Data tidak ditemukan di SATUSEHAT untuk periode ini.
              </strong>
            </div>
          ) : !loadingTable &&
            dataRL.length === 0 &&
            sync.status === "failed" ? (
            <div
              style={{
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                color: "#721c24",
                padding: 15,
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              <strong>
                Gagal mengambil data dari SatuSehat. Coba filter ulang.
              </strong>
            </div>
          ) : !loadingTable &&
            dataRL.length === 0 &&
            sync.status === "never" ? (
            <div
              style={{
                backgroundColor: "#e8f4fd",
                border: "1px solid #b6d4fe",
                color: "#084298",
                padding: 15,
                borderRadius: 4,
                textAlign: "center",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <strong>
                Data belum disinkronkan dengan SATUSEHAT untuk periode ini.
                {showSyncButton
                  ? " Silakan lakukan sinkronisasi terlebih dahulu."
                  : ""}
              </strong>
            </div>
          ) : (
            <div
              className={style["outer-wrapper"]}
              style={{ width: "100%", overflowX: "auto" }}
            >
              <div className={style["inner-content"]}>
                <div
                  className="table-container mt-2 mb-1 pb-2"
                  style={{
                    position: "sticky",
                    overflow: "hidden",
                    borderRadius: "8px",
                  }}
                >
                  {loadingTable && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10,
                        pointerEvents: "all",
                      }}
                    >
                      <div
                        style={{
                          position: "sticky",
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "16px",
                        }}
                      >
                        <Spinner
                          animation="border"
                          variant="primary"
                          style={{ willChange: "transform" }}
                        />
                        <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
                          Sedang mengambil data dari SatuSehat, mohon tunggu...
                        </p>
                      </div>
                    </div>
                  )}
                  <div style={{ overflowX: "auto" }}>
                    {/* TAMPILAN TABEL LANGSUNG INLINE */}
                    <table className={style.table ?? "table table-bordered"}>
                      <thead className={style.thead}>
                        <tr>
                          <th
                            rowSpan={2}
                            style={{
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            No.
                          </th>

                          <th
                            rowSpan={2}
                            style={{
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            Cara Pembayaran
                          </th>

                          <th colSpan={2} style={{ textAlign: "center" }}>
                            Pasien Rawat Inap
                          </th>

                          <th
                            rowSpan={2}
                            style={{
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            Jumlah Pasien Rawat Jalan
                          </th>

                          <th colSpan={3} style={{ textAlign: "center" }}>
                            Jumlah Pasien Rawat Jalan (Pemeriksaan)
                          </th>
                        </tr>
                        <tr className={style["subheader-row"]}>
                          <th style={{ textAlign: "center" }}>Pasien Keluar</th>
                          <th style={{ textAlign: "center" }}>Lama Dirawat</th>
                          <th style={{ textAlign: "center" }}>Laboratorium</th>
                          <th style={{ textAlign: "center" }}>Radiologi</th>
                          <th style={{ textAlign: "center" }}>Lain-lain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // 1. Memisahkan data detail (bukan objek TOTAL dari backend)
                          const detailRows = dataRL.filter(
                            (item) =>
                              Number(item.golongan_obat_id) !== 0 &&
                              item.golongan_no !== "99",
                          );

                          // ─── URUTKAN DATA BERDASARKAN NOMOR (NATURAL SORT) ───
                          detailRows.sort((a, b) => {
                            const noA = String(a.golongan_no || a.no || "");
                            const noB = String(b.golongan_no || b.no || "");
                            return noA.localeCompare(noB, undefined, {
                              numeric: true,
                              sensitivity: "base",
                            });
                          });

                          // 2. Ambil objek total bawaan API jika ada
                          const totalObjBackend = dataRL.find(
                            (item) =>
                              Number(item.golongan_obat_id) === 0 ||
                              item.golongan_no === "99",
                          );

                          // 3. Objek Total akhir
                          const total = totalObjBackend || {
                            ranap_pasien_keluar: detailRows.reduce(
                              (acc, c) =>
                                acc + (Number(c.ranap_pasien_keluar) || 0),
                              0,
                            ),
                            ranap_lama_dirawat: detailRows.reduce(
                              (acc, c) =>
                                acc + (Number(c.ranap_lama_dirawat) || 0),
                              0,
                            ),
                            jumlah_pasien_rajal: detailRows.reduce(
                              (acc, c) =>
                                acc + (Number(c.jumlah_pasien_rajal) || 0),
                              0,
                            ),
                            rajal_lab: detailRows.reduce(
                              (acc, c) => acc + (Number(c.rajal_lab) || 0),
                              0,
                            ),
                            rajal_radiologi: detailRows.reduce(
                              (acc, c) =>
                                acc + (Number(c.rajal_radiologi) || 0),
                              0,
                            ),
                            rajal_lain_lain: detailRows.reduce(
                              (acc, c) =>
                                acc + (Number(c.rajal_lain_lain) || 0),
                              0,
                            ),
                          };

                          const isRSUser = user?.jenisUserId === 4;

                          return (
                            <>
                              {/* BARIS RINCIAN / DETAIL DATA (SUDAH URUT) */}
                              {detailRows.map((item) => {
                                const no = item.golongan_no || item.no || "";
                                const nama =
                                  item.golongan_nama || item.nama || "";
                                const isHeaderGroup =
                                  item.isHeader || no === "2" || no === "4";

                                return (
                                  <tr
                                    key={item.id || item.golongan_obat_id || no}
                                    style={{
                                      backgroundColor: isHeaderGroup
                                        ? "#f8f9fa"
                                        : "transparent",
                                      fontWeight: isHeaderGroup
                                        ? "bold"
                                        : "normal",
                                    }}
                                  >
                                    {/* NO */}
                                    <td style={{ textAlign: "center" }}>
                                      {no}
                                    </td>

                                    {/* CARA PEMBAYARAN */}
                                    <td
                                      style={{
                                        textAlign: "left",
                                        paddingLeft: String(no).includes(".")
                                          ? "25px"
                                          : "10px",
                                      }}
                                    >
                                      {nama}
                                    </td>

                                    {/* DATA ANGKA */}
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.ranap_pasien_keluar) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.ranap_lama_dirawat) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.jumlah_pasien_rajal) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.rajal_lab) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.rajal_radiologi) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {(
                                        Number(item.rajal_lain_lain) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* BARIS TOTAL PALING BAWAH */}
                              <tr
                                style={{
                                  fontWeight: "bold",
                                  backgroundColor: "#e9ecef",
                                  borderTop: "2px solid #dee2e6",
                                }}
                              >
                                <td
                                  colSpan={2}
                                  style={{
                                    textAlign: "left",
                                    paddingLeft: "15px",
                                  }}
                                >
                                  <strong>TOTAL</strong>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.ranap_pasien_keluar) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.ranap_lama_dirawat) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.jumlah_pasien_rajal) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.rajal_lab) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.rajal_radiologi) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {(
                                    Number(total.rajal_lain_lain) || 0
                                  ).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={(newPage) => fetchData(newPage)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
