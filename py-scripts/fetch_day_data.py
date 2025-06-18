import tushare as ts
import pandas as pd
import numpy as np
from snownlp import SnowNLP
from supabase import create_client, Client
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置
TUSHARE_TOKEN = os.getenv('TUSHARE_API_TOKEN')
if not TUSHARE_TOKEN:
    raise ValueError("未找到 TUSHARE_API_TOKEN 环境变量。请在 .env 文件中设置您的 token。")

print(f"正在使用 Tushare token: {TUSHARE_TOKEN[:4]}...{TUSHARE_TOKEN[-4:]}")  # 只打印部分 token 用于验证

try:
    pro = ts.pro_api(TUSHARE_TOKEN)
except Exception as e:
    print(f"Tushare API 初始化失败: {str(e)}")
    raise

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. 技术面因子
def get_tech_factors(ts_code, end_date):
    # 拉取近30日K线
    df = pro.daily(ts_code=ts_code, start_date=(datetime.strptime(end_date, "%Y%m%d")-timedelta(days=40)).strftime("%Y%m%d"), end_date=end_date)
    if df.empty or len(df) < 20:
        return None
    df = df.sort_values('trade_date')
    df['ma5'] = df['close'].rolling(window=5).mean()
    df['ma20'] = df['close'].rolling(window=20).mean()
    # 均线金叉
    ma5 = df['ma5'].iloc[-1]
    ma20 = df['ma20'].iloc[-1]
    golden_cross = ma5 > ma20
    # RSI
    delta = df['close'].diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    avg_gain = up.rolling(window=14).mean()
    avg_loss = down.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    rsi_now = rsi.iloc[-1]
    # 换手率
    turnover = df['turnover_rate'].iloc[-1] if 'turnover_rate' in df.columns else None
    return {'golden_cross': golden_cross, 'rsi': rsi_now, 'turnover': turnover}

# 3. 基本面因子
def get_fundamental_factors(ts_code, end_date):
    try:
        fin = pro.fina_indicator(ts_code=ts_code, period=end_date)
        if fin.empty:
            return None
        pe = fin['pe'].values[0]
        pb = fin['pb'].values[0]
        roe = fin['roe'].values[0]
        return {'pe': pe, 'pb': pb, 'roe': roe}
    except:
        return None

# 4. 资金面因子（主力净流入）
def get_moneyflow_factors(ts_code, end_date):
    try:
        mf = pro.moneyflow(ts_code=ts_code, start_date=end_date, end_date=end_date)
        if mf.empty:
            return {'main_net_inflow': 0}
        net = mf['net_mf_amount'].sum()
        return {'main_net_inflow': net}
    except:
        return {'main_net_inflow': 0}

# 5. 龙虎榜
def in_top_list(ts_code, end_date):
    try:
        df = pro.top_list(trade_date=end_date)
        if df.empty:
            return False
        return ts_code in set(df['ts_code'])
    except:
        return False

# 6. 公告情感
def get_ann_sentiment(ts_code, end_date):
    try:
        ann = pro.announcement(ts_code=ts_code, start_date=end_date, end_date=end_date)
        if ann.empty:
            return 0
        ann = ann.dropna(subset=['content'])
        if ann.empty:
            return 0
        sentiments = ann['content'].map(lambda x: SnowNLP(str(x)).sentiments)
        return sentiments.max() if not sentiments.empty else 0
    except:
        return 0

# 7. 板块归属
def get_industry(ts_code):
    try:
        stock = pro.stock_basic(ts_code=ts_code, fields='ts_code,industry')
        return stock['industry'].values[0] if not stock.empty else ''
    except:
        return ''

# 8. HOT板块举例（可自定义）
HOT_INDUSTRIES = ['计算机', '半导体', '新能源', 'AI', '汽车']

# 9. 选股主流程
def select_stocks(trade_date):
    print(f"开始选股 {trade_date}")
    stock_list = pro.stock_basic(exchange='', list_status='L', fields='ts_code,name,industry')
    candidates = []
    for _, row in stock_list.iterrows():
        ts_code = row['ts_code']
        # 技术面
        tech = get_tech_factors(ts_code, trade_date)
        if not tech or not tech['golden_cross']:
            continue
        if tech['rsi'] > 70 or (tech['turnover'] is not None and tech['turnover'] < 1):
            continue
        # 基本面
        fund = get_fundamental_factors(ts_code, trade_date[:4]+'1231')  # 年报日期
        if not fund or fund['pe'] > 20 or fund['roe'] < 10:
            continue
        # 资金面
        money = get_moneyflow_factors(ts_code, trade_date)
        if money['main_net_inflow'] <= 0:
            continue
        # 龙虎榜
        if not in_top_list(ts_code, trade_date):
            continue
        # 公告情感
        sentiment = get_ann_sentiment(ts_code, trade_date)
        if sentiment < 0.8:
            continue
        # 板块
        industry = row['industry']
        if industry not in HOT_INDUSTRIES:
            continue
        # 满足全部因子，打分可综合
        score = 1.0*tech['golden_cross'] + 0.5*(fund['roe']/20) + 0.5*(money['main_net_inflow']/1e6) + 0.5*sentiment
        candidates.append({'ts_code': ts_code, 'score': score, 'industry': industry})

    # 结果排序
    result = sorted(candidates, key=lambda x: x['score'], reverse=True)[:5]
    print('今日优选股票：')
    for rec in result:
        print(rec)
    # 存入Supabase
    for rec in result:
        supabase.table('selected_stocks').upsert({
            'trade_date': trade_date,
            'ts_code': rec['ts_code'],
            'score': rec['score']
        }).execute()
    return result

if __name__ == '__main__':
    # 选用最近一个交易日
    today = datetime.now().strftime('%Y%m%d')
    select_stocks(today)
