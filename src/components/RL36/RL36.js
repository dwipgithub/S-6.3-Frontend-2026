import React, { useState, useEffect, useRef} from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL36.module.css";
import { HiSaveAs } from "react-icons/hi";
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
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
import { downloadExcel, DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import CryptoJS from "crypto-js";

const RL36 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [dataRLSatusehat, setDataRLSatusehat] = useState([]);
  const [downloadData, setDownloadData] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const [namafileSatusehat, setNamaFileSatusehat] = useState("");
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
  const { CSRFToken } = useCSRFTokenContext();
  const tableRef = useRef(null);
  const tableSatusehatRef = useRef(null);
  const syncCooldownTimeoutRef = useRef(null);
  const syncCooldownMinutes = 5;
  const syncCooldownMs = syncCooldownMinutes * 60 * 1000;

  // Load validasi data when user opens Validasi tab or when submitted filters change
  useEffect(() => {
    if (activeTab === "tab2" && submittedRumahSakit && submittedRumahSakit.id && submittedBulan !== 0 && submittedTahun) {
      getValidasi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedBulan, submittedTahun, submittedRumahSakit, activeTab]);

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
  // 🔴 hanya load jika belum ada RS
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

  // 🔴 cegah reset kalau sama
  if (rumahSakit && String(rumahSakit.id) === String(rsId)) {
    return;
  }

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
    // 🔴 cegah overwrite jika RS sama
    if (rumahSakit && String(rumahSakit.id) === String(id)) {
      return;
    }

    const response = await axiosJWT.get(
      "/apisirs6v2/rumahsakit/" + id,
      {
        headers: {
          Authorization: `Bearer ${tokenOverride || token}`,
        },
      }
    );

    setRumahSakit(response.data.data);
  } catch (error) {}
};

  const getDataRLTigaTitikEnam = async (event) => {
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: event,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikenam",
        customConfig
      );

      const rlTigaTitikEnamDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_enam_details;
      });

      let dataRLTigaTitikEnamDetails = [];
      rlTigaTitikEnamDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikEnamDetails.push(value);
        });
      });
      console.log(dataRLTigaTitikEnamDetails);
      // setDataRL(dataRLTigaTitikEnamDetails)

      let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );

      // console.log(sortedProducts);

      let groups = [];

      sortedProducts.reduce(function (res, value) {
        if (
          !res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
        ) {
          res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id] =
            {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              // jumlah: 0,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
          groups.push(
            res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
          );
        }
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmRumahSakit += value.rmRumahSakit;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmBidan += value.rmBidan;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmPuskesmas += value.rmPuskesmas;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmFaskesLainnya += value.rmFaskesLainnya;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmHidup += value.rmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmMati += value.rmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmTotal += value.rmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmHidup += value.rnmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmMati += value.rnmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmTotal += value.rnmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrHidup += value.nrHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrMati += value.nrMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrTotal += value.nrTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].dirujuk += value.dirujuk;
        return res;
      }, {});

      let data = [];

      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return (
              value.jenis_kegiatan_rl_tiga_titik_enam
                .group_jenis_kegiatan_id === element.groupId
            );
          });
          data.push({
            groupId: element.groupId,
            groupNo: element.groupNo,
            groupNama: element.groupNama,
            details: filterData,
            // subTotal: element.jumlah,
            subTotalRmRumahSakit: element.rmRumahSakit,
            subTotalRmBidan: element.rmBidan,
            subTotalRmPuskesmas: element.rmPuskesmas,
            subTotalRmFaskesLainnya: element.rmFaskesLainnya,
            subTotalRmHidup: element.rmHidup,
            subTotalRmMati: element.rmMati,
            subTotalRmTotal: element.rmTotal,
            subTotalRnmHidup: element.rnmHidup,
            subTotalRnmMati: element.rnmMati,
            subTotalRnmTotal: element.rnmTotal,
            subTotalNrHidup: element.nrHidup,
            subTotalNrMati: element.nrMati,
            subTotalNrTotal: element.nrTotal,
            subTotalDirujuk: element.dirujuk,
          });
        }
      });
      // console.log(data);
      setDataRL(data);

      setSpinner(false);
    } catch (error) {
      console.log(error);
      setSpinner(false);
    }
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
        console.log("hello2");
      }
    }
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
      } catch (e) {
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
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikenam",
        customConfig
      );

      if (!results.data.data || results.data.data.length === 0) {
        setDataRL([]);
        setDataCount([]);
        toast.info("Data RL tidak ditemukan untuk filter ini", {
          position: toast.POSITION.TOP_RIGHT,
        });
        handleClose();
        setSpinner(false);
        return;
      }

      const rlTigaTitikEnamDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_enam_details;
      });

      let dataRLTigaTitikEnamDetails = [];
      rlTigaTitikEnamDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikEnamDetails.push(value);
        });
      });
      console.log(dataRLTigaTitikEnamDetails);
      setDownloadData(dataRLTigaTitikEnamDetails);

      let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );

      let groups = [];

      sortedProducts.reduce(function (res, value) {
        if (
          !res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
        ) {
          res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id] =
            {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
          groups.push(
            res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
          );
        }
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmRumahSakit += value.rmRumahSakit;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmBidan += value.rmBidan;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmPuskesmas += value.rmPuskesmas;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmFaskesLainnya += value.rmFaskesLainnya;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmHidup += value.rmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmMati += value.rmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmTotal += value.rmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmHidup += value.rnmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmMati += value.rnmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmTotal += value.rnmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrHidup += value.nrHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrMati += value.nrMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrTotal += value.nrTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].dirujuk += value.dirujuk;
        return res;
      }, {});

      let data = [];

      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return (
              value.jenis_kegiatan_rl_tiga_titik_enam
                .group_jenis_kegiatan_id === element.groupId
            );
          });
          data.push({
            groupId: element.groupId,
            groupNo: element.groupNo,
            groupNama: element.groupNama,
            details: filterData,
            subTotalRmRumahSakit: element.rmRumahSakit,
            subTotalRmBidan: element.rmBidan,
            subTotalRmPuskesmas: element.rmPuskesmas,
            subTotalRmFaskesLainnya: element.rmFaskesLainnya,
            subTotalRmHidup: element.rmHidup,
            subTotalRmMati: element.rmMati,
            subTotalRmTotal: element.rmTotal,
            subTotalRnmHidup: element.rnmHidup,
            subTotalRnmMati: element.rnmMati,
            subTotalRnmTotal: element.rnmTotal,
            subTotalNrHidup: element.nrHidup,
            subTotalNrMati: element.nrMati,
            subTotalNrTotal: element.nrTotal,
            subTotalDirujuk: element.dirujuk,
          });
        }
      });
      setDataRL(data);
      setDataCount(results.data.dataCount || []);
      toast.success(
        `Berhasil memuat data RL 3.6`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
      handleClose();

      setSubmittedBulan(bulan);
      setSubmittedTahun(tahun);
      setSubmittedRumahSakit(rumahSakit);
      
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
          "/apisirs6v2/rltigatitikenamvalidasi",
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

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };

    try {
      await axiosJWT.delete(`/apisirs6v2/rltigatitikenam/${id}`, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));

      // SET Data after delete
      let date = tahun + "-" + bulan + "-01";
      try {
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
          "/apisirs6v2/rltigatitikenam",
          customConfig
        );

        const rlTigaTitikEnamDetails = results.data.data.map((value) => {
          return value.rl_tiga_titik_enam_details;
        });

        let dataRLTigaTitikEnamDetails = [];
        rlTigaTitikEnamDetails.forEach((element) => {
          element.forEach((value) => {
            dataRLTigaTitikEnamDetails.push(value);
          });
        });

        let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
          p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
            ? 1
            : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
            ? -1
            : 0
        );

        let groups = [];

        sortedProducts.reduce(function (res, value) {
          if (
            !res[
              value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
            ]
          ) {
            res[
              value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
            ] = {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
            groups.push(
              res[
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
              ]
            );
          }
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmRumahSakit += value.rmRumahSakit;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmBidan += value.rmBidan;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmPuskesmas += value.rmPuskesmas;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmFaskesLainnya += value.rmFaskesLainnya;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmHidup += value.rmHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmMati += value.rmMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmTotal += value.rmTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmHidup += value.rnmHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmMati += value.rnmMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmTotal += value.rnmTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrHidup += value.nrHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrMati += value.nrMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrTotal += value.nrTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].dirujuk += value.dirujuk;
          return res;
        }, {});

        let data = [];

        groups.forEach((element) => {
          if (element.groupId != null) {
            const filterData = sortedProducts.filter((value, index) => {
              return (
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_id === element.groupId
              );
            });
            data.push({
              groupId: element.groupId,
              groupNo: element.groupNo,
              groupNama: element.groupNama,
              details: filterData,
              subTotalRmRumahSakit: element.rmRumahSakit,
              subTotalRmBidan: element.rmBidan,
              subTotalRmPuskesmas: element.rmPuskesmas,
              subTotalRmFaskesLainnya: element.rmFaskesLainnya,
              subTotalRmHidup: element.rmHidup,
              subTotalRmMati: element.rmMati,
              subTotalRmTotal: element.rmTotal,
              subTotalRnmHidup: element.rnmHidup,
              subTotalRnmMati: element.rnmMati,
              subTotalRnmTotal: element.rnmTotal,
              subTotalNrHidup: element.nrHidup,
              subTotalNrMati: element.nrMati,
              subTotalNrTotal: element.nrTotal,
              subTotalDirujuk: element.dirujuk,
            });
          }
        });
        setDataRL(data);
      } catch (error) {
        console.log(error);
      }
      //

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
      if (!rumahSakit || !rumahSakit.id) {
        showRumahSakit(satKerId);
      }

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

  async function handleDownloadExcel() {
    const header = [
      "No",
      "No Kegiatan",
      "Jenis Kegiatan",
      "Rujukan Medis Rumah Sakit",
      "Rujukan Medis Bidan",
      "Rujukan Medis Puskesmas",
      "Rujukan Medis Faskes Lainnya",
      "Jumlah Hidup Rujukan Medis",
      "Jumlah Mati Rujukan Medis",
      "Total Rujukan Medis",
      "Jumlah Hidup Rujukan Non Medis",
      "Jumlah Mati Rujukan Non Medis",
      "Total Rujukan Non Medis",
      "Jumlah Hidup Non Rujukan",
      "Jumlah Mati Non Rujukan",
      "Total Non Rujukan",
      "Dirujuk",
    ];

    const body = downloadData.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_kegiatan_rl_tiga_titik_enam.no,
        value.jenis_kegiatan_rl_tiga_titik_enam.nama,
        value.rmRumahSakit,
        value.rmBidan,
        value.rmPuskesmas,
        value.rmFaskesLainnya,
        value.rmHidup,
        value.rmMati,
        value.rmTotal,
        value.rnmHidup,
        value.rnmMati,
        value.rnmTotal,
        value.nrHidup,
        value.nrMati,
        value.nrTotal,
        value.dirujuk,
      ];
      return data;
    });

    downloadExcel({
      fileName: "RL_3_6",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  const getDataRLTigaTitikEnamSatusehat = async (e) => {
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
    const bulanLaporan = `${periode}`;
    const filter = [];
    filter.push("Provinsi: ".concat(rumahSakit?.provinsi_nama ?? "-"));
    filter.push("Rumah Sakit: ".concat(rumahSakit?.nama ?? "-"));
    filter.push("Periode: ".concat(periode));
    setFilterLabelSatusehat(filter);
    setHasFilteredSatusehat(true);

    setSubmittedBulanSatusehat(bulan);
    setSubmittedTahunSatusehat(tahun);
    setSubmittedRumahSakitSatusehat(rumahSakit);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/getDataRLTigaTitikEnamSatusehatLocal",
        {
          headers,
          params: {
            rsId: rsId,
            bulan_laporan: bulanLaporan,
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

  const syncDataRLTigaTitikEnamSatusehat = async () => {
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

      await axiosJWT.get("/apisirs6v2/rltigatitikenamsatusehat", {
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
      await getDataRLTigaTitikEnamSatusehat();
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
    getDataRLTigaTitikEnamSatusehat();
  };

  const handleSatusehatSyncClick = () => {
    const rsId = getSelectedRsId();
    if (!rsId && user.jenisUserId !== 4) {
      handleShow();
      return;
    }
    syncDataRLTigaTitikEnamSatusehat();
  };

  async function handleDownloadExcelSatusehat() {
    setIsDownloading(true);
    try {
      const header = [
        "No",
        "Jenis Kegiatan",
        "Nama Kegiatan",
        "Rujukan RS",
        "Rujukan Bidan",
        "Rujukan Puskesmas",
        "Rujukan Faskes Lain",
        "Non Medis",
        "Non Rujukan",
        "Dirujuk",
        "Hidup",
        "Mati",
      ];

      const body = (Array.isArray(dataRLSatusehat) ? dataRLSatusehat : []).map(
        (value, index) => [
          index + 1,
          value?.jenis_kegiatan ?? "",
          value?.nama_kegiatan ?? "",
          value?.rujukan_rs ?? 0,
          value?.rujukan_bidan ?? 0,
          value?.rujukan_puskesmas ?? 0,
          value?.rujukan_faskes_lain ?? 0,
          value?.non_medis ?? 0,
          value?.non_rujukan ?? 0,
          value?.dirujuk ?? 0,
          value?.hidup ?? 0,
          value?.mati ?? 0,
        ]
      );

      const periode = `${submittedTahunSatusehat || tahun}-${String(submittedBulanSatusehat || bulan).padStart(2, "0")}`;

      downloadExcel({
        fileName: `RL_3_6_SatuSehat_${periode}`,
        sheet: "RL 3.6 SatuSehat",
        tablePayload: { header, body },
      });
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
        "/apisirs6v2/rltigatitikenamvalidasi",
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

    if (!submittedRumahSakit || !submittedRumahSakit.id) {
      toast("Rumah sakit harus dipilih dan filter diterapkan terlebih dahulu", {
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

      if (validasiId) {
        await axiosJWT.patch(
          `/apisirs6v2/rltigatitikenamvalidasi/${validasiId}`,
          payload,
          customConfig
        );
        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitikenamvalidasi",
          {
            rsId: submittedRumahSakit.id,
            periode: String(submittedTahun).concat("-").concat(String(submittedBulan).padStart(2, "0")),
            ...payload,
          },
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

        <form onSubmit={activeWadahTab === "satusehat" ? getDataRLTigaTitikEnamSatusehat : getRL}>
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
            <h4 className={style.pageHeader}> RL. 3.6 - Kebidanan</h4>
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
          {activeWadahTab === "sirs" ? (
            <>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl36/tambah/`}
                 type="button"
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
            <button
               type="button"
               className={style.btnPrimary}
              onClick={handleDownloadExcel}
            >
              Download
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
                <button type="button" className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`} onClick={() => handleTabClick("tab1")}>Data</button>
              </li>
              <li className={`nav-item ${style.navItem}`}>
                <button type="button" className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`} onClick={() => handleTabClick("tab2")}>Validasi</button>
              </li>
            </ul>
            <div className={`tab-content ${style.tabContent}`}>
              <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
                <div className={style["table-container"]}>
                   <table className={style["table"]}>
                      <thead className={style["thead"]}>
                <tr className="main-header-row">
                  <th
                    style={{ width: "2" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    No.
                  </th>
                  {user.jenisUserId === 4
                   ?
                  <th
                    style={{ width: "6%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Aksi
                  </th>
                  : <>
                     </>
                      }
                  <th
                    style={{ width: "15%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Jenis Kegiatan
                  </th>
                  <th colSpan={7} className="text-center">
                    Rujukan Medis
                  </th>
                  <th colSpan={3} className="text-center">
                    Rujukan Non Medis
                  </th>
                  <th colSpan={3} className="text-center">
                    Non Rujukan
                  </th>
                  <th rowSpan={2} className="align-middle">
                    Dirujuk
                  </th>
                </tr>
                <tr className={style["subsubheader-row"]}>
                  <th className="align-middle">Rumah Sakit</th>
                  <th className="align-middle">Bidan</th>
                  <th className="align-middle">Puskesmas</th>
                  <th className="align-middle">Faskes Lainnya</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Rujukan Medis</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Rujukan Non Medis</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Non Rujukan</th>
                </tr>
              </thead>
              <tbody>
                {
                  //eslint-disable-next-line
                  dataRL.map((value, index) => {
                    if (value.groupNama != null) {
                      return (
                        <React.Fragment key={index}>
                          <tr
                            style={{
                              textAlign: "center",
                              backgroundColor: "#C4DFAA",
                              fontWeight: "bold",
                              // color:"#354259"
                            }}
                          >
                            <td className={style["sticky-column-view"]}>
                              {value.groupNo}
                            </td>
                            {user.jenisUserId === 4
                   ?
                            <td className={style["sticky-column-view"]}></td>
                            : <>
                     </>
                      }
                            <td className={style["sticky-column-view"]}>
                              {/* {value.groupNama} */}
                              {value.groupNama}
                            </td>

                            <td>
                              {value.subTotalRmRumahSakit}
                            </td>
                            <td>
                              {value.subTotalRmBidan}
                            </td>
                            <td>
                              {value.subTotalRmPuskesmas}
                            </td>
                            <td>
                              {value.subTotalRmFaskesLainnya}
                            </td>
                            <td>
                              {value.subTotalRmHidup}
                            </td>
                            <td>
                              {value.subTotalRmMati}
                            </td>
                            <td>
                              {value.subTotalRmTotal}
                            </td>
                            <td>
                             {value.subTotalRnmHidup}
                            </td>
                            <td>
                              {value.subTotalRnmMati}
                            </td>
                            <td>
                              {value.subTotalRnmTotal}
                            </td>
                            <td>
                              {value.subTotalNrHidup}
                            </td>
                            <td>
                              {value.subTotalNrMati}
                            </td>
                            <td>
                              {value.subTotalNrTotal}
                            </td>
                            <td>
                              {value.subTotalDirujuk}
                            </td>
                          </tr>
                          {value.details.map((value2, index2) => {
                            return (
                              <tr key={index2}>
                                <td className={style["sticky-column-view"]}>
                                  {
                                      value2.jenis_kegiatan_rl_tiga_titik_enam
                                        .no
                                    }
                                </td>
                                {user.jenisUserId === 4
                   ?
                                <td
                                  className={style["sticky-column-view"]}
                                  style={{
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <ToastContainer />
                                  <div style={{ display: "flex" }}>
                                    <button
                                      className="btn btn-danger"
                                      style={{
                                        margin: "0 5px 0 0",
                                        backgroundColor: "#FF6663",
                                        border: "1px solid #FF6663",
                                      }}
                                      type="button"
                                      onClick={(e) =>
                                        hapus(value2.id, value2.tahun)
                                      }
                                    >
                                      Hapus
                                    </button>
                                     {value2.jenis_kegiatan_rl_tiga_titik_enam.nama !== "Tidak Ada Data" && (
                                    <Link
                                      to={`/rl36/ubah/${value2.id}`}
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
                                : <>
                     </>
                      }
                                <td className={style["sticky-column-view"]}>
                                  {/* {
                                    value2.jenis_kegiatan_rl_tiga_titik_enam
                                      .nama
                                  } */}
                                  {
                                      value2.jenis_kegiatan_rl_tiga_titik_enam
                                        .nama
                                    }
                                </td>
                                <td>
                                 {value2.rmRumahSakit}
                                </td>
                                <td>
                                  {value2.rmBidan}
                                </td>
                                <td>
                                  {value2.rmPuskesmas}
                                </td>
                                <td>
                                  {value2.rmFaskesLainnya}
                                </td>
                                <td>
                                  {value2.rmHidup}
                                </td>
                                <td>
                                  {value2.rmMati}
                                </td>
                                <td>
                                  {value2.rmTotal}
                                </td>
                                <td>
                                 {value2.rnmHidup}
                                </td>
                                <td>
                                  {value2.rnmMati}
                                </td>
                                <td>
                                  {value2.rnmTotal}
                                </td>
                                <td>
                                {value2.nrHidup}
                                </td>
                                <td>
                                  {value2.nrMati}
                                </td>
                                <td>
                                  {value2.nrTotal}
                                </td>
                                <td>
                                  {value2.dirujuk}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                    // else if (value.groupNama == null) {
                    // return (
                    //     <React.Fragment key={index}>
                    //     <tr>
                    //         <td style={{ textAlign: "left" }}>
                    //         {value.details[0].nama}
                    //         </td>
                    //         <td>{value.details[0].nilai}</td>
                    //     </tr>
                    //     </React.Fragment>
                    // );
                    // }
                  })
                }
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
                    <h3 className={style.validasiCardTitle}>Validasi RL 3.6</h3>

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
                                          {new Date(dataValidasi.createdAt).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                          })}
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
          </>
          ) : (
            <>
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
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
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

                {hasFilteredSatusehat && dataRLSatusehat.length > 0 && (
                  <div className={style["table-container"]}>
                    <div className="table-responsive">
                      <table
                        className={style.table}
                        ref={tableSatusehatRef}
                        style={{ width: "180%" }}
                      >
                        <thead className={style.thead}>
                          <tr className="main-header-row">
                            <th>No.</th>
                            <th>Jenis Kegiatan</th>
                            <th>Nama Kegiatan</th>
                            <th>Rujukan RS</th>
                            <th>Rujukan Bidan</th>
                            <th>Rujukan Puskesmas</th>
                            <th>Rujukan Faskes Lain</th>
                            <th>Non Medis</th>
                            <th>Non Rujukan</th>
                            <th>Dirujuk</th>
                            <th>Hidup</th>
                            <th>Mati</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataRLSatusehat.map((value, index) => {
                            const isNewGroup =
                              index === 0 ||
                              dataRLSatusehat[index - 1]?.jenis_kegiatan !== value?.jenis_kegiatan;

                            return (
                              <React.Fragment key={`${value?.jenis_kegiatan}-${value?.nama_kegiatan}-${index}`}>
                                {isNewGroup && (
                                  <tr
                                    style={{
                                      textAlign: "center",
                                      backgroundColor: "#C4DFAA",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    <td colSpan={12} style={{ textAlign: "left" }}>
                                      {value?.jenis_kegiatan}
                                    </td>
                                  </tr>
                                )}
                                <tr>
                                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                                  <td style={{ textAlign: "left" }}>{value?.jenis_kegiatan}</td>
                                  <td style={{ textAlign: "left" }}>{value?.nama_kegiatan}</td>
                                  <td style={{ textAlign: "center" }}>{value?.rujukan_rs || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.rujukan_bidan || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.rujukan_puskesmas || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.rujukan_faskes_lain || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.non_medis || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.non_rujukan || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.dirujuk || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.hidup || 0}</td>
                                  <td style={{ textAlign: "center" }}>{value?.mati || 0}</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RL36;
