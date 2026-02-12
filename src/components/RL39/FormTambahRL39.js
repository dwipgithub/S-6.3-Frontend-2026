import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL39.module.css";
import { HiSaveAs } from "react-icons/hi";
// import { IoArrowBack } from 'react-icons/io5'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL39 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [bulan, setBulan] = useState(0);
  const [tahun, setTahun] = useState("2025");
  const [daftarBulan, setDaftarBulan] = useState([]);
  // const [namaKelompokJenisKegiatan, setnamaKelompokJenisKegiatan] = useState([])
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    //getDataRS()
    getRLTigaTitikSembilanTemplate();
    getBulan();
    // getKelompokJenisKegiatan()
    // const date = new Date();
    // setTahun(date.getFullYear())
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
  const getBulan = async () => {
    const results = [];
    results.push({
      key: "--Pilih Bulan--",
      value: "0",
    });
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

  const getRLTigaTitikSembilanTemplate = async () => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanjeniskegiatan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,

          kodeProvinsi: 0,
          kabKota: 0,
          kodeRS: 0,
          namaRS: 0,

          no: value.no,
          jenisKegiatan: value.nama,
          jumlah: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      setSpinner(false);
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
      newDataRL[index].no = event.target.value;
    } else if (name === "jenisKegiatan") {
      newDataRL[index].jenisKegiatan = event.target.value;
    } else if (name === "jumlah") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      newDataRL[index].jumlah = parseInt(event.target.value);
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            jenisKegiatanId: value.id,
            jumlah: value.jumlah,
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      const response = await axios.get("/apisirs6v2/token", customConfig);

      if (bulan === "00" || bulan == 0) {
        toast(`Data tidak bisa disimpan karena belum pilih periode laporan`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
        setSpinner(false);
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rltigatitiksembilan",
          {
            periodeBulan: parseInt(bulan),
            periodeTahun: parseInt(tahun),
            // periode: (parseInt(tahun) +'-'+ parseInt(bulan)+'-01'),
            data: dataRLArray,
          },
          customConfig
        );
        console.log(dataRLArray);
        setSpinner(false);
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/rl39");
        }, 1000);
      }
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      setSpinner(false);
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
  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const currentYear = new Date().getFullYear();
  const daftarTahun = [];
  for (let i = 2025; i <= currentYear; i++) {
    daftarTahun.push(i);
  }

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
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
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
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <select
                    name="tahun"
                    className="form-control"
                    id="floatingInput"
                    value={tahun}
                    onChange={(e) => changeHandlerSingle(e)}
                  >
                    {daftarTahun.map((tahun) => (
                      <option key={tahun} value={tahun}>
                        {tahun}
                      </option>
                    ))}
                  </select>
                  <label>Tahun</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl39/`}
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
            <span style={{ color: "gray" }}>RL 3.9 Radiologi</span>

            <div className="container" style={{ textAlign: "center" }}>
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
            </div>
            <table className={style.rlTable}>
              <thead>
                <tr>
                  <th style={{ width: "6%" }}>No.</th>
                  <th style={{ width: "2%" }}></th>
                  <th style={{ width: "7%" }}>No Kegiatan</th>
                  <th>Jenis Kegiatan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  if (value.no === "0") {
                    let disabledInput = true;
                    return (
                      <tr key={value.id}>
                        <td>
                          <input
                            type="text"
                            name="id"
                            className="form-control"
                            value={index + 1}
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
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
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
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="jumlah"
                            className="form-control"
                            value={value.jumlah}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
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
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="jumlah"
                            className="form-control"
                            value={value.jumlah}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
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

export default FormTambahRL39;
