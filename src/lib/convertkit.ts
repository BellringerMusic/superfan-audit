interface SubscribeParams {
  email: string;
  firstName: string;
  fields?: Record<string, string>;
}

export async function subscribeToConvertKit(params: SubscribeParams): Promise<boolean> {
  const apiKey = process.env.CONVERTKIT_API_KEY;
  const apiSecret = process.env.CONVERTKIT_API_SECRET;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (!apiKey || !formId) {
    console.error('ConvertKit credentials not configured');
    return false;
  }

  try {
    // Subscribe to form (v3 API)
    const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email: params.email,
        first_name: params.firstName,
        fields: params.fields || {},
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('ConvertKit subscribe failed:', error);
      return false;
    }

    // Tag the subscriber
    const tagId = process.env.CONVERTKIT_TAG_ID;
    if (tagId && apiSecret) {
      await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_secret: apiSecret,
          email: params.email,
        }),
      }).catch(err => console.error('ConvertKit tagging failed:', err));
    }

    return true;
  } catch (error) {
    console.error('ConvertKit error:', error);
    return false;
  }
}
