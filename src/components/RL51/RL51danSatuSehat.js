import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { downloadExcel } from "react-export-table-to-excel";

import style from "./FormTambahRL51.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { getStatusSatset } from "../../api/status_satset.js";
import { getDataSatusehat } from "../../api/rlLimasatuSatusehat.js";
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
          <h4 className={style.pageHeader}>
            {" "}
            RL 5.1 - Morbiditas Pasien Rawat Jalan
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
                  className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
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
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
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
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

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

  const { CSRFToken } = useCSRFTokenContext();

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

  // const getRumahSakit = async (kabKotaId) => {
  //   setLoadingRS(true);
  //   setDaftarRumahSakit([]);
  //   try {
  //     const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       params: {
  //         kabKotaId: kabKotaId,
  //       },
  //     });
  //     setDaftarRumahSakit(response.data.data);
  //   } catch (error) {}
  //   setLoadingRS(false);
  // };

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
      const bulanFix = String(bulan).padStart(2, "0");
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulanFix}`,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rllimatitiksatuvalidasi",
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

  const fetchRL = async (pageNumber = 1) => {
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulan}`,
          page: pageNumber,
          limit: limit,
        },
      };

      const results = await axiosJWT.get(
        "/apisirs6v2/rllimatitiksatupaging",
        customConfig,
      );

      setDataRL(results.data.data);

      setTotalPages(results.data.pagination.totalPages);
      setPage(results.data.pagination.page);
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const getRL = async (e) => {
    e.preventDefault();

    if (user.jenisUserId == 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSpinner(false);
        return;
      }
    }

    const filter = [];
    filter.push("Nama Rumah Sakit: " + rumahSakit.nama);
    filter.push("Periode: " + `${tahun}-${bulan}`);
    setFilterLabel(filter);

    setNamaFile(`rl51_${rumahSakit.id}_${tahun}-${bulan}-01`);

    handleClose();
    setActiveTab("tab1");
    setIsFilterApplied(true);

    await fetchRL(1); // ⬅️ mulai dari halaman 1
    await getValidasi();
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
      await axiosJWT.delete(`/apisirs6v2/rllimatitiksatu/${id}`, customConfig);
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

  const handleClose = () => setShow(false);

  const handleShow = () => {
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
          "/apisirs6v2/rllimatitiksatuvalidasi/" + idValidasi,
          {
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rllimatitiksatuvalidasi",
          {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(bulan),
            statusValidasiId: statusValidasi,
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      }
      setIsValidated(statusValidasi == 3);
      await getValidasi();
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setSpinner(false);
  };

  const handleDownloadExcel = async () => {
    try {
      setSpinner(true);

      const res = await axiosJWT.get("/apisirs6v2/rllimatitiksatu", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulan}`,
        },
      });

      const allData = res.data.data; // sesuaikan struktur response

      const header = [
        "No",
        "Kode ICD-10",
        "Diagnosis Penyakit",
        "< 1 Jam L",
        "< 1 Jam P",
        "1 - 23 Jam L",
        "1 - 23 Jam P",
        "1 - 7 Hari L",
        "1 - 7 Hari P",
        "8 - 28 Hari L",
        "8 - 28 Hari P",
        "29 Hari - <3 Bulan L",
        "29 Hari - <3 Bulan P",
        "3 - <6 Bulan L",
        "3 - <6 Bulan P",
        "6 - 11 Bulan L",
        "6 - 11 Bulan P",
        "1 - 4 Tahun L",
        "1 - 4 Tahun P",
        "5 - 9 Tahun L",
        "5 - 9 Tahun P",
        "10 - 14 Tahun L",
        "10 - 14 Tahun P",
        "15 - 19 Tahun L",
        "15 - 19 Tahun P",
        "20 - 24 Tahun L",
        "20 - 24 Tahun P",
        "25 - 29 Tahun L",
        "25 - 29 Tahun P",
        "30 - 34 Tahun L",
        "30 - 34 Tahun P",
        "35 - 39 Tahun L",
        "35 - 39 Tahun P",
        "40 - 44 Tahun L",
        "40 - 44 Tahun P",
        "45 - 49 Tahun L",
        "45 - 49 Tahun P",
        "50 - 54 Tahun L",
        "50 - 54 Tahun P",
        "55 - 59 Tahun L",
        "55 - 59 Tahun P",
        "60 - 64 Tahun L",
        "60 - 64 Tahun P",
        "65 - 69 Tahun L",
        "65 - 69 Tahun P",
        "70 - 74 Tahun L",
        "70 - 74 Tahun P",
        "75 - 79 Tahun L",
        "75 - 79 Tahun P",
        "80 - 84 Tahun L",
        "80 - 84 Tahun P",
        "≥ 85 Tahun L",
        "≥ 85 Tahun P",
        "Jumlah Kasus Baru L",
        "Jumlah Kasus Baru P",
        "Total Jumlah Kasus Baru",
        "Jumlah Kunjungan L",
        "Jumlah Kunjungan P",
        "Total Jumlah Kunjungan",
      ];

      const body = allData.map((value, index) => [
        index + 1,
        value.icd.icd_code,
        value.icd.description_code,
        value.jumlah_L_dibawah_1_jam,
        value.jumlah_P_dibawah_1_jam,
        value.jumlah_L_1_sampai_23_jam,
        value.jumlah_P_1_sampai_23_jam,
        value.jumlah_L_1_sampai_7_hari,
        value.jumlah_P_1_sampai_7_hari,
        value.jumlah_L_8_sampai_28_hari,
        value.jumlah_P_8_sampai_28_hari,
        value.jumlah_L_29_hari_sampai_dibawah_3_bulan,
        value.jumlah_P_29_hari_sampai_dibawah_3_bulan,
        value.jumlah_L_3_bulan_sampai_dibawah_6_bulan,
        value.jumlah_P_3_bulan_sampai_dibawah_6_bulan,
        value.jumlah_L_6_bulan_sampai_11_bulan,
        value.jumlah_P_6_bulan_sampai_11_bulan,
        value.jumlah_L_1_sampai_4_tahun,
        value.jumlah_P_1_sampai_4_tahun,
        value.jumlah_L_5_sampai_9_tahun,
        value.jumlah_P_5_sampai_9_tahun,
        value.jumlah_L_10_sampai_14_tahun,
        value.jumlah_P_10_sampai_14_tahun,
        value.jumlah_L_15_sampai_19_tahun,
        value.jumlah_P_15_sampai_19_tahun,
        value.jumlah_L_20_sampai_24_tahun,
        value.jumlah_P_20_sampai_24_tahun,
        value.jumlah_L_25_sampai_29_tahun,
        value.jumlah_P_25_sampai_29_tahun,
        value.jumlah_L_30_sampai_34_tahun,
        value.jumlah_P_30_sampai_34_tahun,
        value.jumlah_L_35_sampai_39_tahun,
        value.jumlah_P_35_sampai_39_tahun,
        value.jumlah_L_40_sampai_44_tahun,
        value.jumlah_P_40_sampai_44_tahun,
        value.jumlah_L_45_sampai_49_tahun,
        value.jumlah_P_45_sampai_49_tahun,
        value.jumlah_L_50_sampai_54_tahun,
        value.jumlah_P_50_sampai_54_tahun,
        value.jumlah_L_55_sampai_59_tahun,
        value.jumlah_P_55_sampai_59_tahun,
        value.jumlah_L_60_sampai_64_tahun,
        value.jumlah_P_60_sampai_64_tahun,
        value.jumlah_L_65_sampai_69_tahun,
        value.jumlah_P_65_sampai_69_tahun,
        value.jumlah_L_70_sampai_74_tahun,
        value.jumlah_P_70_sampai_74_tahun,
        value.jumlah_L_75_sampai_79_tahun,
        value.jumlah_P_75_sampai_79_tahun,
        value.jumlah_L_80_sampai_84_tahun,
        value.jumlah_P_80_sampai_84_tahun,
        value.jumlah_L_diatas_85_tahun,
        value.jumlah_P_diatas_85_tahun,
        value.jumlah_kasus_baru_L,
        value.jumlah_kasus_baru_P,
        value.total_kasus_baru,
        value.jumlah_kunjungan_L,
        value.jumlah_kunjungan_P,
        value.total_jumlah_kunjungan,
      ]);

      downloadExcel({
        fileName: namafile,
        sheet: "RL 5.1",
        tablePayload: {
          header,
          body,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSpinner(false);
    }
  };

  const [activeTab, setActiveTab] = useState("tab1");

  const handleTabClick = (tab) => {
    if (tab === "tab2") {
      getValidasi();
    }
    setActiveTab(tab);
  };

  const stickyOffsets =
    user.jenisUserId === 4
      ? { no: "0px", aksi: "40px", icd: "202px", diag: "307px" }
      : { no: "0px", icd: "52px", diag: "180px" };

  return (
    <div className="container-fluid">
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

        <form onSubmit={getRL}>
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
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <>
                <Link
                  className={style.btnPrimary}
                  style={{ textDecoration: "none" }}
                  to={`/rl51/tambah/`}
                >
                  Tambah
                </Link>
              </>
            ) : (
              <></>
            )}

            <button className={style.btnPrimary} onClick={handleShow}>
              {/* <FaSlidersH /> */}
              Filter
            </button>

            {/* <DownloadTableExcel
              filename={namafile}
              sheet="data RL 51"
              currentTableRef={tableRef.current}
            >
              <button className={style.btnPrimary}>
                {" "}
                <FaDownload />
                Download
              </button>
            </DownloadTableExcel> */}

            <button className={style.btnPrimary} onClick={handleDownloadExcel}>
              {/* <FaDownload /> */}
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
                <table
                  className={style["table"]}
                  style={{ width: "500%" }}
                  ref={tableRef}
                >
                  <thead className={style.thead}>
                    <tr className="main-header-row">
                      <th
                        className={style["sticky-header-view"]}
                        rowSpan="3"
                        style={{ width: "1%", left: stickyOffsets.no }}
                      >
                        No.
                      </th>
                      {user.jenisUserId === 4 && (
                        <th
                          className={style["sticky-header-view"]}
                          rowSpan="3"
                          style={{ width: "3%", left: stickyOffsets.aksi }}
                        >
                          Aksi
                        </th>
                      )}
                      <th
                        className={style["sticky-header-view"]}
                        rowSpan="3"
                        style={{ width: "2%", left: stickyOffsets.icd }}
                      >
                        Kode ICD 10
                      </th>
                      <th
                        className={style["sticky-header-view"]}
                        rowSpan="3"
                        style={{ width: "5%", left: stickyOffsets.diag }}
                      >
                        Diagnosis Penyakit
                      </th>
                      <th colSpan="50" style={{ width: "70%" }}>
                        Jumlah Kasus Baru Menurut Kelompok Umur & Jenis Kelamin
                      </th>
                      <th colSpan="3" style={{ width: "5%" }}>
                        Jumlah Kasus Baru Menurut Jenis Kelamin
                      </th>
                      <th colSpan="3" style={{ width: "5%" }}>
                        Jumlah Kunjungan
                      </th>
                    </tr>
                    <tr className={style["subheader-row"]}>
                      <th colSpan="2">&lt;1Jam</th>
                      <th colSpan="2">1 - 23 Jam</th>
                      <th colSpan="2">1 - 7 Hr</th>
                      <th colSpan="2">8 - 28 Hr</th>
                      <th colSpan="2">29 hr - &lt; 3 bln</th>
                      <th colSpan="2">3 - &lt; 6 bln</th>
                      <th colSpan="2">6 - 11 bln</th>
                      <th colSpan="2">1 - 4 th</th>
                      <th colSpan="2">5 - 9 th</th>
                      <th colSpan="2">10 - 14 th</th>
                      <th colSpan="2">15 - 19 th</th>
                      <th colSpan="2">20 - 24 th</th>
                      <th colSpan="2">25 - 29 th</th>
                      <th colSpan="2">30 - 34 th</th>
                      <th colSpan="2">35 - 39 th</th>
                      <th colSpan="2">40 - 44 th</th>
                      <th colSpan="2">45 - 49 th</th>
                      <th colSpan="2">50 - 54 th</th>
                      <th colSpan="2">55 - 59 th</th>
                      <th colSpan="2">60 - 64 th</th>
                      <th colSpan="2">65 - 69 th</th>
                      <th colSpan="2">70 - 74 th</th>
                      <th colSpan="2">75 - 79 th</th>
                      <th colSpan="2">80 - 84 th</th>
                      <th colSpan="2">&gt; 85 th</th>
                      <th rowSpan="2">L</th>
                      <th rowSpan="2">P</th>
                      <th rowSpan="2">Total</th>
                      <th rowSpan="2">L</th>
                      <th rowSpan="2">P</th>
                      <th rowSpan="2">Total</th>
                    </tr>
                    <tr className={style["subsubheader-row"]}>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                      <th>L</th>
                      <th>P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRL.map((value, index) => {
                      return (
                        <tr key={value.id}>
                          <td
                            className={style["sticky-column-view"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                              left: stickyOffsets.no,
                            }}
                          >
                            {/* <input
                        type="text"
                        name="id"
                        className="form-control"
                        value={index + 1}
                        disabled={true}
                        style={{ textAlign: "center" }}
                      /> */}
                            <p>{(page - 1) * limit + index + 1}</p>
                          </td>
                          {user.jenisUserId === 4 && (
                            <td
                              className={style["sticky-column-view"]}
                              style={{ left: stickyOffsets.aksi }}
                            >
                              {/* <RiDeleteBin5Fill  size={20} onClick={(e) => hapus(value.id)} style={{color: "gray", cursor: "pointer", marginRight: "5px"}} /> */}

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <button
                                  className="btn btn-danger"
                                  style={{
                                    margin: "0 5px 0 0",
                                    backgroundColor: "#FF6663",
                                    border: "1px solid #FF6663",
                                  }}
                                  type="button"
                                  onClick={(e) => deleteConfirmation(value.id)}
                                >
                                  Hapus
                                </button>
                                {value.icd.icd_code != 0 && (
                                  <Link
                                    to={`/rl51/edit/${value.id}`}
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
                          )}
                          <td
                            className={style["sticky-column-view"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                              left: stickyOffsets.icd,
                            }}
                          >
                            {/* <input
                        type="text"
                        name="codeICD"
                        className="form-control"
                        value={value.icd.icd_code}
                        disabled={true}
                      /> */}
                            <p>{value.icd.icd_code}</p>
                          </td>
                          <td
                            className={style["sticky-column-view"]}
                            style={{
                              textAlign: "left",
                              verticalAlign: "middle",
                              left: stickyOffsets.diag,
                            }}
                          >
                            {/* <input
                        type="text"
                        name="diagnosisPenyakit"
                        className="form-control"
                        value={value.icd.description_code}
                        disabled={true}
                      /> */}
                            <p>{value.icd.description_code}</p>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {/* <input
                        type="text"
                        name="jumlah_L_dibawah_1_jam"
                        className="form-control"
                        value={value.jumlah_L_dibawah_1_jam}
                        disabled={true}
                      /> */}
                            <p>{value.jumlah_L_dibawah_1_jam}</p>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {/* <input
                        type="text"
                        name="jumlah_P_dibawah_1_jam"
                        className="form-control"
                        value={value.jumlah_P_dibawah_1_jam}
                        disabled={true}
                      /> */}
                            <p>{value.jumlah_P_dibawah_1_jam}</p>
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_23_jam"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_23_jam}
                        disabled={true}
                      /> */}
                            <p>{value.jumlah_L_1_sampai_23_jam}</p>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_23_jam"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_23_jam}
                        disabled={true}
                      /> */}
                            <p>{value.jumlah_P_1_sampai_23_jam}</p>
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_7_hari"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_7_hari}
                        disabled={true}
                      /> */}
                            <p>{value.jumlah_L_1_sampai_7_hari}</p>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_1_sampai_7_hari}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_7_hari"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_7_hari}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_8_sampai_28_hari}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_8_sampai_28_hari"
                        className="form-control"
                        value={value.jumlah_L_8_sampai_28_hari}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_8_sampai_28_hari}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_8_sampai_28_hari"
                        className="form-control"
                        value={value.jumlah_P_8_sampai_28_hari}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>
                              {value.jumlah_L_29_hari_sampai_dibawah_3_bulan}
                            </p>
                            {/* <input
                        type="text"
                        name="jumlah_L_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={value.jumlah_L_29_hari_sampai_dibawah_3_bulan}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>
                              {value.jumlah_P_29_hari_sampai_dibawah_3_bulan}
                            </p>
                            {/* <input
                        type="text"
                        name="jumlah_P_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={value.jumlah_P_29_hari_sampai_dibawah_3_bulan}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>
                              {value.jumlah_L_3_bulan_sampai_dibawah_6_bulan}
                            </p>
                            {/* <input
                        type="text"
                        name="jumlah_L_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={value.jumlah_L_3_bulan_sampai_dibawah_6_bulan}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>
                              {value.jumlah_P_3_bulan_sampai_dibawah_6_bulan}
                            </p>
                            {/* <input
                        type="text"
                        name="jumlah_P_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={value.jumlah_P_3_bulan_sampai_dibawah_6_bulan}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_6_bulan_sampai_11_bulan}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={value.jumlah_L_6_bulan_sampai_11_bulan}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_6_bulan_sampai_11_bulan}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={value.jumlah_P_6_bulan_sampai_11_bulan}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_1_sampai_4_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_1_sampai_4_tahun"
                        className="form-control"
                        value={value.jumlah_L_1_sampai_4_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_1_sampai_4_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_1_sampai_4_tahun"
                        className="form-control"
                        value={value.jumlah_P_1_sampai_4_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_5_sampai_9_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_5_sampai_9_tahun"
                        className="form-control"
                        value={value.jumlah_L_5_sampai_9_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_5_sampai_9_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_5_sampai_9_tahun"
                        className="form-control"
                        value={value.jumlah_P_5_sampai_9_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_10_sampai_14_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_10_sampai_14_tahun"
                        className="form-control"
                        value={value.jumlah_L_10_sampai_14_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_10_sampai_14_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_10_sampai_14_tahun"
                        className="form-control"
                        value={value.jumlah_P_10_sampai_14_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_15_sampai_19_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_15_sampai_19_tahun"
                        className="form-control"
                        value={value.jumlah_L_15_sampai_19_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_15_sampai_19_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_15_sampai_19_tahun"
                        className="form-control"
                        value={value.jumlah_P_15_sampai_19_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_20_sampai_24_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_20_sampai_24_tahun"
                        className="form-control"
                        value={value.jumlah_L_20_sampai_24_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_20_sampai_24_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_20_sampai_24_tahun"
                        className="form-control"
                        value={value.jumlah_P_20_sampai_24_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_25_sampai_29_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_25_sampai_29_tahun"
                        className="form-control"
                        value={value.jumlah_L_25_sampai_29_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_25_sampai_29_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_25_sampai_29_tahun"
                        className="form-control"
                        value={value.jumlah_P_25_sampai_29_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_30_sampai_34_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_30_sampai_34_tahun"
                        className="form-control"
                        value={value.jumlah_L_30_sampai_34_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_30_sampai_34_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_30_sampai_34_tahun"
                        className="form-control"
                        value={value.jumlah_P_30_sampai_34_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_35_sampai_39_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_35_sampai_39_tahun"
                        className="form-control"
                        value={value.jumlah_L_35_sampai_39_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_35_sampai_39_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_35_sampai_39_tahun"
                        className="form-control"
                        value={value.jumlah_P_35_sampai_39_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_40_sampai_44_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_40_sampai_44_tahun"
                        className="form-control"
                        value={value.jumlah_L_40_sampai_44_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_40_sampai_44_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_40_sampai_44_tahun"
                        className="form-control"
                        value={value.jumlah_P_40_sampai_44_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_45_sampai_49_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_45_sampai_49_tahun"
                        className="form-control"
                        value={value.jumlah_L_45_sampai_49_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_45_sampai_49_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_45_sampai_49_tahun"
                        className="form-control"
                        value={value.jumlah_P_45_sampai_49_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_50_sampai_54_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_50_sampai_54_tahun"
                        className="form-control"
                        value={value.jumlah_L_50_sampai_54_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_50_sampai_54_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_50_sampai_54_tahun"
                        className="form-control"
                        value={value.jumlah_P_50_sampai_54_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_55_sampai_59_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_55_sampai_59_tahun"
                        className="form-control"
                        value={value.jumlah_L_55_sampai_59_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_55_sampai_59_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_55_sampai_59_tahun"
                        className="form-control"
                        value={value.jumlah_P_55_sampai_59_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_60_sampai_64_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_60_sampai_64_tahun"
                        className="form-control"
                        value={value.jumlah_L_60_sampai_64_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_60_sampai_64_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_60_sampai_64_tahun"
                        className="form-control"
                        value={value.jumlah_P_60_sampai_64_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_65_sampai_69_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_65_sampai_69_tahun"
                        className="form-control"
                        value={value.jumlah_L_65_sampai_69_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_65_sampai_69_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_65_sampai_69_tahun"
                        className="form-control"
                        value={value.jumlah_P_65_sampai_69_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_70_sampai_74_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_70_sampai_74_tahun"
                        className="form-control"
                        value={value.jumlah_L_70_sampai_74_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_70_sampai_74_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_70_sampai_74_tahun"
                        className="form-control"
                        value={value.jumlah_P_70_sampai_74_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_75_sampai_79_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_75_sampai_79_tahun"
                        className="form-control"
                        value={value.jumlah_L_75_sampai_79_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_75_sampai_79_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_75_sampai_79_tahun"
                        className="form-control"
                        value={value.jumlah_P_75_sampai_79_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_80_sampai_84_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_80_sampai_84_tahun"
                        className="form-control"
                        value={value.jumlah_L_80_sampai_84_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_80_sampai_84_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_80_sampai_84_tahun"
                        className="form-control"
                        value={value.jumlah_P_80_sampai_84_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_L_diatas_85_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_L_diatas_85_tahun"
                        className="form-control"
                        value={value.jumlah_L_diatas_85_tahun}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_P_diatas_85_tahun}</p>
                            {/* <input
                        type="text"
                        name="jumlah_P_diatas_85_tahun"
                        className="form-control"
                        value={value.jumlah_P_diatas_85_tahun}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_kasus_baru_L}</p>
                            {/* <input
                        type="text"
                        name="jumlah_kasus_baru_L"
                        className="form-control"
                        value={value.jumlah_kasus_baru_L}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_kasus_baru_P}</p>
                            {/* <input
                        type="text"
                        name="jumlah_kasus_baru_P"
                        className="form-control"
                        value={value.jumlah_kasus_baru_P}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.total_kasus_baru}</p>
                            {/* <input
                        type="text"
                        name="total_kasus_baru"
                        className="form-control"
                        value={value.total_kasus_baru}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_kunjungan_L}</p>
                            {/* <input
                        type="text"
                        name="jumlah_kunjungan_L"
                        className="form-control"
                        value={value.jumlah_kunjungan_L}
                        disabled={true}
                      /> */}
                          </td>

                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.jumlah_kunjungan_P}</p>
                            {/* <input
                        type="text"
                        name="jumlah_kunjungan_P"
                        className="form-control"
                        value={value.jumlah_kunjungan_P}
                        disabled={true}
                      /> */}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <p>{value.total_jumlah_kunjungan}</p>
                            {/* <input
                        type="text"
                        name="total_jumlah_kunjungan"
                        className="form-control"
                        value={value.total_jumlah_kunjungan}
                        disabled={true}
                      /> */}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    bottom: 0,
                    background: "#fff",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    borderTop: "1px solid #ddd",
                  }}
                >
                  <button
                    disabled={page === 1}
                    onClick={() => fetchRL(page - 1)}
                  >
                    ◀ Prev
                  </button>

                  <span>
                    Halaman {page} / {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => fetchRL(page + 1)}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>
            <div
              className={`tab-pane fade ${
                activeTab === "tab2" ? "show active" : ""
              }`}
            >
              <div className={style.validasiCard}>
                <h3 className={style.validasiCardTitle}>Validasi RL 5.1</h3>
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
                        <ToastContainer />

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
                            <label htmlFor="keteranganValidasi">Catatan</label>
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
  );
}

function TabTwo() {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { CSRFToken } = useCSRFTokenContext();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [masterUmur, setMasterUmur] = useState([]);
  const [sync, setSync] = useState({});
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const pollingRef = useRef(null);
  const MANUAL_SYNC_COOLDOWN = 5; // menit

  useEffect(() => {
    refreshToken();
    getBulan();
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
        getKabKota(satKerId);
        break;
      case 3:
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

  useEffect(() => {
    if (token) getMasterUmur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setNow(Date.now());
    if (!sync.lastSync || sync.isUpdating) return;

    const elapsed = (Date.now() - new Date(sync.lastSync).getTime()) / 60000;
    if (elapsed >= MANUAL_SYNC_COOLDOWN) return;

    const remainingMs = (MANUAL_SYNC_COOLDOWN - elapsed) * 60 * 1000;
    const timeout = setTimeout(() => setNow(Date.now()), remainingMs);
    return () => clearTimeout(timeout);
  }, [sync.lastSync, sync.isUpdating]);

  useEffect(() => {
    setIsManualSyncing(false);
  }, [sync]);

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
        const response = await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
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
    (error) => Promise.reject(error),
  );

  const getBulan = () => {
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

  const bulanChangeHandler = (e) => setBulan(e.target.value);
  const tahunChangeHandler = (e) => setTahun(e.target.value);

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
        headers: { Authorization: `Bearer ${token}` },
        params: { kabKotaId },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {
      console.error(error);
    }
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
      const response = await axiosJWT.get("/apisirs6v2/kabkota", {
        headers: { Authorization: `Bearer ${token}` },
        params: { provinsiId },
      });
      setDaftarKabKota(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getMasterUmur = async () => {
    try {
      const res = await axiosJWT.get("/apisirs6v2/getMasterumursatusehat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMasterUmur(res.data.data);
    } catch (error) {
      console.error("Gagal load master umur", error);
    }
  };

  const transformDataWithMasterUmur = (groupedData, masterUmurList) => {
    return groupedData.map((item) => {
      const umurMap = {};
      masterUmurList.forEach((umur) => {
        umurMap[umur.name] = 0;
      });
      item.umur.forEach((u) => {
        const ageName = u.age_group || "-";
        umurMap[ageName] = u.kunjungan_baru.total ?? 0;
      });
      return { ...item, umurMap };
    });
  };

  const groupByICD = (rawData) => {
    const mapICD = new Map();
    rawData.forEach((item) => {
      const icd = item.icd_10;
      if (!mapICD.has(icd)) {
        mapICD.set(icd, {
          icd_10: icd,
          diagnosis: item.diagnosis,
          total_kunjungan: { male: 0, female: 0, total: 0 },
          umur: [],
        });
      }
      const current = mapICD.get(icd);
      current.total_kunjungan.male = item.male_visits;
      current.total_kunjungan.female = item.female_visits;
      current.total_kunjungan.total = item.total_visits;
      current.umur.push({
        age_group: item.age_groups_satusehat?.name || "-",
        kunjungan_baru: {
          male: item.male_new_cases,
          female: item.females_new_cases,
          total: item.total_new_cases,
        },
      });
    });
    return Array.from(mapICD.values());
  };

  const fetchData = async (
    pageNumber = 1,
    isBackground = false,
    currentToken = token,
  ) => {
    if (!currentToken || !rumahSakit?.id) return;
    if (!isBackground) setLoadingTable(true);

    try {
      const res = await axiosJWT.get("/apisirs6v2/rllimatitiksatusatusehat", {
        headers: { Authorization: `Bearer ${currentToken}` },
        params: {
          rsId: rumahSakit.id,
          periode: `${tahun}-${bulan}`,
          page: pageNumber,
          limit,
        },
      });

      const rawData = res.data.data ?? [];
      const newSync = res.data.sync ?? {};
      const { pages } = res.data.pagination || {};

      const groupedData = groupByICD(rawData);
      const finalData = transformDataWithMasterUmur(groupedData, masterUmur);

      setDataRL(finalData);
      setSync(newSync);
      setPage(pageNumber);
      setTotalPages(pages || 1);

      if (
        !newSync.isUpdating &&
        (newSync.status === "success" || newSync.status === "failed")
      ) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setLoadingTable(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data");
    }

    if (!isBackground) setLoadingTable(false);
  };

  const startPolling = (currentToken) => {
    clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axiosJWT.get("/apisirs6v2/rllimatitiksatusatusehat", {
          headers: { Authorization: `Bearer ${currentToken}` },
          params: {
            rsId: rumahSakit.id,
            periode: `${tahun}-${bulan}`,
            page: 1,
            limit,
          },
        });

        const newSync = res.data.sync ?? {};
        setSync(newSync);

        if (
          !newSync.isUpdating &&
          (newSync.status === "success" || newSync.status === "failed")
        ) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          await fetchData(1, false, currentToken);
          setLoadingTable(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);
  };

  const getRLSatusehat = async (e) => {
    if (e) e.preventDefault();

    if (!rumahSakit?.id) {
      toast("Rumah sakit harus dipilih", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    if (!tahun || !bulan) {
      toast("Pilih Bulan & Tahun", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const periode = `${tahun}-${bulan}`;
    setFilterLabel([`Rumah Sakit: ${rumahSakit.nama}`, `Periode: ${periode}`]);
    setIsFilterApplied(true);
    setDataRL([]);
    setLoadingTable(true);

    await fetchData(1, false, token);

    setSync((prevSync) => {
      if (
        prevSync.isUpdating ||
        prevSync.status === "never" ||
        prevSync.status === "syncing"
      ) {
        setLoadingTable(true);
        startPolling(token);
      }
      return prevSync;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) +
      " WIB"
    );
  };

  const minutesSinceSync = sync.lastSync
    ? (now - new Date(sync.lastSync).getTime()) / 60000
    : null;

  const canSync =
    isFilterApplied &&
    !sync.isUpdating &&
    !isManualSyncing &&
    (minutesSinceSync === null || minutesSinceSync >= MANUAL_SYNC_COOLDOWN);

  const cooldownLeft =
    minutesSinceSync !== null
      ? Math.max(0, MANUAL_SYNC_COOLDOWN - minutesSinceSync).toFixed(1)
      : null;

  const handleManualSync = async () => {
    if (!canSync) return;

    setIsManualSyncing(true);
    setLoadingTable(true);

    try {
      await axiosJWT.post(
        "/apisirs6v2/rllimatitiksatusatusehat/sync",
        { rsId: rumahSakit.id, periode: `${tahun}-${bulan}` },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "XSRF-TOKEN": CSRFToken,
          },
        },
      );
      startPolling(token);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memulai sync");
      setLoadingTable(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!isFilterApplied || !rumahSakit?.id) {
      toast("Terapkan filter terlebih dahulu", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    setIsDownloading(true);

    try {
      // ── Step 1: Fetch halaman pertama.
      // NOTE: endpoint /rllimatitiksatusatusehat (getDataRL51WithSyncStatus)
      // membalas 400 kalau limit terlalu besar (mis. 200), jadi pakai `limit`
      // yang sama dengan yang dipakai fetchData() biasa — sudah terbukti valid.
      const firstRes = await axiosJWT.get(
        "/apisirs6v2/rllimatitiksatusatusehat",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            rsId: rumahSakit.id,
            periode: `${tahun}-${bulan}`,
            page: 1,
            limit,
          },
        },
      );

      const { pages: tp } = firstRes.data.pagination || {};
      let allRaw = [...(firstRes.data.data ?? [])];

      // ── Step 2: Fetch sisa halaman secara paralel ──
      if (tp > 1) {
        const remainingPages = Array.from({ length: tp - 1 }, (_, i) => i + 2);
        const results = await Promise.all(
          remainingPages.map((p) =>
            axiosJWT.get("/apisirs6v2/rllimatitiksatusatusehat", {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                rsId: rumahSakit.id,
                periode: `${tahun}-${bulan}`,
                page: p,
                limit,
              },
            }),
          ),
        );
        results.forEach((r) => allRaw.push(...(r.data.data ?? [])));
      }

      // ── Step 3: Group per ICD-10 (sama seperti tampilan tabel) ──
      const groupedData = groupByICD(allRaw);
      const finalData = transformDataWithMasterUmur(groupedData, masterUmur);

      // ── Step 4: Susun header (kolom umur dinamis dari masterUmur) ──
      const headers = ["No", "Kode ICD-10", "Diagnosis Penyakit", "Periode"];
      masterUmur.forEach((umur) => {
        headers.push(`${umur.name} L`, `${umur.name} P`, `${umur.name} Total`);
      });
      headers.push(
        "Total Kunjungan L",
        "Total Kunjungan P",
        "Total Kunjungan Total",
      );

      // ── Step 5: Susun baris data ──
      const rows = finalData.map((item, i) => {
        const row = [i + 1, item.icd_10, item.diagnosis, `${tahun}-${bulan}`];
        masterUmur.forEach((umur) => {
          const umurData = item.umur.find((u) => u.age_group === umur.name);
          row.push(
            umurData?.kunjungan_baru?.male ?? 0,
            umurData?.kunjungan_baru?.female ?? 0,
            umurData?.kunjungan_baru?.total ?? 0,
          );
        });
        row.push(
          item.total_kunjungan?.male ?? 0,
          item.total_kunjungan?.female ?? 0,
          item.total_kunjungan?.total ?? 0,
        );
        return row;
      });

      // ── Step 6: Generate & trigger download ──
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map((h, i) =>
        i === 2 ? { wch: 35 } : { wch: Math.max(h.length + 2, 8) },
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `RL5.1 ${tahun}-${bulan}`);
      XLSX.writeFile(wb, `RL5.1_${tahun}-${bulan}.xlsx`);

      toast("Download berhasil!", {
        type: "success",
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (err) {
      console.error(err);
      toast("Gagal download Excel", {
        type: "error",
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Komponen loading di dalam tabel (samakan dengan RL41)
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
      <Spinner animation="border" variant="primary" />
      <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
        Sedang mengambil data dari SatuSehat, mohon tunggu...
      </p>
    </div>
  );

  const DataTable = ({ data, loadingTable: bgLoading }) => (
    <div
      className="table-container mt-2 mb-1 pb-2"
      style={{ position: "relative" }}
    >
      {bgLoading && (
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
            flexDirection: "column",
          }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <Table
          className={style.table}
          striped
          bordered
          responsive
          style={{
            filter: bgLoading ? "blur(2px)" : "none",
            width: "500%",
            minWidth: 900,
          }}
          ref={tableRef}
        >
          <thead>
            <tr>
              <th
                rowSpan={3}
                style={{ verticalAlign: "middle", textAlign: "center" }}
              >
                No.
              </th>
              <th
                rowSpan={3}
                style={{ verticalAlign: "middle", textAlign: "center" }}
              >
                ICD 10
              </th>
              <th
                rowSpan={3}
                style={{
                  verticalAlign: "middle",
                  textAlign: "left",
                  width: "300px",
                }}
              >
                Diagnosis
              </th>
              <th
                colSpan={masterUmur.length * 3}
                style={{ textAlign: "center" }}
              >
                Kunjungan Kasus Baru per Umur
              </th>
              <th colSpan={3} rowSpan={2} style={{ textAlign: "center" }}>
                Total Kunjungan
              </th>
            </tr>
            <tr>
              {masterUmur.map((umur) => (
                <th key={umur.name} colSpan={3} style={{ textAlign: "center" }}>
                  {umur.name}
                </th>
              ))}
            </tr>
            <tr>
              {masterUmur.map((umur) => (
                <React.Fragment key={`${umur.name}-sub`}>
                  <th style={{ textAlign: "center" }}>L</th>
                  <th style={{ textAlign: "center" }}>P</th>
                  <th style={{ textAlign: "center" }}>Total</th>
                </React.Fragment>
              ))}
              <th style={{ textAlign: "center" }}>Laki-laki</th>
              <th style={{ textAlign: "center" }}>Perempuan</th>
              <th style={{ textAlign: "center" }}>Total</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, idx) => (
              <tr key={item.icd_10} style={{ verticalAlign: "middle" }}>
                <td style={{ textAlign: "center" }}>
                  {idx + 1 + (page - 1) * limit}
                </td>
                <td style={{ textAlign: "center" }}>{item.icd_10}</td>
                <td>{item.diagnosis}</td>
                {masterUmur.map((umur) => {
                  const umurData = item.umur.find(
                    (u) => u.age_group === umur.name,
                  );
                  return (
                    <React.Fragment key={`${item.icd_10}-${umur.name}`}>
                      <td style={{ textAlign: "center" }}>
                        {umurData?.kunjungan_baru?.male ?? "0"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {umurData?.kunjungan_baru?.female ?? "0"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {umurData?.kunjungan_baru?.total ?? "0"}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td style={{ textAlign: "center" }}>
                  {item.total_kunjungan?.male ?? "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.total_kunjungan?.female ?? "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.total_kunjungan?.total ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* {totalPages > 1 && (
          <div
            style={{
              padding: "12px 0",
              display: "flex",
              justifyContent: "center",
              gap: 12,
              borderTop: "1px solid #ddd",
            }}
          >
            <button disabled={page <= 1} onClick={() => fetchData(page - 1)}>
              ◀ Prev
            </button>
            <span>
              Halaman {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchData(page + 1)}
            >
              Next ▶
            </button>
          </div>
        )} */}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => fetchData(newPage)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
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
              {/* Provinsi - hanya jenisUserId 1 */}
              {user.jenisUserId === 1 && (
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
                    Provinsi
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 7,
                      padding: "7px 10px",
                      background: "#f8fafc",
                      minWidth: 170,
                    }}
                  >
                    <select
                      onChange={provinsiChangeHandler}
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        flex: 1,
                        fontSize: 13,
                        color: "#334155",
                      }}
                    >
                      <option value={0}>Pilih</option>
                      {daftarProvinsi.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Kab/Kota - jenisUserId 1 & 2 */}
              {(user.jenisUserId === 1 || user.jenisUserId === 2) && (
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
                    Kab/Kota
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 7,
                      padding: "7px 10px",
                      background: "#f8fafc",
                      minWidth: 170,
                    }}
                  >
                    <select
                      onChange={kabKotaChangeHandler}
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        flex: 1,
                        fontSize: 13,
                        color: "#334155",
                      }}
                    >
                      <option value={0}>Pilih</option>
                      {daftarKabKota.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Rumah Sakit - jenisUserId 1, 2 & 3 */}
              {(user.jenisUserId === 1 ||
                user.jenisUserId === 2 ||
                user.jenisUserId === 3) && (
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
                    Rumah Sakit
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 7,
                      padding: "7px 10px",
                      background: "#f8fafc",
                      minWidth: 200,
                    }}
                  >
                    <select
                      onChange={rumahSakitChangeHandler}
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        flex: 1,
                        fontSize: 13,
                        color: "#334155",
                      }}
                    >
                      <option value={0}>Pilih</option>
                      {daftarRumahSakit.map((nilai) => (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Bulan */}
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
                    minWidth: 155,
                  }}
                >
                  <FaCalendarAlt
                    size={13}
                    color="#94a3b8"
                    style={{ marginRight: 7, flexShrink: 0 }}
                  />
                  <select
                    value={bulan}
                    onChange={bulanChangeHandler}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      flex: 1,
                      fontSize: 13,
                      color: "#334155",
                    }}
                  >
                    {daftarBulan.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.key}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    onChange={tahunChangeHandler}
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

              {/* Tombol */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={getRLSatusehat}
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    <FaFilter size={14} /> FILTER
                  </button>
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={handleManualSync}
                    disabled={!canSync || !isFilterApplied}
                    title={
                      !isFilterApplied
                        ? "Terapkan filter terlebih dahulu"
                        : isManualSyncing || sync.isUpdating
                          ? "Sedang sinkronisasi..."
                          : !canSync
                            ? `Tunggu ${cooldownLeft} menit lagi`
                            : "Klik untuk sync manual"
                    }
                    style={{
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "9px 18px",
                      fontWeight: 700,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      cursor:
                        canSync && isFilterApplied ? "pointer" : "not-allowed",
                      opacity: canSync && isFilterApplied ? 1 : 0.55,
                    }}
                  >
                    {isManualSyncing || sync.isUpdating ? (
                      <>
                        <Spinner animation="border" size="sm" /> Syncing...
                      </>
                    ) : (
                      <>
                        <FaSyncAlt size={14} /> SYNC SATUSEHAT
                      </>
                    )}
                  </button>
                </div>

                <div style={{ textAlign: "center" }}>
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
                      gap: 7,
                      whiteSpace: "nowrap",
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
          </div>

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

            {/* Card 2: Status Sinkronisasi */}
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
                    <strong>{MANUAL_SYNC_COOLDOWN} Menit</strong>
                  </span>
                </div>
              </div>
            </div>

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
                  Data yang ditampilkan bersumber dari database{" "}
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
                {/* {isFilterApplied && sync.status === "success" && (
                  <span style={{ fontSize: 12, color: "gray" }}>
                    ✓ Diperbarui: {formatDate(sync.lastSync)} ({sync.totalData}{" "}
                    data)
                  </span>
                )} */}
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
          ) : (
            <DataTable data={dataRL} loadingTable={loadingTable} />
          )}
        </div>
      </div>
    </div>
  );
}
