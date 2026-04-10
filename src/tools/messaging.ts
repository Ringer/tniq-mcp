import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerMessagingTools(server: McpServer, client: TniqClient): void {
  // ---------------------------------------------------------------------------
  // Overview
  // ---------------------------------------------------------------------------

  // 1. msg_get_overview — GET /api/v1/messaging/overview
  server.tool(
    "msg_get_overview",
    "Use this tool when you need a high-level summary of the messaging account, including brand counts, campaign counts, and overall 10DLC registration status.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to scope the overview to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId }) => {
      const result = await client.get("/api/v1/messaging/overview", { customerId });
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Brands
  // ---------------------------------------------------------------------------

  // 2. msg_list_brands — GET /api/v1/messaging/brands
  server.tool(
    "msg_list_brands",
    "Use this tool when you need to list all 10DLC brands registered in the account, with optional pagination and customer scoping.",
    {
      page: z
        .number()
        .int()
        .describe("Optional page number for pagination (zero-based or one-based depending on API).")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of brands to return per page.")
        .optional(),
      customerId: z
        .string()
        .describe("Optional customer ID to filter brands belonging to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ page, size, customerId }) => {
      const result = await client.get("/api/v1/messaging/brands", { page, size, customerId });
      return formatResponse(result);
    }
  );

  // 3. msg_get_brand — GET /api/v1/messaging/brands/{brandId}
  server.tool(
    "msg_get_brand",
    "Use this tool when you need to retrieve the full details of a specific 10DLC brand by its ID.",
    {
      brandId: z
        .string()
        .describe("The unique identifier of the brand to retrieve."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ brandId, customerId }) => {
      const result = await client.get(`/api/v1/messaging/brands/${brandId}`, { customerId });
      return formatResponse(result);
    }
  );

  // 4. msg_create_brand — POST /api/v1/messaging/brands
  server.tool(
    "msg_create_brand",
    "Use this tool when you need to register a new 10DLC brand with TCR, providing the business entity details required for campaign messaging.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to create the brand under a specific customer.")
        .optional(),
      displayName: z
        .string()
        .describe("The public-facing display name for the brand."),
      legalName: z
        .string()
        .describe("The legal registered name of the business entity."),
      entityType: z
        .string()
        .describe("The type of business entity (e.g., PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT)."),
      companyName: z
        .string()
        .describe("Optional DBA or trade name of the company, if different from the legal name.")
        .optional(),
      taxId: z
        .string()
        .describe("Optional federal tax ID (EIN) or equivalent business identification number.")
        .optional(),
      vertical: z
        .string()
        .describe("Optional industry vertical for the brand (e.g., AGRICULTURE, COMMUNICATION, EDUCATION).")
        .optional(),
      website: z
        .string()
        .describe("Optional URL of the brand's public-facing website.")
        .optional(),
      brandRelationship: z
        .string()
        .describe("Optional relationship level of the brand to the CSP (e.g., BASIC_ACCOUNT, SMALL_ACCOUNT, MEDIUM_ACCOUNT).")
        .optional(),
      country: z
        .string()
        .describe("Optional ISO 3166-1 alpha-2 country code for the brand's headquarters (e.g., US).")
        .optional(),
      state: z
        .string()
        .describe("Optional state or province code for the brand's headquarters.")
        .optional(),
      city: z
        .string()
        .describe("Optional city for the brand's headquarters address.")
        .optional(),
      street: z
        .string()
        .describe("Optional street address for the brand's headquarters.")
        .optional(),
      postalCode: z
        .string()
        .describe("Optional postal or ZIP code for the brand's headquarters.")
        .optional(),
      primaryContactName: z
        .string()
        .describe("Optional full name of the primary contact person for the brand.")
        .optional(),
      primaryContactEmail: z
        .string()
        .describe("Optional email address of the primary contact person for the brand.")
        .optional(),
      primaryContactPhone: z
        .string()
        .describe("Optional phone number of the primary contact person for the brand.")
        .optional(),
      stockExchange: z
        .string()
        .describe("Optional stock exchange where the brand is listed (e.g., NYSE, NASDAQ), required for publicly traded entities.")
        .optional(),
      stockSymbol: z
        .string()
        .describe("Optional stock ticker symbol for publicly traded brands.")
        .optional(),
      altBusinessId: z
        .string()
        .describe("Optional alternative business identifier (e.g., DUNS number, GIIN).")
        .optional(),
      altBusinessIdType: z
        .string()
        .describe("Optional type of the alternative business identifier (e.g., DUNS, GIIN, LEI).")
        .optional(),
    },
    async ({ customerId, ...body }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/brands?customerId=${encodeURIComponent(customerId)}`
          : "/api/v1/messaging/brands",
        body
      );
      return formatResponse(result);
    }
  );

  // 5. msg_update_brand — PUT /api/v1/messaging/brands/{brandId}
  server.tool(
    "msg_update_brand",
    "Use this tool when you need to update the details of an existing 10DLC brand registration.",
    {
      brandId: z
        .string()
        .describe("The unique identifier of the brand to update."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the update to a specific customer.")
        .optional(),
      displayName: z
        .string()
        .describe("The public-facing display name for the brand."),
      legalName: z
        .string()
        .describe("The legal registered name of the business entity."),
      entityType: z
        .string()
        .describe("The type of business entity (e.g., PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT)."),
      companyName: z
        .string()
        .describe("Optional DBA or trade name of the company, if different from the legal name.")
        .optional(),
      taxId: z
        .string()
        .describe("Optional federal tax ID (EIN) or equivalent business identification number.")
        .optional(),
      vertical: z
        .string()
        .describe("Optional industry vertical for the brand (e.g., AGRICULTURE, COMMUNICATION, EDUCATION).")
        .optional(),
      website: z
        .string()
        .describe("Optional URL of the brand's public-facing website.")
        .optional(),
      brandRelationship: z
        .string()
        .describe("Optional relationship level of the brand to the CSP (e.g., BASIC_ACCOUNT, SMALL_ACCOUNT, MEDIUM_ACCOUNT).")
        .optional(),
      country: z
        .string()
        .describe("Optional ISO 3166-1 alpha-2 country code for the brand's headquarters (e.g., US).")
        .optional(),
      state: z
        .string()
        .describe("Optional state or province code for the brand's headquarters.")
        .optional(),
      city: z
        .string()
        .describe("Optional city for the brand's headquarters address.")
        .optional(),
      street: z
        .string()
        .describe("Optional street address for the brand's headquarters.")
        .optional(),
      postalCode: z
        .string()
        .describe("Optional postal or ZIP code for the brand's headquarters.")
        .optional(),
      primaryContactName: z
        .string()
        .describe("Optional full name of the primary contact person for the brand.")
        .optional(),
      primaryContactEmail: z
        .string()
        .describe("Optional email address of the primary contact person for the brand.")
        .optional(),
      primaryContactPhone: z
        .string()
        .describe("Optional phone number of the primary contact person for the brand.")
        .optional(),
      stockExchange: z
        .string()
        .describe("Optional stock exchange where the brand is listed (e.g., NYSE, NASDAQ).")
        .optional(),
      stockSymbol: z
        .string()
        .describe("Optional stock ticker symbol for publicly traded brands.")
        .optional(),
      altBusinessId: z
        .string()
        .describe("Optional alternative business identifier (e.g., DUNS number, GIIN).")
        .optional(),
      altBusinessIdType: z
        .string()
        .describe("Optional type of the alternative business identifier (e.g., DUNS, GIIN, LEI).")
        .optional(),
    },
    async ({ brandId, customerId, ...body }) => {
      const result = await client.put(
        customerId
          ? `/api/v1/messaging/brands/${brandId}?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/brands/${brandId}`,
        body
      );
      return formatResponse(result);
    }
  );

  // 6. msg_delete_brand — DELETE /api/v1/messaging/brands/{brandId}
  server.tool(
    "msg_delete_brand",
    "Use this tool when you need to delete a 10DLC brand registration. Only use this when the brand is no longer needed and has no active campaigns.",
    {
      brandId: z
        .string()
        .describe("The unique identifier of the brand to delete."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the deletion to a specific customer.")
        .optional(),
    },
    async ({ brandId, customerId }) => {
      const result = await client.delete(`/api/v1/messaging/brands/${brandId}`, { customerId });
      return formatResponse(result);
    }
  );

  // 7. msg_link_brand — POST /api/v1/messaging/brands/link
  server.tool(
    "msg_link_brand",
    "Use this tool when you need to link an existing TCR brand (already registered at The Campaign Registry) to this account by its TCR brand ID.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to link the brand under a specific customer.")
        .optional(),
      tcrBrandId: z
        .string()
        .describe("The TCR-assigned brand ID of the existing brand to link (e.g., BABCDEF)."),
    },
    async ({ customerId, tcrBrandId }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/brands/link?customerId=${encodeURIComponent(customerId)}`
          : "/api/v1/messaging/brands/link",
        { tcrBrandId }
      );
      return formatResponse(result);
    }
  );

  // 8. msg_lookup_brand — GET /api/v1/messaging/brands/lookup/{tcrBrandId}
  server.tool(
    "msg_lookup_brand",
    "Use this tool when you need to look up brand details directly from TCR using a TCR brand ID, without requiring the brand to be registered in this account.",
    {
      tcrBrandId: z
        .string()
        .describe("The TCR-assigned brand ID to look up (e.g., BABCDEF)."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tcrBrandId }) => {
      const result = await client.get(`/api/v1/messaging/brands/lookup/${tcrBrandId}`);
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Campaigns
  // ---------------------------------------------------------------------------

  // 9. msg_list_campaigns — GET /api/v1/messaging/campaigns
  server.tool(
    "msg_list_campaigns",
    "Use this tool when you need to list all 10DLC campaigns, optionally filtered by brand and paginated.",
    {
      page: z
        .number()
        .int()
        .describe("Optional page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of campaigns to return per page.")
        .optional(),
      brandId: z
        .string()
        .describe("Optional brand ID to filter campaigns belonging to a specific brand.")
        .optional(),
      customerId: z
        .string()
        .describe("Optional customer ID to filter campaigns belonging to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ page, size, brandId, customerId }) => {
      const result = await client.get("/api/v1/messaging/campaigns", { page, size, brandId, customerId });
      return formatResponse(result);
    }
  );

  // 10. msg_get_campaign — GET /api/v1/messaging/campaigns/{campaignId}
  server.tool(
    "msg_get_campaign",
    "Use this tool when you need to retrieve the full details of a specific 10DLC campaign by its ID.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to retrieve."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ campaignId, customerId }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/${campaignId}`, { customerId });
      return formatResponse(result);
    }
  );

  // 11. msg_create_campaign — POST /api/v1/messaging/campaigns
  server.tool(
    "msg_create_campaign",
    "Use this tool when you need to register a new 10DLC messaging campaign with TCR, specifying the brand, use case, message content, and compliance details.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to create the campaign under a specific customer.")
        .optional(),
      brandId: z
        .string()
        .describe("The unique identifier of the brand this campaign is associated with."),
      useCase: z
        .string()
        .describe("The TCR use case for the campaign (e.g., MARKETING, 2FA, ACCOUNT_NOTIFICATION, CUSTOMER_CARE)."),
      description: z
        .string()
        .describe("A clear description of the campaign's purpose and the messages that will be sent."),
      messageFlow: z
        .string()
        .describe("A description of the message flow — how end users will opt in, what they will receive, and how to opt out."),
      sampleMessages: z
        .array(z.string().describe("A sample message that may be sent to end users as part of this campaign."))
        .describe("An array of sample messages that represent the content that will be sent (at least one required)."),
      subUseCases: z
        .array(z.string().describe("A sub-use-case identifier for mixed or special use cases."))
        .describe("Optional array of sub-use-case identifiers for campaigns with multiple use case types.")
        .optional(),
      resellerId: z
        .string()
        .describe("Optional reseller ID if the campaign is being registered on behalf of a reseller.")
        .optional(),
      subscriberOptin: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports subscriber opt-in flows.")
        .optional(),
      subscriberOptout: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports subscriber opt-out flows.")
        .optional(),
      subscriberHelp: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports a HELP response for subscribers.")
        .optional(),
      optinKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger opt-in (e.g., START, YES, SUBSCRIBE).")
        .optional(),
      optinMessage: z
        .string()
        .describe("Optional confirmation message sent to subscribers after they opt in.")
        .optional(),
      optoutKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger opt-out (e.g., STOP, CANCEL, UNSUBSCRIBE).")
        .optional(),
      optoutMessage: z
        .string()
        .describe("Optional confirmation message sent to subscribers after they opt out.")
        .optional(),
      helpKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger a HELP response (e.g., HELP, INFO).")
        .optional(),
      helpMessage: z
        .string()
        .describe("Optional message sent to subscribers when they send a HELP keyword.")
        .optional(),
      embeddedLink: z
        .boolean()
        .describe("Optional flag indicating whether messages will contain embedded URLs.")
        .optional(),
      embeddedPhone: z
        .boolean()
        .describe("Optional flag indicating whether messages will contain embedded phone numbers.")
        .optional(),
      numberPool: z
        .boolean()
        .describe("Optional flag indicating whether the campaign uses a pool of phone numbers for sending.")
        .optional(),
      ageGated: z
        .boolean()
        .describe("Optional flag indicating whether the campaign delivers age-restricted content.")
        .optional(),
      directLending: z
        .boolean()
        .describe("Optional flag indicating whether the campaign is for direct lending or loan advertising.")
        .optional(),
      affiliateMarketing: z
        .boolean()
        .describe("Optional flag indicating whether the campaign involves affiliate marketing content.")
        .optional(),
      privacyPolicyUrl: z
        .string()
        .describe("Optional URL to the brand's privacy policy page.")
        .optional(),
      termsUrl: z
        .string()
        .describe("Optional URL to the brand's terms and conditions page.")
        .optional(),
      autoRenewal: z
        .boolean()
        .describe("Optional flag indicating whether the campaign subscription auto-renews.")
        .optional(),
    },
    async ({ customerId, ...body }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/campaigns?customerId=${encodeURIComponent(customerId)}`
          : "/api/v1/messaging/campaigns",
        body
      );
      return formatResponse(result);
    }
  );

  // 12. msg_update_campaign — PUT /api/v1/messaging/campaigns/{campaignId}
  server.tool(
    "msg_update_campaign",
    "Use this tool when you need to update the details of an existing 10DLC campaign registration.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to update."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the update to a specific customer.")
        .optional(),
      brandId: z
        .string()
        .describe("The unique identifier of the brand this campaign is associated with."),
      useCase: z
        .string()
        .describe("The TCR use case for the campaign (e.g., MARKETING, 2FA, ACCOUNT_NOTIFICATION, CUSTOMER_CARE)."),
      description: z
        .string()
        .describe("A clear description of the campaign's purpose and the messages that will be sent."),
      messageFlow: z
        .string()
        .describe("A description of the message flow — how end users will opt in, what they will receive, and how to opt out."),
      sampleMessages: z
        .array(z.string().describe("A sample message that may be sent to end users as part of this campaign."))
        .describe("An array of sample messages that represent the content that will be sent (at least one required)."),
      subUseCases: z
        .array(z.string().describe("A sub-use-case identifier for mixed or special use cases."))
        .describe("Optional array of sub-use-case identifiers for campaigns with multiple use case types.")
        .optional(),
      resellerId: z
        .string()
        .describe("Optional reseller ID if the campaign is being registered on behalf of a reseller.")
        .optional(),
      subscriberOptin: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports subscriber opt-in flows.")
        .optional(),
      subscriberOptout: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports subscriber opt-out flows.")
        .optional(),
      subscriberHelp: z
        .boolean()
        .describe("Optional flag indicating whether the campaign supports a HELP response for subscribers.")
        .optional(),
      optinKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger opt-in (e.g., START, YES, SUBSCRIBE).")
        .optional(),
      optinMessage: z
        .string()
        .describe("Optional confirmation message sent to subscribers after they opt in.")
        .optional(),
      optoutKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger opt-out (e.g., STOP, CANCEL, UNSUBSCRIBE).")
        .optional(),
      optoutMessage: z
        .string()
        .describe("Optional confirmation message sent to subscribers after they opt out.")
        .optional(),
      helpKeywords: z
        .string()
        .describe("Optional comma-separated keywords that trigger a HELP response (e.g., HELP, INFO).")
        .optional(),
      helpMessage: z
        .string()
        .describe("Optional message sent to subscribers when they send a HELP keyword.")
        .optional(),
      embeddedLink: z
        .boolean()
        .describe("Optional flag indicating whether messages will contain embedded URLs.")
        .optional(),
      embeddedPhone: z
        .boolean()
        .describe("Optional flag indicating whether messages will contain embedded phone numbers.")
        .optional(),
      numberPool: z
        .boolean()
        .describe("Optional flag indicating whether the campaign uses a pool of phone numbers for sending.")
        .optional(),
      ageGated: z
        .boolean()
        .describe("Optional flag indicating whether the campaign delivers age-restricted content.")
        .optional(),
      directLending: z
        .boolean()
        .describe("Optional flag indicating whether the campaign is for direct lending or loan advertising.")
        .optional(),
      affiliateMarketing: z
        .boolean()
        .describe("Optional flag indicating whether the campaign involves affiliate marketing content.")
        .optional(),
      privacyPolicyUrl: z
        .string()
        .describe("Optional URL to the brand's privacy policy page.")
        .optional(),
      termsUrl: z
        .string()
        .describe("Optional URL to the brand's terms and conditions page.")
        .optional(),
      autoRenewal: z
        .boolean()
        .describe("Optional flag indicating whether the campaign subscription auto-renews.")
        .optional(),
    },
    async ({ campaignId, customerId, ...body }) => {
      const result = await client.put(
        customerId
          ? `/api/v1/messaging/campaigns/${campaignId}?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/campaigns/${campaignId}`,
        body
      );
      return formatResponse(result);
    }
  );

  // 13. msg_resubmit_campaign — PUT /api/v1/messaging/campaigns/{campaignId}/resubmit
  server.tool(
    "msg_resubmit_campaign",
    "Use this tool when you need to resubmit a previously rejected or failed 10DLC campaign to TCR for re-review.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to resubmit."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the resubmission to a specific customer.")
        .optional(),
    },
    async ({ campaignId, customerId }) => {
      const result = await client.put(
        customerId
          ? `/api/v1/messaging/campaigns/${campaignId}/resubmit?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/campaigns/${campaignId}/resubmit`
      );
      return formatResponse(result);
    }
  );

  // 14. msg_link_campaign — POST /api/v1/messaging/campaigns/link
  server.tool(
    "msg_link_campaign",
    "Use this tool when you need to link an existing TCR campaign (already registered at The Campaign Registry) to this account by its TCR campaign ID.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to link the campaign under a specific customer.")
        .optional(),
      tcrCampaignId: z
        .string()
        .describe("The TCR-assigned campaign ID of the existing campaign to link (e.g., CABCDEF)."),
    },
    async ({ customerId, tcrCampaignId }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/campaigns/link?customerId=${encodeURIComponent(customerId)}`
          : "/api/v1/messaging/campaigns/link",
        { tcrCampaignId }
      );
      return formatResponse(result);
    }
  );

  // 15. msg_lookup_campaign — GET /api/v1/messaging/campaigns/lookup/{tcrCampaignId}
  server.tool(
    "msg_lookup_campaign",
    "Use this tool when you need to look up campaign details directly from TCR using a TCR campaign ID, without requiring the campaign to be registered in this account.",
    {
      tcrCampaignId: z
        .string()
        .describe("The TCR-assigned campaign ID to look up (e.g., CABCDEF)."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tcrCampaignId }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/lookup/${tcrCampaignId}`);
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Campaign Numbers
  // ---------------------------------------------------------------------------

  // 16. msg_list_campaign_numbers — GET /api/v1/messaging/campaigns/{campaignId}/numbers
  server.tool(
    "msg_list_campaign_numbers",
    "Use this tool when you need to list all phone numbers currently assigned to a specific 10DLC campaign.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign whose assigned numbers to list."),
      page: z
        .number()
        .int()
        .describe("Optional page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of phone numbers to return per page.")
        .optional(),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ campaignId, page, size, customerId }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/${campaignId}/numbers`, { page, size, customerId });
      return formatResponse(result);
    }
  );

  // 17. msg_assign_numbers — POST /api/v1/messaging/campaigns/{campaignId}/numbers
  server.tool(
    "msg_assign_numbers",
    "Use this tool when you need to assign one or more phone numbers to a 10DLC campaign so they can send messages under that campaign's registration.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to assign numbers to."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the assignment to a specific customer.")
        .optional(),
      phoneNumbers: z
        .array(z.string().describe("A phone number to assign to the campaign (e.g., +12125551234)."))
        .describe("An array of phone numbers to assign to this campaign."),
    },
    async ({ campaignId, customerId, phoneNumbers }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/campaigns/${campaignId}/numbers?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/campaigns/${campaignId}/numbers`,
        { phoneNumbers }
      );
      return formatResponse(result);
    }
  );

  // 18. msg_remove_numbers — DELETE /api/v1/messaging/campaigns/{campaignId}/numbers
  server.tool(
    "msg_remove_numbers",
    "Use this tool when you need to remove one or more phone numbers from a 10DLC campaign, unassigning them from that campaign's messaging registration.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to remove numbers from."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the removal to a specific customer.")
        .optional(),
      phoneNumbers: z
        .array(z.string().describe("A phone number to remove from the campaign (e.g., +12125551234)."))
        .describe("An array of phone numbers to remove from this campaign."),
    },
    async ({ campaignId, customerId, phoneNumbers }) => {
      const result = await client.delete(
        `/api/v1/messaging/campaigns/${campaignId}/numbers`,
        { customerId },
        { phoneNumbers }
      );
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Campaign CNP
  // ---------------------------------------------------------------------------

  // 19. msg_elect_cnp — POST /api/v1/messaging/campaigns/{campaignId}/cnp
  server.tool(
    "msg_elect_cnp",
    "Use this tool when you need to elect a Connectivity Partner (CNP) for a 10DLC campaign, authorizing them to send messages under this campaign's registration.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign for which to elect a CNP."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the election to a specific customer.")
        .optional(),
      body: z
        .record(z.unknown())
        .describe("The CNP election payload as required by the API (passthrough object with CNP-specific fields).")
        .optional(),
    },
    async ({ campaignId, customerId, body }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/campaigns/${campaignId}/cnp?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/campaigns/${campaignId}/cnp`,
        body ?? {}
      );
      return formatResponse(result);
    }
  );

  // 20. msg_nudge_cnp — POST /api/v1/messaging/campaigns/{campaignId}/nudge
  server.tool(
    "msg_nudge_cnp",
    "Use this tool when you need to nudge or remind a CNP to accept or action a pending campaign election request.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign for which to nudge the CNP."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the nudge to a specific customer.")
        .optional(),
      body: z
        .record(z.unknown())
        .describe("The nudge payload as required by the API (passthrough object with CNP-specific fields).")
        .optional(),
    },
    async ({ campaignId, customerId, body }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/campaigns/${campaignId}/nudge?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/campaigns/${campaignId}/nudge`,
        body ?? {}
      );
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Campaign Status
  // ---------------------------------------------------------------------------

  // 21. msg_get_sharing_status — GET /api/v1/messaging/campaigns/{campaignId}/sharing
  server.tool(
    "msg_get_sharing_status",
    "Use this tool when you need to check the sharing status of a 10DLC campaign, including which CNPs have accepted or rejected the campaign.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to check sharing status for."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ campaignId, customerId }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/${campaignId}/sharing`, { customerId });
      return formatResponse(result);
    }
  );

  // 22. msg_get_mno_status — GET /api/v1/messaging/campaigns/{campaignId}/mno-status
  server.tool(
    "msg_get_mno_status",
    "Use this tool when you need to check the MNO (Mobile Network Operator) vetting and approval status of a 10DLC campaign across carriers such as AT&T, T-Mobile, and Verizon.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign to check MNO status for."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ campaignId, customerId }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/${campaignId}/mno-status`, { customerId });
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // NNIDs
  // ---------------------------------------------------------------------------

  // 23. msg_list_nnids — GET /api/v1/messaging/nnids
  server.tool(
    "msg_list_nnids",
    "Use this tool when you need to list all Network Node Identifiers (NNIDs) configured in the account, which are used to associate campaigns with specific carrier network nodes.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to filter NNIDs belonging to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId }) => {
      const result = await client.get("/api/v1/messaging/nnids", { customerId });
      return formatResponse(result);
    }
  );

  // 24. msg_get_nnid — GET /api/v1/messaging/nnids/{nnidId}
  server.tool(
    "msg_get_nnid",
    "Use this tool when you need to retrieve the full details of a specific NNID (Network Node Identifier) by its ID.",
    {
      nnidId: z
        .string()
        .describe("The unique identifier of the NNID to retrieve."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the request to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ nnidId, customerId }) => {
      const result = await client.get(`/api/v1/messaging/nnids/${nnidId}`, { customerId });
      return formatResponse(result);
    }
  );

  // 25. msg_create_nnid — POST /api/v1/messaging/nnids
  server.tool(
    "msg_create_nnid",
    "Use this tool when you need to create a new NNID (Network Node Identifier) to associate a carrier network node with messaging campaigns.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to create the NNID under a specific customer.")
        .optional(),
      nnid: z
        .string()
        .describe("The NNID value — the carrier-assigned network node identifier string."),
      description: z
        .string()
        .describe("Optional human-readable description of this NNID's purpose or associated network node.")
        .optional(),
      carrierCode: z
        .string()
        .describe("Optional carrier code identifying the carrier associated with this network node.")
        .optional(),
      spid: z
        .string()
        .describe("Optional 4-character Service Provider ID (SPID) associated with this NNID.")
        .optional(),
      isDefault: z
        .boolean()
        .describe("Optional flag indicating whether this NNID should be the default for the account or customer.")
        .optional(),
    },
    async ({ customerId, ...body }) => {
      const result = await client.post(
        customerId
          ? `/api/v1/messaging/nnids?customerId=${encodeURIComponent(customerId)}`
          : "/api/v1/messaging/nnids",
        body
      );
      return formatResponse(result);
    }
  );

  // 26. msg_update_nnid — PUT /api/v1/messaging/nnids/{nnidId}
  server.tool(
    "msg_update_nnid",
    "Use this tool when you need to update the details of an existing NNID (Network Node Identifier).",
    {
      nnidId: z
        .string()
        .describe("The unique identifier of the NNID to update."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the update to a specific customer.")
        .optional(),
      nnid: z
        .string()
        .describe("The NNID value — the carrier-assigned network node identifier string."),
      description: z
        .string()
        .describe("Optional human-readable description of this NNID's purpose or associated network node.")
        .optional(),
      carrierCode: z
        .string()
        .describe("Optional carrier code identifying the carrier associated with this network node.")
        .optional(),
      spid: z
        .string()
        .describe("Optional 4-character Service Provider ID (SPID) associated with this NNID.")
        .optional(),
      isDefault: z
        .boolean()
        .describe("Optional flag indicating whether this NNID should be the default for the account or customer.")
        .optional(),
    },
    async ({ nnidId, customerId, ...body }) => {
      const result = await client.put(
        customerId
          ? `/api/v1/messaging/nnids/${nnidId}?customerId=${encodeURIComponent(customerId)}`
          : `/api/v1/messaging/nnids/${nnidId}`,
        body
      );
      return formatResponse(result);
    }
  );

  // 27. msg_delete_nnid — DELETE /api/v1/messaging/nnids/{nnidId}
  server.tool(
    "msg_delete_nnid",
    "Use this tool when you need to delete an NNID (Network Node Identifier) that is no longer needed.",
    {
      nnidId: z
        .string()
        .describe("The unique identifier of the NNID to delete."),
      customerId: z
        .string()
        .describe("Optional customer ID to scope the deletion to a specific customer.")
        .optional(),
    },
    async ({ nnidId, customerId }) => {
      const result = await client.delete(`/api/v1/messaging/nnids/${nnidId}`, { customerId });
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Enums (reference data)
  // ---------------------------------------------------------------------------

  // 28. msg_list_verticals — GET /api/v1/messaging/enums/verticals
  server.tool(
    "msg_list_verticals",
    "Use this tool when you need to retrieve the list of valid industry vertical values accepted by TCR for brand registration.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/messaging/enums/verticals");
      return formatResponse(result);
    }
  );

  // 29. msg_list_use_cases — GET /api/v1/messaging/enums/use-cases
  server.tool(
    "msg_list_use_cases",
    "Use this tool when you need to retrieve the list of valid campaign use case values accepted by TCR for campaign registration.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/messaging/enums/use-cases");
      return formatResponse(result);
    }
  );

  // 30. msg_list_mnos — GET /api/v1/messaging/enums/mnos
  server.tool(
    "msg_list_mnos",
    "Use this tool when you need to retrieve the list of Mobile Network Operators (MNOs) that participate in 10DLC vetting and their identifiers.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/messaging/enums/mnos");
      return formatResponse(result);
    }
  );

  // 31. msg_list_entity_types — GET /api/v1/messaging/enums/entity-types
  server.tool(
    "msg_list_entity_types",
    "Use this tool when you need to retrieve the list of valid business entity types accepted by TCR for brand registration (e.g., PRIVATE_PROFIT, NON_PROFIT, GOVERNMENT).",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/messaging/enums/entity-types");
      return formatResponse(result);
    }
  );

  // 32. msg_list_cnps — GET /api/v1/messaging/enums/cnps
  server.tool(
    "msg_list_cnps",
    "Use this tool when you need to retrieve the list of registered Connectivity Partners (CNPs) available for campaign election.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/messaging/enums/cnps");
      return formatResponse(result);
    }
  );

  // ---------------------------------------------------------------------------
  // Event History
  // ---------------------------------------------------------------------------

  // 33. msg_get_brand_events — GET /api/v1/messaging/brands/{brandId}/events
  server.tool(
    "msg_get_brand_events",
    "Use this tool when you need to retrieve the event history for a specific 10DLC brand, including status changes, TCR submissions, and other lifecycle events.",
    {
      brandId: z
        .string()
        .describe("The unique identifier of the brand whose event history to retrieve."),
      page: z
        .number()
        .int()
        .describe("Optional page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of events to return per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ brandId, page, size }) => {
      const result = await client.get(`/api/v1/messaging/brands/${brandId}/events`, { page, size });
      return formatResponse(result);
    }
  );

  // 34. msg_get_campaign_events — GET /api/v1/messaging/campaigns/{campaignId}/events
  server.tool(
    "msg_get_campaign_events",
    "Use this tool when you need to retrieve the event history for a specific 10DLC campaign, including status changes, MNO responses, and other lifecycle events.",
    {
      campaignId: z
        .string()
        .describe("The unique identifier of the campaign whose event history to retrieve."),
      page: z
        .number()
        .int()
        .describe("Optional page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of events to return per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ campaignId, page, size }) => {
      const result = await client.get(`/api/v1/messaging/campaigns/${campaignId}/events`, { page, size });
      return formatResponse(result);
    }
  );
}
