import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL36.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
// import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL36 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [downloadData, setDownloadData] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun("2025");
      return date.getFullYear();
    };
    getLastYear().then((results) => {});
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

  const getDataRLTigaTitikEnam = async (event) => {
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
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikenam",
        customConfig
      );

      const rlTigaTitikEnamDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_enam_details;
      });

      let dataRLTigaTitikEnamDetails = [];
      rlTigaTitikEnamDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikEnamDetails.push(value);
        });
      });
      console.log(dataRLTigaTitikEnamDetails);
      // setDataRL(dataRLTigaTitikEnamDetails)

      let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );

      // console.log(sortedProducts);

      let groups = [];

      sortedProducts.reduce(function (res, value) {
        if (
          !res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
        ) {
          res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id] =
            {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              // jumlah: 0,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
          groups.push(
            res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
          );
        }
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmRumahSakit += value.rmRumahSakit;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmBidan += value.rmBidan;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmPuskesmas += value.rmPuskesmas;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmFaskesLainnya += value.rmFaskesLainnya;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmHidup += value.rmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmMati += value.rmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmTotal += value.rmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmHidup += value.rnmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmMati += value.rnmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmTotal += value.rnmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrHidup += value.nrHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrMati += value.nrMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrTotal += value.nrTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].dirujuk += value.dirujuk;
        return res;
      }, {});

      let data = [];

      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return (
              value.jenis_kegiatan_rl_tiga_titik_enam
                .group_jenis_kegiatan_id === element.groupId
            );
          });
          data.push({
            groupId: element.groupId,
            groupNo: element.groupNo,
            groupNama: element.groupNama,
            details: filterData,
            // subTotal: element.jumlah,
            subTotalRmRumahSakit: element.rmRumahSakit,
            subTotalRmBidan: element.rmBidan,
            subTotalRmPuskesmas: element.rmPuskesmas,
            subTotalRmFaskesLainnya: element.rmFaskesLainnya,
            subTotalRmHidup: element.rmHidup,
            subTotalRmMati: element.rmMati,
            subTotalRmTotal: element.rmTotal,
            subTotalRnmHidup: element.rnmHidup,
            subTotalRnmMati: element.rnmMati,
            subTotalRnmTotal: element.rnmTotal,
            subTotalNrHidup: element.nrHidup,
            subTotalNrMati: element.nrMati,
            subTotalNrTotal: element.nrTotal,
            subTotalDirujuk: element.dirujuk,
          });
        }
      });
      // console.log(data);
      setDataRL(data);

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
    filter.push("nama: ".concat(rumahSakit.nama));
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
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikenam",
        customConfig
      );

      const rlTigaTitikEnamDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_enam_details;
      });

      let dataRLTigaTitikEnamDetails = [];
      rlTigaTitikEnamDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikEnamDetails.push(value);
        });
      });
      console.log(dataRLTigaTitikEnamDetails);
      setDownloadData(dataRLTigaTitikEnamDetails);

      let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );

      // console.log(sortedProducts)

      let groups = [];

      sortedProducts.reduce(function (res, value) {
        if (
          !res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
        ) {
          res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id] =
            {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              // jumlah: 0,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
          groups.push(
            res[value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id]
          );
        }
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmRumahSakit += value.rmRumahSakit;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmBidan += value.rmBidan;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmPuskesmas += value.rmPuskesmas;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmFaskesLainnya += value.rmFaskesLainnya;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmHidup += value.rmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmMati += value.rmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rmTotal += value.rmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmHidup += value.rnmHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmMati += value.rnmMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].rnmTotal += value.rnmTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrHidup += value.nrHidup;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrMati += value.nrMati;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].nrTotal += value.nrTotal;
        res[
          value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
        ].dirujuk += value.dirujuk;
        return res;
      }, {});

      let data = [];

      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return (
              value.jenis_kegiatan_rl_tiga_titik_enam
                .group_jenis_kegiatan_id === element.groupId
            );
          });
          data.push({
            groupId: element.groupId,
            groupNo: element.groupNo,
            groupNama: element.groupNama,
            details: filterData,
            // subTotal: element.jumlah,
            subTotalRmRumahSakit: element.rmRumahSakit,
            subTotalRmBidan: element.rmBidan,
            subTotalRmPuskesmas: element.rmPuskesmas,
            subTotalRmFaskesLainnya: element.rmFaskesLainnya,
            subTotalRmHidup: element.rmHidup,
            subTotalRmMati: element.rmMati,
            subTotalRmTotal: element.rmTotal,
            subTotalRnmHidup: element.rnmHidup,
            subTotalRnmMati: element.rnmMati,
            subTotalRnmTotal: element.rnmTotal,
            subTotalNrHidup: element.nrHidup,
            subTotalNrMati: element.nrMati,
            subTotalNrTotal: element.nrTotal,
            subTotalDirujuk: element.dirujuk,
          });
        }
      });
      // console.log(data);
      setDataRL(data);
      handleClose();
      setSpinner(false);
    } catch (error) {
      console.log(error);
      setSpinner(false);
      handleClose();
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitikenam/${id}`, customConfig);
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
        const results = await axiosJWT.get(
          "/apisirs6v2/rltigatitikenam",
          customConfig
        );

        const rlTigaTitikEnamDetails = results.data.data.map((value) => {
          return value.rl_tiga_titik_enam_details;
        });

        let dataRLTigaTitikEnamDetails = [];
        rlTigaTitikEnamDetails.forEach((element) => {
          element.forEach((value) => {
            dataRLTigaTitikEnamDetails.push(value);
          });
        });

        let sortedProducts = dataRLTigaTitikEnamDetails.sort((p1, p2) =>
          p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
            ? 1
            : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
            ? -1
            : 0
        );

        let groups = [];

        sortedProducts.reduce(function (res, value) {
          if (
            !res[
              value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
            ]
          ) {
            res[
              value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
            ] = {
              groupId:
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id,
              groupNama:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.nama,
              groupNo:
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_header_rl_tiga_titik_enam.no,
              rmRumahSakit: 0,
              rmBidan: 0,
              rmPuskesmas: 0,
              rmFaskesLainnya: 0,
              rmHidup: 0,
              rmMati: 0,
              rmTotal: 0,
              rnmHidup: 0,
              rnmMati: 0,
              rnmTotal: 0,
              nrHidup: 0,
              nrMati: 0,
              nrTotal: 0,
              dirujuk: 0,
            };
            groups.push(
              res[
                value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
              ]
            );
          }
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmRumahSakit += value.rmRumahSakit;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmBidan += value.rmBidan;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmPuskesmas += value.rmPuskesmas;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmFaskesLainnya += value.rmFaskesLainnya;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmHidup += value.rmHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmMati += value.rmMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rmTotal += value.rmTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmHidup += value.rnmHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmMati += value.rnmMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].rnmTotal += value.rnmTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrHidup += value.nrHidup;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrMati += value.nrMati;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].nrTotal += value.nrTotal;
          res[
            value.jenis_kegiatan_rl_tiga_titik_enam.group_jenis_kegiatan_id
          ].dirujuk += value.dirujuk;
          return res;
        }, {});

        let data = [];

        groups.forEach((element) => {
          if (element.groupId != null) {
            const filterData = sortedProducts.filter((value, index) => {
              return (
                value.jenis_kegiatan_rl_tiga_titik_enam
                  .group_jenis_kegiatan_id === element.groupId
              );
            });
            data.push({
              groupId: element.groupId,
              groupNo: element.groupNo,
              groupNama: element.groupNama,
              details: filterData,
              subTotalRmRumahSakit: element.rmRumahSakit,
              subTotalRmBidan: element.rmBidan,
              subTotalRmPuskesmas: element.rmPuskesmas,
              subTotalRmFaskesLainnya: element.rmFaskesLainnya,
              subTotalRmHidup: element.rmHidup,
              subTotalRmMati: element.rmMati,
              subTotalRmTotal: element.rmTotal,
              subTotalRnmHidup: element.rnmHidup,
              subTotalRnmMati: element.rnmMati,
              subTotalRnmTotal: element.rnmTotal,
              subTotalNrHidup: element.nrHidup,
              subTotalNrMati: element.nrMati,
              subTotalNrTotal: element.nrTotal,
              subTotalDirujuk: element.dirujuk,
            });
          }
        });
        setDataRL(data);
      } catch (error) {
        console.log(error);
      }
      //

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
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

  async function handleDownloadExcel() {
    const header = [
      "No",
      "No Kegiatan",
      "Jenis Kegiatan",
      "Rujukan Medis Rumah Sakit",
      "Rujukan Medis Bidan",
      "Rujukan Medis Puskesmas",
      "Rujukan Medis Faskes Lainnya",
      "Jumlah Hidup Rujukan Medis",
      "Jumlah Mati Rujukan Medis",
      "Total Rujukan Medis",
      "Jumlah Hidup Rujukan Non Medis",
      "Jumlah Mati Rujukan Non Medis",
      "Total Rujukan Non Medis",
      "Jumlah Hidup Non Rujukan",
      "Jumlah Mati Non Rujukan",
      "Total Non Rujukan",
      "Dirujuk",
    ];

    const body = downloadData.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_kegiatan_rl_tiga_titik_enam.no,
        value.jenis_kegiatan_rl_tiga_titik_enam.nama,
        value.rmRumahSakit,
        value.rmBidan,
        value.rmPuskesmas,
        value.rmFaskesLainnya,
        value.rmHidup,
        value.rmMati,
        value.rmTotal,
        value.rnmHidup,
        value.rnmMati,
        value.rnmTotal,
        value.nrHidup,
        value.nrMati,
        value.nrTotal,
      ];
      return data;
    });

    downloadExcel({
      fileName: "RL_3_6",
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
          <h4>
            <span style={{ color: "gray" }}>RL. 3.6 Kebidanan</span>
          </h4>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl36/tambah/`}
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

          <div className={style["table-container"]}>
            <table responsive className={style.table}>
              <thead className={style.thead}>
                <tr>
                  <th
                    style={{ width: "2" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    No.
                  </th>
                  <th
                    style={{ width: "6%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Aksi
                  </th>
                  <th
                    style={{ width: "15%" }}
                    rowSpan={2}
                    className={style["sticky-header"]}
                  >
                    Jenis Kegiatan
                  </th>
                  <th colSpan={7} className="text-center">
                    Rujukan Medis
                  </th>
                  <th colSpan={3} className="text-center">
                    Rujukan Non Medis
                  </th>
                  <th colSpan={3} className="text-center">
                    Non Rujukan
                  </th>
                  <th rowSpan={2} className="align-middle">
                    Dirujuk
                  </th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th className="align-middle">Rumah Sakit</th>
                  <th className="align-middle">Bidan</th>
                  <th className="align-middle">Puskesmas</th>
                  <th className="align-middle">Faskes Lainnya</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Rujukan Medis</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Rujukan Non Medis</th>
                  <th className="align-middle">Jumlah Hidup</th>
                  <th className="align-middle">Jumlah Mati</th>
                  <th className="align-middle">Total Non Rujukan</th>
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
                              // color:"#354259"
                            }}
                          >
                            <td className={style["sticky-column"]}>
                              <input
                                type="text"
                                name="id"
                                className="form-control"
                                value={value.groupNo}
                                disabled={true}
                              />
                            </td>
                            <td className={style["sticky-column"]}></td>
                            <td className={style["sticky-column"]}>
                              {/* {value.groupNama} */}
                              <input
                                type="text"
                                name="jenisPelayanan"
                                className="form-control"
                                value={value.groupNama}
                                disabled={true}
                              />
                            </td>

                            <td>
                              <input
                                type="text"
                                name="rmRumahSakit"
                                className="form-control"
                                value={value.subTotalRmRumahSakit}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmBidan"
                                className="form-control"
                                value={value.subTotalRmBidan}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmPuskesmas"
                                className="form-control"
                                value={value.subTotalRmPuskesmas}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmFaskesLainnya"
                                className="form-control"
                                value={value.subTotalRmFaskesLainnya}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmHidup"
                                className="form-control"
                                value={value.subTotalRmHidup}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmMati"
                                className="form-control"
                                value={value.subTotalRmMati}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rmTotal"
                                className="form-control"
                                value={value.subTotalRmTotal}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rnmHidup"
                                className="form-control"
                                value={value.subTotalRnmHidup}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rnmMati"
                                className="form-control"
                                value={value.subTotalRnmMati}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="rnmTotal"
                                className="form-control"
                                value={value.subTotalRnmTotal}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="nrHidup"
                                className="form-control"
                                value={value.subTotalNrHidup}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="nrMati"
                                className="form-control"
                                value={value.subTotalNrMati}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="nrTotal"
                                className="form-control"
                                value={value.subTotalNrTotal}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="dirujuk"
                                className="form-control"
                                value={value.subTotalDirujuk}
                                onChange={(e) => changeHandler(e, index)}
                                disabled={true}
                              />
                            </td>
                          </tr>
                          {value.details.map((value2, index2) => {
                            return (
                              <tr key={index2}>
                                <td className={style["sticky-column"]}>
                                  <input
                                    type="text"
                                    name="id"
                                    className="form-control"
                                    value={
                                      value2.jenis_kegiatan_rl_tiga_titik_enam
                                        .no
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
                                        hapus(value2.id, value2.tahun)
                                      }
                                    >
                                      Hapus
                                    </button>
                                    <Link
                                      to={`/rl36/ubah/${value2.id}`}
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
                                </td>
                                <td className={style["sticky-column"]}>
                                  {/* {
                                    value2.jenis_kegiatan_rl_tiga_titik_enam
                                      .nama
                                  } */}
                                  <input
                                    type="text"
                                    name="jenisPelayanan"
                                    className="form-control"
                                    value={
                                      value2.jenis_kegiatan_rl_tiga_titik_enam
                                        .nama
                                    }
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmRumahSakit"
                                    className="form-control"
                                    value={value2.rmRumahSakit}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmBidan"
                                    className="form-control"
                                    value={value2.rmBidan}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmPuskesmas"
                                    className="form-control"
                                    value={value2.rmPuskesmas}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmFaskesLainnya"
                                    className="form-control"
                                    value={value2.rmFaskesLainnya}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmHidup"
                                    className="form-control"
                                    value={value2.rmHidup}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmMati"
                                    className="form-control"
                                    value={value2.rmMati}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rmTotal"
                                    className="form-control"
                                    value={value2.rmTotal}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rnmHidup"
                                    className="form-control"
                                    value={value2.rnmHidup}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rnmMati"
                                    className="form-control"
                                    value={value2.rnmMati}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="rnmTotal"
                                    className="form-control"
                                    value={value2.rnmTotal}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="nrHidup"
                                    className="form-control"
                                    value={value2.nrHidup}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="nrMati"
                                    className="form-control"
                                    value={value2.nrMati}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="nrTotal"
                                    className="form-control"
                                    value={value2.nrTotal}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="dirujuk"
                                    className="form-control"
                                    value={value2.dirujuk}
                                    onChange={(e) => changeHandler(e, index)}
                                    disabled={true}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                    // else if (value.groupNama == null) {
                    // return (
                    //     <React.Fragment key={index}>
                    //     <tr>
                    //         <td style={{ textAlign: "left" }}>
                    //         {value.details[0].nama}
                    //         </td>
                    //         <td>{value.details[0].nilai}</td>
                    //     </tr>
                    //     </React.Fragment>
                    // );
                    // }
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL36;
