export async function POST({ request }) {
  try {
    console.log('=== NEWSLETTER SIGNUP REQUEST ===');
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers));
    console.log('Request URL:', request.url);

    const data = await request.formData();
    console.log('Form data entries:', Array.from(data.entries()));
    
    const email = data.get('email');
    console.log('Extracted email:', email);

    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ConvertKit API setup
    const CONVERTKIT_API_KEY = import.meta.env.CONVERTKIT_API_KEY;
    const CONVERTKIT_FORM_ID = import.meta.env.CONVERTKIT_FORM_ID;

    if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
      console.error('ConvertKit credentials not configured');
      return new Response(JSON.stringify({ error: 'Newsletter service temporarily unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Subscribe to ConvertKit
    console.log('ConvertKit API call:', {
      url: `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      api_key: CONVERTKIT_API_KEY,
      form_id: CONVERTKIT_FORM_ID,
      email: email
    });

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: CONVERTKIT_API_KEY,
          email: email,
          tags: ['website-signup']
        })
      }
    );

    console.log('ConvertKit response status:', response.status);
    console.log('ConvertKit response status text:', response.statusText);
    console.log('ConvertKit response headers:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('ConvertKit response body (raw):', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('ConvertKit response body (parsed):', result);
    } catch (e) {
      console.error('Failed to parse ConvertKit response as JSON:', responseText);
      return new Response(JSON.stringify({ error: 'Invalid response from newsletter service' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log detailed error information
    if (!response.ok) {
      console.error('ConvertKit API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: result
      });
    }

    if (response.ok) {
      console.log('ConvertKit signup success:', email, result);
      return new Response(JSON.stringify({ success: true, message: 'Successfully subscribed!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('ConvertKit error:', result);

      // Handle common errors
      if (result.error?.message?.includes('already subscribed')) {
        return new Response(JSON.stringify({ error: 'This email is already subscribed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Subscription failed. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return new Response(JSON.stringify({ error: 'Server error. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
