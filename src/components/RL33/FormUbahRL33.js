import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormTambahRL33.module.css";
import { HiSaveAs } from "react-icons/hi";
import Table from "react-bootstrap/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL33 = () => {
  const navigate = useNavigate();
  const [buttonStatus, setButtonStatus] = useState(false);
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
  const [pasienRujukan, setPasienRujukan] = useState("");
  const [pasienNonRujukan, setPasienNonRujukan] = useState("");
  const [tlpDirawat, setTlpDirawat] = useState("");
  const [tlpDirujuk, setTlpDirujuk] = useState("");
  const [tlpPulang, setTlpPulang] = useState("");
  const [igdLaki, setIgdLaki] = useState("");
  const [igdPerempuan, setIgdPerempuan] = useState("");
  const [doaLaki, setDoaLaki] = useState("");
  const [doaPerempuan, setDoaPerempuan] = useState("");
  const [lukaLaki, setLukaLaki] = useState("");
  const [lukaPerempuan, setLukaPerempuan] = useState("");
  const [falseEmergency, setFalseEmergency] = useState("");
  const [dataParentRL, setDataParentRL] = useState([]);
  const [parentId, setParentId] = useState("");
  const { id } = useParams();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    const initialize = async () => {
      await refreshToken();
      await getRLTigaTitikTigaById();
    };
    initialize();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("/apisirs6v2/token");
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
        const response = await axios.get("apisirs6v2/token");
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
    } catch (error) {
      console.log(error);
    }
  };

  const parseIntOrZero = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const updateDataRLTigaTitikTiga = async (e) => {
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

      let parent;

      if (no.startsWith("1.")) {
        parent = await getParent(1);
      } else if (no.startsWith("2.")) {
        parent = await getParent(2);
      }

      if (parent) {
        const parentData = {
          total_pasien_rujukan:
            parent.total_pasien_rujukan + parseIntOrZero(pasienRujukan),
          total_pasien_non_rujukan:
            parent.total_pasien_non_rujukan + parseIntOrZero(pasienNonRujukan),
          tlp_dirawat: parent.tlp_dirawat + parseIntOrZero(tlpDirawat),
          tlp_dirujuk: parent.tlp_dirujuk + parseIntOrZero(tlpDirujuk),
          tlp_pulang: parent.tlp_pulang + parseIntOrZero(tlpPulang),
          m_igd_laki: parent.m_igd_laki + parseIntOrZero(igdLaki),
          m_igd_perempuan: parent.m_igd_perempuan + parseIntOrZero(igdPerempuan),
          doa_laki: parent.doa_laki + parseIntOrZero(doaLaki),
          doa_perempuan: parent.doa_perempuan + parseIntOrZero(doaPerempuan),
          luka_laki: parent.luka_laki + parseIntOrZero(lukaLaki),
          luka_perempuan: parent.luka_perempuan + parseIntOrZero(lukaPerempuan),
          false_emergency: parent.false_emergency + parseIntOrZero(falseEmergency),
        };

        const updateParent = await axiosJWT.patch(
          "/apisirs6v2/rltigatitiktigadetail/" + parent.id,
          parentData,
          customConfig
        );
      }

      const result = await axiosJWT.patch(
        "/apisirs6v2/rltigatitiktigadetail/" + id,
        {
          total_pasien_rujukan: parseIntOrZero(pasienRujukan),
          total_pasien_non_rujukan: parseIntOrZero(pasienNonRujukan),
          tlp_dirawat: parseIntOrZero(tlpDirawat),
          tlp_dirujuk: parseIntOrZero(tlpDirujuk),
          tlp_pulang: parseIntOrZero(tlpPulang),
          m_igd_laki: parseIntOrZero(igdLaki),
          m_igd_perempuan: parseIntOrZero(igdPerempuan),
          doa_laki: parseIntOrZero(doaLaki),
          doa_perempuan: parseIntOrZero(doaPerempuan),
          luka_laki: parseIntOrZero(lukaLaki),
          luka_perempuan: parseIntOrZero(lukaPerempuan),
          false_emergency: parseIntOrZero(falseEmergency),
        },
        customConfig
      );

      if (result.data && result.data.status === true) {
        toast(result.data.message || "Data Berhasil Diperbaharui", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl33");
        }, 2000);
      } else {
        const message = result.data?.message || "Data Gagal Diperbaharui";
        toast(`Data Gagal Diperbaharui, ${message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
      }
    } catch (error) {
      console.log(error);
      if (error.response?.data) {
        console.error(error.response.data);
        toast(`Data Gagal Diupdate, ${error.response.data.message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      } else {
        toast("Data Gagal Diupdate", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
      setButtonStatus(false);
    }
  };

  const getParent = async (filter) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktigadetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newResponse = await axiosJWT.get("/apisirs6v2/rltigatitiktiga", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        tahun: tahun,
        bulan: bulan,
      },
    });

    let dataRLTigaTitikTigaDetails = [];
    const rlTigaTitikTigaDetails = newResponse.data.data.map((value) => {
      return value.rl_tiga_titik_tiga_details;
    });
    rlTigaTitikTigaDetails.forEach((element) => {
      element.forEach((value) => {
        dataRLTigaTitikTigaDetails.push(value);
      });
    });

    const parent = dataRLTigaTitikTigaDetails
      .filter((value) => {
        const noValue = value.jenis_pelayanan_rl_tiga_titik_tiga.no;
        return (
          noValue === `${filter}.` ||
          noValue === String(filter)
        );
      })
      .map((value) => {
        return {
          total_pasien_rujukan:
            value.total_pasien_rujukan -
            response.data.data.total_pasien_rujukan,
          total_pasien_non_rujukan:
            value.total_pasien_non_rujukan -
            response.data.data.total_pasien_non_rujukan,
          tlp_dirawat: value.tlp_dirawat - response.data.data.tlp_dirawat,
          tlp_dirujuk: value.tlp_dirujuk - response.data.data.tlp_dirujuk,
          tlp_pulang: value.tlp_pulang - response.data.data.tlp_pulang,
          m_igd_laki: value.m_igd_laki - response.data.data.m_igd_laki,
          m_igd_perempuan:
            value.m_igd_perempuan - response.data.data.m_igd_perempuan,
          doa_laki: value.doa_laki - response.data.data.doa_laki,
          doa_perempuan: value.doa_perempuan - response.data.data.doa_perempuan,
          luka_laki: value.luka_laki - response.data.data.luka_laki,
          luka_perempuan:
            value.luka_perempuan - response.data.data.luka_perempuan,
          false_emergency:
            value.false_emergency - response.data.data.false_emergency,
          id: value.id,
        };
      });

    return parent[0];
  };

  const getRLTigaTitikTigaById = async () => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktigadetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTahun(response.data.data.tahun);
    setBulan(response.data.data.bulan);
    setNo(response.data.data.jenis_pelayanan_rl_tiga_titik_tiga.no);
    setNama(response.data.data.jenis_pelayanan_rl_tiga_titik_tiga.nama);
    setPasienRujukan(response.data.data.total_pasien_rujukan);
    setPasienNonRujukan(response.data.data.total_pasien_non_rujukan);
    setTlpDirawat(response.data.data.tlp_dirawat);
    setTlpDirujuk(response.data.data.tlp_dirujuk);
    setTlpPulang(response.data.data.tlp_pulang);
    setIgdLaki(response.data.data.m_igd_laki);
    setIgdPerempuan(response.data.data.m_igd_perempuan);
    setDoaLaki(response.data.data.doa_laki);
    setDoaPerempuan(response.data.data.doa_perempuan);
    setLukaLaki(response.data.data.luka_laki);
    setLukaPerempuan(response.data.data.luka_perempuan);
    setFalseEmergency(response.data.data.false_emergency);
  };

  const preventPasteNegative = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = parseFloat(clipboardData.getData("text"));

    if (pastedData < 0) {
      e.preventDefault();
    }
  };

  const handleFocus = (event) => {
    event.target.select();
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h2>RL. 3.3</h2>
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

        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl33/`}
              className={style.btnPrimary}
              style={{
                textDecoration: "none",
                display: "inline-block",
                color: "#FFF",
              }}
            >
              &lt;
            </Link>
            <span style={{ color: "gray" }}>Kembali RL 3.3 Rawat Darurat</span>

            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table responsive className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      style={{ width: "3%", verticalAlign: "middle" }}
                      rowSpan={2}
                      className={style["sticky-header"]}
                    >
                      No Pelayanan
                    </th>
                    <th
                      rowSpan={2}
                      style={{ width: "17%", verticalAlign: "middle" }}
                      className={style["sticky-header"]}
                    >
                      Nama Pelayanan
                    </th>
                    <th style={{ width: "8%" }} colSpan={2}>
                      Total Pasien
                    </th>
                    <th style={{ width: "12%" }} colSpan={3}>
                      Tindak Lanjut Pelayanan
                    </th>
                    <th style={{ width: "8%" }} colSpan={2}>
                      Mati di IGD
                    </th>
                    <th style={{ width: "8%" }} colSpan={2}>
                      DOA
                    </th>
                    <th style={{ width: "8%" }} colSpan={2}>
                      Luka-luka
                    </th>
                    <th
                      rowSpan={2}
                      style={{ width: "4%", verticalAlign: "middle" }}
                    >
                      False Emergency
                    </th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th style={{ width: "4%" }}>Rujukan</th>
                    <th style={{ width: "4%" }}>Non Rujukan</th>
                    <th style={{ width: "4%" }}>Dirawat</th>
                    <th style={{ width: "4%" }}>Dirujuk</th>
                    <th style={{ width: "4%" }}>Pulang</th>
                    <th style={{ width: "4%" }}>L</th>
                    <th style={{ width: "4%" }}>P</th>
                    <th style={{ width: "4%" }}>L</th>
                    <th style={{ width: "4%" }}>P</th>
                    <th style={{ width: "4%" }}>L</th>
                    <th style={{ width: "4%" }}>P</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={style["sticky-column"]}>
                      <input
                        name="no"
                        type="text"
                        className="form-control"
                        id="floatingInput"
                        placeholder="No"
                        value={no}
                        disabled={true}
                      />
                    </td>
                    <td className={style["sticky-column"]}>
                      <input
                        name="nama"
                        type="text"
                        className="form-control"
                        id="floatingInput"
                        placeholder="Kegiatan"
                        value={nama}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <div className="control">
                        <input
                          type="number"
                          min="0"
                          maxLength={7}
                          onInput={(e) => maxLengthCheck(e)}
                          onPaste={preventPasteNegative}
                          onFocus={handleFocus}
                          className="form-control"
                          value={pasienRujukan}
                          onChange={(e) => setPasienRujukan(e.target.value)}
                          placeholder="pasienRujukan"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={pasienNonRujukan}
                          onChange={(e) => setPasienNonRujukan(e.target.value)}
                          placeholder="pasienNonRujukan"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={tlpDirawat}
                          onChange={(e) => setTlpDirawat(e.target.value)}
                          placeholder="tlpDirawat"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={tlpDirujuk}
                          onChange={(e) => setTlpDirujuk(e.target.value)}
                          placeholder="tlpDirujuk"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={tlpPulang}
                          onChange={(e) => setTlpPulang(e.target.value)}
                          placeholder="tlpPulang"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={igdLaki}
                          onChange={(e) => setIgdLaki(e.target.value)}
                          placeholder="igdLaki"
                          disabled={no === "3" || no === "2.1" ? true : false}
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={igdPerempuan}
                          onChange={(e) => setIgdPerempuan(e.target.value)}
                          placeholder="igdPerempuan"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={doaLaki}
                          onChange={(e) => setDoaLaki(e.target.value)}
                          placeholder="doaLaki"
                          disabled={no === "3" || no === "2.1" ? true : false}
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={doaPerempuan}
                          onChange={(e) => setDoaPerempuan(e.target.value)}
                          placeholder="doaPerempuan"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={lukaLaki}
                          onChange={(e) => setLukaLaki(e.target.value)}
                          placeholder="lukaLaki"
                          disabled={no === "3" || no === "2.1" ? true : false}
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={lukaPerempuan}
                          onChange={(e) => setLukaPerempuan(e.target.value)}
                          placeholder="lukaPerempuan"
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
                          onFocus={handleFocus}
                          className="form-control"
                          value={falseEmergency}
                          onChange={(e) => setFalseEmergency(e.target.value)}
                          placeholder="falseEmergency"
                          disabled={no < 2 ? true : false}
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

export default FormUbahRL33;
