import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormTambahRL315.module.css";
import { HiSaveAs } from "react-icons/hi";
// import Table from "react-bootstrap/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL315 = () => {
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
  const [jumlah, setJumlah] = useState(0);
  const [laki, setLaki] = useState(0);
  const [perempuan, setPerempuan] = useState(0);
  const { id } = useParams();
  const [no, setNo] = useState("");
  const [nama, setNama] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getDataRLTigaTitikLimaBelasDetailById(id);
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
      //console.log(response.data)
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {
      console.log(error);
    }
  };

  const getDataRLTigaTitikLimaBelasDetailById = async (id) => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimabelasdetail/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNo(response.data.data.jenis_kegiatan_rl_tiga_titik_lima_belas.no);
      setNama(response.data.data.jenis_kegiatan_rl_tiga_titik_lima_belas.nama);
      setTahun(response.data.data.tahun);
      setLaki(response.data.data.laki);
      setPerempuan(response.data.data.perempuan);
      setJumlah(response.data.data.jumlah);
    } catch (error) {
      console.log(error);
    }
  };

  const updateData = async (e) => {
    e.preventDefault();
    try {
      const data = {
        laki: laki,
        perempuan: perempuan,
        jumlah: parseInt(laki) + parseInt(perempuan),
      };

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      const result = await axiosJWT.patch(
        "/apisirs6v2/rltigatitiklimabelasdetail/" + id,
        data,
        customConfig
      );

      toast("Data Berhasil Diubah", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl315");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
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

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
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
      <h2>RL. 3.15</h2>
      <form onSubmit={updateData}>
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
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl315/`}
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
            <span style={{ color: "gray" }}>
              Kembali RL 3.15 Kesehatan Jiwa
            </span>

            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table responsive className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th style={{ width: "10%" }}>No</th>
                    <th>Jenis Kegiatan</th>
                    <th>Laki-laki</th>
                    <th>Perempuan</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input
                        type="text"
                        name="no"
                        className="form-control"
                        value={no}
                        disabled={true}
                      />
                    </td>
                    <td>
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
                        type="number"
                        name="laki"
                        className="form-control"
                        value={laki}
                        onChange={(e) => setLaki(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="perempuan"
                        className="form-control"
                        value={perempuan}
                        onChange={(e) => setPerempuan(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah"
                        className="form-control"
                        value={parseInt(laki) + parseInt(perempuan)}
                        // onChange={(e) => setJumlah(e.target.value)}
                        readOnly={true}
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

export default FormUbahRL315;
