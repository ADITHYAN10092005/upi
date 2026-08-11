import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Regex for extracting entities
const PHONE_REGEX = /(\+91|0)?[6-9]\d{9}/g;
// Ideally fetch valid PSPs from `psp_suffixes` table, but using a static list for performance in the edge function
const UPI_REGEX = /[\w.\-]+@(okaxis|ybl|paytm|okhdfcbank|sbi|icici)/g;

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Authenticate with Reddit using env vars
    // const clientId = Deno.env.get('REDDIT_CLIENT_ID');
    // const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');
    // ... oauth logic to get access token ...

    // 2. Fetch recent posts from r/IndiaScams
    // const response = await fetch('https://oauth.reddit.com/r/IndiaScams/new', { ... });
    
    // MOCK DATA for demonstration purposes
    const mockPosts = [
        { text: "Watch out for 9876543210, he asked me to scan a QR code for a refund.", url: "https://reddit.com/r/IndiaScams/comments/mock1" },
        { text: "Scammer upi is fraudster@paytm do not pay him", url: "https://reddit.com/r/IndiaScams/comments/mock2" }
    ];

    // 3. Ensure we have a registered OSINT source in the DB
    let { data: source } = await supabaseClient.from('osint_sources').select('id, status').eq('name', 'Reddit_IndiaScams').single();
    if (!source) {
      const { data: newSource } = await supabaseClient.from('osint_sources').insert({
        name: 'Reddit_IndiaScams',
        type: 'reddit',
        url: 'https://reddit.com/r/IndiaScams',
        status: 'active' // Typically 'pending_review' initially
      }).select().single();
      source = newSource;
    }

    if (source.status !== 'active') {
      return new Response(JSON.stringify({ message: "Source not active, skipping." }), { status: 200 });
    }

    // 4. Process texts
    let signalsCreated = 0;
    for (const post of mockPosts) {
      
      // NLP Similarity Placeholder
      // If we used Transformers.js here, we would generate a vector embedding of `post.text`
      // and do a similarity search against a `scam_scripts` table.
      const scriptMatchId = null; 

      // Extraction
      const phones = post.text.match(PHONE_REGEX) || [];
      const upis = post.text.match(UPI_REGEX) || [];

      // Store Phone Signals
      for (const phone of phones) {
          // Normalize phone (remove +91/0 prefix for consistency)
          const normalized = phone.slice(-10);
          await supabaseClient.from('osint_signals').insert({
              source_id: source.id,
              extracted_value: normalized,
              value_type: 'phone',
              raw_text: post.text,
              source_url: post.url,
              reason: 'Extracted from fraud alert discussion',
              script_match_id: scriptMatchId
          });
          signalsCreated++;
      }
      
      // Store UPI Signals
      for (const upi of upis) {
          await supabaseClient.from('osint_signals').insert({
              source_id: source.id, 
              extracted_value: upi,
              value_type: 'upi_id',
              raw_text: post.text,
              source_url: post.url,
              reason: 'Extracted from fraud alert discussion',
              script_match_id: scriptMatchId
          });
          signalsCreated++;
      }
    }

    // Update last_polled_at
    await supabaseClient.from('osint_sources').update({ last_polled_at: new Date().toISOString() }).eq('id', source.id);

    return new Response(JSON.stringify({ success: true, signalsCreated }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
