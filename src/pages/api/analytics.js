import fs from 'fs';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), 'src', 'data', 'analytics.json');

// Get date range for last 30 days
function getDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
}

const { start: START_DATE, end: END_DATE } = getDateRange();

// Impact API configuration with dynamic date range
const IMPACT_API_URL = `https://IRkzwzAfJuZq6564357xvKZ6f43NJYGxb1:WAy9vV5.GgZqSTiYSmo.TEiQqVbxWtVc@api.impact.com/Mediapartners/IRkzwzAfJuZq6564357xvKZ6f43NJYGxb1/ReportExport/partner_performance_by_day.json?PUB_CAMPAIGN=0&CONV_CURRENCY=USD&START_DATE=${START_DATE}&END_DATE=${END_DATE}&timeRange=CUSTOM&compareEnabled=false`;

// Initialize analytics data if file doesn't exist
if (!fs.existsSync(METRICS_FILE)) {
  const initialData = {
    deals: {},
    impactData: null,
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(METRICS_FILE, JSON.stringify(initialData, null, 2));
}

// Fetch data from Impact API
async function fetchImpactData() {
  try {
    console.log('Fetching Impact API data...');
    const response = await fetch(IMPACT_API_URL);
    console.log('Impact API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Impact API error: ${response.status}`);
    }
    let data = await response.json();
    console.log('Impact API initial response:', data);

    // Handle async response - if QUEUED, fetch from ResultUri
    if (data.Status === 'QUEUED' && data.ResultUri) {
      console.log('Status is QUEUED, fetching from ResultUri:', data.ResultUri);
      const resultUrl = `https://api.impact.com${data.ResultUri}`;
      const resultResponse = await fetch(resultUrl);
      console.log('ResultUri response status:', resultResponse.status);
      
      if (resultResponse.ok) {
        data = await resultResponse.json();
        console.log('Final Impact data:', data);
      } else {
        console.error('Failed to fetch Impact result data');
        return null;
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching Impact data:', error);
    return null;
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { event, deal_id, deal_title, deal_category, deal_price, ...params } = body;

    // Read current analytics data
    let analyticsData = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));

    // Initialize deal data if not exists
    if (!analyticsData.deals[deal_id]) {
      analyticsData.deals[deal_id] = {
        id: deal_id,
        title: deal_title,
        category: deal_category,
        price: deal_price,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    // Update metrics based on event
    if (event === 'deal_impression') {
      analyticsData.deals[deal_id].impressions += 1;
    } else if (event === 'affiliate_click') {
      analyticsData.deals[deal_id].clicks += 1;
    } else if (event === 'conversion') {
      analyticsData.deals[deal_id].conversions += 1;
      analyticsData.deals[deal_id].revenue += deal_price || 0;
    }

    // Calculate CTR
    const deal = analyticsData.deals[deal_id];
    deal.ctr = deal.impressions > 0 ? (deal.clicks / deal.impressions * 100).toFixed(1) : 0;
    deal.lastUpdated = new Date().toISOString();

    analyticsData.lastUpdated = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(METRICS_FILE, JSON.stringify(analyticsData, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET() {
  try {
    // Read current analytics data
    let analyticsData = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));

    // Fetch fresh Impact data
    const impactData = await fetchImpactData();
    if (impactData) {
      analyticsData.impactData = impactData;
    }

    // Save updated data with Impact data
    fs.writeFileSync(METRICS_FILE, JSON.stringify(analyticsData, null, 2));

    // Convert to array format for frontend
    const dealsArray = Object.values(analyticsData.deals).map(deal => ({
      ...deal,
      revenue: parseFloat(deal.revenue.toFixed(2)),
      ctr: parseFloat(deal.ctr)
    }));

    return new Response(JSON.stringify({
      deals: dealsArray,
      impactData: analyticsData.impactData,
      lastUpdated: analyticsData.lastUpdated
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Analytics GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
