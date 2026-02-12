import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL33.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from 'react-bootstrap/Table'
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL33 = () => {
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    const date = new Date();
    setTahun(date.getFullYear());
    setBulan(date.getMonth() + 1);
    // getDataRLTigaTitikTiga();

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
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
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

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          kabKotaId: kabKotaId,
        },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getDataRLTigaTitikTiga = async (e) => {
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("Nama: ".concat(rumahSakit.nama));
    filter.push(
      "Periode ".concat(
        String(months[bulan - 1].label)
          .concat(" ")
          .concat(tahun)
      )
    );
    setFilterLabel(filter);

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: tahun,
          bulan: bulan,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktiga",
        customConfig
      );

      const rlTigaTitikTigaDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_tiga_details;
      });

      let dataRLTigaTitikTigaDetails = [];
      rlTigaTitikTigaDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikTigaDetails.push(value);
        });
      });
      setDataRL(dataRLTigaTitikTigaDetails);
      setRumahSakit(null);
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  // const hapusData = async (id) => {
  //   const customConfig = {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //   };
  //   try {
  //     let parent;
  //     const currentData = await getRLTigaTitikTigaById(id);

  //     if (currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("1.")) {
  //       parent = await getParent(1, id);
  //     } else if (
  //       currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("2.")
  //     ) {
  //       parent = await getParent(2, id);
  //     }

  //     if (parent) {
  //       await axiosJWT.patch(
  //         "/apisirs6v2/rltigatitiktigadetail/" + parent.id,
  //         parent.data,
  //         customConfig
  //       );
  //     }
  //     const results = await axiosJWT.delete(
  //       `/apisirs6v2/rltigatitiktiga/${id}`,
  //       customConfig
  //     );
  //     // getDataRLTigaTitikTiga();
  //     toast("Data Berhasil Dihapus", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });

  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 3000);
  //     // setDataRL((current) => current.filter((value) => value.id !== id));
  //   } catch (error) {
  //     console.log(error);
  //     toast("Data Gagal Disimpan", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });
  //   }
  // };

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      let parent;
      const currentData = await getRLTigaTitikTigaById(id);

      if (currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("1.")) {
        parent = await getParent(1, id);
      } else if (
        currentData.jenis_pelayanan_rl_tiga_titik_tiga.no.includes("2.")
      ) {
        parent = await getParent(2, id);
      }

      if (parent) {
        await axiosJWT.patch(
          `/apisirs6v2/rltigatitiktigadetail/${parent.id}`,
          parent.data,
          customConfig
        );
      }
      await axiosJWT.delete(`/apisirs6v2/rltigatitiktiga/${id}`, customConfig);

      // Menghapus data dari state tanpa reload
      setDataRL((current) => current.filter((value) => value.id !== id));

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            hapusData(id);
          },
        },
        {
          label: "Tidak",
        },
      ],
    });
  };

  const getParent = async (filter, id) => {
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
        return value.jenis_pelayanan_rl_tiga_titik_tiga.no == filter;
      })
      .map((value) => {
        return {
          id: value.id,
          data: {
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
            doa_perempuan:
              value.doa_perempuan - response.data.data.doa_perempuan,
            luka_laki: value.luka_laki - response.data.data.luka_laki,
            luka_perempuan:
              value.luka_perempuan - response.data.data.luka_perempuan,
            false_emergency:
              value.false_emergency - response.data.data.false_emergency,
          },
        };
      });

    return parent[0];
  };

  const getRLTigaTitikTigaById = async (id) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktigadetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan(1);
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      default:
    }
  };

  const getProvinsi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/provinsi", customConfig);

      const daftarProvinsi = results.data.data.map((value) => {
        return value;
      });

      setDaftarProvinsi(daftarProvinsi);
    } catch (error) {
      console.log(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          provinsiId: provinsiId,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);

      const daftarKabKota = results.data.data.map((value) => {
        return value;
      });

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  let total = {
    total_pasien_rujukan: 0,
    total_pasien_non_rujukan: 0,
    tlp_dirawat: 0,
    tlp_dirujuk: 0,
    tlp_pulang: 0,
    m_igd_laki: 0,
    m_igd_perempuan: 0,
    doa_laki: 0,
    doa_perempuan: 0,
    luka_laki: 0,
    luka_perempuan: 0,
    false_emergency: 0,
  };

  dataRL
    .filter((value) => {
      return (
        value.jenis_pelayanan_rl_tiga_titik_tiga.no != 1 &&
        value.jenis_pelayanan_rl_tiga_titik_tiga.no != 2
      );
    })
    .map((value, index) => {
      total.total_pasien_rujukan += parseInt(value.total_pasien_rujukan);
      total.total_pasien_non_rujukan += parseInt(
        value.total_pasien_non_rujukan
      );
      total.tlp_dirawat += parseInt(value.tlp_dirawat);
      total.tlp_dirujuk += parseInt(value.tlp_dirujuk);
      total.tlp_pulang += parseInt(value.tlp_pulang);
      total.m_igd_laki += parseInt(value.m_igd_laki);
      total.m_igd_perempuan += parseInt(value.m_igd_perempuan);
      total.doa_laki += parseInt(value.doa_laki);
      total.doa_perempuan += parseInt(value.doa_perempuan);
      total.luka_laki += parseInt(value.luka_laki);
      total.luka_perempuan += parseInt(value.luka_perempuan);
      total.false_emergency += parseInt(value.false_emergency);
    });

  function handleDownloadExcel() {
    const header = [
      "No",
      "No Pelayanan",
      "Jenis Pelayanan",
      "Total Pasien Rujukan",
      "Total Pasien Non Rujukan",
      "Tindak Lanjut Pelayanan Dirawat",
      "Tindak Lanjut Pelayanan Dirujuk",
      "Tindak Lanjut Pelayanan Pulang",
      "Mati di IGD (L)",
      "Mati di IGD (P)",
      "DOA (L)",
      "DOA (P)",
      "Luka-luka (L)",
      "Luka-luka (P)",
      "False Emergency",
    ];

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_pelayanan_rl_tiga_titik_tiga.no,
        value.jenis_pelayanan_rl_tiga_titik_tiga.nama,
        value.total_pasien_rujukan,
        value.total_pasien_non_rujukan,
        value.tlp_dirawat,
        value.tlp_dirujuk,
        value.tlp_pulang,
        value.m_igd_laki,
        value.m_igd_perempuan,
        value.doa_laki,
        value.doa_perempuan,
        value.luka_laki,
        value.luka_perempuan,
        value.false_emergency,
      ];

      return data;
    });

    downloadExcel({
      fileName: "RL_3_3",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRLTigaTitikTiga}>
          <Modal.Body>
            {user.jenisUserId === 1 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="provinsi"
                    id="provinsi"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getKabKota(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarProvinsi.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 2 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 3 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                name="bulan"
                className="form-control"
                id="bulan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              >
                {months.map((value) => (
                  <option key={value.value - 1} value={value.value}>
                    {value.label}
                  </option>
                ))}
              </select>
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="row">
        <div className="col-md-12">
          <h4>
            <span style={{ color: "gray" }}>RL. 3.3 Rawat Darurat</span>
          </h4>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl33/tambah/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                +
              </Link>
            ) : (
              <></>
            )}
            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleShow}
            >
              Filter
            </button>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                marginLeft: "5px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
          </div>

          {filterLabel.length > 0 ? (
            <div>
              <h5 style={{ fontSize: "14px" }}>
                Filtered By{" "}
                {filterLabel
                  .map((value) => {
                    return value;
                  })
                  .join(", ")}
              </h5>
            </div>
          ) : (
            <></>
          )}

          <div className={style["table-container"]}>
            <table className={style.table} responsive>
              <thead className={style.thead}>
                <tr>
                  <th
                    style={{ width: "4%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    No Pelayanan
                  </th>
                  <th
                    style={{ width: "6%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Aksi
                  </th>
                  <th
                    style={{ width: "20%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Jenis Pelayanan
                  </th>
                  <th colSpan={2}>Total Pasien</th>
                  <th colSpan={3}>Tindak Lanjut Pelayanan</th>
                  <th colSpan={2}>Mati di IGD</th>
                  <th colSpan={2}>DOA</th>
                  <th colSpan={2}>Luka-luka</th>
                  <th style={{ verticalAlign: "middle" }} rowSpan={2}>
                    False Emergency
                  </th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th>Rujukan</th>
                  <th>Non Rujukan</th>
                  <th>Dirawat</th>
                  <th>Dirujuk</th>
                  <th>Pulang</th>
                  <th style={{ width: "5%" }}>Laki-laki</th>
                  <th style={{ width: "5%" }}>Perempuan</th>
                  <th style={{ width: "5%" }}>Laki-laki</th>
                  <th style={{ width: "5%" }}>Perempuan</th>
                  <th style={{ width: "5%" }}>Laki-laki</th>
                  <th style={{ width: "5%" }}>Perempuan</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.length > 0 ? (
                  <>
                    {dataRL
                      .filter(
                        (value) =>
                          value.total_pasien_rujukan > 0 ||
                          value.total_pasien_non_rujukan > 0
                      )
                      .map((value, index) => {
                        return (
                          <tr key={value.id}>
                            <td className={style["sticky-column"]}>
                              <input
                                type="text"
                                name="no"
                                className="form-control"
                                value={
                                  value.jenis_pelayanan_rl_tiga_titik_tiga.no
                                }
                                disabled={true}
                              />
                            </td>
                            <td
                              className={style["sticky-column"]}
                              style={{
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <ToastContainer />
                              {value.jenis_pelayanan_rl_tiga_titik_tiga.no !=
                                1 &&
                              value.jenis_pelayanan_rl_tiga_titik_tiga.no !=
                                2 ? (
                                <div style={{ display: "flex" }}>
                                  <button
                                    className="btn btn-danger"
                                    style={{
                                      margin: "0 5px 0 0",
                                      backgroundColor: "#FF6663",
                                      border: "1px solid #FF6663",
                                    }}
                                    type="button"
                                    onClick={(e) => hapus(value.id)}
                                  >
                                    Hapus
                                  </button>
                                  <Link
                                    to={`/rl33/ubah/${value.id}`}
                                    className="btn btn-warning"
                                    style={{
                                      margin: "0 5px 0 0",
                                      backgroundColor: "#CFD35E",
                                      border: "1px solid #CFD35E",
                                      color: "#FFFFFF",
                                    }}
                                  >
                                    Ubah
                                  </Link>
                                </div>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className={style["sticky-column"]}>
                              <input
                                type="text"
                                name="jenisKegiatan"
                                className="form-control"
                                value={
                                  value.jenis_pelayanan_rl_tiga_titik_tiga.nama
                                }
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="total_pasien_rujukan"
                                className="form-control"
                                value={value.total_pasien_rujukan}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="total_pasien_non_rujukan"
                                className="form-control"
                                value={value.total_pasien_non_rujukan}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="tlp_dirawat"
                                className="form-control"
                                value={value.tlp_dirawat}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="tlp_dirujuk"
                                className="form-control"
                                value={value.tlp_dirujuk}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="tlp_pulang"
                                className="form-control"
                                value={value.tlp_pulang}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="m_igd_laki"
                                className="form-control"
                                value={value.m_igd_laki}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="m_igd_perempuan"
                                className="form-control"
                                value={value.m_igd_perempuan}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="doa_laki"
                                className="form-control"
                                value={value.doa_laki}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="doa_perempuan"
                                className="form-control"
                                value={value.doa_perempuan}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="luka_laki"
                                className="form-control"
                                value={value.luka_laki}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="luka_perempuan"
                                className="form-control"
                                value={value.luka_perempuan}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="false_emergency"
                                className="form-control"
                                value={value.false_emergency}
                                disabled={true}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    <tr className="row-total">
                      <td></td>
                      <td></td>
                      <td
                        // colSpan={3}
                        style={{ textAlign: "center" }}
                        className={style["sticky-column"]}
                      >
                        <strong>Total</strong>
                      </td>
                      <td className="text-center">
                        {total.total_pasien_rujukan}
                      </td>
                      <td className="text-center">
                        {total.total_pasien_non_rujukan}
                      </td>
                      <td className="text-center">{total.tlp_dirawat}</td>
                      <td className="text-center">{total.tlp_dirujuk}</td>
                      <td className="text-center">{total.tlp_pulang}</td>
                      <td className="text-center">{total.m_igd_laki}</td>
                      <td className="text-center">{total.m_igd_perempuan}</td>
                      <td className="text-center">{total.doa_laki}</td>
                      <td className="text-center">{total.doa_perempuan}</td>
                      <td className="text-center">{total.luka_laki}</td>
                      <td className="text-center">{total.luka_perempuan}</td>
                      <td className="text-center">{total.false_emergency}</td>
                    </tr>
                  </>
                ) : (
                  <></>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL33;
