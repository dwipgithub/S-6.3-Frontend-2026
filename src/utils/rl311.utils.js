import { downloadExcel } from "react-export-table-to-excel";
import { MONTHS } from "../constants/date";

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  const day = date.getDate();
  const month =
    MONTHS.find((m) => m.value === String(date.getMonth() + 1))?.label ?? "-";
  const year = date.getFullYear();

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hour}.${minute}.${second} WIB`;
};

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlah += Number(item.jumlah) || 0;

      return acc;
    },
    {
      jumlah: 0,
    },
  );
};

export const exportRL311ExcelSatuSehat = (data = [], periode) => {
  const header = ["No", "Jenis Kegiatan", "Periode", "Jumlah"];

  const total = {
    jumlah: 0,
  };

  // console.log("Periode:", periode);
  const body = data.map((item, index) => {
    Object.keys(total).forEach((key) => {
      total[key] += Number(item[key]) || 0;
    });

    return [
      index + 1,
      item.rl_tiga_titik_sebelas_jenis_kegiatan?.nama_jenis_kegiatan ?? "-",
      periode,
      Number(item.jumlah) || 0,
    ];
  });

  body.push(["", "", "TOTAL", total.jumlah]);

  downloadExcel({
    fileName: `RL311-Gigi dan Mulut-${periode}`,
    sheet: "RL311",
    tablePayload: {
      header,
      body,
    },
  });
};
