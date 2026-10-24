import { MathQuestion, CarColorConfig } from '../types/game';

export const CAR_COLORS: CarColorConfig[] = [
  { id: 'cyan', name: 'Cyber Cyan', hex: '#06b6d4', threeColor: 0x06b6d4, glowHex: '#22d3ee' },
  { id: 'red', name: 'Inferno Red', hex: '#ef4444', threeColor: 0xef4444, glowHex: '#f87171' },
  { id: 'lime', name: 'Neon Lime', hex: '#84cc16', threeColor: 0x84cc16, glowHex: '#a3e635' },
  { id: 'gold', name: 'Solar Gold', hex: '#f59e0b', threeColor: 0xf59e0b, glowHex: '#fbbf24' },
  { id: 'purple', name: 'Apex Purple', hex: '#a855f7', threeColor: 0xa855f7, glowHex: '#c084fc' },
];

export const FORM1_QUESTIONS: MathQuestion[] = [
  {
    id: 'soalan-1',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Di sebuah kedai buah, terdapat 6 biji epal dan 9 biji oren. Apakah nisbah bilangan epal kepada oren dalam bentuk termudah?',
    options: ['2 : 3', '3 : 2', '2 : 5'],
    correctIndex: 0, // A
    difficulty: 1,
    explanation: 'Bahagikan kedua-dua sebutan dengan faktor sepunya terbesar (FSTB = 3): 6 ÷ 3 = 2 dan 9 ÷ 3 = 3. Maka, nisbah termudah ialah 2 : 3.',
  },
  {
    id: 'soalan-2',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Dalam sebuah kelas terdapat 12 orang murid lelaki dan 8 orang murid perempuan. Apakah nisbah murid perempuan kepada jumlah murid?',
    options: ['2 : 3', '3 : 5', '2 : 5'],
    correctIndex: 2, // C
    difficulty: 1,
    explanation: 'Jumlah murid = 12 + 8 = 20 orang. Nisbah murid perempuan kepada jumlah murid = 8 : 20. Permudahkan dengan membahagikan kedua-dua nombor dengan 4: 8 ÷ 4 = 2 dan 20 ÷ 4 = 5. Jawapan = 2 : 5.',
  },
  {
    id: 'soalan-3',
    topic: 'Rates',
    topicMalay: 'Kadar',
    question: 'Sebuah kereta bergerak sejauh 180 km dalam masa 3 jam. Berapakah kadar purata pergerakan kereta itu?',
    options: ['45 km/j', '60 km/j', '90 km/j'],
    correctIndex: 1, // B
    difficulty: 1,
    explanation: 'Kadar purata laju = Jarak ÷ Masa = 180 km ÷ 3 jam = 60 km/j.',
  },
  {
    id: 'soalan-4',
    topic: 'Rates',
    topicMalay: 'Kadar',
    question: 'Ali membeli 5 batang pen dengan harga RM10. Berapakah harga bagi sebatang pen?',
    options: ['RM1', 'RM2', 'RM3'],
    correctIndex: 1, // B
    difficulty: 1,
    explanation: 'Kadar harga seunit = RM10 ÷ 5 batang pen = RM2 sebatang pen.',
  },
  {
    id: 'soalan-5',
    topic: 'Proportions',
    topicMalay: 'Kadaran',
    question: 'Jika 3 buah buku berharga RM12, berapakah harga bagi 5 buah buku yang sama?',
    options: ['RM15', 'RM18', 'RM20'],
    correctIndex: 2, // C
    difficulty: 2,
    explanation: 'Harga bagi 1 buah buku = RM12 ÷ 3 = RM4. Maka harga bagi 5 buah buku = 5 × RM4 = RM20.',
  },
  {
    id: 'soalan-6',
    topic: 'Proportions',
    topicMalay: 'Kadaran',
    question: 'Sebuah mesin menghasilkan 24 botol air dalam masa 4 minit. Jika kadar pengeluaran adalah tetap, berapakah bilangan botol yang dihasilkan dalam masa 10 minit?',
    options: ['40 botol', '50 botol', '60 botol'],
    correctIndex: 2, // C
    difficulty: 2,
    explanation: 'Kadar pengeluaran seminit = 24 botol ÷ 4 minit = 6 botol seminit. Dalam masa 10 minit = 10 × 6 = 60 botol air.',
  },
  {
    id: 'soalan-7',
    topic: 'Estimation',
    topicMalay: 'Anggaran',
    question: 'Sebuah kedai menjual 19 biji burger pada waktu pagi dan 32 biji burger pada waktu petang. Anggarkan jumlah burger yang dijual dengan membundarkan setiap nombor kepada puluh yang terdekat.',
    options: ['40 biji', '50 biji', '60 biji'],
    correctIndex: 1, // B
    difficulty: 1,
    explanation: 'Bundarkan 19 kepada puluh terdekat = 20. Bundarkan 32 kepada puluh terdekat = 30. Anggaran jumlah burger = 20 + 30 = 50 biji.',
  },
  {
    id: 'soalan-8',
    topic: 'Estimation',
    topicMalay: 'Anggaran',
    question: 'Harga sebuah beg ialah RM48.90 dan harga sepasang kasut ialah RM79.20. Anggarkan jumlah harga kedua-dua barang kepada ringgit yang terdekat.',
    options: ['RM127', 'RM128', 'RM130'],
    correctIndex: 1, // B
    difficulty: 2,
    explanation: 'Bundarkan RM48.90 kepada ringgit terdekat = RM49. Bundarkan RM79.20 kepada ringgit terdekat = RM79. Anggaran jumlah harga = RM49 + RM79 = RM128.',
  },
  {
    id: 'soalan-9',
    topic: 'Ratios & Proportions',
    topicMalay: 'Nisbah dan Kadaran',
    question: 'Nisbah bilangan kereta merah kepada kereta biru di sebuah tempat letak kereta ialah 2 : 3. Jika terdapat 10 buah kereta merah, berapakah bilangan kereta biru jika nisbah itu dikekalkan?',
    options: ['12 buah', '15 buah', '18 buah'],
    correctIndex: 1, // B
    difficulty: 2,
    explanation: 'Nisbah Merah : Biru = 2 : 3. Bilangan kereta merah ialah 10 (iaitu 2 × 5). Maka bilangan kereta biru = 3 × 5 = 15 buah.',
  },
  {
    id: 'soalan-10',
    topic: 'Rates & Estimation',
    topicMalay: 'Kadar dan Anggaran',
    question: 'Sebuah motosikal menggunakan 4 liter petrol untuk bergerak sejauh 120 km. Anggarkan jarak yang boleh dilalui menggunakan 7 liter petrol jika penggunaan petrol adalah berkadar terus.',
    options: ['200 km', '210 km', '240 km'],
    correctIndex: 1, // B
    difficulty: 2,
    explanation: 'Kadar penggunaan petrol = 120 km ÷ 4 liter = 30 km seliter. Dengan 7 liter petrol, jarak = 7 × 30 km = 210 km.',
  },
];
