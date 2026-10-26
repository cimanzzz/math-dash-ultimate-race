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
    question: 'Nisbah bilangan murid lelaki kepada murid perempuan dalam sebuah kelas ialah 3 : 5. Jika terdapat 15 orang murid lelaki, berapakah bilangan murid perempuan?',
    options: ['20 orang', '25 orang', '30 orang'],
    correctIndex: 1,
    difficulty: 1,
    explanation: 'Nisbah lelaki : perempuan = 3 : 5. Faktor pengganda = 15 ÷ 3 = 5. Bilangan murid perempuan = 5 × 5 = 25 orang.'
  },
  {
    id: 'soalan-2',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Nisbah bilangan epal kepada oren ialah 2 : 3, manakala nisbah oren kepada mangga ialah 6 : 5. Apakah nisbah epal kepada oren kepada mangga?',
    options: ['4 : 6 : 5', '2 : 6 : 5', '4 : 3 : 5'],
    correctIndex: 0,
    difficulty: 2,
    explanation: 'Samakan bilangan oren. Nisbah epal : oren = 2 : 3 didarab 2 menjadi 4 : 6. Gabungkan dengan nisbah oren : mangga = 6 : 5. Maka nisbahnya ialah 4 : 6 : 5.'
  },
  {
    id: 'soalan-3',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Nisbah wang Amir kepada wang Bala ialah 4 : 7. Jika wang Amir ialah RM20, berapakah jumlah wang mereka?',
    options: ['RM35', 'RM45', 'RM55'],
    correctIndex: 2,
    difficulty: 1,
    explanation: 'Nilai satu bahagian = RM20 ÷ 4 = RM5. Wang Bala = 7 × RM5 = RM35. Jumlah wang = RM20 + RM35 = RM55.'
  },
  {
    id: 'soalan-4',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Nisbah bilangan guli merah, biru dan hijau ialah 2 : 3 : 4. Jika jumlah guli ialah 45 biji, berapakah bilangan guli biru?',
    options: ['10 biji', '15 biji', '20 biji'],
    correctIndex: 1,
    difficulty: 2,
    explanation: 'Jumlah bahagian = 2 + 3 + 4 = 9. Nilai satu bahagian = 45 ÷ 9 = 5. Guli biru = 3 × 5 = 15 biji.'
  },
  {
    id: 'soalan-5',
    topic: 'Rates',
    topicMalay: 'Kadar',
    question: 'Sebuah kereta menggunakan 5 liter petrol untuk perjalanan sejauh 60 km. Berapakah jarak yang boleh dilalui dengan 15 liter petrol pada kadar penggunaan yang sama?',
    options: ['120 km', '150 km', '180 km'],
    correctIndex: 2,
    difficulty: 1,
    explanation: '15 liter ialah 3 kali 5 liter. Jarak = 60 × 3 = 180 km.'
  },
  {
    id: 'soalan-6',
    topic: 'Rates',
    topicMalay: 'Kadar',
    question: 'Harga 4 buah buku ialah RM28. Berapakah harga 7 buah buku yang sama?',
    options: ['RM42', 'RM49', 'RM56'],
    correctIndex: 1,
    difficulty: 1,
    explanation: 'Harga sebuah buku = RM28 ÷ 4 = RM7. Harga 7 buah buku = 7 × RM7 = RM49.'
  },
  {
    id: 'soalan-7',
    topic: 'Proportions',
    topicMalay: 'Kadaran',
    question: 'Sebuah resipi memerlukan 2 cawan tepung untuk menghasilkan 8 biji kek cawan. Berapakah cawan tepung yang diperlukan untuk menghasilkan 20 biji kek cawan?',
    options: ['4 cawan', '5 cawan', '6 cawan'],
    correctIndex: 1,
    difficulty: 2,
    explanation: 'Faktor pengganda = 20 ÷ 8 = 2.5. Tepung diperlukan = 2 × 2.5 = 5 cawan.'
  },
  {
    id: 'soalan-8',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Nisbah bilangan murid dalam Kelab Matematik kepada Kelab Sains ialah 5 : 3. Jika jumlah murid dalam kedua-dua kelab ialah 64 orang, berapakah bilangan murid dalam Kelab Matematik?',
    options: ['24 orang', '32 orang', '40 orang'],
    correctIndex: 2,
    difficulty: 2,
    explanation: 'Jumlah bahagian = 5 + 3 = 8. Nilai satu bahagian = 64 ÷ 8 = 8. Murid Kelab Matematik = 5 × 8 = 40 orang.'
  },
  {
    id: 'soalan-9',
    topic: 'Rates',
    topicMalay: 'Kadar',
    question: 'Sebuah kedai menjual 3 batang pen dengan harga RM6. Berapakah harga 10 batang pen pada kadar yang sama?',
    options: ['RM18', 'RM20', 'RM24'],
    correctIndex: 1,
    difficulty: 2,
    explanation: 'Harga sebatang pen = RM6 ÷ 3 = RM2. Harga 10 batang pen = 10 × RM2 = RM20.'
  },
  {
    id: 'soalan-10',
    topic: 'Proportions',
    topicMalay: 'Kadaran',
    question: 'Puan Siti mempunyai bajet RM120 untuk membeli buku nota. Harga sebuah buku nota ialah RM8. Jika beliau membeli 12 buah buku nota, berapakah baki wangnya?',
    options: ['RM16', 'RM24', 'RM32'],
    correctIndex: 1,
    difficulty: 1,
    explanation: 'Jumlah harga = 12 × RM8 = RM96. Baki wang = RM120 − RM96 = RM24.'
  },
  {
    id: 'soalan-11',
    topic: 'Ratios',
    topicMalay: 'Nisbah',
    question: 'Nisbah bilangan ayam kepada itik di sebuah ladang ialah 7 : 4. Jika terdapat 28 ekor itik, berapakah jumlah ayam dan itik di ladang tersebut?',
    options: ['49 ekor', '77 ekor', '84 ekor'],
    correctIndex: 1,
    difficulty: 2,
    explanation: 'Faktor pengganda = 28 ÷ 4 = 7. Bilangan ayam = 7 × 7 = 49 ekor. Jumlah ayam dan itik = 49 + 28 = 77 ekor.'
  },
  {
    id: 'soalan-12',
    topic: 'Proportions',
    topicMalay: 'Kadaran',
    question: 'Sebuah kedai menawarkan diskaun 20% untuk sebuah beg yang berharga RM150. Berapakah harga beg tersebut selepas diskaun?',
    options: ['RM100', 'RM120', 'RM130'],
    correctIndex: 1,
    difficulty: 2,
    explanation: 'Diskaun = 20% × RM150 = RM30. Harga selepas diskaun = RM150 − RM30 = RM120.'
  }
];

