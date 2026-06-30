import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./RL35.module.css";
import { HiSaveAs } from "react-icons/hi";
import { IoArrowBack } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL35 = () => {
  const [tahun, setTahun] = useState("");
  // const [bulan, setBulan] = useState('')
  // const [jenisKegiatan, setJeniskegiatan] = useState('')
  // const [dataRL, setDataRL] = useState([])
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [
    kunjungan_pasien_dalam_kabkota_laki,
    setkunjunganPasienDalamKabkotaLaki,
  ] = useState("");
  const [
    kunjungan_pasien_luar_kabkota_laki,
    setkunjunganPasienLuarKabkotaLaki,
  ] = useState("");
  const [
    kunjungan_pasien_dalam_kabkota_perempuan,
    setkunjunganPasienDalamKabkotaPerempuan,
  ] = useState("");
  const [
    kunjungan_pasien_luar_kabkota_perempuan,
    setkunjunganPasienLuarKabkotaPerempuan,
  ] = useState("");
  const [total_kunjungan, setTotalKunjungan] = useState("");
  // const [no, setNo] = useState('')
  const [nama, setNama] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikLimaById();

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
      getDataRS(decoded.satKerId);
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

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
  };

  const changeHandler = (event, index) => {
    // let newDataRL = [...dataRL]
    const name = event.target.name;
    if (name === "kunjungan_pasien_dalam_kabkota_laki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setkunjunganPasienDalamKabkotaLaki(parseInt(event.target.value));
      setTotalKunjungan(
        parseInt(event.target.value) +
          kunjungan_pasien_luar_kabkota_laki +
          kunjungan_pasien_dalam_kabkota_perempuan +
          kunjungan_pasien_dalam_kabkota_perempuan
      );
    } else if (name === "kunjungan_pasien_luar_kabkota_laki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setkunjunganPasienLuarKabkotaLaki(parseInt(event.target.value));
      setTotalKunjungan(
        parseInt(event.target.value) +
          kunjungan_pasien_dalam_kabkota_laki +
          kunjungan_pasien_dalam_kabkota_perempuan +
          kunjungan_pasien_luar_kabkota_perempuan
      );
    } else if (name === "kunjungan_pasien_dalam_kabkota_perempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setkunjunganPasienDalamKabkotaPerempuan(parseInt(event.target.value));
      setTotalKunjungan(
        parseInt(event.target.value) +
          kunjungan_pasien_dalam_kabkota_laki +
          kunjungan_pasien_luar_kabkota_perempuan +
          kunjungan_pasien_luar_kabkota_laki
      );
    } else if (name === "kunjungan_pasien_luar_kabkota_perempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setkunjunganPasienLuarKabkotaPerempuan(parseInt(event.target.value));
      setTotalKunjungan(
        parseInt(event.target.value) +
          kunjungan_pasien_luar_kabkota_laki +
          kunjungan_pasien_dalam_kabkota_perempuan +
          kunjungan_pasien_dalam_kabkota_laki
      );
    }
  };

  const getDataRS = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      //console.log(response.data)
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };
  const updateDataRLLimaTitikDua = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.patch(
        "/apisirs6v2/rltigatitiklimadetail/" + id,
        {
          kunjungan_pasien_dalam_kabkota_laki,
          kunjungan_pasien_dalam_kabkota_perempuan,
          kunjungan_pasien_luar_kabkota_laki,
          kunjungan_pasien_luar_kabkota_perempuan,
          total_kunjungan,
        },
        customConfig
      );
      setSpinner(false);
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl35");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      setSpinner(false);
    }
  };

  const getRLTigaTitikLimaById = async () => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimadetail/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activity = response?.data?.data?.jenis_kegiatan_rl_tiga_titik_lima;
      setNama(activity?.nama || "Data kegiatan belum tersedia");
      setkunjunganPasienDalamKabkotaLaki(
        response?.data?.data?.kunjungan_pasien_dalam_kabkota_laki ?? 0
      );
      setkunjunganPasienDalamKabkotaPerempuan(
        response?.data?.data?.kunjungan_pasien_dalam_kabkota_perempuan ?? 0
      );
      setkunjunganPasienLuarKabkotaLaki(
        response?.data?.data?.kunjungan_pasien_luar_kabkota_laki ?? 0
      );
      setkunjunganPasienLuarKabkotaPerempuan(
        response?.data?.data?.kunjungan_pasien_luar_kabkota_perempuan ?? 0
      );
      setTotalKunjungan(response?.data?.data?.total_kunjungan ?? 0);
      setTahun(response?.data?.data?.tahun || "");
    } catch (error) {
      console.error(error);
      setNama("Data kegiatan belum tersedia");
    }

    setSpinner(false);
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

  const handleFocus = (event) => {
    event.target.select();
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
    }
  };

  const periodParts = String(tahun || "").split("-");
  const displayYear = periodParts[0] || "";
  const displayMonth = periodParts[1] || "";

  return (
    <div className={`container ${style.pageWrapper}`}>
      <div className={style.pageHeaderRow}>
        <div>
          <h3 className={style.pageTitle}>Ubah Data RL 3.5</h3>
          <p className={style.pageSubtitle}>
            Perbarui data kunjungan pasien untuk kegiatan yang dipilih.
          </p>
        </div>
        <Link to="/rl35" className={style.backLink}>
          <IoArrowBack size={18} />
          <span>Kembali ke daftar RL 3.5</span>
        </Link>
      </div>

      <form onSubmit={updateDataRLLimaTitikDua}>
        <div className="row g-3">
          <div className="col-lg-6">
            <div className={style.sectionCard}>
              <h5 className={style.sectionTitle}>Profil Fasyankes</h5>
              <div className={style.infoGrid}>
                <div className={`form-floating ${style.infoField}`}>
                  <input
                    type="text"
                    className="form-control"
                    id="namaRS"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="namaRS">Nama</label>
                </div>
                <div className={`form-floating ${style.infoField}`}>
                  <input
                    type="text"
                    className="form-control"
                    id="alamatRS"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="alamatRS">Alamat</label>
                </div>
                <div className="row g-2">
                  <div className="col-md-6">
                    <div className={`form-floating ${style.infoField}`}>
                      <input
                        type="text"
                        className="form-control"
                        id="provinsiRS"
                        value={namaPropinsi}
                        disabled={true}
                      />
                      <label htmlFor="provinsiRS">Provinsi</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className={`form-floating ${style.infoField}`}>
                      <input
                        type="text"
                        className="form-control"
                        id="kabKotaRS"
                        value={namaKabKota}
                        disabled={true}
                      />
                      <label htmlFor="kabKotaRS">Kab/Kota</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className={style.sectionCard}>
              <h5 className={style.sectionTitle}>Periode Laporan</h5>
              <div className={style.infoGrid}>
                <div className={`form-floating ${style.infoField}`}>
                  <input
                    name="tahun"
                    type="text"
                    className="form-control"
                    id="tahunLaporan"
                    placeholder="Tahun"
                    value={displayYear}
                    onChange={(e) => changeHandlerSingle(e)}
                    disabled={true}
                  />
                  <label htmlFor="tahunLaporan">Tahun</label>
                </div>
                <div className={`form-floating ${style.infoField}`}>
                  <input
                    name="bulan"
                    type="text"
                    className="form-control"
                    id="bulanLaporan"
                    placeholder="Bulan"
                    value={displayMonth}
                    onChange={(e) => changeHandlerSingle(e)}
                    disabled={true}
                  />
                  <label htmlFor="bulanLaporan">Bulan</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <div className={style.tableCard}>
              <div className={style.tableHeaderBar}>
                <div>
                  <h5 className={style.sectionTitle}>Detail Kunjungan</h5>
                  <p className={style.tableHint}>
                    Isi angka kunjungan sesuai data terbaru yang tersedia.
                  </p>
                </div>
                {spinner && (
                  <div className={style.statusBox}>
                    <Spinner animation="border" size="sm" variant="success" />
                    <span>Sedang memuat</span>
                  </div>
                )}
              </div>

              <div className={style.tableWrapper}>
                <table className={style.formTable}>
                  <thead>
                    <tr>
                      <th rowSpan={2}>Jenis Kegiatan</th>
                      <th colSpan={2}>Kunjungan Pasien Dalam Kota</th>
                      <th colSpan={2}>Kunjungan Pasien Luar Kota</th>
                      <th rowSpan={2}>Total Kunjungan</th>
                    </tr>
                    <tr>
                      <th>Laki-Laki</th>
                      <th>Perempuan</th>
                      <th>Laki-Laki</th>
                      <th>Perempuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr key={id}>
                      <td>
                        <div className={style.nameBadge}>{nama}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          onFocus={handleFocus}
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          name="kunjungan_pasien_dalam_kabkota_laki"
                          className={`form-control ${style.formInput}`}
                          value={kunjungan_pasien_dalam_kabkota_laki}
                          onChange={(e) => changeHandler(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          onFocus={handleFocus}
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          name="kunjungan_pasien_dalam_kabkota_perempuan"
                          className={`form-control ${style.formInput}`}
                          value={kunjungan_pasien_dalam_kabkota_perempuan}
                          onChange={(e) => changeHandler(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          onFocus={handleFocus}
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          name="kunjungan_pasien_luar_kabkota_laki"
                          className={`form-control ${style.formInput}`}
                          value={kunjungan_pasien_luar_kabkota_laki}
                          onChange={(e) => changeHandler(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          onFocus={handleFocus}
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          name="kunjungan_pasien_luar_kabkota_perempuan"
                          className={`form-control ${style.formInput}`}
                          value={kunjungan_pasien_luar_kabkota_perempuan}
                          onChange={(e) => changeHandler(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          onFocus={handleFocus}
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          name="total_kunjungan"
                          className={`form-control ${style.formInput}`}
                          value={total_kunjungan}
                          onChange={(e) => changeHandler(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                          disabled={true}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className={style.actionBar}>
          <ToastContainer />
          <button
            type="submit"
            disabled={buttonStatus || spinner}
            className={style.actionButton}
          >
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL35;
