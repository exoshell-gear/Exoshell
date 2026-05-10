export default async function handler(req, res) {
  const API_KEY = process.env.WHOP_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing Whop API key in environment variables' });
  }

  try {
    const response = await fetch('https://api.whop.com/api/v2/payments?per=100', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Whop API error');
    }

    const payments = data.data || [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let todayRevenue = 0;
    let monthRevenue = 0;
    let recentTransactions = [];

    payments.forEach(payment => {
      const paymentDate = new Date(payment.created_at * 1000);
      const amount = payment.final_amount / 100;
      
      if (paymentDate >= today) {
        todayRevenue += amount;
      }
      
      if (paymentDate >= startOfMonth) {
        monthRevenue += amount;
      }
      
      if (recentTransactions.length < 10) {
        recentTransactions.push({
          name: payment.product?.title || 'Sale',
          detail: payment.user?.username || 'Customer',
          amount: amount
        });
      }
    });

    res.status(200).json({
      today: todayRevenue,
      month: monthRevenue,
      transactions: recentTransactions
    });
  } catch (error) {
    console.error('Whop API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Whop data',
      details: error.message 
    });
  }
}
