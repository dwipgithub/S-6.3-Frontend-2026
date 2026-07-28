import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL32.module.css";
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
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
// import Table from 'react-bootstrap/Table'
import { downloadExcel, DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL32 = () => {
  const [bulan, setBulan] = useState(0);
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
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [user, setUser] = useState({});
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [activeWadahTab, setActiveWadahTab] = useState("sirs");
  const [dataRL32Satusehat, setDataRL32Satusehat] = useState([]);
  const [namafileSatusehat, setNamaFileSatusehat] = useState("");
  const [filterLabelSatusehat, setFilterLabelSatusehat] = useState([]);
  const [isSyncingSatusehat, setIsSyncingSatusehat] = useState(false);
  const [isSyncCooldown, setIsSyncCooldown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hasFilteredSatusehat, setHasFilteredSatusehat] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const tableSatusehatRef = useRef(null);
  const syncCooldownTimeoutRef = useRef(null);
  const { CSRFToken } = useCSRFTokenContext();
  const syncCooldownMinutes = 5;
  const syncCooldownMs = syncCooldownMinutes * 60 * 1000;

  useEffect(() => {
    refreshToken();
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun("2026");
      return date.getFullYear();
    };
    getLastYear().then((results) => {});
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

  // Load validasi data secara realtime saat bulan/tahun/rumahSakit berubah
  useEffect(() => {
    if (activeTab === "tab2" && rumahSakit && rumahSakit.id && bulan !== 0 && tahun) {
      getValidasi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      }
      if (decoded.jenisUserId === 4) {
        if (!rumahSakit || !rumahSakit.id) {
          showRumahSakit(decoded.satKerId, response.data.accessToken);
        }
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

  const hitungPasienAkhirBulan = (index) => {
    const result =
      parseInt(dataRL[index].pasien_awal_bulan) +
      parseInt(dataRL[index].pasien_masuk) +
      parseInt(dataRL[index].pasien_pindahan) -
      (parseInt(dataRL[index].pasien_dipindahkan) +
        parseInt(dataRL[index].pasien_keluar_hidup) +
        parseInt(dataRL[index].pasien_keluar_mati_kurang_dari_48_jam) +
        parseInt(
          dataRL[index].pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam
        ) +
        parseInt(dataRL[index].pasien_wanita_keluar_mati_kurang_dari_48_jam) +
        parseInt(
          dataRL[index]
            .pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam
        ));
    return result;
  };

  const hitungJumlahHariPerawatan = (index) => {
    const result =
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_VVIP) +
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_VIP) +
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_1) +
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_2) +
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_3) +
      parseInt(dataRL[index].rincian_hari_perawatan_kelas_khusus);
    return result;
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

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
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

  const getRL32Satusehat = async (e) => {
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

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
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

    const filter = [];
    filter.push("Provinsi: ".concat(currentRumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(currentRumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabelSatusehat(filter);
    setHasFilteredSatusehat(true);
    setNamaFileSatusehat(`rl32_satusehat_${rsId}_${periode}-01`);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/getDataRLTigaTitikDuaSatusehatLocal",
        {
          headers,
          params: {
            rsId: rsId,
            bulan_laporan: periode,
          },
        }
      );

      const items = results?.data?.data || [];
      setDataRL32Satusehat(Array.isArray(items) ? items : []);
      if (show) handleClose();
    } catch (error) {
      setDataRL32Satusehat([]);
      const errMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Terjadi kesalahan sistem";

      toast.error(errMsg, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });

      if (show) handleClose();
    }
  };

  const syncDataRLTigaTitikDuaSatusehat = async () => {
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

      await axiosJWT.get("/apisirs6v2/rltigatitikduasatusehat", {
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
      await getRL32Satusehat();
      startSyncCooldown();
    } catch (error) {
      const errMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Gagal sync Satusehat";

      toast.error(errMsg, {
        position: toast.POSITION.TOP_RIGHT,
      });

      startSyncCooldown();
    } finally {
      setIsSyncingSatusehat(false);
    }
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
        "/apisirs6v2/rltigatitikduavalidasi",
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

  const getRL = async (e) => {
    e.preventDefault();
    const rsId = getSelectedRsId();
    if (!rsId) {
      toast(`rumah sakit harus dipilih`, {
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

    const filter = [];
    filter.push("nama: ".concat(currentRumahSakit?.nama ?? "Rumah Sakit"));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rsId,
          periode: String(tahun).concat("-").concat(bulan),
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdua",
        customConfig
      );

      const rlTigaTitikDuaDetails = results.data.data.map((value) => {
        return value;
      });

      setDataRL(rlTigaTitikDuaDetails);
      if (results.data.data.length > 0) {
        setNamaFile(
          "rl32_" + results.data.data[0].rs_id + "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
        );
      }
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
      handleClose();
      
      // Load validasi data setelah filter diterapkan
      try {
        const validasiConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: rsId,
            periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
          },
        };
        const validasiResponse = await axiosJWT.get(
          "/apisirs6v2/rltigatitikduavalidasi",
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

  const deleteRL = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(`/apisirs6v2/rltigatitikdua/${id}`, customConfig);
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

  const deleteConfirmation = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            deleteRL(id);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();
    
    const rsId = getSelectedRsId();
    if (!rsId) {
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
          `/apisirs6v2/rltigatitikduavalidasi/${validasiId}`,
          payload,
          customConfig
        );
        console.log("Response PATCH:", response.data);
        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
        });
        // Refresh validasi data tanpa reload halaman
        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        // Create new validation
        const createPayload = {
          rsId: rsId,
          periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
          jenisPeriode: 1,
          statusValidasiId: parseInt(statusValidasi),
          catatan: keteranganValidasi,
        };
        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitikduavalidasi",
          createPayload,
          customConfig
        );
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleWadahTabClick = (tab) => {
    setActiveWadahTab(tab);
  };

  const handleSatusehatFilterClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    getRL32Satusehat();
  };

  const handleSatusehatSyncClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    syncDataRLTigaTitikDuaSatusehat();
  };

  const handleDownloadExcelSatusehat = async () => {
    setIsDownloading(true);
    try {
      const header = [
        "No",
        "Jenis Pelayanan",
        "Pasien Awal Bulan",
        "Pasien Masuk",
        "Pasien Pindahan",
        "Pasien Dipindahkan",
        "Pasien Keluar Hidup",
        "Pasien Pria Keluar Mati <48 Jam",
        "Pasien Pria Keluar Mati >=48 Jam",
        "Pasien Wanita Keluar Mati <48 Jam",
        "Pasien Wanita Keluar Mati >=48 Jam",
        "Jumlah Lama Dirawat",
        "Pasien Akhir Bulan",
        "Jumlah Hari Perawatan",
        "Hari VVIP",
        "Hari VIP",
        "Hari Kelas 1",
        "Hari Kelas 2",
        "Hari Kelas 3",
        "Hari Kelas Khusus",
        "TT Awal",
      ];

      const body = dataRL32Satusehat.map((value, index) => [
        index + 1,
        value.nama_jenis_pelayanan || value.jenis_pelayanan || "-",
        value.pasien_awal_bulan || 0,
        value.pasien_masuk || 0,
        value.pasien_pindahan || 0,
        value.pasien_dipindahkan || 0,
        value.pasien_keluar_hidup || 0,
        value.mati_lk_kurang_48_jam || 0,
        value.mati_lk_lebih_sama_48_jam || 0,
        value.mati_pr_kurang_48_jam || 0,
        value.mati_pr_lebih_sama_48_jam || 0,
        value.jumlah_lama_dirawat || 0,
        value.pasien_akhir_bulan || 0,
        value.jumlah_hari_perawatan || 0,
        value.hari_vvip || 0,
        value.hari_vip || 0,
        value.hari_kelas_1 || 0,
        value.hari_kelas_2 || 0,
        value.hari_kelas_3 || 0,
        value.hari_kelas_khusus || 0,
        value.alokasi_tempat_tidur_awal_bulan || 0,
      ]);

      downloadExcel({
        fileName: namafileSatusehat || "rl32_satusehat",
        sheet: "data RL 32 Satusehat",
        tablePayload: {
          header,
          body,
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const calculateTotalPasienAwalBulan = (data) => {
    return data.reduce((sum, item) => sum + item.pasien_awal_bulan, 0);
  };
   const calculateTotalPasienMasuk = (data) => {
    return data.reduce((sum, item) => sum + item.pasien_masuk, 0);
  };
  const calculateTotalPasienPindahan = (data) => {
    return data.reduce((sum, item) => sum + item.pasien_pindahan, 0);
  };

  const calculateTotalPasienDipindahkan = (data) => {
    return data.reduce((sum, item) => sum + item.pasien_dipindahkan, 0);
  };

  const calculateTotalPasienKeluarHidup = (data) => {
    return data.reduce((sum, item) => sum + item.pasien_keluar_hidup, 0);
  };

  const calculateTotalPasienKeluarMatiKurangDari48Jam = (data) => {
    return data.reduce(
      (sum, item) => sum + item.pasien_keluar_mati_kurang_dari_48_jam,
      0
    );
  };

  const calculateTotalPasienMatiLebihDariAtauSamaDengan48Jam = (data) => {
    return data.reduce(
      (sum, item) =>
        sum + item.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam,
      0
    );
  };

  const calculateTotalPasienWanitaKeluarMatiKurangDari48Jam = (data) => {
    return data.reduce(
      (sum, item) => sum + item.pasien_wanita_keluar_mati_kurang_dari_48_jam,
      0
    );
  };

  const calculateTotalPasienWanitaMatiLebihDariAtauSamaDengan48Jam = (data) => {
    return data.reduce(
      (sum, item) =>
        sum + item.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam,
      0
    );
  };

  const calculateTotalJumlahDirawat = (data) => {
    return data.reduce((sum, item) => sum + item.jumlah_lama_dirawat, 0);
  };

  const calculateTotalPasienAkhirBulan = (data) => {
    return data.reduce(
      (sum, item) =>
        sum +
        (parseInt(item.pasien_awal_bulan) +
          parseInt(item.pasien_masuk) +
          parseInt(item.pasien_pindahan)) -
        (parseInt(item.pasien_dipindahkan) +
          parseInt(item.pasien_keluar_hidup) +
          parseInt(item.pasien_keluar_mati_kurang_dari_48_jam) +
          parseInt(item.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam) +
          parseInt(item.pasien_wanita_keluar_mati_kurang_dari_48_jam) +
          parseInt(
            item.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam
          )),
      0
    );
  };

  const calculateTotalHariPerawatan = (data) => {
    return data.reduce(
      (sum, item) =>
        sum +
        parseInt(item.rincian_hari_perawatan_kelas_VVIP) +
        parseInt(item.rincian_hari_perawatan_kelas_VIP) +
        parseInt(item.rincian_hari_perawatan_kelas_1) +
        parseInt(item.rincian_hari_perawatan_kelas_2) +
        parseInt(item.rincian_hari_perawatan_kelas_3) +
        parseInt(item.rincian_hari_perawatan_kelas_khusus),
      0
    );
  };

  const calculateTotalKelasVVIP = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_VVIP,
      0
    );
  };

  const calculateTotalKelasVIP = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_VIP,
      0
    );
  };

  const calculateTotalKelas1 = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_1,
      0
    );
  };

  const calculateTotalKelas2 = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_2,
      0
    );
  };

  const calculateTotalKelas3 = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_3,
      0
    );
  };

  const calculateTotalKelasKhusus = (data) => {
    return data.reduce(
      (sum, item) => sum + item.rincian_hari_perawatan_kelas_khusus,
      0
    );
  };

  const calculateTotalJumlahAlokasiTempatTidurAwalBulan = (data) => {
    return data.reduce(
      (sum, item) => sum + item.jumlah_alokasi_tempat_tidur_awal_bulan,
      0
    );
  };

  const isAksi = user.jenisUserId === 4;

  const totalPasienAwalBulan = calculateTotalPasienAwalBulan(dataRL);
  const totalPasienMasuk = calculateTotalPasienMasuk(dataRL);
  const totalPasienPindahan = calculateTotalPasienPindahan(dataRL);
  const totalPasienDipindahkan = calculateTotalPasienDipindahkan(dataRL);
  const totalPasienKeluarHidup = calculateTotalPasienKeluarHidup(dataRL);
  const totalPasienKeluarMatiKurangDari48Jam =
    calculateTotalPasienKeluarMatiKurangDari48Jam(dataRL);
  const totalPasienKeluarMatiLebihDariAtauSamaDengan48Jam =
    calculateTotalPasienMatiLebihDariAtauSamaDengan48Jam(dataRL);
  const totalPasienWanitaKeluarMatiKurangDari48Jam =
    calculateTotalPasienWanitaKeluarMatiKurangDari48Jam(dataRL);
  const totalPasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam =
    calculateTotalPasienWanitaMatiLebihDariAtauSamaDengan48Jam(dataRL);
  const totalJumlahDirawat = calculateTotalJumlahDirawat(dataRL);
  const totalPasienAkhirBulan = calculateTotalPasienAkhirBulan(dataRL);
  const totalHariPerawatan = calculateTotalHariPerawatan(dataRL);
  const totalKelasVVIP = calculateTotalKelasVVIP(dataRL);
  const totalKelasVIP = calculateTotalKelasVIP(dataRL);
  const totalKelas1 = calculateTotalKelas1(dataRL);
  const totalKelas2 = calculateTotalKelas2(dataRL);
  const totalKelas3 = calculateTotalKelas3(dataRL);
  const totalKelasKhusus = calculateTotalKelasKhusus(dataRL);
  const totalTotalJumlahAlokasiTempatTidurAwalBulan =
    calculateTotalJumlahAlokasiTempatTidurAwalBulan(dataRL);

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={activeWadahTab === "satusehat" ? getRL32Satusehat : getRL}>
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
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}> RL 3.2 Rawat Inap</h4>

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
                {user.jenisUserId === 4 ? (
                  <Link
                    to={`/rl32/tambah/`}
                    className={style.btnPrimary}
                    style={{ textDecoration: "none" }}
                  >
                    Tambah
                  </Link>
                ) : (
                  <></>
                )}
                <button
                  type="button"
                  className={style.btnPrimary}
                  onClick={handleShow}
                >
                  Filter
                </button>
                <DownloadTableExcel
                  filename={namafile}
                  sheet="data RL 32"
                  currentTableRef={tableRef.current}
                >
                  <button type="button" className={style.btnPrimary}>
                    Download
                  </button>
                </DownloadTableExcel>
              </div>
              <div className={style.filterLabel}>
                {filterLabel.length > 0 ? (
                  <>
                    Filter: {filterLabel.map((value) => value).join(" · ")}
                  </>
                ) : null}
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
                  {[3, 4].includes(user.jenisUserId) ? (
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
                      <div className="table-responsive">
                        <table className={style.table} ref={tableRef}>
                          <thead className={style.thead}>
                            <tr>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>No.</th>
                              {isAksi && <th rowSpan="2" style={{ verticalAlign: "middle" }}>Aksi</th>}
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jenis Pelayanan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Awal Bulan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Masuk</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Pindahan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Dipindahkan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Keluar Hidup</th>
                              <th colSpan="2" style={{ textAlign: "center" }}>Pasien Pria Keluar Mati</th>
                              <th colSpan="2" style={{ textAlign: "center" }}>Pasien Wanita Keluar Mati</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jumlah Lama Dirawat</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Akhir Bulan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jumlah Hari Perawatan</th>
                              <th colSpan="6" style={{ textAlign: "center" }}>Rincian Hari Perawatan</th>
                              <th rowSpan="2" style={{ verticalAlign: "middle" }}>TT Awal</th>
                            </tr>
                            <tr className={style["subheader-row"]}>
                              <th>{"<48 jam"}</th>
                              <th>{">=48 jam"}</th>
                              <th>{"<48 jam"}</th>
                              <th>{">=48 jam"}</th>
                              <th>VVIP</th>
                              <th>VIP</th>
                              <th>1</th>
                              <th>2</th>
                              <th>3</th>
                              <th>Khusus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataRL.map((value, index) => (
                              <tr key={value.id}>
                                <td>{index + 1}</td>
                                {isAksi && (
                                  <td>
                                    <div style={{ display: "flex" }}>
                                      <button
                                        className="btn btn-danger"
                                        style={{
                                          marginRight: "5px",
                                          backgroundColor: "#FF6663",
                                          border: "1px solid #FF6663",
                                        }}
                                        onClick={() => deleteConfirmation(value.id)}
                                      >
                                        Hapus
                                      </button>
                                      <Link
                                        to={`/rl32/ubah/${value.id}`}
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

                            <td>{value.nama_jenis_pelayanan}</td>
                            <td>{value.pasien_awal_bulan}</td>
                            <td>{value.pasien_masuk}</td>
                            <td>{value.pasien_pindahan}</td>
                            <td>{value.pasien_dipindahkan}</td>
                            <td>{value.pasien_keluar_hidup}</td>

                            <td>{value.pasien_keluar_mati_kurang_dari_48_jam}</td>
                            <td>{value.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam}</td>
                            <td>{value.pasien_wanita_keluar_mati_kurang_dari_48_jam}</td>
                            <td>{value.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam}</td>

                            <td>{value.jumlah_lama_dirawat}</td>
                            <td>{hitungPasienAkhirBulan(index)}</td>
                            <td>{hitungJumlahHariPerawatan(index)}</td>

                            <td>{value.rincian_hari_perawatan_kelas_VVIP}</td>
                            <td>{value.rincian_hari_perawatan_kelas_VIP}</td>
                            <td>{value.rincian_hari_perawatan_kelas_1}</td>
                            <td>{value.rincian_hari_perawatan_kelas_2}</td>
                            <td>{value.rincian_hari_perawatan_kelas_3}</td>
                            <td>{value.rincian_hari_perawatan_kelas_khusus}</td>

                            <td>{value.jumlah_alokasi_tempat_tidur_awal_bulan}</td>
                          </tr>
                        ))}

                        {dataRL.length > 0 && (
                            <tr>
                              <td></td>

                              {/* kolom aksi tetap dihitung */}
                              {isAksi && <td></td>}

                              <td>Total</td>

                              <td>{totalPasienAwalBulan}</td>
                              <td>{totalPasienMasuk}</td>
                              <td>{totalPasienPindahan}</td>
                              <td>{totalPasienDipindahkan}</td>
                              <td>{totalPasienKeluarHidup}</td>

                              <td>{totalPasienKeluarMatiKurangDari48Jam}</td>
                              <td>{totalPasienKeluarMatiLebihDariAtauSamaDengan48Jam}</td>
                              <td>{totalPasienWanitaKeluarMatiKurangDari48Jam}</td>
                              <td>{totalPasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam}</td>

                              <td>{totalJumlahDirawat}</td>
                              <td>{totalPasienAkhirBulan}</td>
                              <td>{totalHariPerawatan}</td>

                              <td>{totalKelasVVIP}</td>
                              <td>{totalKelasVIP}</td>
                              <td>{totalKelas1}</td>
                              <td>{totalKelas2}</td>
                              <td>{totalKelas3}</td>
                              <td>{totalKelasKhusus}</td>

                              <td>{totalTotalJumlahAlokasiTempatTidurAwalBulan}</td>
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
                    <h3 className={style.validasiCardTitle}>Validasi RL 3.2</h3>

                    {/* =========================
                        1️⃣ DATA RL KOSONG
                    ========================== */}
                    {dataRL.length === 0 ? (
                      <div style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center"
                      }}>
                        <strong>Silahkan pilih filter terlebih dahulu untuk menampilkan data. </strong>
                      </div>

                    /* =========================
                        2️⃣ RS BELUM PERNAH DIVALIDASI
                    ========================== */
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
                        {/* =========================
                            3️⃣ INFO VALIDASI
                        ========================== */}
                        {dataValidasi && (
                              <div style={{
                                backgroundColor: "#f0f0f0",
                                padding: "12px",
                                borderRadius: "4px",
                                marginBottom: "15px"
                              }}>

                                {/* STATUS */}
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

                                {/* CATATAN */}
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

                                {/* DIBUAT */}
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

                        {/* =========================
                            4️⃣ STATUS FINAL LOCK
                        ========================== */}
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

                          /* =========================
                              5️⃣ FORM VALIDASI
                          ========================== */
                          <form onSubmit={simpanValidasi}>
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

                            {/* ✅ TEXTAREA HANYA UNTUK VALIDATOR */}
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

            <div
              className={`tab-pane fade ${
                activeWadahTab === "satusehat" ? "show active" : ""
              }`}
            >
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                          minWidth: 180,
                        }}
                      >
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
                            {daftarBulan.map((value) => (
                              <option key={value.value} value={value.value}>
                                {value.key}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                          minWidth: 150,
                        }}
                      >
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
                        onMouseOver={(e) =>
                          canSync && (e.currentTarget.style.opacity = "0.9")
                        }
                        onMouseOut={(e) =>
                          canSync && (e.currentTarget.style.opacity = "1")
                        }
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
                        onClick={handleDownloadExcelSatusehat}
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
                          !isDownloading &&
                          hasFilteredSatusehat &&
                          (e.currentTarget.style.opacity = "0.9")
                        }
                        onMouseOut={(e) =>
                          !isDownloading &&
                          hasFilteredSatusehat &&
                          (e.currentTarget.style.opacity = "1")
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
                      Filtered By {filterLabelSatusehat.join(", ")}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                      Total {dataRL32Satusehat.length} baris
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
                  dataRL32Satusehat.length === 0 && (
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
                        {lastSyncAt && !isSyncCooldown
                          ? "Data tidak ditemukan di SATUSEHAT untuk periode ini."
                          : "Belum sinkronisasi dengan SATUSEHAT untuk periode ini."}
                        {lastSyncAt && (
                          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                            Terakhir sinkronisasi: {formatLastSyncAt(lastSyncAt)}
                          </div>
                        )}
                        {!lastSyncAt && (
                          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                            Terakhir sinkronisasi: -
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {hasFilteredSatusehat && dataRL32Satusehat.length > 0 && (
                  <div className={style["table-container"]}>
                    <div className="table-responsive">
                      <table className={style.table} ref={tableSatusehatRef}>
                        <thead className={style.thead}>
                          <tr>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>No.</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jenis Pelayanan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Awal Bulan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Masuk</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Pindahan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Dipindahkan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Keluar Hidup</th>
                            <th colSpan="2" style={{ textAlign: "center" }}>Pasien Pria Keluar Mati</th>
                            <th colSpan="2" style={{ textAlign: "center" }}>Pasien Wanita Keluar Mati</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jumlah Lama Dirawat</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Pasien Akhir Bulan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>Jumlah Hari Perawatan</th>
                            <th colSpan="6" style={{ textAlign: "center" }}>Rincian Hari Perawatan</th>
                            <th rowSpan="2" style={{ verticalAlign: "middle" }}>TT Awal</th>
                          </tr>
                          <tr className={style["subheader-row"]}>
                            <th>{"<48 jam"}</th>
                            <th>{">=48 jam"}</th>
                            <th>{"<48 jam"}</th>
                            <th>{">=48 jam"}</th>
                            <th>VVIP</th>
                            <th>VIP</th>
                            <th>1</th>
                            <th>2</th>
                            <th>3</th>
                            <th>Khusus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataRL32Satusehat.map((value, index) => (
                            <tr key={`${value.code || value.jenis_pelayanan || "row"}-${index}`}>
                              <td>{index + 1}</td>
                              <td>{value.nama_jenis_pelayanan || value.jenis_pelayanan}</td>
                              <td>{value.pasien_awal_bulan || 0}</td>
                              <td>{value.pasien_masuk || 0}</td>
                              <td>{value.pasien_pindahan || 0}</td>
                              <td>{value.pasien_dipindahkan || 0}</td>
                              <td>{value.pasien_keluar_hidup || 0}</td>
                              <td>{value.mati_lk_kurang_48_jam || 0}</td>
                              <td>{value.mati_lk_lebih_sama_48_jam || 0}</td>
                              <td>{value.mati_pr_kurang_48_jam || 0}</td>
                              <td>{value.mati_pr_lebih_sama_48_jam || 0}</td>
                              <td>{value.jumlah_lama_dirawat || 0}</td>
                              <td>{value.pasien_akhir_bulan || 0}</td>
                              <td>{value.jumlah_hari_perawatan || 0}</td>
                              <td>{value.hari_vvip || 0}</td>
                              <td>{value.hari_vip || 0}</td>
                              <td>{value.hari_kelas_1 || 0}</td>
                              <td>{value.hari_kelas_2 || 0}</td>
                              <td>{value.hari_kelas_3 || 0}</td>
                              <td>{value.hari_kelas_khusus || 0}</td>
                              <td>{value.alokasi_tempat_tidur_awal_bulan || 0}</td>
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
    </div>
  );
};

export default RL32;
