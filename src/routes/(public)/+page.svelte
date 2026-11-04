<script lang="ts">
  import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    GraduationCap,
    Home,
    SearchCheck
  } from "@lucide/svelte";
  import { formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const heroImage = $derived(data.gallery[0]?.imageUrl ?? null);
  const aboutImage = $derived(data.gallery[1]?.imageUrl ?? data.gallery[0]?.imageUrl ?? null);

  const features = [
    { icon: BookOpen, title: "Mondok + MI", text: "Kelas 1 sampai 6 di MI Nurul Chusna." },
    { icon: GraduationCap, title: "Mondok + MTs", text: "Kelas 7 sampai 9 di MTs. Nurul Chusna." },
    { icon: Home, title: "Mondok Saja", text: "Mukim dan dibina tanpa sekolah formal." },
    { icon: ClipboardCheck, title: "Daftar Online", text: "Isi formulir dari rumah, kapan saja." },
    { icon: SearchCheck, title: "Cek Status", text: "Pantau tagihan dengan kode pendaftaran." }
  ];

  const reasons = [
    "MI dan MTs berada di bawah Yayasan Nurul Husna",
    "Santri mukim dengan pembinaan harian di asrama",
    "Pendaftaran online atau langsung di asrama",
    "Kode pendaftaran untuk cek status dan check-in",
    "Pembayaran lunas atau cicilan tiga kali",
    "Berkas fisik boleh menyusul saat tiba"
  ];

  const steps = [
    { title: "Pilih kategori santri", text: "Tentukan jenjang dan pilihan mondok." },
    { title: "Isi formulir", text: "Lengkapi data santri, orang tua, dan alamat." },
    { title: "Dapatkan kode", text: "Simpan kode pendaftaran yang diterbitkan." },
    { title: "Bayar dan check-in", text: "Unggah bukti transfer, lalu check-in di asrama." }
  ];
</script>

<svelte:head>
  <title>{data.site.name} | Pondok Pesantren di Selomerto, Wonosobo</title>
  <meta
    name="description"
    content="Pondok Pesantren Nurul Husna, Selomerto, Wonosobo. Pendidikan MI, MTs, dan program mondok dengan pendaftaran online."
  />
</svelte:head>

<section class="bg-white">
  <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
    <div>
      <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">
        Pendidikan Islam di Selomerto
      </p>
      <h1 class="mt-3 text-4xl leading-[1.08] font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-[3.6rem]">
        Tumbuh dalam ilmu,
        <span class="text-brand-700">akhlak, dan kemandirian</span>
      </h1>
      <p class="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
        Pondok Pesantren Nurul Husna menaungi MI Nurul Chusna dan MTs. Nurul Chusna, dengan
        program mondok untuk santri yang mukim dan dibina setiap hari.
      </p>

      <div class="mt-8 flex flex-wrap gap-3">
        <a
          href="/ppdb"
          class="inline-flex min-h-12 items-center rounded-full bg-brand-700 px-7 text-sm font-bold text-white hover:bg-brand-800"
        >
          Daftar Santri Baru
        </a>
        <a
          href="/profil"
          class="inline-flex min-h-12 items-center rounded-full border border-stone-300 px-7 text-sm font-bold text-stone-800 hover:border-brand-300 hover:bg-brand-50"
        >
          Kenali Pondok
        </a>
      </div>

      <dl class="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-stone-200 pt-6">
        <div>
          <dt class="text-xs font-medium text-stone-500">Lembaga</dt>
          <dd class="mt-1 text-sm font-bold text-stone-900">MI dan MTs</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-stone-500">Program</dt>
          <dd class="mt-1 text-sm font-bold text-stone-900">Mondok</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-stone-500">Lokasi</dt>
          <dd class="mt-1 text-sm font-bold text-stone-900">Wonosobo</dd>
        </div>
      </dl>
    </div>

    <div class="relative">
      {#if heroImage}
        <div class="aspect-[4/5] overflow-hidden rounded-[2rem] bg-stone-100">
          <img
            src={heroImage}
            alt="Kegiatan santri Pondok Pesantren Nurul Husna"
            width="900"
            height="1125"
            fetchpriority="high"
            class="h-full w-full object-cover"
          />
        </div>
      {:else}
        <div class="arch-pattern flex aspect-[4/5] flex-col items-center justify-center rounded-[2rem] bg-brand-900 px-6 text-center">
          <span class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-2xl font-extrabold text-white">
            NH
          </span>
          <p class="mt-4 max-w-[14rem] text-sm leading-relaxed font-medium text-brand-100">
            Foto kegiatan pondok segera hadir.
          </p>
        </div>
      {/if}
    </div>
  </div>
</section>

<section class="border-y border-stone-100 bg-stone-50">
  <div class="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
    {#each features as feature (feature.title)}
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <feature.icon class="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-bold text-stone-900">{feature.title}</p>
          <p class="mt-1 text-xs leading-relaxed text-stone-600">{feature.text}</p>
        </div>
      </div>
    {/each}
  </div>
</section>

<section class="bg-white">
  <div class="mx-auto max-w-7xl px-4 py-16">
    <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Pilihan pendidikan</p>
        <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Mulai dari jenjang yang sesuai
        </h2>
        <p class="mt-3 text-stone-600">
          Empat kategori pendaftaran, masing-masing dengan biaya dan lembaga yang berbeda.
        </p>
        <a
          href="/program"
          class="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-300 px-6 text-sm font-bold text-stone-800 hover:border-brand-300 hover:bg-brand-50"
        >
          Selengkapnya tentang program
        </a>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {#each data.categories as category (category.code)}
          <a
            href="/ppdb/daftar?kategori={category.code}"
            class="group overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:ring-brand-300"
          >
            <div class="arch-pattern relative flex aspect-[16/9] items-center justify-center bg-brand-800">
              <span class="text-3xl font-extrabold tracking-tight text-white/90">{category.code}</span>
            </div>
            <div class="p-5">
              <p class="text-xs font-semibold text-brand-700">{category.institutionName}</p>
              <h3 class="mt-1 text-lg font-bold text-stone-900">{category.name}</h3>
              <p class="mt-1 text-sm text-stone-500">
                {category.gradeRange ? `Kelas ${category.gradeRange}` : "Tanpa sekolah formal"}
              </p>
              <span class="mt-3 inline-block text-sm font-bold text-brand-700 group-hover:text-brand-900">
                Lihat biaya dan daftar
              </span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
</section>

<section class="bg-brand-50">
  <div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
    <div class="order-2 lg:order-1">
      {#if aboutImage}
        <div class="aspect-[4/3] overflow-hidden rounded-[2rem] bg-stone-100">
          <img
            src={aboutImage}
            alt="Suasana pondok Pesantren Nurul Husna"
            width="1000"
            height="750"
            loading="lazy"
            class="h-full w-full object-cover"
          />
        </div>
      {:else}
        <div class="arch-pattern flex aspect-[4/3] flex-col items-center justify-center rounded-[2rem] bg-brand-800 px-6 text-center">
          <span class="text-4xl font-extrabold text-white/90">NH</span>
          <p class="mt-2 max-w-[16rem] text-sm font-medium text-brand-100">
            Dokumentasi pondok segera hadir.
          </p>
        </div>
      {/if}
    </div>

    <div class="order-1 lg:order-2">
      <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Mengapa Nurul Husna</p>
      <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        Pendidikan yang terarah, pendampingan yang dekat
      </h2>
      <p class="mt-3 leading-relaxed text-stone-600">
        {data.profileExcerpt ??
          "Pondok menaungi pendidikan formal dan pembinaan asrama dalam satu lingkungan yayasan."}
      </p>

      <ul class="mt-6 grid gap-3 sm:grid-cols-2">
        {#each reasons as reason (reason)}
          <li class="flex items-start gap-2 text-sm text-stone-700">
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<section class="bg-white">
  <div class="mx-auto max-w-7xl px-4 py-16">
    <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Alur pendaftaran</p>
    <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
      Empat langkah menuju asrama
    </h2>

    <ol class="mt-8 grid gap-4 lg:grid-cols-4">
      {#each steps as step, index (step.title)}
        <li class="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-100">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {index + 1}
            </span>
            {#if index < steps.length - 1}
              <ChevronRight class="ml-auto hidden h-4 w-4 text-stone-400 lg:block" aria-hidden="true" />
            {/if}
          </div>
          <h3 class="mt-3 text-base font-bold text-stone-900">{step.title}</h3>
          <p class="mt-1 text-sm leading-relaxed text-stone-600">{step.text}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

{#if data.posts.length > 0}
  <section class="border-t border-stone-100 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-16">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Kabar pondok</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">Berita terbaru</h2>
        </div>
        <a href="/berita" class="text-sm font-bold text-brand-700 hover:text-brand-900">Semua berita</a>
      </div>

      <div class="mt-8 grid gap-5 sm:grid-cols-3">
        {#each data.posts as post (post.slug)}
          <a href="/berita/{post.slug}" class="group rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-100 hover:ring-brand-200">
            <time class="text-xs font-medium text-stone-500" datetime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
            <h3 class="mt-2 text-lg leading-snug font-bold text-stone-900 group-hover:text-brand-800">
              {post.title}
            </h3>
            {#if post.excerpt}
              <p class="mt-2 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>
            {/if}
          </a>
        {/each}
      </div>
    </div>
  </section>
{:else}
  <section class="border-t border-stone-100 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-12">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Kabar pondok</p>
          <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">Berita terbaru</h2>
        </div>
        <p class="text-sm text-stone-600">Belum ada berita yang diterbitkan.</p>
      </div>
    </div>
  </section>
{/if}

{#if data.gallery.length > 0}
  <section class="bg-stone-50">
    <div class="mx-auto max-w-7xl px-4 py-16">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm font-bold tracking-wide text-brand-700 uppercase">Galeri</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">Suasana pondok</h2>
        </div>
        <a href="/galeri" class="text-sm font-bold text-brand-700 hover:text-brand-900">Lihat semua foto</a>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {#each data.gallery as item (item.id)}
          {#if item.imageUrl}
            <div class="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
              <img
                src={item.imageUrl}
                alt={item.title ?? "Foto kegiatan pondok"}
                width="800"
                height="600"
                loading="lazy"
                class="h-full w-full object-cover"
              />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </section>
{/if}
