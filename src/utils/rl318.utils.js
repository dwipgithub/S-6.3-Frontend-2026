import { downloadExcel } from "react-export-table-to-excel";

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlahRawatInap += Number(item.rawat_inap) || 0;

      acc.jumlahRawatJalan += Number(item.rawat_jalan) || 0;

      acc.jumlahIgd += Number(item.igd) || 0;

      acc.jumlahTotalResep += Number(item.total_resep) || 0;

      return acc;
    },
    {
      jumlahRawatInap: 0,
      jumlahIgd: 0,
      jumlahRawatJalan: 0,
      jumlahTotalResep: 0,
    },
  );
};

export const exportRL318ExcelSatuSehat = (data = []) => {
  const header = [
    "Golongan Obat",
    "Rawat Jalan",
    "IGD",
    "Rawat Inap",
    "Total Resep",
  ];

  let totalRawatJalan = 0;
  let totalRawatInap = 0;
  let totalIgd = 0;
  let totalResep = 0;

  const body = data.map((item, index) => {
    const jumlahRawatInap = Number(item.rawat_inap) || 0;
    const jumlahRawatJalan = Number(item.rawat_jalan) || 0;
    const jumlahIgd = Number(item.igd) || 0;
    const jumlahTotalResep = Number(item.total_resep) || 0;

    totalRawatJalan += jumlahRawatJalan;
    totalRawatInap += jumlahRawatInap;
    totalIgd += jumlahIgd;
    totalResep += jumlahTotalResep;

    return [
      index + 1,
      item.rl_tiga_titik_delapan_belas_golongan_obat?.nama ?? "-",
      jumlahRawatJalan,
      jumlahIgd,
      jumlahRawatInap,
      jumlahTotalResep,
    ];
  });

  body.push([
    "",
    "TOTAL",
    totalRawatJalan,
    totalIgd,
    totalRawatInap,
    totalResep,
  ]);

  downloadExcel({
    fileName: "RL318-Farmasi Resep",
    sheet: "Farmasi Resep",
    tablePayload: {
      header,
      body,
    },
  });
};
