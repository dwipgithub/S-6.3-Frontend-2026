import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL37.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-bootstrap/Modal";
import { DownloadTableExcel } from "react-export-table-to-excel";
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
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [activeWadahTab, setActiveWadahTab] = useState("sirs");
  const [filterLabelSatusehat, setFilterLabelSatusehat] = useState([]);
  const { CSRFToken } = useCSRFTokenContext;
  const showAksi = user?.jenisUserId === 4;

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

  // Load validasi data when user opens Validasi tab or when filters change
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
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    setSpinner(true);
    if (!rumahSakit || !rumahSakit.id) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);

    // Reset validation state before fetching new data
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
          tahun: date,
        },
      };
      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktujuh",
        customConfig
      );

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
      setNamaFile(
        "rl37_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setSpinner(false);
      handleClose();

      // Load validasi data after filter is applied
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
    } catch (error) {
      console.log(error);
      setSpinner(false);
    }
  };

  const getRLSatusehat = async (e) => {
    if (e) e.preventDefault();

    setSpinner(true);

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const bulanLaporan = `${periode}-01`;
    const filter = [];
    filter.push("periode: ".concat(periode));
    filter.push("rsId: ".concat(rumahSakit.id));
    setFilterLabelSatusehat(filter);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // First, fetch from Satu Sehat API and save to DB
      try {
        const apiKey = process.env.REACT_APP_SATUSEHAT_API_KEY;
        if (apiKey) {
          headers["X-API-Key"] = apiKey;
        }
        await axios.get(
          "/apisirs6v2/rltigatitiktujuhsatusehat",
          {
            headers,
            params: {
              periode,
              rsId: rumahSakit.id,
            },
          }
        );
      } catch (apiError) {
        console.log("Error fetching from Satu Sehat API:", apiError);
        // Continue even if API fails, try to get local data
      }

      // Then, fetch from local DB
      const localResults = await axios.get(
        "/apisirs6v2/getDataRLTigaTitikTujuhSatusehatLocal",
        {
          headers,
          params: {
            bulan_laporan: bulanLaporan,
            rsId: rumahSakit.id,
          },
        }
      );

      console.log("Local RL 3.7 data:", localResults.data);

      const items = localResults?.data?.data || [];

      if (items.length === 0) {
        setDataRLSatusehat([]);
        toast.info(
          "Data belum tersedia untuk periode ini.",
          {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 5000,
          }
        );
      } else {
        setDataRLSatusehat(items);
        setNamaFileSatusehat(
          `rl37_satusehat_${periode}-01`
        );
      }
    } catch (error) {
      console.error("Error RL 3.7 Satusehat:", error);
      setDataRLSatusehat([]);
      const errMsg =
        error?.response?.data?.message ||
        "Terjadi kesalahan sistem";
      toast.error(errMsg, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
    } finally {
      setSpinner(false);
      setTimeout(() => {
        if (typeof handleClose === "function") {
          handleClose();
        }
      }, 3000);
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
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={activeWadahTab === "satusehat" ? getRLSatusehat : getRL}>
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
              <ToastContainer />
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
              <div className={style.toolbar}>
                <button
                  type="button"
                  className={style.btnPrimary}
                  onClick={handleShow}
                >
                  Filter
                </button>
                <DownloadTableExcel
                  filename={namafileSatusehat}
                  sheet="data RL 37 Satu Sehat"
                  currentTableRef={tableSatusehatRef.current}
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
                  {filterLabelSatusehat
                    .map((value) => {
                      return "filtered by" + value;
                    })
                    .join(", ")}
                </h5>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL37;
