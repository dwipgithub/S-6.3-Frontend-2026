import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./RL38.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL38 = () => {
  const [tahun, setTahun] = useState("2025");
  const [bulan, setBulan] = useState("00");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [buttonStatus, setButtonStatus] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikDelapanTemplate();
    // const date = new Date();
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
    } catch (error) { }
  };

  const getRLTigaTitikDelapanTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapanpemeriksaan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let rlTemplate = response.data.data.map((value, index) => {
        try {
          return {
            id: value.id,
            rLTigaTitikDelapanPemeriksaan: value.nama,
            rLTigaTitikDelapanGroupNo:
              value.rl_tiga_titik_delapan_group_pemeriksaan.no,
            rLTigaTitikDelapanGroupNama:
              value.rl_tiga_titik_delapan_group_pemeriksaan.nama,
            no: value.no,
            jumlahLaki: 0,
            jumlahPerempuan: 0,
            rataLaki: 0,
            rataPerempuan: 0,
            disabledInput: true,
            checked: false,
          };
        } catch (error) {
          console.error("Error map ", index ," : ", error);
          return null;
        }
      });

      setDataRL(rlTemplate);
    } catch (error) { }
  };

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(event.target.value);
    } else if (name === "bulan") {
      setBulan(event.target.value);
    }
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
    } else if (name === "jumlahLaki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      newDataRL[index].jumlahLaki = parseInt(event.target.value);
    } else if (name === "jumlahPerempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      newDataRL[index].jumlahPerempuan = parseInt(event.target.value);
    } else if (name === "rataLaki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      newDataRL[index].rataLaki = event.target.value;
    } else if (name === "rataPerempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rataPerempuan = event.target.value;
    }
    setDataRL(newDataRL);
  };

  const handleFocus = (event) => event.target.select();

  const Simpan = async (e) => {
    // let periode = tahun + "-" + bulan + "-01";
    e.preventDefault();

    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            rLTigaTitikDelapanPemeriksaanId: value.id,
            jumlahLaki: value.jumlahLaki,
            jumlahPerempuan: value.jumlahPerempuan,
            rataLaki: value.rataLaki,
            rataPerempuan: value.rataPerempuan,
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

     await axios.get("/apisirs6v2/token", customConfig);
      if (bulan === "00" || bulan === 0) {
        toast(`Data tidak bisa disimpan karena belum pilih periode laporan`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
      } else {
          await axiosJWT.post(
          "/apisirs6v2/rltigatitikdelapan",
          {
            periodeBulan: parseInt(bulan),
            periodeTahun: parseInt(tahun),
            data: dataRLArray,
          },
          customConfig
        );
        // console.log(result.data);
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/rl38");
        }, 1000);
      }
    } catch (error) {
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


  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
    }
  };

  const currentYear = new Date().getFullYear();
  const daftarTahun = [];
  for (let i = 2025; i <= currentYear; i++) {
    daftarTahun.push(i);
  }


  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "100px" }}
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
                  style={{ width: "100%", display: "inline-block" }}
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

                  <label htmlFor="floatingInput">Tahun</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <select
                    name="bulan"
                    className="form-control"
                    id="bulan"
                    onChange={(e) => changeHandlerSingle(e)}
                  >
                    <option value="00">--PILIH BULAN--</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                  <label htmlFor="bulan">Bulan</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-3">
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
            <span style={{ color: "gray" }}>Kembali RL 3.8 Laboratorium</span>
            <div className={style["table-container"]}>
              <table responsive className={style["table"]}>
                <thead className={style["thead"]}>
                  <tr className="main-header-row">
                    <th
                      rowSpan={2}
                      style={{ width: "4%", verticalAlign: "middle" }}
                    >
                      No.
                    </th>
                    <th rowSpan={2} style={{ width: "3%" }}></th>
                    <th
                      rowSpan={2}
                      style={{
                        width: "50%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
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
                  <tr className={style["subheader-row"]}>
                    <th style={{ textAlign: "center" }}>Laki-Laki</th>
                    <th style={{ textAlign: "center" }}>Perempuan</th>
                    <th style={{ textAlign: "center" }}>Laki-Laki</th>
                    <th style={{ textAlign: "center" }}>Perempuan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    let disabled = true;
                    let visibled = true;
                    if (value.no === 0) {
                      value.disabledInput = true;
                      disabled = false;
                      visibled = "block";
                    }
                    return (
                      <tr key={value.id}>
                        <td>{value.no}</td>
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
                          {value.rLTigaTitikDelapanGroupNama +
                            " " +
                            value.rLTigaTitikDelapanPemeriksaan}
                        </td>
                        <td>
                          <input
                            type="number"
                            name="jumlahLaki"
                            className="form-control"
                            value={value.jumlahLaki}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="jumlahPerempuan"
                            className="form-control"
                            value={value.jumlahPerempuan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          {/* <input
                            type="number"
                            name="rataLaki"
                            className="form-control"
                            value={value.rataLaki}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          /> */}
                                                    <input
                            type="text"
                            name="rataLaki"
                            className="form-control"
                            value={value.rataLaki}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            maxLength={13}
                            onInput={(e) => validateDecimal(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          {/* <input
                            type="number"
                            name="rataPerempuan"
                            className="form-control"
                            value={value.rataPerempuan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          /> */}
                          <input
                            type="text"
                            name="rataPerempuan"
                            className="form-control"
                            value={value.rataPerempuan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            maxLength={13}
                            onInput={(e) => validateDecimal(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* </Table> */}
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

export default FormTambahRL38;
