import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Meta (Facebook, Instagram, WhatsApp) Webhook Endpoint
export const metaWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Webhook Verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // TODO: Set META_VERIFY_TOKEN in Firebase environment configuration
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "travelcrm_secure_token_123";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      functions.logger.info("Meta Webhook Verified!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
    return;
  }

  // 2. Event Handling (POST request from Meta)
  if (req.method === "POST") {
    const body = req.body;

    // Checks if this is an event from a page subscription or whatsapp
    if (body.object === "page" || body.object === "instagram" || body.object === "whatsapp_business_account") {
      
      // Iterate over each entry - there may be multiple if batched
      for (const entry of body.entry) {
        
        // --- A. Handle Lead Generation (Facebook/Instagram Ads) ---
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "leadgen") {
              const leadgenId = change.value.leadgen_id;
              const pageId = change.value.page_id;
              const formId = change.value.form_id;
              
              functions.logger.info(`Received Lead from Meta. Leadgen ID: ${leadgenId}, Page ID: ${pageId}`);
              
              try {
                // 1. Get Page Access Token and Tenant ID from Firestore
                const integrationDoc = await db.collection("facebook_integrations").doc(pageId).get();
                
                if (!integrationDoc.exists) {
                  functions.logger.error(`No integration found for Page ID: ${pageId}. Cannot fetch lead details.`);
                  continue;
                }
                
                const integrationData = integrationDoc.data();
                const accessToken = integrationData?.accessToken;
                const tenantId = integrationData?.tenantId || "default_tenant";
                
                if (!accessToken) {
                  functions.logger.error(`No access token found for Page ID: ${pageId}.`);
                  continue;
                }

                // 2. Fetch the actual lead data from Graph API
                const axios = require('axios');
                const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`;
                const response = await axios.get(graphUrl);
                const leadData = response.data;
                
                // Parse the field data (name, email, phone etc.)
                let name = `Meta Lead (ID: ${leadgenId})`;
                let phone = "Pending...";
                let email = "";
                let dest = "TBD";
                
                if (leadData.field_data) {
                  for (const field of leadData.field_data) {
                    if (field.name === "full_name" || field.name === "first_name") name = field.values[0];
                    if (field.name === "phone_number") phone = field.values[0];
                    if (field.name === "email") email = field.values[0];
                    // Example of capturing custom questions like destination
                    if (field.name.toLowerCase().includes("destination")) dest = field.values[0];
                  }
                }
                
                // 3. Save the mapped lead to Firestore
                await db.collection("leads").add({
                  name: name,
                  phone: phone,
                  email: email,
                  dest: dest,
                  date: new Date().toISOString().split('T')[0],
                  budget: "TBD",
                  src: body.object === "instagram" ? "Instagram" : "Facebook",
                  exec: "Unassigned",
                  pri: "High",
                  status: "New",
                  notes: `Auto-generated from Meta webhook. Page: ${integrationData?.pageName || pageId}`,
                  metaLeadgenId: leadgenId,
                  tenantId: tenantId, // Multi-tenant awareness
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                functions.logger.info(`Successfully added Meta lead to Firestore for Tenant: ${tenantId}`);
              } catch (error: any) {
                functions.logger.error("Error processing Meta lead:", error.message || error);
              }
            }
          }
        }
        
        // --- B. Handle WhatsApp / Messenger Messages ---
        if (entry.messaging) {
          for (const messageEvent of entry.messaging) {
            const senderId = messageEvent.sender.id;
            const messageText = messageEvent.message?.text;
            
            functions.logger.info(`Received message from ${senderId}: ${messageText}`);
            
            // Logic to create a lead from a message or log the communication
            // could be implemented here.
          }
        }
      }

      // Return a '200 OK' response to all requests to acknowledge receipt
      res.status(200).send("EVENT_RECEIVED");
    } else {
      // Return a '404 Not Found' if event is not from a supported object
      res.sendStatus(404);
    }
    return;
  }
  
  // Reject non-GET/POST requests
  res.sendStatus(405);
});
