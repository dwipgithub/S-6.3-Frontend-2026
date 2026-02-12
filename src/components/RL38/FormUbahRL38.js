import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate, useParams } from "react-router-dom";
import style from "./RL38.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/esm/Table";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormEditRL38 = () => {
  // const [tahun, setTahun] = useState("");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [rLTigaTitikDelapanPemeriksaanId, setPemeriksaanRLTigaTitikDelapanId] =
    useState("");
  const [jumlahLaki, setJumlahLaki] = useState(0);
  const [jumlahPerempuan, setJumlahPerempuan] = useState(0);
  const [rataLaki, setRataLaki] = useState(0);
  const [rataPerempuan, setRataPerempuan] = useState(0);
  const [no, setNo] = useState("");
  // const [nama, setNama] = useState("");
  // const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [buttonStatus, setButtonStatus] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikDelapanById();

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

  const handleFocus = (event) => event.target.select();

  const changeHandler = (event, index) => {
    const targetName = event.target.name;
    switch (targetName) {
      case "jumlahLaki":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setJumlahLaki(event.target.value);
        break;
      case "jumlahPerempuan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setJumlahPerempuan(event.target.value);
        break;
      case "rataLaki":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRataLaki(event.target.value);
        break;
      case "rataPerempuan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setRataPerempuan(event.target.value);
        break;
      default:
        break;
    }
  };

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

  const getRLTigaTitikDelapanById = async () => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitikdelapan/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response)
    // setNama(response.data.data.jenis_kegiatan.nama);
    setNo(response.data.data.jenis_kegiatan_id);
    setPemeriksaanRLTigaTitikDelapanId(
      response.data.data.rl_tiga_titik_delapan_pemeriksaan.nama
    );
    setJumlahLaki(response.data.data.jumlahLaki);
    setJumlahPerempuan(response.data.data.jumlahPerempuan);
    setRataLaki(response.data.data.rataLaki);
    setRataPerempuan(response.data.data.rataPerempuan);
  };

  const UpdateRLTigaTitikDelapan = async (e) => {
    e.preventDefault();
    setButtonStatus(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axios.get("/apisirs6v2/token", customConfig);
      await axiosJWT.patch(
        "/apisirs6v2/rltigatitikdelapan/" + id,
        {
          no,
          jumlahLaki,
          jumlahPerempuan,
          rataLaki,
          rataPerempuan,
        },
        customConfig
      );
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl38");
      }, 1000);
      //   console.log(parseInt(khusus));
    } catch (error) {
      toast("Data Gagal Diupdate", {
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

  const validateDecimal = (e) => {
    const input = e.target;
    let value = input.value;

    // value = value.replace('.', ',');

    // Validasi: hanya angka dan maksimal 3 desimal
    const regex = /^\d+(\.\d{0,3})?$/;
    if (!regex.test(value)) {
      // Jika tidak valid, hapus karakter terakhir
      input.value = value.slice(0, -1);
    }
  }

  const preventMinus = (e) => {
    if (e.code === "Minus") {
      e.preventDefault();
    }
  };

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <form onSubmit={UpdateRLTigaTitikDelapan}>
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
                    id="floatingInput"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <Link
              to={`/rl38/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              {/* <IoArrowBack
                size={30}
                style={{ color: "gray", cursor: "pointer" }}
              /> */}
              &lt;
            </Link>
            <span style={{ color: "gray" }}> Kembali RL 3.8 Laboratorium</span>
            <Table className={style.rlTable}>
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    style={{ textAlign: "center", verticalAlign: "middle" }}
                  >
                    Jenis Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Jumlah Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Rata-Rata Pemeriksaan
                  </th>
                </tr>
                <tr>
                  <th style={{ textAlign: "center" }}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }}>Perempuan</th>
                  <th style={{ textAlign: "center" }}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }}>Perempuan</th>
                </tr>
              </thead>
              <tbody>
                <tr key={id}>
                  {/* <td>
                    <input
                      type="text"
                      name="no"
                      className="form-control"
                      value={setJeniskegiatan}
                      disabled={true}
                    />
                  </td> */}
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    {rLTigaTitikDelapanPemeriksaanId}
                  </td>
                  <td>
                    {rLTigaTitikDelapanPemeriksaanId === "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="jumlahLaki"
                          className="form-control"
                          value={jumlahLaki}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                          disabled={true}
                        />
                      </div>
                    )}
                    {rLTigaTitikDelapanPemeriksaanId !== "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="jumlahLaki"
                          className="form-control"
                          value={jumlahLaki}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    {rLTigaTitikDelapanPemeriksaanId === "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="jumlahPerempuan"
                          className="form-control"
                          value={jumlahPerempuan}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                          disabled={true}
                        />
                      </div>
                    )}
                    {rLTigaTitikDelapanPemeriksaanId !== "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="jumlahPerempuan"
                          className="form-control"
                          value={jumlahPerempuan}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    {rLTigaTitikDelapanPemeriksaanId === "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="rataLaki"
                          className="form-control"
                          value={rataLaki}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                          disabled={true}
                        />
                      </div>
                    )}
                    {rLTigaTitikDelapanPemeriksaanId !== "Tidak Ada Data" && (
                      <div className="control">
                        <input
                        type="text"
                          name="rataLaki"
                          className="form-control"
                          value={rataLaki}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          maxLength={13}
                          onInput={(e) => validateDecimal(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    {rLTigaTitikDelapanPemeriksaanId === "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="number"
                          name="rataPerempuan"
                          className="form-control"
                          value={rataPerempuan}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                          disabled={true}
                        />
                      </div>
                    )}
                    {rLTigaTitikDelapanPemeriksaanId !== "Tidak Ada Data" && (
                      <div className="control">
                        <input
                          type="text"
                          name="rataPerempuan"
                          className="form-control"
                          value={rataPerempuan}
                          onChange={(event) => changeHandler(event)}
                          onFocus={handleFocus}
                          placeholder="Jumlah"
                          min={0}
                          maxLength={13}
                          onInput={(e) => validateDecimal(e)}
                          onPaste={preventPasteNegative}
                          onKeyPress={preventMinus}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </Table>
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
