export default async function handler(req, res) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;

  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    return res.status(500).json({ error: 'Missing Meta credentials in environment variables' });
  }

  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Fetch today's spend
    const todayUrl = `https://graph.facebook.com/v18.0/${AD_ACCOUNT_ID}/insights?` +
      `access_token=${ACCESS_TOKEN}&` +
      `time_range=${encodeURIComponent(JSON.stringify({
        since: formatDate(today),
        until: formatDate(today)
      }))}&` +
      `fields=spend&level=account`;

    const todayRes = await fetch(todayUrl);
    const todayData = await todayRes.json();

    // Fetch month's spend
    const monthUrl = `https://graph.facebook.com/v18.0/${AD_ACCOUNT_ID}/insights?` +
      `access_token=${ACCESS_TOKEN}&` +
      `time_range=${encodeURIComponent(JSON.stringify({
        since: formatDate(startOfMonth),
        until: formatDate(today)
      }))}&` +
      `fields=spend&level=account`;

    const monthRes = await fetch(monthUrl);
    const monthData = await monthRes.json();

    if (todayData.error || monthData.error) {
      throw new Error(todayData.error?.message || monthData.error?.message || 'Meta API error');
    }

    res.status(200).json({
      today: parseFloat(todayData.data[0]?.spend || 0),
      month: parseFloat(monthData.data[0]?.spend || 0)
    });
  } catch (error) {
    console.error('Meta API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Meta Ads data',
      details: error.message 
    });
  }
}
