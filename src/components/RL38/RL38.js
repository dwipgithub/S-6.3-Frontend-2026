import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL38.module.css";
import { HiSaveAs } from "react-icons/hi";
import { RiDeleteBin5Fill, RiEdit2Fill } from "react-icons/ri";
import { AiFillFileAdd } from "react-icons/ai";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const RL38 = () => {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState("2025");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const [totalJumlahLaki, setTotalJumlahLaki] = useState(0);
  const [totalJumlahPerempuan, setTotalJumlahPerempuan] = useState(0);
  const [totalRataLaki, setTotalRataLaki] = useState(0);
  const [totalRataPerempuan, setTotalRataPerempuan] = useState(0);
  const [spinner, setSpinner] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const [activeTab, setActiveTab] = useState("tab1");
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [submittedBulan, setSubmittedBulan] = useState(null);
  const [submittedTahun, setSubmittedTahun] = useState(null);
  const [submittedRumahSakit, setSubmittedRumahSakit] = useState(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
  }, []);

  useEffect(() => {
    if (activeTab === "tab2" && submittedRumahSakit && submittedRumahSakit.id && submittedBulan !== null && submittedTahun) {
      getValidasi();
    }
  }, [submittedBulan, submittedTahun, submittedRumahSakit, activeTab]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setUser(decoded);
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      } else if (decoded.jenisUserId === 4) {
        if (!rumahSakit || !rumahSakit.id) {
          showRumahSakit(decoded.satKerId, accessToken);
        }
      }

      setExpire(decoded.exp);
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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "01",
    });
    results.push({
      key: "Februari",
      value: "02",
    });
    results.push({
      key: "Maret",
      value: "03",
    });
    results.push({
      key: "April",
      value: "04",
    });
    results.push({
      key: "Mei",
      value: "05",
    });
    results.push({
      key: "Juni",
      value: "06",
    });
    results.push({
      key: "Juli",
      value: "07",
    });
    results.push({
      key: "Agustus",
      value: "08",
    });
    results.push({
      key: "September",
      value: "09",
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
  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    getRumahSakit(kabKotaId);
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

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

  const showRumahSakit = async (id, tokenOverride) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${tokenOverride || token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getRL = async (e) => {
    e.preventDefault();
    setSpinner(true);
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      setSpinner(false);
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    
    setValidasiId(null);
    setStatusValidasi(0);
    setKeteranganValidasi("");
    setDataValidasi(null);

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(bulan),
        },
      };

      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapan",
        customConfig
      );

      const rlTemplate = detailkegiatan.data.data.map((value, index) => {
        return {
          id: value.id,
          groupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.no,
          groupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.nama,
          subGroupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.id,
          subGroupNo:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.no,
          subGroupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.nama,
          jenisKegiatanId: value.rl_tiga_titik_delapan_pemeriksaan.id,
          jenisKegiatanNo: value.rl_tiga_titik_delapan_pemeriksaan.no,
          jenisKegiatanNama: value.rl_tiga_titik_delapan_pemeriksaan.nama,
          jumlahLaki: value.jumlahLaki,
          jumlahPerempuan: value.jumlahPerempuan,
          rataLaki: value.rataLaki,
          rataPerempuan: value.rataPerempuan,
        };
      });

      let subGroups = [];
      rlTemplate.reduce(function (res, value) {
        if (!res[value.subGroupId]) {
          res[value.subGroupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            subGroupId: value.subGroupId,
            subGroupNo: value.subGroupNo,
            subGroupNama: value.subGroupNama,
            subGroupJumlahLaki: 0,
            subGroupJumlahPerempuan: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupJumlahLaki += value.jumlahLaki;
        res[value.subGroupId].subGroupJumlahPerempuan += value.jumlahPerempuan;
        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupJumlahLaki: 0,
            groupJumlahPerempuan: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupJumlahLaki += value.subGroupJumlahLaki;
        res[value.groupId].groupJumlahPerempuan +=
          value.subGroupJumlahPerempuan;
        return res;
      }, {});

      let satu = [];
      let dua = [];

      subGroups.forEach((element2) => {
        const filterData2 = rlTemplate.filter((value2, index2) => {
          return value2.subGroupId === element2.subGroupId;
        });
        dua.push({
          groupId: element2.groupId,
          subGroupId: element2.subGroupId,
          subGroupNo: element2.subGroupNo,
          subGroupNama: element2.subGroupNama,
          subGroupJumlahLaki: element2.subGroupJumlahLaki,
          subGroupJumlahPerempuan: element2.subGroupJumlahPerempuan,
          kegiatan: filterData2,
        });
      });

      groups.forEach((element) => {
        const filterData = dua.filter((value, index) => {
          return value.groupId === element.groupId;
        });
        satu.push({
          groupId: element.groupId,
          groupNama: element.groupNama,
          groupJumlahLaki: element.groupJumlahLaki,
          groupJumlahPerempuan: element.groupJumlahPerempuan,
          details: filterData,
        });
      });

      let totalL = 0;
      let totalP = 0;
      let totalRL = 0;
      let totalRP = 0;

      satu.forEach((value) => {
        if (value.groupNama != null) {
          value.details.forEach((value2) => {
            value2.kegiatan.forEach((value3) => {
              totalL += value3.jumlahLaki;
              totalP += value3.jumlahPerempuan;
              totalRL += value3.rataLaki;
              totalRP += value3.rataPerempuan;
            });
          });
        }
      });

      setTotalJumlahLaki(totalL);
      setTotalJumlahPerempuan(totalP);
      setTotalRataLaki(totalRL);
      setTotalRataPerempuan(totalRP);
      setDataRL(satu);
      setNamaFile(
        "rl38_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setRumahSakit(null);
      handleClose();
      setSpinner(false);

      setSubmittedBulan(bulan);
      setSubmittedTahun(tahun);
      setSubmittedRumahSakit(rumahSakit);

      if (activeTab === "tab2") {
        getValidasi();
      }
    } catch (error) {
      console.log(error);
      setSpinner(false);
      toast("Gagal mengambil data RL", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    }
  };

  const deleteRL = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitikdelapan/${id}`,
        customConfig
      );
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      try {
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(bulan),
          },
        };
        const detailkegiatan = await axiosJWT.get(
          "/apisirs6v2/rltigatitikdelapan",
          customConfig
        );

        const rlTemplate = detailkegiatan.data.data.map((value, index) => {
          return {
            id: value.id,
            groupId:
              value.rl_tiga_titik_delapan_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan_header.no,
            groupNama:
              value.rl_tiga_titik_delapan_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan_header.nama,
            subGroupId:
              value.rl_tiga_titik_delapan_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan.id,
            subGroupNo:
              value.rl_tiga_titik_delapan_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan.no,
            subGroupNama:
              value.rl_tiga_titik_delapan_pemeriksaan
                .rl_tiga_titik_delapan_group_pemeriksaan.nama,
            jenisKegiatanId: value.rl_tiga_titik_delapan_pemeriksaan.id,
            jenisKegiatanNo: value.rl_tiga_titik_delapan_pemeriksaan.no,
            jenisKegiatanNama: value.rl_tiga_titik_delapan_pemeriksaan.nama,
            jumlahLaki: value.jumlahLaki,
            jumlahPerempuan: value.jumlahPerempuan,
            rataLaki: value.rataLaki,
            rataPerempuan: value.rataPerempuan,
          };
        });

        let subGroups = [];
        rlTemplate.reduce(function (res, value) {
          if (!res[value.subGroupId]) {
            res[value.subGroupId] = {
              groupId: value.groupId,
              groupNama: value.groupNama,
              subGroupId: value.subGroupId,
              subGroupNo: value.subGroupNo,
              subGroupNama: value.subGroupNama,
              subGroupJumlahLaki: 0,
              subGroupJumlahPerempuan: 0,
            };
            subGroups.push(res[value.subGroupId]);
          }
          res[value.subGroupId].subGroupJumlahLaki += value.jumlahLaki;
          res[value.subGroupId].subGroupJumlahPerempuan += value.jumlahPerempuan;
          return res;
        }, {});

        let groups = [];
        subGroups.reduce(function (res, value) {
          if (!res[value.groupId]) {
            res[value.groupId] = {
              groupId: value.groupId,
              groupNama: value.groupNama,
              groupJumlahLaki: 0,
              groupJumlahPerempuan: 0,
            };
            groups.push(res[value.groupId]);
          }
          res[value.groupId].groupJumlahLaki += value.subGroupJumlahLaki;
          res[value.groupId].groupJumlahPerempuan +=
            value.subGroupJumlahPerempuan;
          return res;
        }, {});

        let satu = [];
        let dua = [];

        subGroups.forEach((element2) => {
          const filterData2 = rlTemplate.filter((value2, index2) => {
            return value2.subGroupId === element2.subGroupId;
          });
          dua.push({
            groupId: element2.groupId,
            subGroupId: element2.subGroupId,
            subGroupNo: element2.subGroupNo,
            subGroupNama: element2.subGroupNama,
            subGroupJumlahLaki: element2.subGroupJumlahLaki,
            subGroupJumlahPerempuan: element2.subGroupJumlahPerempuan,
            kegiatan: filterData2,
          });
        });

        groups.forEach((element) => {
          const filterData = dua.filter((value, index) => {
            return value.groupId === element.groupId;
          });
          satu.push({
            groupId: element.groupId,
            groupNama: element.groupNama,
            groupJumlahLaki: element.groupJumlahLaki,
            groupJumlahPerempuan: element.groupJumlahPerempuan,
            details: filterData,
          });
        });

        let totalL = 0;
        let totalP = 0;
        let totalRL = 0;
        let totalRP = 0;

        satu.forEach((value) => {
          if (value.groupNama != null) {
            value.details.forEach((value2) => {
              value2.kegiatan.forEach((value3) => {
                totalL += value3.jumlahLaki;
                totalP += value3.jumlahPerempuan;
                totalRL += value3.rataLaki;
                totalRP += value3.rataPerempuan;
              });
            });
          }
        });

        setTotalJumlahLaki(totalL);
        setTotalJumlahPerempuan(totalP);
        setTotalRataLaki(totalRL);
        setTotalRataPerempuan(totalRP);
        setDataRL(satu);
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    }
  };

  const getValidasi = async () => {
    try {
      if (!submittedRumahSakit || !submittedRumahSakit.id) {
        return;
      }
      const periode = String(submittedTahun).concat("-").concat(submittedBulan);
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: submittedRumahSakit.id,
          periode: periode,
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapanvalidasi",
        customConfig
      );

      if (response.data.data && response.data.data.length > 0) {
        const validasi = response.data.data[0];
        setValidasiId(validasi.id);
        setStatusValidasi(validasi.statusValidasiId);
        setKeteranganValidasi(validasi.catatan || "");
        setDataValidasi(validasi);
      } else {
        setValidasiId(null);
        setStatusValidasi(0);
        setKeteranganValidasi("");
        setDataValidasi(null);
      }
    } catch (error) {
      console.log(error);
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();

    if (!submittedRumahSakit || !submittedRumahSakit.id) {
      toast("Rumah sakit harus dipilih dan filter diterapkan terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    if (parseInt(statusValidasi, 10) === 0) {
      toast("Status harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      let payload = {
        statusValidasiId: parseInt(statusValidasi, 10),
      };

      if (user.jenisUserId !== 4) {
        payload.catatan = keteranganValidasi;
      }

      console.log("Payload yang dikirim:", payload);
      console.log("ValidasiId:", validasiId);

      if (validasiId) {
        const response = await axiosJWT.patch(
          `/apisirs6v2/rltigatitikdelapanvalidasi/${validasiId}`,
          payload,
          customConfig
        );

        console.log("Response PATCH:", response.data);

        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });

        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        let createPayload = {
          rsId: submittedRumahSakit.id,
          periode: String(submittedTahun).concat("-").concat(submittedBulan),
          jenisPeriode: 1,
          statusValidasiId: parseInt(statusValidasi, 10),
        };

        if (user.jenisUserId !== 4) {
          createPayload.catatan = keteranganValidasi;
        }

        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitikdelapanvalidasi",
          createPayload,
          customConfig
        );

        setValidasiId(response.data.data.id);

        toast("Data Validasi Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });

        setTimeout(() => {
          getValidasi();
        }, 1500);
      }
    } catch (error) {
      console.log(error);

      toast(
        `Data tidak bisa disimpan karena: ${
          error.response?.data?.message || error.message
        }`,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        }
      );
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            deleteRL(id);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };
  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan("01");
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan("01");
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleDownloadExcel = () => {
    const header = ["No", "Jenis Pemeriksaan", "Jumlah Pemeriksaan (Laki-laki)", "Jumlah Pemeriksaan (Perempuan)", "Rata-Rata (Laki-laki)", "Rata-Rata (Perempuan)"];
    const body = [];

    dataRL.forEach(value => {
      if (value.groupNama != null) {
        value.details.forEach(value2 => {
          value2.kegiatan.forEach(value3 => {
            body.push([
              value3.jenisKegiatanNo,
              value3.jenisKegiatanNama,
              value3.jumlahLaki,
              value3.jumlahPerempuan,
              value3.rataLaki,
              value3.rataPerempuan
            ]);
          });
        });
      }
    });

    body.push(["99", "TOTAL", totalJumlahLaki, totalJumlahPerempuan, totalRataLaki, totalRataPerempuan]);

    downloadExcel({
      fileName: "RL_3_8",
      sheet: "Data RL 38",
      tablePayload: {
        header,
        body,
      },
    });
  };

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <ToastContainer autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getRL}>
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
                    onChange={(e) => provinsiChangeHandler(e)}
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
                    onChange={(e) => kabKotaChangeHandler(e)}
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
                    onChange={(e) => kabKotaChangeHandler(e)}
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => tahunChangeHandler(e)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
            <h4 className={style.pageHeader}> RL. 3.8 - Laboratorium</h4>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl38/tambah/`}
                 type="button"
                 className={style.btnPrimary}
                 style={{ textDecoration: "none" }}
              >
                Tambah
              </Link>
            ) : (
              <></>
            )}
            <button
               type="button"
               className={style.btnPrimary}
              onClick={handleShow}
            >
              Filter
            </button>
            <button
               type="button"
               className={style.btnPrimary}
               onClick={handleDownloadExcel}
            >
              Download
            </button>
          </div>

          {filterLabel.length > 0 ? (
            <div>
              <h5 style={{ fontSize: "14px" }}>
                filtered by{" "}
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

          <div>
            <ul className={`nav nav-tabs ${style.navTabs}`}>
              <li className={`nav-item ${style.navItem}`}>
                <button type="button" className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`} onClick={() => handleTabClick("tab1")}>Data</button>
              </li>
              <li className={`nav-item ${style.navItem}`}>
                <button type="button" className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`} onClick={() => handleTabClick("tab2")}>Validasi</button>
              </li>
            </ul>
            <div className={`tab-content ${style.tabContent}`}>
              <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
                <div className={style["table-container"]}>
                   <table className={style["table"]} ref={tableRef}>
                      <thead className={style["thead"]}>
                <tr className="main-header-row">
                  <th
                    style={{ width: "4%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    No.
                  </th>
                  {user.jenisUserId === 4
                   ?
                  <th
                    style={{ width: "15%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Aksi
                  </th>
                  : <>
                     </>
                      }
                  <th
                    style={{ width: "50%", textAlign: "center" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Jenis Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                    Jumlah Pemeriksaan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }} className={style["sticky-header-view"]}>
                    Rata-Rata Pemeriksaan
                  </th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Laki-Laki</th>
                  <th style={{ textAlign: "center" }} className={style["sticky-header-view"]}>Perempuan</th>
                </tr>
              </thead>
              <tbody>
                {
                  //eslint-disable-next-line
                  dataRL.map((value, index) => {
                    if (value.groupNama != null) {
                      return (
                        <React.Fragment key={index}>
                          <tr
                            style={{
                              textAlign: "center",
                              backgroundColor: "#C4DFAA",
                              fontWeight: "bold",
                            }}
                          >
                            <td className={style["sticky-column"]}>
                              {value.groupId}
                            </td>
                            {user.jenisUserId === 4
                   ?
                            <td className={style["sticky-column"]}></td>
                            : <>
                     </>
                      }
                            <td className={style["sticky-column"]}>
                              {value.groupNama}
                            </td>
                            <td>{value.groupJumlahLaki}</td>
                            <td>{value.groupJumlahPerempuan}</td>
                            <td></td>
                            <td></td>
                          </tr>
                          {value.details.map((value2, index2) => {
                            return (
                              <React.Fragment key={index2}>
                                <tr
                                  style={{
                                    textAlign: "center",
                                    backgroundColor: "#DCE8C8",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <td className={style["sticky-column"]}>
                                    {value2.subGroupNo}
                                  </td>
                                  {user.jenisUserId === 4
                   ?
                                  <td className={style["sticky-column"]}></td>
                                  : <>
                     </>
                      }
                                  <td className={style["sticky-column"]}>
                                    {value2.subGroupNama}
                                  </td>
                                  <td>{value2.subGroupJumlahLaki}</td>
                                  <td>{value2.subGroupJumlahPerempuan}</td>
                                  <td></td>
                                  <td></td>
                                </tr>
                                {value2.kegiatan.map((value3, index3) => {
                                  return (
                                    <tr key={index3}>
                                      <td className={style["sticky-column"]}>
                                        {value3.jenisKegiatanNo}
                                      </td>
                                      {user.jenisUserId === 4
                   ?
                                      <td
                                        className={style["sticky-column"]}
                                        style={{
                                          textAlign: "center",
                                          verticalAlign: "middle",
                                        }}
                                      >
                                        <div style={{ display: "flex", gap: "8px" }}>
                                          <button
                                            className={style.btnDanger}
                                            type="button"
                                            onClick={(e) => hapus(value3.id)}
                                          >
                                            Hapus
                                          </button>
                                          {value3.jenisKegiatanNama !== "Tidak Ada Data" && (
                                            <Link
                                              to={`/rl38/ubah/${value3.id}`}
                                              className={style.btnWarning}
                                              style={{ textDecoration: "none" }}
                                            >
                                              Ubah
                                            </Link>
                                          )}
                                        </div>
                                      </td>
                                      : <>
                     </>
                      }
                                      <td className={style["sticky-column"]}>
                                        &emsp;{value3.jenisKegiatanNama}
                                      </td>
                                      <td>{value3.jumlahLaki}</td>
                                      <td>{value3.jumlahPerempuan}</td>
                                      <td>{value3.rataLaki}</td>
                                      <td>{value3.rataPerempuan}</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                  })
                }

                {dataRL.length > 0 ? (
                  <tr>
                    <td colSpan={1}>99</td>
                    {user.jenisUserId === 4 ?
                    <td colSpan={2}>TOTAL</td>
                    :
                    <td colSpan={1}>TOTAL</td>
                    }
                    <td>{totalJumlahLaki}</td>
                    <td>{totalJumlahPerempuan}</td>
                    <td>{totalRataLaki}</td>
                    <td>{totalRataPerempuan}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.8</h3>

                  {dataRL.length === 0 ? (
                    <div
                      style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
                    </div>
                  ) : !dataValidasi && user.jenisUserId === 4 ? (
                    <div
                      style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <strong>Data Belum di Validasi</strong>
                    </div>
                  ) : (
                    <>
                      {dataValidasi && (
                        <div
                          style={{
                            backgroundColor: "#f0f0f0",
                            padding: "12px",
                            borderRadius: "4px",
                            marginBottom: "15px",
                          }}
                        >
                          <div style={{ display: "flex", marginBottom: "4px" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Status
                            </div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {dataValidasi.statusValidasiId === 1
                                ? "Perlu Perbaikan"
                                : dataValidasi.statusValidasiId === 2
                                ? "Selesai Diperbaiki"
                                : dataValidasi.statusValidasiId === 3
                                ? "Disetujui"
                                : "-"}
                            </div>
                          </div>

                          {(dataValidasi.keteranganValidasi || dataValidasi.catatan || dataValidasi.keterangan) && (
                            <div style={{ display: "flex", marginBottom: "4px" }}>
                              <div
                                style={{
                                  width: "90px",
                                  textAlign: "left",
                                  paddingRight: "8px",
                                  fontWeight: "600",
                                }}
                              >
                                Catatan
                              </div>
                              <div style={{ width: "10px" }}>:</div>
                              <div>
                                {dataValidasi.keteranganValidasi || dataValidasi.catatan || dataValidasi.keterangan}
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Dibuat
                            </div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </div>
                        </div>
                      )}

                      {dataValidasi && dataValidasi.statusValidasiId === 3 ? (
                        <div
                          style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          <strong>Data telah divalidasi.</strong>
                        </div>
                      ) : (
                        <form onSubmit={simpanValidasi}>
                          <div className={style.validasiFormGroup}>
                            <label>Status</label>
                            <select value={statusValidasi} onChange={statusValidasiChangeHadler}>
                              <option value={0}>Pilih</option>
                              {user.jenisUserId === 4 ? (
                                <option value="2">Selesai Diperbaiki</option>
                              ) : (
                                <>
                                  <option value="1">Perlu Perbaikan</option>
                                  <option value="3">Disetujui</option>
                                </>
                              )}
                            </select>
                          </div>

                          {user.jenisUserId !== 4 && (
                            <div className={style.validasiFormGroup}>
                              <label>Catatan</label>
                              <textarea
                                onChange={keteranganValidasiChangeHadler}
                                rows={4}
                                value={keteranganValidasi}
                              />
                            </div>
                          )}

                          <button type="submit" className={style.btnPrimary}>
                            <HiSaveAs size={20} /> {validasiId ? "Perbarui" : "Simpan"}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL38;
