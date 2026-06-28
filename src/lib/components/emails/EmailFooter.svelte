<script lang="ts">
  import { Section, Text } from 'svelte-email';

  let { companyName = 'TravelCRM', address = '', website = '' } = $props<{
    companyName?: string;
    address?: string;
    website?: string;
  }>();
</script>

<Section style="padding: 20px 0; text-align: center; border-top: 1px solid #e0e0e0; margin-top: 30px;">
  <Text style="font-size: 12px; color: #888; margin: 0;">
    &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
  </Text>
  {#if address}
    <Text style="font-size: 12px; color: #888; margin: 4px 0 0 0;">
      {address}
    </Text>
  {/if}
  {#if website}
    <Text style="font-size: 12px; color: #888; margin: 4px 0 0 0;">
      <a href={website} style="color: #007bff; text-decoration: none;">{website}</a>
    </Text>
  {/if}
</Section>
