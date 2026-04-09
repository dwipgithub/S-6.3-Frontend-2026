import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormUbahRL319.module.css";
import { HiSaveAs } from "react-icons/hi";
// import Table from "react-bootstrap/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { IoArrowBack } from "react-icons/io5";

export const FormUbahRL319 = () => {
  const navigate = useNavigate();
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  // Data RS
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  // Cred
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  // Data RL
  const [no, setNo] = useState("");
  const [nama, setNama] = useState("");
  const [ranapPasienKeluar, setRanapPasienKeluar] = useState("");
  const [ranapLamaDirawat, setRanapLamaDirawat] = useState("");
  const [jumlahPasienRajal, setJumlahPasienRajal] = useState("");
  const [rajalLab, setRajalLab] = useState("");
  const [rajalRadiologi, setRajalRadiologi] = useState("");
  const [rajalLainLain, setRajalLainLain] = useState("");
  const [dataParentRL, setDataParentRL] = useState([]);
  const [parentId, setParentId] = useState("");
  const { id } = useParams();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikSembilanBelasById();
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
    },
  );

  const getDataRS = async (id) => {
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
    } catch (error) {
      console.log(error);
    }
  };

  const updateDataRLTigaTitikSembilanBelas = async (e) => {
    e.preventDefault();
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      const result = await axiosJWT.patch(
        "/apisirs6v2/rltigatitiksembilanbelasdetail/" + id,
        {
          ranap_pasien_keluar: parseInt(ranapPasienKeluar),
          ranap_lama_dirawat: parseInt(ranapLamaDirawat),
          jumlah_pasien_rajal: parseInt(jumlahPasienRajal),
          rajal_lab: parseInt(rajalLab),
          rajal_radiologi: parseInt(rajalRadiologi),
          rajal_lain_lain: parseInt(rajalLainLain),
        },
        customConfig,
      );

      if (result.status === 201) {
        toast("Data Berhasil Diperbaharui", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl319");
        }, 2000);
      } else {
        toast(`Data Gagal Diperbaharui, ${result.data.message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } catch (error) {
      console.log(error);
      toast("Data Gagal Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const getParent = async (filter) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelasdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const newResponse = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelas",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: tahun,
        },
      },
    );

    let dataRLTigaTitikSembilanBelasDetails = [];
    const rlTigaTitikSembilanBelasDetails = newResponse.data.data.map(
      (value) => {
        return value.rl_tiga_titik_sembilan_belas_details;
      },
    );

    rlTigaTitikSembilanBelasDetails.forEach((element) => {
      element.forEach((value) => {
        dataRLTigaTitikSembilanBelasDetails.push(value);
      });
    });

    const parent = dataRLTigaTitikSembilanBelasDetails
      .filter((value) => {
        return value.golongan_obat_rl_tiga_titik_sembilan_belas.no == filter;
      })
      .map((value) => {
        return {
          id: value.id,
          data: {
            ranap_pasien_keluar:
              value.ranap_pasien_keluar -
              response.data.data.ranap_pasien_keluar,
            ranap_lama_dirawat:
              value.ranap_lama_dirawat - response.data.data.ranap_lama_dirawat,
            jumlah_pasien_rajal:
              value.jumlah_pasien_rajal -
              response.data.data.jumlah_pasien_rajal,
            rajal_lab: value.rajal_lab - response.data.data.rajal_lab,
            rajal_radiologi:
              value.rajal_radiologi - response.data.data.rajal_radiologi,
            rajal_lain_lain:
              value.rajal_lain_lain - response.data.data.rajal_lain_lain,
          },
        };
      });

    return parent[0];
  };

  const getRLTigaTitikSembilanBelasById = async () => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelasdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setTahun(response.data.data.tahun);
    setNo(response.data.data.golongan_obat_rl_tiga_titik_sembilan_belas.no);
    setNama(response.data.data.golongan_obat_rl_tiga_titik_sembilan_belas.nama);
    setRanapPasienKeluar(response.data.data.ranap_pasien_keluar);
    setRanapLamaDirawat(response.data.data.ranap_lama_dirawat);
    setJumlahPasienRajal(response.data.data.jumlah_pasien_rajal);
    setRajalLab(response.data.data.rajal_lab);
    setRajalRadiologi(response.data.data.rajal_radiologi);
    setRajalLainLain(response.data.data.rajal_lain_lain);
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

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength,
      );
    }
  };

  const changeHandler = (event) => {
    const name = event.target.name;
    if (name === "ranap_pasien_keluar") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRanapPasienKeluar(event.target.value);
    } else if (name === "ranap_lama_dirawat") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      // if (event.target.value > ranapPasienKeluar) {
      //   toast(
      //     "Jumlah Lama Dirawat harus lebih kecil dari Jumlah Pasien Keluar",
      //     {
      //       position: toast.POSITION.TOP_RIGHT,
      //     }
      //   );
      // } else {
      //   setRanapLamaDirawat(event.target.value);
      // }
      setRanapLamaDirawat(event.target.value);
    } else if (name === "rajal_lab") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRajalLab(event.target.value);
      let jumlah_pasien_rajal =
        parseInt(rajalRadiologi) +
        parseInt(event.target.value) +
        parseInt(rajalLainLain);
      setJumlahPasienRajal(jumlah_pasien_rajal);
    } else if (name === "rajal_radiologi") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRajalRadiologi(event.target.value);
      let jumlah_pasien_rajal =
        parseInt(rajalLab) +
        parseInt(event.target.value) +
        parseInt(rajalLainLain);
      setJumlahPasienRajal(jumlah_pasien_rajal);
    } else if (name === "rajal_lain_lain") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRajalLainLain(event.target.value);
      let jumlah_pasien_rajal =
        parseInt(rajalRadiologi) +
        parseInt(event.target.value) +
        parseInt(rajalLab);
      setJumlahPasienRajal(jumlah_pasien_rajal);
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <form onSubmit={updateDataRLTigaTitikSembilanBelas}>
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
                    id="nama"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="nama">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="alamat"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="alamat">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="provinsi"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="provinsi">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="kabkota"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="kabkota">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>

                <div className="form-floating" style={{ width: "100%" }}>
                  <select
                    name="tahun"
                    className="form-select"
                    id="tahun"
                    value={tahun}
                    disabled
                  >
                    <option value="">{tahun}</option>
                  </select>

                  <label htmlFor="tahun">Tahun</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-md-12">
            <div className={style.headerAction}>
              <Link to="/rl319">
                <button type="button" className={style.btnPrimary}>
                  <IoArrowBack />
                </button>
              </Link>
              <span className={style.backText}>
                <h4 className={style.pageHeader}>RL 3.19 - Cara Bayar</h4>
              </span>
            </div>
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table responsive className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "4%" }}
                      rowSpan={2}
                    >
                      No. Cara Bayar
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "15%" }}
                      rowSpan={2}
                    >
                      Cara Pembayaran
                    </th>
                    <th colSpan={2}>Pasien Rawat Inap</th>
                    <th
                      style={{ width: "5%", verticalAlign: "middle" }}
                      rowSpan={2}
                    >
                      Jumlah Pasien Rawat Jalan
                    </th>
                    <th colSpan={3}>Jumlah Pasien Rawat Jalan</th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th style={{ width: "5%" }}>Jumlah Pasien Keluar</th>
                    <th style={{ width: "5%" }}>Jumlah Lama Dirawat</th>
                    <th style={{ width: "5%" }}>Laboratorium</th>
                    <th style={{ width: "5%" }}>Radiologi</th>
                    <th style={{ width: "5%" }}>Lain-lain</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className={style["sticky-column"]}
                      style={{ textAlign: "center" }}
                    >
                      {/* <input
                        name="no"
                        type="text"
                        className="form-control"
                        id="no"
                        placeholder="No"
                        value={no}
                        disabled={true}
                      /> */}
                      {no}
                    </td>
                    <td className={style["sticky-column"]}>
                      {/* <input
                        name="nama"
                        type="text"
                        className="form-control"
                        id="kegiatan"
                        placeholder="Kegiatan"
                        value={nama}
                        disabled={true}
                      /> */}

                      {nama}
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={ranapPasienKeluar}
                          onChange={(e) => changeHandler(e)}
                          name="ranap_pasien_keluar"
                          placeholder="RanapPasienKeluar"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={ranapLamaDirawat}
                          onChange={(e) => changeHandler(e)}
                          name="ranap_lama_dirawat"
                          placeholder="RanapLamaDirawat"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={jumlahPasienRajal}
                          placeholder="JumlahPasienRajal"
                          readOnly={true}
                          disabled={true}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={rajalLab}
                          onChange={(e) => changeHandler(e)}
                          name="rajal_lab"
                          placeholder="RajalLab"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={rajalRadiologi}
                          onChange={(e) => changeHandler(e)}
                          name="rajal_radiologi"
                          placeholder="RajalRadiologi"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          className="form-control"
                          value={rajalLainLain}
                          onChange={(e) => changeHandler(e)}
                          name="rajal_lain_lain"
                          placeholder="RajalLainLain"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button type="submit" className={style.btnPrimary}>
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL319;
