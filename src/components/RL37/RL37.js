import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL37.module.css";
import { HiSaveAs } from "react-icons/hi";
import {
  FaCalendarAlt,
  FaSyncAlt,
  FaFileExcel,
  FaInfoCircle,
  FaDatabase,
  FaCheckCircle,
  FaClock,
  FaFilter,
} from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
import { downloadExcel, DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL37 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("2026");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
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
  const [spinner, setSpinner] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const [namafileSatusehat, setNamaFileSatusehat] = useState("");
  const tableRef = useRef(null);
  const tableSatusehatRef = useRef(null);
  const syncCooldownTimeoutRef = useRef(null);
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [activeWadahTab, setActiveWadahTab] = useState("sirs");
  const [filterLabelSatusehat, setFilterLabelSatusehat] = useState([]);
  const [submittedBulan, setSubmittedBulan] = useState(null);
  const [submittedTahun, setSubmittedTahun] = useState(null);
  const [submittedRumahSakit, setSubmittedRumahSakit] = useState(null);
  const [dataCount, setDataCount] = useState([]);
  const [isSyncingSatusehat, setIsSyncingSatusehat] = useState(false);
  const [isSyncCooldown, setIsSyncCooldown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hasFilteredSatusehat, setHasFilteredSatusehat] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const [submittedBulanSatusehat, setSubmittedBulanSatusehat] = useState(null);
  const [submittedTahunSatusehat, setSubmittedTahunSatusehat] = useState(null);
  const [submittedRumahSakitSatusehat, setSubmittedRumahSakitSatusehat] = useState(null);
  const { CSRFToken } = useCSRFTokenContext;
  const showAksi = user?.jenisUserId === 4;
  const syncCooldownMinutes = 5;
  const syncCooldownMs = syncCooldownMinutes * 60 * 1000;

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

  useEffect(() => {
    if (activeTab === "tab2" && submittedRumahSakit && submittedRumahSakit.id && submittedBulan !== 0 && submittedTahun) {
      getValidasi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedBulan, submittedTahun, submittedRumahSakit, activeTab]);

  useEffect(() => {
    return () => {
      if (syncCooldownTimeoutRef.current) {
        clearTimeout(syncCooldownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSyncCooldown || !lastSyncAt) return;
    if (now - new Date(lastSyncAt).getTime() >= syncCooldownMs) {
      setIsSyncCooldown(false);
    }
  }, [now, isSyncCooldown, lastSyncAt, syncCooldownMs]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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

  const getSelectedRsId = () => {
    const rsFromState = rumahSakit && rumahSakit.id ? rumahSakit.id : null;
    if (rsFromState && String(rsFromState) !== "0") return Number(rsFromState);
    if (user && user.jenisUserId === 4 && user.satKerId) return Number(user.satKerId);
    return null;
  };

  const minutesSinceSync = lastSyncAt
    ? (now - new Date(lastSyncAt).getTime()) / 60000
    : Infinity;
  const canSync =
    !isSyncingSatusehat &&
    !isDownloading &&
    (minutesSinceSync === Infinity || minutesSinceSync >= syncCooldownMinutes || !isSyncCooldown);
  const cooldownLeft =
    lastSyncAt
      ? Math.max(0, syncCooldownMinutes - minutesSinceSync).toFixed(1)
      : "0";

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
      }).format(new Date(value)).replace(/\./g, ":") + " WIB";
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

  const getRL = async (e) => {
    if (e) e.preventDefault();
    let date = tahun + "-" + bulan + "-01";
    setSpinner(true);

    const rsId = getSelectedRsId();
    if (!rsId) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
      return;
    }

    if (!rumahSakit || !rumahSakit.id || String(rumahSakit.id) === "0") {
      try {
        const detailRs = await axiosJWT.get("/apisirs6v2/rumahsakit/" + rsId, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRumahSakit(detailRs.data.data || { id: rsId, nama: "Rumah Sakit" });
      } catch (err) {
        setRumahSakit({ id: rsId, nama: "Rumah Sakit" });
      }
    }

    const rsLabel = rumahSakit?.nama || "Rumah Sakit";
    const filter = [];
    filter.push("nama: ".concat(rsLabel));
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
          rsId: rsId,
          tahun: date,
        },
      };
      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktujuh",
        customConfig
      );

      if (!detailkegiatan.data.data || detailkegiatan.data.data.length === 0) {
        setDataRL([]);
        setDataCount([]);
        toast.info("Data RL tidak ditemukan untuk filter ini", {
          position: toast.POSITION.TOP_RIGHT,
        });
        handleClose();
        setSpinner(false);
        return;
      }

      const rlTemplate = detailkegiatan.data.data.map((value, index) => {
        return {
          id: value.id,
          groupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.id,
          groupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.nama,
          subGroupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.id,
          subGroupNo:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.no,
          subGroupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          jenisKegiatanId: value.jenis_kegiatan_rl_tiga_titik_tujuh.id,
          jenisKegiatanNo: value.jenis_kegiatan_rl_tiga_titik_tujuh.no,
          jenisKegiatanNama: value.jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          rmRumahSakit: value.rmRumahSakit,
          rmBidan: value.rmBidan,
          rmPuskesmas: value.rmPuskesmas,
          rmFaskesLainnya: value.rmFaskesLainnya,
          rmHidup: value.rmHidup,
          rmMati: value.rmMati,
          rmTotal: value.rmTotal,
          rnmHidup: value.rnmHidup,
          rnmMati: value.rnmMati,
          rnmTotal: value.rnmTotal,
          nrHidup: value.nrHidup,
          nrMati: value.nrMati,
          nrTotal: value.nrTotal,
          dirujuk: value.dirujuk,
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
            subGroupRmRumahSakit: 0,
            subGroupRmBidan: 0,
            subGroupRmPuskesmas: 0,
            subGroupRmFaskesLainnya: 0,
            subGroupRmHidup: 0,
            subGroupRmMati: 0,
            subGroupRmTotal: 0,
            subGroupRnmHidup: 0,
            subGroupRnmMati: 0,
            subGroupRnmTotal: 0,
            subGroupNrHidup: 0,
            subGroupNrMati: 0,
            subGroupNrTotal: 0,
            subGroupDirujuk: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupRmRumahSakit += value.rmRumahSakit;
        res[value.subGroupId].subGroupRmBidan += value.rmBidan;
        res[value.subGroupId].subGroupRmPuskesmas += value.rmPuskesmas;
        res[value.subGroupId].subGroupRmFaskesLainnya += value.rmFaskesLainnya;
        res[value.subGroupId].subGroupRmHidup += value.rmHidup;
        res[value.subGroupId].subGroupRmMati += value.rmMati;
        res[value.subGroupId].subGroupRmTotal += value.rmTotal;
        res[value.subGroupId].subGroupRnmHidup += value.rnmHidup;
        res[value.subGroupId].subGroupRnmMati += value.rnmMati;
        res[value.subGroupId].subGroupRnmTotal += value.rnmTotal;
        res[value.subGroupId].subGroupNrHidup += value.nrHidup;
        res[value.subGroupId].subGroupNrMati += value.nrMati;
        res[value.subGroupId].subGroupNrTotal += value.nrTotal;
        res[value.subGroupId].subGroupDirujuk += value.dirujuk;

        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupRmRumahSakit: 0,
            groupRmBidan: 0,
            groupRmPuskesmas: 0,
            groupRmFaskesLainnya: 0,
            groupRmHidup: 0,
            groupRmMati: 0,
            groupRmTotal: 0,
            groupRnmHidup: 0,
            groupRnmMati: 0,
            groupRnmTotal: 0,
            groupNrHidup: 0,
            groupNrMati: 0,
            groupNrTotal: 0,
            groupDirujuk: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupRmRumahSakit += value.subGroupRmRumahSakit;
        res[value.groupId].groupRmBidan += value.subGroupRmBidan;
        res[value.groupId].groupRmPuskesmas += value.subGroupRmPuskesmas;
        res[value.groupId].groupRmFaskesLainnya +=
          value.subGroupRmFaskesLainnya;
        res[value.groupId].groupRmHidup += value.subGroupRmHidup;
        res[value.groupId].groupRmMati += value.subGroupRmMati;
        res[value.groupId].groupRmTotal += value.subGroupRmTotal;
        res[value.groupId].groupRnmHidup += value.subGroupRnmHidup;
        res[value.groupId].groupRnmMati += value.subGroupRnmMati;
        res[value.groupId].groupRnmTotal += value.subGroupRnmTotal;
        res[value.groupId].groupNrHidup += value.subGroupNrHidup;
        res[value.groupId].groupNrMati += value.subGroupNrMati;
        res[value.groupId].groupNrTotal += value.subGroupNrTotal;
        res[value.groupId].groupDirujuk += value.subGroupDirujuk;
        return res;
      }, {});

      let satu = [];
      let dua = [];

      subGroups.forEach((element2) => {
        const filterData2 = rlTemplate.filter((value2, index2) => {
          return value2.subGroupId === element2.subGroupId;
        });
        dua.push({
          groupId: element2.groupId,
          subGroupId: element2.subGroupId,
          subGroupNo: element2.subGroupNo,
          subGroupNama: element2.subGroupNama,
          subGroupRmRumahSakit: element2.subGroupRmRumahSakit,
          subGroupRmBidan: element2.subGroupRmBidan,
          subGroupRmPuskesmas: element2.subGroupRmPuskesmas,
          subGroupRmFaskesLainnya: element2.subGroupRmFaskesLainnya,
          subGroupRmHidup: element2.subGroupRmHidup,
          subGroupRmMati: element2.subGroupRmMati,
          subGroupRmTotal: element2.subGroupRmTotal,
          subGroupRnmHidup: element2.subGroupRnmHidup,
          subGroupRnmMati: element2.subGroupRnmMati,
          subGroupRnmTotal: element2.subGroupRnmTotal,
          subGroupNrHidup: element2.subGroupNrHidup,
          subGroupNrMati: element2.subGroupNrMati,
          subGroupNrTotal: element2.subGroupNrTotal,
          subGroupDirujuk: element2.subGroupDirujuk,
          kegiatan: filterData2,
        });
      });

      groups.forEach((element) => {
        const filterData = dua.filter((value, index) => {
          return value.groupId === element.groupId;
        });
        satu.push({
          groupId: element.groupId,
          groupNama: element.groupNama,
          groupRmRumahSakit: element.groupRmRumahSakit,
          groupRmBidan: element.groupRmBidan,
          groupRmPuskesmas: element.groupRmPuskesmas,
          groupRmFaskesLainnya: element.groupRmFaskesLainnya,
          groupRmHidup: element.groupRmHidup,
          groupRmMati: element.groupRmMati,
          groupRmTotal: element.groupRmTotal,
          groupRnmHidup: element.groupRnmHidup,
          groupRnmMati: element.groupRnmMati,
          groupRnmTotal: element.groupRnmTotal,
          groupNrHidup: element.groupNrHidup,
          groupNrMati: element.groupNrMati,
          groupNrTotal: element.groupNrTotal,
          groupDirujuk: element.groupDirujuk,
          details: filterData,
        });
      });

      setDataRL(satu);
      setDataCount(detailkegiatan.data.dataCount || []);
      setNamaFile(
        "rl37_" +
          rsId +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );

      setSubmittedBulan(bulan);
      setSubmittedTahun(tahun);
      setSubmittedRumahSakit(rumahSakit);

      toast.success(
        `Berhasil memuat ${detailkegiatan.data.data.length} baris data RL 3.7`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
      handleClose();

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
          "/apisirs6v2/rltigatitiktujuhvalidasi",
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

      setSpinner(false);
    } catch (error) {
      console.log(error);
      setSpinner(false);
      handleClose();
    }
  };

  const getDataRLTigaTitikTujuhSatusehat = async (e) => {
    if (e) e.preventDefault();

    setSubmittedBulanSatusehat(bulan);
    setSubmittedTahunSatusehat(tahun);
    setSubmittedRumahSakitSatusehat(rumahSakit);

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const filter = [];
    filter.push("Provinsi: ".concat(rumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(rumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabelSatusehat(filter);
    setHasFilteredSatusehat(true);

    const rsId = getSelectedRsId();

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/getDataRLTigaTitikTujuhSatusehatLocal",
        {
          headers,
          params: {
            bulan_laporan: periode,
            rsId: rsId,
          },
        }
      );

      const arr = results?.data?.data || [];
      setDataRLSatusehat(Array.isArray(arr) ? arr : []);
      setNamaFileSatusehat(`rl37_satusehat_${periode}`);
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

  const syncDataRLTigaTitikTujuhSatusehat = async () => {
    if (!canSync) return;

    setIsSyncingSatusehat(true);
    setHasFilteredSatusehat(true);

    setSubmittedBulanSatusehat(bulan);
    setSubmittedTahunSatusehat(tahun);
    setSubmittedRumahSakitSatusehat(rumahSakit);

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const filter = [];
    filter.push("Provinsi: ".concat(rumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(rumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabelSatusehat(filter);

    const rsId = getSelectedRsId();

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const apiKey = process.env.REACT_APP_SATUSEHAT_API_KEY;
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      await axiosJWT.get("/apisirs6v2/rltigatitiktujuhsatusehat", {
        headers,
        params: {
          rsId: rsId,
          periode,
        },
      });

      toast.success("Sync Satusehat RL 3.7 berhasil", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setLastSyncAt(new Date());
      await getDataRLTigaTitikTujuhSatusehat();
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
    if (user?.jenisUserId === 4) {
      getDataRLTigaTitikTujuhSatusehat();
      return;
    }
    const rsId = getSelectedRsId();
    if (!rsId) {
      toast.info("Pilih rumah sakit terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    getDataRLTigaTitikTujuhSatusehat();
  };

  const handleSatusehatSyncClick = () => {
    if (user?.jenisUserId === 4) {
      syncDataRLTigaTitikTujuhSatusehat();
      return;
    }
    const rsId = getSelectedRsId();
    if (!rsId) {
      toast.info("Pilih rumah sakit terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    syncDataRLTigaTitikTujuhSatusehat();
  };

  async function handleDownloadExcelSatusehat() {
    if (!hasFilteredSatusehat) {
      toast.info("Filter data terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    setIsDownloading(true);
    try {
      downloadExcel(
        { currentTableRef: tableSatusehatRef },
        {
          fileName: namafileSatusehat,
          sheet: "Sheet1",
          tableRow: "tr, li, img, input, select",
        }
      );
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  }

  const getValidasi = async () => {
    try {
      const rsId = getSelectedRsId() || (submittedRumahSakit?.id ? Number(submittedRumahSakit.id) : null) || (user?.satKerId ? Number(user.satKerId) : null);
      if (!rsId) return;

      const periodeBulan = submittedBulan ?? bulan;
      const periodeTahun = submittedTahun ?? tahun;
      if (!periodeBulan || !periodeTahun) return;

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rsId,
          periode: String(periodeTahun).concat("-").concat(String(periodeBulan).padStart(2, "0")),
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktujuhvalidasi",
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
        const response = await axiosJWT.patch(
          `/apisirs6v2/rltigatitiktujuhvalidasi/${validasiId}`,
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
        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitiktujuhvalidasi",
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

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(`/apisirs6v2/rltigatitiktujuh/${id}`, customConfig);
      // Refresh data after deletion
      getRL({ preventDefault: () => {} });
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

        <form onSubmit={activeWadahTab === "satusehat" ? getDataRLTigaTitikTujuhSatusehat : getRL}>
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
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <h4 className={style.pageHeader}> RL 3.7 - Neonatal, Bayi dan Balita</h4>

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
                Satu Sehat
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
                    to={`/rl37/tambah/`}
                    type="button"
                    className={style.btnPrimary}
                    style={{ textDecoration: "none" }}
                  >
                    Tambah
                  </Link>
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
                  sheet="data RL 37"
                  currentTableRef={tableRef.current}
                >
                  <button
                    type="button"
                    className={style.btnPrimary}
                  >
                    Download
                  </button>
                </DownloadTableExcel>
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
                        <table
                          className={style.table}
                          style={{ width: "200%" }}
                          ref={tableRef}
                        >
                          <thead className={style.thead}>
                            <tr className="main-header-row">
                              <th
                                className={style["sticky-header-view"]}
                                style={{ width: "2.5%" }}
                              >
                                No.
                              </th>

                              {showAksi && (
                                <th
                                  className={style["sticky-header-view"]}
                                  style={{ width: "6%" }}
                                >
                                  Aksi
                                </th>
                              )}

                              <th
                                className={style["sticky-header-view"]}
                                style={{ width: "10%" }}
                              >
                                Jenis Kegiatan
                              </th>

                              <th>Rujukan Medis Rumah Sakit</th>
                              <th>Rujukan Medis Bidan</th>
                              <th>Rujukan Medis Puskesmas</th>
                              <th>Rujukan Medis Faskes Lainnya</th>
                              <th>Rujukan Medis Hidup</th>
                              <th>Rujukan Medis Mati</th>
                              <th>Rujukan Medis Total</th>
                              <th>Rujukan Non Medis Hidup</th>
                              <th>Rujukan Non Medis Mati</th>
                              <th>Rujukan Non Medis Total</th>
                              <th>Non Rujukan Hidup</th>
                              <th>Non Rujukan Mati</th>
                              <th>Non Rujukan Total</th>
                              <th>Dirujuk</th>
                            </tr>
                          </thead>

                          <tbody>
                            {dataRL.map((value, index) => (
                              <React.Fragment key={index}>
                                {/* GROUP */}
                                <tr
                                  style={{
                                    textAlign: "center",
                                    backgroundColor: "#C4DFAA",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <td className={style["sticky-column-view"]}>
                                    {value.groupId}
                                  </td>

                                  {showAksi && (
                                    <td className={style["sticky-column-view"]}></td>
                                  )}

                                  <td className={style["sticky-column-view"]}>
                                    {value.groupNama}
                                  </td>

                                  <td>{value.groupRmRumahSakit}</td>
                                  <td>{value.groupRmBidan}</td>
                                  <td>{value.groupRmPuskesmas}</td>
                                  <td>{value.groupRmFaskesLainnya}</td>
                                  <td>{value.groupRmHidup}</td>
                                  <td>{value.groupRmMati}</td>
                                  <td>{value.groupRmTotal}</td>
                                  <td>{value.groupRnmHidup}</td>
                                  <td>{value.groupRnmMati}</td>
                                  <td>{value.groupRnmTotal}</td>
                                  <td>{value.groupNrHidup}</td>
                                  <td>{value.groupNrMati}</td>
                                  <td>{value.groupNrTotal}</td>
                                  <td>{value.groupDirujuk}</td>
                                </tr>

                                {value.details.map((value2, index2) => (
                                  <React.Fragment key={index2}>
                                    {/* SUBGROUP */}
                                    <tr
                                      style={{
                                        textAlign: "center",
                                        backgroundColor: "#90C8AC",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      <td className={style["sticky-column-view"]}>
                                        {value2.subGroupNo}
                                      </td>

                                      {showAksi && (
                                        <td className={style["sticky-column-view"]}></td>
                                      )}

                                      <td className={style["sticky-column-view"]}>
                                        {value2.subGroupNama}
                                      </td>

                                      <td>{value2.subGroupRmRumahSakit}</td>
                                      <td>{value2.subGroupRmBidan}</td>
                                      <td>{value2.subGroupRmPuskesmas}</td>
                                      <td>{value2.subGroupRmFaskesLainnya}</td>
                                      <td>{value2.subGroupRmHidup}</td>
                                      <td>{value2.subGroupRmMati}</td>
                                      <td>{value2.subGroupRmTotal}</td>
                                      <td>{value2.subGroupRnmHidup}</td>
                                      <td>{value2.subGroupRnmMati}</td>
                                      <td>{value2.subGroupRnmTotal}</td>
                                      <td>{value2.subGroupNrHidup}</td>
                                      <td>{value2.subGroupNrMati}</td>
                                      <td>{value2.subGroupNrTotal}</td>
                                      <td>{value2.subGroupDirujuk}</td>
                                    </tr>

                                    {value2.kegiatan.map((value3, index3) => (
                                      <tr
                                        key={index3}
                                        style={{
                                          textAlign: "center",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <td className={style["sticky-column-view"]}>
                                          {value3.jenisKegiatanNo}
                                        </td>

                                        {showAksi && (
                                          <td className={style["sticky-column-view"]}>
                                            <div style={{ display: "flex" }}>
                                              <button
                                                className="btn btn-danger"
                                                style={{
                                                  marginRight: "5px",
                                                  backgroundColor: "#FF6663",
                                                  border: "1px solid #FF6663",
                                                }}
                                                type="button"
                                                onClick={() =>
                                                  hapus(value3.id)
                                                }
                                              >
                                                Hapus
                                              </button>

                                              {value3.jenisKegiatanNo !== "0" && (
                                                <Link
                                                  to={`/rl37/ubah/${value3.id}`}
                                                  className="btn btn-warning"
                                                  style={{
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
                                        )}

                                        <td className={style["sticky-column-view"]}>
                                          {value3.jenisKegiatanNama}
                                        </td>

                                        <td>{value3.rmRumahSakit}</td>
                                        <td>{value3.rmBidan}</td>
                                        <td>{value3.rmPuskesmas}</td>
                                        <td>{value3.rmFaskesLainnya}</td>
                                        <td>{value3.rmHidup}</td>
                                        <td>{value3.rmMati}</td>
                                        <td>{value3.rmTotal}</td>
                                        <td>{value3.rnmHidup}</td>
                                        <td>{value3.rnmMati}</td>
                                        <td>{value3.rnmTotal}</td>
                                        <td>{value3.nrHidup}</td>
                                        <td>{value3.nrMati}</td>
                                        <td>{value3.nrTotal}</td>
                                        <td>{value3.dirujuk}</td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </React.Fragment>
                            ))}
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
                      <h3 className={style.validasiCardTitle}>Validasi RL 3.7</h3>

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

            <div
              className={`tab-pane fade ${
                activeWadahTab === "satusehat" ? "show active" : ""
              }`}
            >
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginBottom: 14,
                  background: "#fff",
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

                  <div
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
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onClick={handleSatusehatFilterClick}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <FaFilter size={13} />
                    Filter
                  </div>

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
                      cursor: canSync ? "pointer" : "not-allowed",
                      opacity: canSync ? 1 : 0.55,
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) => canSync && (e.currentTarget.style.opacity = "0.85")}
                    onMouseOut={(e) => canSync && (e.currentTarget.style.opacity = "1")}
                  >
                    {isSyncingSatusehat ? (
                      <Spinner
                        animation="border"
                        role="status"
                        size="sm"
                        style={{ width: 14, height: 14, borderWidth: 2 }}
                      />
                    ) : (
                      <FaSyncAlt size={13} />
                    )}
                    {isSyncingSatusehat
                      ? "Syncing..."
                      : !canSync && !isSyncingSatusehat
                      ? `Tunggu ${cooldownLeft} menit lagi`
                      : "Sync SatuSehat"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcelSatusehat}
                    disabled={!hasFilteredSatusehat || isDownloading}
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
                      cursor:
                        !isDownloading && hasFilteredSatusehat ? "pointer" : "not-allowed",
                      opacity: !isDownloading && hasFilteredSatusehat ? 1 : 0.55,
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) =>
                      !isDownloading && hasFilteredSatusehat && (e.currentTarget.style.opacity = "0.85")
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
                        style={{ width: 14, height: 14, borderWidth: 2 }}
                      />
                    ) : (
                      <SiMicrosoftexcel size={15} />
                    )}
                    {isDownloading ? "Mengunduh..." : "Download Excel"}
                  </button>
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
                    display: "flex",
                    flexDirection: "column",
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
                        padding: "10px 12px",
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
                            textTransform: "uppercase",
                            color: "#94a3b8",
                            marginBottom: 2,
                          }}
                        >
                          TERAKHIR SYNC
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
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
                        padding: "10px 12px",
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
                            textTransform: "uppercase",
                            color: "#94a3b8",
                            marginBottom: 2,
                          }}
                        >
                          INTERVAL SYNC
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
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
                        <FaCheckCircle size={12} />
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
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 7,
                    padding: "9px 14px",
                    marginBottom: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  <div>Filtered By {filterLabelSatusehat.join(", ")}</div>
                  <div style={{ fontWeight: 600 }}>
                    Total {dataRLSatusehat.length} baris
                  </div>
                </div>
              )}

              {isSyncingSatusehat && (
                <div
                  style={{
                    fontSize: 12,
                    borderRadius: 8,
                    padding: "18px 16px",
                    lineHeight: 1.6,
                    marginBottom: 14,
                    background: "#f8fafc",
                    border: "1px solid #d9dee7",
                    color: "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Spinner animation="border" role="status" size="sm" />
                  <div>Sedang mengambil data dari SatuSehat, mohon tunggu...</div>
                </div>
              )}

              {!hasFilteredSatusehat && !isSyncingSatusehat && (
                <div
                  style={{
                    fontSize: 12,
                    borderRadius: 8,
                    padding: "12px 16px",
                    lineHeight: 1.6,
                    marginBottom: 14,
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    color: "#856404",
                  }}
                >
                  <strong style={{ fontWeight: 700 }}>Informasi:</strong> Silakan pilih filter terlebih dahulu.
                </div>
              )}

              {hasFilteredSatusehat &&
                !isSyncingSatusehat &&
                dataRLSatusehat.length === 0 &&
                lastSyncAt && (
                  <div
                    style={{
                      fontSize: 12,
                      borderRadius: 8,
                      padding: "12px 16px",
                      lineHeight: 1.6,
                      marginBottom: 14,
                      backgroundColor: "#d1ecf1",
                      border: "1px solid #bee5eb",
                      color: "#0c5460",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      Filtered By {filterLabelSatusehat.join(", ")}
                    </div>
                    <div>
                      <strong style={{ fontWeight: 700 }}>Info:</strong> Data tidak ditemukan untuk filter ini setelah dilakukan sinkronisasi.
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#0c5460" }}>
                      Terakhir sinkronisasi: {formatLastSyncAt(lastSyncAt)}
                    </div>
                  </div>
                )}

              {hasFilteredSatusehat &&
                !isSyncingSatusehat &&
                dataRLSatusehat.length === 0 &&
                !lastSyncAt && (
                  <div
                    style={{
                      fontSize: 12,
                      borderRadius: 8,
                      padding: "12px 16px",
                      lineHeight: 1.6,
                      marginBottom: 14,
                      backgroundColor: "#f8d7da",
                      border: "1px solid #f5c6cb",
                      color: "#721c24",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      Filtered By {filterLabelSatusehat.join(", ")}
                    </div>
                    <div>
                      <strong style={{ fontWeight: 700 }}>Peringatan:</strong> Belum dilakukan sinkronisasi SatuSehat untuk periode ini.
                    </div>
                    <div style={{ marginTop: 6 }}>
                      Klik tombol <code>Sync SatuSehat</code> untuk mengambil data.
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#721c24" }}>
                      Terakhir sinkronisasi: -
                    </div>
                  </div>
                )}

              {hasFilteredSatusehat && dataRLSatusehat.length > 0 && (
                <div className={style["table-container"]}>
                  <div className="table-responsive">
                    <table
                      className={style.table}
                      ref={tableSatusehatRef}
                      style={{ width: "200%" }}
                    >
                      <thead>
                        <tr className={style.thead}>
                          <th
                            rowSpan={2}
                            style={{ width: "5%", verticalAlign: "middle" }}
                          >
                            No.
                          </th>
                          <th
                            rowSpan={2}
                            style={{ width: "20%", verticalAlign: "middle" }}
                          >
                            Nama Kegiatan
                          </th>
                          <th colSpan={4} style={{ textAlign: "center" }}>Rujukan Medis</th>
                          <th colSpan={3} style={{ textAlign: "center" }}>Rujukan Medis Total</th>
                          <th colSpan={3} style={{ textAlign: "center" }}>Rujukan Non Medis</th>
                          <th colSpan={3} style={{ textAlign: "center" }}>Non Rujukan</th>
                          <th rowSpan={2} style={{ verticalAlign: "middle" }}>Dirujuk</th>
                        </tr>
                        <tr className={style["subheader-row"]}>
                          <th>RS</th>
                          <th>Bidan</th>
                          <th>Puskesmas</th>
                          <th>Faskes Lainnya</th>
                          <th>Hidup</th>
                          <th>Mati</th>
                          <th>Total</th>
                          <th>Hidup</th>
                          <th>Mati</th>
                          <th>Total</th>
                          <th>Hidup</th>
                          <th>Mati</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRLSatusehat.map((value, index) => (
                          <tr key={`${value?.nama_kegiatan || "row"}-${index}`}>
                            <td style={{ textAlign: "center" }}>{index + 1}</td>
                            <td style={{ textAlign: "left" }}>{value?.nama_kegiatan}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_rumah_sakit || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_bidan || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_puskesmas || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_faskes_lainnya || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_jumlah_hidup || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_jumlah_mati || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_medis_total || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_non_medis_jumlah_hidup || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_non_medis_jumlah_mati || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.rujukan_non_medis_total || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.non_rujukan_jumlah_hidup || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.non_rujukan_jumlah_mati || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.non_rujukan_total || 0}</td>
                            <td style={{ textAlign: "center" }}>{value?.dirujuk || 0}</td>
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

export default RL37;
