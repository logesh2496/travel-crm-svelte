<script lang="ts">
  import { Section, Text, Img } from 'svelte-email';

  let { logoUrl = '', companyName = 'TravelCRM' } = $props<{
    logoUrl?: string;
    companyName?: string;
  }>();
</script>

<Section style="padding: 20px 0; text-align: center; border-bottom: 1px solid #e0e0e0;">
  {#if logoUrl}
    <Img src={logoUrl} width="150" height="auto" alt={companyName} style="margin: 0 auto;" />
  {:else}
    <Text style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">{companyName}</Text>
  {/if}
</Section>
