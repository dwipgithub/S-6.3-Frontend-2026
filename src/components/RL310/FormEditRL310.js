import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormUbahRL10.module.css";
import { HiSaveAs } from "react-icons/hi";
import Table from "react-bootstrap/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormEditRL310 = () => {
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
  const [rmDiterimaRs, setRmDiterimaRs] = useState(0);
  const [rmDiterimaPuskesmas, setRmDiterimaPuskesmas] = useState(0);
  const [rmDiterimaFaskesLain, setRmDiterimaFaskesLain] = useState(0);
  const [rmDiterimaTotal, setRmDiterimaTotal] = useState(0);
  const [rmDikembalikanRs, setRmDikembalikanRs] = useState(0);
  const [rmDikembalikanPuskesmas, setRmDikembalikanPuskesmas] = useState(0);
  const [rmDikembalikanFaskesLain, setRmDikembalikanFaskesLain] = useState(0);
  const [rmDikembalikanTotal, setRmDikembalikanTotal] = useState(0);
  const [keluarPasienRujukan, setKeluarPasienRujukan] = useState(0);
  const [keluarPasienDatangSendiri, setKeluarPasienDatangSendiri] = useState(0);
  const [keluarPasienTotal, setKeluarPasienTotal] = useState(0);
  const [keluarDiterimaKembali, setKeluarDiterimaKembali] = useState(0);
  const { id } = useParams();
  const [no, setNo] = useState("");
  const [nama, setNama] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikSepuluhById();
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
    } catch (error) {}
  };

  const updateDataRLTigaTitikTiga = async (e) => {
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
        "/apisirs6v2/rltigatitiksepuluhdetail/" + id,
        {
          rm_diterima_puskesmas: parseInt(rmDiterimaPuskesmas),
          rm_diterima_rs: parseInt(rmDiterimaRs),
          rm_diterima_faskes_lain: parseInt(rmDiterimaFaskesLain),
          rm_diterima_total_rm:
            parseInt(rmDiterimaFaskesLain) +
            parseInt(rmDiterimaPuskesmas) +
            parseInt(rmDiterimaRs),
          rm_dikembalikan_puskesmas: parseInt(rmDikembalikanPuskesmas),
          rm_dikembalikan_rs: parseInt(rmDikembalikanRs),
          rm_dikembalikan_faskes_lain: parseInt(rmDikembalikanFaskesLain),
          rm_dikembalikan_total_rm:
            parseInt(rmDikembalikanFaskesLain) +
            parseInt(rmDikembalikanPuskesmas) +
            parseInt(rmDikembalikanRs),
          keluar_pasien_rujukan: parseInt(keluarPasienRujukan),
          keluar_pasien_datang_sendiri: parseInt(keluarPasienDatangSendiri),
          keluar_total_keluar:
            parseInt(keluarPasienDatangSendiri) + parseInt(keluarPasienRujukan),
          keluar_diterima_kembali: parseInt(keluarDiterimaKembali),
        },
        customConfig
      );

      if (result.status === 200) {
        toast("Data Berhasil Diperbaharui", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl310");
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

  const getRLTigaTitikSepuluhById = async () => {
    // const response = await axios.get(`http://localhost:5001/rltigatitiktigadetail/${id}`);
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksepuluhdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setTahun(response.data.data.tahun);
    setBulan(response.data.data.bulan);
    setNo(response.data.data.jenis_spesialis_rl_tiga_titik_sepuluh.no);
    setNama(response.data.data.jenis_spesialis_rl_tiga_titik_sepuluh.nama);
    setRmDiterimaRs(response.data.data.rm_diterima_rs);
    setRmDiterimaPuskesmas(response.data.data.rm_diterima_puskesmas);
    setRmDiterimaFaskesLain(response.data.data.rm_diterima_faskes_lain);
    setRmDiterimaTotal(response.data.data.rm_diterima_total_rm);
    setRmDikembalikanRs(response.data.data.rm_dikembalikan_rs);
    setRmDikembalikanPuskesmas(response.data.data.rm_dikembalikan_puskesmas);
    setRmDikembalikanFaskesLain(response.data.data.rm_dikembalikan_faskes_lain);
    setRmDikembalikanTotal(response.data.data.rm_dikembalikan_total_rm);
    setKeluarPasienRujukan(response.data.data.keluar_pasien_rujukan);
    setKeluarPasienDatangSendiri(
      response.data.data.keluar_pasien_datang_sendiri
    );
    setKeluarPasienTotal(response.data.data.keluar_total_keluar);
    setKeluarDiterimaKembali(response.data.data.keluar_diterima_kembali);
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h2>RL. 3.10</h2>
      <form onSubmit={updateDataRLTigaTitikTiga}>
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
        </div>

        <div className="col-md-12">
          <Link
            to={`/rl310/`}
            className="btn btn-info"
            style={{
              fontSize: "18px",
              backgroundColor: "#779D9E",
              color: "#FFFFFF",
            }}
          >
            {/* <IoArrowBack size={30} style={{color:"gray",cursor: "pointer"}}/><span style={{color: "gray"}}></span> */}
            &lt;
          </Link>
          <span style={{ color: "gray" }}>RL 3.10 Pelayanan Khusus</span>
        </div>

        <div className="row mt-3">
          <div className="col-md-12">
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table responsive className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      style={{ width: "4%" }}
                      rowSpan={3}
                      className={style["sticky-header"]}
                    >
                      No Spesialisasi
                    </th>
                    <th
                      style={{ width: "20%" }}
                      rowSpan={3}
                      className={style["sticky-header"]}
                    >
                      Jenis Spesialisasi
                    </th>
                    <th colSpan={8}>Rujukan Masuk</th>
                    <th
                      colSpan={4}
                      rowSpan={2}
                      style={{ verticalAlign: "middle" }}
                    >
                      Dirujuk Keluar
                    </th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th colSpan={4}>Diterima Dari</th>
                    <th colSpan={4}>Dikembalikan Ke</th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th>Puskesmas</th>
                    <th>RS Lain</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk</th>
                    <th>Puskesmas</th>
                    <th>RS Asal</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk Dikembalikan</th>
                    <th>Pasien Rujukn</th>
                    <th>Pasien Datang Sendiri</th>
                    <th>Total Dirujuk Keluar</th>
                    <th>Diterima Kembali</th>
                  </tr>
                </thead>
                <tbody>
                  <tr key={id}>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="no"
                        className="form-control"
                        value={no}
                        disabled={true}
                      />
                    </td>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="jenisKegiatan"
                        className="form-control"
                        value={nama}
                        disabled={true}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_diterima_puskesmas"
                        className="form-control"
                        value={rmDiterimaPuskesmas}
                        onChange={(e) => setRmDiterimaPuskesmas(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_diterima_rs"
                        className="form-control"
                        value={rmDiterimaRs}
                        onChange={(e) => setRmDiterimaRs(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_diterima_faskes_lain"
                        className="form-control"
                        value={rmDiterimaFaskesLain}
                        onChange={(e) =>
                          setRmDiterimaFaskesLain(e.target.value)
                        }
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_diterima_total_rm"
                        className="form-control"
                        value={
                          parseInt(rmDiterimaFaskesLain) +
                          parseInt(rmDiterimaPuskesmas) +
                          parseInt(rmDiterimaRs)
                        }
                        onChange={(e) => setRmDiterimaTotal(e.target.value)}
                        readOnly={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_dikembalikan_puskesmas"
                        className="form-control"
                        value={rmDikembalikanPuskesmas}
                        onChange={(e) =>
                          setRmDikembalikanPuskesmas(e.target.value)
                        }
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_dikembalikan_rs"
                        className="form-control"
                        value={rmDikembalikanRs}
                        onChange={(e) => setRmDikembalikanRs(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_dikembalikan_faskes_lain"
                        className="form-control"
                        value={rmDikembalikanFaskesLain}
                        onChange={(e) =>
                          setRmDikembalikanFaskesLain(e.target.value)
                        }
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="rm_dikembalikan_total_rm"
                        className="form-control"
                        value={
                          parseInt(rmDikembalikanFaskesLain) +
                          parseInt(rmDikembalikanPuskesmas) +
                          parseInt(rmDikembalikanRs)
                        }
                        onChange={(e) => setRmDikembalikanTotal(e.target.value)}
                        readOnly={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="keluar_pasien_rujukan"
                        className="form-control"
                        value={keluarPasienRujukan}
                        onChange={(e) => setKeluarPasienRujukan(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="keluar_pasien_datang_sendiri"
                        className="form-control"
                        value={keluarPasienDatangSendiri}
                        onChange={(e) =>
                          setKeluarPasienDatangSendiri(e.target.value)
                        }
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="keluar_total_keluar"
                        className="form-control"
                        value={
                          parseInt(keluarPasienDatangSendiri) +
                          parseInt(keluarPasienRujukan)
                        }
                        onChange={(e) => setKeluarPasienTotal(e.target.value)}
                        readOnly={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="keluar_diterima_kembali"
                        className="form-control"
                        value={keluarDiterimaKembali}
                        onChange={(e) =>
                          setKeluarDiterimaKembali(e.target.value)
                        }
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
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
          <button type="submit" className="btn btn-outline-success">
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};
export default FormEditRL310;
