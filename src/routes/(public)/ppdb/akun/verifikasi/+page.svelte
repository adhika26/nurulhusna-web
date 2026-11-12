<script lang="ts">
  import { KeyRound, MessageCircle } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Verifikasi OTP | PPDB</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-12">
  <div class="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
      <KeyRound class="h-6 w-6" />
    </div>
    <h1 class="mt-4 text-2xl font-bold text-stone-900">Verifikasi kode OTP</h1>
    <p class="mt-2 text-sm text-stone-600">
      Kode 6 digit dikirim ke WhatsApp <span class="font-mono font-semibold">{data.phone}</span>.
      Kode berlaku 5 menit.
    </p>

    {#if data.dev}
      <p class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Mode development, kode OTP Anda: <span class="font-mono font-bold">{data.dev}</span>
      </p>
    {/if}

    {#if form?.message}
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
    {/if}

    <form method="POST" action="?/verify" class="mt-5 space-y-4">
      <input type="hidden" name="phone" value={data.phone} />
      <input type="hidden" name="next" value={data.next} />
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Kode OTP</span>
        <input
          name="code"
          inputmode="numeric"
          pattern={"[0-9]{6}"}
          maxlength="6"
          placeholder="000000"
          required
          autocomplete="one-time-code"
          class="w-full rounded-lg border border-stone-300 px-3 py-3 text-center font-mono text-2xl tracking-[0.4em]"
        />
      </label>
      <button
        type="submit"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Verifikasi dan masuk
      </button>
    </form>

    <form method="POST" action="?/resend" class="mt-4 flex items-center justify-between gap-3">
      <input type="hidden" name="phone" value={data.phone} />
      <input type="hidden" name="next" value={data.next} />
      <p class="text-xs text-stone-500">Belum menerima kode?</p>
      <button
        type="submit"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <MessageCircle class="h-3.5 w-3.5" /> Kirim ulang
      </button>
    </form>

    <a href="/ppdb/akun/masuk" class="mt-5 inline-block text-xs text-stone-500 hover:underline">
      Ganti nomor WhatsApp
    </a>
  </div>
</div>
