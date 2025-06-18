import axios from 'axios';

const TUSHARE_API_URL = 'http://api.tushare.pro';

interface TushareResponse {
  code: number
  msg: string
  data: any
}

// Tushare API客户端
const tushareClient = axios.create({
  baseURL: TUSHARE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 通用API调用函数
export async function callTushareApi(apiName: string, params: Record<string, any> = {}) {
  try {
    const response = await tushareClient.post('', {
      api_name: apiName,
      token: process.env.TUSHARE_API_TOKEN,
      params,
      fields: params.fields || '',
    });

    if (response.data.code !== 0) {
      throw new Error(`Tushare API error: ${response.data.msg}`);
    }

    return {
      data: response.data.data.items,
      fields: response.data.data.fields,
    };
  } catch (error) {
    console.error(`Error calling Tushare API ${apiName}:`, error);
    throw error;
  }
}

// 获取股票基础信息
export async function getStockBasic(params: {
  exchange?: string;
  list_status?: string;
  fields?: string;
}) {
  try {
    const response = await callTushareApi('stock_basic', {
      exchange: params.exchange || '',
      list_status: params.list_status || 'L',
      fields: params.fields || 'ts_code,symbol,name,area,industry,market,exchange,list_date,delist_date,is_hs'
    });

    return response;
  } catch (error) {
    console.error('Tushare API 调用失败:', error);
    throw error;
  }
}
