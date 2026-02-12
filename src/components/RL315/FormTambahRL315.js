import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL315.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
// import Table from "react-bootstrap/Table";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL315 = () => {
  const [tahun, setTahun] = useState("");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
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
    getRLTigaTitikLimaBelasTemplate();
    const date = new Date();
    setTahun(date.getFullYear());
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
    } catch (error) {}
  };

  const getRLTigaTitikLimaBelasTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jeniskegiatantigatitiklimabelas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisKegiatan: value.nama,
          laki: 0,
          perempuan: 0,
          jumlah: 0,
          disabledInput: true,
          checked: false,
        };
      });

      console.log(rlTemplate);
      setDataRL(rlTemplate);
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
  };

  const changeHandler = (event, index) => {
    console.log(index);
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (index != 8) {
        if (event.target.checked === true) {
          newDataRL[index].disabledInput = false;
        } else if (event.target.checked === false) {
          newDataRL[index].disabledInput = true;
        }
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "laki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].laki = event.target.value;
      newDataRL[index].jumlah =
        parseInt(event.target.value) + parseInt(newDataRL[index].perempuan);
    } else if (name === "perempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].perempuan = event.target.value;
      newDataRL[index].jumlah =
        parseInt(event.target.value) + parseInt(newDataRL[index].laki);
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
            jenisKegiatanTigaTitikLimaBelasId: parseInt(value.id),
            laki: parseInt(value.laki),
            perempuan: parseInt(value.perempuan),
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
        "/apisirs6v2/rltigatitiklimabelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );
      if (result.status === 201) {
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl315");
        }, 2000);
      } else {
        toast(`Data Gagal Disimpan, ${result.data.message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const handleFocus = (event) => {
    event.target.select();
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
      <h2>RL. 3.15</h2>
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
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  {/* <input
                    name="tahun"
                    type="number"
                    className="form-control"
                    id="tahun"
                    placeholder="Tahun"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
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

                  <label htmlFor="tahun">Tahun</label>
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
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th style={{ width: "4%" }}>No</th>
                    <th style={{ width: "4%" }}></th>
                    <th style={{ width: "30%" }}>Jenis Kegiatan</th>
                    <th>Laki-Laki</th>
                    <th>Perempuan</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    return (
                      <tr key={value.id}>
                        <td>
                          <input
                            type="text"
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
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
                            name="jenisKegiatan"
                            className="form-control"
                            value={value.jenisKegiatan}
                            disabled={true}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="laki"
                            className="form-control"
                            value={value.laki}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
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
                            value={value.perempuan}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
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
                            value={value.jumlah}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            readOnly={true}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

export default FormTambahRL315;
