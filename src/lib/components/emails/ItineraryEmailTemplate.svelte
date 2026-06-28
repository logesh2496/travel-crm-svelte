<script lang="ts">
  import { Html, Head, Body, Container, Section, Text, Img, Hr } from 'svelte-email';
  import EmailHeader from './EmailHeader.svelte';
  import EmailFooter from './EmailFooter.svelte';

  export interface ItineraryDay {
    dayNumber: number;
    title: string;
    description: string;
    imageUrl?: string;
    hotel?: string;
    flight?: string;
  }

  let { 
    companyName = 'TravelCRM',
    logoUrl = '',
    address = '',
    website = '',
    greeting = 'Here is your upcoming itinerary!',
    days = [],
    customHeader = '',
    customFooter = '',
    includeHeader = true,
    includeFooter = true
  } = $props<{
    companyName?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
    greeting?: string;
    days?: ItineraryDay[];
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
      
      <Section style="padding: 20px 48px;">
        <Text style="color: #333; font-size: 18px; line-height: 28px; text-align: center; margin-bottom: 30px;">
          {@html greeting.replace(/\n/g, '<br />')}
        </Text>

        {#each days as day}
          <Section style="margin-bottom: 30px; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            {#if day.imageUrl}
              <Img src={day.imageUrl} width="100%" height="250" style="object-fit: cover; display: block;" alt={`Day ${day.dayNumber}`} />
            {/if}
            <div style="padding: 20px;">
              <Text style="font-size: 20px; font-weight: bold; color: #333; margin: 0 0 10px 0;">
                Day {day.dayNumber}: {day.title}
              </Text>
              
              {#if day.flight}
                <Text style="font-size: 14px; color: #555; margin: 5px 0;">
                  <strong style="color:#007bff;">✈️ Flight:</strong> {day.flight}
                </Text>
              {/if}
              
              {#if day.hotel}
                <Text style="font-size: 14px; color: #555; margin: 5px 0;">
                  <strong style="color:#28a745;">🏨 Hotel:</strong> {day.hotel}
                </Text>
              {/if}

              {#if day.flight || day.hotel}
                <Hr style="border-color: #eaeaea; margin: 15px 0;" />
              {/if}

              <Text style="font-size: 15px; color: #525f7f; line-height: 24px; margin: 0;">
                {@html day.description.replace(/\n/g, '<br />')}
              </Text>
            </div>
          </Section>
        {/each}
        
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
