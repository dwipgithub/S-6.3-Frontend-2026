import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL33.module.css";
import {
  FaCalendarAlt,
  FaClock,
  FaDatabase,
  FaFileExcel,
  FaInfoCircle,
  FaSyncAlt,
  FaCheckCircle,
  FaFilter
} from "react-icons/fa";
import { HiPlus, HiSaveAs } from "react-icons/hi";
import { SiMicrosoftexcel } from "react-icons/si";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL33 = () => {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState("01");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [dataRLSatusehat, setDataRLSatusehat] = useState([]);
  const [hasFilteredSatusehat, setHasFilteredSatusehat] = useState(false);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  
  // State Validasi disamakan persis dengan RL41
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
  const [selectedRsID, setSelectedRsID] = useState(null);

  const [activeTab, setActiveTab] = useState("tab1");
  const [activeWadahTab, setActiveWadahTab] = useState("satusehat");
  const [filterLabelSatusehat, setFilterLabelSatusehat] = useState([]);
  const [isSyncingSatusehat, setIsSyncingSatusehat] = useState(false);
  const [isSyncCooldown, setIsSyncCooldown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);

  const navigate = useNavigate();
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
    refreshToken();
    getBulan();
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
      if (decoded.jenisUserId === 4) {
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
    (error) => {
      return Promise.reject(error);
    }
  );

  const getBulan = async () => {
    const results = [
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
    ];
    setDaftarBulan([...results]);
  };

  const bulanChangeHandler = (e) => {
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
      setSelectedRsID(selected.id);
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
          periode: String(tahun).concat("-").concat(bulan),
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktigavalidasi",
        customConfig
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
        setTglValidasi(results.data.data[0].modifiedAt || results.data.data[0].createdAt);
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

  const getDataRLTigaTitikTiga = async (e) => {
    if (e) e.preventDefault();

    if (user.jenisUserId === 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
    }

    const filter = [];
    if (rumahSakit?.nama) filter.push("Nama Rumah Sakit: " + rumahSakit.nama);
    filter.push("Periode: " + `${tahun}-${bulan}`);
    setFilterLabel(filter);

    setSpinner(true);
    handleClose();
    setActiveTab("tab1");
    setIsFilterApplied(true);

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          tahun: tahun,
          bulan: parseInt(bulan, 10),
        },
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktiga",
        customConfig
      );

      if (!results.data.data || results.data.data.length === 0) {
        setDataRL([]);
        toast("Data RL tidak ditemukan", {
          position: toast.POSITION.TOP_RIGHT,
        });
      } else {
        let dataRLTigaTitikTigaDetails = [];
        results.data.data.forEach((value) => {
          if (value.rl_tiga_titik_tiga_details) {
            value.rl_tiga_titik_tiga_details.forEach((v) => {
              dataRLTigaTitikTigaDetails.push(v);
            });
          }
        });
        setDataRL(dataRLTigaTitikTigaDetails);
      }

      await getValidasi();
    } catch (error) {
      console.log(error);
      toast("Gagal mengambil data RL", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setSpinner(false);
    }
  };

  const getDataRLTigaTitikTigaSatusehat = async (e) => {
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

    const periode = `${tahun}-${bulan}`;
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
        "/apisirs6v2/getDataRLTigaTitikTigaSatusehatLocal",
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

  const startSyncCooldown = () => {
    setIsSyncCooldown(true);

    if (syncCooldownTimeoutRef.current) {
      clearTimeout(syncCooldownTimeoutRef.current);
    }

    syncCooldownTimeoutRef.current = setTimeout(() => {
      setIsSyncCooldown(false);
    }, syncCooldownMs);
  };

  const syncDataRLTigaTitikTigaSatusehat = async () => {
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

    const periode = `${tahun}-${bulan}`;

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

      await axiosJWT.get("/apisirs6v2/rltigatitiktigasatusehat", {
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
      await getDataRLTigaTitikTigaSatusehat();
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

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      let parent;
      const currentData = await getRLTigaTitikTigaById(id);

      if (currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.startsWith("1.")) {
        parent = await getParent(1, id);
      } else if (
        currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.startsWith("2.")
      ) {
        parent = await getParent(2, id);
      }

      if (parent) {
        await axiosJWT.patch(
          `/apisirs6v2/rltigatitiktigadetail/${parent.id}`,
          parent.data,
          customConfig
        );
      }
      await axiosJWT.delete(`/apisirs6v2/rltigatitiktiga/${id}`, customConfig);

      setDataRL((current) => current.filter((value) => value.id !== id));

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
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
          onClick: () => hapusData(id),
        },
        {
          label: "Tidak",
        },
      ],
    });
  };

  const getParent = async (filter, id) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktigadetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newResponse = await axiosJWT.get("/apisirs6v2/rltigatitiktiga", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        tahun: tahun,
        bulan: parseInt(bulan, 10),
      },
    });

    let dataRLTigaTitikTigaDetails = [];
    const rlTigaTitikTigaDetails = newResponse.data.data.map((value) => {
      return value.rl_tiga_titik_tiga_details;
    });
    rlTigaTitikTigaDetails.forEach((element) => {
      element.forEach((value) => {
        dataRLTigaTitikTigaDetails.push(value);
      });
    });

    const parent = dataRLTigaTitikTigaDetails
      .filter((value) => {
        const no = value.jenis_pelayanan_rl_tiga_titik_tiga.no;
        return no === `${filter}.` || no === String(filter);
      })
      .map((value) => {
        return {
          id: value.id,
          data: {
            total_pasien_rujukan:
              value.total_pasien_rujukan - response.data.data.total_pasien_rujukan,
            total_pasien_non_rujukan:
              value.total_pasien_non_rujukan - response.data.data.total_pasien_non_rujukan,
            tlp_dirawat: value.tlp_dirawat - response.data.data.tlp_dirawat,
            tlp_dirujuk: value.tlp_dirujuk - response.data.data.tlp_dirujuk,
            tlp_pulang: value.tlp_pulang - response.data.data.tlp_pulang,
            m_igd_laki: value.m_igd_laki - response.data.data.m_igd_laki,
            m_igd_perempuan: value.m_igd_perempuan - response.data.data.m_igd_perempuan,
            doa_laki: value.doa_laki - response.data.data.doa_laki,
            doa_perempuan: value.doa_perempuan - response.data.data.doa_perempuan,
            luka_laki: value.luka_laki - response.data.data.luka_laki,
            luka_perempuan: value.luka_perempuan - response.data.data.luka_perempuan,
            false_emergency: value.false_emergency - response.data.data.false_emergency,
          },
        };
      });

    return parent[0];
  };

  const getRLTigaTitikTigaById = async (id) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktigadetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;

    switch (jenisUserId) {
      case 1:
      case 99:
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
      setDaftarProvinsi(results.data.data);
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
        params: { provinsiId },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);
      setDaftarKabKota(results.data.data);
    } catch (error) {
      console.log(error);
    }
  };

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
      toast(`Catatan tidak boleh kosong`, {
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

      if (idValidasi !== "") {
        await axiosJWT.patch(
          `/apisirs6v2/rltigatitiktigavalidasi/${idValidasi}`,
          {
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rltigatitiktigavalidasi",
          {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(bulan),
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig
        );
      }
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setIsValidated(statusValidasi == 3);
      await getValidasi();
    } catch (error) {
      toast(
        `Data tidak bisa disimpan karena: ${
          error.response?.data?.message || error.message
        }`,
        { position: toast.POSITION.TOP_RIGHT }
      );
    }
    setSpinner(false);
  };

  const handleTabClick = (tab) => {
    if (tab === "tab2") {
      getValidasi();
    }
    setActiveTab(tab);
  };

  const handleWadahTabClick = (tab) => {
    setActiveWadahTab(tab);
  };

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

  useEffect(() => {
    setNow(Date.now());
    if (!lastSyncAt || isSyncCooldown) return;
    const elapsed = (Date.now() - new Date(lastSyncAt).getTime()) / 60000;
    if (elapsed >= syncCooldownMinutes) return;
    const remainingMs = (syncCooldownMinutes - elapsed) * 60 * 1000;
    const timeout = setTimeout(() => setNow(Date.now()), remainingMs);
    return () => clearTimeout(timeout);
  }, [lastSyncAt, isSyncCooldown]);

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

  const handleSatusehatFilterClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    getDataRLTigaTitikTigaSatusehat();
  };

  const handleSatusehatSyncClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    syncDataRLTigaTitikTigaSatusehat();
  };

  const getSelectedRsId = () => {
    const rsFromState = rumahSakit && rumahSakit.id ? rumahSakit.id : null;
    if (rsFromState && String(rsFromState) !== "0") return Number(rsFromState);
    if (user && user.jenisUserId === 4 && user.satKerId) return Number(user.satKerId);
    return null;
  };

  let total = {
    total_pasien_rujukan: 0,
    total_pasien_non_rujukan: 0,
    tlp_dirawat: 0,
    tlp_dirujuk: 0,
    tlp_pulang: 0,
    m_igd_laki: 0,
    m_igd_perempuan: 0,
    doa_laki: 0,
    doa_perempuan: 0,
    luka_laki: 0,
    luka_perempuan: 0,
    false_emergency: 0,
  };

  dataRL
    .filter((value) => {
      return (
        value.jenis_pelayanan_rl_tiga_titik_tiga.no != 1 &&
        value.jenis_pelayanan_rl_tiga_titik_tiga.no != 2
      );
    })
    .forEach((value) => {
      total.total_pasien_rujukan += parseInt(value.total_pasien_rujukan || 0);
      total.total_pasien_non_rujukan += parseInt(value.total_pasien_non_rujukan || 0);
      total.tlp_dirawat += parseInt(value.tlp_dirawat || 0);
      total.tlp_dirujuk += parseInt(value.tlp_dirujuk || 0);
      total.tlp_pulang += parseInt(value.tlp_pulang || 0);
      total.m_igd_laki += parseInt(value.m_igd_laki || 0);
      total.m_igd_perempuan += parseInt(value.m_igd_perempuan || 0);
      total.doa_laki += parseInt(value.doa_laki || 0);
      total.doa_perempuan += parseInt(value.doa_perempuan || 0);
      total.luka_laki += parseInt(value.luka_laki || 0);
      total.luka_perempuan += parseInt(value.luka_perempuan || 0);
      total.false_emergency += parseInt(value.false_emergency || 0);
    });

  function handleDownloadExcel() {
    const header = [
      "No",
      "No Pelayanan",
      "Jenis Pelayanan",
      "Total Pasien Rujukan",
      "Total Pasien Non Rujukan",
      "Tindak Lanjut Dirawat",
      "Tindak Lanjut Dirujuk",
      "Tindak Lanjut Pulang",
      "Mati di IGD (L)",
      "Mati di IGD (P)",
      "DOA (L)",
      "DOA (P)",
      "Luka-luka (L)",
      "Luka-luka (P)",
      "False Emergency",
    ];

    const body = dataRL
      .filter(
        (value) =>
          value.total_pasien_rujukan > 0 ||
          value.total_pasien_non_rujukan > 0
      )
      .map((value, index) => [
        index + 1,
        value.jenis_pelayanan_rl_tiga_titik_tiga.no,
        value.jenis_pelayanan_rl_tiga_titik_tiga.nama,
        value.total_pasien_rujukan,
        value.total_pasien_non_rujukan,
        value.tlp_dirawat,
        value.tlp_dirujuk,
        value.tlp_pulang,
        value.m_igd_laki,
        value.m_igd_perempuan,
        value.doa_laki,
        value.doa_perempuan,
        value.luka_laki,
        value.luka_perempuan,
        value.false_emergency,
      ]);

    body.push([
      "", 
      "", 
      "TOTAL",
      total.total_pasien_rujukan,
      total.total_pasien_non_rujukan,
      total.tlp_dirawat,
      total.tlp_dirujuk,
      total.tlp_pulang,
      total.m_igd_laki,
      total.m_igd_perempuan,
      total.doa_laki,
      total.doa_perempuan,
      total.luka_laki,
      total.luka_perempuan,
      total.false_emergency,
    ]);

    downloadExcel({
      fileName: `rl33_${rumahSakit.id || ""}_${tahun}-${bulan}`,
      sheet: "RL 3.3",
      tablePayload: { header, body },
    });
  }

  function handleDownloadExcelSatusehat() {
    if (!hasFilteredSatusehat) {
      toast("Terapkan filter terlebih dahulu", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    setIsDownloading(true);
    try {
      const header = [
        "No",
        "Periode",
        "Kategori",
        "Jenis Pelayanan",
        "Total Pasien Rujukan",
        "Total Pasien Non Rujukan",
        "Tindak Lanjut Dirawat",
        "Tindak Lanjut Dirujuk",
        "Tindak Lanjut Pulang",
        "Mati di IGD (L)",
        "Mati di IGD (P)",
        "DOA (L)",
        "DOA (P)",
        "Luka-luka (L)",
        "Luka-luka (P)",
        "False Emergency",
      ];

      const body = (Array.isArray(dataRLSatusehat) ? dataRLSatusehat : []).map(
        (value, index) => [
          index + 1,
          value.month_year || `${tahun}-${bulan}`,
          value.kategori,
          value.jenis_pelayanan,
          value.total_pasien_rujukan,
          value.total_pasien_non_rujukan,
          value.tindak_lanjut_dirawat,
          value.tindak_lanjut_dirujuk,
          value.tindak_lanjut_pulang,
          value.mati_di_igd_laki_laki,
          value.mati_di_igd_perempuan,
          value.doa_laki_laki,
          value.doa_perempuan,
          value.luka_luka_laki_laki,
          value.luka_luka_perempuan,
          value.false_emergency,
        ]
      );

      downloadExcel({
        fileName: "RL_3_3_SatuSehat",
        sheet: "RL 3.3 SatuSehat",
        tablePayload: { header, body },
      });
    } finally {
      setIsDownloading(false);
    }
  }

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

      {/* MODAL FILTER PERSIS RL41 */}
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form
          onSubmit={
            activeWadahTab === "satusehat"
              ? getDataRLTigaTitikTigaSatusehat
              : getDataRLTigaTitikTiga
          }
        >
          <Modal.Body>
            {user.jenisUserId === 1 || user.jenisUserId === 99 ? (
              <>
                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="provinsi"
                    id="provinsi"
                    className="form-select"
                    onChange={provinsiChangeHandler}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarProvinsi.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={kabKotaChangeHandler}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
                  >
                    <option key={0} value={0}>{loadingRS ? "Loading..." : "Pilih"}</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : null}

            {user.jenisUserId === 2 ? (
              <>
                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={kabKotaChangeHandler}
                  >
                    <option key={0} value={0}>Pilih</option>
                    {daftarKabKota.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
                  >
                    <option key={0} value={0}>{loadingRS ? "Loading..." : "Pilih"}</option>
                    {daftarRumahSakit.map((nilai) => (
                      <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                    ))}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : null}

            {user.jenisUserId === 3 ? (
              <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                <select
                  name="rumahSakit"
                  id="rumahSakit"
                  className="form-select"
                  value={selectedRsID || ""}
                  onChange={handleSelectRumahSakit}
                >
                  <option key={0} value={0}>{loadingRS ? "Loading..." : "Pilih"}</option>
                  {daftarRumahSakit.map((nilai) => (
                    <option key={nilai.id} value={nilai.id}>{nilai.nama}</option>
                  ))}
                </select>
                <label htmlFor="rumahSakit">Rumah Sakit</label>
              </div>
            ) : null}

            <div className="form-floating" style={{ width: "70%", display: "inline-block" }}>
              <select
                className="form-control"
                value={bulan}
                onChange={bulanChangeHandler}
              >
                {daftarBulan.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.key}
                  </option>
                ))}
              </select>
              <label>Bulan</label>
            </div>

            <div className="form-floating" style={{ width: "30%", display: "inline-block" }}>
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={tahunChangeHandler}
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

      {/* HEADER UTAMA */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>RL. 3.3 - Rawat Darurat</h4>
          </div>
          
          {/* TAB UTAMA (SIRS & SATUSEHAT) */}
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

          <div className="tab-content mt-0">
          {/* TAB SIRS */}
          {activeWadahTab === "sirs" ? (
            <div className="border rounded-bottom p-4 shadow-sm bg-white">
              <div className={style.toolbar}>
                {user.jenisUserId === 4 ? (
                  <Link
                    to={`/rl33/tambah/`}
                    className={style.btnPrimary}
                    style={{ textDecoration: "none" }}
                  >
                    Tambah
                  </Link>
                ) : null}
                <button type="button" className={style.btnPrimary} onClick={handleShow}>
                  Filter
                </button>
                <button type="button" className={style.btnPrimary} onClick={handleDownloadExcel}>
                  Download
                </button>
              </div>

              <div className={style.filterLabel}>
                {filterLabel.length > 0 ? (
                  <div>
                    <h5 style={{ fontSize: "14px" }}>
                      Filtered By {filterLabel.join(", ")}
                    </h5>
                  </div>
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
                  {[1, 2, 3, 4].includes(user.jenisUserId) && (
                    <li className={`nav-item ${style.navItem}`}>
                      <button
                        type="button"
                        className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                        onClick={() => handleTabClick("tab2")}
                      >
                        Validasi
                      </button>
                    </li>
                  )}
                </ul>

                <div className={`tab-content ${style.tabContent}`}>
                  <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
                    <div className={style["table-container"]}>
                      <div className="table-responsive">
                        <table className={style.table}>
                          <thead className={style.thead}>
                            <tr>
                              <th style={{ width: "2%" }} rowSpan={2} className={style["sticky-header"]}>No.</th>
                              {user.jenisUserId === 4 && (
                                <th style={{ width: "7%" }} rowSpan={2} className={style["sticky-header"]}>Aksi</th>
                              )}
                              <th style={{ width: "13%", textAlign: "center" }} rowSpan={2} className={style["sticky-header"]}>Jenis Pelayanan</th>
                              <th colSpan={2}>Total Pasien</th>
                              <th colSpan={3}>Tindak Lanjut Pelayanan</th>
                              <th colSpan={2}>Mati di IGD</th>
                              <th colSpan={2}>DOA</th>
                              <th colSpan={2}>Luka-luka</th>
                              <th style={{ verticalAlign: "middle" }} rowSpan={2}>False Emergency</th>
                            </tr>
                            <tr className={style["subheader-row"]}>
                              <th>Rujukan</th>
                              <th>Non Rujukan</th>
                              <th>Dirawat</th>
                              <th>Dirujuk</th>
                              <th>Pulang</th>
                              <th style={{ width: "5%" }}>Laki-laki</th>
                              <th style={{ width: "5%" }}>Perempuan</th>
                              <th style={{ width: "5%" }}>Laki-laki</th>
                              <th style={{ width: "5%" }}>Perempuan</th>
                              <th style={{ width: "5%" }}>Laki-laki</th>
                              <th style={{ width: "5%" }}>Perempuan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataRL.length > 0 && (
                              <>
                                {dataRL
                                  .filter(
                                    (value) =>
                                      value.total_pasien_rujukan > 0 ||
                                      value.total_pasien_non_rujukan > 0
                                  )
                                  .map((value) => (
                                    <tr key={value.id}>
                                      <td className={style["sticky-column"]}>
                                        {value.jenis_pelayanan_rl_tiga_titik_tiga.no}
                                      </td>
                                      {user.jenisUserId === 4 && (
                                        <td className={style["sticky-column"]} style={{ textAlign: "center", verticalAlign: "middle" }}>
                                          {value.jenis_pelayanan_rl_tiga_titik_tiga.no != 1 && value.jenis_pelayanan_rl_tiga_titik_tiga.no != 2 && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "nowrap" }}>
                                              <button
                                                className="btn btn-danger"
                                                style={{ backgroundColor: "#FF6663", border: "1px solid #FF6663", whiteSpace: "nowrap", padding: "4px 10px", fontSize: "12px" }}
                                                type="button"
                                                onClick={() => hapus(value.id)}
                                              >
                                                Hapus
                                              </button>
                                              <Link
                                                to={`/rl33/ubah/${value.id}`}
                                                className="btn btn-warning"
                                                style={{ backgroundColor: "#CFD35E", border: "1px solid #CFD35E", color: "#FFFFFF", whiteSpace: "nowrap", padding: "4px 10px", fontSize: "12px" }}
                                              >
                                                Ubah
                                              </Link>
                                            </div>
                                          )}
                                        </td>
                                      )}
                                      <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                                        {value.jenis_pelayanan_rl_tiga_titik_tiga.nama}
                                      </td>
                                      <td>{value.total_pasien_rujukan}</td>
                                      <td>{value.total_pasien_non_rujukan}</td>
                                      <td>{value.tlp_dirawat}</td>
                                      <td>{value.tlp_dirujuk}</td>
                                      <td>{value.tlp_pulang}</td>
                                      <td>{value.m_igd_laki}</td>
                                      <td>{value.m_igd_perempuan}</td>
                                      <td>{value.doa_laki}</td>
                                      <td>{value.doa_perempuan}</td>
                                      <td>{value.luka_laki}</td>
                                      <td>{value.luka_perempuan}</td>
                                      <td>{value.false_emergency}</td>
                                    </tr>
                                  ))}
                                <tr className="row-total">
                                  <td colSpan={user.jenisUserId === 4 ? 3 : 2} style={{ textAlign: "center" }} className={style["sticky-column"]}>
                                    <strong>Total</strong>
                                  </td>
                                  <td className="text-center">{total.total_pasien_rujukan}</td>
                                  <td className="text-center">{total.total_pasien_non_rujukan}</td>
                                  <td className="text-center">{total.tlp_dirawat}</td>
                                  <td className="text-center">{total.tlp_dirujuk}</td>
                                  <td className="text-center">{total.tlp_pulang}</td>
                                  <td className="text-center">{total.m_igd_laki}</td>
                                  <td className="text-center">{total.m_igd_perempuan}</td>
                                  <td className="text-center">{total.doa_laki}</td>
                                  <td className="text-center">{total.doa_perempuan}</td>
                                  <td className="text-center">{total.luka_laki}</td>
                                  <td className="text-center">{total.luka_perempuan}</td>
                                  <td className="text-center">{total.false_emergency}</td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* TAB VALIDASI PERSIS ALUR RL41 */}
                  <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
                    <div className={style.validasiCard}>
                      <h3 className={style.validasiCardTitle}>Validasi RL 3.3</h3>
                      {!isFilterApplied ? (
                        <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                          <strong>Silakan pilih filter terlebih dahulu untuk menampilkan data.</strong>
                        </div>
                      ) : dataRL.length === 0 ? (
                        <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                          <strong>Tidak ada data untuk proses validasi</strong>
                        </div>
                      ) : idValidasi ? (
                        <div style={{ backgroundColor: "#E9ECEF", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
                          <p style={{ margin: "0" }}>
                            <strong style={{ width: "100px", display: "inline-block" }}>Status</strong>
                            : {idValidasiSubmited == 1 ? "Perlu Perbaikan" : idValidasiSubmited == 2 ? "Selesai Diperbaiki" : "Disetujui"}
                          </p>
                          <p style={{ margin: "0" }}>
                            <strong style={{ width: "100px", display: "inline-block" }}>Catatan</strong>
                            : {KeteranganValidasiDb || "-"}
                          </p>
                          <p style={{ margin: "0" }}>
                            <strong style={{ width: "100px", display: "inline-block" }}>Tanggal</strong>
                            : {tglValidasi ? new Date(tglValidasi).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                          </p>
                        </div>
                      ) : (
                        dataRL.length > 0 && user.jenisUserId !== 3 && (
                          <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                            <strong>Data Belum di Validasi</strong>
                          </div>
                        )
                      )}

                      {dataRL.length > 0 && rumahSakit?.id ? (
                        isValidated ? (
                          <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "4px", textAlign: "center" }}>
                            <strong>Data telah di validasi</strong>
                          </div>
                        ) : (
                          (user.jenisUserId === 3 || (user.jenisUserId === 4 && idValidasi)) && (
                            <form onSubmit={simpanValidasi}>
                              <div className={style.validasiFormGroup}>
                                <label htmlFor="statusValidasi">Status</label>
                                <select
                                  id="statusValidasi"
                                  name="statusValidasi"
                                  value={statusValidasi}
                                  required
                                  onChange={statusValidasiChangeHadler}
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
                                  <label htmlFor="keteranganValidasi">Catatan</label>
                                  <textarea
                                    id="keteranganValidasi"
                                    name="keteranganValidasi"
                                    value={keteranganValidasi}
                                    onChange={keteranganValidasiChangeHadler}
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
          ) : (

            /* TAB SATUSEHAT — Layout & Styling mengikuti RL41 TabTwo */
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
                        margin: 0,
                        paddingLeft: 2,
                      }}
                    >
                      Bulan
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #cbd5e1",
                        borderRadius: 7,
                        padding: "7px 10px",
                        background: "#f8fafc",
                        gap: 8,
                      }}
                    >
                      <FaCalendarAlt size={13} color="#94a3b8" />
                      <select
                        value={bulan}
                        onChange={bulanChangeHandler}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: 13,
                          color: "#0f172a",
                          fontWeight: 500,
                          padding: 0,
                          cursor: "pointer",
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

                  {/* Tahun */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 150 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        margin: 0,
                        paddingLeft: 2,
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
                        gap: 8,
                      }}
                    >
                      <FaCalendarAlt size={13} color="#94a3b8" />
                      <input
                        type="number"
                        value={tahun}
                        onChange={tahunChangeHandler}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: 13,
                          color: "#0f172a",
                          fontWeight: 500,
                          padding: 0,
                          width: "100%",
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
                      marginTop: "auto",
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
                      onClick={handleDownloadExcelSatusehat}
                      disabled={isDownloading}
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
                        cursor: isDownloading ? "not-allowed" : "pointer",
                        opacity: isDownloading ? 0.55 : 1,
                        transition: "opacity 0.15s",
                      }}
                      onMouseOver={(e) => !isDownloading && (e.currentTarget.style.opacity = "0.9")}
                      onMouseOut={(e) => !isDownloading && (e.currentTarget.style.opacity = "1")}
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
                        color: "#2563eb",
                        letterSpacing: "0.5px",
                      }}
                    >
                      KETERANGAN TOMBOL
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* FILTER */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          background: "#1d4ed8",
                          color: "#fff",
                          borderRadius: 5,
                          marginTop: 1,
                          flexShrink: 0,
                        }}
                      >
                        <FaFilter size={12} />
                      </span>
                      <span style={{ fontSize: 12, color: "#334155", lineHeight: "20px" }}>
                        <strong>FILTER</strong> : Menampilkan data dari database SIRS Online
                      </span>
                    </div>

                    {/* SYNC */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          background: "#059669",
                          color: "#fff",
                          borderRadius: 5,
                          marginTop: 1,
                          flexShrink: 0,
                        }}
                      >
                        <FaSyncAlt size={12} />
                      </span>
                      <span style={{ fontSize: 12, color: "#334155", lineHeight: "20px" }}>
                        <strong>SYNC SATUSEHAT</strong> : Mengambil data terbaru dari SATUSEHAT
                      </span>
                    </div>

                    {/* DOWNLOAD */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          background: "#059669",
                          color: "#fff",
                          borderRadius: 5,
                          marginTop: 1,
                          flexShrink: 0,
                        }}
                      >
                        <SiMicrosoftexcel size={13} />
                      </span>
                      <span style={{ fontSize: 12, color: "#334155", lineHeight: "20px" }}>
                        <strong>DOWNLOAD EXCEL</strong> : Mengunduh data hasil filter
                      </span>
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
                    <FaSyncAlt size={14} color="#059669" />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#059669",
                        letterSpacing: "0.5px",
                      }}
                    >
                      STATUS SINKRONISASI
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              {hasFilteredSatusehat && (
                <div className={style["table-container"]}>
                  <div className="table-responsive">
                    <table className={style.table}>
                      <thead className={style.thead}>
                        <tr>
                          <th className={style["sticky-header"]}>No.</th>
                          <th className={style["sticky-header"]}>Kategori</th>
                          <th className={style["sticky-header"]}>Jenis Pelayanan</th>
                          <th>Total Pasien Rujukan</th>
                          <th>Total Pasien Non Rujukan</th>
                          <th>Tindak Lanjut Dirawat</th>
                          <th>Tindak Lanjut Dirujuk</th>
                          <th>Tindak Lanjut Pulang</th>
                          <th>Mati di IGD (L)</th>
                          <th>Mati di IGD (P)</th>
                          <th>DOA (L)</th>
                          <th>DOA (P)</th>
                          <th>Luka-luka (L)</th>
                          <th>Luka-luka (P)</th>
                          <th>False Emergency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRLSatusehat.length > 0 ? (
                          dataRLSatusehat.map((value, index) => (
                            <tr
                              key={`${value.kategori || ""}-${value.jenis_pelayanan || ""}-${index}`}
                            >
                              <td className={style["sticky-column"]}>{index + 1}</td>
                              <td
                                className={style["sticky-column"]}
                                style={{ textAlign: "left" }}
                              >
                                {value.kategori}
                              </td>
                              <td style={{ textAlign: "left" }}>{value.jenis_pelayanan}</td>
                              <td>{value.total_pasien_rujukan || 0}</td>
                              <td>{value.total_pasien_non_rujukan || 0}</td>
                              <td>{value.tindak_lanjut_dirawat || 0}</td>
                              <td>{value.tindak_lanjut_dirujuk || 0}</td>
                              <td>{value.tindak_lanjut_pulang || 0}</td>
                              <td>{value.mati_di_igd_laki_laki || 0}</td>
                              <td>{value.mati_di_igd_perempuan || 0}</td>
                              <td>{value.doa_laki_laki || 0}</td>
                              <td>{value.doa_perempuan || 0}</td>
                              <td>{value.luka_luka_laki_laki || 0}</td>
                              <td>{value.luka_luka_perempuan || 0}</td>
                              <td>{value.false_emergency || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={15}
                              style={{ textAlign: "center", color: "#666" }}
                            >
                              Tidak ada data untuk ditampilkan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL33;