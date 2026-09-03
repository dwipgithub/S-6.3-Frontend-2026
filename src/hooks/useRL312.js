import { useState, useCallback, useEffect, useRef } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { toast } from "react-toastify";

import {
  getRL312DataSatuSehat,
  syncRL312DataSatuSehat,
} from "../services/rl312.services";
import { useCSRFTokenContext } from "../components/Context/CSRFTokenContext";
import { useAuthAxios } from "./useAuthAxios";
import { MONTHS } from "../constants/date";

export const useRL312 = (axiosJWT, token, CSRFToken, currentUser) => {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11

  const [dataRL, setDataRL] = useState([]);
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loadingTable, setLoadingTable] = useState(false); // loading di dalam tabel
  const [filterLabel, setFilterLabel] = useState([]);
  const [show, setShow] = useState(false);
  const [sync, setSync] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const pollingRef = useRef(null);
  const limit = 50;
  const user = currentUser;

  useEffect(() => {
    return () => clearInterval(pollingRef.current);
  }, []);

  const fetchData = useCallback(
    async (
      pageNumber = 1,
      isBackground = false,
      currentUser = user,
      currentBulan = bulan,
      currentTahun = tahun,
    ) => {
      if (!currentUser.satKerId) return;
      if (!isBackground) setLoadingTable(true);

      try {
        const periode = `${currentTahun}-${String(currentBulan).padStart(2, "0")}`;

        const res = await getRL312DataSatuSehat({
          axiosJWT,
          rsId: currentUser.satKerId,
          periode: periode,
          pageNumber,
          limit,
        });

        const newSync = res.sync ?? {};
        setDataRL(res.data);
        setSync(res.sync);
        setTotalPages(res.pagination.totalPages);
        setPage(res.pagination.page);

        // Hentikan polling jika data sudah ada dan tidak sedang updating
        if (!newSync.isUpdating && newSync.status === "success") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        return res.sync;
      } catch (error) {
        throw error;
      } finally {
        if (!isBackground) setLoadingTable(false);
      }
    },
    [axiosJWT, user, bulan, tahun],
  );

  const startPolling = useCallback(
    (currentUser, currentBulan, currentTahun) => {
      clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        try {
          const periode = `${currentTahun}-${String(currentBulan).padStart(2, "0")}`;

          const res = await getRL312DataSatuSehat({
            axiosJWT,
            rsId: currentUser.satKerId,
            periode: periode,
            pageNumber: 1,
            limit,
          });

          // console.log("Polling response:", res);

          const newSync = res.sync ?? {};

          setDataRL(res.data);
          setSync(newSync);
          setTotalPages(res.pagination.totalPages);
          setPage(res.pagination.page);

          // console.log("Polling:", newSync);

          if (
            !newSync.isUpdating &&
            (newSync.status === "success" || newSync.status === "failed")
          ) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;

            setLoadingTable(false);
            setIsManualSyncing(false);

            // console.log("Polling stopped");
          }
        } catch (err) {
          console.error(err);

          clearInterval(pollingRef.current);
          pollingRef.current = null;

          setLoadingTable(false);
          setIsManualSyncing(false);
        }
      }, 4000);
    },
    [axiosJWT],
  );

  const getRL = useCallback(
    async (e) => {
      e.preventDefault();

      if (!bulan) {
        toast("Pilih Bulan Terlebih Dahulu", {
          type: "error",
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      if (!tahun) {
        toast("Pilih Tahun Terlebih Dahulu", {
          type: "error",
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      const monthLabel =
        MONTHS.find((m) => m.value === String(bulan))?.label ?? bulan;

      setFilterLabel([`Periode: ${monthLabel} ${tahun}`]);
      setIsFilterApplied(true);
      setDataRL([]);
      setLoadingTable(true); // tampilkan loading di tabel
      handleClose();

      // Fetch pertama kali
      const latestSync = await fetchData(1, false, user, bulan, tahun);

      if (
        latestSync.isUpdating ||
        latestSync.status === "never" ||
        latestSync.status === "syncing"
      ) {
        setLoadingTable(true);
        startPolling(user, bulan, tahun);
      }
    },
    [bulan, tahun, user, fetchData, startPolling],
  );

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const MANUAL_SYNC_COOLDOWN = 5; // menit

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now()); // ← tambah ini

    if (!sync.lastSync || sync.isUpdating) return;

    const elapsed = (Date.now() - new Date(sync.lastSync).getTime()) / 60000;
    if (elapsed >= MANUAL_SYNC_COOLDOWN) return;

    const remainingMs = (MANUAL_SYNC_COOLDOWN - elapsed) * 60 * 1000;
    const timeout = setTimeout(() => setNow(Date.now()), remainingMs);

    return () => clearTimeout(timeout);
  }, [sync.lastSync, sync.isUpdating]);

  // Ganti Date.now() → now
  const minutesSinceSync = sync.lastSync
    ? (now - new Date(sync.lastSync).getTime()) / 60000
    : null;

  const canSync =
    !sync.isUpdating &&
    !isManualSyncing && // ← tambah ini
    (minutesSinceSync === null || minutesSinceSync >= MANUAL_SYNC_COOLDOWN);

  // Sisa menit cooldown (untuk info ke user)
  const cooldownLeft =
    minutesSinceSync !== null
      ? Math.max(0, MANUAL_SYNC_COOLDOWN - minutesSinceSync).toFixed(1)
      : null;

  const handleManualSync = useCallback(async () => {
    console.log("Manual Sync triggered");
    if (!canSync) return;

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;

    setIsManualSyncing(true); // ← langsung disable tombol saat klik
    setLoadingTable(true);

    try {
      await syncRL312DataSatuSehat(
        axiosJWT,
        user.satKerId,
        periode,
        token,
        CSRFToken,
      );

      startPolling(user, bulan, tahun);
    } catch (err) {
      console.error(err);
      setLoadingTable(false);
    }
  }, [axiosJWT, user, bulan, tahun, token, CSRFToken, startPolling, canSync]);

  return {
    dataRL,
    bulan,
    tahun,
    loadingTable,
    show,
    filterLabel,
    isFilterApplied,
    sync,
    canSync,
    isManualSyncing,
    cooldownLeft,
    page,
    totalPages,
    getRL,
    handleShow,
    handleClose,
    setBulan,
    setTahun,
    fetchData,
    startPolling,
    handleManualSync,
    MANUAL_SYNC_COOLDOWN,
  };
};

export const useRL312Bootstrap = () => {
  const { CSRFToken } = useCSRFTokenContext();

  const [token, setToken] = useState("");
  const [expire, setExpire] = useState(0);
  const [user, setUser] = useState({});
  const [ready, setReady] = useState(false);

  const axiosJWT = useAuthAxios({
    token,
    expire,
    setToken,
    setExpire,
    csrfToken: CSRFToken,
  });

  useEffect(() => {
    const initialize = async () => {
      const response = await axios.get("/apisirs6v2/token", {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      });

      const accessToken = response.data.accessToken;

      setToken(accessToken);

      const decoded = jwt_decode(accessToken);

      setReady(true);
      setUser(decoded);
      setExpire(decoded.exp);
    };

    initialize();
  }, []);

  return {
    axiosJWT,
    ready,
    token,
    CSRFToken,
    user,
  };
};
