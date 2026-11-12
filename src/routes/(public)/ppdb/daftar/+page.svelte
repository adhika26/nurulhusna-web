<script lang="ts">
  import RegistrationWizard from "$lib/components/ppdb/RegistrationWizard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Formulir Pendaftaran | {data.category.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<RegistrationWizard
  category={data.category}
  academicYear={data.academicYear}
  total={data.total}
  draftOwner={data.draftOwner}
/>
