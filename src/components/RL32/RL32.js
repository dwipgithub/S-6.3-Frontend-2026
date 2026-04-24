import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL32.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from 'react-bootstrap/Table'
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

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
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

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
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      if (decoded.jenisUserId === 4) {
      showRumahSakit(decoded.satKerId);
      };
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
        const response = await axios.get("/apisirs6v2/token");
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
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

  const getRL = async (e) => {
    e.preventDefault();
    if (!rumahSakit) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
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
        "/apisirs6v2/rltigatitikdua",
        customConfig
      );

      const rlTigaTitikDuaDetails = results.data.data.map((value) => {
        return value;
      });

      setDataRL(rlTigaTitikDuaDetails);
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
            rsId: rumahSakit.id,
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
          rsId: rumahSakit.id,
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

  function handleDownloadExcel() {
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
      "Hari Perawatan VVIP",
      "Hari Perawatan VIP",
      "Hari Perawatan 1",
      "Hari Perawatan 2",
      "Hari Perawatan 3",
      "Hari Perawatan Khusus",
      "Jumlah Alokasi TT Awal Bulan",
    ];

    console.log(dataRL);

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.nama_jenis_pelayanan,
        value.pasien_awal_bulan,
        value.pasien_masuk,
        value.pasien_pindahan,
        value.pasien_dipindahkan,
        value.pasien_keluar_hidup,
        value.pasien_keluar_mati_kurang_dari_48_jam,
        value.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam,
        value.pasien_wanita_keluar_mati_kurang_dari_48_jam,
        value.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam,
        value.jumlah_lama_dirawat,
        hitungPasienAkhirBulan(index),
        hitungJumlahHariPerawatan(index),
        value.rincian_hari_perawatan_kelas_VVIP,
        value.rincian_hari_perawatan_kelas_VIP,
        value.rincian_hari_perawatan_kelas_1,
        value.rincian_hari_perawatan_kelas_2,
        value.rincian_hari_perawatan_kelas_3,
        value.rincian_hari_perawatan_kelas_khusus,
        value.jumlah_alokasi_tempat_tidur_awal_bulan
      ];
      return data;
    });

    console.log(body)

    downloadExcel({
      fileName: "react-export-table-to-excel -> downloadExcel method",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab);
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

        <form onSubmit={getRL}>
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
                        className="form-select"
                        value={rumahSakit?.id || 0}
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
                        className="form-select"
                        value={rumahSakit?.id || 0}
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
                <option value={0}>Pilih</option>
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
          <h4 className={style.pageHeader}>RL. 3.2 Rawat Inap</h4>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl32/tambah/`}
                className={style.btnPrimary}
                style={{ textDecoration: "none" }}
              >
              Tambah
              </Link>
            ) : null}
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
                  

                    <table className={style.table}>
                      <thead className={style.thead}>
                        <tr>
                          <th rowSpan="2">No.</th>

                          {/* ✅ kolom SELALU ADA */}
                          <th rowSpan="2">Aksi</th>

                          <th rowSpan="2">Jenis Pelayanan</th>
                          <th rowSpan="2">Pasien Awal Bulan</th>
                          <th rowSpan="2">Pasien Masuk</th>
                          <th rowSpan="2">Pasien Pindahan</th>
                          <th rowSpan="2">Pasien Dipindahkan</th>
                          <th rowSpan="2">Pasien Keluar Hidup</th>

                          <th colSpan="2">Pasien Pria Keluar Mati</th>
                          <th colSpan="2">Pasien Wanita Keluar Mati</th>

                          <th rowSpan="2">Jumlah Lama Dirawat</th>
                          <th rowSpan="2">Pasien Akhir Bulan</th>
                          <th rowSpan="2">Jumlah Hari Perawatan</th>

                          <th colSpan="6">Rincian Hari Perawatan</th>
                          <th rowSpan="2">TT Awal</th>
                        </tr>

                        <tr>
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

                            {/* ✅ kolom tetap ada */}
                            <td>
                              {isAksi && (
                                <div style={{ display: "flex" }}>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => deleteConfirmation(value.id)}
                                  >
                                    Hapus
                                  </button>

                                  <Link
                                    to={`/rl32/ubah/${value.id}`}
                                    className="btn btn-warning"
                                  >
                                    Ubah
                                  </Link>
                                </div>
                              )}
                            </td>

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
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px" }}><strong>
                                    Status
                                    </strong>
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
                                    <div style={{ width: "90px", textAlign: "left", paddingRight: "8px" }}><strong>
                                      Catatan</strong>
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
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px" }}><strong>
                                    Dibuat</strong>
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
      </div>
    </div>
  );
};

export default RL32;
