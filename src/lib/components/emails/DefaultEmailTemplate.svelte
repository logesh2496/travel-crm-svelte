<script lang="ts">
  import { Html, Head, Body, Container, Section, Text, Button } from 'svelte-email';
  import EmailHeader from './EmailHeader.svelte';
  import EmailFooter from './EmailFooter.svelte';

  let { 
    companyName = 'TravelCRM',
    logoUrl = '',
    address = '',
    website = '',
    message = '',
    ctaText = '',
    ctaLink = '',
    customHeader = '',
    customFooter = '',
    includeHeader = true,
    includeFooter = true
  } = $props<{
    companyName?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
    message?: string;
    ctaText?: string;
    ctaLink?: string;
    customHeader?: string;
    customFooter?: string;
    includeHeader?: boolean;
    includeFooter?: boolean;
  }>();
</script>

<Html>
  <Head />
  <Body style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
    <Container style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px;">
      {#if includeHeader}
        {#if customHeader}
          <Section style="padding: 20px 48px; border-bottom: 1px solid #e0e0e0;">
            {@html customHeader}
          </Section>
        {:else}
          <EmailHeader {companyName} {logoUrl} />
        {/if}
      {/if}
      <Section style="padding: 0 48px;">
        <Text style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
          {@html message.replace(/\n/g, '<br />')}
        </Text>
        
        {#if ctaText && ctaLink}
          <Section style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <Button href={ctaLink} style="background-color: #5469d4; border-radius: 4px; color: #fff; font-size: 16px; text-decoration: none; text-align: center; display: inline-block; width: 210px; padding: 14px 7px; line-height: 100%; max-width: 100%;">
              {ctaText}
            </Button>
          </Section>
        {/if}
      </Section>
      
      {#if includeFooter}
        {#if customFooter}
          <Section style="padding: 20px 48px; border-top: 1px solid #e0e0e0; margin-top: 32px;">
            {@html customFooter}
          </Section>
        {:else}
          <EmailFooter {companyName} {address} {website} />
        {/if}
      {/if}
    </Container>
  </Body>
</Html>
