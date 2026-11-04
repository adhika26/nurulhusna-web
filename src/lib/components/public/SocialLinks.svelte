<script lang="ts">
  type SocialLinks = {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };

  let { links, variant = "dark" }: { links: SocialLinks; variant?: "dark" | "light" } = $props();

  const linkClass = $derived(
    variant === "light"
      ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
      : "bg-white/10 text-brand-100 hover:bg-white/20 hover:text-white"
  );

  const emptyClass = $derived(
    variant === "light" ? "bg-brand-100/70 text-brand-500" : "bg-white/5 text-brand-200 opacity-50"
  );

  const icons = {
    facebook:
      "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z",
    instagram:
      "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.67.51.72.28 1.33.66 1.94 1.27.61.61.99 1.22 1.27 1.94.27.7.46 1.5.51 2.67.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.51 2.67a5.36 5.36 0 0 1-1.27 1.94 5.36 5.36 0 0 1-1.94 1.27c-.7.27-1.5.46-2.67.51-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.67-.51a5.36 5.36 0 0 1-1.94-1.27 5.36 5.36 0 0 1-1.27-1.94c-.27-.7-.46-1.5-.51-2.67C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.51-2.67.28-.72.66-1.33 1.27-1.94.61-.61 1.22-.99 1.94-1.27.7-.27 1.5-.46 2.67-.51C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.14 0-3.51.01-4.75.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.26.82-.38.38-.62.75-.82 1.26-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.07.23 1.65.38 2.04.2.51.44.88.82 1.26.38.38.75.62 1.26.82.39.15.97.33 2.04.38 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.26-.82.38-.38.62-.75.82-1.26.15-.39.33-.97.38-2.04.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.07-.23-1.65-.38-2.04-.2-.51-.44-.88-.82-1.26a3.5 3.5 0 0 0-1.26-.82c-.39-.15-.97-.33-2.04-.38C15.51 3.97 15.14 3.96 12 3.96zm0 3.06a4.98 4.98 0 1 1 0 9.96 4.98 4.98 0 0 1 0-9.96zm0 8.21a3.23 3.23 0 1 0 0-6.46 3.23 3.23 0 0 0 0 6.46zm6.34-8.41a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z",
    youtube:
      "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
    tiktok:
      "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.05.87.13V9.4a6.34 6.34 0 0 0-1-.08A6.33 6.33 0 0 0 5.7 20.1a6.33 6.33 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.74-.07z"
  };

  const items = $derived([
    { key: "facebook", label: "Facebook", href: links.facebook, path: icons.facebook },
    { key: "instagram", label: "Instagram", href: links.instagram, path: icons.instagram },
    { key: "youtube", label: "YouTube", href: links.youtube, path: icons.youtube },
    { key: "tiktok", label: "TikTok", href: links.tiktok, path: icons.tiktok }
  ]);
</script>

{#if items.length > 0}
  <ul class="flex flex-wrap items-center gap-2">
    {#each items as item (item.key)}
      <li>
        {#if item.href}
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            class="flex h-10 w-10 items-center justify-center rounded-full {linkClass}"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d={item.path} />
            </svg>
          </a>
        {:else}
          <span
            aria-label="{item.label} belum diatur"
            title="{item.label} belum diatur"
            class="flex h-10 w-10 items-center justify-center rounded-full {emptyClass} opacity-50"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d={item.path} />
            </svg>
          </span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
