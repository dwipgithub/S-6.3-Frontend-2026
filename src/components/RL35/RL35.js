import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL35.module.css";
import {
  FaCalendarAlt,
  FaClock,
  FaDatabase,
  FaFileExcel,
  FaInfoCircle,
  FaSyncAlt,
  FaCheckCircle,
  FaFilter,
} from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";
import { HiFilter, HiPlus, HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL35 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [dataRLSatusehat, setDataRLSatusehat] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [dataCount, setDataCount] = useState([]);
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [activeWadahTab, setActiveWadahTab] = useState("sirs");
  const [filterLabelSatusehat, setFilterLabelSatusehat] = useState([]);
  const [isSyncingSatusehat, setIsSyncingSatusehat] = useState(false);
  const [isSyncCooldown, setIsSyncCooldown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hasFilteredSatusehat, setHasFilteredSatusehat] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const syncCooldownTimeoutRef = useRef(null);
  const syncCooldownMinutes = 5;
  const syncCooldownMs = syncCooldownMinutes * 60 * 1000;

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

  useEffect(() => {
    refreshToken();
    totalPengunjung();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRL]);

  // Load validasi data secara realtime saat bulan/tahun/rumahSakit berubah
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
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setUser(decoded);
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      } else if (decoded.jenisUserId === 4) {
        showRumahSakit(decoded.satKerId, accessToken);
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
          config.method?.toLowerCase(),
        )
      ) {
        const timestamp = Date.now().toString();
        const bodyString = JSON.stringify(config.data || {});
        const signature = CryptoJS.HmacSHA256(
          timestamp + bodyString,
          process.env.REACT_APP_HMAC_SECRET,
        ).toString();

        config.headers = config.headers || {};
        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Signature"] = signature;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

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

  const getRL = async (e) => {
    if (e) e.preventDefault();
    let date = tahun + "-" + bulan + "-01";

    const rsId = getSelectedRsId();
    if (!rsId) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    // Pastikan state rumahSakit punya nama utk filter label (fallback utk session user 4)
    if (!rumahSakit || !rumahSakit.id || String(rumahSakit.id) === "0") {
      try {
        const detailRs = await axiosJWT.get("/apisirs6v2/rumahsakit/" + rsId, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRumahSakit(detailRs.data.data || { id: rsId, nama: "Rumah Sakit" });
      } catch (e) {
        // fallback biar label tetap ada
        setRumahSakit({ id: rsId, nama: "Rumah Sakit" });
      }
    }

    const rsLabel = rumahSakit?.nama || "Rumah Sakit";
    const filter = [];
    filter.push("nama: ".concat(rsLabel));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);

    // Reset validation state
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
          rsId: rsId,
          tahun: date,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklima",
        customConfig
      );

      if (!results.data.data || results.data.data.length === 0) {
        setDataRL([]);
        setDataCount([]);
        toast.info("Data RL tidak ditemukan untuk filter ini", {
          position: toast.POSITION.TOP_RIGHT,
        });
        handleClose();
        return;
      }

      setDataRL(results.data.data);
      setDataCount(results.data.dataCount || []);
      toast.success(
        `Berhasil memuat ${results.data.data.length} baris data RL 3.5`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
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
          "/apisirs6v2/rltigatitiklimavalidasi",
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
    }
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

  const getDataRLTigaTitikLimaSatusehat = async (e) => {
    if (e) e.preventDefault();

    const rsId = getSelectedRsId();
    if (!rsId) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (!tahun || !bulan) {
      toast(`periode wajib diisi`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const filter = [];
    filter.push("Provinsi: ".concat(rumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(rumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabelSatusehat(filter);
    setHasFilteredSatusehat(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/getDataRLTigaTitikLimaSatusehatLocal",
        {
          headers,
          params: {
            rsId: rsId,
            month_year: periode,
          },
        }
      );

      const arr = results?.data?.data || [];
      setDataRLSatusehat(Array.isArray(arr) ? arr : []);
      if (show) handleClose();
    } catch (error) {
      setDataRLSatusehat([]);
      const detailMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan";
      toast.error(detailMessage);
      if (show) handleClose();
    }
  };

  const syncDataRLTigaTitikLimaSatusehat = async () => {
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
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const apiKey = process.env.REACT_APP_SATUSEHAT_API_KEY;
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      await axiosJWT.get("/apisirs6v2/rltigatitiklimaSatusehat", {
        headers,
        params: {
          rsId: rsId,
          periode,
        },
      });

      toast.success("Sync Satusehat berhasil.", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setLastSyncAt(new Date());
      await getDataRLTigaTitikLimaSatusehat();
      startSyncCooldown();
    } catch (error) {
      console.log(error);
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
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    getDataRLTigaTitikLimaSatusehat();
  };

  const handleSatusehatSyncClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    syncDataRLTigaTitikLimaSatusehat();
  };

  const getValidasi = async () => {
    try {
      const rsId = getSelectedRsId();
      if (!rsId) return;

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rsId,
          periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimavalidasi",
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
      console.log(error);
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();
    
    if (!rumahSakit || !rumahSakit.id) {
      toast("Rumah sakit harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (parseInt(statusValidasi) === 0) {
      toast("Status harus dipilih terlebih dahulu", {
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

      const payload = {
        statusValidasiId: parseInt(statusValidasi),
        catatan: keteranganValidasi,
      };

      console.log("Payload yang dikirim:", payload);
      console.log("ValidasiId:", validasiId);

      if (validasiId) {
        // Update existing validation
        const response = await axiosJWT.patch(
          `/apisirs6v2/rltigatitiklimavalidasi/${validasiId}`,
          payload,
          customConfig
        );
        console.log("Response PATCH:", response.data);
        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        // Create new validation
        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitiklimavalidasi",
          {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
            jenisPeriode: 1,
            ...payload,
          },
          customConfig
        );
        console.log("Response POST:", response.data);
        setValidasiId(response.data.data.id);
        toast("Data Validasi Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        // Refresh validasi data tanpa reload halaman
        setTimeout(() => {
          getValidasi();
        }, 1500);
      }
    } catch (error) {
      console.log(error);
      toast(
        `Data tidak bisa disimpan karena: ${
          error.response?.data?.message || error.message
        }`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleWadahTabClick = (tab) => {
    setActiveWadahTab(tab);
  };

  const totalPengunjung = () => {
    let t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0;
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;

    // Cari baris pembagi (Jumlah Hari - biasanya ID 34)
    const divisorRow = dataRL.find(item => item.jenis_kegiatan_id === 34);

    dataRL.forEach((value) => {
      // Jangan hitung baris Total, Rata-rata, atau baris non-data ke dalam Total
      if (![35, 99, 66, 77, 34].includes(value.jenis_kegiatan_id)) {
        t1 += parseInt(value.kunjungan_pasien_dalam_kabkota_laki || 0);
        t2 += parseInt(value.kunjungan_pasien_luar_kabkota_laki || 0);
        t3 += parseInt(value.kunjungan_pasien_dalam_kabkota_perempuan || 0);
        t4 += parseInt(value.kunjungan_pasien_luar_kabkota_perempuan || 0);
        t5 += parseInt(value.total_kunjungan || 0);
      }
    });

    if (divisorRow) {
      r1 = Math.ceil(t1 / (divisorRow.kunjungan_pasien_dalam_kabkota_laki || 1));
      r2 = Math.ceil(t2 / (divisorRow.kunjungan_pasien_luar_kabkota_laki || 1));
      r3 = Math.ceil(t3 / (divisorRow.kunjungan_pasien_dalam_kabkota_perempuan || 1));
      r4 = Math.ceil(t4 / (divisorRow.kunjungan_pasien_luar_kabkota_perempuan || 1));
      r5 = Math.ceil(t5 / (divisorRow.total_kunjungan || 1));
    }

    let newData = [
      {
        id: 99,
        jenis_kegiatan_id: 99,
        jenis_kegiatan_nama: "Total",
        kunjungan_pasien_dalam_kabkota_laki: t1,
        kunjungan_pasien_luar_kabkota_laki: t2,
        kunjungan_pasien_dalam_kabkota_perempuan: t3,
        kunjungan_pasien_luar_kabkota_perempuan: t4,
        total_kunjungan: t5,
      },
      {
        id: 77,
        jenis_kegiatan_id: 77,
        jenis_kegiatan_nama: "Rata-rata kunjungan per hari",
        kunjungan_pasien_dalam_kabkota_laki: r1,
        kunjungan_pasien_luar_kabkota_laki: r2,
        kunjungan_pasien_dalam_kabkota_perempuan: r3,
        kunjungan_pasien_luar_kabkota_perempuan: r4,
        total_kunjungan: r5,
      },
    ];
    setDataCount(newData);
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitiklima/${id}`, customConfig);
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
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan("1");
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan("1");
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan("1");
        setShow(true);
        break;
      case 4:
        // User jenis 4: RS otomatis dari session getSelectedRsId(),
        // tidak perlu load RS lagi di modal (tidak ada dropdown RS utk user 4 anyway)
        setBulan("1");
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

  const canSubmitModal =
    user.jenisUserId === 4 ||
    (rumahSakit &&
      typeof rumahSakit.id !== "undefined" &&
      rumahSakit.id !== null &&
      String(rumahSakit.id) !== "0");

  function handleDownloadExcelRLTigaTitikLima() {
    const header = [
      "No",
      "Jenis Kegiatan",
      "Kunjungan Dalam Kota (L)",
      "Kunjungan Dalam Kota (P)",
      "Kunjungan Luar Kota (L)",
      "Kunjungan Luar Kota (P)",
      "Total Kunjungan",
    ];

    const body = dataRL
      .filter(
        (value) =>
          ![34, 35, 99, 66, 77].includes(value.jenis_kegiatan_id)
      )
      .map((value, index) => [
        index + 1,
        value.jenis_kegiatan_rl_tiga_titik_lima.nama,
        value.kunjungan_pasien_dalam_kabkota_laki,
        value.kunjungan_pasien_dalam_kabkota_perempuan,
        value.kunjungan_pasien_luar_kabkota_laki,
        value.kunjungan_pasien_luar_kabkota_perempuan,
        value.total_kunjungan,
      ]);

    body.push([
      "",
      "TOTAL",
      dataCount[0]?.kunjungan_pasien_dalam_kabkota_laki || 0,
      dataCount[0]?.kunjungan_pasien_dalam_kabkota_perempuan || 0,
      dataCount[0]?.kunjungan_pasien_luar_kabkota_laki || 0,
      dataCount[0]?.kunjungan_pasien_luar_kabkota_perempuan || 0,
      dataCount[0]?.total_kunjungan || 0,
    ]);

    downloadExcel({
      fileName: "RL_3_5",
      sheet: "RL 3.5",
      tablePayload: { header, body },
    });
  }

  async function handleDownloadExcelRLTigaTitikLimaSatusehat() {
    setIsDownloading(true);
    try {
      const header = [
        "No",
        "Jenis Kegiatan",
        "Kunjungan Dalam Kota (L)",
        "Kunjungan Dalam Kota (P)",
        "Kunjungan Luar Kota (L)",
        "Kunjungan Luar Kota (P)",
        "Total Kunjungan",
        "Rata-rata / hari",
      ];

      const body = (Array.isArray(dataRLSatusehat) ? dataRLSatusehat : []).map(
        (value, index) => [
          index + 1,
          value.jenis_kegiatan,
          value.kunjungan_dalam_kab_kota?.laki_laki ?? value.kunjungan_dalam_kab_kota_laki_laki ?? 0,
          value.kunjungan_dalam_kab_kota?.perempuan ?? value.kunjungan_dalam_kab_kota_perempuan ?? 0,
          value.kunjungan_luar_kab_kota?.laki_laki ?? value.kunjungan_luar_kab_kota_laki_laki ?? 0,
          value.kunjungan_luar_kab_kota?.perempuan ?? value.kunjungan_luar_kab_kota_perempuan ?? 0,
          value.total_kunjungan ?? 0,
          value.rata_rata_kunjungan_perhari ?? 0,
        ]
      );

      downloadExcel({
        fileName: "RL_3_5_SatuSehat",
        sheet: "RL 3.5 SatuSehat",
        tablePayload: { header, body },
      });
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  }

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form
          onSubmit={
            activeWadahTab === "satusehat"
              ? getDataRLTigaTitikLimaSatusehat
              : getRL
          }
        >
          <Modal.Body>
            {user.jenisUserId === 1 && (
              <>
                <div className="form-floating mb-2">
                  <select
                    name="provinsi"
                    id="provinsi"
                    className="form-select"
                    onChange={(e) => getKabKota(e.target.value)}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarProvinsi.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    className="form-select"
                    value={rumahSakit?.id || 0}
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            )}

            {user.jenisUserId === 2 && (
              <>
                <div className="form-floating mb-2">
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div className="form-floating mb-2">
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    className="form-select"
                    value={rumahSakit?.id || 0}
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            )}

            {user.jenisUserId === 3 && (
              <div className="form-floating mb-2">
                <select
                  name="rumahSakit"
                  id="rumahSakit"
                  className="form-select"
                  value={rumahSakit?.id || 0}
                  onChange={(e) => showRumahSakit(e.target.value)}
                >
                  <option key={0} value={0}>Pilih</option>
                  {daftarRumahSakit.map((nilai) => (
                    <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                  ))}
                </select>
                <label htmlFor="rumahSakit">Rumah Sakit</label>
              </div>
            )}

            <div className="form-floating d-inline-block" style={{ width: "70%" }}>
              <select
                name="bulan"
                className="form-control"
                id="bulan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              >
                {months.map((value) => (
                  <option key={value.value} value={value.value}>
                    {value.label}
                  </option>
                ))}
              </select>
              <label>Bulan</label>
            </div>

            <div className="form-floating d-inline-block" style={{ width: "30%" }}>
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="mt-3 mb-3">
              <button
                type="submit"
                className={`${style.btnPrimary} ${!canSubmitModal ? "disabled" : ""}`}
                disabled={!canSubmitModal}
              >
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}> RL 3.5 - Kunjungan</h4>

          <ul className={`nav nav-tabs ${style.navTabs}`}>
            <li className={`nav-item ${style.navItem}`}>
              <button
                type="button"
                className={`${style.navLink} ${activeWadahTab === "sirs" ? style.active : ""}`}
                onClick={() => handleWadahTabClick("sirs")}
              >
                SIRS
              </button>
            </li>
            <li className={`nav-item ${style.navItem}`}>
              <button
                type="button"
                className={`${style.navLink} ${activeWadahTab === "satusehat" ? style.active : ""}`}
                onClick={() => handleWadahTabClick("satusehat")}
              >
                Satusehat
              </button>
            </li>
          </ul>

          <div className={`tab-content ${style.tabContent}`}>
            <div
              className={`tab-pane fade ${
                activeWadahTab === "sirs" ? "show active" : ""
              }`}
            >
              <div className={style.toolbar}>
                {user.jenisUserId === 4 && (
                  <Link
                    to={`/rl35/tambah/`}
                    className={style.btnPrimary}
                    style={{ textDecoration: "none" }}
                  >
                    <HiPlus size={18} /> Tambah
                  </Link>
                )}
                <button type="button" className={style.btnPrimary} onClick={handleShow}>
                  <HiFilter size={18} /> Filter
                </button>
                <button type="button" className={style.btnPrimary} onClick={handleDownloadExcelRLTigaTitikLima}>
                  <FaFileExcel size={18} /> Download Excel
                </button>
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
                    <li className={`nav-item ${style.navItem}`}>
                      <button
                        type="button"
                        className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                        onClick={() => handleTabClick("tab2")}
                      >
                        Validasi
                      </button>
                    </li>
                  </ul>

                  <div className={`tab-content ${style.tabContent}`}>
                    <div
                      className={`tab-pane fade ${
                        activeTab === "tab1" ? "show active" : ""
                      }`}
                    >
                      <div className={style["table-container"]}>
                        <div className="table-responsive">
                          <table className={style.table}>
                            <thead>
                              <tr className={style.thead}>
                                <th
                                  rowSpan={2}
                                  style={{ width: "4%", verticalAlign: "middle" }}
                                >
                                  No.
                                </th>

                                {user?.jenisUserId === 4 && (
                                  <th
                                    rowSpan={2}
                                    style={{ width: "8%", verticalAlign: "middle" }}
                                  >
                                    Aksi
                                  </th>
                                )}

                                <th
                                  rowSpan={2}
                                  style={{ width: "12%", verticalAlign: "middle" }}
                                >
                                  Jenis Kegiatan
                                </th>

                                <th colSpan={2} style={{ textAlign: "center" }}>
                                  Kunjungan Pasien Dalam Kota
                                </th>

                                <th colSpan={2} style={{ textAlign: "center" }}>
                                  Kunjungan Pasien Luar Kota
                                </th>

                                <th rowSpan={2} style={{ verticalAlign: "middle" }}>
                                  Total Kunjungan
                                </th>
                              </tr>

                              <tr className={style["subheader-row"]}>
                                <th>Laki-Laki</th>
                                <th>Perempuan</th>
                                <th>Laki-Laki</th>
                                <th>Perempuan</th>
                              </tr>
                            </thead>

                            <tbody>
                              {dataRL.map((value, index) => (
                                <tr key={value.id}>
                                  <td style={{ textAlign: "center" }}>
                                    {index + 1}
                                  </td>

                                  {user?.jenisUserId === 4 && (
                                    <td style={{ textAlign: "center" }}>
                                      <ToastContainer />

                                      <div style={{ display: "flex" }}>
                                        <button
                                          className="btn btn-danger"
                                          style={{
                                            marginRight: "5px",
                                            backgroundColor: "#FF6663",
                                            border: "1px solid #FF6663",
                                          }}
                                          type="button"
                                          onClick={() => hapus(value.id)}
                                        >
                                          Hapus
                                        </button>

                                        <Link
                                          to={`/rl35/ubah/${value.id}`}
                                          className="btn btn-warning"
                                          style={{
                                            backgroundColor: "#CFD35E",
                                            border: "1px solid #CFD35E",
                                            color: "#FFFFFF",
                                          }}
                                        >
                                          Ubah
                                        </Link>
                                      </div>
                                    </td>
                                  )}

                                  <td style={{ textAlign: "center" }}>
                                    {value.jenis_kegiatan_rl_tiga_titik_lima.nama}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {value.kunjungan_pasien_dalam_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {value.kunjungan_pasien_dalam_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {value.kunjungan_pasien_luar_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {value.kunjungan_pasien_luar_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {value.total_kunjungan}
                                  </td>
                                </tr>
                              ))}

                              {dataCount.length > 0 && dataCount[0]?.total_kunjungan !== 0 && (
                                <tr>
                                  <td style={{ textAlign: "center" }}>99</td>

                                  {user?.jenisUserId === 4 && <td></td>}

                                  <td style={{ textAlign: "center" }}>
                                    Total
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[0].kunjungan_pasien_dalam_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[0].kunjungan_pasien_dalam_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[0].kunjungan_pasien_luar_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[0].kunjungan_pasien_luar_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[0].total_kunjungan}
                                  </td>
                                </tr>
                              )}

                              {dataCount.length > 1 && dataCount[1]?.total_kunjungan !== 0 && (
                                <tr>
                                  <td style={{ textAlign: "center" }}>77</td>

                                  {user?.jenisUserId === 4 && <td></td>}

                                  <td style={{ textAlign: "center" }}>
                                    Rata-rata kunjungan per hari
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[1].kunjungan_pasien_dalam_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[1].kunjungan_pasien_dalam_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[1].kunjungan_pasien_luar_kabkota_laki}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[1].kunjungan_pasien_luar_kabkota_perempuan}
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    {dataCount[1].total_kunjungan}
                                  </td>
                                </tr>
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
                        <h3 className={style.validasiCardTitle}>Validasi RL 3.5</h3>

                        {dataRL.length === 0 ? (
                          <div style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center"
                          }}>
                            <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
                          </div>

                        ) : (!dataValidasi && user.jenisUserId === 4) ? (
                          <div style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center"
                          }}>
                            <strong>Data Belum di Validasi</strong>
                          </div>

                        ) : (

                          <>
                            {dataValidasi && (
                              <div style={{
                                backgroundColor: "#f0f0f0",
                                padding: "12px",
                                borderRadius: "4px",
                                marginBottom: "15px"
                              }}>

                                <div style={{ display: "flex", marginBottom: "4px" }}>
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
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

                                {(dataValidasi.keteranganValidasi ||
                                  dataValidasi.catatan ||
                                  dataValidasi.keterangan) && (
                                  <div style={{ display: "flex", marginBottom: "4px" }}>
                                    <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
                                      Catatan
                                    </div>
                                    <div style={{ width: "10px" }}>:</div>
                                    <div>
                                      {dataValidasi.keteranganValidasi ||
                                        dataValidasi.catatan ||
                                        dataValidasi.keterangan}
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: "flex" }}>
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
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
                              <div style={{
                                backgroundColor: "#fff3cd",
                                border: "1px solid #ffc107",
                                color: "#856404",
                                padding: "15px",
                                borderRadius: "4px",
                                textAlign: "center"
                              }}>
                                <strong>Data telah divalidasi.</strong>
                              </div>

                            ) : (
                              <form onSubmit={simpanValidasi}>
                                <ToastContainer />

                                <div className={style.validasiFormGroup}>
                                  <label>Status</label>
                                  <select
                                    value={statusValidasi}
                                    onChange={statusValidasiChangeHadler}
                                  >
                                    <option value={0}>Pilih</option>

                                    {user.jenisUserId === 4
                                      ? <option value="2">Selesai Diperbaiki</option>
                                      : <>
                                        <option value="1">Perlu Perbaikan</option>
                                        <option value="3">Disetujui</option>
                                      </>
                                    }
                                  </select>
                                </div>

                                {user.jenisUserId !== 4 && (
                                  <div className={style.validasiFormGroup}>
                                    <label>Catatan</label>
                                    <textarea
                                      onChange={keteranganValidasiChangeHadler}
                                      rows={4}
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
              </div>
          </div>

          <div
            className={`tab-pane fade ${
              activeWadahTab === "satusehat" ? "show active" : ""
            }`}
          >
            <div
              className="border rounded-bottom shadow-sm bg-white"
              style={{ padding: "20px 24px" }}
            >
              {/* ── 1) CONTROL PANEL (PERIODE DATA + TOMBOL) ────────────────── */}
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
                    alignItems: "flex-end",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Bulan */}
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

                  {/* Tahun */}
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

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* ─── FILTER ─── */}
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

                    {/* ─── SYNC SATUSEHAT ─── */}
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

                    {/* ─── DOWNLOAD EXCEL ─── */}
                    <button
                      type="button"
                      onClick={handleDownloadExcelRLTigaTitikLimaSatusehat}
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

              {/* ── 2) 3 INFO CARDS ─────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                {/* Card 1 — KETERANGAN TOMBOL */}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
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

                {/* Card 2 — STATUS SINKRONISASI */}
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
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      flex: 1,
                    }}
                  >
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

                {/* Card 3 — SUMBER DATA */}
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

              {/* ── 3) FILTER LABEL + ALERT / STATUS ────────────────────────── */}

              {/* Filter label — tampilkan JIKA SUDAH DI-FILTER (tidak peduli data ada atau kosong) */}
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
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    Filtered By {filterLabelSatusehat.join(", ")}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    Total {dataRLSatusehat.length} baris
                  </div>
                </div>
              )}

              {/* Syncing — loading spinner */}
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

              {/* Belum filter */}
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

              {/* Sudah filter & data tidak ditemukan (kosong) */}
              {hasFilteredSatusehat &&
                !isSyncingSatusehat &&
                dataRLSatusehat.length === 0 && (
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
                      Filtered By {filterLabelSatusehat.join(", ")}
                    </div>
                    <div>
                      Data tidak ditemukan di SATUSEHAT untuk periode ini.
                      {lastSyncAt && (
                        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                          Terakhir sinkronisasi: {formatLastSyncAt(lastSyncAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* ── 4) TABEL DATA SATUSEHAT (TIDAK DIUBAH: struktur & endpoint berbeda) */}
              {hasFilteredSatusehat && dataRLSatusehat.length > 0 && (
                <div className={style["table-container"]}>
                  <div className="table-responsive">
                    <table className={style.table}>
                      <thead className={style.thead}>
                        <tr>
                          <th className={style["sticky-header"]}>No.</th>
                          <th className={style["sticky-header"]}>Jenis Kegiatan</th>
                          <th>Kunjungan Dalam Kota (L)</th>
                          <th>Kunjungan Dalam Kota (P)</th>
                          <th>Kunjungan Luar Kota (L)</th>
                          <th>Kunjungan Luar Kota (P)</th>
                          <th>Total Kunjungan</th>
                          <th>Rata-rata / hari</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRLSatusehat.map((value, index) => (
                          <tr key={`${value.jenis_kegiatan || ""}-${index}`}>
                            <td className={style["sticky-column"]}>{index + 1}</td>
                            <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                              {value.jenis_kegiatan}
                            </td>
                            <td>{value.kunjungan_dalam_kab_kota?.laki_laki ?? value.kunjungan_dalam_kab_kota_laki_laki ?? 0}</td>
                            <td>{value.kunjungan_dalam_kab_kota?.perempuan ?? value.kunjungan_dalam_kab_kota_perempuan ?? 0}</td>
                            <td>{value.kunjungan_luar_kab_kota?.laki_laki ?? value.kunjungan_luar_kab_kota_laki_laki ?? 0}</td>
                            <td>{value.kunjungan_luar_kab_kota?.perempuan ?? value.kunjungan_luar_kab_kota_perempuan ?? 0}</td>
                            <td>{value.total_kunjungan ?? 0}</td>
                            <td>{value.rata_rata_kunjungan_perhari ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL35;
