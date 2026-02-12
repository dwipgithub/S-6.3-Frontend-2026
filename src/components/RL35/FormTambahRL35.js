import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL35.module.css";
import { HiSaveAs } from "react-icons/hi";
import { IoArrowBack } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL35 = () => {
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
  // const [spinner, setSpinner] = useState(false)

  useEffect(() => {
    refreshToken();
    getRLTigaTitikLimaTemplate();
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

  const getRLTigaTitikLimaTemplate = async () => {
    // setSpinner(true)
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jeniskegiatanrltigatitiklima",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisKegiatan: value.nama,
          kunjungan_pasien_dalam_kabkota_laki: 0,
          kunjungan_pasien_dalam_kabkota_perempuan: 0,
          kunjungan_pasien_luar_kabkota_laki: 0,
          kunjungan_pasien_luar_kabkota_perempuan: 0,
          total_kunjungan: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      // setSpinner(false)
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(parseInt(event.target.value));
    } else if (name === "bulan") {
      setBulan(parseInt(event.target.value));
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
    } else if (name === "kunjungan_pasien_dalam_kabkota_laki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kunjungan_pasien_dalam_kabkota_laki = parseInt(
        event.target.value
      );
      newDataRL[index].total_kunjungan =
        parseInt(event.target.value) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_perempuan) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_laki) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_perempuan);
    } else if (name === "kunjungan_pasien_dalam_kabkota_perempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kunjungan_pasien_dalam_kabkota_perempuan = parseInt(
        event.target.value
      );
      newDataRL[index].total_kunjungan =
        parseInt(event.target.value) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_laki) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_laki) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_perempuan);
    } else if (name === "kunjungan_pasien_luar_kabkota_laki") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kunjungan_pasien_luar_kabkota_laki = parseInt(
        event.target.value
      );
      newDataRL[index].total_kunjungan =
        parseInt(event.target.value) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_perempuan) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_laki) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_perempuan);
    } else if (name === "kunjungan_pasien_luar_kabkota_perempuan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kunjungan_pasien_luar_kabkota_perempuan = parseInt(
        event.target.value
      );
      newDataRL[index].total_kunjungan =
        parseInt(event.target.value) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_perempuan) +
        parseInt(dataRL[index].kunjungan_pasien_luar_kabkota_laki) +
        parseInt(dataRL[index].kunjungan_pasien_dalam_kabkota_laki);
    }

    setDataRL(newDataRL);

    let jumlahDataRL = [...dataRL];

    let totalKunDalamLakiVertikal = 0;
    let totalKunDalamPerempuanVertikal = 0;
    let totalKunLuarPerempuanVertikal = 0;
    let totalKunLuarLakiVertikal = 0;
    let totalKunjungan = 0;

    for (let x = 0; x < 34; x++) {
      totalKunDalamLakiVertikal += parseInt(
        dataRL[x].kunjungan_pasien_dalam_kabkota_laki
      );
      totalKunDalamPerempuanVertikal += parseInt(
        dataRL[x].kunjungan_pasien_dalam_kabkota_perempuan
      );
      totalKunLuarPerempuanVertikal += parseInt(
        dataRL[x].kunjungan_pasien_luar_kabkota_laki
      );
      totalKunLuarLakiVertikal += parseInt(
        dataRL[x].kunjungan_pasien_luar_kabkota_perempuan
      );
      totalKunjungan += parseInt(dataRL[x].total_kunjungan);
    }
    // console.log("haiya",jumlahDataRL)
    jumlahDataRL[36].kunjungan_pasien_dalam_kabkota_laki =
      totalKunDalamLakiVertikal;
    jumlahDataRL[36].kunjungan_pasien_dalam_kabkota_perempuan =
      totalKunDalamPerempuanVertikal;
    jumlahDataRL[36].kunjungan_pasien_luar_kabkota_laki =
      totalKunLuarPerempuanVertikal;
    jumlahDataRL[36].kunjungan_pasien_luar_kabkota_perempuan =
      totalKunLuarLakiVertikal;
    jumlahDataRL[36].total_kunjungan = totalKunjungan;
    jumlahDataRL[35].kunjungan_pasien_dalam_kabkota_laki = Math.ceil(
      totalKunDalamLakiVertikal /
        parseInt(dataRL[34].kunjungan_pasien_dalam_kabkota_laki)
    );
    jumlahDataRL[35].kunjungan_pasien_dalam_kabkota_perempuan = Math.ceil(
      totalKunDalamPerempuanVertikal /
        parseInt(dataRL[34].kunjungan_pasien_dalam_kabkota_perempuan)
    );
    jumlahDataRL[35].kunjungan_pasien_luar_kabkota_laki = Math.ceil(
      totalKunLuarPerempuanVertikal /
        parseInt(dataRL[34].kunjungan_pasien_luar_kabkota_laki)
    );
    jumlahDataRL[35].kunjungan_pasien_luar_kabkota_perempuan = Math.ceil(
      totalKunLuarLakiVertikal /
        parseInt(dataRL[34].kunjungan_pasien_luar_kabkota_perempuan)
    );
    jumlahDataRL[35].total_kunjungan = Math.ceil(
      totalKunjungan / parseInt(dataRL[34].total_kunjungan)
    );
    jumlahDataRL[34].total_kunjungan = Math.ceil(
      jumlahDataRL[34].total_kunjungan / 4
    );
    setDataRL(jumlahDataRL);

    // let RataRataDataRL = [...dataRL]

    // RataRataDataRL[32].kunjungan_pasien_dalam_kabkota = (
    //     parseInt(dataRL[31].kunjungan_pasien_dalam_kabkota) / parseInt(dataRL[30].kunjungan_pasien_dalam_kabkota)
    // )

    // RataRataDataRL[32].kunjungan_pasien_luar_kabkota = (
    //     parseInt(dataRL[31].kunjungan_pasien_luar_kabkota) / parseInt(dataRL[30].kunjungan_pasien_luar_kabkota)
    // )

    // RataRataDataRL[32].total_kunjungan = (
    //     parseInt(dataRL[31].total_kunjungan) / parseInt(dataRL[30].total_kunjungan)
    // )
    // setDataRL(RataRataDataRL)
  };

  const Simpan = async (e) => {
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    // setSpinner(true)
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            jenisKegiatanId: value.id,
            kunjungan_pasien_dalam_kabkota_laki:
              value.kunjungan_pasien_dalam_kabkota_laki,
            kunjungan_pasien_dalam_kabkota_perempuan:
              value.kunjungan_pasien_dalam_kabkota_perempuan,
            kunjungan_pasien_luar_kabkota_laki:
              value.kunjungan_pasien_luar_kabkota_laki,
            kunjungan_pasien_luar_kabkota_perempuan:
              value.kunjungan_pasien_luar_kabkota_perempuan,
            total_kunjungan: value.total_kunjungan,
          };
        });
      // if(

      //     dataRL[32].kunjungan_pasien_dalam_kabkota_laki < 1 ||
      //     dataRL[32].kunjungan_pasien_dalam_kabkota_perempuan < 1 ||
      //     dataRL[32].kunjungan_pasien_luar_kabkota_laki < 1 ||
      //     dataRL[32].kunjungan_pasien_luar_kabkota_perempuan < 1 ||
      //     dataRL[32].total_kunjungan < 1

      // ){
      //     toast(`Data tidak bisa disimpan karena , TOTAL 0`, {
      //         position: toast.POSITION.TOP_RIGHT
      //     })
      //     setButtonStatus(false)
      //     setSpinner(false)
      // } else {
      if (bulan === "00" || bulan == 0) {
        toast(`Data tidak bisa disimpan karena belum pilih periode laporan`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
      } else {
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "XSRF-TOKEN": CSRFToken,
          },
        };
        await axiosJWT.post(
          "/apisirs6v2/rltigatitiklima",
          {
            tahun: parseInt(tahun),
            tahunDanBulan: date,
            data: dataRLArray,
          },
          customConfig
        );
        // console.log(result.data)
        // setSpinner(false)
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/rl35");
        }, 1000);
      }
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      // setSpinner(false)
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
              to={`/rl35/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              {/* <IoArrowBack size={30} style={{color:"gray",cursor: "pointer"}}/><span style={{color: "gray"}}></span>
                            <span style={{color:"gray"}}>Tambah data RL 3.5 -  Kunjungan Rawat Jalan</span> */}
              &lt;
            </Link>
            <span style={{ color: "gray" }}>Kembali RL 3.5 - Kunjungan</span>
            {/* <div className="container" style={{ textAlign: "center" }}>
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
                        </div> */}
            <div className={style["table-container"]}>
              <table responsive className={style["table"]}>
                <thead className={style["thead"]}>
                  <tr>
                    <th
                      rowSpan={2}
                      style={{ width: "4%", verticalAlign: "middle" }}
                    >
                      No.
                    </th>
                    <th rowSpan={2} style={{ width: "3%" }}></th>
                    <th rowSpan={2} style={{ width: "25%" }}>
                      Jenis Kegiatan
                    </th>
                    <th colSpan={2} style={{ textAlign: "center" }}>
                      Kunjungan Pasien Dalam Kota
                    </th>
                    <th colSpan={2} style={{ textAlign: "center" }}>
                      Kunjungan Pasien Luar Kota
                    </th>
                    <th rowSpan={2}>Total Kunjungan</th>
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
                    if (value.no == 99 || value.no == 77) {
                      disabled = true;
                      visibled = "none";
                      value.min = "0";
                      // value.checked=true
                    } else if (value.no == 66) {
                      value.disabledInput = false;
                      disabled = false;
                      // visibled = "none"
                      value.min = "0";
                      value.checked = true;
                    } else if (value.no == 100) {
                      value.disabledInput = true;
                      disabled = false;
                      visibled = "block";
                    } else {
                      disabled = false;
                      visibled = "block";
                    }
                    return (
                      <tr key={value.id}>
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="hidden"
                            name="id"
                            className="form-control"
                            value={value.id}
                            disabled={true}
                          />
                          {value.no}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            name="check"
                            className="form-check-input"
                            onChange={(e) => changeHandler(e, index)}
                            checked={value.checked}
                            disabled={disabled}
                            style={{ display: visibled }}
                          />
                        </td>
                        <td>{value.jenisKegiatan}</td>
                        <td>
                          <input
                            type="number"
                            min={value.min}
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="kunjungan_pasien_dalam_kabkota_laki"
                            className="form-control"
                            value={value.kunjungan_pasien_dalam_kabkota_laki}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={value.min}
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="kunjungan_pasien_dalam_kabkota_perempuan"
                            className="form-control"
                            value={
                              value.kunjungan_pasien_dalam_kabkota_perempuan
                            }
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={value.min}
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="kunjungan_pasien_luar_kabkota_laki"
                            className="form-control"
                            value={value.kunjungan_pasien_luar_kabkota_laki}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={value.min}
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="kunjungan_pasien_luar_kabkota_perempuan"
                            className="form-control"
                            value={
                              value.kunjungan_pasien_luar_kabkota_perempuan
                            }
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={value.min}
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="total_kunjungan"
                            className="form-control"
                            value={value.total_kunjungan}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
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
          <button
            type="submit"
            disabled={buttonStatus}
            className="btn btn-outline-success"
          >
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL35;
