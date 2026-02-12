import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL311.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
// import { IoArrowBack } from "react-icons/io5";
//import { Link } from 'react-router-dom'

const FormTambahRL311 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [tahun, setTahun] = useState("2025");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear(); // sekarang 2026

  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikSebelasTemplate();
    // const date = new Date();
    // setTahun(date.getFullYear());

    // setTahun(date.getFullYear() - 1);
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
    },
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

  const getRLTigaTitikSebelasTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jeniskegiatanrltigatitiksebelas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.id,
          jenisKegiatan: value.nama_jenis_kegiatan,
          jumlah: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
    } catch (error) {}
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
  };

  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        newDataRL[index].disabledInput = false;
      } else if (event.target.checked === false) {
        newDataRL[index].disabledInput = true;
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "no") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].no = event.target.value;
    } else if (name === "jenisKegiatan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jenisKegiatan = event.target.value;
    } else if (name === "jumlah") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlah = event.target.value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            jenisKegiatanId: parseInt(value.id),
            jumlah: parseInt(value.jumlah),
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const result = await axiosJWT.post(
        "/apisirs6v2/rltigatitiksebelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl311");
      }, 1000);
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
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
        object.target.maxLength,
      );
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
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
                    id="namaRS"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="namaRS">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="alamatRS"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="alamatRS">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="provinsiRS"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="provinsiRS">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="kabRS"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="kabRS">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  {/* <input
                    name="tahun"
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    placeholder="Tahun"
                    value={tahun}
                    disabled={true}
                  /> */}

                  <select
                    name="tahun"
                    className="form-select"
                    id="tahun"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                  >
                    <option value="">Pilih Tahun</option>

                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="floatingInput">Tahun</label>
                </div>
              </div>
            </div>
            <div className="mt-3 mb-3"></div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl311/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              &lt;
            </Link>
            <span style={{ color: "gray" }}>Kembali RL 3.11 Gigi & Mulut</span>
            <table className={style.rlTable} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap", width: "2%" }}>No.</th>
                  <th style={{ whiteSpace: "nowrap", width: "1%" }}></th>
                  <th style={{ whiteSpace: "nowrap", width: "3%" }}>
                    No Kegiatan
                  </th>
                  <th style={{ whiteSpace: "nowrap", width: "20%" }}>
                    Jenis Kegiatan
                  </th>
                  <th style={{ whiteSpace: "nowrap", width: "5%" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  if (value.id === 88) {
                    return (
                      <tr key={value.id}>
                        <td>
                          <input
                            type="text"
                            name="id"
                            className="form-control"
                            value={index + 1}
                            disabled={true}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="check"
                            className="form-check-input"
                            onChange={(e) => changeHandler(e, index)}
                            checked={value.checked}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="jenisKegiatan"
                            className="form-control"
                            value={value.jenisKegiatan}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            name="jumlah"
                            className="form-control"
                            value={value.jumlah}
                            onChange={(e) => changeHandler(e, index)}
                            // disabled={value.disabledInput}
                            disabled={true}
                          />
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={value.id}>
                        <td>
                          <input
                            type="text"
                            name="id"
                            className="form-control"
                            value={index + 1}
                            disabled={true}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="check"
                            className="form-check-input"
                            onChange={(e) => changeHandler(e, index)}
                            checked={value.checked}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="jenisKegiatan"
                            className="form-control"
                            value={value.jenisKegiatan}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            name="jumlah"
                            className="form-control"
                            value={value.jumlah}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button type="submit" className="btn btn-outline-success">
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL311;
