import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL37.module.css";
import { HiSaveAs } from "react-icons/hi";
import { RiDeleteBin5Fill, RiEdit2Fill } from "react-icons/ri";
import { AiFillFileAdd } from "react-icons/ai";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL37 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState(2025);
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
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const tableRef = useRef(null);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    // const getLastYear = async () =>{
    //     const date = new Date()
    //     setTahun(date.getFullYear())
    //     return date.getFullYear()
    // }
    // getLastYear().then((results) => {
    //     // getDataRLTigaTitikTujuh(results)
    // })

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

  const getBulan = async () => {
    const results = [];
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

  const getDataRLTigaTitikTujuh = async (event) => {
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: event,
        },
      };
      // const results = await axiosJWT.get('/apisirs6v2/rltigatitiktujuh',
      //     customConfig)

      // const rlTigaTitikTujuhDetails = results.data.data.map((value) => {
      //     return value.rl_tiga_titik_tujuh_details
      // })

      // let dataRLTigaTitikEnamDetails = []
      // rlTigaTitikEnamDetails.forEach(element => {
      //     element.forEach(value => {
      //         dataRLTigaTitikEnamDetails.push(value)
      //     })
      // })
      // // setDataRL(dataRLTigaTitikEnamDetails)

      // let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
      //             p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
      //         ? 1
      //         : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
      //         ? -1
      //         : 0
      // )

      // console.log(sortedProducts)

      // let groups = []

      // sortedProducts.reduce(function (res, value) {
      //     if (!res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]) {
      //         res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id] = {
      //         groupId: value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
      //         groupNama:
      //             value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
      //         groupNo:
      //             value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
      //         // jumlah: 0,
      //         rmRumahSakit: 0,
      //         rmBidan: 0,
      //         rmPuskesmas: 0,
      //         rmFaskesLainnya: 0,
      //         rmHidup: 0,
      //         rmMati: 0,
      //         rmTotal: 0,
      //         rnmHidup: 0,
      //         rnmMati: 0,
      //         rnmTotal: 0,
      //         nrHidup: 0,
      //         nrMati: 0,
      //         nrTotal: 0,
      //         dirujuk: 0

      //         };
      //         groups.push(
      //         res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
      //         )
      //     }
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmRumahSakit +=
      //         value.rmRumahSakit
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmBidan +=
      //         value.rmBidan
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmPuskesmas +=
      //         value.rmPuskesmas
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmFaskesLainnya +=
      //         value.rmFaskesLainnya
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmHidup +=
      //         value.rmHidup
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmMati +=
      //         value.rmMati
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rmTotal +=
      //         value.rmTotal
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rnmHidup +=
      //         value.rnmHidup
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rnmMati +=
      //         value.rnmMati
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].rnmTotal +=
      //         value.rnmTotal
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].nrHidup +=
      //         value.nrHidup
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].nrMati +=
      //         value.nrMati
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].nrTotal +=
      //         value.nrTotal
      //     res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id].dirujuk +=
      //         value.dirujuk
      //     return res;
      // }, {})

      // let data = []

      // groups.forEach((element) => {
      // if (element.groupId != null) {
      //     const filterData = sortedProducts.filter((value, index) => {
      //     return (
      //         value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id ===
      //         element.groupId
      //     );
      //     });
      //     data.push({
      //     groupId: element.groupId,
      //     groupNo: element.groupNo,
      //     groupNama: element.groupNama,
      //     details: filterData,
      //     // subTotal: element.jumlah,
      //     subTotalRmRumahSakit: element.rmRumahSakit,
      //     subTotalRmBidan: element.rmBidan,
      //     subTotalRmPuskesmas: element.rmPuskesmas,
      //     subTotalRmFaskesLainnya: element.rmFaskesLainnya,
      //     subTotalRmHidup: element.rmHidup,
      //     subTotalRmMati: element.rmMati,
      //     subTotalRmTotal: element.rmTotal,
      //     subTotalRnmHidup: element.rnmHidup,
      //     subTotalRnmMati: element.rnmMati,
      //     subTotalRnmTotal: element.rnmTotal,
      //     subTotalNrHidup: element.nrHidup,
      //     subTotalNrMati: element.nrMati,
      //     subTotalNrTotal: element.nrTotal,
      //     subTotalDirujuk: element.dirujuk
      //     })
      // }
      // })
      // console.log(data)

      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktujuh",
        customConfig
      );

      const rlTemplate = detailkegiatan.data.data.map((value, index) => {
        return {
          id: value.id,
          groupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.id,
          groupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.nama,
          subGroupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.id,
          subGroupNo:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.no,
          subGroupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          jenisKegiatanId: value.jenis_kegiatan_rl_tiga_titik_tujuh.id,
          jenisKegiatanNo: value.jenis_kegiatan_rl_tiga_titik_tujuh.no,
          jenisKegiatanNama: value.jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          rmRumahSakit: value.rmRumahSakit,
          rmBidan: value.rmBidan,
          rmPuskesmas: value.rmPuskesmas,
          rmFaskesLainnya: value.rmFaskesLainnya,
          rmHidup: value.rmHidup,
          rmMati: value.rmMati,
          rmTotal: value.rmTotal,
          rnmHidup: value.rnmHidup,
          rnmMati: value.rnmMati,
          rnmTotal: value.rnmTotal,
          nrHidup: value.nrHidup,
          nrMati: value.nrMati,
          nrTotal: value.nrTotal,
          dirujuk: value.dirujuk,
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
            subGroupRmRumahSakit: 0,
            subGroupRmBidan: 0,
            subGroupRmPuskesmas: 0,
            subGroupRmFaskesLainnya: 0,
            subGroupRmHidup: 0,
            subGroupRmMati: 0,
            subGroupRmTotal: 0,
            subGroupRnmHidup: 0,
            subGroupRnmMati: 0,
            subGroupRnmTotal: 0,
            subGroupNrHidup: 0,
            subGroupNrMati: 0,
            subGroupNrTotal: 0,
            subGroupDirujuk: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupRmRumahSakit += value.rmRumahSakit;
        res[value.subGroupId].subGroupRmBidan += value.rmBidan;
        res[value.subGroupId].subGroupRmPuskesmas += value.rmPuskesmas;
        res[value.subGroupId].subGroupRmFaskesLainnya += value.rmFaskesLainnya;
        res[value.subGroupId].subGroupRmHidup += value.rmHidup;
        res[value.subGroupId].subGroupRmMati += value.rmMati;
        res[value.subGroupId].subGroupRmTotal += value.rmTotal;
        res[value.subGroupId].subGroupRnmHidup += value.rnmHidup;
        res[value.subGroupId].subGroupRnmMati += value.rnmMati;
        res[value.subGroupId].subGroupRnmTotal += value.rnmTotal;
        res[value.subGroupId].subGroupNrHidup += value.nrHidup;
        res[value.subGroupId].subGroupNrMati += value.nrMati;
        res[value.subGroupId].subGroupNrTotal += value.nrTotal;
        res[value.subGroupId].subGroupDirujuk += value.dirujuk;

        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupRmRumahSakit: 0,
            groupRmBidan: 0,
            groupRmPuskesmas: 0,
            groupRmFaskesLainnya: 0,
            groupRmHidup: 0,
            groupRmMati: 0,
            groupRmTotal: 0,
            groupRnmHidup: 0,
            groupRnmMati: 0,
            groupRnmTotal: 0,
            groupNrHidup: 0,
            groupNrMati: 0,
            groupNrTotal: 0,
            groupDirujuk: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupRmRumahSakit += value.subGroupRmRumahSakit;
        res[value.groupId].groupRmBidan += value.subGroupRmBidan;
        res[value.groupId].groupRmPuskesmas += value.subGroupRmPuskesmas;
        res[value.groupId].groupRmFaskesLainnya +=
          value.subGroupRmFaskesLainnya;
        res[value.groupId].groupRmHidup += value.subGroupRmHidup;
        res[value.groupId].groupRmMati += value.subGroupRmMati;
        res[value.groupId].groupRmTotal += value.subGroupRmTotal;
        res[value.groupId].groupRnmHidup += value.subGroupRnmHidup;
        res[value.groupId].groupRnmMati += value.subGroupRnmMati;
        res[value.groupId].groupRnmTotal += value.subGroupRnmTotal;
        res[value.groupId].groupNrHidup += value.subGroupNrHidup;
        res[value.groupId].groupNrMati += value.subGroupNrMati;
        res[value.groupId].groupNrTotal += value.subGroupNrTotal;
        res[value.groupId].groupDirujuk += value.subGroupDirujuk;
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
          subGroupNilai: element2.subGroupNilai,
          subGroupRmRumahSakit: element2.subGroupRmRumahSakit,
          subGroupRmBidan: element2.subGroupRmBidan,
          subGroupRmPuskesmas: element2.subGroupRmPuskesmas,
          subGroupRmFaskesLainnya: element2.subGroupRmFaskesLainnya,
          subGroupRmHidup: element2.subGroupRmHidup,
          subGroupRmMati: element2.subGroupRmMati,
          subGroupRmTotal: element2.subGroupRmTotal,
          subGroupRnmHidup: element2.subGroupRnmHidup,
          subGroupRnmMati: element2.subGroupRnmMati,
          subGroupRnmTotal: element2.subGroupRnmTotal,
          subGroupNrHidup: element2.subGroupNrHidup,
          subGroupNrMati: element2.subGroupNrMati,
          subGroupNrTotal: element2.subGroupNrTotal,
          subGroupDirujuk: element2.subGroupDirujuk,
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
          groupNilai: element.groupNilai,
          groupRmRumahSakit: element.groupRmRumahSakit,
          groupRmBidan: element.groupRmBidan,
          groupRmPuskesmas: element.groupRmPuskesmas,
          groupRmFaskesLainnya: element.groupRmFaskesLainnya,
          groupRmHidup: element.groupRmHidup,
          groupRmMati: element.groupRmMati,
          groupRmTotal: element.groupRmTotal,
          groupRnmHidup: element.groupRnmHidup,
          groupRnmMati: element.groupRnmMati,
          groupRnmTotal: element.groupRnmTotal,
          groupNrHidup: element.groupNrHidup,
          groupNrMati: element.groupNrMati,
          groupNrTotal: element.groupNrTotal,
          groupDirujuk: element.groupDirujuk,
          details: filterData,
        });
      });

      console.log(satu);

      setDataRL(satu);

      setSpinner(false);
    } catch (error) {
      console.log(error);
      setSpinner(false);
    }
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
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        hapus();
      } else if (event.target.checked === false) {
        console.log("hello2");
      }
    }
  };

  const getRL = async (e) => {
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    setSpinner(true);
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("filtered by nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          tahun: date,
        },
      };
      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitiktujuh",
        customConfig
      );

      const rlTemplate = detailkegiatan.data.data.map((value, index) => {
        return {
          id: value.id,
          groupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.id,
          groupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.nama,
          subGroupId:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.id,
          subGroupNo:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.no,
          subGroupNama:
            value.jenis_kegiatan_rl_tiga_titik_tujuh
              .group_jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          jenisKegiatanId: value.jenis_kegiatan_rl_tiga_titik_tujuh.id,
          jenisKegiatanNo: value.jenis_kegiatan_rl_tiga_titik_tujuh.no,
          jenisKegiatanNama: value.jenis_kegiatan_rl_tiga_titik_tujuh.nama,
          rmRumahSakit: value.rmRumahSakit,
          rmBidan: value.rmBidan,
          rmPuskesmas: value.rmPuskesmas,
          rmFaskesLainnya: value.rmFaskesLainnya,
          rmHidup: value.rmHidup,
          rmMati: value.rmMati,
          rmTotal: value.rmTotal,
          rnmHidup: value.rnmHidup,
          rnmMati: value.rnmMati,
          rnmTotal: value.rnmTotal,
          nrHidup: value.nrHidup,
          nrMati: value.nrMati,
          nrTotal: value.nrTotal,
          dirujuk: value.dirujuk,
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
            subGroupRmRumahSakit: 0,
            subGroupRmBidan: 0,
            subGroupRmPuskesmas: 0,
            subGroupRmFaskesLainnya: 0,
            subGroupRmHidup: 0,
            subGroupRmMati: 0,
            subGroupRmTotal: 0,
            subGroupRnmHidup: 0,
            subGroupRnmMati: 0,
            subGroupRnmTotal: 0,
            subGroupNrHidup: 0,
            subGroupNrMati: 0,
            subGroupNrTotal: 0,
            subGroupDirujuk: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupRmRumahSakit += value.rmRumahSakit;
        res[value.subGroupId].subGroupRmBidan += value.rmBidan;
        res[value.subGroupId].subGroupRmPuskesmas += value.rmPuskesmas;
        res[value.subGroupId].subGroupRmFaskesLainnya += value.rmFaskesLainnya;
        res[value.subGroupId].subGroupRmHidup += value.rmHidup;
        res[value.subGroupId].subGroupRmMati += value.rmMati;
        res[value.subGroupId].subGroupRmTotal += value.rmTotal;
        res[value.subGroupId].subGroupRnmHidup += value.rnmHidup;
        res[value.subGroupId].subGroupRnmMati += value.rnmMati;
        res[value.subGroupId].subGroupRnmTotal += value.rnmTotal;
        res[value.subGroupId].subGroupNrHidup += value.nrHidup;
        res[value.subGroupId].subGroupNrMati += value.nrMati;
        res[value.subGroupId].subGroupNrTotal += value.nrTotal;
        res[value.subGroupId].subGroupDirujuk += value.dirujuk;

        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupRmRumahSakit: 0,
            groupRmBidan: 0,
            groupRmPuskesmas: 0,
            groupRmFaskesLainnya: 0,
            groupRmHidup: 0,
            groupRmMati: 0,
            groupRmTotal: 0,
            groupRnmHidup: 0,
            groupRnmMati: 0,
            groupRnmTotal: 0,
            groupNrHidup: 0,
            groupNrMati: 0,
            groupNrTotal: 0,
            groupDirujuk: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupRmRumahSakit += value.subGroupRmRumahSakit;
        res[value.groupId].groupRmBidan += value.subGroupRmBidan;
        res[value.groupId].groupRmPuskesmas += value.subGroupRmPuskesmas;
        res[value.groupId].groupRmFaskesLainnya +=
          value.subGroupRmFaskesLainnya;
        res[value.groupId].groupRmHidup += value.subGroupRmHidup;
        res[value.groupId].groupRmMati += value.subGroupRmMati;
        res[value.groupId].groupRmTotal += value.subGroupRmTotal;
        res[value.groupId].groupRnmHidup += value.subGroupRnmHidup;
        res[value.groupId].groupRnmMati += value.subGroupRnmMati;
        res[value.groupId].groupRnmTotal += value.subGroupRnmTotal;
        res[value.groupId].groupNrHidup += value.subGroupNrHidup;
        res[value.groupId].groupNrMati += value.subGroupNrMati;
        res[value.groupId].groupNrTotal += value.subGroupNrTotal;
        res[value.groupId].groupDirujuk += value.subGroupDirujuk;
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
          subGroupNilai: element2.subGroupNilai,
          subGroupRmRumahSakit: element2.subGroupRmRumahSakit,
          subGroupRmBidan: element2.subGroupRmBidan,
          subGroupRmPuskesmas: element2.subGroupRmPuskesmas,
          subGroupRmFaskesLainnya: element2.subGroupRmFaskesLainnya,
          subGroupRmHidup: element2.subGroupRmHidup,
          subGroupRmMati: element2.subGroupRmMati,
          subGroupRmTotal: element2.subGroupRmTotal,
          subGroupRnmHidup: element2.subGroupRnmHidup,
          subGroupRnmMati: element2.subGroupRnmMati,
          subGroupRnmTotal: element2.subGroupRnmTotal,
          subGroupNrHidup: element2.subGroupNrHidup,
          subGroupNrMati: element2.subGroupNrMati,
          subGroupNrTotal: element2.subGroupNrTotal,
          subGroupDirujuk: element2.subGroupDirujuk,
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
          groupNilai: element.groupNilai,
          groupRmRumahSakit: element.groupRmRumahSakit,
          groupRmBidan: element.groupRmBidan,
          groupRmPuskesmas: element.groupRmPuskesmas,
          groupRmFaskesLainnya: element.groupRmFaskesLainnya,
          groupRmHidup: element.groupRmHidup,
          groupRmMati: element.groupRmMati,
          groupRmTotal: element.groupRmTotal,
          groupRnmHidup: element.groupRnmHidup,
          groupRnmMati: element.groupRnmMati,
          groupRnmTotal: element.groupRnmTotal,
          groupNrHidup: element.groupNrHidup,
          groupNrMati: element.groupNrMati,
          groupNrTotal: element.groupNrTotal,
          groupDirujuk: element.groupDirujuk,
          details: filterData,
        });
      });

      console.log(satu);
      setDataRL(satu);
      setNamaFile(
        "RL37_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setSpinner(false);

      handleClose();
    } catch (error) {
      console.log(error);
      setSpinner(false);
    }
  };

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(`/apisirs6v2/rltigatitiktujuh/${id}`, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));

      // SET Data after delete
      let date = tahun + "-" + bulan + "-01";
      try {
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: rumahSakit.id,
            tahun: date,
          },
        };
        const detailkegiatan = await axiosJWT.get(
          "/apisirs6v2/rltigatitiktujuh",
          customConfig
        );

        const rlTemplate = detailkegiatan.data.data.map((value, index) => {
          console.log(detailkegiatan);
          return {
            id: value.id,
            groupId:
              value.jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.id,
            groupNama:
              value.jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_header_rl_tiga_titik_tujuh.nama,
            subGroupId:
              value.jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_rl_tiga_titik_tujuh.id,
            subGroupNo:
              value.jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_rl_tiga_titik_tujuh.no,
            subGroupNama:
              value.jenis_kegiatan_rl_tiga_titik_tujuh
                .group_jenis_kegiatan_rl_tiga_titik_tujuh.nama,
            jenisKegiatanId: value.jenis_kegiatan_rl_tiga_titik_tujuh.id,
            jenisKegiatanNo: value.jenis_kegiatan_rl_tiga_titik_tujuh.no,
            jenisKegiatanNama: value.jenis_kegiatan_rl_tiga_titik_tujuh.nama,
            rmRumahSakit: value.rmRumahSakit,
            rmBidan: value.rmBidan,
            rmPuskesmas: value.rmPuskesmas,
            rmFaskesLainnya: value.rmFaskesLainnya,
            rmHidup: value.rmHidup,
            rmMati: value.rmMati,
            rmTotal: value.rmTotal,
            rnmHidup: value.rnmHidup,
            rnmMati: value.rnmMati,
            rnmTotal: value.rnmTotal,
            nrHidup: value.nrHidup,
            nrMati: value.nrMati,
            nrTotal: value.nrTotal,
            dirujuk: value.dirujuk,
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
              subGroupRmRumahSakit: 0,
              subGroupRmBidan: 0,
              subGroupRmPuskesmas: 0,
              subGroupRmFaskesLainnya: 0,
              subGroupRmHidup: 0,
              subGroupRmMati: 0,
              subGroupRmTotal: 0,
              subGroupRnmHidup: 0,
              subGroupRnmMati: 0,
              subGroupRnmTotal: 0,
              subGroupNrHidup: 0,
              subGroupNrMati: 0,
              subGroupNrTotal: 0,
              subGroupDirujuk: 0,
            };
            subGroups.push(res[value.subGroupId]);
          }
          res[value.subGroupId].subGroupRmRumahSakit += value.rmRumahSakit;
          res[value.subGroupId].subGroupRmBidan += value.rmBidan;
          res[value.subGroupId].subGroupRmPuskesmas += value.rmPuskesmas;
          res[value.subGroupId].subGroupRmFaskesLainnya +=
            value.rmFaskesLainnya;
          res[value.subGroupId].subGroupRmHidup += value.rmHidup;
          res[value.subGroupId].subGroupRmMati += value.rmMati;
          res[value.subGroupId].subGroupRmTotal += value.rmTotal;
          res[value.subGroupId].subGroupRnmHidup += value.rnmHidup;
          res[value.subGroupId].subGroupRnmMati += value.rnmMati;
          res[value.subGroupId].subGroupRnmTotal += value.rnmTotal;
          res[value.subGroupId].subGroupNrHidup += value.nrHidup;
          res[value.subGroupId].subGroupNrMati += value.nrMati;
          res[value.subGroupId].subGroupNrTotal += value.nrTotal;
          res[value.subGroupId].subGroupDirujuk += value.dirujuk;

          return res;
        }, {});

        let groups = [];
        subGroups.reduce(function (res, value) {
          if (!res[value.groupId]) {
            res[value.groupId] = {
              groupId: value.groupId,
              groupNama: value.groupNama,
              groupRmRumahSakit: 0,
              groupRmBidan: 0,
              groupRmPuskesmas: 0,
              groupRmFaskesLainnya: 0,
              groupRmHidup: 0,
              groupRmMati: 0,
              groupRmTotal: 0,
              groupRnmHidup: 0,
              groupRnmMati: 0,
              groupRnmTotal: 0,
              groupNrHidup: 0,
              groupNrMati: 0,
              groupNrTotal: 0,
              groupDirujuk: 0,
            };
            groups.push(res[value.groupId]);
          }
          res[value.groupId].groupRmRumahSakit += value.subGroupRmRumahSakit;
          res[value.groupId].groupRmBidan += value.subGroupRmBidan;
          res[value.groupId].groupRmPuskesmas += value.subGroupRmPuskesmas;
          res[value.groupId].groupRmFaskesLainnya +=
            value.subGroupRmFaskesLainnya;
          res[value.groupId].groupRmHidup += value.subGroupRmHidup;
          res[value.groupId].groupRmMati += value.subGroupRmMati;
          res[value.groupId].groupRmTotal += value.subGroupRmTotal;
          res[value.groupId].groupRnmHidup += value.subGroupRnmHidup;
          res[value.groupId].groupRnmMati += value.subGroupRnmMati;
          res[value.groupId].groupRnmTotal += value.subGroupRnmTotal;
          res[value.groupId].groupNrHidup += value.subGroupNrHidup;
          res[value.groupId].groupNrMati += value.subGroupNrMati;
          res[value.groupId].groupNrTotal += value.subGroupNrTotal;
          res[value.groupId].groupDirujuk += value.subGroupDirujuk;
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
            subGroupNilai: element2.subGroupNilai,
            subGroupRmRumahSakit: element2.subGroupRmRumahSakit,
            subGroupRmBidan: element2.subGroupRmBidan,
            subGroupRmPuskesmas: element2.subGroupRmPuskesmas,
            subGroupRmFaskesLainnya: element2.subGroupRmFaskesLainnya,
            subGroupRmHidup: element2.subGroupRmHidup,
            subGroupRmMati: element2.subGroupRmMati,
            subGroupRmTotal: element2.subGroupRmTotal,
            subGroupRnmHidup: element2.subGroupRnmHidup,
            subGroupRnmMati: element2.subGroupRnmMati,
            subGroupRnmTotal: element2.subGroupRnmTotal,
            subGroupNrHidup: element2.subGroupNrHidup,
            subGroupNrMati: element2.subGroupNrMati,
            subGroupNrTotal: element2.subGroupNrTotal,
            subGroupDirujuk: element2.subGroupDirujuk,
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
            groupNilai: element.groupNilai,
            groupRmRumahSakit: element.groupRmRumahSakit,
            groupRmBidan: element.groupRmBidan,
            groupRmPuskesmas: element.groupRmPuskesmas,
            groupRmFaskesLainnya: element.groupRmFaskesLainnya,
            groupRmHidup: element.groupRmHidup,
            groupRmMati: element.groupRmMati,
            groupRmTotal: element.groupRmTotal,
            groupRnmHidup: element.groupRnmHidup,
            groupRnmMati: element.groupRnmMati,
            groupRnmTotal: element.groupRnmTotal,
            groupNrHidup: element.groupNrHidup,
            groupNrMati: element.groupNrMati,
            groupNrTotal: element.groupNrTotal,
            groupDirujuk: element.groupDirujuk,
            details: filterData,
          });
        });

        console.log(satu);

        setDataRL(satu);
      } catch (error) {
        console.log(error);
      }
      //

      // toast('Data Berhasil Dihapus', {
      //     position: toast.POSITION.TOP_RIGHT
      // })
    } catch (error) {
      console.log(error);
      toast("Data Gagal Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin? ",
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h4 style={{ color: "grey" }}>
        {" "}
        <span> RL 3.7-Neonatal, Bayi dan Balita </span>
      </h4>
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
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl37/tambah/`}
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
            {/* <button className='btn' style={{ fontSize: "18px", marginLeft: "5px", backgroundColor: "#779D9E", color: "#FFFFFF" }} onClick={handleDownloadExcel}>Download</button> */}
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 37"
              currentTableRef={tableRef.current}
            >
              {/* <button> Export excel </button> */}
              <button
                className="btn"
                style={{
                  fontSize: "18px",
                  marginLeft: "5px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {" "}
                Download
              </button>
            </DownloadTableExcel>
          </div>
          {/* <div className="col-md-2" style={{ fontSize: "14px", backgroundColor: "#779D9E", color: "#FFFFFF"}}>
                       
                        </div> */}
          <div>
            <h5 style={{ fontSize: "14px" }}>
              {filterLabel
                .map((value) => {
                  return value;
                })
                .join(", ")}
            </h5>
          </div>
          <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
            <table
              className={style.table}
              striped
              bordered
              responsive
              style={{ width: "200%" }}
              ref={tableRef}
            >
              <thead className={style.thead}>
                <tr className="main-header-row">
                  <th
                    className={style["sticky-header-view"]}
                    style={{ width: "2.5%" }}
                  >
                    No.
                  </th>
                  <th
                    className={style["sticky-header-view"]}
                    style={{ width: "6%" }}
                  >
                    Aksi
                  </th>
                  <th
                    className={style["sticky-header-view"]}
                    style={{ width: "10%" }}
                  >
                    Jenis Kegiatan
                  </th>
                  <th>Rujukan Medis Rumah Sakit</th>
                  <th>Rujukan Medis Bidan</th>
                  <th>Rujukan Medis Puskesmas</th>
                  <th>Rujukan Medis Faskes Lainnya</th>
                  <th>Rujukan Medis Hidup</th>
                  <th>Rujukan Medis Mati</th>
                  <th>Rujukan Medis Total</th>
                  <th>Rujukan Non Medis Hidup</th>
                  <th>Rujukan Non Medis Mati</th>
                  <th>Rujukan Non Medis Total</th>
                  <th>Non Rujukan Hidup</th>
                  <th>Non Rujukan Mati</th>
                  <th>Non Rujukan Total</th>
                  <th>Dirujuk</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  return (
                    <React.Fragment key={index}>
                      <tr
                        style={{
                          textAlign: "center",
                          backgroundColor: "#C4DFAA",
                          fontWeight: "bold",
                          // color:"#354259"
                        }}
                      >
                        <td className={style["sticky-column-view"]}>
                          {value.groupId}
                        </td>
                        <td className={style["sticky-column-view"]}></td>
                        <td className={style["sticky-column-view"]}>
                          {value.groupNama}
                        </td>
                        <td>{value.groupRmRumahSakit}</td>
                        <td>{value.groupRmBidan}</td>
                        <td>{value.groupRmPuskesmas}</td>
                        <td>{value.groupRmFaskesLainnya}</td>
                        <td>{value.groupRmHidup}</td>
                        <td>{value.groupRmMati}</td>
                        <td>{value.groupRmTotal}</td>
                        <td>{value.groupRnmHidup}</td>
                        <td>{value.groupRnmMati}</td>
                        <td>{value.groupRnmTotal}</td>
                        <td>{value.groupNrHidup}</td>
                        <td>{value.groupNrMati}</td>
                        <td>{value.groupNrTotal}</td>
                        <td>{value.groupDirujuk}</td>
                      </tr>
                      {value.details.map((value2, index2) => {
                        return (
                          <React.Fragment key={index2}>
                            <tr
                              style={{
                                textAlign: "center",
                                backgroundColor: "#90C8AC",
                                fontWeight: "bold",
                                // color:"#354259"
                              }}
                            >
                              <td className={style["sticky-column-view"]}>
                                {value2.subGroupNo}
                              </td>
                              <td className={style["sticky-column-view"]}></td>
                              <td className={style["sticky-column-view"]}>
                                {value2.subGroupNama}
                              </td>
                              <td>{value2.subGroupRmRumahSakit}</td>
                              <td>{value2.subGroupRmBidan}</td>
                              <td>{value2.subGroupRmPuskesmas}</td>
                              <td>{value2.subGroupRmFaskesLainnya}</td>
                              <td>{value2.subGroupRmHidup}</td>
                              <td>{value2.subGroupRmMati}</td>
                              <td>{value2.subGroupRmTotal}</td>
                              <td>{value2.subGroupRnmHidup}</td>
                              <td>{value2.subGroupRnmMati}</td>
                              <td>{value2.subGroupRnmTotal}</td>
                              <td>{value2.subGroupNrHidup}</td>
                              <td>{value2.subGroupNrMati}</td>
                              <td>{value2.subGroupNrTotal}</td>
                              <td>{value2.subGroupDirujuk}</td>
                            </tr>
                            {value2.kegiatan.map((value3, index3) => {
                              return (
                                <tr
                                  key={index3}
                                  style={{
                                    textAlign: "center",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <td className={style["sticky-column-view"]}>
                                    {value3.jenisKegiatanNo}
                                  </td>
                                  <td className={style["sticky-column-view"]}>
                                    <ToastContainer />

                                    <div style={{ display: "flex" }}>
                                      <button
                                        className="btn btn-danger"
                                        style={{
                                          margin: "0 5px 0 0",
                                          backgroundColor: "#FF6663",
                                          border: "1px solid #FF6663",
                                        }}
                                        type="button"
                                        onClick={(e) =>
                                          hapus(value3.id, value3.tahun)
                                        }
                                      >
                                        Hapus
                                      </button>
                                      {value3.jenisKegiatanNo === "0" ? (
                                        ""
                                      ) : (
                                        <Link
                                          to={`/rl37/ubah/${value3.id}`}
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
                                      )}
                                    </div>
                                  </td>
                                  <td className={style["sticky-column-view"]}>
                                    {value3.jenisKegiatanNama}
                                  </td>
                                  <td>{value3.rmRumahSakit}</td>
                                  <td>{value3.rmBidan}</td>
                                  <td>{value3.rmPuskesmas}</td>
                                  <td>{value3.rmFaskesLainnya}</td>
                                  <td>{value3.rmHidup}</td>
                                  <td>{value3.rmMati}</td>
                                  <td>{value3.rmTotal}</td>
                                  <td>{value3.rnmHidup}</td>
                                  <td>{value3.rnmMati}</td>
                                  <td>{value3.rnmTotal}</td>
                                  <td>{value3.nrHidup}</td>
                                  <td>{value3.nrMati}</td>
                                  <td>{value3.nrTotal}</td>
                                  <td>{value3.dirujuk}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL37;
