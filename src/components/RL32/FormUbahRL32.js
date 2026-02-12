import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormUbahRL32.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormUbahRL32 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [jenisPelayanan, setJenisPelayanan] = useState("");
  const [pasienAwalBulan, setPasienAwalBulan] = useState(0);
  const [pasienMasuk, setPasienMasuk] = useState(0);
  const [pasienPindahan, setPasienPindahan] = useState(0);
  const [pasienDipindahkan, setPasienDipindahkan] = useState(0);
  const [pasienKeluarHidup, setPasienKeluarHidup] = useState(0);
  const [pasienKeluarMatiKurangDari48Jam, setPasienKeluarMatiKurangDari48Jam] =
    useState(0);
  const [
    pasienKeluarMatiLebihDariAtauSamaDengan48Jam,
    setPasienKeluarMatiLebihDariAtauSamaDengan48Jam,
  ] = useState(0);
  const [
    pasienWanitaKeluarMatiKurangDari48Jam,
    setPasienWanitaKeluarMatiKurangDari48Jam,
  ] = useState(0);
  const [
    pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
    setPasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
  ] = useState(0);
  const [jumlahLamaDirawat, setJumlahLamaDirawat] = useState(0);
  const [pasienAkhirBulan, setPasienAkhirBulan] = useState(0);
  const [jumlahHariPerawatan, setJumlahHariPerawatan] = useState(0);
  const [rincianHariPerawatanKelasVVIP, setRincianHariPerawatanKelasVVIP] =
    useState(0);
  const [rincianHariPerawatanKelasVIP, setRincianHariPerawatanKelasVIP] =
    useState(0);
  const [rincianHariPerawatanKelas1, setRincianHariPerawatanKelas1] =
    useState(0);
  const [rincianHariPerawatanKelas2, setRincianHariPerawatanKelas2] =
    useState(0);
  const [rincianHariPerawatanKelas3, setRincianHariPerawatanKelas3] =
    useState(0);
  const [rincianHariPerawatanKelasKhusus, setRincianHariPerawatanKelasKhusus] =
    useState(0);
  const [
    jumlahAlokasiTempatTidurAwalBulan,
    setJumlahAlokasiTempatTidurAwalBulan,
  ] = useState(0);
  const [token, setToken] = useState(0);
  const [expire, setExpire] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();
  const [buttonStatus, setButtonStatus] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    showRLTigaTitikDua(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setExpire(decoded.exp);
      getRumahSakit(decoded.satKerId);
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
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const getRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };

  const showRLTigaTitikDua = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rltigatitikdua/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        response.data.data.pasien_awal_bulan +
          response.data.data.pasien_masuk +
          response.data.data.pasien_pindahan -
          (response.data.data.pasien_dipindahkan +
            response.data.data.pasien_keluar_hidup +
            response.data.data.pasien_keluar_mati_kurang_dari_48_jam +
            response.data.data
              .pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam)
      );

      setJenisPelayanan(response.data.data.nama_jenis_pelayanan);
      setPasienAwalBulan(response.data.data.pasien_awal_bulan);
      setPasienMasuk(response.data.data.pasien_masuk);
      setPasienPindahan(response.data.data.pasien_pindahan);
      setPasienDipindahkan(response.data.data.pasien_dipindahkan);
      setPasienKeluarHidup(response.data.data.pasien_keluar_hidup);
      setPasienKeluarMatiKurangDari48Jam(
        response.data.data.pasien_keluar_mati_kurang_dari_48_jam
      );
      setPasienKeluarMatiLebihDariAtauSamaDengan48Jam(
        response.data.data.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam
      );
      setPasienWanitaKeluarMatiKurangDari48Jam(
        response.data.data.pasien_wanita_keluar_mati_kurang_dari_48_jam
      );
      setPasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam(
        response.data.data
          .pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam
      );
      setJumlahLamaDirawat(response.data.data.jumlah_lama_dirawat);
      setPasienAkhirBulan(
        response.data.data.pasien_awal_bulan +
          response.data.data.pasien_masuk +
          response.data.data.pasien_pindahan -
          (response.data.data.pasien_dipindahkan +
            response.data.data.pasien_keluar_hidup +
            response.data.data.pasien_keluar_mati_kurang_dari_48_jam +
            response.data.data
              .pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam)
      );
      setJumlahHariPerawatan(
        response.data.data.rincian_hari_perawatan_kelas_VVIP +
          response.data.data.rincian_hari_perawatan_kelas_VIP +
          response.data.data.rincian_hari_perawatan_kelas_1 +
          response.data.data.rincian_hari_perawatan_kelas_2 +
          response.data.data.rincian_hari_perawatan_kelas_3 +
          response.data.data.rincian_hari_perawatan_kelas_khusus
      );
      setRincianHariPerawatanKelasVVIP(
        response.data.data.rincian_hari_perawatan_kelas_VVIP
      );
      setRincianHariPerawatanKelasVIP(
        response.data.data.rincian_hari_perawatan_kelas_VIP
      );
      setRincianHariPerawatanKelas1(
        response.data.data.rincian_hari_perawatan_kelas_1
      );
      setRincianHariPerawatanKelas2(
        response.data.data.rincian_hari_perawatan_kelas_2
      );
      setRincianHariPerawatanKelas3(
        response.data.data.rincian_hari_perawatan_kelas_3
      );
      setRincianHariPerawatanKelasKhusus(
        response.data.data.rincian_hari_perawatan_kelas_khusus
      );
      setJumlahAlokasiTempatTidurAwalBulan(
        response.data.data.jumlah_alokasi_tempat_tidur_awal_bulan
      );
      // setPasienAkhirBulan(hitungPasienAkhirBulan())
      // setJumlahHariPerawatan(hitungJumlahHariPerawatan())
    } catch (error) {
      console.log(error);
    }
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandler = (event, index) => {
    const targetName = event.target.name;
    switch (targetName) {
      case "pasienAwalBulan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienAwalBulan(event.target.value);
        setPasienAkhirBulan(
          parseInt(event.target.value) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienMasuk":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienMasuk(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(event.target.value) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienPindahan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienPindahan(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(event.target.value) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienDipindahkan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienDipindahkan(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(event.target.value) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienKeluarHidup":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienKeluarHidup(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(event.target.value) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienKeluarMatiKurangDari48Jam":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienKeluarMatiKurangDari48Jam(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(event.target.value) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienKeluarMatiLebihDariAtauSamaDengan48Jam":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienKeluarMatiLebihDariAtauSamaDengan48Jam(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(event.target.value))
        );
        break;
      case "pasienWanitaKeluarMatiKurangDari48Jam":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienWanitaKeluarMatiKurangDari48Jam(event.target.value);
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(event.target.value) +
              parseInt(pasienKeluarMatiLebihDariAtauSamaDengan48Jam))
        );
        break;
      case "pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam(
          event.target.value
        );
        setPasienAkhirBulan(
          parseInt(pasienAwalBulan) +
            parseInt(pasienMasuk) +
            parseInt(pasienPindahan) -
            (parseInt(pasienDipindahkan) +
              parseInt(pasienKeluarHidup) +
              parseInt(pasienKeluarMatiKurangDari48Jam) +
              parseInt(event.target.value))
        );
        break;
      case "jumlahLamaDirawat":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setJumlahLamaDirawat(event.target.value);
        break;
      case "pasienAkhirBulan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setPasienAkhirBulan(event.target.value);
        break;
      case "jumlahHariPerawatan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setJumlahHariPerawatan(event.target.value);
        break;
      case "rincianHariPerawatanKelasVVIP":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelasVVIP(event.target.value);
        setJumlahHariPerawatan(
          parseInt(event.target.value) +
            parseInt(rincianHariPerawatanKelasVIP) +
            parseInt(rincianHariPerawatanKelas1) +
            parseInt(rincianHariPerawatanKelas2) +
            parseInt(rincianHariPerawatanKelas3) +
            parseInt(rincianHariPerawatanKelasKhusus)
        );
        break;
      case "rincianHariPerawatanKelasVIP":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelasVIP(event.target.value);
        setJumlahHariPerawatan(
          parseInt(rincianHariPerawatanKelasVVIP) +
            parseInt(event.target.value) +
            parseInt(rincianHariPerawatanKelas1) +
            parseInt(rincianHariPerawatanKelas2) +
            parseInt(rincianHariPerawatanKelas3) +
            parseInt(rincianHariPerawatanKelasKhusus)
        );
        break;
      case "rincianHariPerawatanKelas1":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelas1(event.target.value);
        setJumlahHariPerawatan(
          parseInt(rincianHariPerawatanKelasVVIP) +
            parseInt(rincianHariPerawatanKelasVIP) +
            parseInt(event.target.value) +
            parseInt(rincianHariPerawatanKelas2) +
            parseInt(rincianHariPerawatanKelas3) +
            parseInt(rincianHariPerawatanKelasKhusus)
        );
        break;
      case "rincianHariPerawatanKelas2":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelas2(event.target.value);
        setJumlahHariPerawatan(
          parseInt(rincianHariPerawatanKelasVVIP) +
            parseInt(rincianHariPerawatanKelasVIP) +
            parseInt(rincianHariPerawatanKelas1) +
            parseInt(event.target.value) +
            parseInt(rincianHariPerawatanKelas3) +
            parseInt(rincianHariPerawatanKelasKhusus)
        );
        break;
      case "rincianHariPerawatanKelas3":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelas3(event.target.value);
        setJumlahHariPerawatan(
          parseInt(rincianHariPerawatanKelasVVIP) +
            parseInt(rincianHariPerawatanKelasVIP) +
            parseInt(rincianHariPerawatanKelas1) +
            parseInt(rincianHariPerawatanKelas2) +
            parseInt(event.target.value) +
            parseInt(rincianHariPerawatanKelasKhusus)
        );
        break;
      case "rincianHariPerawatanKelasKhusus":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRincianHariPerawatanKelasKhusus(event.target.value);
        setJumlahHariPerawatan(
          parseInt(rincianHariPerawatanKelasVVIP) +
            parseInt(rincianHariPerawatanKelasVIP) +
            parseInt(rincianHariPerawatanKelas1) +
            parseInt(rincianHariPerawatanKelas2) +
            parseInt(rincianHariPerawatanKelas3) +
            parseInt(event.target.value)
        );
        break;
      case "jumlahAlokasiTempatTidurAwalBulan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setJumlahAlokasiTempatTidurAwalBulan(event.target.value);
        break;
      default:
        break;
    }
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setButtonStatus(true);
    if (pasienAkhirBulan < 0) {
      toast(`jumlah pasien akhir tahun tidak boleh lebih kecil dari 0`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      return;
    }
    try {
      const data = {
        pasienAwalBulan: pasienAwalBulan,
        pasienMasuk: pasienMasuk,
        pasienPindahan: pasienPindahan,
        pasienDipindahkan: pasienDipindahkan,
        pasienKeluarHidup: pasienKeluarHidup,
        pasienKeluarMatiKurangDari48Jam: pasienKeluarMatiKurangDari48Jam,
        pasienKeluarMatiLebihDariAtauSamaDengan48Jam:
          pasienKeluarMatiLebihDariAtauSamaDengan48Jam,
        pasienWanitaKeluarMatiKurangDari48Jam:
          pasienWanitaKeluarMatiKurangDari48Jam,
        pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam:
          pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
        jumlahLamaDirawat: jumlahLamaDirawat,
        rincianHariPerawatanKelasVVIP: rincianHariPerawatanKelasVVIP,
        rincianHariPerawatanKelasVIP: rincianHariPerawatanKelasVIP,
        rincianHariPerawatanKelas1: rincianHariPerawatanKelas1,
        rincianHariPerawatanKelas2: rincianHariPerawatanKelas2,
        rincianHariPerawatanKelas3: rincianHariPerawatanKelas3,
        rincianHariPerawatanKelasKhusus: rincianHariPerawatanKelasKhusus,
        jumlahAlokasiTempatTidurAwalBulan: jumlahAlokasiTempatTidurAwalBulan,
      };

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axiosJWT.patch(
        "/apisirs6v2/rltigatitikdua/" + id,
        data,
        customConfig
      );

      toast("Data Berhasil Diubah", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl32");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });

      setButtonStatus(false);
    }
  };

  const preventPasteNegative = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = parseFloat(clipboardData.getData("text"));

    if (pastedData < 0) {
      e.preventDefault();
    }
  };

  const preventMinus = (e) => {
    if (e.code === "Minus") {
      e.preventDefault();
    }
  };

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <h2>RL. 3.2</h2>
      <form onSubmit={Simpan}>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Profile Fasyankes</h5>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaRS}
                    disabled={true}
                  />
                  <label>Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label>Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label>Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label>Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl32/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              {/* <IoArrowBack size={30} style={{color:"gray",cursor: "pointer"}}/> */}
              &lt;
            </Link>

            <span style={{ color: "gray" }}>Kembali RL 3.2 Rawat Inap</span>
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table responsive className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "2%" }}
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "8%" }}
                    >
                      Jenis Pelayanan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Awal Bulan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Masuk
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Pindahan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Dipindahkan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Keluar Hidup
                    </th>
                    <th colSpan="2" style={{ width: "8%" }}>
                      Pasien Pria Keluar Mati
                    </th>
                    <th colSpan="2" style={{ width: "8%" }}>
                      Pasien Wanita Keluar Mati
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Lama Dirawat
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Akhir Bulan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Hari Perawatan
                    </th>
                    <th colSpan="6" style={{ width: "20%" }}>
                      Rincian Hari Perawatan Per Kelas
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Alokasi TT Awal Bulan
                    </th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th style={{ width: "4%" }}>{"< 48 jam"}</th>
                    <th style={{ width: "4%" }}>{">= 48 jam"}</th>
                    <th style={{ width: "4%" }}>{"< 48 jam"}</th>
                    <th style={{ width: "4%" }}>{">= 48 jam"}</th>
                    <th style={{ width: "4%" }}>VVIP</th>
                    <th style={{ width: "4%" }}>VIP</th>
                    <th style={{ width: "4%" }}>1</th>
                    <th style={{ width: "4%" }}>2</th>
                    <th style={{ width: "4%" }}>3</th>
                    <th style={{ width: "4%" }}>Khusus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="id"
                        className="form-control"
                        value="1"
                        disabled={true}
                      />
                    </td>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="jenisPelayanan"
                        className="form-control"
                        value={jenisPelayanan}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienAwalBulan"
                        className="form-control"
                        value={pasienAwalBulan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienMasuk"
                        className="form-control"
                        value={pasienMasuk}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienPindahan"
                        className="form-control"
                        value={pasienPindahan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienDipindahkan"
                        className="form-control"
                        value={pasienDipindahkan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienKeluarHidup"
                        className="form-control"
                        value={pasienKeluarHidup}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienKeluarMatiKurangDari48Jam"
                        className="form-control"
                        value={pasienKeluarMatiKurangDari48Jam}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienKeluarMatiLebihDariAtauSamaDengan48Jam"
                        className="form-control"
                        value={pasienKeluarMatiLebihDariAtauSamaDengan48Jam}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienWanitaKeluarMatiKurangDari48Jam"
                        className="form-control"
                        value={pasienWanitaKeluarMatiKurangDari48Jam}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam"
                        className="form-control"
                        value={
                          pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam
                        }
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlahLamaDirawat"
                        className="form-control"
                        value={jumlahLamaDirawat}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="pasienAkhirBulan"
                        className="form-control"
                        value={pasienAkhirBulan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlahHariPerawatan"
                        className="form-control"
                        value={jumlahHariPerawatan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelasVVIP"
                        className="form-control"
                        value={rincianHariPerawatanKelasVVIP}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelasVIP"
                        className="form-control"
                        value={rincianHariPerawatanKelasVIP}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelas1"
                        className="form-control"
                        value={rincianHariPerawatanKelas1}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelas2"
                        className="form-control"
                        value={rincianHariPerawatanKelas2}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelas3"
                        className="form-control"
                        value={rincianHariPerawatanKelas3}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="rincianHariPerawatanKelasKhusus"
                        className="form-control"
                        value={rincianHariPerawatanKelasKhusus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlahAlokasiTempatTidurAwalBulan"
                        className="form-control"
                        value={jumlahAlokasiTempatTidurAwalBulan}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                        disabled={false}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button
            type="submit"
            className="btn btn-outline-success"
            disabled={buttonStatus}
          >
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL32;
