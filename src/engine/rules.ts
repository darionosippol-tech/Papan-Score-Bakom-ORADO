/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleCitation } from '../types/orado';

export const RULES_CATALOG: Record<string, RuleCitation> = {
  PASAL_1: {
    article: 'Pasal 1',
    title: 'Peralatan dan Komposisi Domino 101',
    description: 'Set double-six berjumlah 28 batu. 4 pemain terbagi dalam 2 tim (Tim A: A1, A2; Tim B: B1, B2). Masing-masing pemain menerima 7 batu.',
    status: 'TERVERIFIKASI',
    details: 'Setiap batu memiliki 0–6 titik pada masing-masing sisi. Tidak ada batu duplikat.'
  },
  PASAL_4: {
    article: 'Pasal 4',
    title: 'Akumulasi Skor dan Target Set 101',
    description: 'Satu set normal dimenangkan oleh tim yang pertama kali mencapai akumulasi minimal 101 poin.',
    status: 'TERVERIFIKASI',
    details: 'Skor dihitung per ronde dan diakumulasikan. Jika kedua tim melewati 101, tim dengan skor tertinggi dinyatakan menang set.'
  },
  PASAL_7: {
    article: 'Pasal 7',
    title: 'Kemenangan Normal (Menghabiskan Batu)',
    description: 'Jika pemain menghabiskan batu, tim pemenang mendapat poin dasar sama dengan jumlah total sisa titik batu pada tim lawan.',
    status: 'TERVERIFIKASI',
    details: 'Poin Dasar = Total sisa titik batu lawan (L1 + L2). Batu tim sendiri atau batu yang sudah dimainkan tidak dihitung.'
  },
  PASAL_12: {
    article: 'Pasal 12',
    title: 'Bonus Dua Ujung Cocok (Pengali 2x)',
    description: 'Jika batu penutup ronde cocok dengan kedua ujung terbuka pada rangkaian domino di meja, poin ronde dikalikan 2.',
    status: 'TERVERIFIKASI',
    details: 'Rumus: Poin Ronde = Poin Dasar × 2 (atau Poin Dasar + Bonus Dua Ujung).'
  },
  PASAL_13: {
    article: 'Pasal 13',
    title: 'Bonus Balak di Dua Ujung (+50 Poin)',
    description: 'Jika batu terakhir adalah balak, cocok pada kedua ujung, dan tidak ada sisa batu sejenis, tim pemenang mendapat bonus +50 poin.',
    status: 'TERVERIFIKASI',
    details: 'Rumus: Poin Ronde = Sisa batu lawan + 50. Catatan: Penggabungan pengali 2x dan +50 tidak diterapkan otomatis tanpa ketentuan khusus.'
  },
  PASAL_14: {
    article: 'Pasal 14',
    title: 'Permainan Beradu (Deadlock / Macet)',
    description: 'Jika permainan macet dan tidak ada pemain yang dapat menurunkan batu, perhitungan ditentukan berdasarkan perbandingan titik batu.',
    status: 'PERLU_KONFIRMASI_WASIT',
    details: 'Jika kondisi pemain penutup atau klausul penentuan pemenang belum terverifikasi secara lengkap dalam naskah resmi meja, wasit wajib mengonfirmasi sebelum poin ditambahkan.'
  },
  PASAL_15: {
    article: 'Pasal 15',
    title: 'Penalti Pelanggaran Bertanding (Sanksi 11 Poin)',
    description: 'Pelanggaran seperti batas waktu (time out), bermain sebelum giliran, menurunkan batu salah, atau pass tidak sah dikenakan sanksi 11 poin untuk lawan.',
    status: 'TERVERIFIKASI',
    details: 'Sesuai naskah revisi 2026, sanksi standar pelanggaran disiplin meja memberikan 11 poin kepada tim lawan.'
  },
  PASAL_16: {
    article: 'Pasal 16',
    title: 'Pelanggaran Berat dan Sanksi Khusus (+50 / Diskualifikasi)',
    description: 'Pelanggaran berat atau manipulasi batu dapat dikenakan sanksi 50 poin untuk lawan atau kekalahan langsung pada set bersangkutan.',
    status: 'TERVERIFIKASI',
    details: 'Diberikan melalui keputusan wasit kepala atau insiden berat yang tercatat dalam berita acara.'
  },
  PASAL_18: {
    article: 'Pasal 18',
    title: 'Kondisi Kemenangan Mutlak Apollo (101 vs 0)',
    description: 'Jika satu tim mencapai target 101 poin sementara tim lawan masih memiliki 0 poin, dinyatakan sebagai kondisi kemenangan Apollo.',
    status: 'TERVERIFIKASI',
    details: 'Pada regulasi ORADO standar, Apollo dihitung sebagai kemenangan 2 set (langsung memenangkan pertandingan Best of 3) atau sesuai konfigurasi turnamen.'
  }
};

export interface StandardViolation {
  code: string;
  name: string;
  article: string;
  defaultPoints: number;
  description: string;
  severity: 'ringan' | 'sedang' | 'berat';
}

export const STANDARD_VIOLATIONS: StandardViolation[] = [
  {
    code: 'TIME_LIMIT',
    name: 'Melebihi Batas Waktu Berpikir',
    article: 'Pasal 15 Ayat 2',
    defaultPoints: 11,
    description: 'Pemain melewati batas waktu 15/30 detik yang ditentukan wasit.',
    severity: 'sedang'
  },
  {
    code: 'OUT_OF_TURN',
    name: 'Bermain Sebelum Giliran',
    article: 'Pasal 15 Ayat 3',
    defaultPoints: 11,
    description: 'Pemain menurunkan atau menyentuh batu sebelum giliran tiba.',
    severity: 'sedang'
  },
  {
    code: 'WRONG_TILE',
    name: 'Menurunkan Batu Tidak Cocok',
    article: 'Pasal 15 Ayat 4',
    defaultPoints: 11,
    description: 'Batu yang diturunkan tidak sesuai dengan angka pada ujung rangkaian.',
    severity: 'sedang'
  },
  {
    code: 'ILLEGAL_PASS',
    name: 'Menyatakan Pass Tidak Sah',
    article: 'Pasal 15 Ayat 5',
    defaultPoints: 11,
    description: 'Pemain menyatakan pass (lewat) padahal masih memiliki batu yang dapat dimainkan.',
    severity: 'sedang'
  },
  {
    code: 'MINOR_MISCONDUCT',
    name: 'Pelanggaran Disiplin Ringan',
    article: 'Pasal 15 Ayat 1',
    defaultPoints: 11,
    description: 'Komunikasi verbal tidak sah atau isyarat terlarang antarpemain.',
    severity: 'ringan'
  },
  {
    code: 'MAJOR_VIOLATION',
    name: 'Pelanggaran Berat / Sanksi Khusus',
    article: 'Pasal 16 Ayat 1',
    defaultPoints: 50,
    description: 'Membuka batu lawan secara sengaja atau pelanggaran etika berat.',
    severity: 'berat'
  }
];
