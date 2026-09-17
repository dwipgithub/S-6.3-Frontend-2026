import { useState, useCallback, useEffect, useRef } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { toast } from "react-toastify";

import {
  getRL310DataSatuSehat,
  syncRL310DataSatuSehat,
} from "../services/rl310.services";
import { useCSRFTokenContext } from "../components/Context/CSRFTokenContext";
import { useAuthAxios } from "./useAuthAxios";
import { MONTHS } from "../constants/date";

export const useRL310 = (axiosJWT, token, CSRFToken, currentUser) => {
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

        const res = await getRL310DataSatuSehat({
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

          const res = await getRL310DataSatuSehat({
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

  const MANUAL_SYNC_COOLDOWN_SECONDS = MANUAL_SYNC_COOLDOWN * 60;

  const [now, setNow] = useState(Date.now());

  /**
   * Update waktu setiap detik selama cooldown.
   */
  useEffect(() => {
    if (!sync.lastSync || sync.isUpdating) {
      setNow(Date.now());
      return;
    }

    const updateNow = () => {
      setNow(Date.now());
    };

    updateNow();

    const interval = setInterval(updateNow, 1000);

    return () => clearInterval(interval);
  }, [sync.lastSync, sync.isUpdating]);

  /**
   * Waktu terakhir sinkronisasi.
   */
  const lastSyncTime = sync.lastSync ? new Date(sync.lastSync).getTime() : null;

  /**
   * Hitung sisa cooldown dalam detik.
   */
  const cooldownRemainingSeconds =
    lastSyncTime !== null
      ? Math.max(
          0,
          Math.ceil(
            (lastSyncTime + MANUAL_SYNC_COOLDOWN_SECONDS * 1000 - now) / 1000,
          ),
        )
      : 0;

  /**
   * Tombol SYNC hanya aktif jika:
   * - tidak sedang update dari backend
   * - tidak sedang manual sync
   * - cooldown sudah selesai
   */
  const canSync =
    !sync.isUpdating && !isManualSyncing && cooldownRemainingSeconds <= 0;

  /**
   * Format countdown:
   * 4:59
   * 4:58
   * 4:57
   * ...
   * 0:01
   */
  const cooldownLeft =
    cooldownRemainingSeconds > 0
      ? `${Math.floor(cooldownRemainingSeconds / 60)}:${String(
          cooldownRemainingSeconds % 60,
        ).padStart(2, "0")}`
      : null;

  const handleManualSync = useCallback(async () => {
    console.log("Manual Sync triggered");
    if (!canSync) return;

    const periode = `${tahun}-${String(bulan).padStart(2, "0")}`;

    setIsManualSyncing(true); // ← langsung disable tombol saat klik
    setLoadingTable(true);

    try {
      await syncRL310DataSatuSehat(
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

export const useRL310Bootstrap = () => {
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
