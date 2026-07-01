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
} from "react-icons/fa";
import { HiFilter, HiPlus, HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from 'react-bootstrap/Table'
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL33 = () => {
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
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
    const date = new Date();
    setTahun(date.getFullYear());
    setBulan(date.getMonth() + 1);
    // getDataRLTigaTitikTiga();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load validasi data secara realtime saat rumahSakit atau activeTab berubah
  useEffect(() => {
    if (activeTab === "tab2" && rumahSakit && rumahSakit.id) {
      getValidasi();
    }
  }, [rumahSakit, activeTab]);

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

const getDataRLTigaTitikTiga = async (e) => {
  e.preventDefault();

  // ⭐ FIX VALIDASI RS (object kosong sering lolos)
  if (!rumahSakit || !rumahSakit.id || rumahSakit.id === 0) {
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
        .concat(tahun)
    )
  );
  setFilterLabel(filter);

  try {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        rsId: rumahSakit.id, // ⭐ FIX PENTING (tadi kamu tidak kirim rsId)
        tahun: tahun,
        bulan: bulan,
      },
    };

    const results = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktiga",
      customConfig
    );

    // ⭐ GUARD kalau backend return kosong
    if (!results.data.data || results.data.data.length === 0) {
      setDataRL([]);
      toast("Data RL tidak ditemukan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      handleClose();
      return;
    }

    // ⭐ FLATTEN LEBIH AMAN
    let dataRLTigaTitikTigaDetails = [];
    results.data.data.forEach((value) => {
      if (value.rl_tiga_titik_tiga_details) {
        value.rl_tiga_titik_tiga_details.forEach((v) => {
          dataRLTigaTitikTigaDetails.push(v);
        });
      }
    });

    setDataRL(dataRLTigaTitikTigaDetails);

    // reset validasi state
    setValidasiId(null);
    setStatusValidasi(0);
    setKeteranganValidasi("");
    setDataValidasi(null);

    handleClose();

    // ================= LOAD VALIDASI =================
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
        "/apisirs6v2/rltigatitiktigavalidasi",
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
    toast("Gagal mengambil data RL", {
      position: toast.POSITION.TOP_RIGHT,
    });
  }
};

  const getDataRLTigaTitikTigaSatusehat = async (e) => {
    if (e) e.preventDefault();

    if (!rumahSakit || !rumahSakit.id || rumahSakit.id === 0) {
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
    filter.push("Nama: ".concat(rumahSakit.nama));
    filter.push(
      "Periode ".concat(
        String(months[bulan - 1].label).concat(" ").concat(tahun)
      )
    );
    setFilterLabelSatusehat(filter);

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
            rsId: rumahSakit.id,
            month_year: periode,
          },
        }
      );

      const arr = results?.data?.data || [];
      setDataRLSatusehat(Array.isArray(arr) ? arr : []);
    } catch (error) {
      setDataRLSatusehat([]);
      const detailMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan";
      toast.error(detailMessage);
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
    if (!rumahSakit || !rumahSakit.id || rumahSakit.id === 0) {
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

      await axiosJWT.get("/apisirs6v2/rltigatitiktigasatusehat", {
        headers,
        params: {
          rsId: rumahSakit.id,
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

  // const hapusData = async (id) => {
  //   const customConfig = {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //   };
  //   try {
  //     let parent;
  //     const currentData = await getRLTigaTitikTigaById(id);

  //     if (currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("1.")) {
  //       parent = await getParent(1, id);
  //     } else if (
  //       currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("2.")
  //     ) {
  //       parent = await getParent(2, id);
  //     }

  //     if (parent) {
  //       await axiosJWT.patch(
  //         "/apisirs6v2/rltigatitiktigadetail/" + parent.id,
  //         parent.data,
  //         customConfig
  //       );
  //     }
  //     const results = await axiosJWT.delete(
  //       `/apisirs6v2/rltigatitiktiga/${id}`,
  //       customConfig
  //     );
  //     // getDataRLTigaTitikTiga();
  //     toast("Data Berhasil Dihapus", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });

  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 3000);
  //     // setDataRL((current) => current.filter((value) => value.id !== id));
  //   } catch (error) {
  //     console.log(error);
  //     toast("Data Gagal Disimpan", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });
  //   }
  // };

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

      // Menghapus data dari state tanpa reload
      setDataRL((current) => current.filter((value) => value.id !== id));

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
        bulan: bulan,
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
        return (
          no === `${filter}.` ||
          no === String(filter)
        );
      })
      .map((value) => {
        return {
          id: value.id,
          data: {
            total_pasien_rujukan:
              value.total_pasien_rujukan -
              response.data.data.total_pasien_rujukan,
            total_pasien_non_rujukan:
              value.total_pasien_non_rujukan -
              response.data.data.total_pasien_non_rujukan,
            tlp_dirawat: value.tlp_dirawat - response.data.data.tlp_dirawat,
            tlp_dirujuk: value.tlp_dirujuk - response.data.data.tlp_dirujuk,
            tlp_pulang: value.tlp_pulang - response.data.data.tlp_pulang,
            m_igd_laki: value.m_igd_laki - response.data.data.m_igd_laki,
            m_igd_perempuan:
              value.m_igd_perempuan - response.data.data.m_igd_perempuan,
            doa_laki: value.doa_laki - response.data.data.doa_laki,
            doa_perempuan:
              value.doa_perempuan - response.data.data.doa_perempuan,
            luka_laki: value.luka_laki - response.data.data.luka_laki,
            luka_perempuan:
              value.luka_perempuan - response.data.data.luka_perempuan,
            false_emergency:
              value.false_emergency - response.data.data.false_emergency,
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
        "/apisirs6v2/rltigatitiktigavalidasi",
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

    // ✅ payload dibedakan berdasarkan jenis user
    let payload = {
      statusValidasiId: parseInt(statusValidasi),
    };

    // ✅ HANYA VALIDATOR kirim catatan
    if (user.jenisUserId !== 4) {
      payload.catatan = keteranganValidasi;
    }

    if (validasiId) {
      // UPDATE
      const response = await axiosJWT.patch(
        `/apisirs6v2/rltigatitiktigavalidasi/${validasiId}`,
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

      // CREATE
      let createPayload = {
        rsId: rumahSakit.id,
        periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
        jenisPeriode: 1,
        statusValidasiId: parseInt(statusValidasi),
      };

      // ✅ hanya validator kirim catatan
      if (user.jenisUserId !== 4) {
        createPayload.catatan = keteranganValidasi;
      }

      const response = await axiosJWT.post(
        "/apisirs6v2/rltigatitiktigavalidasi",
        createPayload,
        customConfig
      );

      setValidasiId(response.data.data.id);

      toast("Data Validasi Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });

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
    if (tab === "tab2") {
      if (!rumahSakit || !rumahSakit.id) {
        toast("RS belum dipilih", {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(value));
    } catch (error) {
      return "-";
    }
  };

  const handleSatusehatFilterClick = () => {
    if (user.jenisUserId !== 4 && (!rumahSakit || !rumahSakit.id)) {
      handleShow();
      return;
    }

    getDataRLTigaTitikTigaSatusehat();
  };

  const handleSatusehatSyncClick = () => {
    if (user.jenisUserId !== 4 && (!rumahSakit || !rumahSakit.id)) {
      handleShow();
      return;
    }

    syncDataRLTigaTitikTigaSatusehat();
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
    .map((value, index) => {
      total.total_pasien_rujukan += parseInt(value.total_pasien_rujukan);
      total.total_pasien_non_rujukan += parseInt(
        value.total_pasien_non_rujukan
      );
      total.tlp_dirawat += parseInt(value.tlp_dirawat);
      total.tlp_dirujuk += parseInt(value.tlp_dirujuk);
      total.tlp_pulang += parseInt(value.tlp_pulang);
      total.m_igd_laki += parseInt(value.m_igd_laki);
      total.m_igd_perempuan += parseInt(value.m_igd_perempuan);
      total.doa_laki += parseInt(value.doa_laki);
      total.doa_perempuan += parseInt(value.doa_perempuan);
      total.luka_laki += parseInt(value.luka_laki);
      total.luka_perempuan += parseInt(value.luka_perempuan);
      total.false_emergency += parseInt(value.false_emergency);
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

  // DATA DETAIL
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

  // TAMBAHKAN ROW TOTAL
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
    fileName: "RL_3_3",
    sheet: "RL 3.3",
    tablePayload: {
      header,
      body,
    },
  });

}

function handleDownloadExcelSatusehat() {

  const header = [
    "No",
    "Month Year",
    "IHS Organization",
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
      value.month_year,
      value.ihs_organization,
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
    tablePayload: {
      header,
      body,
    },
  });

}

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
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
                    onChange={(e) => getKabKota(e.target.value)}
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
                      id="rumahSakit"
                      className="form-select"
                      value={rumahSakit?.id || 0}
                      onChange={(e) => showRumahSakit(e.target.value)}
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
                      id="rumahSakit"
                      className="form-select"
                      value={rumahSakit?.id || 0}
                      onChange={(e) => showRumahSakit(e.target.value)}
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
                      onChange={(e) => showRumahSakit(e.target.value)}
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
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}>RL. 3.3 - Rawat Darurat</h4>
          <ul className="nav nav-tabs border-bottom mb-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${style.outerTabLink} ${activeWadahTab === "sirs" ? "active" : ""}`}
                onClick={() => handleWadahTabClick("sirs")}
              >
                SIRS
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${style.outerTabLink} ${activeWadahTab === "satusehat" ? "active" : ""}`}
                onClick={() => handleWadahTabClick("satusehat")}
              >
                SATUSEHAT
              </button>
            </li>
          </ul>

          <div className="tab-content mt-0">
          {activeWadahTab === "sirs" ? (
            <div className="border rounded-bottom p-4 shadow-sm bg-white">
              <div className={style.toolbar}>
                {user.jenisUserId === 4 ? (
                  <Link
                    to={`/rl33/tambah/`}
                    type="button"
                    className={style.btnPrimary}
                    style={{ textDecoration: "none" }}
                  >
                    <HiPlus size={18} /> Tambah
                  </Link>
                ) : (
                  <></>
                )}
                <button
                  type="button"
                  className={style.btnPrimary}
                  onClick={handleShow}
                >
                  <HiFilter size={18} /> Filter
                </button>
                <button
                  type="button"
                  className={style.btnPrimary}
                  onClick={handleDownloadExcel}
                >
                  <FaFileExcel size={18} /> Download Excel
                </button>
              </div>

              {filterLabel.length > 0 ? (
                <div>
                  <h5 style={{ fontSize: "14px" }}>
                    filtered by{" "}
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
                  <table className={style.table}>
                <thead className={style.thead}>
                <tr>
                  <th
                    style={{ width: "2%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    No.
                  </th>
                  {user.jenisUserId === 4
                   ? <th
                    style={{ width: "7%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Aksi
                  </th>
                  : <>
                                      
                                    </>
                                }
                  <th
                    style={{ width: "13%", textAlign: "center" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Jenis Pelayanan
                  </th>
                  <th colSpan={2}>Total Pasien</th>
                  <th colSpan={3}>Tindak Lanjut Pelayanan</th>
                  <th colSpan={2}>Mati di IGD</th>
                  <th colSpan={2}>DOA</th>
                  <th colSpan={2}>Luka-luka</th>
                  <th style={{ verticalAlign: "middle" }} rowSpan={2}>
                    False Emergency
                  </th>
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
                {dataRL.length > 0 ? (
                  <>
                    {dataRL
                      .filter(
                        (value) =>
                          value.total_pasien_rujukan > 0 ||
                          value.total_pasien_non_rujukan > 0
                      )
                      .map((value, index) => {
                        return (
                          <tr key={value.id}>
                            <td className={style["sticky-column"]}>
                              {
                                  value.jenis_pelayanan_rl_tiga_titik_tiga.no
                                }
                            </td>
                            {user.jenisUserId === 4
                            ? <td
                              className={style["sticky-column"]}
                              style={{
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              {value.jenis_pelayanan_rl_tiga_titik_tiga.no !=
                                1 &&
                              value.jenis_pelayanan_rl_tiga_titik_tiga.no !=
                                2 ? (
                                <div style={{ display: "flex" }}>
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
                                  <Link
                                    to={`/rl33/ubah/${value.id}`}
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
                              ) : (
                                ""
                              )}
                            </td>
                            : <>
                                      
                                    </>
                                }
                            <td className={style["sticky-column"]}
                            style={{ textAlign: "Left" }}
                            >
                              {
                                  value.jenis_pelayanan_rl_tiga_titik_tiga.nama
                                }
                            </td>
                            <td>
                              {value.total_pasien_rujukan}
                            </td>
                            <td>
                              {value.total_pasien_non_rujukan}
                            </td>
                            <td>
                              {value.tlp_dirawat}
                            </td>
                            <td>
                              {value.tlp_dirujuk}
                            </td>
                            <td>
                              {value.tlp_pulang}
                            </td>
                            <td>
                              {value.m_igd_laki}
                            </td>
                            <td>
                              {value.m_igd_perempuan}
                            </td>
                            <td>
                              {value.doa_laki}
                            </td>
                            <td>
                              {value.doa_perempuan}
                            </td>
                            <td>
                              {value.luka_laki}
                            </td>
                            <td>
                              {value.luka_perempuan}
                            </td>
                            <td>
                              {value.false_emergency}
                            </td>
                          </tr>
                        );
                      })}
                    <tr className="row-total">
                      <td colSpan={user.jenisUserId === 4 ? 3 : 2} style={{ textAlign: "center" }} className={style["sticky-column"]}>
                        <strong>Total</strong>
                      </td>
                      <td className="text-center">
                        {total.total_pasien_rujukan}
                      </td>
                      <td className="text-center">
                        {total.total_pasien_non_rujukan}
                      </td>
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
                    <h3 className={style.validasiCardTitle}>Validasi RL 3.3</h3>

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
                        <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
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
          ) : (
            <div className="border rounded-bottom p-4 shadow-sm bg-white">
              <div className={style.satusehatControlPanel}>
                <h5 className={style.satusehatPanelTitle}>Periode Data</h5>
                <div className={style.satusehatControlRow}>
                  <div className={style.satusehatField}>
                    <label className={style.satusehatLabel}>Bulan</label>
                    <div className={style.satusehatInputWrap}>
                      <FaCalendarAlt className={style.satusehatInputIcon} />
                      <select
                        className={style.satusehatSelect}
                        value={bulan}
                        onChange={(e) => setBulan(e.target.value)}
                      >
                        {months.map((value) => (
                          <option key={value.value} value={value.value}>
                            {value.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={style.satusehatFieldSmall}>
                    <label className={style.satusehatLabel}>Tahun</label>
                    <div className={style.satusehatInputWrap}>
                      <FaCalendarAlt className={style.satusehatInputIcon} />
                      <input
                        type="number"
                        className={style.satusehatInput}
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={style.satusehatActionGroup}>
                    <div className={style.satusehatActionItem}>
                      <button
                        type="button"
                        className={`${style.satusehatActionButton} ${style.satusehatFilterButton}`}
                        onClick={handleSatusehatFilterClick}
                      >
                        <HiFilter size={18} /> FILTER
                      </button>
                    </div>

                    <div className={style.satusehatActionItem}>
                      <button
                        type="button"
                        className={`${style.satusehatActionButton} ${style.satusehatSyncButton}`}
                        onClick={handleSatusehatSyncClick}
                        disabled={isSyncingSatusehat || isSyncCooldown}
                      >
                        <FaSyncAlt size={16} />{" "}
                        {isSyncingSatusehat
                          ? "SYNCING..."
                          : isSyncCooldown
                          ? "SYNC DITAHAN"
                          : "SYNC SATUSEHAT"}
                      </button>
                    </div>

                    <div className={style.satusehatActionItem}>
                      <button
                        type="button"
                        className={`${style.satusehatActionButton} ${style.satusehatExcelButton}`}
                        onClick={handleDownloadExcelSatusehat}
                      >
                        <FaFileExcel size={16} /> DOWNLOAD EXCEL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={style.satusehatInfoGrid}>
                <div className={style.satusehatInfoCard}>
                  <h6 className={style.satusehatInfoTitle}>
                    <FaInfoCircle /> KETERANGAN TOMBOL
                  </h6>
                  <div className={style.satusehatLegendItem}>
                    <span className={`${style.satusehatLegendBadge} ${style.satusehatFilterButton}`}>
                      <HiFilter size={14} />
                    </span>
                    <span>
                      <strong>FILTER</strong> : Menampilkan data dari database SIRS Online
                    </span>
                  </div>
                  <div className={style.satusehatLegendItem}>
                    <span className={`${style.satusehatLegendBadge} ${style.satusehatSyncButton}`}>
                      <FaSyncAlt size={12} />
                    </span>
                    <span>
                      <strong>SYNC SATUSEHAT</strong> : Mengambil data terbaru dari SATUSEHAT
                    </span>
                  </div>
                  <div className={style.satusehatLegendItem}>
                    <span className={`${style.satusehatLegendBadge} ${style.satusehatExcelButton}`}>
                      <FaFileExcel size={12} />
                    </span>
                    <span>
                      <strong>DOWNLOAD EXCEL</strong> : Mengunduh data hasil filter
                    </span>
                  </div>
                </div>

                <div className={style.satusehatInfoCard}>
                  <h6 className={style.satusehatInfoTitle}>
                    <FaSyncAlt /> STATUS SINKRONISASI
                  </h6>
                  <div className={style.satusehatStatusItem}>
                    <FaCalendarAlt className={style.satusehatStatusIcon} />
                    <span>
                      Terakhir Sync : <strong>{formatLastSyncAt(lastSyncAt)}</strong>
                    </span>
                  </div>
                  <div className={style.satusehatStatusItem}>
                    <FaClock className={style.satusehatStatusIcon} />
                    <span>
                      Interval Sync : <strong>{syncCooldownMinutes} Menit</strong>
                    </span>
                  </div>
                </div>

                <div className={style.satusehatInfoCard}>
                  <h6 className={style.satusehatInfoTitle}>
                    <FaDatabase /> SUMBER DATA
                  </h6>
                  <div className={style.satusehatSourceRow}>
                    <p className={style.satusehatSourceText}>
                      {dataRLSatusehat.length > 0
                        ? "Data yang ditampilkan berasal dari database SIRS Online."
                        : "Belum ada data yang ditampilkan. Gunakan filter atau sync terlebih dahulu."}
                    </p>
                    <FaDatabase className={style.satusehatSourceIcon} />
                  </div>
                </div>
              </div>

              {filterLabelSatusehat.length > 0 ? (
                <div className={style.filterLabel}>
                  filtered by{" "}
                  {filterLabelSatusehat
                    .map((value) => {
                      return value;
                    })
                    .join(", ")}
                </div>
              ) : (
                <></>
              )}

              <div className={style["table-container"]}>
                <div className="table-responsive">
                  <table className={style.table}>
                    <thead className={style.thead}>
                      <tr>
                        <th className={style["sticky-header"]}>No.</th>
                        <th className={style["sticky-header"]}>Kategori</th>
                        <th className={style["sticky-header"]}>
                          Jenis Pelayanan
                        </th>
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
                      {(Array.isArray(dataRLSatusehat)
                        ? dataRLSatusehat
                        : []
                      ).length > 0 ? (
                        (Array.isArray(dataRLSatusehat)
                          ? dataRLSatusehat
                          : []
                        ).map((value, index) => (
                          <tr
                            key={`${value.kategori || ""}-${value.jenis_pelayanan || ""}-${index}`}
                          >
                            <td className={style["sticky-column"]}>
                              {index + 1}
                            </td>
                            <td
                              className={style["sticky-column"]}
                              style={{ textAlign: "left" }}
                            >
                              {value.kategori}
                            </td>
                            <td style={{ textAlign: "left" }}>
                              {value.jenis_pelayanan}
                            </td>
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
                          <td colSpan={15} style={{ textAlign: "center" }}>
                            Tidak ada data.
                          </td>
                        </tr>
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
      <ToastContainer />
    </div>
  );
};

export default RL33;
