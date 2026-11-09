/**
 * Copy for the Our Story (/about) page, in English and Bahasa Melayu.
 *
 * Facts used here are confirmed by the owner: sewing bags since 2014, authentic
 * Terengganu batik, a craft workshop rooted in Terengganu, 100% handmade, suitable
 * for all ages. We do NOT make the batik fabric. Do not add unverified specifics
 * (hardware, stitch types, named people) without confirming them first.
 */

export interface Bilingual {
  en: string;
  ms: string;
}

export interface AboutStep {
  number: string;
  title: Bilingual;
  body: Bilingual;
}

export interface AboutStat {
  value: Bilingual;
  label: Bilingual;
}

export const aboutContent = {
  eyebrow: { en: 'Our Story', ms: 'Kisah Kami' },
  headline: {
    en: 'Sewn in Terengganu, from Terengganu batik.',
    ms: 'Dijahit di Terengganu, daripada batik Terengganu.',
  },
  intro: {
    en: 'Fat_Rahz Batik gives authentic Terengganu batik a modern second life as bags that are practical, elegant and made to be used.',
    ms: 'Fat_Rahz Batik memberi batik asli Terengganu kehidupan baharu sebagai beg yang praktikal, elegan dan dibuat untuk digunakan.',
  },

  who: {
    title: { en: 'Who we are', ms: 'Siapa kami' },
    paragraphs: [
      {
        en: 'We are craft-sewers. Since 2014 we have been turning batik cloth into bags, in a workshop rooted in Terengganu.',
        ms: 'Kami ialah penjahit kraf. Sejak 2014 kami menukar kain batik menjadi beg, di bengkel yang berpusat di Terengganu.',
      },
      {
        en: 'Every bag is 100% handmade, with close attention to detail from the first cut to the final check.',
        ms: 'Setiap beg 100% buatan tangan, dengan perhatian teliti pada setiap butiran, dari potongan pertama hingga pemeriksaan akhir.',
      },
    ] satisfies Bilingual[],
  },

  sourcing: {
    title: { en: 'Honest about the cloth', ms: 'Jujur tentang kainnya' },
    body: {
      en: 'We do not make the batik fabric. We choose authentic Terengganu batik and give it a new life as a bag. The batik carries the tradition. The cutting, tailoring and finishing are our craft.',
      ms: 'Kami tidak menghasilkan kain batik. Kami memilih batik asli Terengganu dan memberinya kehidupan baharu sebagai beg. Batik membawa tradisi. Pemotongan, penjahitan dan kemasan ialah kraf kami.',
    },
  },

  stepsTitle: { en: 'How a bag is made', ms: 'Bagaimana beg dibuat' },
  steps: [
    {
      number: '01',
      title: { en: 'Choose the batik', ms: 'Pilih batik' },
      body: {
        en: 'We pick authentic Terengganu batik for its pattern and colour.',
        ms: 'Kami memilih batik asli Terengganu kerana corak dan warnanya.',
      },
    },
    {
      number: '02',
      title: { en: 'Plan and cut', ms: 'Rancang dan potong' },
      body: {
        en: 'Each piece is planned and cut so the pattern sits well on the finished bag.',
        ms: 'Setiap kepingan dirancang dan dipotong supaya corak kelihatan cantik pada beg yang siap.',
      },
    },
    {
      number: '03',
      title: { en: 'Sew and tailor', ms: 'Jahit dan sesuaikan' },
      body: {
        en: 'Every bag is sewn and tailored by hand, with attention to detail.',
        ms: 'Setiap beg dijahit dan disesuaikan dengan tangan, dengan perhatian pada butiran.',
      },
    },
    {
      number: '04',
      title: { en: 'Finish and check', ms: 'Kemas dan semak' },
      body: {
        en: 'We finish each bag and check the details before it goes to you.',
        ms: 'Kami mengemas setiap beg dan menyemak butirannya sebelum sampai kepada anda.',
      },
    },
  ] satisfies AboutStep[],

  everyAge: {
    title: { en: 'For every age, every day', ms: 'Untuk semua peringkat umur, setiap hari' },
    body: {
      en: 'From casual, modern daily wear to elegant, classic looks, our bags are made to suit all age groups.',
      ms: 'Daripada gaya harian yang santai dan moden hingga penampilan klasik yang elegan, beg kami dibuat untuk sesuai dengan semua peringkat umur.',
    },
  },

  stats: [
    { value: { en: '2014', ms: '2014' }, label: { en: 'Sewing bags since', ms: 'Menjahit beg sejak' } },
    { value: { en: '100%', ms: '100%' }, label: { en: 'Handmade', ms: 'Buatan tangan' } },
    { value: { en: 'Terengganu', ms: 'Terengganu' }, label: { en: 'Where our craft is rooted', ms: 'Tempat kraf kami berakar' } },
  ] satisfies AboutStat[],

  buy: {
    title: { en: 'Two ways to buy', ms: 'Dua cara untuk membeli' },
    ready: {
      title: { en: 'Ready Stock', ms: 'Stok Sedia Ada' },
      body: {
        en: 'One-of-a-kind bags, each with its own batik pattern. Pick the exact bag you love.',
        ms: 'Beg satu-satunya, setiap satu dengan corak batik tersendiri. Pilih beg yang betul-betul anda suka.',
      },
      cta: { en: 'Shop Ready Stock', ms: 'Beli Stok Sedia Ada' },
    },
    preorder: {
      title: { en: 'Pre-order', ms: 'Pra-tempah' },
      body: {
        en: 'Choose a design and we sew it for you, in the size you need. Allow 2–4 weeks.',
        ms: 'Pilih rekaan dan kami jahitkan untuk anda, dalam saiz yang anda perlukan. Sila beri tempoh 2–4 minggu.',
      },
      cta: { en: 'Browse Pre-order', ms: 'Lihat Pra-tempah' },
    },
  },

  find: {
    title: { en: 'Find us', ms: 'Hubungi kami' },
    body: {
      en: 'Message us on WhatsApp to order, or follow along on Instagram and Threads. We are also on Shopee.',
      ms: 'Mesej kami di WhatsApp untuk membuat pesanan, atau ikuti kami di Instagram dan Threads. Kami juga ada di Shopee.',
    },
  },
};
